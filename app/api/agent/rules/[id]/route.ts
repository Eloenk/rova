import { NextRequest, NextResponse } from 'next/server';
import { deleteRule, getRule, updateRuleStatus } from '@/lib/agentStore';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const rule = await getRule(params.id);
  if (!rule) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });

  const { status } = await req.json();
  if (!['active', 'cancelled'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
  }

  const updated = await updateRuleStatus(params.id, status);
  return NextResponse.json({ ok: true, rule: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existed = await deleteRule(params.id);
  if (!existed) return NextResponse.json({ ok: false, error: 'Rule not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
