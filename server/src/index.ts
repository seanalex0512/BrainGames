import { createServer } from 'http';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { createApp, createSocketServer } from './app.js';
import { GameStore } from './socket/game-store.js';
import { config } from './config.js';

if (config.DB_PATH !== ':memory:') {
  mkdirSync(dirname(config.DB_PATH), { recursive: true });
}

const { app, handlerDeps } = createApp();
const httpServer = createServer(app);
const gameStore = new GameStore();

createSocketServer(httpServer, gameStore, handlerDeps);

httpServer.listen(config.PORT, () => {
  console.log(`[server] listening on http://localhost:${config.PORT}`);
  console.log(`[server] CORS origin: ${config.CLIENT_URL}`);
  console.log(`[server] env: ${config.NODE_ENV}`);
  console.log(`[server] db: ${config.DB_PATH}`);
});
