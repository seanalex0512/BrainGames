import { create } from 'zustand';
import type {
  PublicQuestion,
  AnswerDistribution,
  PlayerQuestionResult,
  LeaderboardEntry,
  QuestionStartedPayload,
  AnswerReceivedPayload,
  QuestionEndedPayload,
  GameEndedPayload,
} from '@braingames/shared';
import { socket } from '../utils/socket-client';

export type GamePhase = 'idle' | 'question' | 'answered' | 'results' | 'ended';

interface GameState {
  phase: GamePhase;
  pin: string | null;
  currentQuestion: PublicQuestion | null;
  answeredCount: number;
  totalPlayers: number;
  selectedAnswerId: string | null;
  distribution: ReadonlyArray<AnswerDistribution>;
  correctAnswerId: string | null;
  playerResult: PlayerQuestionResult | null;
  leaderboard: ReadonlyArray<LeaderboardEntry>;
  /** Leaderboard from the previous question — used to compute rank changes */
  previousLeaderboard: ReadonlyArray<LeaderboardEntry>;
}

interface GameActions {
  initGame: (pin: string, firstQuestion?: PublicQuestion | null) => void;
  submitAnswer: (answerId: string, timeRemaining: number) => void;
  endQuestion: () => void;
  nextQuestion: () => void;
  reset: () => void;
}

const initialState: GameState = {
  phase: 'idle',
  pin: null,
  currentQuestion: null,
  answeredCount: 0,
  totalPlayers: 0,
  selectedAnswerId: null,
  distribution: [],
  correctAnswerId: null,
  playerResult: null,
  leaderboard: [],
  previousLeaderboard: [],
};

let teardownListeners: (() => void) | null = null;

function registerListeners(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState & GameActions,
): void {
  teardownListeners?.();

  const onQuestionStarted = (payload: QuestionStartedPayload) => {
    set({
      phase: 'question',
      currentQuestion: payload.question,
      answeredCount: 0,
      selectedAnswerId: null,
      distribution: [],
      correctAnswerId: null,
      playerResult: null,
    });
  };

  const onAnswerReceived = (payload: AnswerReceivedPayload) => {
    set({ answeredCount: payload.answeredCount, totalPlayers: payload.totalPlayers });
  };

  const onQuestionEnded = (payload: QuestionEndedPayload) => {
    const { leaderboard } = get();
    set({
      phase: 'results',
      distribution: payload.distribution,
      correctAnswerId: payload.correctAnswerId,
      previousLeaderboard: leaderboard,
      leaderboard: payload.leaderboard,
      playerResult: payload.playerResult ?? null,
    });
  };

  const onGameEnded = (payload: GameEndedPayload) => {
    const { leaderboard } = get();
    set({ phase: 'ended', previousLeaderboard: leaderboard, leaderboard: payload.leaderboard });
  };

  socket.on('question:started', onQuestionStarted);
  socket.on('answer:received', onAnswerReceived);
  socket.on('question:ended', onQuestionEnded);
  socket.on('game:ended', onGameEnded);

  teardownListeners = () => {
    socket.off('question:started', onQuestionStarted);
    socket.off('answer:received', onAnswerReceived);
    socket.off('question:ended', onQuestionEnded);
    socket.off('game:ended', onGameEnded);
    teardownListeners = null;
  };
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  initGame: (pin, firstQuestion = null) => {
    const questionState = firstQuestion
      ? { phase: 'question' as const, currentQuestion: firstQuestion }
      : {};
    set({ pin, ...questionState });
    registerListeners(set, get);
  },

  submitAnswer: (answerId, timeRemaining) => {
    const { pin, phase } = get();
    if (!pin || phase !== 'question') return;
    set({ selectedAnswerId: answerId, phase: 'answered' });
    socket.emit('player:answer', { pin, answerId, timeRemaining });
  },

  endQuestion: () => {
    const { pin } = get();
    if (!pin) return;
    socket.emit('host:end-question', { pin });
  },

  nextQuestion: () => {
    const { pin } = get();
    if (!pin) return;
    socket.emit('host:next-question', { pin });
  },

  reset: () => {
    teardownListeners?.();
    set({ ...initialState });
  },
}));
