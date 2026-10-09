import { NextRequest, NextResponse } from 'next/server';
import { executeFlowPlan } from '@/lib/flowExecutor';
import { requireMutationSession } from '@/lib/auth';
import { validateFlowPlan } from '@/lib/validator';
import { assertPermittedPlan } from '@/lib/policy';

export async function POST(req: NextRequest) {
  try {
    const guard = requireMutationSession(req);
    if ('response' in guard) return guard.response;
    const { plan, intentHash } = await req.json();

    if (!plan || !intentHash) {
      return NextResponse.json({ ok: false, error: { message: 'Missing plan or intentHash' } }, { status: 400 });
    }
    const validation = validateFlowPlan(plan);
    if (!validation.valid || !validation.plan) {
      return NextResponse.json({ ok: false, error: { message: validation.errors.join('; ') } }, { status: 400 });
    }
    assertPermittedPlan(validation.plan, 'manual');
    if (!guard.session.walletAddress) {
      return NextResponse.json({ ok: false, error: { message: 'No managed wallet is attached to this session' } }, { status: 403 });
    }

    console.log(`[Executor] Intent: ${intentHash} | Authenticated user: ${guard.session.email}`);

    const result = await executeFlowPlan(validation.plan, intentHash, guard.session.walletAddress);

    return NextResponse.json({ ok: true, mode: result.mode, result });
  } catch (e) {
    console.error('[Executor] Error:', e);
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : String(e) } },
      { status: 500 }
    );
  }
}
