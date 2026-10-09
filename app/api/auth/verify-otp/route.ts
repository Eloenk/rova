import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getMemoryOtp, deleteMemoryOtp } from '@/lib/otpStore';
import { hasSessionSecret, hasTrustedOrigin, setSessionCookie } from '@/lib/auth';
import { getClientIp, checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!hasSessionSecret()) {
      return NextResponse.json({ ok: false, error: 'Authentication is not configured' }, { status: 503 });
    }
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ ok: false, error: 'Invalid request origin' }, { status: 403 });
    }
    const ipLimit = checkRateLimit(`otp-verify:${getClientIp(req)}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many verification attempts. Try again later.' }, { status: 429 });
    }
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ ok: false, error: 'Email and 6-digit code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired verification code' }, { status: 400 });
    }
    const codeHash = createHash('sha256').update(`${cleanEmail}:${cleanCode}`).digest('hex');
    const nowIso = new Date().toISOString();
    let isValid = false;

    const supabase = getSupabaseClient();
    const allowMemoryOtp = process.env.NODE_ENV !== 'production' && process.env.ROVA_ALLOW_MEMORY_OTP === 'true';
    if (!supabase && !allowMemoryOtp) {
      return NextResponse.json({ ok: false, error: 'Authentication storage is not configured' }, { status: 503 });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', cleanEmail)
        .eq('code_hash', codeHash)
        .gte('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        isValid = true;
        await supabase.from('otp_codes').delete().eq('id', data[0].id);
      }
    }

    if (!isValid && allowMemoryOtp) {
      const memOtp = getMemoryOtp(cleanEmail);
      if (memOtp && memOtp.code === cleanCode && memOtp.expiresAt > Date.now()) {
        isValid = true;
        deleteMemoryOtp(cleanEmail);
      }
    }

    if (!isValid) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired verification code' }, { status: 400 });
    }

    let userId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    let circleWalletAddress = '';

    if (supabase) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        if (existingUser.circle_wallet_address) {
          circleWalletAddress = existingUser.circle_wallet_address;
        } else {
          try {
            const { createSingleWallet } = await import('@/lib/circle');
            const walletRes = await createSingleWallet(cleanEmail);
            if (walletRes?.address) {
              circleWalletAddress = walletRes.address;
              await supabase
                .from('users')
                .update({ circle_wallet_address: circleWalletAddress })
                .eq('id', userId);
            }
          } catch (circleErr) {
            console.warn('[Verify OTP] Circle wallet dynamic creation note:', circleErr);
          }
        }

        if (!existingUser.savings_wallet_address) {
          try {
            const { createSavingsSubWallet } = await import('@/lib/circle');
            const savingsRes = await createSavingsSubWallet(cleanEmail);
            if (savingsRes?.address) {
              await supabase
                .from('users')
                .update({ savings_wallet_address: savingsRes.address })
                .eq('id', userId);
            }
          } catch (savErr) {
            console.warn('[Verify OTP] Savings wallet dynamic creation note:', savErr);
          }
        }
      } else {
        let savingsWalletAddress = '';
        try {
          const { createSingleWallet, createSavingsSubWallet } = await import('@/lib/circle');
          const walletRes = await createSingleWallet(cleanEmail);
          if (walletRes?.address) {
            circleWalletAddress = walletRes.address;
          }
          const savingsRes = await createSavingsSubWallet(cleanEmail, walletRes?.walletSetId);
          if (savingsRes?.address) {
            savingsWalletAddress = savingsRes.address;
          }
        } catch (circleErr) {
          console.warn('[Verify OTP] Circle wallet dynamic creation note:', circleErr);
        }

        await supabase.from('users').insert({
          id: userId,
          email: cleanEmail,
          circle_wallet_address: circleWalletAddress,
          savings_wallet_address: savingsWalletAddress,
          whatsapp_approval_threshold_usdc: 100.0,
        });
      }
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: cleanEmail,
        circleWalletAddress,
      },
    });

    setSessionCookie(response, {
      email: cleanEmail,
      walletAddress: circleWalletAddress || undefined,
    });

    return response;
  } catch (err: any) {
    console.error('[OTP VERIFY ERROR]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Verification failed' }, { status: 500 });
  }
}
