import { pteroClientRequest } from '../../utils/importer.js';

export async function sendPowerSignal({ identifier, signal }) {
  const id = String(identifier ?? '').trim();
  const s = String(signal ?? '').trim();
  if (!id) throw new Error('missing_identifier');
  if (!s) throw new Error('missing_signal');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/power`,
    method: 'POST',
    body: { signal: s }
  });

  return res;
}
