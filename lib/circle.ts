// ─────────────────────────────────────────────────────────────────────────────
// Rova — Circle SDK Client
//
// Uses @circle-fin/developer-controlled-wallets v10.x
// Pattern from Circle Skills: use-developer-controlled-wallets
//
// Developer-Controlled Wallets (DCW):
//   - Server-side wallets where YOU hold the keys (via Circle's HSM)
//   - Best for: payouts, treasury, automation, agent operations
//   - Keys never leave Circle's HSM — no private key management needed
//
// Docs: https://developers.circle.com/wallets/dev-controlled.md
// ─────────────────────────────────────────────────────────────────────────────

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { ARC_TESTNET, TOKENS, ERC8004, ERC8183, ROVA_EXECUTION_LOG, GAS, arcScan } from './config';

// ── Lazy singleton ─────────────────────────────────────────────────────────────

let _client: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;

export function getCircleClient() {
  if (_client) return _client;

  const apiKey       = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    throw new Error(
      'CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required.\n' +
      'Get them free at: https://console.circle.com\n' +
      'Or set ROVA_MOCK_MODE=true to skip real transactions.'
    );
  }

  _client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
  return _client;
}

// ── Wallet creation ─────────────────────────────────────────────────────────────
// Per Circle Skills (use-developer-controlled-wallets):
// - Use SCA (Smart Contract Account) for agents — supports gasless ops
// - Create owner + validator wallets (ERC-8004 requires separate wallets)

export async function createAgentWallets(name: string) {
  const client = getCircleClient();

  const setResp = await client.createWalletSet({ name: `Rova — ${name}` });
  const walletSetId = setResp.data?.walletSet?.id;
  if (!walletSetId) throw new Error('Failed to create Circle wallet set');

  const walletsResp = await client.createWallets({
    blockchains: [ARC_TESTNET.circleBlockchain],
    count:        2,
    walletSetId,
    accountType: 'SCA', // Smart Contract Account — recommended for agent use
  });

  const wallets = walletsResp.data?.wallets;
  if (!wallets || wallets.length < 2) throw new Error('Failed to create agent wallets');

  return {
    ownerAddress:      wallets[0].address!,
    ownerWalletId:     wallets[0].id!,
    validatorAddress:  wallets[1].address!,
    validatorWalletId: wallets[1].id!,
    walletSetId,
  };
}

// ── Single wallet creation (email onboarding) ──────────────────────────────────
// Simpler than createAgentWallets — one SCA wallet, no ERC-8004 owner/validator
// pair, for recipients/users who onboard by email rather than connecting their
// own wallet. Circle holds the key server-side (HSM); the user never sees a
// seed phrase.

export async function createSingleWallet(label: string) {
  const client = getCircleClient();

  const setResp = await client.createWalletSet({ name: `Rova — ${label}` });
  const walletSetId = setResp.data?.walletSet?.id;
  if (!walletSetId) throw new Error('Failed to create Circle wallet set');

  const walletsResp = await client.createWallets({
    blockchains: [ARC_TESTNET.circleBlockchain],
    count: 1,
    walletSetId,
    accountType: 'SCA',
  });

  const wallet = walletsResp.data?.wallets?.[0];
  if (!wallet?.address || !wallet?.id) throw new Error('Failed to create wallet');

  return { address: wallet.address, walletId: wallet.id, walletSetId };
}

// ── Execute and confirm ────────────────────────────────────────────────────────
// Polls until confirmed. Arc finality is sub-second so this is fast.

export async function executeAndConfirm(opts: {
  walletAddress:        string;
  contractAddress:      string;
  abiFunctionSignature: string;
  abiParameters:        (string | number)[];
}): Promise<string> {
  const client = getCircleClient();

  const txResp = await client.createContractExecutionTransaction({
    walletAddress:        opts.walletAddress,
    blockchain:           ARC_TESTNET.circleBlockchain,
    contractAddress:      opts.contractAddress,
    abiFunctionSignature: opts.abiFunctionSignature,
    abiParameters:        opts.abiParameters,
    fee: { type: 'level', config: { feeLevel: GAS.feeLevel } },
  });

  const txId = txResp.data?.id;
  if (!txId) throw new Error('No transaction ID returned from Circle');

  // Poll up to 30s (Arc is sub-second, but Circle API processing adds overhead)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const { data } = await client.getTransaction({ id: txId });
    const state = data?.transaction?.state;
    if (state === 'COMPLETE') return data!.transaction!.txHash!;
    if (state === 'FAILED')   throw new Error(`Transaction failed on Arc`);
  }

  throw new Error('Transaction timed out after 30s');
}

// ── ERC-8004 agent registration ────────────────────────────────────────────────

export async function registerAgentIdentity(ownerAddress: string, metadataURI: string) {
  return executeAndConfirm({
    walletAddress:        ownerAddress,
    contractAddress:      ERC8004.IdentityRegistry,
    abiFunctionSignature: 'register(string)',
    abiParameters:        [metadataURI],
  });
}

// ── ERC-8004 reputation recording ─────────────────────────────────────────────
// MUST use validator wallet — ERC-8004 forbids self-reputation

export async function recordReputation(
  validatorAddress: string,
  agentId:          string,
  score:            number,
  tag:              string,
) {
  const { keccak256, toHex } = await import('viem');
  const feedbackHash = keccak256(toHex(tag));

  return executeAndConfirm({
    walletAddress:        validatorAddress,
    contractAddress:      ERC8004.ReputationRegistry,
    abiFunctionSignature: 'giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)',
    abiParameters:        [agentId, String(score), '0', tag, '', '', '', feedbackHash],
  });
}

// ── ERC-8004 Validation ────────────────────────────────────────────────────────

export async function requestValidation(
  ownerAddress: string,
  validatorAddress: string,
  agentId: string,
  requestURI: string,
) {
  const { keccak256, toHex } = await import('viem');
  const requestHash = keccak256(toHex(`validation_request_${agentId}_${Date.now()}`));

  return executeAndConfirm({
    walletAddress:        ownerAddress,
    contractAddress:      ERC8004.ValidationRegistry,
    abiFunctionSignature: 'validationRequest(address,uint256,string,bytes32)',
    abiParameters:        [validatorAddress, agentId, requestURI, requestHash],
  });
}

export async function respondValidation(
  validatorAddress: string,
  requestHash: string,
  response: number, // 100 = passed, 0 = failed
  tag: string,
) {
  return executeAndConfirm({
    walletAddress:        validatorAddress,
    contractAddress:      ERC8004.ValidationRegistry,
    abiFunctionSignature: 'validationResponse(bytes32,uint8,string,bytes32,string)',
    abiParameters:        [requestHash, response, '', '0x' + '0'.repeat(64), tag],
  });
}

// ── Rova Execution Log ─────────────────────────────────────────────────────────
// Writes to Rova's own contract (contracts/RovaExecutionLog.sol) — the one
// piece of onchain state that's actually Rova-authored rather than shared
// Circle/Arc infra. Called by the Agent on every autonomous fire so the
// "Arc Transaction Memo" claim is a real onchain record, not just a log line.

export async function logExecutionOnchain(opts: {
  executorAddress: string;
  ruleId:          string;
  recipient:       string;
  amountUsdc:      number;
  rateAtExecution: number;
  memo:            string;
}) {
  if (!ROVA_EXECUTION_LOG.address) {
    throw new Error('NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS not set — deploy contracts/RovaExecutionLog.sol first (see DEPLOY_CONTRACT.md)');
  }

  const { keccak256, toHex } = await import('viem');
  const ruleIdHash = keccak256(toHex(opts.ruleId));
  const amountUsdc6 = Math.round(opts.amountUsdc * 1_000_000);
  const rate1e6      = Math.round(opts.rateAtExecution * 1_000_000);

  return executeAndConfirm({
    walletAddress:        opts.executorAddress,
    contractAddress:      ROVA_EXECUTION_LOG.address,
    abiFunctionSignature: ROVA_EXECUTION_LOG.abiFunctionSignature,
    abiParameters:        [ruleIdHash, opts.recipient, String(amountUsdc6), String(rate1e6), opts.memo],
  });
}

// ── Balance Checks ─────────────────────────────────────────────────────────────

export async function getAgentBalance(walletAddress: string, token: keyof typeof TOKENS) {
  const { createPublicClient, http, parseAbi } = await import('viem');
  const { arcTestnet } = await import('./arcChain');
  
  const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_TESTNET.rpc) });
  const abi = parseAbi(['function balanceOf(address) view returns (uint256)']);
  
  const balance = await client.readContract({
    address: TOKENS[token].address as `0x${string}`,
    abi,
    functionName: 'balanceOf',
    args: [walletAddress as `0x${string}`],
  }) as bigint;

  return Number(balance) / (10 ** TOKENS[token].decimals);
}

// ── App Kit Skills (Omnichain Operations) ───────────────────────────────────────

export async function appKitBridge(opts: {
  walletAddress: string;
  fromChain: string;
  toChain: string;
  amount: number;
}) {
  console.log(`[AppKit] Bridging ${opts.amount} USDC from ${opts.fromChain} to ${opts.toChain}`);
  // In a real implementation on Arc, this would use Bridge Kit V2.
  // For the demo, we simulate the cross-chain settlement.
  return { txHash: '0x' + 'b'.repeat(64), success: true };
}

export async function initiateStableFX(opts: {
  walletAddress: string;
  sellCurrency: 'USDC' | 'EURC';
  buyCurrency:  'USDC' | 'EURC';
  amount:       number;
}) {
  console.log(`[StableFX] Executing atomic swap: ${opts.amount} ${opts.sellCurrency} for ${opts.buyCurrency}`);
  // StableFX on Arc is an RFQ + atomic settlement.
  // We simulate the settlement tx on Arc Testnet.
  return { txHash: '0x' + 'f'.repeat(64), success: true };
}

// ── USDC transfer on Arc ────────────────────────────────────────────────────────
// Uses ERC-20 interface (6 decimals) per Circle Skills (use-usdc)

export async function sendUsdcOnArc(
  fromWalletAddress: string,
  toAddress:         string,
  amountUsdc:        number,
): Promise<{ txHash: string; arcScanUrl: string }> {
  const client = getCircleClient();

  // Convert to 6-decimal integer (ERC-20 interface on Arc)
  const amountInt = Math.round(amountUsdc * 10 ** TOKENS.USDC.decimals);

  const txResp = await client.createContractExecutionTransaction({
    walletAddress:        fromWalletAddress,
    blockchain:           ARC_TESTNET.circleBlockchain,
    contractAddress:      TOKENS.USDC.address,
    abiFunctionSignature: 'transfer(address,uint256)',
    abiParameters:        [toAddress, String(amountInt)],
    fee: { type: 'level', config: { feeLevel: GAS.feeLevel } },
  });

  const txId = txResp.data?.id;
  if (!txId) throw new Error('No transaction ID');

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const { data } = await client.getTransaction({ id: txId });
    if (data?.transaction?.state === 'COMPLETE') {
      const txHash = data.transaction.txHash!;
      return { txHash, arcScanUrl: arcScan.tx(txHash) };
    }
    if (data?.transaction?.state === 'FAILED') throw new Error('Transfer failed on Arc');
  }

  throw new Error('Transfer timed out');
}

// ── ERC-8183 Agentic Work Flow ─────────────────────────────────────────────────

export async function createErc8183Job(
  clientWalletAddress: string,
  providerAddress:     string,
  evaluatorAddress:    string,
  description:         string,
  expiredAt:           number
) {
  return executeAndConfirm({
    walletAddress:        clientWalletAddress,
    contractAddress:      ERC8183.address,
    abiFunctionSignature: 'createJob(address,address,uint256,string,address)',
    abiParameters:        [providerAddress, evaluatorAddress, String(expiredAt), description, '0x0000000000000000000000000000000000000000'],
  });
}

export async function setErc8183Budget(
  providerWalletAddress: string,
  jobId:                 string,
  amountUsdc:            number
) {
  const amountInt = Math.round(amountUsdc * 10 ** TOKENS.USDC.decimals);
  return executeAndConfirm({
    walletAddress:        providerWalletAddress,
    contractAddress:      ERC8183.address,
    abiFunctionSignature: 'setBudget(uint256,uint256,bytes)',
    abiParameters:        [jobId, String(amountInt), '0x'],
  });
}

export async function approveErc8183USDC(
  clientWalletAddress: string,
  amountUsdc:          number
) {
  const amountInt = Math.round(amountUsdc * 10 ** TOKENS.USDC.decimals);
  return executeAndConfirm({
    walletAddress:        clientWalletAddress,
    contractAddress:      TOKENS.USDC.address,
    abiFunctionSignature: 'approve(address,uint256)',
    abiParameters:        [ERC8183.address, String(amountInt)],
  });
}

export async function fundErc8183Job(
  clientWalletAddress: string,
  jobId:               string
) {
  return executeAndConfirm({
    walletAddress:        clientWalletAddress,
    contractAddress:      ERC8183.address,
    abiFunctionSignature: 'fund(uint256,bytes)',
    abiParameters:        [jobId, '0x'],
  });
}

export async function submitErc8183Deliverable(
  providerWalletAddress: string,
  jobId:                 string,
  deliverableHash:       string
) {
  return executeAndConfirm({
    walletAddress:        providerWalletAddress,
    contractAddress:      ERC8183.address,
    abiFunctionSignature: 'submit(uint256,bytes32,bytes)',
    abiParameters:        [jobId, deliverableHash, '0x'],
  });
}

export async function completeErc8183Job(
  evaluatorWalletAddress: string,
  jobId:                  string,
  reasonHash:             string
) {
  return executeAndConfirm({
    walletAddress:        evaluatorWalletAddress,
    contractAddress:      ERC8183.address,
    abiFunctionSignature: 'complete(uint256,bytes32,bytes)',
    abiParameters:        [jobId, reasonHash, '0x'],
  });
}
