import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLobbyStore } from '../stores/lobby-store';
import { useGameStore } from '../stores/game-store';
import { Leaderboard } from '../components/game/leaderboard';
import { Podium } from '../components/game/podium';
import { audioManager } from '../utils/audio-manager';
import type { AnswerDistribution } from '@braingames/shared';

const ANSWER_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
const ANSWER_SHAPES = ['▲', '♦', '●', '■'];

// ── Countdown timer ────────────────────────────────────────────────────────────

function CountdownTimer({ timeLimit, onExpire }: { timeLimit: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(timeLimit);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(timeLimit);
    const start = Date.now();

    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, timeLimit - elapsed);
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(tick);
        onExpire();
      }
    }, 100);

    return () => clearInterval(tick);
  }, [timeLimit, onExpire]);

  const pct = remaining / timeLimit;
  const color = pct > 0.5 ? '#26890C' : pct > 0.25 ? '#D89E00' : '#E21B3C';

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct * 100} 100`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl tabular-nums">
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}

// ── Distribution bar ───────────────────────────────────────────────────────────

function DistributionBar({ entry, maxCount }: { entry: AnswerDistribution; maxCount: number }) {
  const pct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-1 rounded-lg overflow-hidden h-10 relative ${entry.isCorrect ? 'ring-2 ring-brain-correct' : ''}`}
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: entry.isCorrect ? '#66BF39' : 'rgba(255,255,255,0.25)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <span className="absolute inset-0 flex items-center px-3 text-white font-semibold text-sm">
          {entry.text}
        </span>
      </div>
      <span className="text-white font-black text-lg w-8 text-right tabular-nums">{entry.count}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HostGame() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const session = useLobbyStore((s) => s.session);
  const players = useLobbyStore((s) => s.players);
  const phase = useGameStore((s) => s.phase);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const answeredCount = useGameStore((s) => s.answeredCount);
  const distribution = useGameStore((s) => s.distribution);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const previousLeaderboard = useGameStore((s) => s.previousLeaderboard);
  const endQuestion = useGameStore((s) => s.endQuestion);
  const nextQuestion = useGameStore((s) => s.nextQuestion);
  const resetGame = useGameStore((s) => s.reset);
  const resetLobby = useLobbyStore((s) => s.reset);

  // Cleanup is handled by explicit navigation (Back / Play Again buttons).
  // Do NOT reset in useEffect cleanup — React StrictMode double-mounts
  // components in dev, causing the first unmount to wipe game state.

  // Sound effects driven by phase transitions
  const prevPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === 'question') {
      audioManager.startCountdownMusic();
    } else {
      audioManager.stopCountdownMusic();
    }

    if (phase === 'results' && prev === 'question') {
      audioManager.playDrumroll();
    }

    if (phase === 'ended') {
      audioManager.playFanfare();
    }

    return () => { audioManager.stopCountdownMusic(); };
  }, [phase]);

  // ── Ended — Podium ────────────────────────────────────────────────────────────

  if (phase === 'ended') {
    return (
      <Podium
        leaderboard={leaderboard}
        onPlayAgain={() => {
          resetLobby();
          resetGame();
          navigate(`/quiz/${session?.quizId}/host`);
        }}
        onBack={() => {
          resetLobby();
          resetGame();
          navigate('/');
        }}
      />
    );
  }

  // ── Results — distribution + animated leaderboard ─────────────────────────────

  if (phase === 'results') {
    const maxCount = Math.max(...distribution.map((d) => d.count), 1);
    const isLastQuestion =
      currentQuestion !== null &&
      currentQuestion.index + 1 >= currentQuestion.totalQuestions;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Answer distribution */}
        <div className="text-center mb-4">
          <p className="text-white/60 font-semibold uppercase tracking-widest text-sm">Results</p>
          <h2 className="text-white font-black text-2xl mt-1">{currentQuestion?.text}</h2>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {distribution.map((entry) => (
            <DistributionBar key={entry.answerId} entry={entry} maxCount={maxCount} />
          ))}
        </div>

        {/* Animated leaderboard */}
        <Leaderboard
          leaderboard={leaderboard}
          previousLeaderboard={previousLeaderboard}
          onNext={nextQuestion}
          nextLabel={isLastQuestion ? 'See Podium' : 'Next →'}
        />
      </div>
    );
  }

  // ── Question ──────────────────────────────────────────────────────────────────

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/60 text-sm font-semibold uppercase tracking-widest">
            Question {currentQuestion.index + 1} of {currentQuestion.totalQuestions}
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            {currentQuestion.points} pts · {currentQuestion.timeLimit}s
          </p>
        </div>

        <CountdownTimer
          key={currentQuestion.index}
          timeLimit={currentQuestion.timeLimit}
          onExpire={endQuestion}
        />

        <div className="text-right">
          <p className="text-white font-black text-3xl tabular-nums">
            {answeredCount}/{players.length}
          </p>
          <p className="text-white/60 text-sm">answered</p>
        </div>
      </div>

      {/* Question text */}
      <motion.div
        key={currentQuestion.index}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-white font-black text-3xl md:text-4xl leading-tight">
          {currentQuestion.text}
        </h1>
      </motion.div>

      {/* Answer grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {currentQuestion.answers.map((answer, i) => (
          <motion.div
            key={answer.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-5 flex items-center gap-3"
            style={{ backgroundColor: ANSWER_COLORS[i % ANSWER_COLORS.length] }}
          >
            <span className="text-white/80 text-2xl">{ANSWER_SHAPES[i % ANSWER_SHAPES.length]}</span>
            <span className="text-white font-black text-lg leading-snug">{answer.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Manual end */}
      <div className="text-center">
        <button
          onClick={endQuestion}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-sm transition-colors"
        >
          End Question Early
        </button>
      </div>
    </div>
  );
}
