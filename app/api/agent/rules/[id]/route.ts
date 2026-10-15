import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { deleteRule, getRule, updateRuleStatus } from '@/lib/agentStore';
import type { RuleStatus } from '@/lib/agentStore';
import { requireMutationSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const rule = await getRule(id, guard.session.email);
  if (!rule) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });

  const { status }: { status: RuleStatus } = await req.json();
  if (status !== 'cancelled') {
    return NextResponse.json({ ok: false, error: 'Rules may be cancelled but cannot be reactivated from the web application.' }, { status: 409 });
  }

  const updated = await updateRuleStatus(id, guard.session.email, status);
  return NextResponse.json({ ok: true, rule: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const existed = await deleteRule(id, guard.session.email);
  if (!existed) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
