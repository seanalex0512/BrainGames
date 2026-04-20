import { createRequire } from 'module';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';

// pdf-parse is CJS-only; use createRequire for ESM compatibility
const require = createRequire(import.meta.url);
type PdfParseResult = { text: string; numpages: number };
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<PdfParseResult>;

import type { ApiResponse, Quiz } from '@braingames/shared';
import type { QuizRepository } from '../repositories/quiz-repository.js';
import type { QuestionRepository } from '../repositories/question-repository.js';
import type { AnswerRepository } from '../repositories/answer-repository.js';

interface Repos {
  quiz: QuizRepository;
  question: QuestionRepository;
  answer: AnswerRepository;
}

interface ParsedAnswer {
  text: string;
  isCorrect: boolean;
}

interface ParsedQuestion {
  text: string;
  type: 'multiple_choice' | 'true_false';
  timeLimit: 20;
  points: number;
  answers: ParsedAnswer[];
}

interface ParsedQuiz {
  title: string;
  questions: ParsedQuestion[];
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

// ── Heuristic parser ──────────────────────────────────────────────────────────
//
// Expected PDF format:
//
//   Quiz Title (first non-empty line)
//
//   1. Question text here?
//   A) Option one
//   B) Correct option *
//   C) Option three
//   D) Option four
//
// Rules:
//   - Questions start with a number followed by . or ) e.g. "1." or "1)"
//   - Options start with A-D followed by ) or . e.g. "A)" or "A."
//   - Mark the correct answer with * at the end of the option line
//   - True/False questions are auto-detected when only two options are True/False

const QUESTION_RE = /^\s*\d+[.)]\s+(.+)/;
const OPTION_RE = /^\s*([A-Da-d])[.)]\s+(.+)/;

function parsePdfText(text: string, filename: string): ParsedQuiz {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Use the first non-empty line as the title, fallback to filename
  const title = lines[0] && !QUESTION_RE.test(lines[0]) ? lines[0] : filename.replace(/\.pdf$/i, '');

  const questions: ParsedQuestion[] = [];
  let currentQuestion: string | null = null;
  let currentOptions: ParsedAnswer[] = [];

  const flushQuestion = () => {
    if (!currentQuestion || currentOptions.length < 2) return;

    const hasCorrect = currentOptions.some((o) => o.isCorrect);
    // If nobody marked *, default first option as correct so the quiz is still importable
    const answers = hasCorrect
      ? currentOptions
      : currentOptions.map((o, i) => ({ ...o, isCorrect: i === 0 }));

    const isTrueFalse =
      answers.length === 2 &&
      answers.every((a) => /^(true|false)$/i.test(a.text));

    questions.push({
      text: currentQuestion,
      type: isTrueFalse ? 'true_false' : 'multiple_choice',
      timeLimit: 20,
      points: 1000,
      answers,
    });

    currentQuestion = null;
    currentOptions = [];
  };

  for (const line of lines) {
    const qMatch = QUESTION_RE.exec(line);
    if (qMatch) {
      flushQuestion();
      currentQuestion = qMatch[1]!.trim();
      continue;
    }

    const oMatch = OPTION_RE.exec(line);
    if (oMatch && currentQuestion) {
      const raw = oMatch[2]!.trim();
      const isCorrect = raw.endsWith('*');
      const optionText = isCorrect ? raw.slice(0, -1).trim() : raw;
      currentOptions.push({ text: optionText, isCorrect });
      continue;
    }
  }

  flushQuestion();

  return { title, questions };
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function createPdfImportRouter(repos: Repos): Router {
  const router = Router();

  router.post('/', (req: Request, res: Response) => {
    upload.single('pdf')(req, res, (uploadErr) => {
      if (uploadErr) {
        const r: ApiResponse<null> = { success: false, data: null, error: (uploadErr as Error).message };
        res.status(400).json(r);
        return;
      }
      void handleImport(req, res, repos);
    });
  });

  return router;
}

async function handleImport(req: Request, res: Response, repos: Repos): Promise<void> {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    const r: ApiResponse<null> = { success: false, data: null, error: 'No PDF file provided' };
    res.status(400).json(r);
    return;
  }

  // ── Extract text ────────────────────────────────────────────────────────────
  let extractedText: string;
  try {
    const parsed = await pdfParse(file.buffer);
    extractedText = parsed.text.trim();
  } catch (err) {
    console.error('[pdf-import] pdf-parse error:', err);
    const r: ApiResponse<null> = { success: false, data: null, error: 'Could not extract text from PDF' };
    res.status(400).json(r);
    return;
  }

  if (extractedText.length < 20) {
    const r: ApiResponse<null> = {
      success: false, data: null,
      error: 'PDF contains too little readable text',
    };
    res.status(400).json(r);
    return;
  }

  // ── Parse ────────────────────────────────────────────────────────────────────
  const filename = file.originalname ?? 'Imported Quiz';
  const parsed = parsePdfText(extractedText, filename);

  if (parsed.questions.length === 0) {
    const r: ApiResponse<null> = {
      success: false, data: null,
      error: 'No questions found. Make sure your PDF uses the expected format: numbered questions (1.) with options (A) B) C) D)) and mark the correct answer with *',
    };
    res.status(400).json(r);
    return;
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  const quiz = repos.quiz.create({ title: parsed.title });

  for (const [index, q] of parsed.questions.entries()) {
    const question = repos.question.create(quiz.id, {
      type: q.type,
      text: q.text,
      timeLimit: q.timeLimit,
      points: q.points,
      order: index,
    });
    repos.answer.replaceAll(
      question.id,
      q.answers.map((a, i) => ({ text: a.text, isCorrect: a.isCorrect, order: i })),
    );
  }

  const r: ApiResponse<Quiz> = { success: true, data: quiz, error: null };
  res.status(201).json(r);
}
