import { NextRequest, NextResponse } from 'next/server';
import { getStandingIntent, updateStandingIntent, recordExecution } from '@/lib/agentStore';
import { confirmSelfCustodyExecution } from '@/lib/agentExecutor';
import { arcScan } from '@/lib/config';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const intent = getStandingIntent(params.id);
  if (!intent) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });
  if (intent.status !== 'ready_to_execute') {
    return NextResponse.json({ ok: false, error: 'Not ready to execute' }, { status: 400 });
  }

  const { txHash }: { txHash: string } = await req.json();
  if (!txHash) return NextResponse.json({ ok: false, error: 'txHash is required' }, { status: 400 });

  const firstRecipient = intent.plan.splits[0]?.address || 'multiple';
  const totalAmount = intent.plan.splits.reduce((s, sp) => s + (sp.amount || 0), 0);
  const memo = `auto-exec (self-custody, user-signed): "${intent.intentText}"`;

  const { feeJobId, reputationTxHash } = await confirmSelfCustodyExecution({
    ruleOrIntentId: intent.id,
    recipient: firstRecipient,
    amountUsdc: totalAmount,
    memo,
  });

  updateStandingIntent(intent.id, { status: 'active', lastRunAt: new Date().toISOString(), runCount: intent.runCount + 1 });
  const exec = recordExecution({
    standingIntentId: intent.id,
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
