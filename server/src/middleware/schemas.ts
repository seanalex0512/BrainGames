import type { ValidationSchema } from './validate.js';

const TIME_LIMITS = new Set([5, 10, 20, 30, 60]);
const QUESTION_TYPES = new Set(['multiple_choice', 'true_false']);

export const createQuizSchema: ValidationSchema = {
  title: { required: true, type: 'string' },
  description: { required: false, type: 'string' },
};

export const updateQuizSchema: ValidationSchema = {
  title: { required: false, type: 'string' },
  description: { required: false, type: 'string' },
};

export const createQuestionSchema: ValidationSchema = {
  type: {
    required: true,
    type: 'string',
    validate: (v) => (QUESTION_TYPES.has(v as string) ? null : 'type must be "multiple_choice" or "true_false"'),
  },
  text: { required: true, type: 'string' },
  imageUrl: { required: false, type: 'string' },
  timeLimit: {
    required: true,
    type: 'number',
    validate: (v) => (TIME_LIMITS.has(v as number) ? null : 'timeLimit must be one of: 5, 10, 20, 30, 60'),
  },
  points: {
    required: true,
    type: 'number',
    validate: (v) => (typeof v === 'number' && v > 0 ? null : 'points must be a positive number'),
  },
  order: {
    required: true,
    type: 'number',
    validate: (v) => (typeof v === 'number' && v >= 0 ? null : 'order must be a non-negative number'),
  },
};

export const updateQuestionSchema: ValidationSchema = {
  type: {
    required: false,
    type: 'string',
    validate: (v) => (v === undefined || QUESTION_TYPES.has(v as string) ? null : 'type must be "multiple_choice" or "true_false"'),
  },
  text: { required: false, type: 'string' },
  imageUrl: { required: false, type: 'string' },
  timeLimit: {
    required: false,
    type: 'number',
    validate: (v) => (v === undefined || TIME_LIMITS.has(v as number) ? null : 'timeLimit must be one of: 5, 10, 20, 30, 60'),
  },
  points: {
    required: false,
    type: 'number',
    validate: (v) => (v === undefined || (typeof v === 'number' && v > 0) ? null : 'points must be a positive number'),
  },
  order: {
    required: false,
    type: 'number',
    validate: (v) => (v === undefined || (typeof v === 'number' && v >= 0) ? null : 'order must be a non-negative number'),
  },
};

export const replaceAnswersSchema: ValidationSchema = {
  answers: {
    required: true,
    validate: (v) => {
      if (!Array.isArray(v)) return '"answers" must be an array';
      if (v.length < 2 || v.length > 4) return '"answers" must have between 2 and 4 items';
      return null;
    },
  },
};

export const reorderSchema: ValidationSchema = {
  ids: {
    required: true,
    validate: (v) => (Array.isArray(v) && v.every((id) => typeof id === 'string') ? null : '"ids" must be an array of strings'),
  },
};
