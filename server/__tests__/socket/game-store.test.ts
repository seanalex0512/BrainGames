import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from '../../src/socket/game-store.js';

const FIXED_PIN = '123456';
const pinGen = () => FIXED_PIN;

describe('GameStore', () => {
  let store: GameStore;

  beforeEach(() => {
    store = new GameStore();
  });

  describe('createSession', () => {
    it('creates a session with 6-digit PIN', () => {
      const session = store.createSession('quiz1', 'host-socket-1');
      expect(session.pin).toMatch(/^\d{6}$/);
    });

    it('creates a session with correct initial values', () => {
      const session = store.createSession('quiz1', 'host-socket-1', pinGen);
      expect(session.quizId).toBe('quiz1');
      expect(session.hostSocketId).toBe('host-socket-1');
      expect(session.status).toBe('lobby');
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.pin).toBe(FIXED_PIN);
    });

    it('generates a unique ID for each session', () => {
      const s1 = store.createSession('quiz1', 'host-1', () => '111111');
      const s2 = store.createSession('quiz2', 'host-2', () => '222222');
      expect(s1.id).not.toBe(s2.id);
    });

    it('increments sessionCount', () => {
      store.createSession('quiz1', 'host-1', () => '111111');
      store.createSession('quiz2', 'host-2', () => '222222');
      expect(store.sessionCount).toBe(2);
    });
  });

  describe('findByPin', () => {
    it('returns the session for a known PIN', () => {
      const created = store.createSession('quiz1', 'host-1', pinGen);
      const found = store.findByPin(FIXED_PIN);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('returns null for unknown PIN', () => {
      expect(store.findByPin('999999')).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns session by ID', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      expect(store.findById(session.id)).toEqual(session);
    });

    it('returns null for unknown ID', () => {
      expect(store.findById('no-such-id')).toBeNull();
    });
  });

  describe('addPlayer', () => {
    it('adds a player to a session', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      const player = store.addPlayer(session.id, 'player-socket', 'Alice');
      expect(player).not.toBeNull();
      expect(player!.nickname).toBe('Alice');
      expect(player!.score).toBe(0);
      expect(player!.streak).toBe(0);
    });

    it('assigns a non-empty avatarColor', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      const player = store.addPlayer(session.id, 'player-socket', 'Alice');
      expect(player!.avatarColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns null for duplicate nickname (case-insensitive)', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      store.addPlayer(session.id, 'socket-1', 'Alice');
      const dup = store.addPlayer(session.id, 'socket-2', 'alice');
      expect(dup).toBeNull();
    });

    it('returns null for unknown sessionId', () => {
      const player = store.addPlayer('no-session', 'socket-1', 'Alice');
      expect(player).toBeNull();
    });

    it('stores player in getPlayers', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      store.addPlayer(session.id, 'socket-1', 'Alice');
      store.addPlayer(session.id, 'socket-2', 'Bob');
      expect(store.getPlayers(session.id)).toHaveLength(2);
    });
  });

  describe('removePlayerBySocketId', () => {
    it('removes a player and returns them', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      store.addPlayer(session.id, 'player-socket', 'Alice');
      const removed = store.removePlayerBySocketId(session.id, 'player-socket');
      expect(removed!.nickname).toBe('Alice');
      expect(store.getPlayers(session.id)).toHaveLength(0);
    });

    it('returns null if socket not found', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      expect(store.removePlayerBySocketId(session.id, 'unknown-socket')).toBeNull();
    });

    it('does not mutate existing player list (immutable)', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      store.addPlayer(session.id, 'socket-1', 'Alice');
      store.addPlayer(session.id, 'socket-2', 'Bob');
      const before = store.getPlayers(session.id);
      store.removePlayerBySocketId(session.id, 'socket-1');
      expect(before).toHaveLength(2); // original reference unchanged
    });
  });

  describe('kickPlayer', () => {
    it('kicks a player by playerId', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      const player = store.addPlayer(session.id, 'socket-1', 'Alice')!;
      const kicked = store.kickPlayer(session.id, player.id);
      expect(kicked!.id).toBe(player.id);
      expect(store.getPlayers(session.id)).toHaveLength(0);
    });

    it('returns null for unknown playerId', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      expect(store.kickPlayer(session.id, 'no-player')).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('updates session status', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      const updated = store.setStatus(session.id, 'playing');
      expect(updated!.status).toBe('playing');
    });

    it('is immutable — does not mutate original session object', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      const original = store.findById(session.id)!;
      store.setStatus(session.id, 'playing');
      expect(original.status).toBe('lobby'); // local ref unchanged
    });

    it('returns null for unknown sessionId', () => {
      expect(store.setStatus('no-id', 'playing')).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('removes session and frees the PIN', () => {
      const session = store.createSession('quiz1', 'host-1', pinGen);
      store.deleteSession(session.id);
      expect(store.findByPin(FIXED_PIN)).toBeNull();
      expect(store.sessionCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('removes all sessions', () => {
      store.createSession('quiz1', 'host-1', () => '111111');
      store.createSession('quiz2', 'host-2', () => '222222');
      store.clear();
      expect(store.sessionCount).toBe(0);
    });
  });

  describe('iterateSessions', () => {
    it('yields all sessions', () => {
      store.createSession('quiz1', 'host-1', () => '111111');
      store.createSession('quiz2', 'host-2', () => '222222');
      const all = [...store.iterateSessions()];
      expect(all).toHaveLength(2);
    });
  });
});
