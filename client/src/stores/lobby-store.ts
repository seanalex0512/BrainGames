import { create } from 'zustand';
import type { GameSession, Player, GameCreatedPayload, PlayerJoinedPayload, PlayerLeftPayload, PlayerKickedPayload, GameStartedPayload, GameErrorPayload } from '@braingames/shared';
import { socket } from '../utils/socket-client';
import { useGameStore } from './game-store';

export type LobbyPhase = 'idle' | 'connecting' | 'lobby' | 'kicked' | 'error';
export type LobbyRole = 'none' | 'host' | 'player';

interface LobbyState {
  phase: LobbyPhase;
  role: LobbyRole;
  session: GameSession | null;
  players: Player[];
  selfPlayer: Player | null;
  error: string | null;
}

interface LobbyActions {
  createGame: (quizId: string) => void;
  joinGame: (pin: string, nickname: string) => void;
  kickPlayer: (playerId: string) => void;
  startGame: () => void;
  reset: () => void;
}

const initialState: LobbyState = {
  phase: 'idle',
  role: 'none',
  session: null,
  players: [],
  selfPlayer: null,
  error: null,
};

// Module-level cleanup so listeners aren't duplicated across store actions
let teardownListeners: (() => void) | null = null;

function registerListeners(
  set: (partial: Partial<LobbyState>) => void,
  get: () => LobbyState & LobbyActions,
): void {
  teardownListeners?.();

  const onGameCreated = (payload: GameCreatedPayload) => {
    set({ phase: 'lobby', session: payload.session });
  };

  const onGameJoined = (payload: { session: GameSession; player: Player; players: readonly Player[] }) => {
    set({ phase: 'lobby', session: payload.session, selfPlayer: payload.player, players: [...payload.players] });
  };

  const onPlayerJoined = (payload: PlayerJoinedPayload) => {
    set({ players: [...payload.players] });
  };

  const onPlayerLeft = (payload: PlayerLeftPayload) => {
    set({ players: [...payload.players] });
  };

  const onPlayerKicked = (payload: PlayerKickedPayload) => {
    const { selfPlayer } = get();
    if (selfPlayer && selfPlayer.id === payload.playerId) {
      set({ phase: 'kicked' });
    }
  };

  const onGameStarted = (payload: GameStartedPayload) => {
    // Initialize the game store with pin and first question data from the payload.
    // The server includes firstQuestion directly in game:started to avoid a race
    // condition where navigation unmounts the lobby (disconnecting the socket)
    // before a separate question:started event could arrive.
    useGameStore.getState().initGame(payload.session.pin, payload.firstQuestion ?? null);
    set({ session: payload.session });
  };

  const onGameError = (payload: GameErrorPayload) => {
    set({ phase: 'error', error: payload.message });
  };

  socket.on('game:created', onGameCreated);
  socket.on('game:joined', onGameJoined);
  socket.on('player:joined', onPlayerJoined);
  socket.on('player:left', onPlayerLeft);
  socket.on('player:kicked', onPlayerKicked);
  socket.on('game:started', onGameStarted);
  socket.on('game:error', onGameError);

  teardownListeners = () => {
    socket.off('game:created', onGameCreated);
    socket.off('game:joined', onGameJoined);
    socket.off('player:joined', onPlayerJoined);
    socket.off('player:left', onPlayerLeft);
    socket.off('player:kicked', onPlayerKicked);
    socket.off('game:started', onGameStarted);
    socket.off('game:error', onGameError);
    teardownListeners = null;
  };
}

export const useLobbyStore = create<LobbyState & LobbyActions>((set, get) => ({
  ...initialState,

  createGame: (quizId) => {
    set({ phase: 'connecting', role: 'host', error: null });
    registerListeners(set, get);
    socket.connect();
    socket.emit('game:create', { quizId });
  },

  joinGame: (pin, nickname) => {
    set({ phase: 'connecting', role: 'player', error: null });
    registerListeners(set, get);
    socket.connect();
    socket.emit('game:join', { pin: pin.trim(), nickname: nickname.trim() });
  },

  kickPlayer: (playerId) => {
    const { session } = get();
    if (!session) return;
    socket.emit('player:kick', { pin: session.pin, playerId });
  },

  startGame: () => {
    const { session } = get();
    if (!session) return;
    socket.emit('game:start', { pin: session.pin });
  },

  reset: () => {
    teardownListeners?.();
    socket.disconnect();
    set({ ...initialState });
  },
}));
