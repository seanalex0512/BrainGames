import { motion } from 'framer-motion';

type ShowResult = 'correct' | 'incorrect' | undefined;

interface AnswerButtonProps {
  readonly index: number;
  readonly text: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly showResult?: ShowResult;
}

const COLORS = [
  { bg: 'bg-brain-red', hover: 'hover:bg-brain-red/90', shape: '▲' },
  { bg: 'bg-brain-blue', hover: 'hover:bg-brain-blue/90', shape: '◆' },
  { bg: 'bg-brain-yellow', hover: 'hover:bg-brain-yellow/90', shape: '●' },
  { bg: 'bg-brain-green', hover: 'hover:bg-brain-green/90', shape: '■' },
];

const TRUE_FALSE_COLORS = [
  { bg: 'bg-brain-blue', hover: 'hover:bg-brain-blue/90', shape: '✓' },
  { bg: 'bg-brain-red', hover: 'hover:bg-brain-red/90', shape: '✗' },
];

function getColor(index: number, isTrueFalse: boolean) {
  if (isTrueFalse) return TRUE_FALSE_COLORS[index % 2];
  return COLORS[index % 4];
}

export function AnswerButton({ index, text, onClick, disabled, showResult }: AnswerButtonProps) {
  const isTrueFalse = text === 'True' || text === 'False';
  const color = getColor(index, isTrueFalse);

  const overlayOpacity =
    showResult === 'correct' ? 'bg-white/20' :
    showResult === 'incorrect' ? 'bg-black/30' :
    '';

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative flex items-center gap-3 w-full rounded-xl px-5 py-4 text-white font-bold text-lg',
        'transition-colors duration-150',
        color.bg,
        !disabled ? color.hover : '',
        'disabled:cursor-not-allowed',
        overlayOpacity,
      ].join(' ')}
    >
      <span className="text-2xl opacity-80">{color.shape}</span>
      <span className="flex-1 text-left">{text}</span>
      {showResult === 'correct' && (
        <span className="text-2xl font-black">✓</span>
      )}
      {showResult === 'incorrect' && (
        <span className="text-2xl font-black">✗</span>
      )}
    </motion.button>
  );
}
