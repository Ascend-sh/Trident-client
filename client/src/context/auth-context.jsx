import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE = '/api/v1/client';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === 'string' ? data : data?.error || data?.message || 'request_failed';
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function login({ email, password }) {
  return request('/login', { method: 'POST', body: { email, password } });
}

export function register({ username, email, password }) {
  return request('/register', { method: 'POST', body: { username, email, password } });
}

export function logout() {
  return request('/logout', { method: 'POST' });
}

export function account() {
  return request('/account');
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await account();
      setData(res);
      setStatus('authenticated');
      return res;
    } catch (err) {
      setData(null);
      setStatus('unauthenticated');
      throw err;
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const value = useMemo(() => {
    return {
      status,
      data,
      user: data?.user || null,
      balance: data?.balance ?? 0,
      currencyName: data?.currencyName ?? 'TQN',
      isAdmin: Boolean(data?.user?.isAdmin),
      refresh
    };
  }, [status, data, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
