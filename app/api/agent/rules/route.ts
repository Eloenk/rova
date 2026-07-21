import { NextRequest, NextResponse } from 'next/server';
import { createRule, listRules } from '@/lib/agentStore';
import { isEmail, isAddress } from '@/lib/emailWallets';
import type { FxPair } from '@/lib/rates';
import type { TriggerType, CustodyMode, RecipientType } from '@/lib/agentStore';

export async function GET() {
  return NextResponse.json({ ok: true, rules: listRules() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientLabel,
      recipientIdentifier,
      amount,
      pair,
      triggerType,
      triggerValue,
      byDate,
      toleranceBps,
      custodyMode,
      sourceWallet,
    }: {
      recipientLabel: string;
      recipientIdentifier: string;
      amount: number;
      pair: FxPair;
      triggerType: TriggerType;
      triggerValue: number;
      byDate?: string;
      toleranceBps?: number;
      custodyMode: CustodyMode;
      sourceWallet: string;
    } = body;

    const id = (recipientIdentifier || '').trim();
    let recipientType: RecipientType;
    if (isAddress(id)) recipientType = 'wallet';
    else if (isEmail(id)) recipientType = 'email';
    else return NextResponse.json({ ok: false, error: 'Recipient must be a valid wallet address (0x...) or email' }, { status: 400 });

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
    if (!['managed', 'self_custody'].includes(custodyMode)) {
      return NextResponse.json({ ok: false, error: 'Invalid custody mode' }, { status: 400 });
    }
    if (custodyMode === 'self_custody' && !isAddress(sourceWallet || '')) {
      return NextResponse.json({ ok: false, error: 'Connect a wallet first to create a self-custody rule' }, { status: 400 });
    }

    const rule = createRule({
      recipientLabel: recipientLabel || 'Recipient',
      recipientIdentifier: id,
      recipientType,
      amount,
      pair,
      triggerType,
      triggerValue: triggerValue || 0,
      byDate,
      toleranceBps: toleranceBps ?? 10,
      custodyMode,
      sourceWallet: custodyMode === 'self_custody' ? sourceWallet : (process.env.ROVA_OWNER_WALLET || 'managed-wallet-pending-config'),
    });

    return NextResponse.json({ ok: true, rule });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
