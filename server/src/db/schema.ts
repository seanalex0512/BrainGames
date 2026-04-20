import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id          TEXT PRIMARY KEY,
      quiz_id     TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false')),
      text        TEXT NOT NULL,
      image_url   TEXT,
      time_limit  INTEGER NOT NULL CHECK (time_limit IN (5, 10, 20, 30, 60)),
      points      INTEGER NOT NULL DEFAULT 1000,
      "order"     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS answers (
      id          TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      text        TEXT NOT NULL,
      is_correct  INTEGER NOT NULL DEFAULT 0,
      "order"     INTEGER NOT NULL
    );
  `);
}
