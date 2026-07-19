import { NextRequest, NextResponse } from 'next/server';
import { createRule, listRules } from '@/lib/agentStore';
import type { FxPair } from '@/lib/rates';
import type { TriggerType } from '@/lib/agentStore';

export async function GET() {
  return NextResponse.json({ ok: true, rules: await listRules() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientLabel,
      recipientAddress,
      amount,
      pair,
      triggerType,
      triggerValue,
      byDate,
      toleranceBps,
    }: {
      recipientLabel: string;
      recipientAddress: string;
      amount: number;
      pair: FxPair;
      triggerType: TriggerType;
      triggerValue: number;
      byDate?: string;
      toleranceBps?: number;
    } = body;

    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      return NextResponse.json({ ok: false, error: 'Valid recipient address (0x...) is required' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Amount must be greater than 0' }, { status: 400 });
    }
    if (!['USDC/EURC', 'EURC/USDC'].includes(pair)) {
      return NextResponse.json({ ok: false, error: 'Invalid pair' }, { status: 400 });
    }
    if (!['rate_gte', 'rate_lte', 'by_date'].includes(triggerType)) {
      return NextResponse.json({ ok: false, error: 'Invalid trigger type' }, { status: 400 });
    }
    if (triggerType !== 'by_date' && (!triggerValue || triggerValue <= 0)) {
      return NextResponse.json({ ok: false, error: 'Target rate is required for rate triggers' }, { status: 400 });
    }
    if (triggerType === 'by_date' && !byDate) {
      return NextResponse.json({ ok: false, error: 'A date is required for by-date triggers' }, { status: 400 });
    }

    const rule = await createRule({
      recipientLabel: recipientLabel || 'Recipient',
      recipientAddress,
      amount,
      pair,
      triggerType,
      triggerValue: triggerValue || 0,
      byDate,
      toleranceBps: toleranceBps ?? 10,
    });

    return NextResponse.json({ ok: true, rule });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
