import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { setMemoryOtp } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let email = '';
    try {
      const body = await req.json();
      email = body.email;
    } catch {
      // Body may be empty
    }

    const cookieEmail = req.cookies.get('rova_user_email')?.value;
    const cleanEmail = (email || cookieEmail || '').toLowerCase().trim();

    if (!cleanEmail) {
      return NextResponse.json({ ok: false, error: 'User email session not found' }, { status: 401 });
    }

    // Format: LINK-XXXXXX (6 random digits)
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `LINK-${randomCode}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('otp_codes').insert({
        email: cleanEmail,
        code: token,
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('[LINK TOKEN SAVE ERROR] Supabase insert failed:', error);
      }
    }

    // In-memory fallback
    setMemoryOtp(cleanEmail, token, expiresAt.getTime());

    return NextResponse.json({
      ok: true,
      token,
      email: cleanEmail,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[LINK TOKEN GENERATION ERROR]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to generate link token' }, { status: 500 });
  }
}
