import { and, eq, gt, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from '../db/client.js';
import { eggs, locationNodes, locations, nestEggs, nests, servers, sessions, users } from '../db/schema.js';
import { HTTP_STATUS, ok, unauthorized } from '../middlewares/error-handler.js';
import { verifyJwt } from '../utils/jwt.js';
import { getServerDefaults } from '../utils/configuration.js';
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

export async function listNestsCli({ full = false } = {}) {
  const nestRows = await db.select().from(nests);
  const mappingRows = await db.select().from(nestEggs);
  const eggRows = await db.select().from(eggs);

  const eggById = new Map(eggRows.map(e => {
    let envVarCount = 0;
    let envVars = [];
    try {
      const parsed = JSON.parse(e.envVars || '[]');
      if (Array.isArray(parsed)) {
        envVarCount = parsed.length;
        envVars = parsed;
      }
    } catch {
      envVarCount = 0;
      envVars = [];
    }

    return [
      e.id,
      {
        id: e.id,
        nestId: e.nestId,
        uuid: e.uuid,
        name: e.name,
        description: e.description,
        dockerImage: e.dockerImage,
        startup: e.startup,
        author: e.author,
        envVarCount,
        ...(full ? { envVars } : {}),
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      }
    ];
  }));
  const eggIdsByNest = new Map();

  for (const m of mappingRows) {
    if (!eggIdsByNest.has(m.nestId)) eggIdsByNest.set(m.nestId, []);
    eggIdsByNest.get(m.nestId).push(m.eggId);
  }

  return nestRows.map(n => ({
    id: n.id,
    name: n.name,
    eggs: (eggIdsByNest.get(n.id) || []).map(id => eggById.get(id)).filter(Boolean)
  }));
}

async function fetchImportedLocationsFromApi() {
  const base = String(process.env.TORQEN_CLI_BASE_URL ?? 'http://localhost:3000').trim().replace(/\/+$/, '');
  const token = String(process.env.TORQEN_CLI_TOKEN ?? '').trim();
  if (!token) return null;

  const res = await fetch(`${base}/api/v1/client/admin/imported-locations`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(payload?.error || payload?.message || 'request_failed');
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload?.locations || [];
}

export async function listLocationsCli() {
  const fromApi = await fetchImportedLocationsFromApi();
  if (fromApi) return fromApi;

  const locationRows = await db.select().from(locations);
  const nodeRows = await db.select().from(locationNodes);

  const nodesByLocationId = new Map();
  for (const node of nodeRows) {
    if (!nodesByLocationId.has(node.locationId)) nodesByLocationId.set(node.locationId, []);
    nodesByLocationId.get(node.locationId).push({
      id: node.id,
      name: node.name,
      fqdn: node.fqdn,
      description: node.description
    });
  }

  return locationRows.map(loc => ({
    id: loc.id,
    shortCode: loc.shortCode,
    description: loc.description,
    nodes: nodesByLocationId.get(loc.id) || []
  }));
}

export async function listServersCli() {
  const serverRows = await db.select().from(servers);
  const userRows = await db.select({ id: users.id, username: users.username, email: users.email }).from(users);

  const userById = new Map(userRows.map(u => [u.id, u]));

  return serverRows.map(s => {
    const u = userById.get(s.userId);
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      userId: s.userId,
      username: u?.username || null,
      email: u?.email || null,
      pteroServerId: s.pteroServerId,
      pteroIdentifier: s.pteroIdentifier,
      pteroUuid: s.pteroUuid,
      locationId: s.locationId,
      nodeId: s.nodeId,
      eggId: s.eggId,
      suspended: s.suspended,
      status: s.status,
      createdAt: s.createdAt
    };
  });
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

export async function resetCli() {
  const tables = [
    'servers',
    'location_nodes',
    'locations',
    'nest_eggs',
    'eggs',
    'nests',
    'wallets',
    'economy_settings',
    'server_defaults',
    'sessions',
    'users',
    '__drizzle_migrations'
  ];

  for (const name of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS \`${name}\``));
  }

  migrate(db, { migrationsFolder: './server/db/migrations' });
  return { ok: true };
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

export function helpCli() {
  console.log('Torqen CLI - Available Commands:');
  console.log('');
  const commands = [
    { cmd: 'help', desc: 'Show this help message' },
    { cmd: 'users', desc: 'List all registered users' },
    { cmd: 'sessions', desc: 'List all active and expired sessions' },
    { cmd: 'nests', desc: 'List all nests and their associated eggs' },
    { cmd: 'locations', desc: 'List all physical locations and nodes' },
    { cmd: 'default-resources', desc: 'Show default server resource configurations' },
    { cmd: 'servers', desc: 'List all provisioned instances' },
    { cmd: 'user-delete=<id>', desc: 'Delete a user and all their sessions by ID' },
    { cmd: 'status', desc: 'Check the health of the database and API' },
    { cmd: 'reset', desc: 'WIPE ALL DATA and re-run migrations' }
  ];

  commands.forEach(c => {
    console.log(`  ${c.cmd.padEnd(20)} ${c.desc}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  bun server/modules/cli.js user-delete=1');
  console.log('  bun run cli:status');
}

async function main() {
  const args = process.argv.slice(2);
  const raw = args[0] ?? '';
  const [cmd, inline] = String(raw).split('=');
  const arg1 = inline ?? args[1] ?? (cmd === '' && args[0] ? args[0] : undefined);

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    helpCli();
    process.exit(0);
  }

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

  if (cmd === 'nests') {
    const full = args.includes('--full');
    const rows = await listNestsCli({ full });
    console.log(JSON.stringify({ ok: true, nests: rows }, null, 2));
    process.exit(0);
  }

  if (cmd === 'locations') {
    const rows = await listLocationsCli();
    console.log(JSON.stringify({ ok: true, locations: rows }, null, 2));
    process.exit(0);
  }

  if (cmd === 'default-resources') {
    const defaults = await getServerDefaults();
    console.log(JSON.stringify({ ok: true, defaults }, null, 2));
    process.exit(0);
  }

  if (cmd === 'servers') {
    const rows = await listServersCli();
    console.log(JSON.stringify({ ok: true, servers: rows }, null, 2));
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

  if (cmd === 'reset') {
    const res = await resetCli();
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  }

  if (cmd !== '') console.error(`Unknown command: ${cmd}`);
  helpCli();
  process.exit(cmd === '' ? 0 : 1);
}

if (import.meta.main) {
  await main();
}
