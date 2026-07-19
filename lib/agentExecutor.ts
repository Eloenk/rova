// ─────────────────────────────────────────────────────────────────────────────
// Rova — Autonomous Agent Executor
//
// Fires when a watched rule's trigger condition is met. Mirrors the same
// MOCK/REAL branching used in app/api/execute/route.ts, and reuses the exact
// same Circle SDK primitives from lib/circle.ts — no parallel execution path,
// just a different trigger source (a rate condition instead of a chat intent).
//
// On top of the transfer itself, this is where the "agent" part of Agentic
// Commerce shows up: the agent charges itself a small execution fee through
// an ERC-8183 job (create → fund → complete, all in one tick) and writes an
// ERC-8004 reputation entry recording that it executed autonomously. Both use
// the standards Rova already has wired up for the manual flow builder.
// ─────────────────────────────────────────────────────────────────────────────

import { arcScan } from './config';
import type { AgentRule } from './agentStore';

const AGENT_FEE_USDC = 0.05; // what the agent charges itself for an autonomous execution

function isMockMode(): boolean {
  return (
    process.env.ROVA_MOCK_MODE === 'true' ||
    !process.env.CIRCLE_API_KEY ||
    !process.env.CIRCLE_ENTITY_SECRET ||
    !process.env.ROVA_OWNER_WALLET
  );
}

function fakeHash(seed: string): string {
  const h = seed.padEnd(64, '0').slice(0, 64);
  return '0x' + h.replace(/[^a-f0-9]/gi, 'a');
}

export interface FireResult {
  txHash: string;
  arcScanUrl: string;
  mode: 'mock' | 'real';
  feeJobId?: string;
  reputationTxHash?: string;
}

export async function fireRule(rule: AgentRule, rateAtExecution: number, memo: string): Promise<FireResult> {
  const mock = isMockMode();

  if (mock) {
    const txHash = fakeHash(`agent-${rule.id}-${Date.now()}`);
    const feeJobId = `MOCK-FEE-${rule.id.slice(0, 8)}`;
    const reputationTxHash = fakeHash(`rep-${rule.id}-${Date.now()}`);
    console.log(`[Agent] MOCK fire rule=${rule.id} rate=${rateAtExecution} memo="${memo}"`);
    return { txHash, arcScanUrl: arcScan.tx(txHash), mode: 'mock', feeJobId, reputationTxHash };
  }

  const {
    sendUsdcOnArc,
    initiateStableFX,
    createErc8183Job,
    getErc8183JobId,
    setErc8183Budget,
    approveErc8183USDC,
    fundErc8183Job,
    completeErc8183Job,
    recordReputation,
  } = await import('./circle');

  const ownerWallet = process.env.ROVA_OWNER_WALLET!;
  const destCurrency = rule.pair === 'USDC/EURC' ? 'EURC' : 'USDC';

  // 1. Swap leg (StableFX), if the pair requires currency conversion
  if (destCurrency === 'EURC') {
    await initiateStableFX({
      walletAddress: ownerWallet,
      sellCurrency: 'USDC',
      buyCurrency: 'EURC',
      amount: rule.amount,
    });
  }

  // 2. Settlement leg — send to the recipient on Arc
  const { txHash, arcScanUrl } = await sendUsdcOnArc(ownerWallet, rule.recipientAddress, rule.amount);

  // 3. Agent's own execution fee via ERC-8183 (create -> approve -> fund -> complete)
  let feeJobId: string | undefined;
  try {
    const validatorWallet = process.env.ROVA_VALIDATOR_WALLET || ownerWallet;
    const now = Math.floor(Date.now() / 1000);
    const jobTxHash = await createErc8183Job(
      ownerWallet,
      ownerWallet, // agent acts as its own provider wallet in this simplified model
      validatorWallet,
      `Autonomous execution fee — ${memo}`,
      now + 3600,
    );
    const resolvedJobId = await getErc8183JobId(jobTxHash);
    await approveErc8183USDC(ownerWallet, AGENT_FEE_USDC);
    await setErc8183Budget(ownerWallet, resolvedJobId, AGENT_FEE_USDC);
    await fundErc8183Job(ownerWallet, resolvedJobId);
    await completeErc8183Job(validatorWallet, resolvedJobId, jobTxHash);
    feeJobId = resolvedJobId;
  } catch (e) {
    console.warn('[Agent] Fee job failed (non-fatal):', e);
  }

  // 4. Reputation entry — builds the agent's onchain track record for autonomous runs
  let reputationTxHash: string | undefined;
  try {
    const validatorWallet = process.env.ROVA_VALIDATOR_WALLET || ownerWallet;
    const agentId = process.env.NEXT_PUBLIC_ROVA_AGENT_ID || '1683';
    reputationTxHash = await recordReputation(validatorWallet, agentId, 100, `autonomous:${rule.id}`);
  } catch (e) {
    console.warn('[Agent] Reputation recording failed (non-fatal):', e);
  }

  // 5. Write the permanent onchain record to Rova's own execution log contract.
  //    This is what actually backs the "Arc Transaction Memo" — a real,
  //    publicly verifiable reason attached to why this transfer happened.
  try {
    const { logExecutionOnchain } = await import('./circle');
    await logExecutionOnchain({
      executorAddress: ownerWallet,
      ruleId: rule.id,
      recipient: rule.recipientAddress,
      amountUsdc: rule.amount,
      rateAtExecution,
      memo,
    });
  } catch (e) {
    console.warn('[Agent] Onchain execution log failed (non-fatal):', e);
  }

  return { txHash, arcScanUrl, mode: 'real', feeJobId, reputationTxHash };
}
