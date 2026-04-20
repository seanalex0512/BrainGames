import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase, initializeSchema } from '../../src/db/index.js';
import { SqliteQuizRepository } from '../../src/repositories/quiz-repository.js';
import { SqliteQuestionRepository } from '../../src/repositories/question-repository.js';
import type { Quiz } from '@braingames/shared';

describe('SqliteQuestionRepository', () => {
  let db: Database.Database;
  let quizRepo: SqliteQuizRepository;
  let repo: SqliteQuestionRepository;
  let quiz: Quiz;

  beforeEach(() => {
    db = createDatabase(':memory:');
    initializeSchema(db);
    quizRepo = new SqliteQuizRepository(db);
    repo = new SqliteQuestionRepository(db);
    quiz = quizRepo.create({ title: 'Test Quiz' });
  });

  afterEach(() => {
    db.close();
  });

  describe('findByQuizId', () => {
    it('returns empty array when no questions', () => {
      expect(repo.findByQuizId(quiz.id)).toEqual([]);
    });

    it('returns questions ordered by order field', () => {
      repo.create(quiz.id, { type: 'multiple_choice', text: 'Q2', timeLimit: 20, points: 1000, order: 1 });
      repo.create(quiz.id, { type: 'multiple_choice', text: 'Q1', timeLimit: 20, points: 1000, order: 0 });
      const questions = repo.findByQuizId(quiz.id);
      expect(questions[0]?.text).toBe('Q1');
      expect(questions[1]?.text).toBe('Q2');
    });
  });

  describe('findById', () => {
    it('returns question when found', () => {
      const q = repo.create(quiz.id, { type: 'true_false', text: 'Is this true?', timeLimit: 10, points: 500, order: 0 });
      const found = repo.findById(q.id);
      expect(found?.id).toBe(q.id);
      expect(found?.text).toBe('Is this true?');
    });

    it('returns null when not found', () => {
      expect(repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a question with a generated id', () => {
      const q = repo.create(quiz.id, { type: 'multiple_choice', text: 'Which?', timeLimit: 30, points: 1000, order: 0 });
      expect(q.id).toBeTruthy();
      expect(q.quizId).toBe(quiz.id);
      expect(q.type).toBe('multiple_choice');
    });
  });

  describe('update', () => {
    it('returns updated question', () => {
      const q = repo.create(quiz.id, { type: 'multiple_choice', text: 'Original', timeLimit: 20, points: 1000, order: 0 });
      const updated = repo.update(q.id, { text: 'Updated' });
      expect(updated?.text).toBe('Updated');
      expect(updated?.id).toBe(q.id);
    });

    it('returns null when question not found', () => {
      expect(repo.update('nonexistent', { text: 'X' })).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the question', () => {
      const q = repo.create(quiz.id, { type: 'multiple_choice', text: 'To Delete', timeLimit: 20, points: 1000, order: 0 });
      expect(repo.delete(q.id)).toBe(true);
      expect(repo.findById(q.id)).toBeNull();
    });

    it('returns false when question not found', () => {
      expect(repo.delete('nonexistent')).toBe(false);
    });
  });

  describe('reorder', () => {
    it('updates order of questions by ID array', () => {
      const q0 = repo.create(quiz.id, { type: 'multiple_choice', text: 'A', timeLimit: 20, points: 1000, order: 0 });
      const q1 = repo.create(quiz.id, { type: 'multiple_choice', text: 'B', timeLimit: 20, points: 1000, order: 1 });
      const q2 = repo.create(quiz.id, { type: 'multiple_choice', text: 'C', timeLimit: 20, points: 1000, order: 2 });

      repo.reorder(quiz.id, [q2.id, q0.id, q1.id]);

      const questions = repo.findByQuizId(quiz.id);
      expect(questions[0]?.id).toBe(q2.id);
      expect(questions[1]?.id).toBe(q0.id);
      expect(questions[2]?.id).toBe(q1.id);
    });
  });
});
