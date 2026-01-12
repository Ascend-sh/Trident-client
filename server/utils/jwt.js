function base64UrlEncode(bytes) {
  const b64 = Buffer.from(bytes).toString('base64');
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlEncodeJson(obj) {
  return base64UrlEncode(Buffer.from(JSON.stringify(obj)));
}

function base64UrlDecodeToString(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    Buffer.from(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, Buffer.from(data));
  return new Uint8Array(sig);
}

export async function signJwt(payload, secret, { expiresInSeconds } = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now };
  if (expiresInSeconds) body.exp = now + Number(expiresInSeconds);

  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(body);
  const data = `${encodedHeader}.${encodedPayload}`;
  const sig = await hmacSha256(secret, data);
  const encodedSig = base64UrlEncode(sig);
  return `${data}.${encodedSig}`;
}

export async function verifyJwt(token, secret) {
  const value = String(token ?? '');
  const parts = value.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSig = base64UrlEncode(await hmacSha256(secret, data));
  if (expectedSig !== encodedSig) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(encodedPayload));
  } catch {
    return null;
  }

  if (payload?.exp && Math.floor(Date.now() / 1000) > Number(payload.exp)) return null;
  return payload;
}
