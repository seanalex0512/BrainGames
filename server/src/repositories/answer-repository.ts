import type Database from 'better-sqlite3';
import type { Answer, CreateAnswerInput } from '@braingames/shared';

interface AnswerRow {
  id: string;
  question_id: string;
  text: string;
  is_correct: number;
  order: number;
}

function toModel(row: AnswerRow): Answer {
  return Object.freeze({
    id: row.id,
    questionId: row.question_id,
    text: row.text,
    isCorrect: row.is_correct === 1,
    order: row.order,
  });
}

export interface AnswerRepository {
  findByQuestionId(questionId: string): Answer[];
  replaceAll(questionId: string, inputs: CreateAnswerInput[]): Answer[];
}

export class SqliteAnswerRepository implements AnswerRepository {
  constructor(private readonly db: Database.Database) {}

  findByQuestionId(questionId: string): Answer[] {
    const rows = this.db
      .prepare(`SELECT * FROM answers WHERE question_id = ? ORDER BY "order"`)
      .all(questionId) as AnswerRow[];
    return rows.map(toModel);
  }

  replaceAll(questionId: string, inputs: CreateAnswerInput[]): Answer[] {
    const insertStmt = this.db.prepare(
      `INSERT INTO answers (id, question_id, text, is_correct, "order") VALUES (?, ?, ?, ?, ?)`
    );

    const replaceTx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM answers WHERE question_id = ?').run(questionId);
      const rows: AnswerRow[] = inputs.map((input) => ({
        id: crypto.randomUUID(),
        question_id: questionId,
        text: input.text,
        is_correct: input.isCorrect ? 1 : 0,
        order: input.order,
      }));
      for (const row of rows) {
        insertStmt.run(row.id, row.question_id, row.text, row.is_correct, row.order);
      }
      return rows;
    });

    const rows = replaceTx() as AnswerRow[];
    return rows.map(toModel);
  }
}
