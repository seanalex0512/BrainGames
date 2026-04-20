import { describe, it, expect, vi, afterEach } from 'vitest';
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

import { JoinGame } from './join-game';

const mockSession: GameSession = {
  id: 'session-1',
  quizId: 'quiz-1',
  pin: '123456',
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

// Stub actions to prevent socket side effects from useEffect
function setLobbyState(overrides: Partial<ReturnType<typeof useLobbyStore.getState>> = {}) {
  useLobbyStore.setState({
    phase: 'idle',
    role: 'none',
    session: null,
    players: [],
    selfPlayer: null,
    error: null,
    joinGame: vi.fn(),
    reset: vi.fn(),
    createGame: vi.fn(),
    kickPlayer: vi.fn(),
    startGame: vi.fn(),
    ...overrides,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setLobbyState();
});

function renderJoin(path = '/join') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/join" element={<JoinGame />} />
        <Route path="/join/:pin" element={<JoinGame />} />
        <Route path="/game/:id/play" element={<div>Game!</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('JoinGame — join form', () => {
  it('renders the PIN input', () => {
    setLobbyState();
    renderJoin();
    expect(screen.getByLabelText('Game PIN')).toBeDefined();
  });

  it('renders the nickname input', () => {
    setLobbyState();
    renderJoin();
    expect(screen.getByLabelText('Nickname')).toBeDefined();
  });

  it('renders the Join button', () => {
    setLobbyState();
    renderJoin();
    expect(screen.getByRole('button', { name: 'Join →' })).toBeDefined();
  });

  it('Join button is disabled with empty inputs', () => {
    setLobbyState();
    renderJoin();
    const btn = screen.getByRole('button', { name: 'Join →' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Join button is disabled with partial PIN', async () => {
    setLobbyState();
    renderJoin();
    await userEvent.type(screen.getByLabelText('Game PIN'), '123');
    await userEvent.type(screen.getByLabelText('Nickname'), 'Alice');
    const btn = screen.getByRole('button', { name: 'Join →' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Join button enabled with 6-digit PIN and nickname', async () => {
    setLobbyState();
    renderJoin();
    await userEvent.type(screen.getByLabelText('Game PIN'), '123456');
    await userEvent.type(screen.getByLabelText('Nickname'), 'Alice');
    const btn = screen.getByRole('button', { name: 'Join →' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls joinGame with correct values on submit', async () => {
    const joinGame = vi.fn();
    setLobbyState({ joinGame });
    renderJoin();
    await userEvent.type(screen.getByLabelText('Game PIN'), '123456');
    await userEvent.type(screen.getByLabelText('Nickname'), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: 'Join →' }));
    expect(joinGame).toHaveBeenCalledWith('123456', 'Alice');
  });

  it('only accepts numeric input for PIN', async () => {
    setLobbyState();
    renderJoin();
    const pinInput = screen.getByLabelText('Game PIN') as HTMLInputElement;
    await userEvent.type(pinInput, 'abc123def');
    expect(pinInput.value).toBe('123');
  });

  it('pre-fills PIN from URL param', () => {
    setLobbyState();
    render(
      <MemoryRouter initialEntries={['/join/654321']}>
        <Routes>
          <Route path="/join/:pin" element={<JoinGame />} />
        </Routes>
      </MemoryRouter>
    );
    expect((screen.getByLabelText('Game PIN') as HTMLInputElement).value).toBe('654321');
  });

  it('shows error message when phase is error', () => {
    setLobbyState({ phase: 'error', error: 'Game not found' });
    renderJoin();
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Game not found')).toBeDefined();
  });
});

describe('JoinGame — waiting room', () => {
  it('shows waiting room when phase is lobby', () => {
    setLobbyState({
      phase: 'lobby',
      session: mockSession,
      selfPlayer: mockPlayer,
      players: [mockPlayer],
    });
    renderJoin();
    expect(screen.getByText(/waiting for host/i)).toBeDefined();
  });

  it('shows player nickname in waiting room', () => {
    setLobbyState({
      phase: 'lobby',
      session: mockSession,
      selfPlayer: mockPlayer,
      players: [mockPlayer],
    });
    renderJoin();
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('shows player count in waiting room', () => {
    const p2: Player = { ...mockPlayer, id: 'p2', nickname: 'Bob', socketId: 'ps2' };
    setLobbyState({
      phase: 'lobby',
      session: mockSession,
      selfPlayer: mockPlayer,
      players: [mockPlayer, p2],
    });
    renderJoin();
    expect(screen.getByText('2 players in lobby')).toBeDefined();
  });

  it('shows kicked screen when phase is kicked', () => {
    setLobbyState({ phase: 'kicked' });
    renderJoin();
    expect(screen.getByText(/you've been removed/i)).toBeDefined();
  });

  it('shows join another game button when kicked', () => {
    setLobbyState({ phase: 'kicked' });
    renderJoin();
    expect(screen.getByText('Join Another Game')).toBeDefined();
  });
});
