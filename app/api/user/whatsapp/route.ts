import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { whatsappNumber, email } = await req.json();

    if (!whatsappNumber) {
      return NextResponse.json({ ok: false, error: 'WhatsApp phone number is required' }, { status: 400 });
    }

    const cleanPhone = whatsappNumber.trim();
    const cookieEmail = req.cookies.get('rova_user_email')?.value;
    const cleanEmail = (email || cookieEmail || '').toLowerCase().trim();

    if (!cleanEmail) {
      return NextResponse.json({ ok: false, error: 'User email session not found' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      // Upsert/update whatsapp_number in Supabase users table
      const { error } = await supabase
        .from('users')
        .update({ whatsapp_number: cleanPhone })
        .eq('email', cleanEmail);

      if (error) {
        console.error('[WhatsApp Save Error]', error);
        return NextResponse.json({ ok: false, error: error.message || 'Failed to update WhatsApp number in database' }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      whatsappNumber: cleanPhone,
      email: cleanEmail,
      message: 'WhatsApp number stored successfully in database',
    });
  } catch (err: any) {
    console.error('[WhatsApp API Route Error]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
