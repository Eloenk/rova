// ─────────────────────────────────────────────────────────────────────────────
// Rova — Shared Flow Plan Executor
//
// Extracted from app/api/execute/route.ts so the Agent's standing intents
// (Command Hub plans saved to run automatically) execute through the exact
// same path as a manual Send & Swap — no parallel/duplicated execution logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { FlowPlan } from './types';

export async function executeFlowPlanReal(plan: FlowPlan, intentHash: string, walletAddressOverride?: string) {
  const { sendUsdcOnArc, initiateStableFX, appKitBridge, createErc8183Job } = await import('./circle');
  const targetWallet = walletAddressOverride;
  if (!targetWallet) throw new Error('Wallet address is required for flow execution');

  const txHashes: string[] = [];
  let jobId: string | undefined;

  for (const split of plan.splits) {
    if (!split.address || split.amount <= 0) continue;

    console.log(`[Executor] Processing split: ${split.amount} ${split.currency} via ${split.arcProtocol}`);

    if (split.arcProtocol === 'Arc StableFX') {
      const sellCurrency = split.currency === 'EURC' ? 'USDC' : 'EURC';
      const buyCurrency = split.currency === 'EURC' ? 'EURC' : 'USDC';
      const { txHash } = await initiateStableFX({
        walletAddress: targetWallet,
        sellCurrency,
        buyCurrency,
        amount:       split.amount,
      });
      txHashes.push(txHash);
    } else if (split.arcProtocol === 'Circle Gateway' || split.arcProtocol === 'CCTP V2') {
      const { txHash } = await appKitBridge({
        walletAddress: targetWallet,
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
        targetWallet,
        meta.provider,
        meta.evaluator || targetWallet,
        meta.description,
        expiredAt,
      );

      jobId = `J-${intentHash.slice(0, 8)}`;
      txHashes.push(txHash);
    } else {
      const { txHash } = await sendUsdcOnArc(targetWallet, split.address, split.amount);
      txHashes.push(txHash);
    }
  }

  return { txHashes, jobId };
}

/// Single entry point both /api/execute and the Agent's standing-intent runner call.
export async function executeFlowPlan(plan: FlowPlan, intentHash: string, ownerWalletOverride?: string) {
  const { txHashes, jobId } = await executeFlowPlanReal(plan, intentHash, ownerWalletOverride);

  return {
    mode: 'real' as const,
    txHashes,
    jobId,
    status: jobId ? ('JOB_CREATED' as const) : ('COMPLETE' as const),
    executedAt: new Date().toISOString(),
  };
}

