import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { LeaderboardEntry } from '@braingames/shared';

const PODIUM_COLORS = [
  '#E21B3C', '#1368CE', '#D89E00', '#26890C',
  '#CC0066', '#FF7700', '#66BF39', '#FFFFFF',
];

function usePodiumConfetti() {
  useEffect(() => {
    const burst = () => {
      confetti({
        angle: 60, spread: 65, particleCount: 70,
        origin: { x: 0, y: 0.75 },
        colors: PODIUM_COLORS,
      });
      confetti({
        angle: 120, spread: 65, particleCount: 70,
        origin: { x: 1, y: 0.75 },
        colors: PODIUM_COLORS,
      });
    };
    burst();
    const id = setInterval(burst, 2200);
    return () => { clearInterval(id); confetti.reset(); };
  }, []);
}

// ── Podium pillar heights ─────────────────────────────────────────────────────

const PILLAR_HEIGHTS = { 1: 180, 2: 130, 3: 100 } as const;
const RANK_LABELS = { 1: '1st', 2: '2nd', 3: '3rd' } as const;
const RANK_COLORS = { 1: '#D89E00', 2: '#9CA3AF', 3: '#CD7C2F' } as const;

interface PillarProps {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  delay: number;
}

function PodiumPillar({ entry, rank, delay }: PillarProps) {
  const height = PILLAR_HEIGHTS[rank];
  const label = RANK_LABELS[rank];
  const labelColor = RANK_COLORS[rank];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar + name above pillar */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, type: 'spring', stiffness: 180, damping: 14 }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-sm font-black tracking-wide" style={{ color: labelColor }}>{label}</span>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-white/20"
          style={{ backgroundColor: entry.avatarColor }}
        >
          {entry.nickname[0]?.toUpperCase()}
        </div>
        <p className="text-white font-black text-sm text-center max-w-[80px] truncate">
          {entry.nickname}
        </p>
        <p className="text-white/70 font-semibold text-xs tabular-nums">
          {entry.score.toLocaleString()} pts
        </p>
      </motion.div>

      {/* Pillar bar */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height, opacity: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.7, ease: [0.34, 1.26, 0.64, 1] }}
        className="w-24 rounded-t-xl flex items-start justify-center pt-3 relative overflow-hidden"
        style={{ backgroundColor: entry.avatarColor }}
      >
        {/* Shine overlay */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ delay: delay + 0.8, duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
        <span className="text-white font-black text-2xl relative z-10">{rank}</span>
      </motion.div>
    </div>
  );
}

// ── Main Podium ───────────────────────────────────────────────────────────────

interface PodiumProps {
  leaderboard: ReadonlyArray<LeaderboardEntry>;
  onPlayAgain: () => void;
  onBack: () => void;
}

export function Podium({ leaderboard, onPlayAgain, onBack }: PodiumProps) {
  const [first, second, third] = leaderboard;
  usePodiumConfetti();

  return (
    <div className="relative max-w-lg mx-auto px-4 py-8 text-center">

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-10"
      >
        <h1 className="text-5xl font-black text-white mb-1">Game Over!</h1>
        <p className="text-white/60 text-lg">Final Results</p>
      </motion.div>

      {/* Podium — 2nd | 1st | 3rd */}
      <div className="flex items-end justify-center gap-3 mb-10">
        {second && <PodiumPillar entry={second} rank={2} delay={0.3} />}
        {first  && <PodiumPillar entry={first}  rank={1} delay={0.1} />}
        {third  && <PodiumPillar entry={third}  rank={3} delay={0.5} />}
      </div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col gap-3 items-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="px-8 py-3 bg-brain-correct hover:bg-brain-correct/90 text-white font-black rounded-xl text-xl transition-colors w-56"
        >
          Play Again →
        </motion.button>
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          Back to Library
        </button>
      </motion.div>
    </div>
  );
}
