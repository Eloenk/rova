import { NextRequest, NextResponse } from 'next/server';
import { createStandingIntent, listStandingIntents } from '@/lib/agentStore';
import { isAddress } from '@/lib/emailWallets';
import type { StandingTrigger, CustodyMode } from '@/lib/agentStore';
import type { FlowPlan } from '@/lib/types';
import { requireMutationSession, requireSession } from '@/lib/auth';
import { assertPermittedPlan } from '@/lib/policy';

export async function GET(req: NextRequest) {
  const guard = requireSession(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ ok: true, intents: listStandingIntents(guard.session.email) });
}

export async function POST(req: NextRequest) {
  try {
    const guard = requireMutationSession(req);
    if ('response' in guard) return guard.response;
    const body = await req.json();
    const {
      intentText,
      plan,
      trigger,
      custodyMode,
    }: {
      intentText: string;
      plan: FlowPlan;
      trigger: StandingTrigger;
      custodyMode: CustodyMode;
    } = body;

    if (!intentText || !plan || !Array.isArray(plan.splits) || plan.splits.length === 0) {
      return NextResponse.json({ ok: false, error: 'A parsed plan with at least one split is required' }, { status: 400 });
    }
    if (!trigger || !['recurring', 'on_receive'].includes(trigger.type)) {
      return NextResponse.json({ ok: false, error: 'Invalid trigger' }, { status: 400 });
    }
    if (trigger.type === 'recurring' && !['daily', 'weekly', 'monthly'].includes(trigger.interval)) {
      return NextResponse.json({ ok: false, error: 'Invalid recurring interval' }, { status: 400 });
    }
    if (trigger.type === 'on_receive' && (!trigger.minAmountUsdc || trigger.minAmountUsdc <= 0)) {
      return NextResponse.json({ ok: false, error: 'minAmountUsdc must be greater than 0' }, { status: 400 });
    }
    assertPermittedPlan(plan, 'autonomous');
    if (custodyMode !== 'managed') {
      return NextResponse.json({ ok: false, error: 'Self-custody automation is unavailable until wallet-signature linking is enabled' }, { status: 400 });
    }
    const activeWallet = guard.session.walletAddress;
    if (!activeWallet || !isAddress(activeWallet)) {
      return NextResponse.json({ ok: false, error: 'A managed wallet is required to automate intents' }, { status: 400 });
    }

    const intent = createStandingIntent({
      intentText,
      plan,
      trigger,
      custodyMode,
      sourceWallet: activeWallet,
      ownerEmail: guard.session.email,
    });

    return NextResponse.json({ ok: true, intent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
