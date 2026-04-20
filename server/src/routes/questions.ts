import { Router } from 'express';
import type { ApiResponse, Question } from '@braingames/shared';
import type { QuizRepository } from '../repositories/quiz-repository.js';
import type { QuestionRepository } from '../repositories/question-repository.js';
import { validate } from '../middleware/validate.js';
import { createQuestionSchema, updateQuestionSchema, reorderSchema } from '../middleware/schemas.js';

interface Repos {
  quiz: QuizRepository;
  question: QuestionRepository;
}

export function createQuestionRouter(repos: Repos): Router {
  const router = Router({ mergeParams: true });

  // GET /api/quizzes/:quizId/questions
  router.get('/', (req, res) => {
    const { quizId } = req.params as { quizId: string };
    const quiz = repos.quiz.findById(quizId);
    if (!quiz) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Quiz not found' };
      res.status(404).json(response);
      return;
    }
    const questions = repos.question.findByQuizId(quizId);
    const response: ApiResponse<Question[]> = { success: true, data: questions, error: null };
    res.json(response);
  });

  // POST /api/quizzes/:quizId/questions
  router.post('/', validate(createQuestionSchema), (req, res) => {
    const { quizId } = req.params as { quizId: string };
    const quiz = repos.quiz.findById(quizId);
    if (!quiz) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Quiz not found' };
      res.status(404).json(response);
      return;
    }
    const body = req.body as { type: 'multiple_choice' | 'true_false'; text: string; imageUrl?: string; timeLimit: 5 | 10 | 20 | 30 | 60; points: number; order: number };
    const question = repos.question.create(quizId, body);
    const response: ApiResponse<Question> = { success: true, data: question, error: null };
    res.status(201).json(response);
  });

  // PUT /api/quizzes/:quizId/questions/reorder
  router.put('/reorder', validate(reorderSchema), (req, res) => {
    const { quizId } = req.params as { quizId: string };
    const { ids } = req.body as { ids: string[] };
    repos.question.reorder(quizId, ids);
    const response: ApiResponse<null> = { success: true, data: null, error: null };
    res.json(response);
  });

  return router;
}

export function createDirectQuestionRouter(repos: { question: QuestionRepository }): Router {
  const router = Router();

  // PUT /api/questions/:id
  router.put('/:id', validate(updateQuestionSchema), (req, res) => {
    const question = repos.question.update(req.params['id']!, req.body as Record<string, unknown>);
    if (!question) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Question not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<Question> = { success: true, data: question, error: null };
    res.json(response);
  });

  // DELETE /api/questions/:id
  router.delete('/:id', (req, res) => {
    const deleted = repos.question.delete(req.params['id']!);
    if (!deleted) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Question not found' };
      res.status(404).json(response);
      return;
    }
    res.status(204).send();
  });

  return router;
}
