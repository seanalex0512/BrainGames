import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SoloPlay } from './solo-play';
import { usePlayStore } from '../stores/play-store';

const mockQuiz = {
  quiz: { id: 'quiz1', title: 'History Quiz', createdAt: '', updatedAt: '' },
  questions: [
    {
      id: 'q1', quizId: 'quiz1', type: 'multiple_choice', text: 'Capital of France?',
      timeLimit: 20, points: 1000, order: 0,
      answers: [
        { id: 'a1', questionId: 'q1', text: 'Berlin', isCorrect: false, order: 0 },
        { id: 'a2', questionId: 'q1', text: 'Paris', isCorrect: true, order: 1 },
        { id: 'a3', questionId: 'q1', text: 'Rome', isCorrect: false, order: 2 },
        { id: 'a4', questionId: 'q1', text: 'Madrid', isCorrect: false, order: 3 },
      ],
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  usePlayStore.getState().reset();
});

function renderPlay() {
  return render(
    <MemoryRouter initialEntries={['/quiz/quiz1/play']}>
      <Routes>
        <Route path="/quiz/:id/play" element={<SoloPlay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SoloPlay', () => {
  it('shows loading then question text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ success: true, data: mockQuiz, error: null }),
    }));
    renderPlay();
    await waitFor(() => expect(screen.getByText('Capital of France?')).toBeDefined());
  });

  it('renders answer buttons for the question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ success: true, data: mockQuiz, error: null }),
    }));
    renderPlay();
    await waitFor(() => expect(screen.getByText('Paris')).toBeDefined());
    expect(screen.getByText('Berlin')).toBeDefined();
    expect(screen.getByText('Rome')).toBeDefined();
    expect(screen.getByText('Madrid')).toBeDefined();
  });

  it('shows feedback overlay after answering', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ success: true, data: mockQuiz, error: null }),
    }));
    renderPlay();
    await waitFor(() => screen.getByText('Paris'));
    await userEvent.click(screen.getByText('Paris'));
    await waitFor(() => expect(screen.getByText('Correct!')).toBeDefined());
  });

  it('shows error state when quiz fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 404,
      json: () => Promise.resolve({ success: false, data: null, error: 'Not found' }),
    }));
    renderPlay();
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeDefined());
  });
});
