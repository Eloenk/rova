import { NextRequest, NextResponse } from 'next/server';
import { getAllRates } from '@/lib/rates';
import { requireSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const guard = await requireSession(request);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ ok: true, rates: getAllRates(), at: new Date().toISOString() });
}
