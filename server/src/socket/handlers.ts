import type { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  GameCreatePayload,
  GameJoinPayload,
  GameLeavePayload,
  PlayerKickPayload,
  GameStartPayload,
  PlayerAnswerPayload,
  HostEndQuestionPayload,
  HostNextQuestionPayload,
  QuestionWithAnswers,
  PublicQuestion,
  AnswerDistribution,
  PlayerQuestionResult,
  LeaderboardEntry,
} from '@braingames/shared';
import type { GameStore } from './game-store.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface HandlerDeps {
  getQuizWithQuestions(quizId: string): QuestionWithAnswers[] | null;
}

// ── Pure helpers ────────────────────────────────────────────────────────────

function toPublicQuestion(q: QuestionWithAnswers, index: number, total: number): PublicQuestion {
  return {
    index,
    totalQuestions: total,
    text: q.text,
    type: q.type,
    timeLimit: q.timeLimit,
    points: q.points,
    answers: q.answers.map(({ id, text, order }) => ({ id, text, order })),
  };
}

function calculatePoints(
  basePoints: number,
  timeRemaining: number,
  timeLimit: number,
  newStreak: number,
): number {
  const rawPoints = Math.round(basePoints * (timeRemaining / timeLimit));
  const multiplier = newStreak >= 5 ? 1.5 : newStreak >= 3 ? 1.2 : 1.0;
  return Math.round(rawPoints * multiplier);
}

function buildLeaderboard(players: ReturnType<GameStore['getPlayers']>): LeaderboardEntry[] {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map(({ id, nickname, avatarColor, score, streak }) => ({ id, nickname, avatarColor, score, streak }));
}

// ── Question end logic ───────────────────────────────────────────────────────

function endQuestion(
  io: TypedServer,
  store: GameStore,
  sessionId: string,
  questionIndex: number,
): void {
  if (store.isQuestionEnded(sessionId, questionIndex)) return;
  store.markQuestionEnded(sessionId, questionIndex);

  const questions = store.getQuestions(sessionId);
  const question = questions[questionIndex];
  if (!question) return;

  const correctAnswer = question.answers.find((a) => a.isCorrect);
  if (!correctAnswer) return;

  const correctAnswerId = correctAnswer.id;
  const sessionAnswers = store.getAnswers(sessionId, questionIndex);
  const players = store.getPlayers(sessionId);

  const distribution: AnswerDistribution[] = question.answers.map((a) => ({
    answerId: a.id,
    text: a.text,
    count: sessionAnswers.filter((sa) => sa.answerId === a.id).length,
    isCorrect: a.isCorrect,
  }));

  const leaderboard = buildLeaderboard(players);
  const session = store.findById(sessionId);
  if (!session) return;

  // Host gets distribution + leaderboard, no playerResult
  io.to(session.hostSocketId).emit('question:ended', { distribution, correctAnswerId, leaderboard });

  // Each player gets their individual result
  for (const player of players) {
    const answer = sessionAnswers.find((a) => a.playerId === player.id);
    const isCorrect = answer?.answerId === correctAnswerId;
    const playerResult: PlayerQuestionResult = {
      isCorrect,
      pointsEarned: answer?.pointsEarned ?? 0,
      newScore: player.score,
      newStreak: player.streak,
      correctAnswerId,
      selectedAnswerId: answer?.answerId ?? null,
    };
    io.to(player.socketId).emit('question:ended', { distribution, correctAnswerId, leaderboard, playerResult });
  }
}

// ── Handler registration ─────────────────────────────────────────────────────

function registerHandlers(
  socket: TypedSocket,
  io: TypedServer,
  store: GameStore,
  deps: HandlerDeps,
): void {
  socket.on('game:create', (payload: GameCreatePayload) => {
    if (!payload?.quizId) {
      socket.emit('game:error', { message: 'quizId is required' });
      return;
    }

    const session = store.createSession(payload.quizId, socket.id);
    void socket.join(session.pin);
    socket.emit('game:created', { session });
  });

  socket.on('game:join', (payload: GameJoinPayload) => {
    const { pin, nickname } = payload ?? {};

    if (!pin || !nickname?.trim()) {
      socket.emit('game:error', { message: 'pin and nickname are required' });
      return;
    }

    const session = store.findByPin(pin);
    if (!session) {
      socket.emit('game:error', { message: 'Game not found' });
      return;
    }

    if (session.status !== 'lobby') {
      socket.emit('game:error', { message: 'Game has already started' });
      return;
    }

    const player = store.addPlayer(session.id, socket.id, nickname.trim());
    if (!player) {
      socket.emit('game:error', { message: 'Nickname already taken' });
      return;
    }

    void socket.join(pin);
    const players = store.getPlayers(session.id);

    socket.emit('game:joined', { session, player, players });
    socket.to(pin).emit('player:joined', { player, players });
  });

  socket.on('game:leave', (payload: GameLeavePayload) => {
    const { pin } = payload ?? {};
    if (!pin) return;

    const session = store.findByPin(pin);
    if (!session) return;

    const player = store.removePlayerBySocketId(session.id, socket.id);
    if (!player) return;

    void socket.leave(pin);
    const players = store.getPlayers(session.id);
    io.to(pin).emit('player:left', { playerId: player.id, players });
  });

  socket.on('player:kick', (payload: PlayerKickPayload) => {
    const { pin, playerId } = payload ?? {};
    if (!pin || !playerId) {
      socket.emit('game:error', { message: 'pin and playerId are required' });
      return;
    }

    const session = store.findByPin(pin);
    if (!session) {
      socket.emit('game:error', { message: 'Game not found' });
      return;
    }

    if (session.hostSocketId !== socket.id) {
      socket.emit('game:error', { message: 'Only the host can kick players' });
      return;
    }

    const player = store.kickPlayer(session.id, playerId);
    if (!player) {
      socket.emit('game:error', { message: 'Player not found' });
      return;
    }

    io.to(player.socketId).emit('player:kicked', { playerId });
    const players = store.getPlayers(session.id);
    io.to(pin).emit('player:left', { playerId, players });
  });

  socket.on('game:start', (payload: GameStartPayload) => {
    const { pin } = payload ?? {};
    if (!pin) {
      socket.emit('game:error', { message: 'pin is required' });
      return;
    }

    const session = store.findByPin(pin);
    if (!session) {
      socket.emit('game:error', { message: 'Game not found' });
      return;
    }

    if (session.hostSocketId !== socket.id) {
      socket.emit('game:error', { message: 'Only the host can start the game' });
      return;
    }

    if (session.status !== 'lobby') {
      socket.emit('game:error', { message: 'Game is not in lobby state' });
      return;
    }

    const questions = deps.getQuizWithQuestions(session.quizId);
    if (!questions || questions.length === 0) {
      socket.emit('game:error', { message: 'Quiz has no questions' });
      return;
    }

    store.setQuestions(session.id, questions);
    const updated = store.setStatus(session.id, 'playing');
    if (!updated) return;

    const firstQuestion = toPublicQuestion(questions[0]!, 0, questions.length);
    io.to(pin).emit('game:started', { session: updated, firstQuestion });
  });

  socket.on('player:answer', (payload: PlayerAnswerPayload) => {
    const { pin, answerId, timeRemaining } = payload ?? {};
    if (!pin || !answerId) {
      socket.emit('game:error', { message: 'pin and answerId are required' });
      return;
    }

    const session = store.findByPin(pin);
    if (!session || session.status !== 'playing') {
      socket.emit('game:error', { message: 'Game is not active' });
      return;
    }

    const players = store.getPlayers(session.id);
    const player = players.find((p) => p.socketId === socket.id);
    if (!player) {
      socket.emit('game:error', { message: 'Player not found in this game' });
      return;
    }

    const questionIndex = session.currentQuestionIndex;
    const questions = store.getQuestions(session.id);
    const question = questions[questionIndex];
    if (!question) return;

    const correctAnswer = question.answers.find((a) => a.isCorrect);
    const isCorrect = correctAnswer?.id === answerId;
    const newStreak = isCorrect ? player.streak + 1 : 0;
    const pointsEarned = isCorrect
      ? calculatePoints(question.points, timeRemaining, question.timeLimit, newStreak)
      : 0;

    const recorded = store.recordAnswer(session.id, questionIndex, {
      playerId: player.id,
      socketId: socket.id,
      answerId,
      timeRemaining,
      pointsEarned,
    });

    if (!recorded) return; // duplicate answer, ignore

    store.updatePlayerScore(session.id, player.id, pointsEarned, newStreak);

    const answers = store.getAnswers(session.id, questionIndex);
    const answeredCount = answers.length;
    const totalPlayers = players.length;

    // Notify host of progress
    io.to(session.hostSocketId).emit('answer:received', { answeredCount, totalPlayers });

    // Auto-end when all players have answered
    if (answeredCount >= totalPlayers) {
      endQuestion(io, store, session.id, questionIndex);
    }
  });

  socket.on('host:end-question', (payload: HostEndQuestionPayload) => {
    const { pin } = payload ?? {};
    if (!pin) return;

    const session = store.findByPin(pin);
    if (!session || session.hostSocketId !== socket.id) return;

    endQuestion(io, store, session.id, session.currentQuestionIndex);
  });

  socket.on('host:next-question', (payload: HostNextQuestionPayload) => {
    const { pin } = payload ?? {};
    if (!pin) return;

    const session = store.findByPin(pin);
    if (!session || session.hostSocketId !== socket.id) return;

    const questions = store.getQuestions(session.id);
    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      const players = store.getPlayers(session.id);
      store.setStatus(session.id, 'finished');
      io.to(pin).emit('game:ended', { leaderboard: buildLeaderboard(players) });
    } else {
      store.setCurrentQuestionIndex(session.id, nextIndex);
      io.to(pin).emit('question:started', {
        question: toPublicQuestion(questions[nextIndex]!, nextIndex, questions.length),
      });
    }
  });

  // Clean up player on disconnect
  socket.on('disconnect', () => {
    for (const session of store.iterateSessions()) {
      const player = store.removePlayerBySocketId(session.id, socket.id);
      if (player) {
        const players = store.getPlayers(session.id);
        io.to(session.pin).emit('player:left', { playerId: player.id, players });
        break;
      }
    }
  });
}

export function setupSocketHandlers(io: TypedServer, store: GameStore, deps: HandlerDeps): void {
  io.on('connection', (socket) => {
    registerHandlers(socket, io, store, deps);
  });
}
