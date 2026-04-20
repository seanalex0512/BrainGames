import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../src/db/client.js';
import { initializeSchema } from '../../src/db/schema.js';

describe('initializeSchema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:');
    initializeSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates the quizzes table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='quizzes'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('quizzes');
  });

  it('creates the questions table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('questions');
  });

  it('creates the answers table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='answers'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('answers');
  });

  it('enforces foreign key constraint on questions.quiz_id', () => {
    expect(() => {
      db.prepare(
        `INSERT INTO questions (id, quiz_id, type, text, time_limit, points, "order")
         VALUES ('q1', 'nonexistent-quiz', 'multiple_choice', 'Test?', 20, 1000, 0)`
      ).run();
    }).toThrow();
  });

  it('enforces foreign key constraint on answers.question_id', () => {
    expect(() => {
      db.prepare(
        `INSERT INTO answers (id, question_id, text, is_correct, "order")
         VALUES ('a1', 'nonexistent-question', 'Answer', 0, 0)`
      ).run();
    }).toThrow();
  });

  it('cascades delete from quiz to questions and answers', () => {
    db.prepare(`INSERT INTO quizzes (id, title, created_at, updated_at) VALUES ('quiz1', 'Q', ?, ?)`).run(
      new Date().toISOString(),
      new Date().toISOString()
    );
    db.prepare(
      `INSERT INTO questions (id, quiz_id, type, text, time_limit, points, "order")
       VALUES ('q1', 'quiz1', 'multiple_choice', 'Test?', 20, 1000, 0)`
    ).run();
    db.prepare(
      `INSERT INTO answers (id, question_id, text, is_correct, "order")
       VALUES ('a1', 'q1', 'Answer', 0, 0)`
    ).run();

    db.prepare(`DELETE FROM quizzes WHERE id = 'quiz1'`).run();

    const q = db.prepare(`SELECT * FROM questions WHERE id = 'q1'`).get();
    const a = db.prepare(`SELECT * FROM answers WHERE id = 'a1'`).get();
    expect(q).toBeUndefined();
    expect(a).toBeUndefined();
  });

  it('is idempotent — running initializeSchema twice does not throw', () => {
    expect(() => initializeSchema(db)).not.toThrow();
  });
});
