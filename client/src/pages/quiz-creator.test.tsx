import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QuizCreator } from './quiz-creator';
import { useEditorStore } from '../stores/editor-store';

afterEach(() => {
  vi.restoreAllMocks();
  useEditorStore.getState().reset();
});

function renderCreator(path = '/quiz/new', routePath = '/quiz/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path={routePath} element={<QuizCreator />} /></Routes>
    </MemoryRouter>
  );
}

describe('QuizCreator — create mode', () => {
  it('shows "New Quiz" heading', () => {
    renderCreator();
    expect(screen.getByText('New Quiz')).toBeDefined();
  });

  it('has title input', () => {
    renderCreator();
    expect(screen.getByLabelText('Quiz title')).toBeDefined();
  });

  it('shows Create Quiz button', () => {
    renderCreator();
    expect(screen.getByText('Create Quiz')).toBeDefined();
  });

  it('adds a question when Add Question is clicked', async () => {
    renderCreator();
    await userEvent.click(screen.getByText('+ Add Question'));
    await waitFor(() => expect(screen.getByText('Question 1')).toBeDefined());
  });

  it('updates store title when typing', async () => {
    renderCreator();
    await userEvent.type(screen.getByLabelText('Quiz title'), 'My Quiz');
    await waitFor(() => {
      expect(useEditorStore.getState().title).toBe('My Quiz');
    });
  });
});

describe('QuizCreator — edit mode', () => {
  it('shows "Edit Quiz" heading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          quiz: { id: 'quiz-1', title: 'Existing Quiz', createdAt: '', updatedAt: '' },
          questions: [],
        },
        error: null,
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/quiz/quiz-1/edit']}>
        <Routes><Route path="/quiz/:id/edit" element={<QuizCreator />} /></Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Edit Quiz')).toBeDefined());
  });
});
