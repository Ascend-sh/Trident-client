import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { serverDefaults } from '../db/schema.js';

export async function ensureServerDefaults() {
  const rows = await db.select().from(serverDefaults).where(eq(serverDefaults.id, 1)).limit(1);
  if (rows.length) return rows[0];

  try {
    await db.insert(serverDefaults).values({ id: 1, io: 500, allocations: 1 });
  } catch {
  }

  const after = await db.select().from(serverDefaults).where(eq(serverDefaults.id, 1)).limit(1);
  return after[0] || null;
}

export async function getServerDefaults() {
  const row = await ensureServerDefaults();

  const memory = Number(row?.memory);
  const swap = Number(row?.swap);
  const disk = Number(row?.disk);
  const cpu = Number(row?.cpu);
  const ioRaw = Number(row?.io);
  const allocationsRaw = Number(row?.allocations);
  const databases = Number(row?.databases);
  const backups = Number(row?.backups);

  const io = Math.min(1000, Math.max(10, Number.isFinite(ioRaw) && ioRaw > 0 ? ioRaw : 500));
  const allocations = Math.max(1, Number.isFinite(allocationsRaw) && allocationsRaw > 0 ? allocationsRaw : 1);

  return {
    memory: Number.isFinite(memory) && memory > 0 ? memory : 1024,
    swap: Number.isFinite(swap) ? swap : 0,
    disk: Number.isFinite(disk) && disk > 0 ? disk : 2048,
    cpu: Number.isFinite(cpu) && cpu > 0 ? cpu : 100,
    io,
    databases: Number.isFinite(databases) && databases >= 0 ? databases : 0,
    allocations,
    backups: Number.isFinite(backups) && backups >= 0 ? backups : 0
  };
}

function toInt(value, fallback) {
  const v = Number(value);
  if (!Number.isFinite(v)) return fallback;
  return Math.trunc(v);
}

export async function updateServerDefaults(patch) {
  const current = await getServerDefaults();

  const next = { ...current };

  if (patch?.memory !== undefined) next.memory = Math.max(0, toInt(patch.memory, current.memory));
  if (patch?.swap !== undefined) next.swap = Math.max(0, toInt(patch.swap, current.swap));
  if (patch?.disk !== undefined) next.disk = Math.max(0, toInt(patch.disk, current.disk));
  if (patch?.cpu !== undefined) next.cpu = Math.max(0, toInt(patch.cpu, current.cpu));
  if (patch?.io !== undefined) next.io = Math.min(1000, Math.max(10, toInt(patch.io, current.io)));
  if (patch?.databases !== undefined) next.databases = Math.max(0, toInt(patch.databases, current.databases));
  if (patch?.allocations !== undefined) next.allocations = Math.max(1, toInt(patch.allocations, current.allocations));
  if (patch?.backups !== undefined) next.backups = Math.max(0, toInt(patch.backups, current.backups));

  await ensureServerDefaults();
  await db.update(serverDefaults).set(next).where(eq(serverDefaults.id, 1));

  return { ok: true, defaults: next };
}
