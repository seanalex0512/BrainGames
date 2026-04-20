import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useLobbyStore } from '../stores/lobby-store';
import { useGameStore } from '../stores/game-store';
import type { GameSession, PublicQuestion, AnswerDistribution, LeaderboardEntry } from '@braingames/shared';

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

import { HostGame } from './host-game';

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

const mockDistribution: AnswerDistribution[] = [
  { answerId: 'a1', text: '3', count: 1, isCorrect: false },
  { answerId: 'a2', text: '4', count: 3, isCorrect: true },
  { answerId: 'a3', text: '5', count: 0, isCorrect: false },
  { answerId: 'a4', text: '6', count: 0, isCorrect: false },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 750, streak: 1 },
  { id: 'p2', nickname: 'Bob', avatarColor: '#1368CE', score: 500, streak: 0 },
];

function setLobbyState(overrides: Partial<ReturnType<typeof useLobbyStore.getState>> = {}) {
  useLobbyStore.setState({
    phase: 'lobby',
    role: 'host',
    session: mockSession,
    players: [
      { id: 'p1', sessionId: 'session-1', nickname: 'Alice', avatarColor: '#E21B3C', score: 0, streak: 0, socketId: 'ps1' },
    ],
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
    previousLeaderboard: [],
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

function renderHostGame() {
  return render(
    <MemoryRouter initialEntries={['/game/session-1/host']}>
      <Routes>
        <Route path="/game/:sessionId/host" element={<HostGame />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HostGame — question phase', () => {
  it('shows question text', () => {
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion });
    renderHostGame();
    expect(screen.getByText('What is 2+2?')).toBeDefined();
  });

  it('shows all answer options', () => {
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion });
    renderHostGame();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('6')).toBeDefined();
  });

  it('shows question index and total', () => {
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion });
    renderHostGame();
    expect(screen.getByText('Question 1 of 2')).toBeDefined();
  });

  it('shows answered count', () => {
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion, answeredCount: 1, totalPlayers: 1 });
    renderHostGame();
    expect(screen.getByText('1/1')).toBeDefined();
  });

  it('shows loading spinner when no question', () => {
    setLobbyState();
    setGameState({ phase: 'idle', currentQuestion: null });
    renderHostGame();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it('calls endQuestion when "End Question Early" is clicked', async () => {
    const endQuestion = vi.fn();
    setLobbyState();
    setGameState({ phase: 'question', currentQuestion: mockQuestion, endQuestion });
    renderHostGame();
    await userEvent.click(screen.getByText('End Question Early'));
    expect(endQuestion).toHaveBeenCalledOnce();
  });
});

describe('HostGame — results phase', () => {
  it('shows distribution bars', () => {
    setLobbyState();
    setGameState({
      phase: 'results',
      currentQuestion: mockQuestion,
      distribution: mockDistribution,
      correctAnswerId: 'a2',
      leaderboard: mockLeaderboard,
    });
    renderHostGame();
    // Distribution entries
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('shows leaderboard with player names', () => {
    setLobbyState();
    setGameState({
      phase: 'results',
      currentQuestion: mockQuestion,
      distribution: mockDistribution,
      correctAnswerId: 'a2',
      leaderboard: mockLeaderboard,
      previousLeaderboard: [],
    });
    renderHostGame();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
  });

  it('calls nextQuestion when "Next →" is clicked', async () => {
    const nextQuestion = vi.fn();
    setLobbyState();
    setGameState({
      phase: 'results',
      currentQuestion: mockQuestion,
      distribution: mockDistribution,
      correctAnswerId: 'a2',
      leaderboard: mockLeaderboard,
      previousLeaderboard: [],
      nextQuestion,
    });
    renderHostGame();
    await userEvent.click(screen.getByText('Next →'));
    expect(nextQuestion).toHaveBeenCalledOnce();
  });

  it('shows "See Podium 🏆" on the last question', () => {
    const lastQuestion = { ...mockQuestion, index: 1, totalQuestions: 2 };
    setLobbyState();
    setGameState({
      phase: 'results',
      currentQuestion: lastQuestion,
      distribution: mockDistribution,
      correctAnswerId: 'a2',
      leaderboard: mockLeaderboard,
      previousLeaderboard: [],
    });
    renderHostGame();
    expect(screen.getByText('See Podium 🏆')).toBeDefined();
  });
});

describe('HostGame — ended phase (Podium)', () => {
  it('shows "Game Over!" heading', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderHostGame();
    expect(screen.getByText('Game Over!')).toBeDefined();
  });

  it('shows top player on the podium', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderHostGame();
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('shows gold medal for 1st place', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderHostGame();
    expect(screen.getByText('🥇')).toBeDefined();
  });

  it('shows "Play Again →" button', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderHostGame();
    expect(screen.getByText('Play Again →')).toBeDefined();
  });

  it('shows "Back to Library" button', () => {
    setLobbyState();
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard });
    renderHostGame();
    expect(screen.getByText('Back to Library')).toBeDefined();
  });

  it('navigates to re-host on "Play Again →"', async () => {
    const reset = vi.fn();
    setLobbyState({ reset });
    setGameState({ phase: 'ended', leaderboard: mockLeaderboard, reset: vi.fn() });
    renderHostGame();
    await userEvent.click(screen.getByText('Play Again →'));
    // Should navigate away (quiz host route)
    expect(reset).toHaveBeenCalled();
  });
});
