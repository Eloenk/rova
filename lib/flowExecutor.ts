// ─────────────────────────────────────────────────────────────────────────────
// Rova — Shared Flow Plan Executor
//
// Manual managed-wallet execution for the explicitly supported release scope.
// ─────────────────────────────────────────────────────────────────────────────

import type { FlowPlan } from './types';

export async function executeFlowPlanReal(plan: FlowPlan, walletAddressOverride?: string) {
  const { sendUsdcOnArc, initiateStableFX } = await import('./circle');
  const targetWallet = walletAddressOverride;
  if (!targetWallet) throw new Error('Wallet address is required for flow execution');

  const txHashes: string[] = [];
  for (const split of plan.splits) {
    if (!split.address || split.amount <= 0) continue;

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
    } else if (split.arcProtocol === 'Arc Native') {
      const { resolveRecipient } = await import('./emailWallets');
      const { address: targetAddress } = await resolveRecipient(split.address);
      const { txHash } = await sendUsdcOnArc(targetWallet, targetAddress, split.amount);
      txHashes.push(txHash);
    } else {
      throw new Error(`Unsupported execution protocol: ${split.arcProtocol}`);
    }
  }

  return { txHashes };
}

/// Single entry point both /api/execute and the Agent's standing-intent runner call.
export async function executeFlowPlan(plan: FlowPlan, ownerWalletOverride?: string) {
  const { txHashes } = await executeFlowPlanReal(plan, ownerWalletOverride);

  return {
    mode: 'real' as const,
    txHashes,
    status: 'COMPLETE' as const,
    executedAt: new Date().toISOString(),
  };
}

