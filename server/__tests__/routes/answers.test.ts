import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { createDatabase, initializeSchema } from '../../src/db/index.js';
import { createApp } from '../../src/app.js';
import type { ApiResponse, Quiz, Question, Answer } from '@braingames/shared';

describe('Answer routes', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>['app'];
  let questionId: string;

  beforeEach(async () => {
    db = createDatabase(':memory:');
    initializeSchema(db);
    ({ app } = createApp(db));

    const quizRes = await request(app).post('/api/quizzes').send({ title: 'Test Quiz' });
    const quizId = (quizRes.body as ApiResponse<Quiz>).data!.id;

    const qRes = await request(app).post(`/api/quizzes/${quizId}/questions`).send({
      type: 'multiple_choice',
      text: 'Which is correct?',
      timeLimit: 20,
      points: 1000,
      order: 0,
    });
    questionId = (qRes.body as ApiResponse<Question>).data!.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('PUT /api/questions/:questionId/answers', () => {
    it('replaces all answers and returns them', async () => {
      const res = await request(app)
        .put(`/api/questions/${questionId}/answers`)
        .send({
          answers: [
            { text: 'Option A', isCorrect: true, order: 0 },
            { text: 'Option B', isCorrect: false, order: 1 },
          ],
        });
      expect(res.status).toBe(200);
      const body = res.body as ApiResponse<Answer[]>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data?.find((a) => a.text === 'Option A')?.isCorrect).toBe(true);
    });

    it('returns 400 for invalid answers array', async () => {
      const res = await request(app)
        .put(`/api/questions/${questionId}/answers`)
        .send({ answers: 'not-an-array' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for too few answers', async () => {
      const res = await request(app)
        .put(`/api/questions/${questionId}/answers`)
        .send({ answers: [{ text: 'Only one', isCorrect: true, order: 0 }] });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent question', async () => {
      const res = await request(app)
        .put('/api/questions/nonexistent/answers')
        .send({
          answers: [
            { text: 'A', isCorrect: true, order: 0 },
            { text: 'B', isCorrect: false, order: 1 },
          ],
        });
      expect(res.status).toBe(404);
    });
  });
});
