import { NextRequest, NextResponse } from 'next/server';
import { getRule, updateRuleStatus, recordExecution } from '@/lib/agentStore';
import { resolveRecipient } from '@/lib/emailWallets';
import { confirmSelfCustodyExecution } from '@/lib/agentExecutor';
import { arcScan } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const rule = getRule(params.id);
  if (!rule) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });
  if (rule.status !== 'ready_to_execute') {
    return NextResponse.json({ ok: false, error: 'Rule is not ready to execute' }, { status: 400 });
  }

  const { txHash }: { txHash: string } = await req.json();
  if (!txHash) return NextResponse.json({ ok: false, error: 'txHash is required' }, { status: 400 });

  const { address: recipientAddress } = await resolveRecipient(rule.recipientIdentifier);
  const memo = `auto-exec (self-custody, user-signed): ${rule.recipientLabel}`;

  const { feeJobId, reputationTxHash } = await confirmSelfCustodyExecution({
    ruleOrIntentId: rule.id,
    recipient: recipientAddress,
    amountUsdc: rule.amount,
    memo,
  });

  updateRuleStatus(rule.id, 'fired');
  const exec = recordExecution({
    ruleId: rule.id,
    firedAt: new Date().toISOString(),
    mode: txHash.startsWith('0x') ? 'real' : 'mock',
    txHash,
    arcScanUrl: arcScan.tx(txHash),
    feeJobId,
    feeAmountUsdc: 0.05,
    reputationTxHash,
    memo,
  });

  return NextResponse.json({ ok: true, execution: exec });
}
