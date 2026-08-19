import { NextRequest, NextResponse } from 'next/server';
import { getUserVaultDeposits } from '@/lib/vault';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ ok: false, error: 'walletAddress query parameter is required' }, { status: 400 });
    }

    const deposits = await getUserVaultDeposits(walletAddress);

    return NextResponse.json({
      ok: true,
      deposits,
    });
  } catch (err: any) {
    console.error('[VAULT DEPOSITS GET ERROR]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch vault deposits' }, { status: 500 });
  }
}
