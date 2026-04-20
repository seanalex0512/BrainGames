import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  QuestionStartedPayload,
  AnswerReceivedPayload,
  QuestionEndedPayload,
  GameEndedPayload,
  PublicQuestion,
} from '@braingames/shared';

const { handlers, mockSocket } = vi.hoisted(() => {
  const handlers = new Map<string, (payload: unknown) => void>();
  const mockSocket = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn().mockImplementation((event: string, fn: (p: unknown) => void) => {
      handlers.set(event, fn);
    }),
    off: vi.fn().mockImplementation((event: string) => {
      handlers.delete(event);
    }),
  };
  return { handlers, mockSocket };
});

vi.mock('../utils/socket-client', () => ({ socket: mockSocket }));

import { useGameStore } from './game-store';

const mockQuestion: PublicQuestion = {
  index: 0,
  totalQuestions: 2,
  text: 'What is 2+2?',
  type: 'multiple_choice',
  timeLimit: 20,
  points: 1000,
  answers: [
    { id: 'a1', text: '3', order: 0 },
    { id: 'a2', text: '4', order: 1 },
  ],
};

function fire(event: string, payload: unknown) {
  handlers.get(event)?.(payload);
}

beforeEach(() => {
  useGameStore.getState().reset();
  vi.clearAllMocks();
  handlers.clear();
});

describe('useGameStore — initial state', () => {
  it('starts in idle phase', () => {
    const { phase, currentQuestion, leaderboard } = useGameStore.getState();
    expect(phase).toBe('idle');
    expect(currentQuestion).toBeNull();
    expect(leaderboard).toHaveLength(0);
  });
});

describe('useGameStore — initGame', () => {
  it('stores pin and registers listeners', () => {
    useGameStore.getState().initGame('123456');
    expect(useGameStore.getState().pin).toBe('123456');
    expect(mockSocket.on).toHaveBeenCalledWith('question:started', expect.any(Function));
  });

  it('sets phase to question when firstQuestion is provided', () => {
    useGameStore.getState().initGame('123456', mockQuestion);
    const state = useGameStore.getState();
    expect(state.pin).toBe('123456');
    expect(state.phase).toBe('question');
    expect(state.currentQuestion?.text).toBe('What is 2+2?');
  });

  it('transitions to question phase on question:started', () => {
    useGameStore.getState().initGame('123456');
    const payload: QuestionStartedPayload = { question: mockQuestion };
    fire('question:started', payload);

    const state = useGameStore.getState();
    expect(state.phase).toBe('question');
    expect(state.currentQuestion?.text).toBe('What is 2+2?');
    expect(state.selectedAnswerId).toBeNull();
  });

  it('resets per-question state on each new question:started', () => {
    useGameStore.getState().initGame('123456');
    fire('question:started', { question: mockQuestion });
    useGameStore.setState({ selectedAnswerId: 'a1', answeredCount: 3 });

    fire('question:started', { question: { ...mockQuestion, index: 1 } });
    const state = useGameStore.getState();
    expect(state.selectedAnswerId).toBeNull();
    expect(state.answeredCount).toBe(0);
  });
});

describe('useGameStore — answer:received', () => {
  it('updates answeredCount and totalPlayers', () => {
    useGameStore.getState().initGame('123456');
    const payload: AnswerReceivedPayload = { answeredCount: 2, totalPlayers: 5 };
    fire('answer:received', payload);

    const state = useGameStore.getState();
    expect(state.answeredCount).toBe(2);
    expect(state.totalPlayers).toBe(5);
  });
});

describe('useGameStore — question:ended', () => {
  it('transitions to results phase with distribution and leaderboard', () => {
    useGameStore.getState().initGame('123456');
    fire('question:started', { question: mockQuestion });

    const payload: QuestionEndedPayload = {
      distribution: [
        { answerId: 'a1', text: '3', count: 1, isCorrect: false },
        { answerId: 'a2', text: '4', count: 4, isCorrect: true },
      ],
      correctAnswerId: 'a2',
      leaderboard: [{ id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 750, streak: 1 }],
      playerResult: {
        isCorrect: true,
        pointsEarned: 750,
        newScore: 750,
        newStreak: 1,
        correctAnswerId: 'a2',
        selectedAnswerId: 'a2',
      },
    };
    fire('question:ended', payload);

    const state = useGameStore.getState();
    expect(state.phase).toBe('results');
    expect(state.correctAnswerId).toBe('a2');
    expect(state.distribution).toHaveLength(2);
    expect(state.playerResult?.isCorrect).toBe(true);
    expect(state.leaderboard).toHaveLength(1);
  });

  it('saves old leaderboard as previousLeaderboard on question:ended', () => {
    useGameStore.getState().initGame('123456');
    // Seed an initial leaderboard
    useGameStore.setState({
      leaderboard: [{ id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 500, streak: 1 }],
    });

    fire('question:ended', {
      distribution: [],
      correctAnswerId: 'a2',
      leaderboard: [{ id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 1000, streak: 2 }],
    } as QuestionEndedPayload);

    const state = useGameStore.getState();
    expect(state.previousLeaderboard[0]?.score).toBe(500);
    expect(state.leaderboard[0]?.score).toBe(1000);
  });

  it('sets playerResult to null when not provided (host view)', () => {
    useGameStore.getState().initGame('123456');
    fire('question:ended', {
      distribution: [],
      correctAnswerId: 'a2',
      leaderboard: [],
    } as QuestionEndedPayload);

    expect(useGameStore.getState().playerResult).toBeNull();
  });
});

describe('useGameStore — game:ended', () => {
  it('transitions to ended phase with final leaderboard', () => {
    useGameStore.getState().initGame('123456');
    const payload: GameEndedPayload = {
      leaderboard: [{ id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 1500, streak: 2 }],
    };
    fire('game:ended', payload);

    const state = useGameStore.getState();
    expect(state.phase).toBe('ended');
    expect(state.leaderboard[0]?.score).toBe(1500);
  });
});

describe('useGameStore — submitAnswer', () => {
  it('emits player:answer and sets selectedAnswerId', () => {
    useGameStore.getState().initGame('123456');
    fire('question:started', { question: mockQuestion });

    useGameStore.getState().submitAnswer('a2', 15);

    expect(mockSocket.emit).toHaveBeenCalledWith('player:answer', {
      pin: '123456',
      answerId: 'a2',
      timeRemaining: 15,
    });
    expect(useGameStore.getState().selectedAnswerId).toBe('a2');
    expect(useGameStore.getState().phase).toBe('answered');
  });

  it('does nothing when phase is not question', () => {
    useGameStore.getState().initGame('123456');
    useGameStore.getState().submitAnswer('a2', 15);
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

describe('useGameStore — endQuestion / nextQuestion', () => {
  it('emits host:end-question with pin', () => {
    useGameStore.getState().initGame('123456');
    useGameStore.getState().endQuestion();
    expect(mockSocket.emit).toHaveBeenCalledWith('host:end-question', { pin: '123456' });
  });

  it('emits host:next-question with pin', () => {
    useGameStore.getState().initGame('123456');
    useGameStore.getState().nextQuestion();
    expect(mockSocket.emit).toHaveBeenCalledWith('host:next-question', { pin: '123456' });
  });
});

describe('useGameStore — reset', () => {
  it('clears state and removes listeners', () => {
    useGameStore.getState().initGame('123456');
    fire('question:started', { question: mockQuestion });
    useGameStore.getState().reset();

    const state = useGameStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.pin).toBeNull();
    expect(state.currentQuestion).toBeNull();
    expect(mockSocket.off).toHaveBeenCalledWith('question:started', expect.any(Function));
  });

  it('listeners no longer update state after reset', () => {
    useGameStore.getState().initGame('123456');
    useGameStore.getState().reset();
    fire('question:started', { question: mockQuestion });
    expect(useGameStore.getState().phase).toBe('idle');
  });
});
