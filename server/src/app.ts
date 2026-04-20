import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from './config.js';
import { createDatabase, initializeSchema } from './db/index.js';
import { SqliteQuizRepository, SqliteQuestionRepository, SqliteAnswerRepository } from './repositories/index.js';
import { healthRouter } from './routes/health.js';
import { createQuizRouter } from './routes/quizzes.js';
import { createPdfImportRouter } from './routes/pdf-import.js';
import { createQuestionRouter, createDirectQuestionRouter } from './routes/questions.js';
import { createAnswerRouter } from './routes/answers.js';
import { GameStore } from './socket/game-store.js';
import { setupSocketHandlers, type HandlerDeps } from './socket/handlers.js';
import type { ApiResponse, ServerToClientEvents, ClientToServerEvents } from '@braingames/shared';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const clientDistPath = join(__dirname, '..', '..', 'client', 'dist');

export function createApp(db?: Database.Database) {
  const database = db ?? createDatabase(config.DB_PATH);
  if (!db) initializeSchema(database);

  const quizRepo = new SqliteQuizRepository(database);
  const questionRepo = new SqliteQuestionRepository(database);
  const answerRepo = new SqliteAnswerRepository(database);

  const repos = { quiz: quizRepo, question: questionRepo, answer: answerRepo };

  const app = express();

  app.use(cors({ origin: config.CLIENT_URL }));
  app.use(express.json());

  // Serve built React app in production
  if (config.isProd && existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
  }

  app.use('/api/health', healthRouter);
  // PDF import must be registered before the generic quiz router so
  // /api/quizzes/import-pdf is not matched by the /:id param route.
  app.use('/api/quizzes/import-pdf', createPdfImportRouter(repos));
  app.use('/api/quizzes', createQuizRouter(repos));
  app.use('/api/quizzes/:quizId/questions', createQuestionRouter(repos));
  app.use('/api/questions', createDirectQuestionRouter({ question: questionRepo }));
  app.use('/api/questions/:questionId/answers', createAnswerRouter({ question: questionRepo, answer: answerRepo }));

  // SPA fallback — serve index.html for non-API routes in production
  if (config.isProd && existsSync(clientDistPath)) {
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(join(clientDistPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server] Unhandled error:', err);
    const response: ApiResponse<null> = { success: false, data: null, error: 'Internal server error' };
    res.status(500).json(response);
  });

  // Build handler deps using the repos created here
  const handlerDeps: HandlerDeps = {
    getQuizWithQuestions(quizId) {
      const questions = questionRepo.findByQuizId(quizId);
      if (questions.length === 0) return null;
      return questions.map((q) => ({
        ...q,
        answers: answerRepo.findByQuestionId(q.id),
      }));
    },
  };

  return { app, handlerDeps };
}

export function createSocketServer(
  httpServer: HttpServer,
  gameStore: GameStore,
  deps: HandlerDeps,
  corsOrigin = config.CLIENT_URL,
) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  setupSocketHandlers(io, gameStore, deps);

  return io;
}
