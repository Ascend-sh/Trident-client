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

export async function createServerAllocation({ identifier }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/network/allocations`,
    method: 'POST',
    body: {}
  });

  return res?.attributes || res;
}

export async function setAllocationAsPrimary({ identifier, allocationId }) {
  const id = String(identifier ?? '').trim();
  const allocId = Number(allocationId);
  if (!id) throw new Error('missing_identifier');
  if (!Number.isInteger(allocId) || allocId <= 0) throw new Error('invalid_allocation_id');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/network/allocations/${allocId}/primary`,
    method: 'POST'
  });

  return res?.attributes || res;
}

export async function updateAllocationNotes({ identifier, allocationId, notes }) {
  const id = String(identifier ?? '').trim();
  const allocId = Number(allocationId);
  if (!id) throw new Error('missing_identifier');
  if (!Number.isInteger(allocId) || allocId <= 0) throw new Error('invalid_allocation_id');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/network/allocations/${allocId}`,
    method: 'POST',
    body: { notes: String(notes ?? '') }
  });

  return res?.attributes || res;
}

export async function deleteServerAllocation({ identifier, allocationId }) {
  const id = String(identifier ?? '').trim();
  const allocId = Number(allocationId);
  if (!id) throw new Error('missing_identifier');
  if (!Number.isInteger(allocId) || allocId <= 0) throw new Error('invalid_allocation_id');

  await pteroClientRequest({
    path: `/api/client/servers/${id}/network/allocations/${allocId}`,
    method: 'DELETE'
  });

  return { ok: true };
}
