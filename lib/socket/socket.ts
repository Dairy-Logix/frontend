import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';

/**
 * Single shared Socket.IO connection to the backend AgencyGateway.
 *
 * The gateway authenticates the JWT from `auth.token` on connect and auto-joins
 * the client to `tenant:{tenantId}` and `user:{userId}` rooms. We keep one
 * connection per browser tab and (re)attach the current token before connecting.
 */
let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      // Pure WebSocket — no HTTP long-polling. This requires the reverse proxy
      // (nginx) in front of api.beatmitra.com to forward AND keep alive the
      // `Upgrade`/`Connection` handshake (see the nginx `location /socket.io/`
      // block + the `$connection_upgrade` map). If the upgrade ever fails the
      // client will NOT silently fall back to polling — the `connect_error`
      // listener below makes that visible instead of failing quietly.
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // The connection used to be a black box: nothing logged whether it
    // succeeded, so a prod-only failure was invisible. These one-liners surface
    // the resolved URL and any handshake error in the browser console.
    socket.on('connect', () =>
      console.info(`[socket] connected to ${SOCKET_URL} (id=${socket?.id})`),
    );
    socket.on('connect_error', (err) =>
      console.warn(`[socket] connect_error for ${SOCKET_URL}:`, err.message),
    );
    socket.on('disconnect', (reason) =>
      console.info(`[socket] disconnected: ${reason}`),
    );
  } else {
    // Refresh the token (e.g. after a silent refresh) before the next connect.
    socket.auth = { token };
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
