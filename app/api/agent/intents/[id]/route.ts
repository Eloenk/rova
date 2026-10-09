import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { deleteStandingIntent, getStandingIntent, updateStandingIntent } from '@/lib/agentStore';
import { requireMutationSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const intent = await getStandingIntent(params.id, guard.session.email);
  if (!intent) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });

  const { status }: { status: 'active' | 'cancelled' } = await req.json();
  if (!['active', 'cancelled'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
  }

  const updated = await updateStandingIntent(params.id, guard.session.email, { status });
  return NextResponse.json({ ok: true, intent: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const existed = await deleteStandingIntent(params.id, guard.session.email);
  if (!existed) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
