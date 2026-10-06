import { NextRequest, NextResponse } from 'next/server';
import { listRules } from '@/lib/agentStore';
import { requireMutationSession, requireSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const guard = requireSession(req);
  if ('response' in guard) return guard.response;
  try {
    return NextResponse.json({ ok: true, rules: await listRules(guard.session.email) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load automation rules' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireMutationSession(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ ok: false, error: 'Autonomous rules are paused until Circle-managed execution is rebuilt with a shared engine policy.' }, { status: 503 });
}
