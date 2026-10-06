import { createHash, randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendOtpEmail } from '@/lib/mailer';
import { setMemoryOtp } from '@/lib/otpStore';
import { getClientIp, checkRateLimit } from '@/lib/rateLimit';
import { hasTrustedOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ ok: false, error: 'Invalid request origin' }, { status: 403 });
    }
    const ipLimit = checkRateLimit(`otp-send:${getClientIp(req)}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many verification requests. Try again later.' }, { status: 429 });
    }
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailLimit = checkRateLimit(`otp-send:${cleanEmail}`, 3, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many verification requests. Try again later.' }, { status: 429 });
    }
    const code = randomInt(100000, 1_000_000).toString();
    const codeHash = createHash('sha256').update(`${cleanEmail}:${code}`).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const supabase = getSupabaseClient();
    const allowMemoryOtp = process.env.NODE_ENV !== 'production' && process.env.ROVA_ALLOW_MEMORY_OTP === 'true';
    if (!supabase && !allowMemoryOtp) {
      return NextResponse.json({ ok: false, error: 'Authentication storage is not configured' }, { status: 503 });
    }

    if (supabase) {
      const { error: deleteError } = await supabase.from('otp_codes').delete().eq('email', cleanEmail);
      if (deleteError) {
        console.error('[OTP SEND ERROR] Supabase cleanup failed:', deleteError);
        return NextResponse.json({ ok: false, error: 'Unable to prepare verification code' }, { status: 503 });
      }
      const { error } = await supabase.from('otp_codes').insert({
        email: cleanEmail,
        code: '',
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('[OTP SEND ERROR] Supabase insert failed:', error);
        return NextResponse.json({ ok: false, error: 'Unable to store verification code' }, { status: 503 });
      }
    }

    if (!supabase && allowMemoryOtp) {
      setMemoryOtp(cleanEmail, code, expiresAt.getTime());
    }

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
