import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { deleteStandingIntent, getStandingIntent, updateStandingIntent } from '@/lib/agentStore';
import { requireMutationSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const intent = await getStandingIntent(id, guard.session.email);
  if (!intent) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });

  const { status }: { status: 'active' | 'cancelled' } = await req.json();
  if (status !== 'cancelled') {
    return NextResponse.json({ ok: false, error: 'Standing intents may be cancelled but cannot be reactivated from the web application.' }, { status: 409 });
  }

  const updated = await updateStandingIntent(id, guard.session.email, { status });
  return NextResponse.json({ ok: true, intent: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const existed = await deleteStandingIntent(id, guard.session.email);
  if (!existed) return NextResponse.json({ ok: false, error: 'Standing intent not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
