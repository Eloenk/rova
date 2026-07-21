import { NextRequest, NextResponse } from 'next/server';
import { resolveRecipient } from '@/lib/emailWallets';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
  try {
    const { address, isNewWallet } = await resolveRecipient(id);
    return NextResponse.json({ ok: true, address, isNewWallet });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
