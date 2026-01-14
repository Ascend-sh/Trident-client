import { pteroClientRequest } from '../../utils/importer.js';

export async function getResources({ identifier }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/resources`,
    method: 'GET'
  });

  return res;
}

export function normalizeWsStats(raw) {
  let stats;
  try {
    stats = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    stats = null;
  }

  if (!stats || typeof stats !== 'object') return null;

  return {
    state: stats.state,
    cpuPercent: stats.cpu_absolute,
    memoryBytes: stats.memory_bytes,
    memoryLimitBytes: stats.memory_limit_bytes,
    diskBytes: stats.disk_bytes,
    network: stats.network,
    uptime: stats.uptime
  };
}
