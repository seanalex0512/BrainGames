import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quiz } from '@braingames/shared';
import { Button } from '../ui/button';
import { EllipsisIcon } from '../ui/icons';

interface QuizCardProps {
  readonly quiz: Quiz;
  readonly questionCount: number;
  readonly onHostLive: () => void;
  readonly onPlay: () => void;
  readonly onEdit: () => void;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Three-dot dropdown ────────────────────────────────────────────────────────

interface ActionMenuProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ActionMenu({ onEdit, onDuplicate, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  function handle(fn: () => void) {
    fn();
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <EllipsisIcon size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-20 min-w-[130px] rounded-xl overflow-hidden shadow-xl border border-white/10"
            style={{ background: 'rgba(30, 10, 60, 0.97)', backdropFilter: 'blur(8px)' }}
          >
            <button
              onClick={() => handle(onEdit)}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handle(onDuplicate)}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Duplicate
            </button>
            <div className="h-px bg-white/10 mx-2" />
            <button
              onClick={() => handle(onDelete)}
              className="w-full text-left px-4 py-2.5 text-sm text-brain-red hover:bg-brain-red/10 transition-colors"
            >
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function QuizCard({
  quiz, questionCount, onHostLive, onPlay, onEdit, onDuplicate, onDelete,
}: QuizCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col gap-4 h-full"
    >
      {/* Title + description */}
      <div className="flex-1 min-h-0">
        <h3 className="text-white font-bold text-lg leading-snug line-clamp-2">{quiz.title}</h3>
        {quiz.description && (
          <p className="text-white/55 text-sm mt-1 line-clamp-2">{quiz.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-white/45 text-xs font-medium">
        <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{formatDate(quiz.updatedAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onHostLive} className="flex-1">
          Host Live
        </Button>
        <Button variant="secondary" size="sm" onClick={onPlay}>
          Solo
        </Button>
        <ActionMenu onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>
    </motion.div>
  );
}
