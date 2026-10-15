import { NextRequest, NextResponse } from 'next/server';
import { handleLogout, hasTrustedOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Invalid request origin' }, { status: 403 });
  }
  return handleLogout(request);
}
