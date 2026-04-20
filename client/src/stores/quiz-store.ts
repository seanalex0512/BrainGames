import { create } from 'zustand';
import type { Quiz, CreateQuizInput } from '@braingames/shared';
import { apiGet, apiPost, apiDelete } from '../utils/api-client';

interface QuizState {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;
}

interface QuizActions {
  fetchQuizzes: () => Promise<void>;
  createQuiz: (input: CreateQuizInput) => Promise<Quiz | null>;
  deleteQuiz: (id: string) => Promise<void>;
  duplicateQuiz: (id: string) => Promise<Quiz | null>;
}

export const useQuizStore = create<QuizState & QuizActions>((set) => ({
  quizzes: [],
  loading: false,
  error: null,

  fetchQuizzes: async () => {
    set({ loading: true, error: null });
    const result = await apiGet<Quiz[]>('/api/quizzes');
    if (result.success && result.data) {
      set({ quizzes: result.data, loading: false });
    } else {
      set({ error: result.error ?? 'Failed to fetch quizzes', loading: false });
    }
  },

  createQuiz: async (input) => {
    const result = await apiPost<Quiz>('/api/quizzes', input);
    if (result.success && result.data) {
      set((state) => ({ quizzes: [result.data!, ...state.quizzes] }));
      return result.data;
    }
    set({ error: result.error ?? 'Failed to create quiz' });
    return null;
  },

  deleteQuiz: async (id) => {
    const result = await apiDelete(`/api/quizzes/${id}`);
    if (result.success) {
      set((state) => ({ quizzes: state.quizzes.filter((q) => q.id !== id) }));
    } else {
      set({ error: result.error ?? 'Failed to delete quiz' });
    }
  },

  duplicateQuiz: async (id) => {
    const result = await apiPost<Quiz>(`/api/quizzes/${id}/duplicate`, {});
    if (result.success && result.data) {
      set((state) => ({ quizzes: [result.data!, ...state.quizzes] }));
      return result.data;
    }
    set({ error: result.error ?? 'Failed to duplicate quiz' });
    return null;
  },
}));
