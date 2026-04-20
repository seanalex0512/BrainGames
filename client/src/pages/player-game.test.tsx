import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useLobbyStore } from '../stores/lobby-store';
import { useGameStore } from '../stores/game-store';
import type { GameSession, PublicQuestion, PlayerQuestionResult, LeaderboardEntry } from '@braingames/shared';

vi.mock('../utils/socket-client', () => ({
  socket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connected: false,
  },
}));

import { PlayerGame } from './player-game';

const mockSession: GameSession = {
  id: 'session-1',
  quizId: 'quiz-1',
  pin: '123456',
  status: 'playing',
  currentQuestionIndex: 0,
  hostSocketId: 'host-socket',
  createdAt: new Date().toISOString(),
};

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
    { id: 'a3', text: '5', order: 2 },
    { id: 'a4', text: '6', order: 3 },
  ],
};

const correctResult: PlayerQuestionResult = {
  isCorrect: true,
  pointsEarned: 750,
  newScore: 750,
  newStreak: 1,
  correctAnswerId: 'a2',
  selectedAnswerId: 'a2',
};

const wrongResult: PlayerQuestionResult = {
  isCorrect: false,
  pointsEarned: 0,
  newScore: 0,
  newStreak: 0,
  correctAnswerId: 'a2',
  selectedAnswerId: 'a1',
};

const mockLeaderboard: LeaderboardEntry[] = [
  { id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 750, streak: 1 },
];

function setLobbyState(overrides: Partial<ReturnType<typeof useLobbyStore.getState>> = {}) {
  useLobbyStore.setState({
    phase: 'lobby',
    role: 'player',
    session: mockSession,
    players: [],
    selfPlayer: null,
    error: null,
    createGame: vi.fn(),
    reset: vi.fn(),
    kickPlayer: vi.fn(),
    startGame: vi.fn(),
    joinGame: vi.fn(),
    ...overrides,
  });
}

function setGameState(overrides: Partial<ReturnType<typeof useGameStore.getState>> = {}) {
  useGameStore.setState({
    phase: 'idle',
    pin: '123456',
    currentQuestion: null,
    answeredCount: 0,
    totalPlayers: 1,
    selectedAnswerId: null,
    distribution: [],
    correctAnswerId: null,
    playerResult: null,
    leaderboard: [],
    initGame: vi.fn(),
    submitAnswer: vi.fn(),
    endQuestion: vi.fn(),
    nextQuestion: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setLobbyState();
  setGameState();
});

function renderPlayerGame() {
  return render(
    <MemoryRouter initialEntries={['/game/session-1/play']}>
      <Routes>
        <Route path="/game/:sessionId/play" element={<PlayerGame />} />
        <Route path="/join" element={<div>Join</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PlayerGame — question phase', () => {
  it('shows answer buttons (no question text)', () => {
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion });
    renderPlayerGame();
    // Answer options visible
    expect(screen.getByLabelText('3')).toBeDefined();
    expect(screen.getByLabelText('4')).toBeDefined();
    expect(screen.getByLabelText('5')).toBeDefined();
    expect(screen.getByLabelText('6')).toBeDefined();
    // Question text NOT shown on player screen
    expect(screen.queryByText('What is 2+2?')).toBeNull();
  });

  it('shows question progress indicator', () => {
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion });
    renderPlayerGame();
    expect(screen.getByText('Question 1 of 2')).toBeDefined();
  });

  it('calls submitAnswer when an answer button is clicked', async () => {
    const submitAnswer = vi.fn();
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion, submitAnswer });
    renderPlayerGame();
    await userEvent.click(screen.getByLabelText('3'));
    expect(submitAnswer).toHaveBeenCalledWith('a1', 20);
  });

  it('shows loading spinner when no question', () => {
    setLobbyState();
    setGameState({ phase: 'idle', currentQuestion: null });
    renderPlayerGame();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });
});

describe('PlayerGame — answered phase', () => {
  it('shows "Locked in!" message', () => {
    setLobbyState();
    setGameState({ phase: 'answered', currentQuestion: mockQuestion, selectedAnswerId: 'a2' });
    renderPlayerGame();
    expect(screen.getByText('Locked in!')).toBeDefined();
  });

  it('shows waiting message', () => {
    setLobbyState();
    setGameState({ phase: 'answered', currentQuestion: mockQuestion, selectedAnswerId: 'a2' });
    renderPlayerGame();
    expect(screen.getByText(/waiting for other players/i)).toBeDefined();
  });
});

describe('PlayerGame — results phase (correct)', () => {
  it('shows "Correct!" for a right answer', () => {
    setLobbyState();
    setGameState({ phase: 'results', playerResult: correctResult, leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('Correct!')).toBeDefined();
  });

  it('shows points earned', () => {
    setLobbyState();
    setGameState({ phase: 'results', playerResult: correctResult, leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('+750 pts')).toBeDefined();
  });

  it('shows new total score', () => {
    setLobbyState();
    setGameState({ phase: 'results', playerResult: correctResult, leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('750')).toBeDefined();
  });
});

describe('PlayerGame — results phase (wrong)', () => {
  it('shows "Wrong!" for an incorrect answer', () => {
    setLobbyState();
    setGameState({ phase: 'results', playerResult: wrongResult, leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('Wrong!')).toBeDefined();
  });

  it('shows zero score', () => {
    setLobbyState();
    setGameState({ phase: 'results', playerResult: wrongResult, leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('No points this round')).toBeDefined();
  });
});

describe('PlayerGame — ended phase', () => {
  it('shows "Game Over!" when phase is ended', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('Game Over!')).toBeDefined();
  });

  it('shows "Play Again" button', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderPlayerGame();
    expect(screen.getByText('Play Again')).toBeDefined();
  });
});
