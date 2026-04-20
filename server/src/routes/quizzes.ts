import { Router } from 'express';
import type { ApiResponse, Quiz, QuizWithQuestions } from '@braingames/shared';
import type { QuizRepository } from '../repositories/quiz-repository.js';
import type { QuestionRepository } from '../repositories/question-repository.js';
import type { AnswerRepository } from '../repositories/answer-repository.js';
import { validate } from '../middleware/validate.js';
import { createQuizSchema, updateQuizSchema } from '../middleware/schemas.js';

interface Repos {
  quiz: QuizRepository;
  question: QuestionRepository;
  answer: AnswerRepository;
}

export function createQuizRouter(repos: Repos): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const quizzes = repos.quiz.findAll();
    const response: ApiResponse<Quiz[]> = { success: true, data: quizzes, error: null };
    res.json(response);
  });

  router.get('/:id', (req, res) => {
    const quiz = repos.quiz.findById(req.params['id']!);
    if (!quiz) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Quiz not found' };
      res.status(404).json(response);
      return;
    }
    const questions = repos.question.findByQuizId(quiz.id);
    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: repos.answer.findByQuestionId(q.id),
    }));
    const response: ApiResponse<QuizWithQuestions> = {
      success: true,
      data: { quiz, questions: questionsWithAnswers },
      error: null,
    };
    res.json(response);
  });

  router.post('/', validate(createQuizSchema), (req, res) => {
    const body = req.body as { title: string; description?: string };
    const quiz = repos.quiz.create({ title: body.title, description: body.description });
    const response: ApiResponse<Quiz> = { success: true, data: quiz, error: null };
    res.status(201).json(response);
  });

  router.put('/:id', validate(updateQuizSchema), (req, res) => {
    const body = req.body as { title?: string; description?: string };
    const quiz = repos.quiz.update(req.params['id']!, body);
    if (!quiz) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Quiz not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<Quiz> = { success: true, data: quiz, error: null };
    res.json(response);
  });

  router.delete('/:id', (req, res) => {
    const deleted = repos.quiz.delete(req.params['id']!);
    if (!deleted) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Quiz not found' };
      res.status(404).json(response);
      return;
    }
    res.status(204).send();
  });

  router.post('/:id/duplicate', (req, res) => {
    const quiz = repos.quiz.duplicate(req.params['id']!);
    if (!quiz) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Quiz not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<Quiz> = { success: true, data: quiz, error: null };
    res.status(201).json(response);
  });

  return router;
}
