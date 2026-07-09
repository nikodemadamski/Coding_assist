import { beltFor } from './progress.js';

// Milestone detection for the celebration overlay. Pure so it's easy to test:
// given the previous and current { solvedCount, streak }, decide whether a
// moment worth celebrating just happened — a belt promotion (highest priority)
// or a streak milestone.

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 75, 100, 150, 200, 250, 300, 365];

export function nextCelebration(prev, next) {
  if (!prev) return null; // first render — nothing to compare against yet

  if (next.solvedCount > prev.solvedCount) {
    const before = beltFor(prev.solvedCount);
    const after = beltFor(next.solvedCount);
    if (after.name !== before.name) {
      return { type: 'belt', belt: after, solvedCount: next.solvedCount };
    }
  }

  if (next.streak > prev.streak && STREAK_MILESTONES.includes(next.streak)) {
    return { type: 'streak', streak: next.streak };
  }

  return null;
}
