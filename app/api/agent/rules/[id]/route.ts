import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { deleteRule, getRule, updateRuleStatus } from '@/lib/agentStore';
import type { RuleStatus } from '@/lib/agentStore';
import { requireMutationSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireMutationSession(req);
  if ('response' in guard) return guard.response;
  const rule = getRule(params.id, guard.session.email);
  if (!rule) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });

  const { status }: { status: RuleStatus } = await req.json();
  if (!['active', 'cancelled'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
  }

  const updated = updateRuleStatus(params.id, status);
  return NextResponse.json({ ok: true, rule: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireMutationSession(req);
  if ('response' in guard) return guard.response;
  if (!getRule(params.id, guard.session.email)) {
    return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });
  }
  const existed = deleteRule(params.id);
  if (!existed) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
