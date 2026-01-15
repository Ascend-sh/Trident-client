import { pteroClientRequest } from '../../utils/importer.js';

export async function listServerAllocations({ identifier }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/network/allocations`,
    method: 'GET'
  });

  const items = Array.isArray(res?.data) ? res.data : [];
  const allocations = items
    .map((item) => item?.attributes)
    .filter((a) => a && typeof a === 'object');

  const primary = allocations.find((a) => a.is_default) || null;

  return { allocations, primary };
}
