import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendOtpEmail } from '@/lib/mailer';
import { setMemoryOtp } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const supabase = getSupabaseClient();

    if (supabase) {
      const { error } = await supabase.from('otp_codes').insert({
        email: cleanEmail,
        code,
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('[OTP SEND ERROR] Supabase insert failed:', error);
      }
    }

    // Always keep memory fallback for local dev resilience
    setMemoryOtp(cleanEmail, code, expiresAt.getTime());

    // Send email via Nodemailer (or log to server console if SMTP keys missing)
    await sendOtpEmail(cleanEmail, code);

    return NextResponse.json({
      ok: true,
      message: 'Verification code sent to email',
    });
  } catch (err: any) {
    console.error('[OTP SEND FATAL ERROR]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to send OTP' }, { status: 500 });
  }
}
