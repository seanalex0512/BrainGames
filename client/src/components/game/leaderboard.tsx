import { motion, AnimatePresence } from 'framer-motion';
import type { LeaderboardEntry } from '@braingames/shared';

interface LeaderboardProps {
  leaderboard: ReadonlyArray<LeaderboardEntry>;
  previousLeaderboard: ReadonlyArray<LeaderboardEntry>;
  onNext: () => void;
  nextLabel?: string;
}

interface PositionDelta {
  delta: number; // positive = moved up, negative = moved down, 0 = same / new
  isNew: boolean;
}

function getPositionDelta(
  entry: LeaderboardEntry,
  previousLeaderboard: ReadonlyArray<LeaderboardEntry>,
  currentRank: number,
): PositionDelta {
  const prevIndex = previousLeaderboard.findIndex((p) => p.id === entry.id);
  if (prevIndex === -1) return { delta: 0, isNew: true };
  const prevRank = prevIndex + 1;
  return { delta: prevRank - currentRank, isNew: false };
}

function DeltaBadge({ delta, isNew }: PositionDelta) {
  if (isNew) {
    return (
      <span className="text-brain-yellow font-black text-xs px-1.5 py-0.5 rounded bg-brain-yellow/20">
        NEW
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-brain-correct font-black text-sm">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 1l4 8H1z" />
        </svg>
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="flex items-center gap-0.5 text-brain-red font-black text-sm">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 9L1 1h8z" />
        </svg>
        {Math.abs(delta)}
      </span>
    );
  }
  return <span className="text-white/30 font-black text-sm">—</span>;
}

const RANK_COLORS: Record<number, string> = {
  1: '#D89E00',
  2: '#9CA3AF',
  3: '#CD7C2F',
};

export function Leaderboard({ leaderboard, previousLeaderboard, onNext, nextLabel = 'Next →' }: LeaderboardProps) {
  const top5 = leaderboard.slice(0, 5);
  const maxScore = Math.max(...top5.map((e) => e.score), 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white/60 font-semibold uppercase tracking-widest text-sm text-center mb-6"
      >
        Leaderboard
      </motion.p>

      <div className="flex flex-col gap-3 mb-8">
        <AnimatePresence mode="popLayout">
          {top5.map((entry, i) => {
            const rank = i + 1;
            const { delta, isNew } = getPositionDelta(entry, previousLeaderboard, rank);
            const barPct = (entry.score / maxScore) * 100;
            const rankColor = RANK_COLORS[rank];

            return (
              <motion.div
                key={entry.id}
                layoutId={`lb-${entry.id}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3"
              >
                {/* Rank */}
                <span
                  className="font-black text-lg w-7 text-center shrink-0"
                  style={{ color: rankColor ?? 'rgba(255,255,255,0.5)' }}
                >
                  {rank}
                </span>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ backgroundColor: entry.avatarColor }}
                >
                  {entry.nickname[0]?.toUpperCase()}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate mb-1">{entry.nickname}</p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: entry.avatarColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ delay: i * 0.07 + 0.15, duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Score */}
                <span className="text-white font-black tabular-nums text-base shrink-0 w-16 text-right">
                  {entry.score.toLocaleString()}
                </span>

                {/* Delta */}
                <div className="w-8 flex justify-end shrink-0">
                  <DeltaBadge delta={delta} isNew={isNew} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="text-center">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: top5.length * 0.07 + 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="px-8 py-3 bg-brain-correct hover:bg-brain-correct/90 text-white font-black rounded-xl text-xl transition-colors"
        >
          {nextLabel}
        </motion.button>
      </div>
    </div>
  );
}
