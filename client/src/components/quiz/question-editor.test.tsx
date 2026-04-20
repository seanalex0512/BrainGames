import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionEditor } from './question-editor';
import type { EditorQuestion } from '../../stores/editor-store';

function makeQuestion(overrides: Partial<EditorQuestion> = {}): EditorQuestion {
  const id = 'q1';
  return {
    id,
    type: 'multiple_choice',
    text: 'Test question',
    timeLimit: 20,
    points: 1000,
    order: 0,
    answers: [
      { id: 'a1', questionId: id, text: 'Answer A', isCorrect: true, order: 0 },
      { id: 'a2', questionId: id, text: 'Answer B', isCorrect: false, order: 1 },
    ],
    ...overrides,
  };
}

describe('QuestionEditor', () => {
  it('renders question text', () => {
    render(<QuestionEditor question={makeQuestion()} index={0} onUpdate={vi.fn()} onSetAnswers={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByDisplayValue('Test question')).toBeDefined();
  });

  it('renders all answers', () => {
    render(<QuestionEditor question={makeQuestion()} index={0} onUpdate={vi.fn()} onSetAnswers={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByDisplayValue('Answer A')).toBeDefined();
    expect(screen.getByDisplayValue('Answer B')).toBeDefined();
  });

  it('calls onUpdate when text changes', async () => {
    const onUpdate = vi.fn();
    render(<QuestionEditor question={makeQuestion()} index={0} onUpdate={onUpdate} onSetAnswers={vi.fn()} onDelete={vi.fn()} />);
    const textarea = screen.getByLabelText('Question text');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'New text');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('calls onDelete when Delete button clicked', async () => {
    const onDelete = vi.fn();
    render(<QuestionEditor question={makeQuestion()} index={0} onUpdate={vi.fn()} onSetAnswers={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText('Delete question'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows True/False answers when type is true_false', () => {
    const question = makeQuestion({
      type: 'true_false',
      answers: [
        { id: 'a1', questionId: 'q1', text: 'True', isCorrect: true, order: 0 },
        { id: 'a2', questionId: 'q1', text: 'False', isCorrect: false, order: 1 },
      ],
    });
    render(<QuestionEditor question={question} index={0} onUpdate={vi.fn()} onSetAnswers={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByDisplayValue('True')).toBeDefined();
    expect(screen.getByDisplayValue('False')).toBeDefined();
  });

  it('shows Add answer button when < 4 answers', () => {
    render(<QuestionEditor question={makeQuestion()} index={0} onUpdate={vi.fn()} onSetAnswers={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('+ Add answer')).toBeDefined();
  });

  it('does not show Add answer button when 4 answers', () => {
    const question = makeQuestion({
      answers: [
        { id: 'a1', questionId: 'q1', text: 'A', isCorrect: true, order: 0 },
        { id: 'a2', questionId: 'q1', text: 'B', isCorrect: false, order: 1 },
        { id: 'a3', questionId: 'q1', text: 'C', isCorrect: false, order: 2 },
        { id: 'a4', questionId: 'q1', text: 'D', isCorrect: false, order: 3 },
      ],
    });
    render(<QuestionEditor question={question} index={0} onUpdate={vi.fn()} onSetAnswers={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('+ Add answer')).toBeNull();
  });
});
