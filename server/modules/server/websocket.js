import { pteroClientRequest } from '../../utils/importer.js';

export async function getPteroServerWebsocket({ identifier }) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const res = await pteroClientRequest({
    path: `/api/client/servers/${id}/websocket`,
    method: 'GET'
  });

  const data = res?.data ?? {};

  return {
    token: data.token,
    socket: data.socket
  };
}
