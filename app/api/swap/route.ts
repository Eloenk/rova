import { NextRequest, NextResponse } from 'next/server';
import { executeSwap, getSwapQuote } from '@/lib/swapService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, sellCurrency, buyCurrency, amount, maxSlippageBps } = body;

    const wallet = walletAddress || process.env.ROVA_OWNER_WALLET;
    if (!wallet) {
      return NextResponse.json({ ok: false, error: 'walletAddress or ROVA_OWNER_WALLET required' }, { status: 400 });
    }

    const sell = sellCurrency || (buyCurrency === 'USDC' ? 'EURC' : 'USDC');
    const buy = buyCurrency || (sell === 'USDC' ? 'EURC' : 'USDC');
    const amt = Number(amount);

    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ ok: false, error: 'Valid positive amount required' }, { status: 400 });
    }

    console.log(`[API /api/swap] Executing swap: ${amt} ${sell} -> ${buy} for wallet ${wallet}`);

    const result = await executeSwap({
      walletAddress: wallet,
      sellCurrency: sell as 'USDC' | 'EURC',
      buyCurrency: buy as 'USDC' | 'EURC',
      amount: amt,
      maxSlippageBps: maxSlippageBps || 50,
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
    const { searchParams } = new URL(req.url);
    const sellCurrency = (searchParams.get('sellCurrency') as 'USDC' | 'EURC') || 'USDC';
    const buyCurrency = (searchParams.get('buyCurrency') as 'USDC' | 'EURC') || 'EURC';
    const amount = Number(searchParams.get('amount') || '1');

    const quote = await getSwapQuote({ sellCurrency, buyCurrency, amount });
    return NextResponse.json({ ok: true, quote });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
