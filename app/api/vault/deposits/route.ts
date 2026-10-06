import { NextRequest, NextResponse } from 'next/server';
import { getUserVaultDeposits } from '@/lib/vault';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const guard = requireSession(req);
    if ('response' in guard) return guard.response;
    const walletAddress = guard.session.walletAddress;

    if (!walletAddress) {
      return NextResponse.json({ ok: false, error: 'A managed wallet is required' }, { status: 400 });
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
