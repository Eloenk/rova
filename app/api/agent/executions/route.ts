import { NextRequest, NextResponse } from 'next/server';
import { listExecutions } from '@/lib/agentStore';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = requireSession(request);
  if ('response' in guard) return guard.response;

  return NextResponse.json({ ok: true, executions: listExecutions(guard.session.email) });
}
