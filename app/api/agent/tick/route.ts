import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function disabledResponse() {
  return NextResponse.json({ ok: false, error: 'The web scheduler is disabled. Automation execution is owned by the hardened engine and remains paused pending a shared custody-policy implementation.' }, { status: 410 });
}

export async function GET() {
  return disabledResponse();
}

export async function POST() {
  return disabledResponse();
}
