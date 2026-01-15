import { pteroClientRequest } from '../../utils/importer.js';
import { getPteroServerWebsocket } from './websocket.js';

function parseMessage(data) {
  if (typeof data !== 'string') return null;
  try {
    const msg = JSON.parse(data);
    if (!msg || typeof msg !== 'object') return null;
    return msg;
  } catch {
    return null;
  }
}

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

  const network = stats.network && typeof stats.network === 'object' ? stats.network : null;

  return {
    state: stats.state,
    cpuPercent: stats.cpu_absolute,
    memoryBytes: stats.memory_bytes,
    memoryLimitBytes: stats.memory_limit_bytes,
    diskBytes: stats.disk_bytes,
    network: network
      ? {
          rxBytes: network.rx_bytes,
          txBytes: network.tx_bytes
        }
      : null,
    uptime: stats.uptime
  };
}

export async function connectServerMetrics({ identifier, onStats, onStatus, onAuthSuccess, onEvent, onClose, onError } = {}) {
  const id = String(identifier ?? '').trim();
  if (!id) throw new Error('missing_identifier');

  const { token, socket } = await getPteroServerWebsocket({ identifier: id });

  const socketUrl = String(socket ?? '').trim();
  const authToken = String(token ?? '').trim();

  if (!socketUrl) throw new Error('missing_socket');
  if (!authToken) throw new Error('missing_token');

  const ws = new WebSocket(socketUrl);

  const api = {
    ws,
    authenticate() {
      if (ws.readyState !== WebSocket.OPEN) throw new Error('socket_not_open');
      ws.send(JSON.stringify({ event: 'auth', args: [authToken] }));
    },
    requestStats() {
      if (ws.readyState !== WebSocket.OPEN) throw new Error('socket_not_open');
      ws.send(JSON.stringify({ event: 'send stats', args: [] }));
    },
    close(code, reason) {
      ws.close(code, reason);
    }
  };

  ws.onopen = () => {
    api.authenticate();
  };

  ws.onmessage = evt => {
    const msg = parseMessage(evt?.data);
    if (!msg) return;

    const event = String(msg.event ?? '').trim();
    const args = Array.isArray(msg.args) ? msg.args : [];

    if (typeof onEvent === 'function') {
      try {
        onEvent({ event, args, raw: msg });
      } catch {}
    }

    if (event === 'auth success') {
      if (typeof onAuthSuccess === 'function') {
        try {
          onAuthSuccess();
        } catch {}
      }
      api.requestStats();
      return;
    }

    if (event === 'status') {
      const status = typeof args[0] === 'string' ? args[0] : null;
      if (typeof onStatus === 'function') {
        try {
          onStatus(status);
        } catch {}
      }
      return;
    }

    if (event === 'stats') {
      const stats = normalizeWsStats(args[0]);
      if (typeof onStats === 'function') {
        try {
          onStats(stats);
        } catch {}
      }
    }
  };

  ws.onerror = err => {
    if (typeof onError === 'function') {
      try {
        onError(err);
      } catch {}
    }
  };

  ws.onclose = evt => {
    if (typeof onClose === 'function') {
      try {
        onClose(evt);
      } catch {}
    }
  };

  return api;
}
