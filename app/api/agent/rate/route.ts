import { NextResponse } from 'next/server';
import { getAllRates } from '@/lib/rates';

export async function GET() {
  return NextResponse.json({ ok: true, rates: getAllRates(), at: new Date().toISOString() });
}
