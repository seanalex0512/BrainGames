import type Database from 'better-sqlite3';
import type { QuestionType, TimeLimit } from '@braingames/shared';
import { SqliteQuizRepository } from '../repositories/quiz-repository.js';
import { SqliteQuestionRepository } from '../repositories/question-repository.js';
import { SqliteAnswerRepository } from '../repositories/answer-repository.js';

interface SeedAnswer {
  readonly text: string;
  readonly isCorrect: boolean;
}

interface SeedQuestion {
  readonly text: string;
  readonly type: QuestionType;
  readonly timeLimit: TimeLimit;
  readonly points: number;
  readonly answers: ReadonlyArray<SeedAnswer>;
}

const SEED_QUESTIONS: ReadonlyArray<SeedQuestion> = [
  // ─── HTML & CSS (5) ───
  {
    text: 'What does the <meta charset="UTF-8"> tag do in an HTML document?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Sets the page background color', isCorrect: false },
      { text: 'Specifies the character encoding for the document', isCorrect: true },
      { text: 'Links an external stylesheet', isCorrect: false },
      { text: 'Defines the page title shown in the browser tab', isCorrect: false },
    ],
  },
  {
    text: 'Which CSS property is used to make text uppercase without changing the HTML?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'font-style: uppercase', isCorrect: false },
      { text: 'text-transform: uppercase', isCorrect: true },
      { text: 'font-variant: caps', isCorrect: false },
      { text: 'text-decoration: uppercase', isCorrect: false },
    ],
  },
  {
    text: 'What is the purpose of the z-index property in CSS?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Controls the zoom level of an element', isCorrect: false },
      { text: 'Sets the horizontal position of an element', isCorrect: false },
      { text: 'Controls the stacking order of overlapping elements', isCorrect: true },
      { text: 'Defines the number of columns in a grid', isCorrect: false },
    ],
  },
  {
    text: 'Which HTML element is used to group inline elements for styling?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: '<section>', isCorrect: false },
      { text: '<div>', isCorrect: false },
      { text: '<p>', isCorrect: false },
      { text: '<span>', isCorrect: true },
    ],
  },
  {
    text: 'The CSS property "position: absolute" positions an element relative to the browser window.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true },
    ],
  },

  // ─── JavaScript Arrays (5) ───
  {
    text: 'What does [10, 20, 30].slice(0, 2) return?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '[20, 30]', isCorrect: false },
      { text: '[10, 20, 30]', isCorrect: false },
      { text: '[10, 20]', isCorrect: true },
      { text: '[10]', isCorrect: false },
    ],
  },
  {
    text: 'After let arr = [5, 10]; arr.push(15); arr.pop(); what is arr?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '[5, 10, 15]', isCorrect: false },
      { text: '[5, 10]', isCorrect: true },
      { text: '[5, 15]', isCorrect: false },
      { text: '[10, 15]', isCorrect: false },
    ],
  },
  {
    text: 'What is the result of ["cat", "dog", "bird"].includes("Cat")?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'true', isCorrect: false },
      { text: 'false', isCorrect: true },
      { text: 'undefined', isCorrect: false },
      { text: 'Error', isCorrect: false },
    ],
  },
  {
    text: 'What does [3, 1, 4, 1, 5].filter(n => n > 2) return?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '[3, 4, 5]', isCorrect: true },
      { text: '[1, 1]', isCorrect: false },
      { text: '[3, 1, 4, 1, 5]', isCorrect: false },
      { text: '[4, 5]', isCorrect: false },
    ],
  },
  {
    text: 'The .slice() method modifies the original array.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true },
    ],
  },

  // ─── JavaScript Loops (3) ───
  {
    text: 'What will this code print?\nlet total = 1;\nfor (let i = 0; i < 4; i++) { total *= 2; }\nconsole.log(total);',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '8', isCorrect: false },
      { text: '4', isCorrect: false },
      { text: '16', isCorrect: true },
      { text: '32', isCorrect: false },
    ],
  },
  {
    text: 'What is the output?\nfor (let i = 5; i >= 1; i--) { if (i === 3) break; }\nconsole.log(i);',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '3', isCorrect: false },
      { text: '1', isCorrect: false },
      { text: '5', isCorrect: false },
      { text: 'ReferenceError', isCorrect: true },
    ],
  },
  {
    text: 'How many times does this loop run?\nlet count = 0;\ndo { count++; } while (count < 1);',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '0', isCorrect: false },
      { text: '1', isCorrect: true },
      { text: '2', isCorrect: false },
      { text: 'Infinite', isCorrect: false },
    ],
  },

  // ─── JavaScript If/Else & Logic (2) ───
  {
    text: 'What is the value of result?\nlet x = 7;\nlet result = (x > 5 && x < 10) ? "yes" : "no";',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '"no"', isCorrect: false },
      { text: 'undefined', isCorrect: false },
      { text: '"yes"', isCorrect: true },
      { text: 'true', isCorrect: false },
    ],
  },
  {
    text: 'What does this return?\nBoolean([] && "" && 0)',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: 'true', isCorrect: false },
      { text: 'false', isCorrect: true },
      { text: '0', isCorrect: false },
      { text: '""', isCorrect: false },
    ],
  },

  // ─── PHP (5) ───
  {
    text: 'What is the output of: $x = "10"; echo $x + 5 . " items";',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '105 items', isCorrect: false },
      { text: '15 items', isCorrect: true },
      { text: '10 + 5 items', isCorrect: false },
      { text: 'Error', isCorrect: false },
    ],
  },
  {
    text: 'Which PHP function checks if a key exists in an associative array?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'in_array()', isCorrect: false },
      { text: 'isset()', isCorrect: false },
      { text: 'array_key_exists()', isCorrect: true },
      { text: 'array_has()', isCorrect: false },
    ],
  },
  {
    text: 'What does the === operator do in PHP?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Assigns a value', isCorrect: false },
      { text: 'Compares values only', isCorrect: false },
      { text: 'Compares both value and type', isCorrect: true },
      { text: 'Checks if a variable is set', isCorrect: false },
    ],
  },
  {
    text: 'What is the output of: echo substr("Hello World", 6);',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Hello', isCorrect: false },
      { text: 'World', isCorrect: true },
      { text: 'o Worl', isCorrect: false },
      { text: ' World', isCorrect: false },
    ],
  },
  {
    text: 'In PHP, function names are case-sensitive.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true },
    ],
  },

  // ─── CSS Flexbox (5) ───
  {
    text: 'Which property do you set on the PARENT to make its children flex items?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'flex-item: true', isCorrect: false },
      { text: 'display: flex', isCorrect: true },
      { text: 'position: flex', isCorrect: false },
      { text: 'flex: enable', isCorrect: false },
    ],
  },
  {
    text: 'What is the default value of flex-direction?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'column', isCorrect: false },
      { text: 'row-reverse', isCorrect: false },
      { text: 'row', isCorrect: true },
      { text: 'inherit', isCorrect: false },
    ],
  },
  {
    text: 'Which property controls spacing BETWEEN flex items (not around them)?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'margin: auto', isCorrect: false },
      { text: 'justify-content: space-between', isCorrect: true },
      { text: 'align-items: space-between', isCorrect: false },
      { text: 'flex-gap: even', isCorrect: false },
    ],
  },
  {
    text: 'If flex-direction is "column", which axis does justify-content control?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: 'Horizontal axis', isCorrect: false },
      { text: 'Both axes equally', isCorrect: false },
      { text: 'Vertical axis', isCorrect: true },
      { text: 'Neither — it has no effect in column mode', isCorrect: false },
    ],
  },
  {
    text: 'The "gap" property in flexbox adds space between items without adding space at the edges.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false },
    ],
  },
];

/** Clears all quizzes and re-seeds with the latest question set. */
export function seedIfEmpty(db: Database.Database): void {
  const quizRepo = new SqliteQuizRepository(db);
  const questionRepo = new SqliteQuestionRepository(db);
  const answerRepo = new SqliteAnswerRepository(db);

  // Delete all existing data so only the latest seed questions remain
  db.exec('DELETE FROM answers');
  db.exec('DELETE FROM questions');
  db.exec('DELETE FROM quizzes');
  console.log('[seed] Cleared all existing quiz data.');

  const quiz = quizRepo.create({
    title: 'Web Development Fundamentals',
    description: 'HTML, CSS, JavaScript, PHP & Flexbox — 25 questions',
  });

  for (let i = 0; i < SEED_QUESTIONS.length; i++) {
    const qData = SEED_QUESTIONS[i]!;
    const question = questionRepo.create(quiz.id, {
      type: qData.type,
      text: qData.text,
      timeLimit: qData.timeLimit,
      points: qData.points,
      order: i,
    });

    answerRepo.replaceAll(
      question.id,
      qData.answers.map((a, idx) => ({
        text: a.text,
        isCorrect: a.isCorrect,
        order: idx,
      })),
    );
  }

  console.log(`[seed] Seeded 1 quiz with ${SEED_QUESTIONS.length} questions.`);
}
