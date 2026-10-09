import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    ok: false,
    error: { message: 'Client-triggered reputation writes are disabled.' },
  }, { status: 410 });
}
