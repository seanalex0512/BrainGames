import type { EditorQuestion, EditorAnswer } from '../../stores/editor-store';
import { AnswerOption } from './answer-option';
import { Button } from '../ui/button';

const TIME_LIMITS = [5, 10, 20, 30, 60] as const;

interface QuestionEditorProps {
  readonly question: EditorQuestion;
  readonly index: number;
  readonly onUpdate: (patch: Partial<Omit<EditorQuestion, 'id' | 'answers'>>) => void;
  readonly onSetAnswers: (answers: EditorAnswer[]) => void;
  readonly onDelete: () => void;
}

export function QuestionEditor({
  question,
  index,
  onUpdate,
  onSetAnswers,
  onDelete,
}: QuestionEditorProps) {
  const isMultipleChoice = question.type === 'multiple_choice';
  const canAddAnswer = isMultipleChoice && question.answers.length < 4;
  const canRemoveAnswer = isMultipleChoice && question.answers.length > 2;

  function handleTypeChange(type: 'multiple_choice' | 'true_false') {
    if (type === 'true_false') {
      const newAnswers: EditorAnswer[] = [
        { id: question.answers[0]?.id ?? crypto.randomUUID(), questionId: question.id, text: 'True', isCorrect: true, order: 0 },
        { id: question.answers[1]?.id ?? crypto.randomUUID(), questionId: question.id, text: 'False', isCorrect: false, order: 1 },
      ];
      onUpdate({ type });
      onSetAnswers(newAnswers);
    } else {
      onUpdate({ type });
    }
  }

  function handleAnswerText(answerId: string, text: string) {
    const updated = question.answers.map((a) => (a.id === answerId ? { ...a, text } : a));
    onSetAnswers(updated);
  }

  function handleToggleCorrect(answerId: string) {
    const updated = question.answers.map((a) => ({
      ...a,
      isCorrect: a.id === answerId,
    }));
    onSetAnswers(updated);
  }

  function handleAddAnswer() {
    const newAnswer: EditorAnswer = {
      id: crypto.randomUUID(),
      questionId: question.id,
      text: '',
      isCorrect: false,
      order: question.answers.length,
    };
    onSetAnswers([...question.answers, newAnswer]);
  }

  function handleRemoveAnswer(answerId: string) {
    const remaining = question.answers
      .filter((a) => a.id !== answerId)
      .map((a, i) => ({ ...a, order: i }));
    // If we removed the correct answer, mark first as correct
    const hasCorrect = remaining.some((a) => a.isCorrect);
    if (!hasCorrect && remaining.length > 0) {
      remaining[0] = { ...remaining[0]!, isCorrect: true };
    }
    onSetAnswers(remaining);
  }

  return (
    <div className="bg-white/5 border border-white/20 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm font-medium">Question {index + 1}</span>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete question">
          Delete
        </Button>
      </div>

      <textarea
        value={question.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Enter your question..."
        aria-label="Question text"
        rows={2}
        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/30 outline-none resize-none focus:border-white/50 transition-colors"
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('multiple_choice')}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              question.type === 'multiple_choice'
                ? 'bg-brain-accent text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20',
            ].join(' ')}
          >
            Multiple Choice
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('true_false')}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              question.type === 'true_false'
                ? 'bg-brain-accent text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20',
            ].join(' ')}
          >
            True / False
          </button>
        </div>

        <select
          value={question.timeLimit}
          onChange={(e) => onUpdate({ timeLimit: parseInt(e.target.value, 10) as typeof question.timeLimit })}
          aria-label="Time limit"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
        >
          {TIME_LIMITS.map((t) => (
            <option key={t} value={t} className="bg-brain-purple">
              {t}s
            </option>
          ))}
        </select>

        <input
          type="number"
          value={question.points}
          onChange={(e) => onUpdate({ points: parseInt(e.target.value, 10) })}
          aria-label="Points"
          min={100}
          max={2000}
          step={100}
          className="w-24 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        {question.answers.map((answer, i) => (
          <AnswerOption
            key={answer.id}
            index={i}
            text={answer.text}
            isCorrect={answer.isCorrect}
            onChange={(text) => handleAnswerText(answer.id, text)}
            onToggleCorrect={() => handleToggleCorrect(answer.id)}
            onRemove={() => handleRemoveAnswer(answer.id)}
            canRemove={canRemoveAnswer}
          />
        ))}
        {canAddAnswer && (
          <Button variant="ghost" size="sm" onClick={handleAddAnswer}>
            + Add answer
          </Button>
        )}
      </div>
    </div>
  );
}
