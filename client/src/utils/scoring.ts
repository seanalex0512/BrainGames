/**
 * Scoring logic from README:
 *   points = isCorrect ? Math.round(basePoints * (timeRemaining / timeLimit)) : 0
 *   streak >= 5 → 1.5x, streak >= 3 → 1.2x, else 1.0x
 *   finalPoints = Math.round(points * streakMultiplier)
 */

export function streakMultiplier(streak: number): number {
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

export function calculatePoints(
  basePoints: number,
  timeLimit: number,
  timeRemaining: number,
  isCorrect: boolean,
  streak: number
): number {
  if (!isCorrect) return 0;
  const speedPoints = Math.round(basePoints * (timeRemaining / timeLimit));
  return Math.round(speedPoints * streakMultiplier(streak));
}
