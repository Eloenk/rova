import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { requireSecret, serverEnv } from '@/lib/env/server';

// ── Cookie names ────────────────────────────────────────────────────────────
const ACCESS_COOKIE  = 'rova_access';
const REFRESH_COOKIE = 'rova_refresh';

// ── Token lifetimes ─────────────────────────────────────────────────────────
const ACCESS_TTL_SECONDS  = 15 * 60;          // 15 minutes — stateless verify
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days   — stored in DB
const JWT_ISSUER = 'rova-web';
const JWT_AUDIENCE = 'rova-session';

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
  const secret = requireSecret(serverEnv.sessionSecret, 'ROVA_SESSION_SECRET', 32);
  return new TextEncoder().encode(secret);
}
export function hasSessionSecret(): boolean {
  return serverEnv.sessionSecret.length >= 32;
}

// ── Access token (JWT, stateless) ────────────────────────────────────────────

async function signAccessToken(session: AuthenticatedSession): Promise<string> {
  const email = session.email.toLowerCase().trim();
  return new SignJWT({
    email,
    walletAddress: session.walletAddress ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(email)
    .setJti(randomBytes(16).toString('hex'))
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getSigningKey());
}

async function verifyAccessToken(token: string): Promise<AuthenticatedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (typeof payload.email !== 'string' || payload.sub !== payload.email) return null;
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

async function storeRefreshToken(email: string, rawToken: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000).toISOString();

  const { error } = await supabase.from('refresh_tokens').upsert(
    { email, token_hash: tokenHash, expires_at: expiresAt },
    { onConflict: 'email' }
  );
  if (error) throw new Error('Unable to persist refresh session');
  return true;
}

async function consumeRefreshToken(
  rawToken: string
): Promise<AuthenticatedSession | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const tokenHash = hashRefreshToken(rawToken);
  const { data, error } = await supabase
    .rpc('consume_refresh_token', { requested_token_hash: tokenHash });

  const consumed = Array.isArray(data) ? data[0] : data;
  if (error || !consumed?.email) return null;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('circle_wallet_address')
    .eq('email', consumed.email)
    .single();
  if (userError) return null;
  return {
    email: consumed.email,
    walletAddress: user?.circle_wallet_address || undefined,
  };
}

async function revokeRefreshToken(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from('refresh_tokens').delete().eq('email', email);
}

// ── Cookie helpers ───────────────────────────────────────────────────────────

const isProduction = serverEnv.isProduction;

export async function setSessionCookies(
  response: NextResponse,
  session: AuthenticatedSession
): Promise<void> {
  const accessToken  = await signAccessToken(session);
  const refreshToken = generateRefreshToken();

  const refreshStored = await storeRefreshToken(session.email, refreshToken);

  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'strict',
    path:     '/',
    maxAge:   ACCESS_TTL_SECONDS,
  });

  if (refreshStored) {
    response.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure:   isProduction,
      sameSite: 'strict',
      path:     '/api/auth',
      maxAge:   REFRESH_TTL_SECONDS,
    });
  }
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
    const response = NextResponse.json(
      { ok: false, error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
    clearSessionCookies(response);
    return response;
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

function hasValidBearer(request: NextRequest, expected: string): boolean {
  const supplied = request.headers.get('authorization') || '';
  const expectedHeader = `Bearer ${expected}`;
  if (supplied.length !== expectedHeader.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expectedHeader));
}
export function requireAdminToken(request: NextRequest): NextResponse | null {
  const expected = serverEnv.adminToken;
  if (!expected || expected.length < 32) {
    console.error('[Auth] ROVA_ADMIN_TOKEN is not configured');
    return NextResponse.json(
      { ok: false, error: 'Admin controls are not configured' },
      { status: 503 }
    );
  }
  if (!hasValidBearer(request, expected)) {
    return NextResponse.json(
      { ok: false, error: 'Admin authorization required' },
      { status: 401 }
    );
  }
  return null;
}
