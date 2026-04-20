import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlayStore } from './play-store';
import type { QuestionWithAnswers } from '@braingames/shared';

const mockQuestion = (overrides: Partial<QuestionWithAnswers> = {}): QuestionWithAnswers => ({
  id: 'q1',
  quizId: 'quiz1',
  type: 'multiple_choice',
  text: 'What is 2+2?',
  timeLimit: 20,
  points: 1000,
  order: 0,
  answers: [
    { id: 'a1', questionId: 'q1', text: '3', isCorrect: false, order: 0 },
    { id: 'a2', questionId: 'q1', text: '4', isCorrect: true, order: 1 },
    { id: 'a3', questionId: 'q1', text: '5', isCorrect: false, order: 2 },
    { id: 'a4', questionId: 'q1', text: '6', isCorrect: false, order: 3 },
  ],
  ...overrides,
});

beforeEach(() => {
  usePlayStore.getState().reset();
  vi.restoreAllMocks();
});

describe('usePlayStore — initial state', () => {
  it('starts in idle phase', () => {
    expect(usePlayStore.getState().phase).toBe('idle');
  });

  it('has zero score and streak', () => {
    const { score, streak } = usePlayStore.getState();
    expect(score).toBe(0);
    expect(streak).toBe(0);
  });
});

describe('usePlayStore — loadQuiz', () => {
  it('transitions to question phase on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          quiz: { id: 'quiz1', title: 'Test Quiz', createdAt: '', updatedAt: '' },
          questions: [mockQuestion()],
        },
        error: null,
      }),
    }));

    await usePlayStore.getState().loadQuiz('quiz1');
    const state = usePlayStore.getState();
    expect(state.phase).toBe('question');
    expect(state.quizTitle).toBe('Test Quiz');
    expect(state.questions).toHaveLength(1);
    expect(state.currentIndex).toBe(0);
  });

  it('transitions to idle with error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ success: false, data: null, error: 'Not found' }),
    }));

    await usePlayStore.getState().loadQuiz('bad-id');
    const state = usePlayStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.error).toBeTruthy();
  });
});

describe('usePlayStore — submitAnswer', () => {
  beforeEach(() => {
    usePlayStore.setState({
      phase: 'question',
      quizId: 'quiz1',
      quizTitle: 'Test Quiz',
      questions: [mockQuestion(), mockQuestion({ id: 'q2', order: 1 })],
      currentIndex: 0,
      score: 0,
      streak: 0,
      results: [],
      selectedAnswerId: null,
      error: null,
    });
  });

  it('transitions to feedback phase', () => {
    usePlayStore.getState().submitAnswer('a2', 10);
    expect(usePlayStore.getState().phase).toBe('feedback');
  });

  it('records correct answer and awards points', () => {
    usePlayStore.getState().submitAnswer('a2', 20); // full time, correct
    const state = usePlayStore.getState();
    expect(state.score).toBe(1000);
    expect(state.streak).toBe(1);
    expect(state.results[0].isCorrect).toBe(true);
    expect(state.results[0].pointsEarned).toBe(1000);
  });

  it('records incorrect answer with 0 points', () => {
    usePlayStore.getState().submitAnswer('a1', 10); // wrong answer
    const state = usePlayStore.getState();
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.results[0].isCorrect).toBe(false);
    expect(state.results[0].pointsEarned).toBe(0);
  });

  it('applies streak multiplier after 3 correct answers', () => {
    usePlayStore.setState({ streak: 2 });
    usePlayStore.getState().submitAnswer('a2', 20); // 3rd correct → 1.2x
    const state = usePlayStore.getState();
    expect(state.streak).toBe(3);
    expect(state.results[0].pointsEarned).toBe(1200); // 1000 * 1.2
  });

  it('records selectedAnswerId', () => {
    usePlayStore.getState().submitAnswer('a1', 10);
    expect(usePlayStore.getState().selectedAnswerId).toBe('a1');
  });
});

describe('usePlayStore — nextQuestion', () => {
  it('advances to next question', () => {
    usePlayStore.setState({
      phase: 'feedback',
      questions: [mockQuestion(), mockQuestion({ id: 'q2', order: 1 })],
      currentIndex: 0,
      score: 0,
      streak: 0,
      results: [],
      selectedAnswerId: 'a2',
      quizId: 'quiz1',
      quizTitle: 'Test Quiz',
      error: null,
    });
    usePlayStore.getState().nextQuestion();
    const state = usePlayStore.getState();
    expect(state.phase).toBe('question');
    expect(state.currentIndex).toBe(1);
    expect(state.selectedAnswerId).toBeNull();
  });

  it('transitions to summary after last question', () => {
    usePlayStore.setState({
      phase: 'feedback',
      questions: [mockQuestion()],
      currentIndex: 0,
      score: 500,
      streak: 1,
      results: [],
      selectedAnswerId: 'a2',
      quizId: 'quiz1',
      quizTitle: 'Test Quiz',
      error: null,
    });
    usePlayStore.getState().nextQuestion();
    expect(usePlayStore.getState().phase).toBe('summary');
  });
});

describe('usePlayStore — reset', () => {
  it('resets to idle state', () => {
    usePlayStore.setState({ phase: 'summary', score: 999, streak: 5 });
    usePlayStore.getState().reset();
    const state = usePlayStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
  });
});
