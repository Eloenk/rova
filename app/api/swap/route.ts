import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote } from '@/lib/swapService';
import { requireSession } from '@/lib/auth';
import { assertPermittedAmount } from '@/lib/policy';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: 'Direct swap execution is disabled; execute an authenticated one-time plan through /api/execute.' },
    { status: 410 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireSession(req);
    if ('response' in guard) return guard.response;
    const { searchParams } = new URL(req.url);
    const sellCurrency = (searchParams.get('sellCurrency') as 'USDC' | 'EURC') || 'USDC';
    const buyCurrency = (searchParams.get('buyCurrency') as 'USDC' | 'EURC') || 'EURC';
    const amount = Number(searchParams.get('amount') || '1');

    if (!['USDC', 'EURC'].includes(sellCurrency) || !['USDC', 'EURC'].includes(buyCurrency) || sellCurrency === buyCurrency) {
      return NextResponse.json({ ok: false, error: 'Only USDC/EURC swaps are supported' }, { status: 400 });
    }
    assertPermittedAmount(amount, 'manual');
    const quote = await getSwapQuote({ sellCurrency, buyCurrency, amount, walletAddress: guard.session.walletAddress });
    return NextResponse.json({ ok: true, quote });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
