import { create } from 'zustand';
import type { QuestionWithAnswers } from '@braingames/shared';
import { apiGet } from '../utils/api-client';
import { calculatePoints, streakMultiplier } from '../utils/scoring';
import type { QuizWithQuestions } from '@braingames/shared';

export type GamePhase = 'idle' | 'loading' | 'question' | 'feedback' | 'summary';

export interface AnswerResult {
  readonly questionId: string;
  readonly questionText: string;
  readonly selectedAnswerId: string | null;
  readonly correctAnswerId: string;
  readonly isCorrect: boolean;
  readonly timeRemaining: number;
  readonly pointsEarned: number;
}

interface PlayState {
  phase: GamePhase;
  quizId: string | null;
  quizTitle: string;
  questions: QuestionWithAnswers[];
  currentIndex: number;
  score: number;
  streak: number;
  results: AnswerResult[];
  selectedAnswerId: string | null;
  error: string | null;
}

interface PlayActions {
  loadQuiz: (id: string) => Promise<void>;
  submitAnswer: (answerId: string | null, timeRemaining: number) => void;
  nextQuestion: () => void;
  reset: () => void;
}

const initialState: PlayState = {
  phase: 'idle',
  quizId: null,
  quizTitle: '',
  questions: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
  results: [],
  selectedAnswerId: null,
  error: null,
};

export const usePlayStore = create<PlayState & PlayActions>((set, get) => ({
  ...initialState,

  loadQuiz: async (id) => {
    set({ phase: 'loading', error: null });
    const res = await apiGet<QuizWithQuestions>(`/api/quizzes/${id}`);
    if (!res.success || !res.data) {
      set({ phase: 'idle', error: res.error ?? 'Failed to load quiz' });
      return;
    }
    set({
      phase: 'question',
      quizId: id,
      quizTitle: res.data.quiz.title,
      questions: [...res.data.questions],
      currentIndex: 0,
      score: 0,
      streak: 0,
      results: [],
      selectedAnswerId: null,
    });
  },

  submitAnswer: (answerId, timeRemaining) => {
    const { questions, currentIndex, score, streak } = get();
    const question = questions[currentIndex];
    if (!question) return;

    const correctAnswer = question.answers.find((a) => a.isCorrect);
    const isCorrect = answerId !== null && answerId === correctAnswer?.id;
    const newStreak = isCorrect ? streak + 1 : 0;
    const pointsEarned = calculatePoints(
      question.points,
      question.timeLimit,
      timeRemaining,
      isCorrect,
      newStreak, // use new streak so multiplier applies on the answer that earns it
    );

    const result: AnswerResult = {
      questionId: question.id,
      questionText: question.text,
      selectedAnswerId: answerId,
      correctAnswerId: correctAnswer?.id ?? '',
      isCorrect,
      timeRemaining,
      pointsEarned,
    };

    set({
      phase: 'feedback',
      score: score + pointsEarned,
      streak: newStreak,
      selectedAnswerId: answerId,
      results: [...get().results, result],
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      set({ phase: 'summary' });
    } else {
      set({ phase: 'question', currentIndex: nextIndex, selectedAnswerId: null });
    }
  },

  reset: () => set({ ...initialState }),
}));

// Selectors
export const selectCurrentQuestion = (state: PlayState) =>
  state.questions[state.currentIndex] ?? null;

export const selectStreakMultiplier = (state: PlayState) =>
  streakMultiplier(state.streak);
