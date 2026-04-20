import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameSession, Player } from '@braingames/shared';

// vi.hoisted ensures these are defined before vi.mock hoists the factory
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

import { useLobbyStore } from './lobby-store';

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
  id: 'player-1',
  sessionId: 'session-1',
  nickname: 'Alice',
  avatarColor: '#E21B3C',
  score: 0,
  streak: 0,
  socketId: 'player-socket',
};

function fire(event: string, payload: unknown) {
  handlers.get(event)?.(payload);
}

beforeEach(() => {
  useLobbyStore.getState().reset();
  vi.clearAllMocks();
  handlers.clear();
});

describe('useLobbyStore — initial state', () => {
  it('starts in idle phase with no session', () => {
    const { phase, role, session, players } = useLobbyStore.getState();
    expect(phase).toBe('idle');
    expect(role).toBe('none');
    expect(session).toBeNull();
    expect(players).toHaveLength(0);
  });
});

describe('useLobbyStore — createGame', () => {
  it('transitions to connecting and emits game:create', () => {
    useLobbyStore.getState().createGame('quiz-1');
    expect(useLobbyStore.getState().phase).toBe('connecting');
    expect(useLobbyStore.getState().role).toBe('host');
    expect(mockSocket.connect).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('game:create', { quizId: 'quiz-1' });
  });

  it('transitions to lobby when game:created fires', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });
    const state = useLobbyStore.getState();
    expect(state.phase).toBe('lobby');
    expect(state.session?.pin).toBe('123456');
  });

  it('transitions to error when game:error fires', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:error', { message: 'Something went wrong' });
    const state = useLobbyStore.getState();
    expect(state.phase).toBe('error');
    expect(state.error).toBe('Something went wrong');
  });
});

describe('useLobbyStore — joinGame', () => {
  it('emits game:join with trimmed pin and nickname', () => {
    useLobbyStore.getState().joinGame(' 123456 ', '  Alice  ');
    expect(mockSocket.emit).toHaveBeenCalledWith('game:join', { pin: '123456', nickname: 'Alice' });
    expect(useLobbyStore.getState().role).toBe('player');
  });

  it('populates session and selfPlayer on game:joined', () => {
    useLobbyStore.getState().joinGame('123456', 'Alice');
    fire('game:joined', { session: mockSession, player: mockPlayer, players: [mockPlayer] });
    const state = useLobbyStore.getState();
    expect(state.phase).toBe('lobby');
    expect(state.selfPlayer?.nickname).toBe('Alice');
    expect(state.players).toHaveLength(1);
  });
});

describe('useLobbyStore — player:joined / player:left', () => {
  it('updates player list on player:joined', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });

    const newPlayer: Player = { ...mockPlayer, id: 'player-2', nickname: 'Bob', socketId: 'socket-2' };
    fire('player:joined', { player: newPlayer, players: [mockPlayer, newPlayer] });

    expect(useLobbyStore.getState().players).toHaveLength(2);
  });

  it('updates player list on player:left', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });
    fire('player:joined', { player: mockPlayer, players: [mockPlayer] });
    fire('player:left', { playerId: mockPlayer.id, players: [] });

    expect(useLobbyStore.getState().players).toHaveLength(0);
  });
});

describe('useLobbyStore — player:kicked', () => {
  it('sets phase to kicked when self is kicked', () => {
    useLobbyStore.getState().joinGame('123456', 'Alice');
    fire('game:joined', { session: mockSession, player: mockPlayer, players: [mockPlayer] });
    fire('player:kicked', { playerId: mockPlayer.id });
    expect(useLobbyStore.getState().phase).toBe('kicked');
  });

  it('does not change phase when a different player is kicked', () => {
    useLobbyStore.getState().joinGame('123456', 'Alice');
    fire('game:joined', { session: mockSession, player: mockPlayer, players: [mockPlayer] });
    fire('player:kicked', { playerId: 'some-other-player' });
    expect(useLobbyStore.getState().phase).toBe('lobby');
  });
});

describe('useLobbyStore — kickPlayer', () => {
  it('emits player:kick with pin and playerId', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });
    useLobbyStore.getState().kickPlayer('player-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('player:kick', {
      pin: '123456',
      playerId: 'player-1',
    });
  });

  it('does nothing when there is no session', () => {
    useLobbyStore.getState().kickPlayer('player-1');
    expect(mockSocket.emit).not.toHaveBeenCalledWith('player:kick', expect.anything());
  });
});

describe('useLobbyStore — startGame', () => {
  it('emits game:start with session pin', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });
    useLobbyStore.getState().startGame();
    expect(mockSocket.emit).toHaveBeenCalledWith('game:start', { pin: '123456' });
  });

  it('does nothing when there is no session', () => {
    useLobbyStore.getState().startGame();
    expect(mockSocket.emit).not.toHaveBeenCalledWith('game:start', expect.anything());
  });
});

describe('useLobbyStore — game:started', () => {
  it('updates session status to playing', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });
    fire('game:started', { session: { ...mockSession, status: 'playing' } });
    expect(useLobbyStore.getState().session?.status).toBe('playing');
  });
});

describe('useLobbyStore — reset', () => {
  it('resets to initial state and disconnects', () => {
    useLobbyStore.getState().createGame('quiz-1');
    fire('game:created', { session: mockSession });
    useLobbyStore.getState().reset();
    const state = useLobbyStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.session).toBeNull();
    expect(state.role).toBe('none');
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('removes socket listeners on reset (events no longer update state)', () => {
    useLobbyStore.getState().createGame('quiz-1');
    useLobbyStore.getState().reset();
    // After reset, the handlers are removed so firing game:created should be ignored
    fire('game:created', { session: mockSession });
    expect(useLobbyStore.getState().session).toBeNull();
  });
});
