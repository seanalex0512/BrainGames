export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: Record<string, unknown>;
}

export interface HealthStatus {
  readonly status: 'ok' | 'error';
  readonly timestamp: string;
  readonly version: string;
}

export type QuestionType = 'multiple_choice' | 'true_false';

export type TimeLimit = 5 | 10 | 20 | 30 | 60;

export interface Quiz {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Question {
  readonly id: string;
  readonly quizId: string;
  readonly type: QuestionType;
  readonly text: string;
  readonly imageUrl?: string;
  readonly timeLimit: TimeLimit;
  readonly points: number;
  readonly order: number;
}

export interface Answer {
  readonly id: string;
  readonly questionId: string;
  readonly text: string;
  readonly isCorrect: boolean;
  readonly order: number;
}

// --- Input DTOs ---

export interface CreateQuizInput {
  readonly title: string;
  readonly description?: string;
}

export interface UpdateQuizInput {
  readonly title?: string;
  readonly description?: string;
}

export interface CreateQuestionInput {
  readonly type: QuestionType;
  readonly text: string;
  readonly imageUrl?: string;
  readonly timeLimit: TimeLimit;
  readonly points: number;
  readonly order: number;
}

export type UpdateQuestionInput = Partial<CreateQuestionInput>;

export interface CreateAnswerInput {
  readonly text: string;
  readonly isCorrect: boolean;
  readonly order: number;
}

export type UpdateAnswerInput = Partial<CreateAnswerInput>;

export interface ReorderInput {
  readonly ids: ReadonlyArray<string>;
}

export interface ReplaceAnswersInput {
  readonly answers: ReadonlyArray<CreateAnswerInput>;
}

// --- Compound types ---

export interface QuestionWithAnswers extends Question {
  readonly answers: ReadonlyArray<Answer>;
}

export interface QuizWithQuestions {
  readonly quiz: Quiz;
  readonly questions: ReadonlyArray<QuestionWithAnswers>;
}

// --- Phase 2: Multiplayer ---

export interface GameSession {
  readonly id: string;
  readonly quizId: string;
  readonly pin: string; // 6-digit join code
  readonly status: 'lobby' | 'playing' | 'finished';
  readonly currentQuestionIndex: number;
  readonly hostSocketId: string;
  readonly createdAt: string;
}

export interface Player {
  readonly id: string;
  readonly sessionId: string;
  readonly nickname: string;
  readonly avatarColor: string;
  readonly score: number;
  readonly streak: number;
  readonly socketId: string;
}

// --- Live game types (Phase 2) ---

/** Answer stripped of correctness — safe to send to players */
export interface PublicAnswer {
  readonly id: string;
  readonly text: string;
  readonly order: number;
}

/** Question stripped of correctness — safe to send to players */
export interface PublicQuestion {
  readonly index: number;
  readonly totalQuestions: number;
  readonly text: string;
  readonly type: QuestionType;
  readonly timeLimit: TimeLimit;
  readonly points: number;
  readonly answers: ReadonlyArray<PublicAnswer>;
}

/** How many players chose each answer (for host bar chart) */
export interface AnswerDistribution {
  readonly answerId: string;
  readonly text: string;
  readonly count: number;
  readonly isCorrect: boolean;
}

/** Sent individually to each player after a question ends */
export interface PlayerQuestionResult {
  readonly isCorrect: boolean;
  readonly pointsEarned: number;
  readonly newScore: number;
  readonly newStreak: number;
  readonly correctAnswerId: string;
  readonly selectedAnswerId: string | null;
}

/** Leaderboard row */
export interface LeaderboardEntry {
  readonly id: string;
  readonly nickname: string;
  readonly avatarColor: string;
  readonly score: number;
  readonly streak: number;
}

// --- Socket.IO event payloads ---

// Client → Server
export interface GameCreatePayload { readonly quizId: string; }
export interface GameJoinPayload { readonly pin: string; readonly nickname: string; }
export interface GameLeavePayload { readonly pin: string; }
export interface PlayerKickPayload { readonly pin: string; readonly playerId: string; }
export interface GameStartPayload { readonly pin: string; }
export interface PlayerAnswerPayload { readonly pin: string; readonly answerId: string; readonly timeRemaining: number; }
export interface HostEndQuestionPayload { readonly pin: string; }
export interface HostNextQuestionPayload { readonly pin: string; }

// Server → Client
export interface GameCreatedPayload { readonly session: GameSession; }
export interface PlayerJoinedPayload { readonly player: Player; readonly players: ReadonlyArray<Player>; }
export interface PlayerLeftPayload { readonly playerId: string; readonly players: ReadonlyArray<Player>; }
export interface PlayerKickedPayload { readonly playerId: string; }
export interface GameStartedPayload { readonly session: GameSession; readonly firstQuestion?: PublicQuestion; }
export interface GameErrorPayload { readonly message: string; }
export interface QuestionStartedPayload { readonly question: PublicQuestion; }
export interface AnswerReceivedPayload { readonly answeredCount: number; readonly totalPlayers: number; }
export interface QuestionEndedPayload {
  readonly distribution: ReadonlyArray<AnswerDistribution>;
  readonly correctAnswerId: string;
  readonly leaderboard: ReadonlyArray<LeaderboardEntry>;
  readonly playerResult?: PlayerQuestionResult;
}
export interface GameEndedPayload { readonly leaderboard: ReadonlyArray<LeaderboardEntry>; }

// Typed Socket.IO event maps
export interface ServerToClientEvents {
  'game:created': (payload: GameCreatedPayload) => void;
  'game:joined': (payload: { session: GameSession; player: Player; players: ReadonlyArray<Player> }) => void;
  'player:joined': (payload: PlayerJoinedPayload) => void;
  'player:left': (payload: PlayerLeftPayload) => void;
  'player:kicked': (payload: PlayerKickedPayload) => void;
  'game:started': (payload: GameStartedPayload) => void;
  'game:error': (payload: GameErrorPayload) => void;
  'question:started': (payload: QuestionStartedPayload) => void;
  'answer:received': (payload: AnswerReceivedPayload) => void;
  'question:ended': (payload: QuestionEndedPayload) => void;
  'game:ended': (payload: GameEndedPayload) => void;
}

export interface ClientToServerEvents {
  'game:create': (payload: GameCreatePayload) => void;
  'game:join': (payload: GameJoinPayload) => void;
  'game:leave': (payload: GameLeavePayload) => void;
  'player:kick': (payload: PlayerKickPayload) => void;
  'game:start': (payload: GameStartPayload) => void;
  'player:answer': (payload: PlayerAnswerPayload) => void;
  'host:end-question': (payload: HostEndQuestionPayload) => void;
  'host:next-question': (payload: HostNextQuestionPayload) => void;
}
