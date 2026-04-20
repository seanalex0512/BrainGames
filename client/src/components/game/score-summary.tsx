import { motion } from 'framer-motion';
import type { AnswerResult } from '../../stores/play-store';

interface ScoreSummaryProps {
  readonly quizTitle: string;
  readonly score: number;
  readonly results: readonly AnswerResult[];
  readonly onPlayAgain: () => void;
  readonly onHome: () => void;
}

export function ScoreSummary({ quizTitle, score, results, onPlayAgain, onHome }: ScoreSummaryProps) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-black text-white mb-1">{quizTitle}</h1>
        <p className="text-white/60">Game Over</p>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mt-6 inline-flex flex-col items-center bg-white/10 border border-white/20 rounded-3xl px-12 py-6"
        >
          <span className="text-6xl font-black text-white tabular-nums">{score}</span>
          <span className="text-white/60 text-lg">Total Points</span>
          <span className="text-white/80 font-semibold mt-2">
            {correct}/{total} correct ({pct}%)
          </span>
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-3 mb-8">
        {results.map((result, i) => (
          <motion.div
            key={result.questionId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className={[
              'flex items-start gap-3 rounded-xl px-4 py-3 border',
              result.isCorrect
                ? 'bg-brain-correct/10 border-brain-correct/30'
                : 'bg-brain-red/10 border-brain-red/30',
            ].join(' ')}
          >
            <span className="text-xl mt-0.5">{result.isCorrect ? '✓' : '✗'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm leading-snug line-clamp-2">
                {result.questionText}
              </p>
            </div>
            <span className="text-white/70 font-bold text-sm shrink-0">
              +{result.pointsEarned}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="px-6 py-3 bg-brain-accent hover:bg-brain-accent/90 text-white rounded-xl font-bold"
        >
          Play Again
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHome}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold"
        >
          Back to Library
        </motion.button>
      </div>
    </div>
  );
}
