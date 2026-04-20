import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { createDatabase, initializeSchema } from '../../src/db/index.js';
import { createApp } from '../../src/app.js';
import type { ApiResponse, Quiz, QuizWithQuestions } from '@braingames/shared';

describe('Quiz routes', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>['app'];

  beforeEach(() => {
    db = createDatabase(':memory:');
    initializeSchema(db);
    ({ app } = createApp(db));
  });

  afterEach(() => {
    db.close();
  });

  describe('GET /api/quizzes', () => {
    it('returns empty array initially', async () => {
      const res = await request(app).get('/api/quizzes');
      expect(res.status).toBe(200);
      const body = res.body as ApiResponse<Quiz[]>;
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns all quizzes', async () => {
      await request(app).post('/api/quizzes').send({ title: 'Quiz 1' });
      await request(app).post('/api/quizzes').send({ title: 'Quiz 2' });
      const res = await request(app).get('/api/quizzes');
      const body = res.body as ApiResponse<Quiz[]>;
      expect(body.data).toHaveLength(2);
    });
  });

  describe('POST /api/quizzes', () => {
    it('creates a quiz and returns 201', async () => {
      const res = await request(app).post('/api/quizzes').send({ title: 'My Quiz', description: 'Desc' });
      expect(res.status).toBe(201);
      const body = res.body as ApiResponse<Quiz>;
      expect(body.success).toBe(true);
      expect(body.data?.title).toBe('My Quiz');
      expect(body.data?.id).toBeTruthy();
    });

    it('returns 400 for missing title', async () => {
      const res = await request(app).post('/api/quizzes').send({});
      expect(res.status).toBe(400);
      expect((res.body as ApiResponse<null>).success).toBe(false);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    it('returns quiz with questions', async () => {
      const createRes = await request(app).post('/api/quizzes').send({ title: 'My Quiz' });
      const quiz = (createRes.body as ApiResponse<Quiz>).data!;

      const res = await request(app).get(`/api/quizzes/${quiz.id}`);
      expect(res.status).toBe(200);
      const body = res.body as ApiResponse<QuizWithQuestions>;
      expect(body.data?.quiz.id).toBe(quiz.id);
      expect(body.data?.questions).toEqual([]);
    });

    it('returns 404 for nonexistent quiz', async () => {
      const res = await request(app).get('/api/quizzes/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/quizzes/:id', () => {
    it('updates quiz title', async () => {
      const createRes = await request(app).post('/api/quizzes').send({ title: 'Original' });
      const quiz = (createRes.body as ApiResponse<Quiz>).data!;

      const res = await request(app).put(`/api/quizzes/${quiz.id}`).send({ title: 'Updated' });
      expect(res.status).toBe(200);
      const body = res.body as ApiResponse<Quiz>;
      expect(body.data?.title).toBe('Updated');
    });

    it('returns 404 for nonexistent quiz', async () => {
      const res = await request(app).put('/api/quizzes/nonexistent').send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/quizzes/:id', () => {
    it('deletes quiz and returns 204', async () => {
      const createRes = await request(app).post('/api/quizzes').send({ title: 'To Delete' });
      const quiz = (createRes.body as ApiResponse<Quiz>).data!;

      const res = await request(app).delete(`/api/quizzes/${quiz.id}`);
      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/api/quizzes/${quiz.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for nonexistent quiz', async () => {
      const res = await request(app).delete('/api/quizzes/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/quizzes/:id/duplicate', () => {
    it('creates a copy with new id', async () => {
      const createRes = await request(app).post('/api/quizzes').send({ title: 'Original' });
      const quiz = (createRes.body as ApiResponse<Quiz>).data!;

      const res = await request(app).post(`/api/quizzes/${quiz.id}/duplicate`);
      expect(res.status).toBe(201);
      const body = res.body as ApiResponse<Quiz>;
      expect(body.data?.id).not.toBe(quiz.id);
      expect(body.data?.title).toContain('Copy');
    });

    it('returns 404 for nonexistent quiz', async () => {
      const res = await request(app).post('/api/quizzes/nonexistent/duplicate');
      expect(res.status).toBe(404);
    });
  });
});
