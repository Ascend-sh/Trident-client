import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { HTTP_STATUS, ok, unauthorized } from '../middlewares/error-handler.js';
import { verifyJwt } from '../utils/jwt.js';

function jwtSecret() {
  const secret = process.env.TORQEN_JWT_SECRET;
  return secret ? String(secret) : null;
}

function parseBearer(header) {
  const value = String(header ?? '');
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function sessionFromJwt(token) {
  const secret = jwtSecret();
  if (!secret) return null;

  const payload = await verifyJwt(token, secret);
  const sid = payload?.sid;
  if (!sid) return null;

  const now = new Date();
  const found = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, String(sid)), gt(sessions.expiresAt, now)))
    .limit(1);

  return found[0] ?? null;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function listUsers({ authorization, cookieToken } = {}) {
  const bearer = parseBearer(authorization);
  const token = cookieToken || bearer;
  if (!token) return unauthorized('unauthorized');

  const session = await sessionFromJwt(token);
  if (!session) return unauthorized('unauthorized');

  const rows = await db.select().from(users);
  return ok({ users: rows.map(publicUser) }, HTTP_STATUS.OK);
}

export async function listUsersCli() {
  const rows = await db.select().from(users);
  return rows.map(publicUser);
}

export async function listSessionsCli() {
  const rows = await db.select().from(sessions);
  const now = Date.now();

  const mapped = rows.map(s => ({
    id: s.id,
    userId: s.userId,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    expired: new Date(s.expiresAt).getTime() <= now,
  }));

  return {
    active: mapped.filter(s => !s.expired),
    expired: mapped.filter(s => s.expired),
  };
}

export async function deleteUserCli(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'invalid_user_id' };
  }

  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = found[0] ?? null;
  if (!user) {
    return { ok: false, error: 'user_not_found' };
  }

  await db.delete(sessions).where(eq(sessions.userId, id));
  await db.delete(users).where(eq(users.id, id));

  return { ok: true, deletedUserId: id };
}

export async function statusCli({ baseUrl } = {}) {
  const startedAt = Date.now();

  const dbStatus = { ok: false };
  try {
    const rows = await db.select().from(users).limit(1);
    dbStatus.ok = true;
    dbStatus.sampleUserId = rows[0]?.id ?? null;
  } catch (err) {
    dbStatus.ok = false;
    dbStatus.error = String(err?.message || err);
  }

  const httpStatus = { ok: false };
  const url = (baseUrl || process.env.TORQEN_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/+$/, '');
  try {
    const res = await fetch(`${url}/health`);
    httpStatus.status = res.status;
    httpStatus.ok = res.ok;
    httpStatus.body = await res.json().catch(() => null);
  } catch (err) {
    httpStatus.ok = false;
    httpStatus.error = String(err?.message || err);
  }

  return {
    ok: dbStatus.ok && httpStatus.ok,
    db: dbStatus,
    http: httpStatus,
    tookMs: Date.now() - startedAt,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const raw = args[0] ?? '';
  const [cmd, inline] = String(raw).split('=');
  const arg1 = inline ?? args[1] ?? (cmd === '' && args[0] ? args[0] : undefined);

  if (cmd === 'users') {
    const rows = await listUsersCli();
    console.log(JSON.stringify({ ok: true, users: rows }, null, 2));
    process.exit(0);
  }

  if (cmd === 'sessions') {
    const res = await listSessionsCli();
    console.log(JSON.stringify({ ok: true, ...res }, null, 2));
    process.exit(0);
  }

  if (cmd === 'user-delete') {
    const res = await deleteUserCli(arg1);
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  }

  if (cmd === 'status') {
    const res = await statusCli();
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  }

  console.error('Unknown command');
  console.error('Usage: bun server/modules/cli.js users|sessions|user-delete=<id>|status');
  console.error('Examples:');
  console.error('  bun server/modules/cli.js user-delete=123');
  console.error('  bun server/modules/cli.js user-delete 123');
  console.error('  bun run cli:user-delete -- 123');
  process.exit(1);
}

if (import.meta.main) {
  await main();
}
