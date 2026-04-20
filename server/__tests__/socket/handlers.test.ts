import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as connectClient, type Socket as ClientSocket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  GameCreatedPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  PlayerKickedPayload,
  GameStartedPayload,
  GameErrorPayload,
  QuestionStartedPayload,
  AnswerReceivedPayload,
  QuestionEndedPayload,
  GameEndedPayload,
  QuestionWithAnswers,
} from '@braingames/shared';
import { GameStore } from '../../src/socket/game-store.js';
import { setupSocketHandlers } from '../../src/socket/handlers.js';

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

function waitFor<T>(
  socket: TestClientSocket,
  event: keyof ServerToClientEvents,
  timeoutMs = 2000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event as string, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function connectTestClient(port: number): Promise<TestClientSocket> {
  return new Promise((resolve) => {
    const socket = connectClient(`http://localhost:${port}`, { forceNew: true });
    socket.on('connect', () => resolve(socket));
  });
}

// ── Mock quiz data ────────────────────────────────────────────────────────────

const MOCK_QUIZ_ID = 'quiz1';

const mockQuestions: QuestionWithAnswers[] = [
  {
    id: 'q1',
    quizId: MOCK_QUIZ_ID,
    type: 'multiple_choice',
    text: 'What is 2+2?',
    timeLimit: 20,
    points: 1000,
    order: 0,
    answers: [
      { id: 'a1', questionId: 'q1', text: '3', isCorrect: false, order: 0 },
      { id: 'a2', questionId: 'q1', text: '4', isCorrect: true, order: 1 },
      { id: 'a3', questionId: 'q1', text: '5', isCorrect: false, order: 2 },
    ],
  },
  {
    id: 'q2',
    quizId: MOCK_QUIZ_ID,
    type: 'true_false',
    text: 'The sky is blue',
    timeLimit: 10,
    points: 500,
    order: 1,
    answers: [
      { id: 'b1', questionId: 'q2', text: 'True', isCorrect: true, order: 0 },
      { id: 'b2', questionId: 'q2', text: 'False', isCorrect: false, order: 1 },
    ],
  },
];

const mockDeps = {
  getQuizWithQuestions: (quizId: string) =>
    quizId === MOCK_QUIZ_ID ? mockQuestions : null,
};

// ── Test setup ────────────────────────────────────────────────────────────────

describe('Socket.IO handlers', () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  let store: GameStore;
  let port: number;

  const clients: TestClientSocket[] = [];

  async function newClient(): Promise<TestClientSocket> {
    const client = await connectTestClient(port);
    clients.push(client);
    return client;
  }

  beforeEach(async () => {
    store = new GameStore();
    httpServer = createServer();
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: { origin: '*' },
    });
    setupSocketHandlers(io, store, mockDeps);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterEach(async () => {
    for (const c of clients) {
      if (c.connected) c.disconnect();
    }
    clients.length = 0;

    await new Promise<void>((resolve) => io.close(() => resolve()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function createGame(quizId = MOCK_QUIZ_ID) {
    const host = await newClient();
    host.emit('game:create', { quizId });
    const { session } = await waitFor<GameCreatedPayload>(host, 'game:created');
    return { host, session };
  }

  async function createAndStartGame() {
    const { host, session } = await createGame();
    const player = await newClient();

    const playerJoinedOnHost = waitFor<PlayerJoinedPayload>(host, 'player:joined');
    player.emit('game:join', { pin: session.pin, nickname: 'Alice' });
    const { player: joinedPlayer } = await waitFor<{ player: { id: string; socketId: string }; players: unknown[] }>(
      player, 'game:joined'
    );
    await playerJoinedOnHost;

    // First question is now included in the game:started payload (no separate question:started)
    const hostStarted = waitFor<GameStartedPayload>(host, 'game:started');
    const playerStarted = waitFor<GameStartedPayload>(player, 'game:started');

    host.emit('game:start', { pin: session.pin });
    await Promise.all([hostStarted, playerStarted]);

    return { host, player, session, joinedPlayer };
  }

  // ── game:create ──────────────────────────────────────────────────────────────

  describe('game:create', () => {
    it('emits game:created with a 6-digit PIN', async () => {
      const host = await newClient();
      host.emit('game:create', { quizId: MOCK_QUIZ_ID });
      const payload = await waitFor<GameCreatedPayload>(host, 'game:created');
      expect(payload.session.pin).toMatch(/^\d{6}$/);
      expect(payload.session.status).toBe('lobby');
      expect(payload.session.quizId).toBe(MOCK_QUIZ_ID);
    });

    it('emits game:error when quizId is missing', async () => {
      const host = await newClient();
      // @ts-expect-error intentional bad payload
      host.emit('game:create', {});
      const err = await waitFor<GameErrorPayload>(host, 'game:error');
      expect(err.message).toMatch(/quizId/i);
    });

    it('stores session in GameStore', async () => {
      const host = await newClient();
      host.emit('game:create', { quizId: MOCK_QUIZ_ID });
      const { session } = await waitFor<GameCreatedPayload>(host, 'game:created');
      expect(store.findByPin(session.pin)).not.toBeNull();
    });
  });

  // ── game:join ────────────────────────────────────────────────────────────────

  describe('game:join', () => {
    it('emits game:joined to the joining player', async () => {
      const { session } = await createGame();
      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Alice' });

      const joined = await waitFor<{ session: typeof session; player: unknown; players: unknown[] }>(
        player, 'game:joined'
      );
      expect(joined.session.pin).toBe(session.pin);
    });

    it('notifies host with player:joined', async () => {
      const { host, session } = await createGame();
      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Alice' });

      const notif = await waitFor<PlayerJoinedPayload>(host, 'player:joined');
      expect(notif.player.nickname).toBe('Alice');
      expect(notif.players).toHaveLength(1);
    });

    it('emits game:error for unknown PIN', async () => {
      const player = await newClient();
      player.emit('game:join', { pin: '000000', nickname: 'Alice' });
      const err = await waitFor<GameErrorPayload>(player, 'game:error');
      expect(err.message).toMatch(/not found/i);
    });

    it('emits game:error for duplicate nickname', async () => {
      const { session } = await createGame();
      const p1 = await newClient();
      p1.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      await waitFor(p1, 'game:joined');

      const p2 = await newClient();
      p2.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      const err = await waitFor<GameErrorPayload>(p2, 'game:error');
      expect(err.message).toMatch(/nickname/i);
    });

    it('emits game:error when game is already playing', async () => {
      const { host, session } = await createGame();
      host.emit('game:start', { pin: session.pin });
      await waitFor(host, 'game:started');

      const late = await newClient();
      late.emit('game:join', { pin: session.pin, nickname: 'LatePlayer' });
      const err = await waitFor<GameErrorPayload>(late, 'game:error');
      expect(err.message).toMatch(/already started/i);
    });
  });

  // ── game:leave ───────────────────────────────────────────────────────────────

  describe('game:leave', () => {
    it('removes player and broadcasts player:left', async () => {
      const { host, session } = await createGame();

      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Bob' });
      await waitFor(player, 'game:joined');
      await waitFor(host, 'player:joined');

      player.emit('game:leave', { pin: session.pin });
      const leftNotif = await waitFor<PlayerLeftPayload>(host, 'player:left');
      expect(leftNotif.players).toHaveLength(0);
    });
  });

  // ── player:kick ──────────────────────────────────────────────────────────────

  describe('player:kick', () => {
    it('host can kick a player', async () => {
      const { host, session } = await createGame();

      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Eve' });
      const { player: joinedPlayer } = await waitFor<{ player: { id: string }; players: unknown[] }>(
        player, 'game:joined'
      );

      host.emit('player:kick', { pin: session.pin, playerId: joinedPlayer.id });
      const kicked = await waitFor<PlayerKickedPayload>(player, 'player:kicked');
      expect(kicked.playerId).toBe(joinedPlayer.id);
    });

    it('non-host cannot kick players', async () => {
      const { session } = await createGame();

      const p1 = await newClient();
      p1.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      const { player: alice } = await waitFor<{ player: { id: string }; players: unknown[] }>(
        p1, 'game:joined'
      );

      const p2 = await newClient();
      p2.emit('game:join', { pin: session.pin, nickname: 'Bob' });
      await waitFor(p2, 'game:joined');

      p2.emit('player:kick', { pin: session.pin, playerId: alice.id });
      const err = await waitFor<GameErrorPayload>(p2, 'game:error');
      expect(err.message).toMatch(/only the host/i);
    });

    it('emits game:error for unknown playerId', async () => {
      const { host, session } = await createGame();

      host.emit('player:kick', { pin: session.pin, playerId: 'ghost-id' });
      const err = await waitFor<GameErrorPayload>(host, 'game:error');
      expect(err.message).toMatch(/player not found/i);
    });
  });

  // ── game:start ────────────────────────────────────────────────────────────────

  describe('game:start', () => {
    it('host starts game and all clients receive game:started', async () => {
      const { host, session } = await createGame();

      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      await waitFor(player, 'game:joined');
      await waitFor(host, 'player:joined');

      const hostStarted = waitFor<GameStartedPayload>(host, 'game:started');
      const playerStarted = waitFor<GameStartedPayload>(player, 'game:started');

      host.emit('game:start', { pin: session.pin });

      const [h, p] = await Promise.all([hostStarted, playerStarted]);
      expect(h.session.status).toBe('playing');
      expect(p.session.status).toBe('playing');
    });

    it('includes firstQuestion in game:started payload', async () => {
      const { host, session } = await createGame();
      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      await waitFor(player, 'game:joined');
      await waitFor(host, 'player:joined');

      const hostStarted = waitFor<GameStartedPayload>(host, 'game:started');
      const playerStarted = waitFor<GameStartedPayload>(player, 'game:started');
      host.emit('game:start', { pin: session.pin });

      const [h, p] = await Promise.all([hostStarted, playerStarted]);
      expect(h.firstQuestion).toBeDefined();
      expect(h.firstQuestion!.index).toBe(0);
      expect(h.firstQuestion!.text).toBe('What is 2+2?');
      expect(h.firstQuestion!.answers.every((a) => !('isCorrect' in a))).toBe(true);
      expect(p.firstQuestion).toBeDefined();
      expect(p.firstQuestion!.index).toBe(0);
    });

    it('emits game:error when quiz has no questions', async () => {
      const host = await newClient();
      host.emit('game:create', { quizId: 'no-questions-quiz' });
      const { session } = await waitFor<GameCreatedPayload>(host, 'game:created');
      host.emit('game:start', { pin: session.pin });
      const err = await waitFor<GameErrorPayload>(host, 'game:error');
      expect(err.message).toMatch(/no questions/i);
    });

    it('updates store session status to playing', async () => {
      const { host, session } = await createGame();
      host.emit('game:start', { pin: session.pin });
      await waitFor(host, 'game:started');
      expect(store.findByPin(session.pin)!.status).toBe('playing');
    });

    it('non-host cannot start the game', async () => {
      const { session } = await createGame();

      const player = await newClient();
      player.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      await waitFor(player, 'game:joined');

      player.emit('game:start', { pin: session.pin });
      const err = await waitFor<GameErrorPayload>(player, 'game:error');
      expect(err.message).toMatch(/only the host/i);
    });

    it('cannot start a game that is already playing', async () => {
      const { host, session } = await createGame();
      host.emit('game:start', { pin: session.pin });
      await waitFor(host, 'game:started');

      host.emit('game:start', { pin: session.pin });
      const err = await waitFor<GameErrorPayload>(host, 'game:error');
      expect(err.message).toMatch(/not in lobby/i);
    });
  });

  // ── player:answer ─────────────────────────────────────────────────────────────

  describe('player:answer', () => {
    it('host receives answer:received after player answers', async () => {
      const { host, player, session } = await createAndStartGame();

      const answerReceived = waitFor<AnswerReceivedPayload>(host, 'answer:received');
      player.emit('player:answer', { pin: session.pin, answerId: 'a2', timeRemaining: 15 });
      const payload = await answerReceived;

      expect(payload.answeredCount).toBe(1);
      expect(payload.totalPlayers).toBe(1);
    });

    it('auto-ends question when all players have answered', async () => {
      const { host, player, session } = await createAndStartGame();

      const hostEnded = waitFor<QuestionEndedPayload>(host, 'question:ended');
      const playerEnded = waitFor<QuestionEndedPayload>(player, 'question:ended');

      player.emit('player:answer', { pin: session.pin, answerId: 'a2', timeRemaining: 15 });

      const [h, p] = await Promise.all([hostEnded, playerEnded]);
      expect(h.correctAnswerId).toBe('a2');
      expect(h.distribution).toHaveLength(3);
      expect(p.playerResult?.isCorrect).toBe(true);
    });

    it('player gets isCorrect: false for wrong answer', async () => {
      const { host, player, session } = await createAndStartGame();

      const playerEnded = waitFor<QuestionEndedPayload>(player, 'question:ended');
      player.emit('player:answer', { pin: session.pin, answerId: 'a1', timeRemaining: 15 });
      const result = await playerEnded;

      expect(result.playerResult?.isCorrect).toBe(false);
      expect(result.playerResult?.pointsEarned).toBe(0);
    });

    it('duplicate answer is ignored', async () => {
      const { host, player, session } = await createAndStartGame();

      player.emit('player:answer', { pin: session.pin, answerId: 'a2', timeRemaining: 15 });
      await waitFor(host, 'answer:received');

      // Second answer should be ignored — no second answer:received
      let received = false;
      host.once('answer:received', () => { received = true; });
      player.emit('player:answer', { pin: session.pin, answerId: 'a1', timeRemaining: 10 });

      await new Promise((r) => setTimeout(r, 100));
      expect(received).toBe(false);
    });
  });

  // ── host:end-question ─────────────────────────────────────────────────────────

  describe('host:end-question', () => {
    it('host can manually end the question', async () => {
      const { host, player, session } = await createAndStartGame();

      const hostEnded = waitFor<QuestionEndedPayload>(host, 'question:ended');
      const playerEnded = waitFor<QuestionEndedPayload>(player, 'question:ended');

      host.emit('host:end-question', { pin: session.pin });

      const [h, p] = await Promise.all([hostEnded, playerEnded]);
      expect(h.correctAnswerId).toBe('a2');
      expect(p.playerResult?.selectedAnswerId).toBeNull();
    });

    it('host:end-question is idempotent (second call is ignored)', async () => {
      const { host, player, session } = await createAndStartGame();

      host.emit('host:end-question', { pin: session.pin });
      await waitFor(host, 'question:ended');

      // Second call should not emit another question:ended
      let fired = false;
      host.once('question:ended', () => { fired = true; });
      host.emit('host:end-question', { pin: session.pin });

      await new Promise((r) => setTimeout(r, 100));
      expect(fired).toBe(false);
    });
  });

  // ── host:next-question ────────────────────────────────────────────────────────

  describe('host:next-question', () => {
    it('advances to the next question', async () => {
      const { host, player, session } = await createAndStartGame();

      host.emit('host:end-question', { pin: session.pin });
      await Promise.all([waitFor(host, 'question:ended'), waitFor(player, 'question:ended')]);

      const nextQ = waitFor<QuestionStartedPayload>(host, 'question:started');
      host.emit('host:next-question', { pin: session.pin });
      const payload = await nextQ;

      expect(payload.question.index).toBe(1);
      expect(payload.question.text).toBe('The sky is blue');
    });

    it('emits game:ended after the last question', async () => {
      const { host, player, session } = await createAndStartGame();
      // Complete question 0
      host.emit('host:end-question', { pin: session.pin });
      await Promise.all([waitFor(host, 'question:ended'), waitFor(player, 'question:ended')]);

      // Advance to question 1
      host.emit('host:next-question', { pin: session.pin });
      await Promise.all([waitFor(host, 'question:started'), waitFor(player, 'question:started')]);

      // End question 1
      host.emit('host:end-question', { pin: session.pin });
      await Promise.all([waitFor(host, 'question:ended'), waitFor(player, 'question:ended')]);

      // Next should emit game:ended
      const hostEnded = waitFor<GameEndedPayload>(host, 'game:ended');
      const playerEnded = waitFor<GameEndedPayload>(player, 'game:ended');
      host.emit('host:next-question', { pin: session.pin });

      const [h, p] = await Promise.all([hostEnded, playerEnded]);
      expect(h.leaderboard).toHaveLength(1);
      expect(p.leaderboard[0]?.nickname).toBe('Alice');
    });
  });

  // ── disconnect cleanup ────────────────────────────────────────────────────────

  describe('disconnect', () => {
    it('removes player from session when they disconnect', async () => {
      const { host, session } = await createGame();

      const player = await newClient();
      const playerJoinedOnHost = waitFor<PlayerJoinedPayload>(host, 'player:joined');
      player.emit('game:join', { pin: session.pin, nickname: 'Alice' });
      await waitFor(player, 'game:joined');
      await playerJoinedOnHost;

      const leftPromise = waitFor<PlayerLeftPayload>(host, 'player:left');
      player.disconnect();
      const left = await leftPromise;
      expect(left.players).toHaveLength(0);
    });
  });
});
