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
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
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
