import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireMutationSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  hashExecutionApproval,
  isExecutionPlanId,
  setExecutionApproval,
} from '@/lib/executionPlans';
import { sendExecutionApprovalEmail } from '@/lib/mailer';
import { serverEnv } from '@/lib/env/server';

export async function POST(req: NextRequest) {
  try {
    const guard = await requireMutationSession(req);
    if ('response' in guard) return guard.response;
    if (!serverEnv.executionEnabled) {
      return NextResponse.json({ ok: false, error: 'Custodial execution is disabled' }, { status: 503 });
    }
    if (!guard.session.walletAddress) {
      return NextResponse.json({ ok: false, error: 'No managed wallet is attached to this session' }, { status: 403 });
    }

    const { executionPlanId } = await req.json();
    if (!isExecutionPlanId(executionPlanId)) {
      return NextResponse.json({ ok: false, error: 'A valid executionPlanId is required' }, { status: 400 });
    }

    const rateLimit = checkRateLimit(
      `execution-approval:${guard.session.email}:${executionPlanId}:${getClientIp(req)}`,
      3,
      15 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many approval requests. Try again later.' }, { status: 429 });
    }

    const code = randomInt(100000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const approvalHash = hashExecutionApproval(executionPlanId, guard.session.email, code);
    const stored = await setExecutionApproval({
      id: executionPlanId,
      ownerEmail: guard.session.email,
      walletAddress: guard.session.walletAddress,
      approvalHash,
      expiresAt,
    });
    if (!stored) {
      return NextResponse.json({ ok: false, error: 'Execution plan is invalid, expired, or already used' }, { status: 409 });
    }

    const emailSent = await sendExecutionApprovalEmail(guard.session.email, code);
    if (!emailSent && !serverEnv.allowMemoryOtp) {
      await setExecutionApproval({
        id: executionPlanId,
        ownerEmail: guard.session.email,
        walletAddress: guard.session.walletAddress,
        approvalHash: null,
        expiresAt: null,
      });
      return NextResponse.json({ ok: false, error: 'Unable to deliver execution approval code' }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      expiresAt,
      message: emailSent ? 'Execution approval code sent to email' : 'Development execution approval code generated',
      ...(serverEnv.allowMemoryOtp && !emailSent ? { developmentCode: code } : {}),
    });
  } catch {
    console.error('[Execution Approval] Request failed');
    return NextResponse.json({ ok: false, error: 'Unable to authorize execution' }, { status: 500 });
  }
}
