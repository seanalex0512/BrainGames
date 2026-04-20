import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useLobbyStore } from '../stores/lobby-store';
import type { GameSession, Player } from '@braingames/shared';

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

import { HostLobby } from './host-lobby';

const mockSession: GameSession = {
  id: 'session-1',
  quizId: 'quiz-1',
  pin: '987654',
  status: 'lobby',
  currentQuestionIndex: 0,
  hostSocketId: 'host-socket',
  createdAt: new Date().toISOString(),
};

const mockPlayer: Player = {
  id: 'p1',
  sessionId: 'session-1',
  nickname: 'Alice',
  avatarColor: '#E21B3C',
  score: 0,
  streak: 0,
  socketId: 'ps1',
};

// Stub store actions so useEffect calls don't override test state
function setLobbyState(overrides: Partial<ReturnType<typeof useLobbyStore.getState>>) {
  useLobbyStore.setState({
    ...overrides,
    createGame: vi.fn(),
    reset: vi.fn(),
    kickPlayer: vi.fn(),
    startGame: vi.fn(),
    joinGame: vi.fn(),
  });
}

function renderHost(quizId = 'quiz-1') {
  return render(
    <MemoryRouter initialEntries={[`/quiz/${quizId}/host`]}>
      <Routes>
        <Route path="/quiz/:quizId/host" element={<HostLobby />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  useLobbyStore.setState({
    phase: 'idle', role: 'none', session: null, players: [],
    selfPlayer: null, error: null,
    createGame: useLobbyStore.getState().createGame,
    reset: useLobbyStore.getState().reset,
    kickPlayer: useLobbyStore.getState().kickPlayer,
    startGame: useLobbyStore.getState().startGame,
    joinGame: useLobbyStore.getState().joinGame,
  });
});

describe('HostLobby', () => {
  describe('connecting state', () => {
    it('shows loading spinner while connecting', () => {
      setLobbyState({ phase: 'connecting', session: null });
      renderHost();
      expect(document.querySelector('.animate-spin')).not.toBeNull();
    });
  });

  describe('lobby state — no players', () => {
    beforeEach(() => {
      setLobbyState({
        phase: 'lobby',
        role: 'host',
        session: mockSession,
        players: [],
        selfPlayer: null,
        error: null,
      });
    });

    it('displays the game PIN prominently', () => {
      renderHost();
      expect(screen.getByText('987654')).toBeDefined();
    });

    it('shows "Game PIN" label', () => {
      renderHost();
      expect(screen.getByText('Game PIN')).toBeDefined();
    });

    it('shows 0 players joined', () => {
      renderHost();
      expect(screen.getByText('0')).toBeDefined();
    });

    it('shows waiting message when no players', () => {
      renderHost();
      expect(screen.getByText(/waiting for players/i)).toBeDefined();
    });

    it('Start Game button is disabled with 0 players', () => {
      renderHost();
      const btn = screen.getByText('Start Game →').closest('button');
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('lobby state — with players', () => {
    beforeEach(() => {
      setLobbyState({
        phase: 'lobby',
        role: 'host',
        session: mockSession,
        players: [mockPlayer],
        selfPlayer: null,
        error: null,
      });
    });

    it('renders player nickname', () => {
      renderHost();
      expect(screen.getByText('Alice')).toBeDefined();
    });

    it('shows player count', () => {
      renderHost();
      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('player joined')).toBeDefined();
    });

    it('Start Game button is enabled with players present', () => {
      renderHost();
      const btn = screen.getByText('Start Game →').closest('button');
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });

    it('calls startGame when Start button is clicked', async () => {
      const startGame = vi.fn();
      useLobbyStore.setState({ startGame });
      renderHost();
      await userEvent.click(screen.getByText('Start Game →'));
      expect(startGame).toHaveBeenCalledOnce();
    });

    it('renders kick button for each player', () => {
      renderHost();
      expect(screen.getByLabelText('Kick Alice')).toBeDefined();
    });

    it('calls kickPlayer when kick button is clicked', async () => {
      const kickPlayer = vi.fn();
      useLobbyStore.setState({ kickPlayer });
      renderHost();
      await userEvent.click(screen.getByLabelText('Kick Alice'));
      expect(kickPlayer).toHaveBeenCalledWith('p1');
    });

    it('shows plural label with multiple players', () => {
      const p2: Player = { ...mockPlayer, id: 'p2', nickname: 'Bob', socketId: 'ps2' };
      useLobbyStore.setState({ players: [mockPlayer, p2] });
      renderHost();
      expect(screen.getByText('players joined')).toBeDefined();
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      setLobbyState({ phase: 'error', error: 'Failed to create game' });
      renderHost();
      expect(screen.getByText('Failed to create game')).toBeDefined();
    });

    it('shows Back to Library button', () => {
      setLobbyState({ phase: 'error', error: 'oops' });
      renderHost();
      expect(screen.getByText('Back to Library')).toBeDefined();
    });
  });
});
