import { NextRequest, NextResponse } from 'next/server';
import { arcScan } from '@/lib/config';
import { getIsMockMode } from '@/lib/ai-provider';

export async function POST(req: NextRequest) {
  try {
    const { score, tag, intentHash, totalAmount } = await req.json();

    const isMock = getIsMockMode();

    if (isMock) {
      // Mock reputation recording — returns a plausible fake tx
      const fakeTx = '0xrep' + intentHash?.slice(2, 18).padEnd(60, '0');
      console.log(`[Reputation] MOCK — score=${score} tag=${tag} amount=${totalAmount}`);
      return NextResponse.json({
        ok: true,
        mode: 'mock',
        txHash: fakeTx,
        arcScanUrl: arcScan.tx(fakeTx),
        score,
        tag,
      });
    }

    // Real reputation recording via Circle DCW
    const { recordReputation } = await import('@/lib/circle');
    const validatorWallet = process.env.ROVA_VALIDATOR_WALLET!;
    const agentId = process.env.NEXT_PUBLIC_ROVA_AGENT_ID || '1683';

    const txHash = await recordReputation(validatorWallet, agentId, score, tag);
    console.log(`[Reputation] Recorded score=${score} tag=${tag} tx=${txHash}`);

    return NextResponse.json({
      ok: true,
      mode: 'real',
      txHash,
      arcScanUrl: arcScan.tx(txHash),
      score,
      tag,
    });
  } catch (e) {
    console.error('[Reputation] Error:', e);
    // Non-fatal — don't fail the whole flow over a reputation recording issue
    return NextResponse.json({ ok: false, error: { message: String(e) } }, { status: 500 });
  }
}
