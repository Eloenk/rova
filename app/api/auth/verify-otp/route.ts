import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getMemoryOtp, deleteMemoryOtp } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ ok: false, error: 'Email and 6-digit code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();
    const nowIso = new Date().toISOString();
    let isValid = false;

    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', cleanEmail)
        .eq('code', cleanCode)
        .gte('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        isValid = true;
        await supabase.from('otp_codes').delete().eq('id', data[0].id);
      }
    }

    if (!isValid) {
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
      } else {
        try {
          const { createSingleWallet } = await import('@/lib/circle');
          const walletRes = await createSingleWallet(cleanEmail);
          if (walletRes?.address) {
            circleWalletAddress = walletRes.address;
          }
        } catch (circleErr) {
          console.warn('[Verify OTP] Circle wallet dynamic creation note:', circleErr);
        }

        await supabase.from('users').insert({
          id: userId,
          email: cleanEmail,
          circle_wallet_address: circleWalletAddress,
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

    response.cookies.set('rova_user_email', cleanEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[OTP VERIFY ERROR]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Verification failed' }, { status: 500 });
  }
}
