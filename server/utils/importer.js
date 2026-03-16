const panelUrl = (process.env.PTERODACTYL_PANEL_URL ?? '').trim().replace(/\/+$/, '');

function assertConfigured(value, name) {
  if (!value) throw new Error(`${name} is not set`);
}

function buildUrl(path) {
  assertConfigured(panelUrl, 'PTERODACTYL_PANEL_URL');
  const cleanPath = String(path ?? '').trim();
  if (!cleanPath) throw new Error('path is required');
  return cleanPath.startsWith('http') ? cleanPath : `${panelUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
}

function buildHeaders(apiKey, extra) {
  assertConfigured(apiKey, 'apiKey');
  return {
    Accept: 'Application/vnd.pterodactyl.v1+json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    ...(extra && typeof extra === 'object' ? extra : {})
  };
}

const cache = new Map();
const inflight = new Map();
const TTL = 10000;

async function request({ url, method = 'GET', headers, query, body, signal }) {
  const u = new URL(url);
  if (query && typeof query === 'object') {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      u.searchParams.set(k, String(v));
    }
  }

  const cacheKey = `${method}:${u.toString()}:${JSON.stringify(headers)}:${JSON.stringify(body)}`;
  
  if (method !== 'GET') {
    cache.clear();
  }

  if (method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL) {
      return cached.data;
    }

    const pending = inflight.get(cacheKey);
    if (pending) return pending;
  }

  const execute = async () => {
    try {
      const init = {
        method,
        headers,
        signal
      };

      if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);

      const res = await fetch(u, init);
      const contentType = res.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

      if (!res.ok) {
        const err = new Error(`Pterodactyl request failed: ${res.status} ${res.statusText}`);
        err.status = res.status;
        err.payload = payload;
        throw err;
      }

      if (method === 'GET') {
        cache.set(cacheKey, { ts: Date.now(), data: payload });
      }

      return payload;
    } finally {
      if (method === 'GET') inflight.delete(cacheKey);
    }
  };

  if (method === 'GET') {
    const promise = execute();
    inflight.set(cacheKey, promise);
    return promise;
  }

  return execute();
}

export function pteroApplicationRequest({ path, method, query, body, signal, headers }) {
  const apiKey = (process.env.PTERODACTYL_APPLICATION_KEY ?? '').trim();
  assertConfigured(apiKey, 'PTERODACTYL_APPLICATION_KEY');
  const url = buildUrl(path);
  return request({ url, method, headers: buildHeaders(apiKey, headers), query, body, signal });
}

export function pteroClientRequest({ path, method, query, body, signal, headers }) {
  const apiKey = (process.env.PTERODACTYL_CLIENT_API_KEY ?? '').trim();
  assertConfigured(apiKey, 'PTERODACTYL_CLIENT_API_KEY');
  const url = buildUrl(path);
  return request({ url, method, headers: buildHeaders(apiKey, headers), query, body, signal });
}
