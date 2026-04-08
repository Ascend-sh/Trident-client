import { pteroClientRequest } from '../../utils/importer.js';

export async function getServerDetails({ identifier }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}`,
    method: 'GET'
  });

  return res?.attributes ?? res;
}

export async function listBackups({ identifier }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const [backupsRes, details] = await Promise.all([
    pteroClientRequest({
      path: `/api/client/servers/${id}/backups`,
      method: 'GET'
    }),
    getServerDetails({ identifier: id }).catch(() => null)
  ]);

  const items = Array.isArray(backupsRes?.data) ? backupsRes.data : [];
  const backups = items
    .map((item) => item?.attributes)
    .filter((a) => a && typeof a === 'object');

  const backupLimit = Number(details?.feature_limits?.backups ?? 0);

  return { backups, backupLimit, meta: backupsRes?.meta ?? null };
}

export async function createBackup({ identifier, name, ignored, isLocked }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const body = {};
  if (name !== undefined) body.name = String(name ?? '').trim();
  if (Array.isArray(ignored)) body.ignored = ignored.map(String);
  if (isLocked !== undefined) body.is_locked = Boolean(isLocked);

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/backups`,
    method: 'POST',
    body
  });

  return res?.attributes ?? res;
}

export async function getBackupDetails({ identifier, uuid }) {
  const id = String(identifier ?? '').trim();
  const bid = String(uuid ?? '').trim();
  if (!id) throw new Error('missing_identifier');
  if (!bid) throw new Error('missing_backup_uuid');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/backups/${bid}`,
    method: 'GET'
  });

  return res?.attributes ?? res;
}

export async function getBackupDownloadUrl({ identifier, uuid }) {
  const id = String(identifier ?? '').trim();
  const bid = String(uuid ?? '').trim();
  if (!id) throw new Error('missing_identifier');
  if (!bid) throw new Error('missing_backup_uuid');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/backups/${bid}/download`,
    method: 'GET'
  });

  return res?.attributes?.url ?? res?.url ?? null;
}

export async function toggleBackupLock({ identifier, uuid }) {
  const id = String(identifier ?? '').trim();
  const bid = String(uuid ?? '').trim();
  if (!id) throw new Error('missing_identifier');
  if (!bid) throw new Error('missing_backup_uuid');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/backups/${bid}/lock`,
    method: 'POST'
  });

  return res?.attributes ?? res;
}

export async function deleteBackup({ identifier, uuid }) {
  const id = String(identifier ?? '').trim();
  const bid = String(uuid ?? '').trim();
  if (!id) throw new Error('missing_identifier');
  if (!bid) throw new Error('missing_backup_uuid');

  await pteroClientRequest({
    path: `/api/client/servers/${id}/backups/${bid}`,
    method: 'DELETE'
  });

  return { ok: true };
}
