import { NextRequest, NextResponse } from 'next/server';
import { executeFlowPlan } from '@/lib/flowExecutor';

export async function POST(req: NextRequest) {
  try {
    const { plan, intentHash, walletAddress } = await req.json();

    if (!plan || !intentHash) {
      return NextResponse.json({ ok: false, error: { message: 'Missing plan or intentHash' } }, { status: 400 });
    }

    console.log(`[Executor] Intent: ${intentHash} | Wallet: ${walletAddress || 'agent-managed'}`);

    const result = await executeFlowPlan(plan, intentHash, walletAddress);

    return NextResponse.json({ ok: true, mode: result.mode, result });
  } catch (e) {
    console.error('[Executor] Error:', e);
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : String(e) } },
      { status: 500 }
    );
  }
}
