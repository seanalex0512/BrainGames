import { Router } from 'express';
import type { ApiResponse, Answer } from '@braingames/shared';
import type { QuestionRepository } from '../repositories/question-repository.js';
import type { AnswerRepository } from '../repositories/answer-repository.js';
import { validate } from '../middleware/validate.js';
import { replaceAnswersSchema } from '../middleware/schemas.js';

interface Repos {
  question: QuestionRepository;
  answer: AnswerRepository;
}

export function createAnswerRouter(repos: Repos): Router {
  const router = Router({ mergeParams: true });

  // PUT /api/questions/:questionId/answers
  router.put('/', validate(replaceAnswersSchema), (req, res) => {
    const { questionId } = req.params as { questionId: string };
    const question = repos.question.findById(questionId);
    if (!question) {
      const response: ApiResponse<null> = { success: false, data: null, error: 'Question not found' };
      res.status(404).json(response);
      return;
    }
    const { answers } = req.body as { answers: Array<{ text: string; isCorrect: boolean; order: number }> };
    const result = repos.answer.replaceAll(questionId, answers);
    const response: ApiResponse<Answer[]> = { success: true, data: result, error: null };
    res.json(response);
  });

  return router;
}
