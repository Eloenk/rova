import { NextRequest, NextResponse } from 'next/server';
import { createStandingIntent, listStandingIntents } from '@/lib/agentStore';
import { isAddress } from '@/lib/emailWallets';
import type { StandingTrigger, CustodyMode } from '@/lib/agentStore';
import type { FlowPlan } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ ok: true, intents: listStandingIntents() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      intentText,
      plan,
      trigger,
      custodyMode,
      sourceWallet,
    }: {
      intentText: string;
      plan: FlowPlan;
      trigger: StandingTrigger;
      custodyMode: CustodyMode;
      sourceWallet: string;
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
    if (!['managed', 'self_custody'].includes(custodyMode)) {
      return NextResponse.json({ ok: false, error: 'Invalid custody mode' }, { status: 400 });
    }
    if (custodyMode === 'self_custody' && !isAddress(sourceWallet || '')) {
      return NextResponse.json({ ok: false, error: 'Connect a wallet first to automate with self-custody' }, { status: 400 });
    }

    const intent = createStandingIntent({
      intentText,
      plan,
      trigger,
      custodyMode,
      sourceWallet: custodyMode === 'self_custody' ? sourceWallet : (process.env.ROVA_OWNER_WALLET || 'managed-wallet-pending-config'),
    });

    return NextResponse.json({ ok: true, intent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
