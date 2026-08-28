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

    const supabase = getSupabaseClient();

    // 1. Pre-Check: If user already has a linked WhatsApp number in users table
    if (supabase) {
      const { data: userData } = await supabase
        .from('users')
        .select('whatsapp_number')
        .eq('email', cleanEmail)
        .limit(1);

      if (userData && userData.length > 0 && userData[0].whatsapp_number) {
        return NextResponse.json({
          ok: true,
          isLinked: true,
          whatsappNumber: userData[0].whatsapp_number,
          email: cleanEmail,
        });
      }

      // 2. Pre-Check: Reuse existing unexpired LINK- token if present in otp_codes
      const { data: existingOtp } = await supabase
        .from('otp_codes')
        .select('code, expires_at')
        .eq('email', cleanEmail)
        .like('code', 'LINK-%')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1);

      if (existingOtp && existingOtp.length > 0) {
        return NextResponse.json({
          ok: true,
          isLinked: false,
          token: existingOtp[0].code,
          email: cleanEmail,
          expiresAt: existingOtp[0].expires_at,
        });
      }
    }

    // 3. Generate fresh LINK-XXXXXX token if unlinked and no active token exists
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `LINK-${randomCode}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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
      isLinked: false,
      token,
      email: cleanEmail,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[LINK TOKEN GENERATION ERROR]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to generate link token' }, { status: 500 });
  }
}
