import type Database from 'better-sqlite3';
import type { Question, CreateQuestionInput, UpdateQuestionInput, QuestionType, TimeLimit } from '@braingames/shared';

interface QuestionRow {
  id: string;
  quiz_id: string;
  type: string;
  text: string;
  image_url: string | null;
  time_limit: number;
  points: number;
  order: number;
}

function toModel(row: QuestionRow): Question {
  return Object.freeze({
    id: row.id,
    quizId: row.quiz_id,
    type: row.type as QuestionType,
    text: row.text,
    ...(row.image_url != null ? { imageUrl: row.image_url } : {}),
    timeLimit: row.time_limit as TimeLimit,
    points: row.points,
    order: row.order,
  });
}

export interface QuestionRepository {
  findByQuizId(quizId: string): Question[];
  findById(id: string): Question | null;
  create(quizId: string, input: CreateQuestionInput): Question;
  update(id: string, input: UpdateQuestionInput): Question | null;
  delete(id: string): boolean;
  reorder(quizId: string, ids: string[]): void;
}

export class SqliteQuestionRepository implements QuestionRepository {
  constructor(private readonly db: Database.Database) {}

  findByQuizId(quizId: string): Question[] {
    const rows = this.db
      .prepare(`SELECT * FROM questions WHERE quiz_id = ? ORDER BY "order"`)
      .all(quizId) as QuestionRow[];
    return rows.map(toModel);
  }

  findById(id: string): Question | null {
    const row = this.db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as QuestionRow | undefined;
    return row ? toModel(row) : null;
  }

  create(quizId: string, input: CreateQuestionInput): Question {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO questions (id, quiz_id, type, text, image_url, time_limit, points, "order")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, quizId, input.type, input.text, input.imageUrl ?? null, input.timeLimit, input.points, input.order);
    return toModel({
      id,
      quiz_id: quizId,
      type: input.type,
      text: input.text,
      image_url: input.imageUrl ?? null,
      time_limit: input.timeLimit,
      points: input.points,
      order: input.order,
    });
  }

  update(id: string, input: UpdateQuestionInput): Question | null {
    const existing = this.db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as QuestionRow | undefined;
    if (!existing) return null;

    const updated: QuestionRow = {
      ...existing,
      type: input.type ?? existing.type,
      text: input.text ?? existing.text,
      image_url: input.imageUrl !== undefined ? (input.imageUrl ?? null) : existing.image_url,
      time_limit: input.timeLimit ?? existing.time_limit,
      points: input.points ?? existing.points,
      order: input.order ?? existing.order,
    };

    this.db
      .prepare(
        `UPDATE questions SET type = ?, text = ?, image_url = ?, time_limit = ?, points = ?, "order" = ? WHERE id = ?`
      )
      .run(updated.type, updated.text, updated.image_url, updated.time_limit, updated.points, updated.order, id);

    return toModel(updated);
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    return result.changes > 0;
  }

  reorder(quizId: string, ids: string[]): void {
    const reorderTx = this.db.transaction((orderedIds: string[]) => {
      const stmt = this.db.prepare(`UPDATE questions SET "order" = ? WHERE id = ? AND quiz_id = ?`);
      orderedIds.forEach((id, index) => {
        stmt.run(index, id, quizId);
      });
    });
    reorderTx(ids);
  }
}
