import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQuizStore } from './quiz-store';
import type { Quiz } from '@braingames/shared';

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

afterEach(() => {
  vi.restoreAllMocks();
  useQuizStore.setState({ quizzes: [], loading: false, error: null });
});

describe('quiz store — initial state', () => {
  it('starts with empty quizzes', () => {
    expect(useQuizStore.getState().quizzes).toEqual([]);
  });

  it('starts with loading false', () => {
    expect(useQuizStore.getState().loading).toBe(false);
  });

  it('starts with null error', () => {
    expect(useQuizStore.getState().error).toBeNull();
  });
});

describe('fetchQuizzes', () => {
  it('populates quizzes on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ success: true, data: [mockQuiz], error: null }),
    }));

    await useQuizStore.getState().fetchQuizzes();
    expect(useQuizStore.getState().quizzes).toHaveLength(1);
    expect(useQuizStore.getState().quizzes[0]?.id).toBe('quiz-1');
    expect(useQuizStore.getState().loading).toBe(false);
  });

  it('sets error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    await useQuizStore.getState().fetchQuizzes();
    expect(useQuizStore.getState().error).toBeTruthy();
    expect(useQuizStore.getState().loading).toBe(false);
  });
});

describe('deleteQuiz', () => {
  beforeEach(() => {
    useQuizStore.setState({ quizzes: [mockQuiz], loading: false, error: null });
  });

  it('removes quiz from state on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) }));
    await useQuizStore.getState().deleteQuiz('quiz-1');
    expect(useQuizStore.getState().quizzes).toHaveLength(0);
  });

  it('keeps quiz in state on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    await useQuizStore.getState().deleteQuiz('quiz-1');
    expect(useQuizStore.getState().quizzes).toHaveLength(1);
  });
});

describe('duplicateQuiz', () => {
  beforeEach(() => {
    useQuizStore.setState({ quizzes: [mockQuiz], loading: false, error: null });
  });

  it('adds duplicated quiz to state', async () => {
    const copy: Quiz = { ...mockQuiz, id: 'quiz-copy', title: 'Test Quiz (Copy)' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: () => Promise.resolve({ success: true, data: copy, error: null }),
    }));
    await useQuizStore.getState().duplicateQuiz('quiz-1');
    expect(useQuizStore.getState().quizzes).toHaveLength(2);
  });
});
