import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getMemoryOtp, deleteMemoryOtp } from '@/lib/otpStore';
import { redeemSavingsVault } from '@/lib/vault';
import { requireMutationSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const guard = requireMutationSession(req);
    if ('response' in guard) return guard.response;
    const { email, code, depositId } = await req.json();
    const walletAddress = guard.session.walletAddress;

    if (!email || !code || !depositId || !walletAddress) {
      return NextResponse.json(
        { ok: false, error: 'Email, 6-digit OTP code, depositId, and walletAddress are required for vault redemption' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== guard.session.email) {
      return NextResponse.json({ ok: false, error: 'Vault authorization email does not match this session' }, { status: 403 });
    }
    const cleanCode = code.toString().trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired OTP authorization code for vault release' }, { status: 401 });
    }
    const codeHash = createHash('sha256').update(`${cleanEmail}:${cleanCode}`).digest('hex');
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
        .eq('code_hash', codeHash)
        .gte('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        isValid = true;
        await supabase.from('otp_codes').delete().eq('id', data[0].id);
      }
    }

    if (!isValid && process.env.NODE_ENV !== 'production' && process.env.ROVA_ALLOW_MEMORY_OTP === 'true') {
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
