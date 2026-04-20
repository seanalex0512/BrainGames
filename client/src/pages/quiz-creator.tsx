import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEditorStore } from '../stores/editor-store';
import { QuestionEditor } from '../components/quiz/question-editor';
import { Button } from '../components/ui/button';
import { apiGet, apiPost, apiPut } from '../utils/api-client';
import type { QuizWithQuestions, Quiz } from '@braingames/shared';
import type { EditorQuestion } from '../stores/editor-store';

export function QuizCreator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useEditorStore();
  const initCreate = useEditorStore((s) => s.initCreate);
  const initEdit = useEditorStore((s) => s.initEdit);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (!id) {
      initCreate();
      return;
    }
    void apiGet<QuizWithQuestions>(`/api/quizzes/${id}`).then((res) => {
      if (!res.success || !res.data) return;
      const { quiz, questions } = res.data;
      const editorQuestions: EditorQuestion[] = questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        imageUrl: q.imageUrl,
        timeLimit: q.timeLimit,
        points: q.points,
        order: q.order,
        answers: q.answers.map((a) => ({
          id: a.id,
          questionId: a.questionId,
          text: a.text,
          isCorrect: a.isCorrect,
          order: a.order,
        })),
      }));
      initEdit(quiz.id, quiz.title, quiz.description ?? '', editorQuestions);
    });
  }, [id, initCreate, initEdit]);

  async function handleSave() {
    if (!store.title.trim()) return;

    let quizId = store.quizId;

    if (store.mode === 'create') {
      const res = await apiPost<Quiz>('/api/quizzes', {
        title: store.title,
        description: store.description || undefined,
      });
      if (!res.success || !res.data) return;
      quizId = res.data.id;
    } else if (quizId) {
      await apiPut(`/api/quizzes/${quizId}`, {
        title: store.title,
        description: store.description || undefined,
      });
    }

    if (!quizId) return;

    for (const [i, q] of store.questions.entries()) {
      const questionInput = {
        type: q.type,
        text: q.text,
        timeLimit: q.timeLimit,
        points: q.points,
        order: i,
        ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
      };

      let questionId = q.id;
      if (store.mode === 'create' || !q.id.includes('-')) {
        const qRes = await apiPost<{ id: string }>(`/api/quizzes/${quizId}/questions`, questionInput);
        if (!qRes.success || !qRes.data) continue;
        questionId = qRes.data.id;
      } else {
        await apiPut(`/api/questions/${q.id}`, questionInput);
      }

      if (q.answers.length >= 2) {
        await apiPut(`/api/questions/${questionId}/answers`, {
          answers: q.answers.map((a, ai) => ({ text: a.text, isCorrect: a.isCorrect, order: ai })),
        });
      }
    }

    navigate('/');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {isEdit ? 'Edit Quiz' : 'New Quiz'}
        </motion.h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!store.title.trim()}
            loading={store.saving}
          >
            {isEdit ? 'Save Changes' : 'Create Quiz'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white/5 border border-white/20 rounded-2xl p-5 flex flex-col gap-4">
          <input
            type="text"
            value={store.title}
            onChange={(e) => store.setTitle(e.target.value)}
            placeholder="Quiz title"
            aria-label="Quiz title"
            className="w-full bg-transparent text-white text-2xl font-bold placeholder-white/30 outline-none border-b border-white/20 pb-2 focus:border-white/50 transition-colors"
          />
          <textarea
            value={store.description}
            onChange={(e) => store.setDescription(e.target.value)}
            placeholder="Description (optional)"
            aria-label="Quiz description"
            rows={2}
            className="w-full bg-transparent text-white/80 placeholder-white/30 outline-none resize-none"
          />
        </div>

        {store.questions.map((question, i) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={i}
            onUpdate={(patch) => store.updateQuestion(question.id, patch)}
            onSetAnswers={(answers) => store.setAnswers(question.id, answers)}
            onDelete={() => store.removeQuestion(question.id)}
          />
        ))}

        <Button variant="secondary" onClick={store.addQuestion} size="lg">
          + Add Question
        </Button>
      </div>
    </div>
  );
}
