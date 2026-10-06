import { NextRequest, NextResponse } from 'next/server';
import { createRule, listRules } from '@/lib/agentStore';
import { isEmail, isAddress } from '@/lib/emailWallets';
import type { FxPair } from '@/lib/rates';
import type { TriggerType, CustodyMode, RecipientType } from '@/lib/agentStore';
import { requireMutationSession, requireSession } from '@/lib/auth';
import { assertPermittedAmount } from '@/lib/policy';

export async function GET(req: NextRequest) {
  const guard = requireSession(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ ok: true, rules: listRules(guard.session.email) });
}

export async function POST(req: NextRequest) {
  try {
    const guard = requireMutationSession(req);
    if ('response' in guard) return guard.response;
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
    } = body;

    const id = (recipientIdentifier || '').trim();
    let recipientType: RecipientType;
    if (isAddress(id)) recipientType = 'wallet';
    else if (isEmail(id)) recipientType = 'email';
    else return NextResponse.json({ ok: false, error: 'Recipient must be a valid wallet address (0x...) or email' }, { status: 400 });

    assertPermittedAmount(Number(amount), 'autonomous');
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
    if (custodyMode !== 'managed') {
      return NextResponse.json({ ok: false, error: 'Self-custody automation is unavailable until wallet-signature linking is enabled' }, { status: 400 });
    }
    const activeWallet = guard.session.walletAddress;
    if (!activeWallet || !isAddress(activeWallet)) {
      return NextResponse.json({ ok: false, error: 'A managed wallet is required to create an automation rule' }, { status: 400 });
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
      sourceWallet: activeWallet,
      ownerEmail: guard.session.email,
    });

    return NextResponse.json({ ok: true, rule });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
