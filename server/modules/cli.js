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

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

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

  console.error('Unknown command');
  console.error('Usage: bun server/modules/cli.js users|sessions');
  process.exit(1);
}

if (import.meta.main) {
  await main();
}
