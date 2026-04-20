import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerButton } from './answer-button';

describe('AnswerButton', () => {
  it('renders answer text', () => {
    render(<AnswerButton index={0} text="Paris" onClick={vi.fn()} disabled={false} />);
    expect(screen.getByText('Paris')).toBeDefined();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<AnswerButton index={0} text="Paris" onClick={onClick} disabled={false} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<AnswerButton index={0} text="Paris" onClick={onClick} disabled={true} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies correct color for each index', () => {
    const { rerender, container } = render(
      <AnswerButton index={0} text="A" onClick={vi.fn()} disabled={false} />
    );
    const btn0 = container.querySelector('button');
    expect(btn0?.className).toContain('bg-brain-red');

    rerender(<AnswerButton index={1} text="B" onClick={vi.fn()} disabled={false} />);
    const btn1 = container.querySelector('button');
    expect(btn1?.className).toContain('bg-brain-blue');

    rerender(<AnswerButton index={2} text="C" onClick={vi.fn()} disabled={false} />);
    const btn2 = container.querySelector('button');
    expect(btn2?.className).toContain('bg-brain-yellow');

    rerender(<AnswerButton index={3} text="D" onClick={vi.fn()} disabled={false} />);
    const btn3 = container.querySelector('button');
    expect(btn3?.className).toContain('bg-brain-green');
  });

  it('shows correct indicator when showResult is correct', () => {
    render(
      <AnswerButton index={0} text="Paris" onClick={vi.fn()} disabled={true} showResult="correct" />
    );
    expect(screen.getByText('✓')).toBeDefined();
  });

  it('shows incorrect indicator when showResult is incorrect', () => {
    render(
      <AnswerButton index={0} text="Berlin" onClick={vi.fn()} disabled={true} showResult="incorrect" />
    );
    expect(screen.getByText('✗')).toBeDefined();
  });
});
