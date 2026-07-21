import { NextRequest, NextResponse } from 'next/server';
import { deleteStandingIntent, getStandingIntent, updateStandingIntent } from '@/lib/agentStore';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const intent = getStandingIntent(params.id);
  if (!intent) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });

  const { status }: { status: 'active' | 'cancelled' } = await req.json();
  if (!['active', 'cancelled'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
  }

  const updated = updateStandingIntent(params.id, { status });
  return NextResponse.json({ ok: true, intent: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existed = deleteStandingIntent(params.id);
  if (!existed) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
