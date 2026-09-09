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

interface SeedQuiz {
  readonly title: string;
  readonly description: string;
  readonly questions: ReadonlyArray<SeedQuestion>;
}

const SEED_QUIZZES: ReadonlyArray<SeedQuiz> = [
  {
    title: 'HTML & CSS Basics',
    description: 'Fundamental HTML and CSS questions for beginners',
    questions: [
      {
        text: 'What does HTML stand for?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'HyperText Markup Language', isCorrect: true },
          { text: 'High Tech Modern Language', isCorrect: false },
          { text: 'HyperTransfer Markup Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
        ],
      },
      {
        text: 'Which HTML tag is used to create a hyperlink?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: '<a>', isCorrect: true },
          { text: '<link>', isCorrect: false },
          { text: '<href>', isCorrect: false },
          { text: '<url>', isCorrect: false },
        ],
      },
      {
        text: 'What is the correct CSS property to change text color?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'color', isCorrect: true },
          { text: 'text-color', isCorrect: false },
          { text: 'font-color', isCorrect: false },
          { text: 'foreground-color', isCorrect: false },
        ],
      },
      {
        text: 'Which HTML tag is used for the largest heading?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: '<h1>', isCorrect: true },
          { text: '<h6>', isCorrect: false },
          { text: '<heading>', isCorrect: false },
          { text: '<head>', isCorrect: false },
        ],
      },
      {
        text: 'The <br> tag in HTML requires a closing tag.',
        type: 'true_false',
        timeLimit: 10,
        points: 1000,
        answers: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true },
        ],
      },
    ],
  },
  {
    title: 'JavaScript Arrays: push, pop, slice & more',
    description: 'Array methods in JavaScript — push, pop, slice, splice, and more',
    questions: [
      {
        text: 'What does array.push("x") do?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'Adds "x" to the end of the array', isCorrect: true },
          { text: 'Adds "x" to the beginning of the array', isCorrect: false },
          { text: 'Removes the last element', isCorrect: false },
          { text: 'Returns a new array with "x"', isCorrect: false },
        ],
      },
      {
        text: 'What does array.pop() return?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'The removed last element', isCorrect: true },
          { text: 'The new length of the array', isCorrect: false },
          { text: 'The first element', isCorrect: false },
          { text: 'undefined always', isCorrect: false },
        ],
      },
      {
        text: 'What does [1,2,3,4,5].slice(1, 3) return?',
        type: 'multiple_choice',
        timeLimit: 30,
        points: 1000,
        answers: [
          { text: '[2, 3]', isCorrect: true },
          { text: '[1, 2, 3]', isCorrect: false },
          { text: '[2, 3, 4]', isCorrect: false },
          { text: '[1, 2]', isCorrect: false },
        ],
      },
      {
        text: 'Does .slice() modify the original array?',
        type: 'true_false',
        timeLimit: 10,
        points: 1000,
        answers: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true },
        ],
      },
      {
        text: 'What is the length of ["a", "b", "c"] after calling .pop()?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: '2', isCorrect: true },
          { text: '3', isCorrect: false },
          { text: '1', isCorrect: false },
          { text: '0', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'JavaScript Loops',
    description: 'for, while, and loop concepts in JavaScript',
    questions: [
      {
        text: 'How many times does this loop run?\nfor (let i = 0; i < 5; i++) { }',
        type: 'multiple_choice',
        timeLimit: 30,
        points: 1000,
        answers: [
          { text: '5', isCorrect: true },
          { text: '4', isCorrect: false },
          { text: '6', isCorrect: false },
          { text: 'Infinite', isCorrect: false },
        ],
      },
      {
        text: 'Which loop is guaranteed to run at least once?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'do...while', isCorrect: true },
          { text: 'for', isCorrect: false },
          { text: 'while', isCorrect: false },
          { text: 'for...in', isCorrect: false },
        ],
      },
      {
        text: 'What does the "break" keyword do inside a loop?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'Exits the loop immediately', isCorrect: true },
          { text: 'Skips to the next iteration', isCorrect: false },
          { text: 'Restarts the loop', isCorrect: false },
          { text: 'Pauses the loop', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'JavaScript If/Else',
    description: 'Conditional statements in JavaScript',
    questions: [
      {
        text: 'What will this output?\nlet x = 10;\nif (x > 5) { console.log("A"); } else { console.log("B"); }',
        type: 'multiple_choice',
        timeLimit: 30,
        points: 1000,
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
          { text: 'undefined', isCorrect: false },
          { text: 'Error', isCorrect: false },
        ],
      },
      {
        text: 'In JavaScript, if (0) evaluates to:',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'false (falsy)', isCorrect: true },
          { text: 'true (truthy)', isCorrect: false },
          { text: 'Error', isCorrect: false },
          { text: 'null', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'PHP Basics',
    description: 'Basic PHP syntax, variables, and functions',
    questions: [
      {
        text: 'What does PHP stand for?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'PHP: Hypertext Preprocessor', isCorrect: true },
          { text: 'Personal Home Page', isCorrect: false },
          { text: 'Pre-Hypertext Processor', isCorrect: false },
          { text: 'Programming Hypertext Protocol', isCorrect: false },
        ],
      },
      {
        text: 'How do you start a PHP block?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: '<?php', isCorrect: true },
          { text: '<php>', isCorrect: false },
          { text: '<script lang="php">', isCorrect: false },
          { text: '<%php', isCorrect: false },
        ],
      },
      {
        text: 'Which symbol is used for variables in PHP?',
        type: 'multiple_choice',
        timeLimit: 10,
        points: 1000,
        answers: [
          { text: '$', isCorrect: true },
          { text: '#', isCorrect: false },
          { text: '@', isCorrect: false },
          { text: '&', isCorrect: false },
        ],
      },
      {
        text: 'What is the correct way to print "Hello" in PHP?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'echo "Hello";', isCorrect: true },
          { text: 'print("Hello")', isCorrect: false },
          { text: 'console.log("Hello");', isCorrect: false },
          { text: 'System.out.println("Hello");', isCorrect: false },
        ],
      },
      {
        text: 'PHP is a server-side scripting language.',
        type: 'true_false',
        timeLimit: 10,
        points: 1000,
        answers: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'CSS Flexbox',
    description: 'Flexbox layout concepts for beginners',
    questions: [
      {
        text: 'Which CSS property activates flexbox on a container?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'display: flex', isCorrect: true },
          { text: 'position: flex', isCorrect: false },
          { text: 'layout: flexbox', isCorrect: false },
          { text: 'flex: enable', isCorrect: false },
        ],
      },
      {
        text: 'What is the default flex-direction?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'row', isCorrect: true },
          { text: 'column', isCorrect: false },
          { text: 'row-reverse', isCorrect: false },
          { text: 'block', isCorrect: false },
        ],
      },
      {
        text: 'Which property centers items along the main axis?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'justify-content: center', isCorrect: true },
          { text: 'align-items: center', isCorrect: false },
          { text: 'text-align: center', isCorrect: false },
          { text: 'margin: auto', isCorrect: false },
        ],
      },
      {
        text: 'Which property centers items along the cross axis?',
        type: 'multiple_choice',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: 'align-items: center', isCorrect: true },
          { text: 'justify-content: center', isCorrect: false },
          { text: 'vertical-align: middle', isCorrect: false },
          { text: 'flex-align: center', isCorrect: false },
        ],
      },
      {
        text: 'justify-content: space-between puts equal space between items, but no space at the edges.',
        type: 'true_false',
        timeLimit: 10,
        points: 1000,
        answers: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
      },
    ],
  },
];

/** Seeds the database with default quizzes if no quizzes exist yet. */
export function seedIfEmpty(db: Database.Database): void {
  const quizRepo = new SqliteQuizRepository(db);
  const questionRepo = new SqliteQuestionRepository(db);
  const answerRepo = new SqliteAnswerRepository(db);

  const existing = quizRepo.findAll();
  if (existing.length > 0) {
    console.log(`[seed] Database already has ${existing.length} quizzes — skipping seed.`);
    return;
  }

  let totalQuestions = 0;

  for (const quizData of SEED_QUIZZES) {
    const quiz = quizRepo.create({ title: quizData.title, description: quizData.description });

    for (let i = 0; i < quizData.questions.length; i++) {
      const qData = quizData.questions[i]!;
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

      totalQuestions++;
    }
  }

  console.log(`[seed] Seeded ${SEED_QUIZZES.length} quizzes with ${totalQuestions} questions.`);
}
