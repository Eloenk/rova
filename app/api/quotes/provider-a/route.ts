import { NextRequest, NextResponse } from 'next/server';
import { getIndicativeRate } from '@/lib/rates';
import { quoteFor, build402Response, hasPaymentProof } from '@/lib/nanopay';
import type { FxPair } from '@/lib/rates';

const PROVIDER = 'provider-a' as const;
const SELLER_ADDRESS = process.env.ROVA_X402_SELLER_ADDRESS || '0x000000000000000000000000000000000000A11A';

export async function GET(req: NextRequest) {
  const pair = (req.nextUrl.searchParams.get('pair') || 'USDC/EURC') as FxPair;

  if (!hasPaymentProof(req)) {
    return NextResponse.json(build402Response(PROVIDER, SELLER_ADDRESS), { status: 402 });
  }

  const mid = getIndicativeRate(pair);
  const rate = quoteFor(PROVIDER, mid);
  return NextResponse.json({ provider: PROVIDER, pair, rate, quotedAt: new Date().toISOString() });
}
