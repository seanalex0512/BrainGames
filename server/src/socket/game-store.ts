import { randomUUID } from 'crypto';
import type { GameSession, Player, QuestionWithAnswers } from '@braingames/shared';

export interface SessionAnswer {
  readonly playerId: string;
  readonly socketId: string;
  readonly answerId: string;
  readonly timeRemaining: number;
  readonly pointsEarned: number;
}

const AVATAR_COLORS = [
  '#E21B3C', '#1368CE', '#D89E00', '#26890C',
  '#CC0066', '#46178F', '#FF7700', '#00AACC',
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? '#46178F';
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class GameStore {
  private readonly sessions = new Map<string, GameSession>();
  private readonly pinIndex = new Map<string, string>(); // pin → sessionId
  private readonly players = new Map<string, Player[]>(); // sessionId → players
  private readonly questions = new Map<string, QuestionWithAnswers[]>(); // sessionId → questions
  private readonly answers = new Map<string, Map<number, SessionAnswer[]>>(); // sessionId → (qIndex → answers)
  private readonly endedQuestions = new Map<string, Set<number>>(); // sessionId → ended question indices

  // ── Session management ──────────────────────────────────────────────────

  createSession(quizId: string, hostSocketId: string, pinGen = generatePin): GameSession {
    let pin = pinGen();
    while (this.pinIndex.has(pin)) pin = pinGen();

    const session: GameSession = {
      id: randomUUID(),
      quizId,
      pin,
      status: 'lobby',
      currentQuestionIndex: 0,
      hostSocketId,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    this.pinIndex.set(pin, session.id);
    this.players.set(session.id, []);
    this.answers.set(session.id, new Map());
    this.endedQuestions.set(session.id, new Set());

    return session;
  }

  findByPin(pin: string): GameSession | null {
    const id = this.pinIndex.get(pin);
    return id ? (this.sessions.get(id) ?? null) : null;
  }

  findById(id: string): GameSession | null {
    return this.sessions.get(id) ?? null;
  }

  setStatus(sessionId: string, status: GameSession['status']): GameSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const updated: GameSession = { ...session, status };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  setCurrentQuestionIndex(sessionId: string, index: number): GameSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const updated: GameSession = { ...session, currentQuestionIndex: index };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.pinIndex.delete(session.pin);
      this.players.delete(sessionId);
      this.questions.delete(sessionId);
      this.answers.delete(sessionId);
      this.endedQuestions.delete(sessionId);
      this.sessions.delete(sessionId);
    }
  }

  get sessionCount(): number { return this.sessions.size; }

  *iterateSessions(): IterableIterator<GameSession> {
    yield* this.sessions.values();
  }

  // ── Player management ───────────────────────────────────────────────────

  getPlayers(sessionId: string): Player[] {
    return this.players.get(sessionId) ?? [];
  }

  addPlayer(sessionId: string, socketId: string, nickname: string): Player | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const existing = this.players.get(sessionId) ?? [];
    if (existing.some((p) => p.nickname.toLowerCase() === nickname.toLowerCase())) return null;

    const player: Player = {
      id: randomUUID(),
      sessionId,
      nickname,
      avatarColor: randomAvatarColor(),
      score: 0,
      streak: 0,
      socketId,
    };
    this.players.set(sessionId, [...existing, player]);
    return player;
  }

  removePlayerBySocketId(sessionId: string, socketId: string): Player | null {
    const list = this.players.get(sessionId);
    if (!list) return null;
    const player = list.find((p) => p.socketId === socketId) ?? null;
    if (player) this.players.set(sessionId, list.filter((p) => p.socketId !== socketId));
    return player;
  }

  kickPlayer(sessionId: string, playerId: string): Player | null {
    const list = this.players.get(sessionId);
    if (!list) return null;
    const player = list.find((p) => p.id === playerId) ?? null;
    if (player) this.players.set(sessionId, list.filter((p) => p.id !== playerId));
    return player;
  }

  updatePlayerScore(sessionId: string, playerId: string, pointsToAdd: number, newStreak: number): Player | null {
    const list = this.players.get(sessionId);
    if (!list) return null;
    const idx = list.findIndex((p) => p.id === playerId);
    if (idx === -1) return null;
    const updated: Player = { ...list[idx]!, score: list[idx]!.score + pointsToAdd, streak: newStreak };
    const newList = [...list];
    newList[idx] = updated;
    this.players.set(sessionId, newList);
    return updated;
  }

  // ── Question management ─────────────────────────────────────────────────

  setQuestions(sessionId: string, qs: QuestionWithAnswers[]): void {
    this.questions.set(sessionId, qs);
  }

  getQuestions(sessionId: string): QuestionWithAnswers[] {
    return this.questions.get(sessionId) ?? [];
  }

  // ── Answer tracking ─────────────────────────────────────────────────────

  /** Returns false if this player already answered this question index */
  recordAnswer(sessionId: string, questionIndex: number, answer: SessionAnswer): boolean {
    const byIndex = this.answers.get(sessionId);
    if (!byIndex) return false;
    const existing = byIndex.get(questionIndex) ?? [];
    if (existing.some((a) => a.playerId === answer.playerId)) return false;
    byIndex.set(questionIndex, [...existing, answer]);
    return true;
  }

  getAnswers(sessionId: string, questionIndex: number): SessionAnswer[] {
    return this.answers.get(sessionId)?.get(questionIndex) ?? [];
  }

  // ── Idempotency guard for question:ended ────────────────────────────────

  isQuestionEnded(sessionId: string, questionIndex: number): boolean {
    return this.endedQuestions.get(sessionId)?.has(questionIndex) ?? false;
  }

  markQuestionEnded(sessionId: string, questionIndex: number): void {
    const set = this.endedQuestions.get(sessionId);
    if (set) set.add(questionIndex);
  }

  // ── Utility ─────────────────────────────────────────────────────────────

  clear(): void {
    this.sessions.clear();
    this.pinIndex.clear();
    this.players.clear();
    this.questions.clear();
    this.answers.clear();
    this.endedQuestions.clear();
  }
}
