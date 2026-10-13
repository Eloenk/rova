import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// ── Cookie names ────────────────────────────────────────────────────────────
const ACCESS_COOKIE  = 'rova_access';
const REFRESH_COOKIE = 'rova_refresh';

// ── Token lifetimes ─────────────────────────────────────────────────────────
const ACCESS_TTL_SECONDS  = 15 * 60;          // 15 minutes — stateless verify
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days   — stored in DB

// ── Shared types ─────────────────────────────────────────────────────────────
export interface AuthenticatedSession {
  email: string;
  walletAddress?: string;
}

type GuardResult =
  | { session: AuthenticatedSession }
  | { response: NextResponse };

// ── Secret key ───────────────────────────────────────────────────────────────
function getSigningKey(): Uint8Array {
  const secret = process.env.ROVA_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ROVA_SESSION_SECRET must be set with at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export function hasSessionSecret(): boolean {
  return Boolean(
    process.env.ROVA_SESSION_SECRET &&
    process.env.ROVA_SESSION_SECRET.length >= 32
  );
}

// ── Access token (JWT, stateless) ────────────────────────────────────────────

async function signAccessToken(session: AuthenticatedSession): Promise<string> {
  return new SignJWT({
    email:         session.email.toLowerCase().trim(),
    walletAddress: session.walletAddress ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getSigningKey());
}

async function verifyAccessToken(token: string): Promise<AuthenticatedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ['HS256'],
    });
    if (typeof payload.email !== 'string') return null;
    return {
      email:         payload.email,
      walletAddress: typeof payload.walletAddress === 'string'
        ? payload.walletAddress
        : undefined,
    };
  } catch {
    return null;
  }
}

// ── Refresh token (opaque, DB-backed) ────────────────────────────────────────

function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(email: string, rawToken: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000).toISOString();

  await supabase.from('refresh_tokens').upsert(
    { email, token_hash: tokenHash, expires_at: expiresAt },
    { onConflict: 'email' }
  );
}

async function consumeRefreshToken(
  rawToken: string
): Promise<AuthenticatedSession | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const tokenHash = hashRefreshToken(rawToken);
  const nowIso    = new Date().toISOString();

  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('email, expires_at')
    .eq('token_hash', tokenHash)
    .gte('expires_at', nowIso)
    .single();

  if (error || !data) return null;

  // Rotate: delete the used token immediately (prevents replay)
  await supabase.from('refresh_tokens').delete().eq('token_hash', tokenHash);

  return { email: data.email };
}

async function revokeRefreshToken(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from('refresh_tokens').delete().eq('email', email);
}

// ── Cookie helpers ───────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production';

export async function setSessionCookies(
  response: NextResponse,
  session: AuthenticatedSession
): Promise<void> {
  const accessToken  = await signAccessToken(session);
  const refreshToken = generateRefreshToken();

  await storeRefreshToken(session.email, refreshToken);

  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'strict',
    path:     '/',
    maxAge:   ACCESS_TTL_SECONDS,
  });

  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'strict',
    path:     '/api/auth',  // scope to auth routes only
    maxAge:   REFRESH_TTL_SECONDS,
  });
}

// Keep old name as alias so existing callers don't break immediately
/** @deprecated Use setSessionCookies (async) */
export function setSessionCookie(
  response: NextResponse,
  session: AuthenticatedSession
): void {
  // Fire-and-forget async — caller should migrate to setSessionCookies
  setSessionCookies(response, session).catch((err) =>
    console.error('[Auth] setSessionCookie error:', err)
  );
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'strict',
    path:     '/',
    maxAge:   0,
  });
  response.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'strict',
    path:     '/api/auth',
    maxAge:   0,
  });
}

/** @deprecated Use clearSessionCookies */
export const clearSessionCookie = clearSessionCookies;

// ── Session reading ──────────────────────────────────────────────────────────

async function readSession(
  request: NextRequest
): Promise<AuthenticatedSession | null> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    const session = await verifyAccessToken(accessToken);
    if (session) return session;
  }
  // Access token missing or expired — caller should trigger refresh
  return null;
}

// ── Public guards ────────────────────────────────────────────────────────────

export async function requireSession(
  request: NextRequest
): Promise<GuardResult> {
  const session = await readSession(request);
  if (session) return { session };
  return {
    response: NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 }
    ),
  };
}

export async function requireMutationSession(
  request: NextRequest
): Promise<GuardResult> {
  const guard = await requireSession(request);
  if ('response' in guard) return guard;
  if (!hasTrustedOrigin(request)) {
    return {
      response: NextResponse.json(
        { ok: false, error: 'Invalid request origin' },
        { status: 403 }
      ),
    };
  }
  return guard;
}

export function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return origin === request.nextUrl.origin;
}

// ── Refresh handler (called from /api/auth/refresh) ─────────────────────────

export async function handleTokenRefresh(
  request: NextRequest
): Promise<NextResponse> {
  const rawToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!rawToken) {
    return NextResponse.json(
      { ok: false, error: 'No refresh token' },
      { status: 401 }
    );
  }

  const session = await consumeRefreshToken(rawToken);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
  }

  // Issue fresh pair
  const response = NextResponse.json({ ok: true });
  await setSessionCookies(response, session);
  return response;
}

// ── Logout handler ───────────────────────────────────────────────────────────

export async function handleLogout(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let email: string | undefined;

  if (accessToken) {
    const session = await verifyAccessToken(accessToken);
    email = session?.email;
  }

  if (email) {
    await revokeRefreshToken(email);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}

// ── Service / admin token guards ─────────────────────────────────────────────

export function requireServiceToken(request: NextRequest): NextResponse | null {
  const expected = process.env.ROVA_SCHEDULER_TOKEN;
  const supplied  = request.headers.get('authorization');
  if (!expected || expected.length < 32) {
    console.error('[Auth] ROVA_SCHEDULER_TOKEN is not configured');
    return NextResponse.json(
      { ok: false, error: 'Scheduler is not configured' },
      { status: 503 }
    );
  }
  if (supplied !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: 'Scheduler authorization required' },
      { status: 401 }
    );
  }
  return null;
}

export function requireAdminToken(request: NextRequest): NextResponse | null {
  const expected = process.env.ROVA_ADMIN_TOKEN;
  const supplied  = request.headers.get('authorization');
  if (!expected || expected.length < 32) {
    console.error('[Auth] ROVA_ADMIN_TOKEN is not configured');
    return NextResponse.json(
      { ok: false, error: 'Admin controls are not configured' },
      { status: 503 }
    );
  }
  if (supplied !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: 'Admin authorization required' },
      { status: 401 }
    );
  }
  return null;
}

// ── Legacy compat (sync createSessionToken — only used in tests/scripts) ─────
export function createSessionToken(_session: AuthenticatedSession): string {
  throw new Error(
    'createSessionToken is removed. Use setSessionCookies (async) instead.'
  );
}
