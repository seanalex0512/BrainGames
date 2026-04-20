import { io } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@braingames/shared';

// Connects to same origin in production; Vite proxies /socket.io → localhost:3001 in dev.
export const socket = io<ServerToClientEvents, ClientToServerEvents>({
  autoConnect: false,
  path: '/socket.io',
});
