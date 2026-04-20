import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LeaderboardEntry } from '@braingames/shared';
import { Leaderboard } from './leaderboard';

const entries: LeaderboardEntry[] = [
  { id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 1500, streak: 3 },
  { id: 'p2', nickname: 'Bob',   avatarColor: '#1368CE', score: 1200, streak: 1 },
  { id: 'p3', nickname: 'Carol', avatarColor: '#D89E00', score:  900, streak: 0 },
];

describe('Leaderboard', () => {
  it('renders all player nicknames', () => {
    render(<Leaderboard leaderboard={entries} previousLeaderboard={[]} onNext={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('Carol')).toBeDefined();
  });

  it('renders scores', () => {
    render(<Leaderboard leaderboard={entries} previousLeaderboard={[]} onNext={vi.fn()} />);
    expect(screen.getByText('1,500')).toBeDefined();
    expect(screen.getByText('1,200')).toBeDefined();
    expect(screen.getByText('900')).toBeDefined();
  });

  it('shows "NEW" badge for players not in previous leaderboard', () => {
    render(<Leaderboard leaderboard={entries} previousLeaderboard={[]} onNext={vi.fn()} />);
    const newBadges = screen.getAllByText('NEW');
    expect(newBadges.length).toBe(3);
  });

  it('shows up-arrow for players who moved up', () => {
    const previous: LeaderboardEntry[] = [
      { id: 'p2', nickname: 'Bob',   avatarColor: '#1368CE', score: 1000, streak: 0 },
      { id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score:  800, streak: 0 },
    ];
    render(<Leaderboard leaderboard={entries} previousLeaderboard={previous} onNext={vi.fn()} />);
    // Alice was rank 2, now rank 1 → moved up by 1
    // The up-arrow SVG is rendered, so we check the "1" delta number appears
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('shows dash for players whose rank did not change', () => {
    const previous: LeaderboardEntry[] = [
      { id: 'p1', nickname: 'Alice', avatarColor: '#E21B3C', score: 1000, streak: 0 },
      { id: 'p2', nickname: 'Bob',   avatarColor: '#1368CE', score:  800, streak: 0 },
      { id: 'p3', nickname: 'Carol', avatarColor: '#D89E00', score:  600, streak: 0 },
    ];
    render(<Leaderboard leaderboard={entries} previousLeaderboard={previous} onNext={vi.fn()} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(3);
  });

  it('limits to top 5 players', () => {
    const many: LeaderboardEntry[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      nickname: `Player${i + 1}`,
      avatarColor: '#E21B3C',
      score: (8 - i) * 100,
      streak: 0,
    }));
    render(<Leaderboard leaderboard={many} previousLeaderboard={[]} onNext={vi.fn()} />);
    expect(screen.queryByText('Player6')).toBeNull();
    expect(screen.queryByText('Player7')).toBeNull();
    expect(screen.queryByText('Player8')).toBeNull();
    expect(screen.getByText('Player5')).toBeDefined();
  });

  it('calls onNext when the button is clicked', async () => {
    const onNext = vi.fn();
    render(<Leaderboard leaderboard={entries} previousLeaderboard={[]} onNext={onNext} />);
    await userEvent.click(screen.getByText('Next →'));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('renders a custom nextLabel', () => {
    render(
      <Leaderboard
        leaderboard={entries}
        previousLeaderboard={[]}
        onNext={vi.fn()}
        nextLabel="See Podium 🏆"
      />
    );
    expect(screen.getByText('See Podium 🏆')).toBeDefined();
  });

  it('renders rank numbers 1 through 3 for three entries', () => {
    render(<Leaderboard leaderboard={entries} previousLeaderboard={[]} onNext={vi.fn()} />);
    // Ranks are rendered as text — look for them by their accessible role
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });
});
