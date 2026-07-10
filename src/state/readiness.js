// "Am I ready?" — one honest number built from four things an interviewer
// actually tests: how much of the path you've covered, how deeply you know it,
// how you perform under mock-interview pressure, and how fast you solve cold.
// Pure functions over Progress; no storage access.

import { isSolved, masteryLevel } from './progress.js';
import { summarizeMocks } from './mockSession.js';

// First-solve pace targets per difficulty — roughly what a strong candidate
// needs in a 45-minute interview with talking time included.
export const PACE_TARGETS_MS = {
  easy: 15 * 60000,
  medium: 25 * 60000,
  hard: 40 * 60000,
};

// How many timed solves of a difficulty before its pace counts.
export const PACE_MIN_SAMPLES = 3;
// Full mock credit needs this many interviews — one lucky pass proves little.
export const MOCK_FULL_CREDIT = 5;

export const WEIGHTS = { coverage: 0.3, mastery: 0.25, mocks: 0.25, pace: 0.2 };

export function medianMs(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// Per-difficulty first-solve pace: { median, target, n, ratio } — ratio is the
// 0..1 credit (1 = at/under target, shrinking as you overshoot).
export function paceByDifficulty(progress, questions) {
  const out = {};
  for (const diff of Object.keys(PACE_TARGETS_MS)) {
    const times = questions
      .filter((q) => q.difficulty === diff)
      .map((q) => progress.solved[q.id]?.firstSolveMs)
      .filter((t) => Number.isFinite(t));
    const median = medianMs(times);
    out[diff] = {
      n: times.length,
      median,
      target: PACE_TARGETS_MS[diff],
      ratio: median === null ? null : Math.min(1, PACE_TARGETS_MS[diff] / median),
    };
  }
  return out;
}

const LEVELS = [
  [85, 'Ready — go book it'],
  [70, 'Nearly there'],
  [50, 'Getting dangerous'],
  [25, 'Building foundations'],
  [0, 'Just starting'],
];

const ADVICE = {
  coverage: 'Biggest gap: coverage. Keep walking the path — every new pattern is free points.',
  mastery: 'Biggest gap: retention. Clear your reviews daily so solved problems become owned problems.',
  mocks: 'Biggest gap: pressure. Run mock interviews — the timer changes everything, practice under it.',
  pace: 'Biggest gap: speed. Re-solve problems you know and race the target time, not just correctness.',
};

export function readiness(progress, questions) {
  const total = Math.max(1, questions.length);
  const solvedCount = questions.filter((q) => isSolved(progress.solved[q.id])).length;

  let mastered = 0;
  let reviewing = 0;
  for (const q of questions) {
    const lvl = masteryLevel(progress, q.id);
    if (lvl === 'mastered') mastered++;
    else if (lvl === 'reviewing') reviewing++;
  }

  const mockStats = summarizeMocks(progress.mock || []);
  const pace = paceByDifficulty(progress, questions);
  const paceRatios = Object.values(pace)
    .filter((p) => p.n >= PACE_MIN_SAMPLES)
    .map((p) => p.ratio);

  const parts = {
    coverage: solvedCount / total,
    mastery: (mastered + 0.5 * reviewing) / total,
    mocks: mockStats.count
      ? mockStats.passRate * Math.min(1, mockStats.count / MOCK_FULL_CREDIT)
      : 0,
    pace: paceRatios.length ? paceRatios.reduce((a, b) => a + b, 0) / paceRatios.length : 0,
  };

  const score = Math.round(
    100 *
      Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * parts[k], 0)
  );

  const weakest = Object.keys(parts).reduce((a, b) =>
    parts[b] / WEIGHTS[b] < parts[a] / WEIGHTS[a] ? b : a
  );

  return {
    score,
    level: LEVELS.find(([min]) => score >= min)[1],
    parts,
    pace,
    advice: ADVICE[weakest],
    weakest,
  };
}
