import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { requireMutationSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const guard = requireMutationSession(req);
    if ('response' in guard) return guard.response;
    const cleanEmail = guard.session.email;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'WhatsApp linking requires the configured database' }, { status: 503 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('whatsapp_number')
      .eq('email', cleanEmail)
      .limit(1);
    if (userError || !userData?.length) {
      return NextResponse.json({ ok: false, error: 'User account was not found' }, { status: 404 });
    }
    if (userData[0].whatsapp_number) {
      return NextResponse.json({
        ok: true,
        isLinked: true,
        whatsappNumber: userData[0].whatsapp_number,
        email: cleanEmail,
      });
    }

    const token = `LINK-${randomBytes(32).toString('base64url')}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await supabase.from('whatsapp_link_tokens').delete().eq('email', cleanEmail);
    const { error } = await supabase.from('whatsapp_link_tokens').insert({
      email: cleanEmail,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });
    if (error) {
      console.error('[LINK TOKEN SAVE ERROR]', error);
      return NextResponse.json({ ok: false, error: 'Could not create WhatsApp link token' }, { status: 500 });
    }

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
