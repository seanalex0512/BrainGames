import { create } from 'zustand';
import type { QuestionType, TimeLimit, Answer } from '@braingames/shared';

export interface EditorAnswer extends Omit<Answer, 'questionId'> {
  readonly questionId: string;
}

export interface EditorQuestion {
  readonly id: string;
  readonly type: QuestionType;
  readonly text: string;
  readonly imageUrl?: string;
  readonly timeLimit: TimeLimit;
  readonly points: number;
  readonly order: number;
  readonly answers: EditorAnswer[];
}

function makeDefaultAnswers(questionId: string): EditorAnswer[] {
  return [
    { id: crypto.randomUUID(), questionId, text: '', isCorrect: true, order: 0 },
    { id: crypto.randomUUID(), questionId, text: '', isCorrect: false, order: 1 },
  ];
}

function makeDefaultQuestion(order: number): EditorQuestion {
  const id = crypto.randomUUID();
  return {
    id,
    type: 'multiple_choice',
    text: '',
    timeLimit: 20,
    points: 1000,
    order,
    answers: makeDefaultAnswers(id),
  };
}

interface EditorState {
  mode: 'create' | 'edit';
  quizId: string | null;
  title: string;
  description: string;
  questions: EditorQuestion[];
  saving: boolean;
  dirty: boolean;
  error: string | null;
}

interface EditorActions {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  addQuestion: () => void;
  updateQuestion: (id: string, patch: Partial<Omit<EditorQuestion, 'id' | 'answers'>>) => void;
  removeQuestion: (id: string) => void;
  reorderQuestions: (ids: string[]) => void;
  setAnswers: (questionId: string, answers: EditorAnswer[]) => void;
  reset: () => void;
  initCreate: () => void;
  initEdit: (quizId: string, title: string, description: string, questions: EditorQuestion[]) => void;
}

const INITIAL_STATE: EditorState = {
  mode: 'create',
  quizId: null,
  title: '',
  description: '',
  questions: [],
  saving: false,
  dirty: false,
  error: null,
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...INITIAL_STATE,

  setTitle: (title) => set({ title, dirty: true }),

  setDescription: (description) => set({ description, dirty: true }),

  addQuestion: () => {
    const order = get().questions.length;
    const question = makeDefaultQuestion(order);
    set((state) => ({ questions: [...state.questions, question], dirty: true }));
  },

  updateQuestion: (id, patch) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...patch } : q
      ),
      dirty: true,
    }));
  },

  removeQuestion: (id) => {
    set((state) => ({
      questions: state.questions
        .filter((q) => q.id !== id)
        .map((q, i) => ({ ...q, order: i })),
      dirty: true,
    }));
  },

  reorderQuestions: (ids) => {
    set((state) => {
      const map = new Map(state.questions.map((q) => [q.id, q]));
      const reordered = ids
        .map((id, i) => {
          const q = map.get(id);
          return q ? { ...q, order: i } : null;
        })
        .filter(Boolean) as EditorQuestion[];
      return { questions: reordered, dirty: true };
    });
  },

  setAnswers: (questionId, answers) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId ? { ...q, answers } : q
      ),
      dirty: true,
    }));
  },

  reset: () => set({ ...INITIAL_STATE }),

  initCreate: () => set({ ...INITIAL_STATE, mode: 'create' }),

  initEdit: (quizId, title, description, questions) => {
    set({ ...INITIAL_STATE, mode: 'edit', quizId, title, description, questions, dirty: false });
  },
}));
