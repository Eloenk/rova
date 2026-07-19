const store = new Map<string, number[]>();

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter(t => t > now - windowMs);
  const allowed = timestamps.length < limit;
  if (allowed) { timestamps.push(now); store.set(key, timestamps); }
  return { allowed, remaining: Math.max(0, limit - timestamps.length) };
}

export function getClientIp(req: Request): string {
  return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}
