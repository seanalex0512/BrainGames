import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './app';

describe('App layout', () => {
  it('renders the BrainGames header', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    const logos = screen.getAllByText(/BrainGames/);
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders a header element', () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(container.querySelector('header')).not.toBeNull();
  });
});
