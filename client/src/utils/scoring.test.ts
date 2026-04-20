import { describe, it, expect } from 'vitest';
import { calculatePoints, streakMultiplier } from './scoring';

describe('streakMultiplier', () => {
  it('returns 1.0 for streak < 3', () => {
    expect(streakMultiplier(0)).toBe(1.0);
    expect(streakMultiplier(1)).toBe(1.0);
    expect(streakMultiplier(2)).toBe(1.0);
  });

  it('returns 1.2 for streak 3 or 4', () => {
    expect(streakMultiplier(3)).toBe(1.2);
    expect(streakMultiplier(4)).toBe(1.2);
  });

  it('returns 1.5 for streak >= 5', () => {
    expect(streakMultiplier(5)).toBe(1.5);
    expect(streakMultiplier(10)).toBe(1.5);
  });
});

describe('calculatePoints', () => {
  it('returns 0 for incorrect answer', () => {
    expect(calculatePoints(1000, 20, 15, false, 0)).toBe(0);
  });

  it('returns max points for instant correct answer', () => {
    expect(calculatePoints(1000, 20, 20, true, 0)).toBe(1000);
  });

  it('returns half points at half time remaining', () => {
    expect(calculatePoints(1000, 20, 10, true, 0)).toBe(500);
  });

  it('applies streak multiplier', () => {
    // streak 3 → 1.2x, half time → 500 → 600
    expect(calculatePoints(1000, 20, 10, true, 3)).toBe(600);
    // streak 5 → 1.5x, half time → 500 → 750
    expect(calculatePoints(1000, 20, 10, true, 5)).toBe(750);
  });

  it('returns 0 when time expired (timeRemaining = 0)', () => {
    expect(calculatePoints(1000, 20, 0, true, 0)).toBe(0);
  });

  it('rounds to integer', () => {
    const result = calculatePoints(1000, 30, 7, true, 0);
    expect(Number.isInteger(result)).toBe(true);
  });
});
