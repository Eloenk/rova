import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    ok: false,
    error: 'Self-custody automation confirmation is disabled until signed wallet linking and on-chain receipt verification are available.',
  }, { status: 410 });
}
