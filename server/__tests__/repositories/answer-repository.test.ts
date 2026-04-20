import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase, initializeSchema } from '../../src/db/index.js';
import { SqliteQuizRepository } from '../../src/repositories/quiz-repository.js';
import { SqliteQuestionRepository } from '../../src/repositories/question-repository.js';
import { SqliteAnswerRepository } from '../../src/repositories/answer-repository.js';
import type { Quiz, Question } from '@braingames/shared';

describe('SqliteAnswerRepository', () => {
  let db: Database.Database;
  let repo: SqliteAnswerRepository;
  let quiz: Quiz;
  let question: Question;

  beforeEach(() => {
    db = createDatabase(':memory:');
    initializeSchema(db);
    const quizRepo = new SqliteQuizRepository(db);
    const questionRepo = new SqliteQuestionRepository(db);
    repo = new SqliteAnswerRepository(db);

    quiz = quizRepo.create({ title: 'Test Quiz' });
    question = questionRepo.create(quiz.id, {
      type: 'multiple_choice',
      text: 'Which is correct?',
      timeLimit: 20,
      points: 1000,
      order: 0,
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('findByQuestionId', () => {
    it('returns empty array when no answers', () => {
      expect(repo.findByQuestionId(question.id)).toEqual([]);
    });

    it('returns answers ordered by order field', () => {
      repo.replaceAll(question.id, [
        { text: 'B', isCorrect: false, order: 1 },
        { text: 'A', isCorrect: true, order: 0 },
      ]);
      const answers = repo.findByQuestionId(question.id);
      expect(answers[0]?.text).toBe('A');
      expect(answers[1]?.text).toBe('B');
    });
  });

  describe('replaceAll', () => {
    it('inserts all answers and returns them', () => {
      const answers = repo.replaceAll(question.id, [
        { text: 'Option A', isCorrect: true, order: 0 },
        { text: 'Option B', isCorrect: false, order: 1 },
      ]);
      expect(answers).toHaveLength(2);
      expect(answers[0]?.text).toBe('Option A');
      expect(answers[0]?.isCorrect).toBe(true);
      expect(answers[1]?.text).toBe('Option B');
    });

    it('replaces existing answers', () => {
      repo.replaceAll(question.id, [
        { text: 'Old A', isCorrect: true, order: 0 },
        { text: 'Old B', isCorrect: false, order: 1 },
      ]);
      repo.replaceAll(question.id, [
        { text: 'New A', isCorrect: false, order: 0 },
        { text: 'New B', isCorrect: true, order: 1 },
        { text: 'New C', isCorrect: false, order: 2 },
      ]);
      const answers = repo.findByQuestionId(question.id);
      expect(answers).toHaveLength(3);
      expect(answers.map((a) => a.text)).toContain('New A');
    });

    it('generates unique IDs for each answer', () => {
      const answers = repo.replaceAll(question.id, [
        { text: 'A', isCorrect: true, order: 0 },
        { text: 'B', isCorrect: false, order: 1 },
      ]);
      expect(answers[0]?.id).not.toBe(answers[1]?.id);
    });

    it('maps isCorrect boolean correctly', () => {
      const answers = repo.replaceAll(question.id, [
        { text: 'Correct', isCorrect: true, order: 0 },
        { text: 'Wrong', isCorrect: false, order: 1 },
      ]);
      expect(answers.find((a) => a.text === 'Correct')?.isCorrect).toBe(true);
      expect(answers.find((a) => a.text === 'Wrong')?.isCorrect).toBe(false);
    });
  });
});
