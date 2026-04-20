import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './button';

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm?: () => void;
  readonly title: string;
  readonly children?: ReactNode;
  readonly confirmLabel?: string;
  readonly variant?: 'default' | 'danger';
}

export function Modal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  variant = 'default',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-label="Close modal"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-brain-purple border border-white/20 p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <h2 id="modal-title" className="text-xl font-bold text-white mb-3">
              {title}
            </h2>
            {children && <div className="text-white/70 mb-6">{children}</div>}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {onConfirm && (
                <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
