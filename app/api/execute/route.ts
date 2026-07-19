import { NextRequest, NextResponse } from 'next/server';
import type { FlowPlan } from '@/lib/types';

// ── Real execution via Agentic Skills ─────────────────────────────────────────
async function executeReal(plan: FlowPlan, intentHash: string) {
  const { sendUsdcOnArc, initiateStableFX, appKitBridge, createErc8183Job } = await import('@/lib/circle');
  const ownerWallet = process.env.ROVA_OWNER_WALLET;
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
        amount:       split.amount
      });
      txHashes.push(txHash);
    } else if (split.arcProtocol === 'Circle Gateway' || split.arcProtocol === 'CCTP V2') {
      const { txHash } = await appKitBridge({
        walletAddress: ownerWallet,
        fromChain: 'Arc_Testnet',
        toChain:   split.country === 'US' ? 'Ethereum_Sepolia' : 'Base_Sepolia',
        amount:    split.amount
      });
      txHashes.push(txHash);
    } else if (split.arcProtocol === 'ERC-8183 Job') {
      const meta = split.jobMetadata;
      if (!meta) throw new Error('ERC-8183 Job requires metadata');

      // Calculate absolute expiry timestamp
      const now = Math.floor(Date.now() / 1000);
      const expiredAt = now + (meta.expiryDays || 7) * 86400;

      const txHash = await createErc8183Job(
        ownerWallet,
        meta.provider,
        meta.evaluator || ownerWallet, // Default evaluator is the user
        meta.description,
        expiredAt
      );

      // In a real environment, we'd parse the log for the JobId.
      // For this hackathon version, we track the intentHash as a reference or a simulated sequence.
      jobId = `J-${intentHash.slice(0, 8)}`;
      txHashes.push(txHash);
    } else {
      // Default: Arc Native transfer
      const { txHash } = await sendUsdcOnArc(ownerWallet, split.address, split.amount);
      txHashes.push(txHash);
    }
  }

  return { txHashes, jobId };
}

// ── Mock execution (no Circle creds needed) ───────────────────────────────────
function executeMock(plan: FlowPlan, intentHash: string) {
  const txHashes = plan.splits.map((_, i) =>
    '0x' + (i + 1).toString().padStart(2, '0') + 'ff' + 'a'.repeat(60)
  );
  
  const hasJob = plan.splits.some(s => s.arcProtocol === 'ERC-8183 Job');
  const jobId = hasJob ? `MOCK-J-${intentHash.slice(0, 8)}` : undefined;

  console.log('[Executor] MOCK MODE — no real transactions sent');
  return { txHashes, jobId };
}

export async function POST(req: NextRequest) {
  try {
    const { plan, intentHash, walletAddress } = await req.json();

    if (!plan || !intentHash) {
      return NextResponse.json({ ok: false, error: { message: 'Missing plan or intentHash' } }, { status: 400 });
    }

    const isMock =
      process.env.ROVA_MOCK_MODE === 'true' ||
      !process.env.CIRCLE_API_KEY ||
      !process.env.CIRCLE_ENTITY_SECRET ||
      !process.env.ROVA_OWNER_WALLET;

    console.log(`[Executor] Intent: ${intentHash} | Mode: ${isMock ? 'MOCK' : 'REAL'} | Wallet: ${walletAddress || 'agent-managed'}`);

    const { txHashes, jobId } = isMock
      ? executeMock(plan, intentHash)
      : await executeReal(plan, intentHash);

    return NextResponse.json({
      ok: true,
      mode: isMock ? 'mock' : 'real',
      result: {
        txHashes,
        jobId,
        status: jobId ? 'JOB_CREATED' : 'COMPLETE',
        executedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('[Executor] Error:', e);
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : String(e) } },
      { status: 500 }
    );
  }
}
