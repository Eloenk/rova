import { NextRequest, NextResponse } from 'next/server';
import { executeSwap, getSwapQuote } from '@/lib/swapService';
import { requireMutationSession, requireSession } from '@/lib/auth';
import { assertPermittedAmount } from '@/lib/policy';

export async function POST(req: NextRequest) {
  try {
    const guard = requireMutationSession(req);
    if ('response' in guard) return guard.response;
    const body = await req.json();
    const { sellCurrency, buyCurrency, amount, maxSlippageBps } = body;

    const wallet = guard.session.walletAddress;
    if (!wallet) {
      return NextResponse.json({ ok: false, error: 'walletAddress is required for swap execution' }, { status: 400 });
    }

    const sell = sellCurrency || (buyCurrency === 'USDC' ? 'EURC' : 'USDC');
    const buy = buyCurrency || (sell === 'USDC' ? 'EURC' : 'USDC');
    const amt = Number(amount);

    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ ok: false, error: 'Valid positive amount required' }, { status: 400 });
    }
    assertPermittedAmount(amt, 'manual');
    if (!['USDC', 'EURC'].includes(sell) || !['USDC', 'EURC'].includes(buy) || sell === buy) {
      return NextResponse.json({ ok: false, error: 'Only USDC/EURC swaps are supported' }, { status: 400 });
    }
    const slippageBps = Number(maxSlippageBps ?? 50);
    if (!Number.isInteger(slippageBps) || slippageBps < 1 || slippageBps > 100) {
      return NextResponse.json({ ok: false, error: 'Slippage must be an integer between 1 and 100 bps' }, { status: 400 });
    }

    console.log(`[API /api/swap] Executing swap: ${amt} ${sell} -> ${buy} for wallet ${wallet}`);

    const result = await executeSwap({
      walletAddress: wallet,
      sellCurrency: sell as 'USDC' | 'EURC',
      buyCurrency: buy as 'USDC' | 'EURC',
      amount: amt,
      maxSlippageBps: slippageBps,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('[API /api/swap] Error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const guard = requireSession(req);
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
