import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuizStore } from '../stores/quiz-store';
import { QuizCard } from '../components/quiz/quiz-card';
import { EmptyState } from '../components/ui/empty-state';
import { Modal } from '../components/ui/modal';
import { Button } from '../components/ui/button';
import { FileUpIcon, BookOpenIcon } from '../components/ui/icons';

export function QuizLibrary() {
  const navigate = useNavigate();
  const { quizzes, loading, error, fetchQuizzes, deleteQuiz, duplicateQuiz } = useQuizStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchQuizzes();
  }, [fetchQuizzes]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteQuiz(deleteTarget);
    setDeleteTarget(null);
  }

  async function handleDuplicate(id: string) {
    await duplicateQuiz(id);
  }

  async function handlePdfImport(file: File) {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const form = new FormData();
      form.append('pdf', file);
      const res = await fetch('/api/quizzes/import-pdf', { method: 'POST', body: form });
      const data = await res.json() as { success: boolean; data: { id: string } | null; error: string | null };
      if (!data.success || !data.data) {
        setPdfError(data.error ?? 'Import failed');
      } else {
        navigate(`/quiz/${data.data.id}/edit`);
      }
    } catch {
      setPdfError('Upload failed — please try again');
    } finally {
      setPdfLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handlePdfImport(file);
    e.target.value = '';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <motion.h1
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          My Quizzes
        </motion.h1>

        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileChange}
          />

          <Button
            variant="secondary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            loading={pdfLoading}
            disabled={pdfLoading}
          >
            <FileUpIcon size={16} />
            Import PDF
          </Button>

          <Button onClick={() => navigate('/quiz/new')} size="md">
            + Create Quiz
          </Button>
        </div>
      </div>

      {/* PDF error banner */}
      {pdfError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brain-red/20 border border-brain-red/40 rounded-xl p-4 mb-6 text-white flex items-center justify-between gap-4"
        >
          <span className="text-sm">{pdfError}</span>
          <button
            onClick={() => setPdfError(null)}
            className="text-white/60 hover:text-white text-xs shrink-0"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {error && (
        <div className="bg-brain-red/20 border border-brain-red/40 rounded-xl p-4 mb-6 text-white">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <span className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && quizzes.length === 0 && (
        <EmptyState
          title="No quizzes yet"
          description="Create your first quiz or import one from a PDF."
          ctaLabel="Create your first quiz"
          onCta={() => navigate('/quiz/new')}
          icon={<BookOpenIcon size={56} className="text-white/30" />}
        />
      )}

      {!loading && quizzes.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <QuizCard
                quiz={quiz}
                questionCount={0}
                onHostLive={() => navigate(`/quiz/${quiz.id}/host`)}
                onPlay={() => navigate(`/quiz/${quiz.id}/play`)}
                onEdit={() => navigate(`/quiz/${quiz.id}/edit`)}
                onDuplicate={() => void handleDuplicate(quiz.id)}
                onDelete={() => setDeleteTarget(quiz.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete quiz?"
        confirmLabel="Delete"
        variant="danger"
      >
        This will permanently delete the quiz and all its questions. This cannot be undone.
      </Modal>
    </div>
  );
}
