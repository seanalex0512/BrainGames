import { describe, it, expect, vi, afterEach } from 'vitest';
import { useEditorStore } from './editor-store';

afterEach(() => {
  vi.restoreAllMocks();
  useEditorStore.getState().reset();
});

describe('editor store — initial state', () => {
  it('starts in create mode with empty quiz', () => {
    const state = useEditorStore.getState();
    expect(state.mode).toBe('create');
    expect(state.title).toBe('');
    expect(state.description).toBe('');
    expect(state.questions).toEqual([]);
    expect(state.saving).toBe(false);
    expect(state.dirty).toBe(false);
  });
});

describe('setTitle', () => {
  it('updates title and marks dirty', () => {
    useEditorStore.getState().setTitle('My Quiz');
    expect(useEditorStore.getState().title).toBe('My Quiz');
    expect(useEditorStore.getState().dirty).toBe(true);
  });
});

describe('setDescription', () => {
  it('updates description and marks dirty', () => {
    useEditorStore.getState().setDescription('A desc');
    expect(useEditorStore.getState().description).toBe('A desc');
    expect(useEditorStore.getState().dirty).toBe(true);
  });
});

describe('addQuestion', () => {
  it('adds a question to the list', () => {
    useEditorStore.getState().addQuestion();
    expect(useEditorStore.getState().questions).toHaveLength(1);
    expect(useEditorStore.getState().dirty).toBe(true);
  });

  it('sets default values on new question', () => {
    useEditorStore.getState().addQuestion();
    const q = useEditorStore.getState().questions[0];
    expect(q?.type).toBe('multiple_choice');
    expect(q?.timeLimit).toBe(20);
    expect(q?.points).toBe(1000);
    expect(q?.answers).toHaveLength(2);
  });
});

describe('updateQuestion', () => {
  it('updates a question field immutably', () => {
    useEditorStore.getState().addQuestion();
    const id = useEditorStore.getState().questions[0]!.id;
    useEditorStore.getState().updateQuestion(id, { text: 'Updated text' });

    const q = useEditorStore.getState().questions[0]!;
    expect(q.text).toBe('Updated text');
    expect(useEditorStore.getState().questions).toHaveLength(1);
  });
});

describe('removeQuestion', () => {
  it('removes a question from the list', () => {
    useEditorStore.getState().addQuestion();
    const id = useEditorStore.getState().questions[0]!.id;
    useEditorStore.getState().removeQuestion(id);
    expect(useEditorStore.getState().questions).toHaveLength(0);
  });
});

describe('reorderQuestions', () => {
  it('reorders questions array', () => {
    useEditorStore.getState().addQuestion();
    useEditorStore.getState().addQuestion();
    const [id0, id1] = useEditorStore.getState().questions.map((q) => q.id);
    useEditorStore.getState().reorderQuestions([id1!, id0!]);
    expect(useEditorStore.getState().questions[0]?.id).toBe(id1);
  });
});

describe('setAnswers', () => {
  it('replaces answers for a question', () => {
    useEditorStore.getState().addQuestion();
    const id = useEditorStore.getState().questions[0]!.id;
    useEditorStore.getState().setAnswers(id, [
      { id: 'a1', questionId: id, text: 'Option A', isCorrect: true, order: 0 },
      { id: 'a2', questionId: id, text: 'Option B', isCorrect: false, order: 1 },
    ]);
    expect(useEditorStore.getState().questions[0]?.answers).toHaveLength(2);
    expect(useEditorStore.getState().questions[0]?.answers[0]?.text).toBe('Option A');
  });
});

describe('reset', () => {
  it('resets to initial state', () => {
    useEditorStore.getState().setTitle('Something');
    useEditorStore.getState().addQuestion();
    useEditorStore.getState().reset();

    const state = useEditorStore.getState();
    expect(state.title).toBe('');
    expect(state.questions).toHaveLength(0);
    expect(state.dirty).toBe(false);
  });
});
