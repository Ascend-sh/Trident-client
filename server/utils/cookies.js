export function parseCookies(header) {
  const raw = String(header ?? '');
  const out = {};
  raw.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return;
    out[key] = decodeURIComponent(value);
  });
  return out;
}

export function serializeCookie(name, value, options = {}) {
  const enc = encodeURIComponent(String(value ?? ''));
  const parts = [`${name}=${enc}`];

  if (options.maxAge != null) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');
  if (options.httpOnly) parts.push('HttpOnly');

  return parts.join('; ');
}

export function appendSetCookie(set, cookie) {
  const key = 'set-cookie';
  const prev = set.headers?.[key] ?? set.headers?.['Set-Cookie'];
  if (!prev) {
    set.headers[key] = cookie;
    return;
  }
  if (Array.isArray(prev)) {
    set.headers[key] = [...prev, cookie];
    return;
  }
  set.headers[key] = [prev, cookie];
}
