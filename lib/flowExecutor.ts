// ─────────────────────────────────────────────────────────────────────────────
// Rova — Shared Flow Plan Executor
//
// Extracted from app/api/execute/route.ts so the Agent's standing intents
// (Command Hub plans saved to run automatically) execute through the exact
// same path as a manual Send & Swap — no parallel/duplicated execution logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { FlowPlan } from './types';
import { getIsMockMode } from './ai-provider';

export async function executeFlowPlanReal(plan: FlowPlan, intentHash: string, ownerWalletOverride?: string) {
  const { sendUsdcOnArc, initiateStableFX, appKitBridge, createErc8183Job } = await import('./circle');
  const ownerWallet = ownerWalletOverride || process.env.ROVA_OWNER_WALLET;
  if (!ownerWallet) throw new Error('ROVA_OWNER_WALLET not configured');

  const txHashes: string[] = [];
  let jobId: string | undefined;

  for (const split of plan.splits) {
    if (!split.address || split.amount <= 0) continue;

    console.log(`[Executor] Processing split: ${split.amount} ${split.currency} via ${split.arcProtocol}`);

    if (split.arcProtocol === 'Arc StableFX') {
      const { txHash } = await initiateStableFX({
        walletAddress: ownerWallet,
        sellCurrency: 'USDC',
        buyCurrency:  split.currency as 'EURC',
        amount:       split.amount,
      });
      txHashes.push(txHash);
    } else if (split.arcProtocol === 'Circle Gateway' || split.arcProtocol === 'CCTP V2') {
      const { txHash } = await appKitBridge({
        walletAddress: ownerWallet,
        fromChain: 'Arc_Testnet',
        toChain:   split.country === 'US' ? 'Ethereum_Sepolia' : 'Base_Sepolia',
        amount:    split.amount,
      });
      txHashes.push(txHash);
    } else if (split.arcProtocol === 'ERC-8183 Job') {
      const meta = split.jobMetadata;
      if (!meta) throw new Error('ERC-8183 Job requires metadata');

      const now = Math.floor(Date.now() / 1000);
      const expiredAt = now + (meta.expiryDays || 7) * 86400;

      const txHash = await createErc8183Job(
        ownerWallet,
        meta.provider,
        meta.evaluator || ownerWallet,
        meta.description,
        expiredAt,
      );

      jobId = `J-${intentHash.slice(0, 8)}`;
      txHashes.push(txHash);
    } else {
      const { txHash } = await sendUsdcOnArc(ownerWallet, split.address, split.amount);
      txHashes.push(txHash);
    }
  }

  return { txHashes, jobId };
}

export function executeFlowPlanMock(plan: FlowPlan, intentHash: string) {
  const txHashes = plan.splits.map((_, i) =>
    '0x' + (i + 1).toString().padStart(2, '0') + 'ff' + 'a'.repeat(60)
  );

  const hasJob = plan.splits.some(s => s.arcProtocol === 'ERC-8183 Job');
  const jobId = hasJob ? `MOCK-J-${intentHash.slice(0, 8)}` : undefined;

  console.log('[Executor] MOCK MODE — no real transactions sent');
  return { txHashes, jobId };
}

export function isMockMode(): boolean {
  if (getIsMockMode()) return true;
  return false;
}

/// Single entry point both /api/execute and the Agent's standing-intent runner call.
export async function executeFlowPlan(plan: FlowPlan, intentHash: string, ownerWalletOverride?: string) {
  const mock = isMockMode();
  const { txHashes, jobId } = mock
    ? executeFlowPlanMock(plan, intentHash)
    : await executeFlowPlanReal(plan, intentHash, ownerWalletOverride);

  return {
    mode: mock ? ('mock' as const) : ('real' as const),
    txHashes,
    jobId,
    status: jobId ? 'JOB_CREATED' as const : 'COMPLETE' as const,
    executedAt: new Date().toISOString(),
  };
}
