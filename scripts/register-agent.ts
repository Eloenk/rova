#!/usr/bin/env tsx
// Run: npm run register-agent
import { createPublicClient, http, parseAbiItem } from 'viem';
import { arcTestnet } from 'viem/chains';
import { createAgentWallets, registerAgentIdentity, recordReputation } from '../lib/circle';
import { ARC_TESTNET, ERC8004, arcScan, TOKENS } from '../lib/config';
import { parseAbi } from 'viem';
import { operationalFlag, readOperationalVariable, requireOperationalVariable } from '../tools/runtimeConfig';

const step = (n: number, s: string) => console.log(`\n${'─'.repeat(55)}\n[${n}/4] ${s}\n${'─'.repeat(55)}`);
const ok   = (s: string) => console.log(`  ✓  ${s}`);
const info = (k: string, v: string) => console.log(`  ${k.padEnd(22)} ${v}`);

async function main() {
	if (!operationalFlag('ROVA_ALLOW_AGENT_REGISTRATION')) {
		throw new Error('Agent registration is disabled. Set ROVA_ALLOW_AGENT_REGISTRATION=true only after approval.');
	}
	const expectedConfirmation = 'REGISTER_AGENT:5042002';
	if (readOperationalVariable('ROVA_AGENT_REGISTRATION_CONFIRMATION') !== expectedConfirmation) {
		throw new Error(`Set ROVA_AGENT_REGISTRATION_CONFIRMATION=${expectedConfirmation} to authorize this registration`);
	}
	const metaURI = requireOperationalVariable('ROVA_METADATA_URI');
	if (!/^ipfs:\/\/|^https:\/\//i.test(metaURI)) {
		throw new Error('ROVA_METADATA_URI must use ipfs:// or https://');
	}

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Rova — ERC-8004 Agent Registration         ║');
  console.log('║  Arc Testnet (Chain ID: 5042002)                  ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  step(1, 'Creating Circle Developer Controlled Wallets on Arc');
  const wallets = await createAgentWallets('Rova Capital Engine');
  ok('Two SCA wallets created (owner + validator)');
  info('Owner:',     wallets.ownerAddress);
  info('Validator:', wallets.validatorAddress);

  console.log(`\n  ⚠️  ACTION REQUIRED: Fund THE OWNER WALLET to proceed:`);
  console.log(`     Address: ${wallets.ownerAddress}`);
  console.log(`     Faucet: ${ARC_TESTNET.faucet}`);
  console.log(`\n  Polling for USDC balance… (Awaiting ~10 USDC)`);

  const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_TESTNET.rpc) });
  const usdcAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
  
  let balance = 0n;
  for (let attempt = 0; attempt < 120 && balance === 0n; attempt++) {
    try {
      balance = await client.readContract({
        address: TOKENS.USDC.address as `0x${string}`,
        abi: usdcAbi,
        functionName: 'balanceOf',
        args: [wallets.ownerAddress as `0x${string}`],
      }) as bigint;
      if (balance > 0n) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 5000));
  }
  if (balance === 0n) {
    throw new Error('Funding was not detected within 10 minutes. Keep the displayed wallet addresses and reconcile them before retrying registration.');
  }

  ok('Funds detected. Proceeding to registration…');

  step(2, 'Registering agent identity on ERC-8004 IdentityRegistry');
  const regHash = await registerAgentIdentity(wallets.ownerAddress, metaURI);
  ok('Identity NFT minted on Arc');
  info('Transaction:', arcScan.tx(regHash));

  step(3, 'Retrieving agent token ID');
  const latest = await client.getBlockNumber();
  const from   = latest > BigInt(10000) ? latest - BigInt(10000) : BigInt(0);
  const logs   = await client.getLogs({
    address: ERC8004.IdentityRegistry,
    event:   parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
    args:    { to: wallets.ownerAddress as `0x${string}` },
    fromBlock: from, toBlock: latest,
  });
  if (!logs.length || logs[logs.length - 1].args.tokenId === undefined) {
    throw new Error('Registration transaction completed but no matching identity token was found; reconcile the transaction before retrying.');
  }
  const agentId = logs[logs.length - 1].args.tokenId!.toString();
  ok(`Agent ID: #${agentId}`);
  info('NFT explorer:', arcScan.nft(agentId));

  step(4, 'Recording initial reputation (via validator wallet)');
  const repHash = await recordReputation(wallets.validatorAddress, agentId, 75, 'agent_registered');
  ok('Reputation recorded on Arc');
  info('Transaction:', arcScan.tx(repHash));

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  ✅  Done — Record these deployment values        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`NEXT_PUBLIC_ROVA_AGENT_ID=${agentId}`);
  console.log(`ROVA_OWNER_WALLET=${wallets.ownerAddress}`);
  console.log(`ROVA_VALIDATOR_WALLET=${wallets.validatorAddress}`);
  console.log(`\nView your agent:\n  ${arcScan.nft(agentId)}\n`);
}

main().catch(e => { console.error('\n❌ Failed:', e.message); process.exit(1); });
