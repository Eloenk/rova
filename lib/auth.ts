import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'rova_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  email: string;
  walletAddress?: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface AuthenticatedSession {
  email: string;
  walletAddress?: string;
}

type GuardResult =
  | { session: AuthenticatedSession }
  | { response: NextResponse };

function getSessionSecret(): string {
  const secret = process.env.ROVA_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ROVA_SESSION_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

export function hasSessionSecret(): boolean {
  return Boolean(process.env.ROVA_SESSION_SECRET && process.env.ROVA_SESSION_SECRET.length >= 32);
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function isValidSignature(value: string, signature: string): boolean {
  const expected = Buffer.from(sign(value));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function readSession(request: NextRequest): AuthenticatedSession | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature || !isValidSignature(encodedPayload, signature)) return null;

  const decodedPayload = decodeBase64Url(encodedPayload);
  if (!decodedPayload) return null;

  try {
    const payload = JSON.parse(decodedPayload) as SessionPayload;
    if (!payload.email || !payload.expiresAt || payload.expiresAt <= Date.now()) return null;

    return {
      email: payload.email,
      walletAddress: payload.walletAddress,
    };
  } catch {
    return null;
  }
}

export function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return origin === request.nextUrl.origin;
}

function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function createSessionToken(session: AuthenticatedSession): string {
  const now = Date.now();
  const payload: SessionPayload = {
    email: session.email.toLowerCase().trim(),
    walletAddress: session.walletAddress,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
    nonce: randomBytes(16).toString('base64url'),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function setSessionCookie(response: NextResponse, session: AuthenticatedSession): void {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function requireSession(request: NextRequest): GuardResult {
  const session = readSession(request);
  return session ? { session } : { response: unauthorized() };
}

export function requireMutationSession(request: NextRequest): GuardResult {
  const guard = requireSession(request);
  if ('response' in guard) return guard;
  if (!hasTrustedOrigin(request)) {
    return { response: NextResponse.json({ ok: false, error: 'Invalid request origin' }, { status: 403 }) };
  }
  return guard;
}

export function requireServiceToken(request: NextRequest): NextResponse | null {
  const expected = process.env.ROVA_SCHEDULER_TOKEN;
  const supplied = request.headers.get('authorization');
  if (!expected || expected.length < 32) {
    console.error('[Auth] ROVA_SCHEDULER_TOKEN is not configured');
    return NextResponse.json({ ok: false, error: 'Scheduler is not configured' }, { status: 503 });
  }
  if (supplied !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'Scheduler authorization required' }, { status: 401 });
  }
  return null;
}

export function requireAdminToken(request: NextRequest): NextResponse | null {
  const expected = process.env.ROVA_ADMIN_TOKEN;
  const supplied = request.headers.get('authorization');
  if (!expected || expected.length < 32) {
    console.error('[Auth] ROVA_ADMIN_TOKEN is not configured');
    return NextResponse.json({ ok: false, error: 'Admin controls are not configured' }, { status: 503 });
  }
  if (supplied !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'Admin authorization required' }, { status: 401 });
  }
  return null;
}
