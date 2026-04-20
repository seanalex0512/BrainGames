import type Database from 'better-sqlite3';
import type { Quiz, CreateQuizInput, UpdateQuizInput } from '@braingames/shared';

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function toModel(row: QuizRow): Quiz {
  return Object.freeze({
    id: row.id,
    title: row.title,
    ...(row.description != null ? { description: row.description } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export interface QuizRepository {
  findAll(): Quiz[];
  findById(id: string): Quiz | null;
  create(input: CreateQuizInput): Quiz;
  update(id: string, input: UpdateQuizInput): Quiz | null;
  delete(id: string): boolean;
  duplicate(id: string): Quiz | null;
}

export class SqliteQuizRepository implements QuizRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Quiz[] {
    const rows = this.db
      .prepare('SELECT * FROM quizzes ORDER BY created_at DESC')
      .all() as QuizRow[];
    return rows.map(toModel);
  }

  findById(id: string): Quiz | null {
    const row = this.db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as QuizRow | undefined;
    return row ? toModel(row) : null;
  }

  create(input: CreateQuizInput): Quiz {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO quizzes (id, title, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, input.title, input.description ?? null, now, now);
    return toModel({ id, title: input.title, description: input.description ?? null, created_at: now, updated_at: now });
  }

  update(id: string, input: UpdateQuizInput): Quiz | null {
    const existing = this.db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as QuizRow | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const title = input.title ?? existing.title;
    const description = input.description !== undefined ? input.description : existing.description;

    this.db
      .prepare(`UPDATE quizzes SET title = ?, description = ?, updated_at = ? WHERE id = ?`)
      .run(title, description, now, id);

    return toModel({ ...existing, title, description, updated_at: now });
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
    return result.changes > 0;
  }

  duplicate(sourceId: string): Quiz | null {
    const source = this.db.prepare('SELECT * FROM quizzes WHERE id = ?').get(sourceId) as QuizRow | undefined;
    if (!source) return null;

    const newQuizId = crypto.randomUUID();
    const now = new Date().toISOString();

    const duplicateQuiz = this.db.transaction(() => {
      this.db
        .prepare(`INSERT INTO quizzes (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
        .run(newQuizId, `${source.title} (Copy)`, source.description, now, now);

      const questions = this.db
        .prepare(`SELECT * FROM questions WHERE quiz_id = ? ORDER BY "order"`)
        .all(sourceId) as Array<{ id: string; quiz_id: string; type: string; text: string; image_url: string | null; time_limit: number; points: number; order: number }>;

      for (const q of questions) {
        const newQId = crypto.randomUUID();
        this.db
          .prepare(
            `INSERT INTO questions (id, quiz_id, type, text, image_url, time_limit, points, "order")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(newQId, newQuizId, q.type, q.text, q.image_url, q.time_limit, q.points, q.order);

        const answers = this.db
          .prepare(`SELECT * FROM answers WHERE question_id = ? ORDER BY "order"`)
          .all(q.id) as Array<{ id: string; question_id: string; text: string; is_correct: number; order: number }>;

        for (const a of answers) {
          this.db
            .prepare(`INSERT INTO answers (id, question_id, text, is_correct, "order") VALUES (?, ?, ?, ?, ?)`)
            .run(crypto.randomUUID(), newQId, a.text, a.is_correct, a.order);
        }
      }
    });

    duplicateQuiz();
    return toModel({ id: newQuizId, title: `${source.title} (Copy)`, description: source.description, created_at: now, updated_at: now });
  }
}
