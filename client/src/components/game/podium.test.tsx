import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LeaderboardEntry } from '@braingames/shared';
import { Podium } from './podium';

const leaderboard: LeaderboardEntry[] = [
  { id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 2000, streak: 4 },
  { id: 'p2', nickname: 'Bob',   avatarColor: '#1368CE', score: 1500, streak: 2 },
  { id: 'p3', nickname: 'Carol', avatarColor: '#D89E00', score: 1000, streak: 1 },
  { id: 'p4', nickname: 'Dave',  avatarColor: '#26890C', score:  800, streak: 0 },
];

describe('Podium', () => {
  it('renders "Game Over!" heading', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Game Over!')).toBeDefined();
  });

  it('renders the top-3 player nicknames', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('Carol')).toBeDefined();
  });

  it('does not render 4th place on the podium', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Dave')).toBeNull();
  });

  it('renders gold, silver, and bronze medals', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('🥇')).toBeDefined();
    expect(screen.getByText('🥈')).toBeDefined();
    expect(screen.getByText('🥉')).toBeDefined();
  });

  it('renders scores for top 3', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('2,000 pts')).toBeDefined();
    expect(screen.getByText('1,500 pts')).toBeDefined();
    expect(screen.getByText('1,000 pts')).toBeDefined();
  });

  it('renders "Play Again →" button', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Play Again →')).toBeDefined();
  });

  it('renders "Back to Library" button', () => {
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Back to Library')).toBeDefined();
  });

  it('calls onPlayAgain when "Play Again →" is clicked', async () => {
    const onPlayAgain = vi.fn();
    render(<Podium leaderboard={leaderboard} onPlayAgain={onPlayAgain} onBack={vi.fn()} />);
    await userEvent.click(screen.getByText('Play Again →'));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it('calls onBack when "Back to Library" is clicked', async () => {
    const onBack = vi.fn();
    render(<Podium leaderboard={leaderboard} onPlayAgain={vi.fn()} onBack={onBack} />);
    await userEvent.click(screen.getByText('Back to Library'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders gracefully with only 1 player', () => {
    const solo = [leaderboard[0]!];
    render(<Podium leaderboard={solo} onPlayAgain={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('🥇')).toBeDefined();
  });
});
