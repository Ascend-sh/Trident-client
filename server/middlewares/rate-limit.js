import { HTTP_STATUS, tooManyRequests } from './error-handler.js';

function nowMs() {
  return Date.now();
}

function getClientIp(request) {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }

  const xr = request.headers.get('x-real-ip');
  if (xr) return String(xr).trim();

  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return String(cf).trim();

  return 'unknown';
}

export function createRateLimiter({ windowMs = 60_000, limit = 240 } = {}) {
  const buckets = new Map();

  function gc(cutoff) {
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= cutoff) buckets.delete(key);
    }
  }

  return function checkRateLimit({ request, set }) {
    const key = getClientIp(request);
    const now = nowMs();

    const existing = buckets.get(key);
    const bucket = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;

    bucket.count += 1;
    buckets.set(key, bucket);

    if (buckets.size > 10_000) gc(now);

    if (bucket.count > limit) {
      const retryAfterSeconds = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
      set.status = HTTP_STATUS.TOO_MANY_REQUESTS;
      set.headers ||= {};
      set.headers['retry-after'] = String(retryAfterSeconds);
      return tooManyRequests('rate_limited').body;
    }

    return null;
  };
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : null;
}

function envRpm() {
  const n = toInt(process.env.TRIDENT_RATE_LIMIT_RPM);
  return n && n > 0 ? n : 240;
}

function envWindowMs() {
  const n = toInt(process.env.TRIDENT_RATE_LIMIT_WINDOW_MS);
  return n && n > 0 ? n : 60_000;
}

export const checkRateLimit = createRateLimiter({
  limit: envRpm(),
  windowMs: envWindowMs(),
});

export const checkAuthRateLimit = createRateLimiter({
  limit: 35,
  windowMs: envWindowMs(),
});
