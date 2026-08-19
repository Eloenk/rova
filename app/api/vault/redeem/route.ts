import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getMemoryOtp, deleteMemoryOtp } from '@/lib/otpStore';
import { redeemSavingsVault } from '@/lib/vault';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, code, depositId, walletAddress } = await req.json();

    if (!email || !code || !depositId || !walletAddress) {
      return NextResponse.json(
        { ok: false, error: 'Email, 6-digit OTP code, depositId, and walletAddress are required for vault redemption' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();
    const numDepositId = parseInt(depositId, 10);
    const nowIso = new Date().toISOString();
    let isValid = false;

    const supabase = getSupabaseClient();

    // Step 1: Validate 6-digit OTP authorization code
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
      return NextResponse.json({ ok: false, error: 'Invalid or expired OTP authorization code for vault release' }, { status: 401 });
    }

    // Step 2: Execute smart contract redemption on RovaSavingsVault.sol
    const result = await redeemSavingsVault(walletAddress, numDepositId);

    return NextResponse.json({
      ok: true,
      message: `Deposit #${numDepositId} successfully redeemed back to wallet`,
      txHash: result.txHash,
      arcScanUrl: result.arcScanUrl,
    });
  } catch (err: any) {
    console.error('[VAULT REDEEM API ERROR]', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Smart contract vault redemption failed. Verify timelock period.' },
      { status: 500 }
    );
  }
}
