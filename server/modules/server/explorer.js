import { pteroClientRequest } from '../../utils/importer.js';

function toPath(v, fallback) {
  const s = String(v ?? '').trim();
  if (!s) return fallback;
  return s;
}

export async function listDirectory({ identifier, directory = '/' }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const dir = toPath(directory, '/');
  const json = await pteroClientRequest({
    path: `/api/client/servers/${id}/files/list`,
    method: 'GET',
    query: { directory: dir }
  });

  const items = Array.isArray(json?.data) ? json.data : [];
  const files = items.map(i => i?.attributes).filter(Boolean);

  return { directory: dir, files };
}

export async function readFileContents({ identifier, file }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const f = toPath(file, '');
  if (!f) throw new Error('missing_file');

  const text = await pteroClientRequest({
    path: `/api/client/servers/${id}/files/contents`,
    method: 'GET',
    query: { file: f }
  });

  return typeof text === 'string' ? text : String(text ?? '');
}

export async function writeFileContents({ identifier, file, content }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const f = toPath(file, '');
  if (!f) throw new Error('missing_file');

  const body = content === undefined || content === null ? '' : String(content);

  await pteroClientRequest({
    path: `/api/client/servers/${id}/files/write`,
    method: 'POST',
    query: { file: f },
    body,
    headers: { 'Content-Type': 'text/plain' }
  });

  return null;
}

export async function deleteFiles({ identifier, root = '/', files = [] }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const r = toPath(root, '/');
  const list = Array.isArray(files) ? files.map(f => String(f ?? '').trim()).filter(Boolean) : [];
  if (!list.length) throw new Error('missing_files');

  await pteroClientRequest({
    path: `/api/client/servers/${id}/files/delete`,
    method: 'POST',
    body: { root: r, files: list },
    headers: { 'Content-Type': 'application/json' }
  });

  return null;
}
