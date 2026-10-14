import { NextRequest, NextResponse } from 'next/server';
import { executeFlowPlan } from '@/lib/flowExecutor';
import { requireMutationSession } from '@/lib/auth';
import { validateFlowPlan } from '@/lib/validator';
import { assertPermittedPlan } from '@/lib/policy';
import {
  claimExecutionPlan,
  finishExecutionPlan,
  hashExecutionApproval,
  isExecutionPlanId,
} from '@/lib/executionPlans';
import { serverEnv } from '@/lib/env/server';

export async function POST(req: NextRequest) {
  let claimedPlanId: string | undefined;
  try {
    const guard = await requireMutationSession(req);
    if ('response' in guard) return guard.response;
    if (!serverEnv.executionEnabled) {
      return NextResponse.json({ ok: false, error: { message: 'Custodial execution is disabled' } }, { status: 503 });
    }
    const { executionPlanId, approvalCode } = await req.json();

    if (!isExecutionPlanId(executionPlanId)) {
      return NextResponse.json({ ok: false, error: { message: 'A valid executionPlanId is required' } }, { status: 400 });
    }
    const cleanApprovalCode = String(approvalCode || '').trim();
    if (!/^\d{6}$/.test(cleanApprovalCode)) {
      return NextResponse.json({ ok: false, error: { message: 'A valid 6-digit approval code is required' } }, { status: 400 });
    }
    if (!guard.session.walletAddress) {
      return NextResponse.json({ ok: false, error: { message: 'No managed wallet is attached to this session' } }, { status: 403 });
    }

    const storedPlan = await claimExecutionPlan(
      executionPlanId,
      guard.session.email,
      guard.session.walletAddress,
      hashExecutionApproval(executionPlanId, guard.session.email, cleanApprovalCode),
    );
    claimedPlanId = storedPlan.id;
    const validation = validateFlowPlan(storedPlan.plan);
    if (!validation.valid || !validation.plan) {
      await finishExecutionPlan(storedPlan.id, 'failed');
      return NextResponse.json({ ok: false, error: { message: 'Stored execution plan failed validation' } }, { status: 409 });
    }
    assertPermittedPlan(validation.plan, 'manual');

    const result = await executeFlowPlan(validation.plan, storedPlan.intentHash, guard.session.walletAddress);
    await finishExecutionPlan(storedPlan.id, 'executed', {
      txHashes: result.txHashes,
      jobId: result.jobId || null,
      executedAt: result.executedAt,
    });

    return NextResponse.json({ ok: true, mode: result.mode, result });
  } catch {
    console.error('[Executor] Execution request failed');
    if (claimedPlanId) {
      await finishExecutionPlan(claimedPlanId, 'failed');
    }
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: claimedPlanId
            ? 'Execution failed after the plan was authorized'
            : 'Approval code is invalid, expired, or the plan was already consumed',
          retryable: !claimedPlanId,
        },
      },
      { status: claimedPlanId ? 500 : 409 }
    );
  }
}
