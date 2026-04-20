import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLobbyStore } from '../stores/lobby-store';
import { useGameStore } from '../stores/game-store';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audio-manager';
import { CheckIcon, XMarkIcon, LockIcon, FlameIcon } from '../components/ui/icons';

const ANSWER_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
const ANSWER_SHAPES = ['▲', '♦', '●', '■'];

export function PlayerGame() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const session = useLobbyStore((s) => s.session);
  const phase = useGameStore((s) => s.phase);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const selectedAnswerId = useGameStore((s) => s.selectedAnswerId);
  const playerResult = useGameStore((s) => s.playerResult);
  const correctAnswerId = useGameStore((s) => s.correctAnswerId);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const resetGame = useGameStore((s) => s.reset);

  const resetLobby = useLobbyStore((s) => s.reset);

  // Track when the question phase began so we can compute actual elapsed time
  const questionStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase === 'question') {
      questionStartRef.current = Date.now();
    } else {
      questionStartRef.current = null;
    }
  }, [phase]);

  // Correct / incorrect feedback on results
  useEffect(() => {
    if (phase !== 'results' || !playerResult) return;
    if (playerResult.isCorrect) {
      audioManager.playCorrect();
      confetti({
        particleCount: 130,
        spread: 75,
        startVelocity: 48,
        origin: { y: 0.6 },
        colors: ['#66BF39', '#26890C', '#FFFFFF', '#D89E00', '#1368CE'],
      });
    } else {
      audioManager.playIncorrect();
    }
  }, [phase, playerResult]);

  // Cleanup is handled by explicit navigation (Play Again button).
  // Do NOT reset in useEffect cleanup — React StrictMode double-mounts
  // components in dev, causing the first unmount to wipe game state.

  // ── Ended ──────────────────────────────────────────────────────────────────

  if (phase === 'ended') {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-black text-white mb-2"
        >
          Game Over!
        </motion.h1>
        <p className="text-white/60 mb-8">Final Leaderboard</p>

        <div className="flex flex-col gap-2 mb-8">
          {leaderboard.slice(0, 5).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
            >
              <span className="text-white/60 font-black text-lg w-6 text-center">{i + 1}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                style={{ backgroundColor: entry.avatarColor }}
              >
                {entry.nickname[0]?.toUpperCase()}
              </div>
              <span className="text-white font-semibold flex-1 text-left">{entry.nickname}</span>
              <span className="text-white font-black tabular-nums">{entry.score.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => navigate('/join')}
          className="px-8 py-3 bg-brain-purple text-white font-black rounded-xl text-lg hover:bg-brain-purple/80 transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  // ── Results (per-player feedback) ──────────────────────────────────────────

  if (phase === 'results' && playerResult) {
    const { isCorrect, pointsEarned, newScore, newStreak } = playerResult;

    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div
              className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl"
              style={{ backgroundColor: isCorrect ? '#66BF39' : '#E21B3C' }}
            >
              {isCorrect
                ? <CheckIcon size={64} className="text-white" />
                : <XMarkIcon size={64} className="text-white" />}
            </div>

            <h2 className="text-white font-black text-4xl mb-1">
              {isCorrect ? 'Correct!' : 'Wrong!'}
            </h2>

            {isCorrect ? (
              <>
                <p className="text-white/80 text-2xl font-black mb-1">
                  +{pointsEarned.toLocaleString()} pts
                </p>
                {newStreak >= 3 && (
                  <p className="text-brain-yellow font-bold text-lg flex items-center justify-center gap-1.5">
                    <FlameIcon size={18} className="text-brain-yellow" />
                    {newStreak} streak!
                  </p>
                )}
              </>
            ) : (
              <p className="text-white/60 text-lg">No points this round</p>
            )}

            <div className="mt-8 bg-white/10 rounded-2xl px-6 py-4">
              <p className="text-white/60 text-sm font-semibold">Total Score</p>
              <p className="text-white font-black text-4xl tabular-nums">
                {newScore.toLocaleString()}
              </p>
            </div>

            <p className="text-white/40 text-sm mt-6">Waiting for next question…</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Answered (waiting) ─────────────────────────────────────────────────────

  if (phase === 'answered') {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center mb-4 text-white/80">
            <LockIcon size={56} />
          </div>
          <h2 className="text-white font-black text-3xl mb-2">Locked in!</h2>
          <p className="text-white/60">Waiting for other players…</p>
        </motion.div>
      </div>
    );
  }

  // ── Question — show answer buttons only ────────────────────────────────────

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      {/* Question progress indicator (no text — it's on the host screen) */}
      <p className="text-white/50 text-center text-sm font-semibold mb-8">
        Question {currentQuestion.index + 1} of {currentQuestion.totalQuestions}
      </p>

      {/* Answer buttons — large, tap-friendly, Kahoot-style */}
      <div className="grid grid-cols-2 gap-4">
        {currentQuestion.answers.map((answer, i) => {
          const color = ANSWER_COLORS[i % ANSWER_COLORS.length]!;
          const shape = ANSWER_SHAPES[i % ANSWER_SHAPES.length]!;

          return (
            <motion.button
              key={answer.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              disabled={phase === 'answered'}
              onClick={() => {
                const elapsed = questionStartRef.current !== null
                  ? (Date.now() - questionStartRef.current) / 1000
                  : currentQuestion.timeLimit;
                const timeRemaining = Math.max(0, Math.min(
                  currentQuestion.timeLimit,
                  currentQuestion.timeLimit - elapsed
                ));
                submitAnswer(answer.id, timeRemaining);
              }}
              className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: color }}
              aria-label={answer.text}
            >
              <span className="text-white/90 text-3xl">{shape}</span>
              <span className="text-white font-black text-base leading-snug px-2 text-center">
                {answer.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
