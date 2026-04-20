import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckIcon, XMarkIcon } from '../ui/icons';

interface FeedbackOverlayProps {
  readonly isCorrect: boolean;
  readonly pointsEarned: number;
  readonly streak: number;
  readonly onNext: () => void;
  readonly isLastQuestion: boolean;
}

export function FeedbackOverlay({
  isCorrect,
  pointsEarned,
  streak,
  onNext,
  isLastQuestion,
}: FeedbackOverlayProps) {
  useEffect(() => {
    if (!isCorrect) return;
    confetti({
      particleCount: 140,
      spread: 80,
      startVelocity: 50,
      origin: { y: 0.55 },
      colors: ['#66BF39', '#26890C', '#FFFFFF', '#D89E00', '#1368CE', '#E21B3C'],
    });
  }, [isCorrect]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={[
        'fixed inset-0 flex flex-col items-center justify-center z-50',
        isCorrect ? 'bg-brain-correct/95' : 'bg-brain-red/95',
      ].join(' ')}
    >
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-4 flex justify-center">
          {isCorrect
            ? <CheckIcon size={96} className="text-white" />
            : <XMarkIcon size={96} className="text-white" />}
        </div>
        <h2 className="text-4xl font-black text-white mb-2">
          {isCorrect ? 'Correct!' : 'Incorrect!'}
        </h2>

        {isCorrect && pointsEarned > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl text-white/90 font-bold mb-1"
          >
            +{pointsEarned} pts
          </motion.p>
        )}

        {isCorrect && streak >= 3 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="text-xl text-white/80 mt-2"
          >
            🔥 {streak} streak!
          </motion.p>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="mt-12 px-8 py-4 bg-white text-gray-900 rounded-2xl text-xl font-black hover:bg-white/90 transition-colors"
      >
        {isLastQuestion ? 'See Results' : 'Next Question →'}
      </motion.button>
    </motion.div>
  );
}
