const ANSWER_COLORS = [
  { bg: 'bg-brain-red', label: 'A' },
  { bg: 'bg-brain-blue', label: 'B' },
  { bg: 'bg-brain-yellow', label: 'C' },
  { bg: 'bg-brain-green', label: 'D' },
] as const;

interface AnswerOptionProps {
  readonly index: number;
  readonly text: string;
  readonly isCorrect: boolean;
  readonly onChange: (text: string) => void;
  readonly onToggleCorrect: () => void;
  readonly onRemove?: () => void;
  readonly canRemove?: boolean;
}

export function AnswerOption({
  index,
  text,
  isCorrect,
  onChange,
  onToggleCorrect,
  onRemove,
  canRemove = false,
}: AnswerOptionProps) {
  const color = ANSWER_COLORS[index % ANSWER_COLORS.length]!;

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl p-3 border-2 transition-colors',
        isCorrect ? 'border-brain-correct bg-brain-correct/10' : 'border-white/20 bg-white/5',
      ].join(' ')}
    >
      <span className={`${color.bg} text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
        {color.label}
      </span>

      <input
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Answer ${color.label}`}
        aria-label={`Answer ${color.label}`}
        className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
      />

      <button
        type="button"
        onClick={onToggleCorrect}
        aria-label={isCorrect ? 'Mark as incorrect' : 'Mark as correct'}
        title={isCorrect ? 'Correct answer' : 'Mark as correct'}
        className={[
          'w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors',
          isCorrect ? 'bg-brain-correct border-brain-correct' : 'bg-transparent border-white/40 hover:border-brain-correct',
        ].join(' ')}
      >
        {isCorrect && <span className="text-white text-xs leading-none flex items-center justify-center h-full">✓</span>}
      </button>

      {canRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove answer"
          className="text-white/40 hover:text-brain-red transition-colors text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
