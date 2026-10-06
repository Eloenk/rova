import { NextRequest, NextResponse } from 'next/server';
import { listExecutions } from '@/lib/agentStore';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = requireSession(request);
  if ('response' in guard) return guard.response;

  try {
    return NextResponse.json({ ok: true, executions: await listExecutions(guard.session.email) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load execution history' }, { status: 503 });
  }
}
