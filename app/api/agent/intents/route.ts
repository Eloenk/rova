import { NextRequest, NextResponse } from 'next/server';
import { listStandingIntents } from '@/lib/agentStore';
import { requireMutationSession, requireSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const guard = requireSession(req);
  if ('response' in guard) return guard.response;
  try {
    return NextResponse.json({ ok: true, intents: await listStandingIntents(guard.session.email) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load standing intents' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireMutationSession(req);
  if ('response' in guard) return guard.response;
  return NextResponse.json({ ok: false, error: 'Standing-intent automation is paused until its plan schema and Circle custody execution are shared with the engine.' }, { status: 503 });
}
