import { eq, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { ensureWallet } from '../utils/economy.js';
import { pteroApplicationRequest } from '../utils/importer.js';
import { HTTP_STATUS, badGateway, badRequest, ok, unauthorized, unprocessable } from '../middlewares/error-handler.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';
import { authLogger } from '../middlewares/logger.js';

const COOKIE_NAME = 'torqen_session';

function sessionTtlDays() {
  const raw = process.env.TORQEN_SESSION_TTL_DAYS;
  const n = Number.parseFloat(String(raw ?? ''));
  return Number.isFinite(n) && n > 0 ? n : 2;
}

const SESSION_TTL_MS = Math.floor(1000 * 60 * 60 * 24 * sessionTtlDays());

function jwtSecret() {
  const secret = process.env.TORQEN_JWT_SECRET;
  return secret ? String(secret) : null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  };
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

async function createPterodactylUser({ username, email, password, firstName = 'signup', lastName = 'torqen' }) {
  const cleanUsername = String(username ?? '').trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanUsername || !cleanEmail) throw new Error('invalid_input');

  const body = {
    email: cleanEmail,
    username: cleanUsername,
    first_name: String(firstName ?? 'signup'),
    last_name: String(lastName ?? 'torqen'),
    language: 'en',
    root_admin: false
  };

  if (password) body.password = String(password);

  const res = await pteroApplicationRequest({ path: '/api/application/users', method: 'POST', body });
  const id = res?.attributes?.id;
  return { id, raw: res };
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    isAdmin: Boolean(row.isAdmin),
    createdAt: row.createdAt
  };
}

async function fetchPteroAdminByEmail(email) {
  try {
    const res = await pteroApplicationRequest({
      path: '/api/application/users',
      method: 'GET',
      query: { 'filter[email]': email }
    });

    const data = res?.data;
    if (!Array.isArray(data) || data.length === 0) return null;

    const attrs = data[0]?.attributes;
    return attrs ? Boolean(attrs.root_admin) : null;
  } catch {
    return null;
  }
}

function parseBearer(header) {
  const value = String(header ?? '');
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function authCookieName() {
  return COOKIE_NAME;
}

export function authCookieOptions() {
  return cookieOptions();
}

async function createSession(userId) {
  const secret = jwtSecret();
  if (!secret) return null;

  const now = Date.now();
  const id = crypto.randomUUID();
  const expiresAt = new Date(now + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id,
    userId: Number(userId),
    createdAt: new Date(now),
    expiresAt
  });

  const token = await signJwt(
    { sid: id },
    secret,
    { expiresInSeconds: Math.floor(SESSION_TTL_MS / 1000) }
  );

  return { id, token, expiresAt };
}

async function sessionFromJwt(token) {
  const secret = jwtSecret();
  if (!secret) return null;

  const payload = await verifyJwt(token, secret);
  const sid = payload?.sid;
  if (!sid) return null;

  const found = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, String(sid)))
    .limit(1);

  const session = found[0] ?? null;
  if (!session) return null;

  const nowMs = Date.now();
  const expiresMs = new Date(session.expiresAt).getTime();
  if (expiresMs <= nowMs) {
    await db.delete(sessions).where(eq(sessions.id, String(sid)));
    authLogger.info('session_expired', { meta: { sessionId: sid, userId: session.userId, expiresAt: session.expiresAt } });
    return null;
  }

  return session;
}

export async function logout({ token }) {
  const res = ok({}, HTTP_STATUS.OK);
  if (!token) return res;

  const secret = jwtSecret();
  if (!secret) return res;

  const payload = await verifyJwt(token, secret);
  const sid = payload?.sid;
  if (!sid) return res;

  await db.delete(sessions).where(eq(sessions.id, String(sid)));
  return res;
}

export async function register({ username, email, password }) {
  const cleanUsername = String(username ?? '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password ?? '');

  if (!cleanUsername || !cleanEmail || !cleanPassword) {
    return badRequest('invalid_input');
  }

  const passwordHash = await Bun.password.hash(cleanPassword);
  const panelPassword = crypto.randomUUID();

  try {
    await createPterodactylUser({ username: cleanUsername, email: cleanEmail, password: panelPassword, firstName: 'signup', lastName: 'torqen' });
  } catch {
    return badGateway('pterodactyl_create_user_failed');
  }

  try {
    const inserted = await db
      .insert(users)
      .values({ username: cleanUsername, email: cleanEmail, password: passwordHash })
      .returning();

    const user = inserted[0];

    if (user?.id) {
      await ensureWallet(user.id);
    }

    return ok({ user: publicUser(user) }, HTTP_STATUS.OK);
  } catch {
    return unprocessable('user_exists');
  }
}

export async function login({ email, password }) {
  const identifier = String(email ?? '').trim();
  const cleanPassword = String(password ?? '');

  if (!identifier || !cleanPassword) {
    return badRequest('invalid_input');
  }

  const cleanIdentifier = identifier.includes('@') ? normalizeEmail(identifier) : identifier;

  const found = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, cleanIdentifier),
        eq(users.username, cleanIdentifier)
      )
    )
    .limit(1);
  const user = found[0];

  if (!user) {
    return unauthorized('invalid_credentials');
  }

  const okPassword = await Bun.password.verify(cleanPassword, user.password);
  if (!okPassword) {
    return unauthorized('invalid_credentials');
  }

  const panelIsAdmin = await fetchPteroAdminByEmail(user.email);
  if (panelIsAdmin !== null && Boolean(user.isAdmin) !== panelIsAdmin) {
    await db.update(users).set({ isAdmin: panelIsAdmin }).where(eq(users.id, user.id));
    user.isAdmin = panelIsAdmin;
  }

  const session = await createSession(user.id);
  if (!session) {
    return badGateway('missing_jwt_secret');
  }

  return ok({ token: session.token, user: publicUser(user), expiresAt: session.expiresAt }, HTTP_STATUS.OK);
}

export async function account({ authorization, cookieToken }) {
  const bearer = parseBearer(authorization);
  const token = cookieToken || bearer;

  if (!token) {
    return unauthorized('unauthorized');
  }

  const session = await sessionFromJwt(token);
  if (!session) {
    return unauthorized('unauthorized');
  }

  const found = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = found[0];

  if (!user) {
    return unauthorized('unauthorized');
  }

  try {
    const panelIsAdmin = await fetchPteroAdminByEmail(user.email);
    if (panelIsAdmin !== null && panelIsAdmin !== user.isAdmin) {
      await db.update(users).set({ isAdmin: panelIsAdmin }).where(eq(users.id, user.id));
      user.isAdmin = panelIsAdmin;
    }
  } catch {
  }

  return ok({ user: publicUser(user) }, HTTP_STATUS.OK);
}
