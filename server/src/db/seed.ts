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
    text: 'Which CSS selector targets an element with id="main"?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: '.main', isCorrect: false },
      { text: '#main', isCorrect: true },
      { text: '*main', isCorrect: false },
      { text: '@main', isCorrect: false },
    ],
  },
  {
    text: 'What is the default display value of a <span> element?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'block', isCorrect: false },
      { text: 'inline-block', isCorrect: false },
      { text: 'inline', isCorrect: true },
      { text: 'flex', isCorrect: false },
    ],
  },
  {
    text: 'Which HTML attribute is used to provide alternative text for an image?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'title', isCorrect: false },
      { text: 'src', isCorrect: false },
      { text: 'alt', isCorrect: true },
      { text: 'name', isCorrect: false },
    ],
  },
  {
    text: 'What does the CSS property "box-sizing: border-box" do?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: 'Includes padding and border in the element\'s total width/height', isCorrect: true },
      { text: 'Adds a border around the box', isCorrect: false },
      { text: 'Removes all margins', isCorrect: false },
      { text: 'Makes the element a block element', isCorrect: false },
    ],
  },
  {
    text: 'The <div> tag is an inline element by default.',
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
    text: 'What does [1,2,3].splice(1, 1) return?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '[1, 3]', isCorrect: false },
      { text: '[2]', isCorrect: true },
      { text: '[1, 2]', isCorrect: false },
      { text: '[3]', isCorrect: false },
    ],
  },
  {
    text: 'What is the output of ["a","b","c"].indexOf("d")?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'undefined', isCorrect: false },
      { text: 'false', isCorrect: false },
      { text: '-1', isCorrect: true },
      { text: 'null', isCorrect: false },
    ],
  },
  {
    text: 'What does [1,2,3].concat([4,5]) return?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: '[1,2,3,4,5]', isCorrect: true },
      { text: '[[1,2,3],[4,5]]', isCorrect: false },
      { text: '[1,2,3,[4,5]]', isCorrect: false },
      { text: 'Error', isCorrect: false },
    ],
  },
  {
    text: 'After let arr = [1,2,3]; arr.unshift(0); what is arr?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '[1,2,3,0]', isCorrect: false },
      { text: '[0,1,2,3]', isCorrect: true },
      { text: '[0,2,3]', isCorrect: false },
      { text: '[1,2,0]', isCorrect: false },
    ],
  },
  {
    text: '.splice() modifies the original array.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false },
    ],
  },

  // ─── JavaScript Loops (3) ───
  {
    text: 'What is the value of x after this runs?\nlet x = 0;\nfor (let i = 1; i <= 3; i++) { x += i; }',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '3', isCorrect: false },
      { text: '5', isCorrect: false },
      { text: '6', isCorrect: true },
      { text: '10', isCorrect: false },
    ],
  },
  {
    text: 'What does "continue" do inside a loop?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Exits the loop', isCorrect: false },
      { text: 'Restarts the loop from the beginning', isCorrect: false },
      { text: 'Skips the rest of the current iteration', isCorrect: true },
      { text: 'Pauses execution for 1 second', isCorrect: false },
    ],
  },
  {
    text: 'How many times will this run?\nlet i = 10;\nwhile (i < 5) { i++; }',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '5', isCorrect: false },
      { text: '10', isCorrect: false },
      { text: '0', isCorrect: true },
      { text: 'Infinite', isCorrect: false },
    ],
  },

  // ─── JavaScript If/Else & Logic (2) ───
  {
    text: 'What is the output?\nlet a = "5";\nif (a === 5) { console.log("yes"); } else { console.log("no"); }',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: 'yes', isCorrect: false },
      { text: 'no', isCorrect: true },
      { text: 'undefined', isCorrect: false },
      { text: 'Error', isCorrect: false },
    ],
  },
  {
    text: 'Which value is NOT falsy in JavaScript?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: '0', isCorrect: false },
      { text: '""', isCorrect: false },
      { text: '"false"', isCorrect: true },
      { text: 'null', isCorrect: false },
    ],
  },

  // ─── PHP (5) ───
  {
    text: 'What is the output of: echo 5 + "3 apples";',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: '53 apples', isCorrect: false },
      { text: '8', isCorrect: true },
      { text: 'Error', isCorrect: false },
      { text: '5', isCorrect: false },
    ],
  },
  {
    text: 'Which PHP function returns the number of elements in an array?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'length()', isCorrect: false },
      { text: 'size()', isCorrect: false },
      { text: 'array_length()', isCorrect: false },
      { text: 'count()', isCorrect: true },
    ],
  },
  {
    text: 'What is the correct way to create an array in PHP?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: '$arr = array(1, 2, 3);', isCorrect: true },
      { text: '$arr = [1, 2, 3]', isCorrect: false },
      { text: 'Both of the above', isCorrect: false },
      { text: 'Neither of the above', isCorrect: false },
    ],
  },
  {
    text: 'What does the . operator do in PHP?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Addition', isCorrect: false },
      { text: 'String concatenation', isCorrect: true },
      { text: 'Object access', isCorrect: false },
      { text: 'Comparison', isCorrect: false },
    ],
  },
  {
    text: 'In PHP, variables are case-sensitive.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false },
    ],
  },

  // ─── CSS Flexbox (5) ───
  {
    text: 'What does flex-wrap: wrap do?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Prevents items from shrinking', isCorrect: false },
      { text: 'Allows items to wrap to the next line', isCorrect: true },
      { text: 'Reverses the item order', isCorrect: false },
      { text: 'Makes items equal width', isCorrect: false },
    ],
  },
  {
    text: 'Which flex property makes one item take up twice the space of others?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'flex-basis: 200%', isCorrect: false },
      { text: 'flex-grow: 2', isCorrect: true },
      { text: 'flex-size: double', isCorrect: false },
      { text: 'flex-width: 2x', isCorrect: false },
    ],
  },
  {
    text: 'What does align-self do in flexbox?',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: 'Aligns all items along the main axis', isCorrect: false },
      { text: 'Aligns the container itself', isCorrect: false },
      { text: 'Overrides align-items for a single item', isCorrect: true },
      { text: 'Centers the element horizontally', isCorrect: false },
    ],
  },
  {
    text: 'What is the shorthand for flex-grow: 1, flex-shrink: 1, flex-basis: 0?',
    type: 'multiple_choice',
    timeLimit: 30,
    points: 1000,
    answers: [
      { text: 'flex: auto', isCorrect: false },
      { text: 'flex: 1', isCorrect: true },
      { text: 'flex: 0 1 auto', isCorrect: false },
      { text: 'flex: initial', isCorrect: false },
    ],
  },
  {
    text: 'In flexbox, the cross axis is always vertical.',
    type: 'true_false',
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true },
    ],
  },
];

/** Seeds the database with a single quiz containing all questions if no quizzes exist yet. */
export function seedIfEmpty(db: Database.Database): void {
  const quizRepo = new SqliteQuizRepository(db);
  const questionRepo = new SqliteQuestionRepository(db);
  const answerRepo = new SqliteAnswerRepository(db);

  const existing = quizRepo.findAll();
  if (existing.length > 0) {
    console.log(`[seed] Database already has ${existing.length} quizzes — skipping seed.`);
    return;
  }

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
