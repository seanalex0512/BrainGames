import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase, initializeSchema } from '../../src/db/index.js';
import { SqliteQuizRepository } from '../../src/repositories/quiz-repository.js';

describe('SqliteQuizRepository', () => {
  let db: Database.Database;
  let repo: SqliteQuizRepository;

  beforeEach(() => {
    db = createDatabase(':memory:');
    initializeSchema(db);
    repo = new SqliteQuizRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('findAll', () => {
    it('returns empty array when no quizzes', () => {
      expect(repo.findAll()).toEqual([]);
    });

    it('returns all quizzes ordered by created_at desc', () => {
      repo.create({ title: 'First' });
      repo.create({ title: 'Second' });
      const quizzes = repo.findAll();
      expect(quizzes).toHaveLength(2);
      expect(quizzes.map((q) => q.title)).toContain('First');
      expect(quizzes.map((q) => q.title)).toContain('Second');
    });
  });

  describe('findById', () => {
    it('returns quiz when found', () => {
      const created = repo.create({ title: 'My Quiz' });
      const found = repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('My Quiz');
    });

    it('returns null when not found', () => {
      expect(repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('create', () => {
    it('returns a quiz with a generated id', () => {
      const quiz = repo.create({ title: 'Test Quiz' });
      expect(quiz.id).toBeTruthy();
      expect(quiz.title).toBe('Test Quiz');
      expect(quiz.description).toBeUndefined();
      expect(quiz.createdAt).toBeTruthy();
      expect(quiz.updatedAt).toBeTruthy();
    });

    it('stores description when provided', () => {
      const quiz = repo.create({ title: 'Test', description: 'A description' });
      expect(quiz.description).toBe('A description');
    });

    it('generates unique IDs for each quiz', () => {
      const q1 = repo.create({ title: 'Q1' });
      const q2 = repo.create({ title: 'Q2' });
      expect(q1.id).not.toBe(q2.id);
    });
  });

  describe('update', () => {
    it('returns updated quiz with new title', () => {
      const created = repo.create({ title: 'Original' });
      const updated = repo.update(created.id, { title: 'Updated' });
      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated');
      expect(updated?.id).toBe(created.id);
    });

    it('does not mutate the original object', () => {
      const created = repo.create({ title: 'Original' });
      const originalTitle = created.title;
      repo.update(created.id, { title: 'Updated' });
      expect(created.title).toBe(originalTitle);
    });

    it('updates updatedAt timestamp', () => {
      const created = repo.create({ title: 'Original' });
      const updated = repo.update(created.id, { title: 'Updated' });
      expect(updated?.updatedAt).toBeTruthy();
    });

    it('returns null when quiz not found', () => {
      const result = repo.update('nonexistent', { title: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the quiz', () => {
      const quiz = repo.create({ title: 'To Delete' });
      repo.delete(quiz.id);
      expect(repo.findById(quiz.id)).toBeNull();
    });

    it('returns true when quiz existed', () => {
      const quiz = repo.create({ title: 'To Delete' });
      expect(repo.delete(quiz.id)).toBe(true);
    });

    it('returns false when quiz did not exist', () => {
      expect(repo.delete('nonexistent')).toBe(false);
    });
  });

  describe('duplicate', () => {
    it('creates a new quiz with a different id', () => {
      const original = repo.create({ title: 'Original' });
      const copy = repo.duplicate(original.id);
      expect(copy).not.toBeNull();
      expect(copy?.id).not.toBe(original.id);
      expect(copy?.title).toBe('Original (Copy)');
    });

    it('returns null when source quiz not found', () => {
      expect(repo.duplicate('nonexistent')).toBeNull();
    });
  });
});
