import { getPteroServerWebsocket } from './websocket.js';
import { normalizeWsStats } from './metrics.js';

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

export async function connectServerConsole({ identifier, onConsoleOutput, onStatus, onStats, onAuthSuccess, onEvent, onClose, onError } = {}) {
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
    send(event, args) {
      if (ws.readyState !== WebSocket.OPEN) throw new Error('socket_not_open');
      ws.send(JSON.stringify({ event, args: Array.isArray(args) ? args : [] }));
    },
    sendCommand(command) {
      const cmd = String(command ?? '').trim();
      if (!cmd) throw new Error('missing_command');
      api.send('send command', [cmd]);
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
      api.send('send logs', []);
      api.send('send stats', []);
      return;
    }

    if (event === 'console output') {
      const line = typeof args[0] === 'string' ? args[0] : '';
      if (typeof onConsoleOutput === 'function') {
        try {
          onConsoleOutput(line);
        } catch {}
      }
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
