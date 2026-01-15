import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { eggs, locations, servers } from '../db/schema.js';
import { getServerDefaults } from '../utils/configuration.js';
import { pteroApplicationRequest } from '../utils/importer.js';
import { getPteroServerWebsocket } from './server/websocket.js';
import { connectServerConsole } from './server/console.js';
import { sendPowerSignal } from './server/state.js';
import { listServerAllocations as listPteroServerAllocations } from './server/network.js';

async function resolvePteroUserIdByEmail(email) {
  const clean = String(email ?? '').trim().toLowerCase();
  if (!clean) throw new Error('email is required');

  const res = await pteroApplicationRequest({
    path: '/api/application/users',
    method: 'GET',
    query: { 'filter[email]': clean }
  });

  const data = res?.data;
  if (!Array.isArray(data) || data.length === 0) throw new Error('ptero_user_not_found');
  const id = data[0]?.attributes?.id;
  if (!Number.isInteger(id) || id <= 0) throw new Error('ptero_user_not_found');
  return id;
}

async function fetchAllPages(fetchPage, { perPage = 100 } = {}) {
  const first = await fetchPage({ page: 1, perPage });
  const data = Array.isArray(first?.data) ? first.data : [];
  const meta = first?.meta;
  const totalPages = Number(meta?.pagination?.total_pages ?? 1);

  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return data;
  }

  const pages = [];
  for (let p = 2; p <= totalPages; p++) pages.push(p);

  const rest = await Promise.all(pages.map(page => fetchPage({ page, perPage })));
  const merged = [...data];

  for (const r of rest) {
    if (Array.isArray(r?.data)) merged.push(...r.data);
  }

  return merged;
}

function fetchNodesPage({ page, perPage }) {
  return pteroApplicationRequest({
    path: '/api/application/nodes',
    query: { page, per_page: perPage, include: 'location' }
  });
}

function fetchAllocationsPage({ page, perPage, nodeId }) {
  return pteroApplicationRequest({
    path: `/api/application/nodes/${nodeId}/allocations`,
    query: { page, per_page: perPage }
  });
}

async function pickRandomNodeAndAllocationForLocation({ locationId }) {
  const locId = Number(locationId);
  if (!Number.isInteger(locId) || locId <= 0) throw new Error('locationId is required');

  const nodes = await fetchAllPages(fetchNodesPage, { perPage: 100 });
  const candidates = nodes
    .map(n => n?.attributes ?? {})
    .filter(a => Number(a.location_id) === locId)
    .map(a => Number(a.id))
    .filter(id => Number.isInteger(id) && id > 0);

  if (candidates.length === 0) throw new Error('no_nodes_available');

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }

  for (const nodeId of candidates) {
    const allocations = await fetchAllPages(({ page, perPage }) => fetchAllocationsPage({ page, perPage, nodeId }), { perPage: 100 });
    const free = allocations
      .map(a => a?.attributes ?? {})
      .filter(a => a.assigned === false)
      .map(a => Number(a.id))
      .filter(id => Number.isInteger(id) && id > 0);

    if (free.length) {
      const allocationId = free[Math.floor(Math.random() * free.length)];
      return { nodeId, allocationId };
    }
  }

  throw new Error('no_allocations_available');
}

async function fetchAllApplicationServers() {
  const first = await pteroApplicationRequest({ path: '/api/application/servers', method: 'GET', query: { per_page: 100, page: 1 } });
  const data = Array.isArray(first?.data) ? first.data : [];
  const meta = first?.meta;
  const totalPages = Number(meta?.pagination?.total_pages ?? 1);

  if (!Number.isFinite(totalPages) || totalPages <= 1) return data;

  const pages = [];
  for (let p = 2; p <= totalPages; p++) pages.push(p);

  const rest = await Promise.all(pages.map(page => pteroApplicationRequest({ path: '/api/application/servers', method: 'GET', query: { per_page: 100, page } }).catch(() => null)));
  const merged = [...data];

  for (const r of rest) {
    if (Array.isArray(r?.data)) merged.push(...r.data);
  }

  return merged;
}

export async function listUserServers({ userId }) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('userId is required');

  let serverRows = await db.select().from(servers).where(eq(servers.userId, id));
  if (serverRows.length === 0) return [];

  const panelServers = await fetchAllApplicationServers().catch(() => null);
  const panelIds = new Set(
    Array.isArray(panelServers)
      ? panelServers.map(s => Number(s?.attributes?.id)).filter(n => Number.isInteger(n) && n > 0)
      : []
  );

  if (panelIds.size) {
    const toDelete = serverRows.filter(s => !panelIds.has(Number(s.pteroServerId)));
    if (toDelete.length) {
      for (const s of toDelete) {
        await db.delete(servers).where(and(eq(servers.id, s.id), eq(servers.userId, id)));
      }
      serverRows = serverRows.filter(s => panelIds.has(Number(s.pteroServerId)));
    }
  }

  const eggRows = await db.select().from(eggs);
  const locationRows = await db.select().from(locations);

  const eggById = new Map(eggRows.map(e => [e.id, e]));
  const locationById = new Map(locationRows.map(l => [l.id, l]));

  return serverRows.map(s => {
    const egg = eggById.get(s.eggId);
    const loc = locationById.get(s.locationId);

    const memoryLimit = Number(s.limitMemory) || 0;
    const diskLimit = Number(s.limitDisk) || 0;
    const cpuLimit = Number(s.limitCpu) || 0;

    return {
      id: s.id,
      pteroServerId: s.pteroServerId,
      identifier: s.pteroIdentifier,
      uuid: s.pteroUuid,
      name: s.name,
      description: s.description,
      status: s.status,
      suspended: Boolean(s.suspended),
      egg: egg ? { id: egg.id, name: egg.name } : { id: s.eggId, name: null },
      location: loc ? { id: loc.id, shortCode: loc.shortCode, description: loc.description } : { id: s.locationId, shortCode: null, description: null },
      limits: {
        memory: memoryLimit,
        disk: diskLimit,
        cpu: cpuLimit
      },
      usage: {
        memoryPercent: memoryLimit ? 0 : 0,
        diskPercent: diskLimit ? 0 : 0,
        cpuPercent: cpuLimit ? 0 : 0
      },
      createdAt: s.createdAt
    };
  });
}

export async function createServer({ userId, userEmail, name, description = '', locationId, eggId, dockerImage = null, startup = null, nestId = null }) {
  const uid = Number(userId);
  const locId = Number(locationId);
  const eId = Number(eggId);
  const serverName = String(name ?? '').trim();

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!serverName) throw new Error('name is required');
  if (!Number.isInteger(locId) || locId <= 0) throw new Error('locationId is required');
  if (!Number.isInteger(eId) || eId <= 0) throw new Error('eggId is required');

  const defaults = await getServerDefaults();

  const eggRow = await db.select().from(eggs).where(eq(eggs.id, eId)).limit(1);
  const importedEgg = eggRow[0] || null;

  const resolvedDockerImage = dockerImage || importedEgg?.dockerImage || undefined;
  const resolvedStartup = startup || importedEgg?.startup || undefined;
  const resolvedNestId = nestId || importedEgg?.nestId || null;

  const env = {};

  const buildEnvFromVars = (varsList) => {
    const out = {};
    for (const v of varsList) {
      const key = String(v?.env_variable ?? '').trim();
      if (!key) continue;

      const rawDefault = v?.default_value;
      const rules = String(v?.rules ?? '').toLowerCase();
      const required = rules.split('|').includes('required');

      if (rawDefault === undefined || rawDefault === null) {
        out[key] = required ? 'latest' : '';
        continue;
      }

      const str = String(rawDefault);
      out[key] = required && !str ? 'latest' : str;
    }
    return out;
  };

  let vars = [];
  try {
    const parsed = JSON.parse(importedEgg?.envVars || '[]');
    if (Array.isArray(parsed)) vars = parsed;
  } catch {
    vars = [];
  }

  Object.assign(env, buildEnvFromVars(vars));

  if (!Object.keys(env).length) {
    const resolvedNest = Number(resolvedNestId || importedEgg?.nestId || 0);
    if (Number.isInteger(resolvedNest) && resolvedNest > 0) {
      const live = await pteroApplicationRequest({
        path: `/api/application/nests/${resolvedNest}/eggs/${eId}`,
        query: { include: 'variables' }
      });

      const varsList = live?.attributes?.relationships?.variables?.data;
      if (Array.isArray(varsList)) {
        const extracted = varsList.map(v => v?.attributes).filter(Boolean);
        Object.assign(env, buildEnvFromVars(extracted));
      }
    }
  }

  if (!Object.keys(env).length) {
    throw new Error('egg_env_vars_missing');
  }

  const pteroUserId = await resolvePteroUserIdByEmail(userEmail);
  const picked = await pickRandomNodeAndAllocationForLocation({ locationId: locId });
  const nodeId = picked.nodeId;
  const allocationId = picked.allocationId;

  const io = Math.min(1000, Math.max(10, Number(defaults.io) || 500));
  const featureAllocations = Math.max(1, Number(defaults.allocations) || 1);

  const payload = {
    name: serverName,
    description: String(description ?? ''),
    user: pteroUserId,
    egg: eId,
    docker_image: resolvedDockerImage,
    startup: resolvedStartup,
    environment: env,
    limits: {
      memory: Math.trunc(Number(defaults.memory) || 1024),
      swap: Math.trunc(Number(defaults.swap) || 0),
      disk: Math.trunc(Number(defaults.disk) || 2048),
      io: Math.trunc(io),
      cpu: Math.trunc(Number(defaults.cpu) || 100),
      oom_disabled: false
    },
    feature_limits: {
      databases: Math.trunc(Math.max(0, Number(defaults.databases) || 0)),
      allocations: Math.trunc(featureAllocations),
      backups: Math.trunc(Math.max(0, Number(defaults.backups) || 0))
    },
    allocation: {
      default: allocationId,
      additional: []
    },
    deploy: {
      locations: [locId],
      dedicated_ip: false,
      port_range: []
    }
  };

  let created;
  try {
    created = await pteroApplicationRequest({
      path: '/api/application/servers',
      method: 'POST',
      body: payload
    });
  } catch (err) {
    if (err?.status === 422) {
      console.error(JSON.stringify({
        event: 'ptero_create_server_validation_error',
        status: err.status,
        message: err.message,
        pteroPayload: err.payload,
        requestPayload: payload,
        picked: { locationId: locId, nodeId, allocationId, eggId: eId, pteroUserId }
      }, null, 2));
    }
    throw err;
  }

  const attrs = created?.attributes ?? {};

  const pteroServerId = Number(attrs.id);
  const pteroUuid = String(attrs.uuid ?? '');
  const pteroIdentifier = String(attrs.identifier ?? '');

  if (!Number.isInteger(pteroServerId) || pteroServerId <= 0 || !pteroUuid || !pteroIdentifier) {
    throw new Error('ptero_create_server_failed');
  }

  const now = new Date();

  const row = {
    userId: uid,
    pteroServerId,
    pteroUuid,
    pteroIdentifier,
    externalId: attrs.external_id ?? null,
    pteroUserId,
    name: String(attrs.name ?? serverName),
    description: String(attrs.description ?? description ?? ''),
    status: attrs.status ?? null,
    suspended: Boolean(attrs.suspended),
    locationId: locId,
    nodeId: Number(attrs.node ?? nodeId) || nodeId,
    allocationId: Number(attrs.allocation ?? allocationId) || allocationId,
    nestId: Number(attrs.nest ?? resolvedNestId ?? null) || null,
    eggId: Number(attrs.egg ?? eId) || eId,
    limitMemory: Number(attrs?.limits?.memory ?? defaults.memory),
    limitSwap: Number(attrs?.limits?.swap ?? defaults.swap),
    limitDisk: Number(attrs?.limits?.disk ?? defaults.disk),
    limitIo: Number(attrs?.limits?.io ?? defaults.io),
    limitCpu: Number(attrs?.limits?.cpu ?? defaults.cpu),
    limitThreads: attrs?.limits?.threads ?? null,
    oomDisabled: Boolean(attrs?.limits?.oom_disabled ?? false),
    featureDatabases: Number(attrs?.feature_limits?.databases ?? defaults.databases),
    featureAllocations: Number(attrs?.feature_limits?.allocations ?? defaults.allocations),
    featureBackups: Number(attrs?.feature_limits?.backups ?? defaults.backups),
    createdAt: now,
    updatedAt: now
  };

  const inserted = await db.insert(servers).values(row).returning();
  return { local: inserted[0] || null, panel: created };
}

export async function editServer({ userId, id, name, description }) {
  const uid = Number(userId);
  const sid = Number(id);

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!Number.isInteger(sid) || sid <= 0) throw new Error('id is required');

  const updates = { updatedAt: new Date() };

  if (name !== undefined) {
    const v = String(name ?? '').trim();
    if (!v) throw new Error('name is required');
    updates.name = v;
  }

  if (description !== undefined) {
    updates.description = String(description ?? '');
  }

  const updated = await db
    .update(servers)
    .set(updates)
    .where(and(eq(servers.id, sid), eq(servers.userId, uid)))
    .returning();

  return updated[0] || null;
}

export async function deleteServer({ userId, id }) {
  const uid = Number(userId);
  const sid = Number(id);

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!Number.isInteger(sid) || sid <= 0) throw new Error('id is required');

  const deleted = await db
    .delete(servers)
    .where(and(eq(servers.id, sid), eq(servers.userId, uid)))
    .returning();

  return deleted[0] || null;
}

export async function getServerWebsocket({ userId, serverId }) {
  const uid = Number(userId);
  const sid = Number(serverId);

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!Number.isInteger(sid) || sid <= 0) throw new Error('serverId is required');

  const rows = await db.select().from(servers).where(and(eq(servers.id, sid), eq(servers.userId, uid))).limit(1);
  if (!rows.length) {
    const err = new Error('server_not_found');
    err.status = 404;
    throw err;
  }

  const identifier = String(rows[0].pteroIdentifier ?? '').trim();
  if (!identifier) throw new Error('missing_identifier');

  return getPteroServerWebsocket({ identifier });
}

export async function openServerConsole({ userId, serverId, onConsoleOutput, onStatus, onStats, onEvent, onError, onClose }) {
  const uid = Number(userId);
  const sid = Number(serverId);

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!Number.isInteger(sid) || sid <= 0) throw new Error('serverId is required');

  const rows = await db.select().from(servers).where(and(eq(servers.id, sid), eq(servers.userId, uid))).limit(1);
  if (!rows.length) {
    const err = new Error('server_not_found');
    err.status = 404;
    throw err;
  }

  const identifier = String(rows[0].pteroIdentifier ?? '').trim();
  if (!identifier) throw new Error('missing_identifier');

  return connectServerConsole({ identifier, onConsoleOutput, onStatus, onStats, onEvent, onError, onClose });
}

export async function getServerAllocations({ userId, serverId }) {
  const uid = Number(userId);
  const sid = Number(serverId);

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!Number.isInteger(sid) || sid <= 0) throw new Error('serverId is required');

  const rows = await db.select().from(servers).where(and(eq(servers.id, sid), eq(servers.userId, uid))).limit(1);
  if (!rows.length) {
    const err = new Error('server_not_found');
    err.status = 404;
    throw err;
  }

  const identifier = String(rows[0].pteroIdentifier ?? '').trim();
  if (!identifier) throw new Error('missing_identifier');

  return listPteroServerAllocations({ identifier });
}

export async function setServerPowerState({ userId, serverId, state }) {
  const uid = Number(userId);
  const sid = Number(serverId);
  const s = String(state ?? '').trim().toLowerCase();

  if (!Number.isInteger(uid) || uid <= 0) throw new Error('userId is required');
  if (!Number.isInteger(sid) || sid <= 0) throw new Error('serverId is required');

  const allowed = new Set(['start', 'stop', 'restart', 'kill']);
  if (!allowed.has(s)) {
    const err = new Error('invalid_power_state');
    err.status = 422;
    throw err;
  }

  const rows = await db.select().from(servers).where(and(eq(servers.id, sid), eq(servers.userId, uid))).limit(1);
  if (!rows.length) {
    const err = new Error('server_not_found');
    err.status = 404;
    throw err;
  }

  const identifier = String(rows[0].pteroIdentifier ?? '').trim();
  if (!identifier) throw new Error('missing_identifier');

  return sendPowerSignal({ identifier, signal: s });
}
