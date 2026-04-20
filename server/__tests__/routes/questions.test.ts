import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { createDatabase, initializeSchema } from '../../src/db/index.js';
import { createApp } from '../../src/app.js';
import type { ApiResponse, Quiz, Question } from '@braingames/shared';

describe('Question routes', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>['app'];
  let quizId: string;

  beforeEach(async () => {
    db = createDatabase(':memory:');
    initializeSchema(db);
    ({ app } = createApp(db));

    const res = await request(app).post('/api/quizzes').send({ title: 'Test Quiz' });
    quizId = (res.body as ApiResponse<Quiz>).data!.id;
  });

  afterEach(() => {
    db.close();
  });

  const questionInput = {
    type: 'multiple_choice',
    text: 'What is 2+2?',
    timeLimit: 20,
    points: 1000,
    order: 0,
  };

  describe('POST /api/quizzes/:quizId/questions', () => {
    it('creates a question and returns 201', async () => {
      const res = await request(app).post(`/api/quizzes/${quizId}/questions`).send(questionInput);
      expect(res.status).toBe(201);
      const body = res.body as ApiResponse<Question>;
      expect(body.data?.text).toBe('What is 2+2?');
      expect(body.data?.quizId).toBe(quizId);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app).post(`/api/quizzes/${quizId}/questions`).send({ text: 'Only text' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent quiz', async () => {
      const res = await request(app).post('/api/quizzes/nonexistent/questions').send(questionInput);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/quizzes/:quizId/questions', () => {
    it('returns empty array when no questions', async () => {
      const res = await request(app).get(`/api/quizzes/${quizId}/questions`);
      expect(res.status).toBe(200);
      expect((res.body as ApiResponse<Question[]>).data).toEqual([]);
    });

    it('returns questions for quiz', async () => {
      await request(app).post(`/api/quizzes/${quizId}/questions`).send(questionInput);
      const res = await request(app).get(`/api/quizzes/${quizId}/questions`);
      expect((res.body as ApiResponse<Question[]>).data).toHaveLength(1);
    });
  });

  describe('PUT /api/questions/:id', () => {
    it('updates a question', async () => {
      const createRes = await request(app).post(`/api/quizzes/${quizId}/questions`).send(questionInput);
      const question = (createRes.body as ApiResponse<Question>).data!;

      const res = await request(app).put(`/api/questions/${question.id}`).send({ text: 'Updated text' });
      expect(res.status).toBe(200);
      expect((res.body as ApiResponse<Question>).data?.text).toBe('Updated text');
    });

    it('returns 404 for nonexistent question', async () => {
      const res = await request(app).put('/api/questions/nonexistent').send({ text: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('deletes a question and returns 204', async () => {
      const createRes = await request(app).post(`/api/quizzes/${quizId}/questions`).send(questionInput);
      const question = (createRes.body as ApiResponse<Question>).data!;

      const res = await request(app).delete(`/api/questions/${question.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for nonexistent question', async () => {
      const res = await request(app).delete('/api/questions/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/quizzes/:quizId/questions/reorder', () => {
    it('reorders questions', async () => {
      const q1Res = await request(app).post(`/api/quizzes/${quizId}/questions`).send({ ...questionInput, text: 'Q1', order: 0 });
      const q2Res = await request(app).post(`/api/quizzes/${quizId}/questions`).send({ ...questionInput, text: 'Q2', order: 1 });
      const q1Id = (q1Res.body as ApiResponse<Question>).data!.id;
      const q2Id = (q2Res.body as ApiResponse<Question>).data!.id;

      const res = await request(app)
        .put(`/api/quizzes/${quizId}/questions/reorder`)
        .send({ ids: [q2Id, q1Id] });
      expect(res.status).toBe(200);

      const questionsRes = await request(app).get(`/api/quizzes/${quizId}/questions`);
      const questions = (questionsRes.body as ApiResponse<Question[]>).data!;
      expect(questions[0]?.id).toBe(q2Id);
      expect(questions[1]?.id).toBe(q1Id);
    });
  });
});
