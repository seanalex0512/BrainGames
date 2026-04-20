import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizCard } from './quiz-card';
import type { Quiz } from '@braingames/shared';

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'My Test Quiz',
  description: 'A test description',
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
};

function defaultProps(overrides = {}) {
  return {
    quiz: mockQuiz,
    questionCount: 5,
    onHostLive: vi.fn(),
    onPlay: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

describe('QuizCard', () => {
  it('renders quiz title', () => {
    render(<QuizCard {...defaultProps()} />);
    expect(screen.getByText('My Test Quiz')).toBeDefined();
  });

  it('renders description', () => {
    render(<QuizCard {...defaultProps()} />);
    expect(screen.getByText('A test description')).toBeDefined();
  });

  it('renders question count', () => {
    render(<QuizCard {...defaultProps()} />);
    expect(screen.getByText('5 questions')).toBeDefined();
  });

  it('renders singular for 1 question', () => {
    render(<QuizCard {...defaultProps({ questionCount: 1 })} />);
    expect(screen.getByText('1 question')).toBeDefined();
  });

  it('calls onHostLive when Host Live button is clicked', async () => {
    const onHostLive = vi.fn();
    render(<QuizCard {...defaultProps({ onHostLive })} />);
    await userEvent.click(screen.getByText('Host Live'));
    expect(onHostLive).toHaveBeenCalledOnce();
  });

  it('calls onPlay when Solo button is clicked', async () => {
    const onPlay = vi.fn();
    render(<QuizCard {...defaultProps({ onPlay })} />);
    await userEvent.click(screen.getByText('Solo'));
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('calls onEdit when Edit button clicked', async () => {
    const onEdit = vi.fn();
    render(<QuizCard {...defaultProps({ onEdit })} />);
    await userEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDuplicate when Copy button clicked', async () => {
    const onDuplicate = vi.fn();
    render(<QuizCard {...defaultProps({ onDuplicate })} />);
    await userEvent.click(screen.getByText('Copy'));
    expect(onDuplicate).toHaveBeenCalledOnce();
  });

  it('calls onDelete when Delete button clicked', async () => {
    const onDelete = vi.fn();
    render(<QuizCard {...defaultProps({ onDelete })} />);
    await userEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
