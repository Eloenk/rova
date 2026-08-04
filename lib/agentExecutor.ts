// ─────────────────────────────────────────────────────────────────────────────
// Rova — Autonomous Agent Executor
//
// Fires when a watched rule's trigger condition is met. Mirrors the same
// MOCK/REAL branching used elsewhere, and reuses the exact same Circle SDK
// primitives from lib/circle.ts — no parallel execution path.
//
// Before moving money, the agent shops: it pays three independent quote
// providers a fraction of a cent each (real x402/Nanopayments in real mode,
// protocol-faithful mock otherwise — see lib/nanopay.ts) and executes at
// whichever quoted best. On top of the transfer, every autonomous fire also
// charges the agent's own ERC-8183 execution fee, writes an ERC-8004
// reputation entry, and logs a permanent record to Rova's own
// RovaExecutionLog contract.
// ─────────────────────────────────────────────────────────────────────────────

import { arcScan } from './config';
import type { AgentRule, QuoteShopResult } from './agentStore';
import { resolveRecipient } from './emailWallets';
import { shopRates, pickBest } from './nanopay';

const AGENT_FEE_USDC = 0.05;

export interface FireResult {
  txHash: string;
  arcScanUrl: string;
  mode: 'real';
  feeJobId?: string;
  reputationTxHash?: string;
  quoteShop: QuoteShopResult;
  resolvedRecipient: string;
}

/// Runs the nanopayment rate-shopping round: pays 3 providers a fraction of a
/// cent each for their current quote, picks the best. wantHighRate = true for
/// USDC->EURC style pairs where a higher number is a better deal for the sender.
export async function shopForBestRate(pair: AgentRule['pair'], baseUrl: string): Promise<QuoteShopResult> {
  const wantHighRate = pair === 'USDC/EURC';
  const quotes = await shopRates(pair, baseUrl);
  const best = pickBest(quotes, wantHighRate);

  return {
    providersChecked: quotes.length,
    bestProvider: best.provider,
    bestRate: best.rate,
    totalPaidUsdc: quotes.reduce((sum, q) => sum + q.paidUsdc, 0),
    quotes: quotes.map(q => ({ provider: q.provider, rate: q.rate, paidUsdc: q.paidUsdc })),
  };
}

export interface ConfirmResult {
  feeJobId?: string;
  reputationTxHash?: string;
}

/// Called after a self-custody rule's transfer has already been signed and
/// sent by the user's own wallet (client-side, via their connected wallet —
/// Circle never touches that key). The Agent still does the parts that
/// belong to it: charging its own small execution fee via ERC-8183, writing
/// the ERC-8004 reputation entry, and logging the permanent onchain record —
/// all attested by Rova's own managed validator wallet, not the user's.
export async function confirmSelfCustodyExecution(opts: {
  ruleOrIntentId: string;
  recipient: string;
  amountUsdc: number;
  rateAtExecution?: number;
  memo: string;
}): Promise<ConfirmResult> {
  const {
    createErc8183Job, setErc8183Budget, approveErc8183USDC, fundErc8183Job, completeErc8183Job,
    recordReputation, logExecutionOnchain,
  } = await import('./circle');

  const attestor = process.env.ROVA_VALIDATOR_WALLET || process.env.ROVA_OWNER_WALLET!;

  let feeJobId: string | undefined;
  try {
    const now = Math.floor(Date.now() / 1000);
    const jobTxHash = await createErc8183Job(attestor, attestor, attestor, `Autonomous (self-custody) execution fee — ${opts.memo}`, now + 3600);
    await approveErc8183USDC(attestor, AGENT_FEE_USDC);
    await setErc8183Budget(attestor, jobTxHash, AGENT_FEE_USDC);
    await fundErc8183Job(attestor, jobTxHash);
    await completeErc8183Job(attestor, jobTxHash, jobTxHash);
    feeJobId = jobTxHash;
  } catch (e) {
    console.warn('[Agent] Self-custody fee job failed (non-fatal):', e);
  }

  let reputationTxHash: string | undefined;
  try {
    const agentId = process.env.NEXT_PUBLIC_ROVA_AGENT_ID || '1683';
    reputationTxHash = await recordReputation(attestor, agentId, 100, `autonomous-self-custody:${opts.ruleOrIntentId}`);
  } catch (e) {
    console.warn('[Agent] Self-custody reputation recording failed (non-fatal):', e);
  }

  try {
    await logExecutionOnchain({
      executorAddress: attestor,
      ruleId: opts.ruleOrIntentId,
      recipient: opts.recipient,
      amountUsdc: opts.amountUsdc,
      rateAtExecution: opts.rateAtExecution ?? 1,
      memo: opts.memo,
    });
  } catch (e) {
    console.warn('[Agent] Self-custody onchain log failed (non-fatal):', e);
  }

  return { feeJobId, reputationTxHash };
}

export async function fireRule(rule: AgentRule, baseUrl: string, memoPrefix: string): Promise<FireResult> {
  // 1. Shop for the best rate before spending anything real.
  const quoteShop = await shopForBestRate(rule.pair, baseUrl);
  const rate = quoteShop.bestRate;
  const memo = `${memoPrefix} · best of ${quoteShop.providersChecked} quotes (${quoteShop.bestProvider} @ ${rate})`;

  // 2. Resolve the recipient — email gets a Circle-managed wallet (created on
  //    first use), a raw address passes through unchanged.
  const { address: recipientAddress } = await resolveRecipient(rule.recipientIdentifier);

  const {
    sendUsdcOnArc,
    initiateStableFX,
    createErc8183Job,
    setErc8183Budget,
    approveErc8183USDC,
    fundErc8183Job,
    completeErc8183Job,
    recordReputation,
    logExecutionOnchain,
  } = await import('./circle');

  const sourceWallet = rule.sourceWallet || process.env.ROVA_OWNER_WALLET!;
  const destCurrency = rule.pair === 'USDC/EURC' ? 'EURC' : 'USDC';

  if (destCurrency === 'EURC') {
    await initiateStableFX({ walletAddress: sourceWallet, sellCurrency: 'USDC', buyCurrency: 'EURC', amount: rule.amount });
  }

  const { txHash, arcScanUrl } = await sendUsdcOnArc(sourceWallet, recipientAddress, rule.amount);

  let feeJobId: string | undefined;
  try {
    const validatorWallet = process.env.ROVA_VALIDATOR_WALLET || sourceWallet;
    const now = Math.floor(Date.now() / 1000);
    const jobTxHash = await createErc8183Job(sourceWallet, sourceWallet, validatorWallet, `Autonomous execution fee — ${memo}`, now + 3600);
    await approveErc8183USDC(sourceWallet, AGENT_FEE_USDC);
    await setErc8183Budget(sourceWallet, jobTxHash, AGENT_FEE_USDC);
    await fundErc8183Job(sourceWallet, jobTxHash);
    await completeErc8183Job(validatorWallet, jobTxHash, jobTxHash);
    feeJobId = jobTxHash;
  } catch (e) {
    console.warn('[Agent] Fee job failed (non-fatal):', e);
  }

  let reputationTxHash: string | undefined;
  try {
    const validatorWallet = process.env.ROVA_VALIDATOR_WALLET || sourceWallet;
    const agentId = process.env.NEXT_PUBLIC_ROVA_AGENT_ID || '1683';
    reputationTxHash = await recordReputation(validatorWallet, agentId, 100, `autonomous:${rule.id}`);
  } catch (e) {
    console.warn('[Agent] Reputation recording failed (non-fatal):', e);
  }

  try {
    await logExecutionOnchain({ executorAddress: sourceWallet, ruleId: rule.id, recipient: recipientAddress, amountUsdc: rule.amount, rateAtExecution: rate, memo });
  } catch (e) {
    console.warn('[Agent] Onchain execution log failed (non-fatal):', e);
  }

  return {
    txHash,
    arcScanUrl,
    mode: 'real',
    feeJobId,
    reputationTxHash,
    quoteShop,
    resolvedRecipient: recipientAddress,
  };
}
