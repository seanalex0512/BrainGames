import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QuizLibrary } from './quiz-library';
import { useQuizStore } from '../stores/quiz-store';
import type { Quiz } from '@braingames/shared';

const mockQuizzes: Quiz[] = [
  { id: 'q1', title: 'Quiz One', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'q2', title: 'Quiz Two', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
];

function renderLibrary() {
  return render(<MemoryRouter><QuizLibrary /></MemoryRouter>);
}

afterEach(() => {
  vi.restoreAllMocks();
  useQuizStore.setState({ quizzes: [], loading: false, error: null });
});

describe('QuizLibrary', () => {
  describe('empty state', () => {
    it('shows empty state when no quizzes', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ success: true, data: [], error: null }),
      }));
      renderLibrary();
      await waitFor(() => {
        expect(screen.getByText(/No quizzes yet/i)).toBeDefined();
      });
    });

    it('shows create button in empty state', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ success: true, data: [], error: null }),
      }));
      renderLibrary();
      await waitFor(() => {
        expect(screen.getByText('Create your first quiz')).toBeDefined();
      });
    });
  });

  describe('with quizzes', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ success: true, data: mockQuizzes, error: null }),
      }));
    });

    it('renders quiz titles', async () => {
      renderLibrary();
      await waitFor(() => expect(screen.getByText('Quiz One')).toBeDefined());
    });

    it('opens delete modal when Delete is clicked', async () => {
      renderLibrary();
      await waitFor(() => screen.getAllByText('Delete'));
      await userEvent.click(screen.getAllByText('Delete')[0]!);
      await waitFor(() => expect(screen.getByText('Delete quiz?')).toBeDefined());
    });

    it('cancels delete when Cancel is clicked', async () => {
      renderLibrary();
      await waitFor(() => screen.getAllByText('Delete'));
      await userEvent.click(screen.getAllByText('Delete')[0]!);
      await waitFor(() => screen.getByText('Cancel'));
      await userEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    });
  });
});
