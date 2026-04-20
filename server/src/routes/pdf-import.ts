import { createRequire } from 'module';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';

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

interface GeneratedAnswer {
  text: string;
  isCorrect: boolean;
}

interface GeneratedQuestion {
  text: string;
  type: 'multiple_choice' | 'true_false';
  timeLimit: number;
  points: number;
  answers: GeneratedAnswer[];
}

interface GeneratedQuiz {
  title: string;
  questions: GeneratedQuestion[];
}

const VALID_TIME_LIMITS = new Set([5, 10, 20, 30, 60]);
const MAX_TEXT_CHARS = 8000; // ~2 k tokens — keep Haiku costs low

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

// ── Validate + coerce Claude's JSON output ────────────────────────────────────

function parseGenerated(raw: unknown): GeneratedQuiz {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid response structure');
  const obj = raw as Record<string, unknown>;

  if (typeof obj['title'] !== 'string' || !obj['title'].trim()) throw new Error('Missing quiz title');
  if (!Array.isArray(obj['questions']) || obj['questions'].length === 0) throw new Error('No questions generated');

  const questions: GeneratedQuestion[] = (obj['questions'] as unknown[]).map((q, i) => {
    if (!q || typeof q !== 'object') throw new Error(`Question ${i}: invalid`);
    const qo = q as Record<string, unknown>;

    const text = typeof qo['text'] === 'string' ? qo['text'].trim() : '';
    if (!text) throw new Error(`Question ${i}: missing text`);

    const type: 'multiple_choice' | 'true_false' =
      qo['type'] === 'true_false' ? 'true_false' : 'multiple_choice';

    const timeLimit = VALID_TIME_LIMITS.has(qo['timeLimit'] as number)
      ? (qo['timeLimit'] as number)
      : 20;

    const points =
      typeof qo['points'] === 'number' && qo['points'] > 0 ? qo['points'] : 1000;

    if (!Array.isArray(qo['answers'])) throw new Error(`Question ${i}: missing answers`);
    const answers: GeneratedAnswer[] = (qo['answers'] as unknown[]).map((a) => {
      if (!a || typeof a !== 'object') throw new Error(`Question ${i}: invalid answer`);
      const ao = a as Record<string, unknown>;
      return {
        text: String(ao['text'] ?? '').trim(),
        isCorrect: Boolean(ao['isCorrect']),
      };
    });

    // Guarantee at least one correct answer
    if (!answers.some((a) => a.isCorrect) && answers[0]) {
      answers[0] = { ...answers[0], isCorrect: true };
    }

    return { text, type, timeLimit, points, answers };
  });

  return { title: obj['title'] as string, questions };
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
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    const r: ApiResponse<null> = {
      success: false, data: null,
      error: 'ANTHROPIC_API_KEY is not set on the server',
    };
    res.status(400).json(r);
    return;
  }

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
    extractedText = parsed.text.slice(0, MAX_TEXT_CHARS).trim();
  } catch (err) {
    console.error('[pdf-import] pdf-parse error:', err);
    const r: ApiResponse<null> = { success: false, data: null, error: 'Could not extract text from PDF' };
    res.status(400).json(r);
    return;
  }

  if (extractedText.length < 50) {
    const r: ApiResponse<null> = {
      success: false, data: null,
      error: 'PDF contains too little readable text to generate questions',
    };
    res.status(400).json(r);
    return;
  }

  // ── Call Claude ─────────────────────────────────────────────────────────────
  let generated: GeneratedQuiz;
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a quiz generator. Read the text below and generate 5 to 10 quiz questions.

Return ONLY a valid JSON object — no markdown, no explanation, no extra text:
{
  "title": "Short descriptive quiz title",
  "questions": [
    {
      "text": "Question text?",
      "type": "multiple_choice",
      "timeLimit": 20,
      "points": 1000,
      "answers": [
        { "text": "Correct answer", "isCorrect": true },
        { "text": "Distractor A", "isCorrect": false },
        { "text": "Distractor B", "isCorrect": false },
        { "text": "Distractor C", "isCorrect": false }
      ]
    }
  ]
}

Rules:
- multiple_choice: exactly 4 answers, exactly 1 correct
- true_false: exactly 2 answers — "True" and "False"
- timeLimit must be one of: 5, 10, 20, 30, 60
- points: 1000 for all
- Mix both types; prefer multiple_choice
- Questions must be factual and clearly answered from the content

Content:
${extractedText}`,
      }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    // Strip optional markdown code fence
    const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    generated = parseGenerated(JSON.parse(json) as unknown);
  } catch (err) {
    console.error('[pdf-import] Claude error:', err);
    const r: ApiResponse<null> = {
      success: false, data: null,
      error: 'Failed to generate questions from the PDF content',
    };
    res.status(500).json(r);
    return;
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  const quiz = repos.quiz.create({ title: generated.title });

  for (const [index, q] of generated.questions.entries()) {
    const question = repos.question.create(quiz.id, {
      type: q.type,
      text: q.text,
      timeLimit: q.timeLimit as 20,
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
