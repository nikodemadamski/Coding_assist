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
  // When the pace score is held down by difficulties you have never timed, the
  // fix is not "go faster" — it is "go and be measured at all".
  paceUntimed:
    'Biggest gap: speed — and it is untested. Time yourself on {LIST} before this number can mean anything.',
  bigo: 'Biggest gap: complexity fluency. Answer the after-solve Big-O check every time — say the bound before you peek.',
};

// The Big-O check-in joins the score only once there's a real sample — a
// couple of lucky taps shouldn't move an interview-readiness number.
export const BIGO_MIN_SAMPLES = 15;
export const BIGO_WEIGHT = 0.1;

// Per-track fitness: how covered and how deeply owned each track is, so a
// python-strong / SQL-weak learner can SEE the gap. Fitness blends coverage
// (60%) with mastery (40%); mocks, pace and Big-O are cross-track skills and
// stay out of the slice. Returns { tracks: [{track, total, solved, coverage,
// mastery, score}], weakest } — weakest is null until something is solved.
export const FITNESS_TRACKS = ['python', 'pandas', 'sql'];

export function trackFitness(progress, questions) {
  const tracks = FITNESS_TRACKS.map((track) => {
    const qs = questions.filter((q) => q.track === track);
    const total = Math.max(1, qs.length);
    const solved = qs.filter((q) => isSolved(progress.solved[q.id])).length;
    let mastered = 0;
    let reviewing = 0;
    for (const q of qs) {
      const lvl = masteryLevel(progress, q.id);
      if (lvl === 'mastered') mastered++;
      else if (lvl === 'reviewing') reviewing++;
    }
    const coverage = solved / total;
    const mastery = (mastered + 0.5 * reviewing) / total;
    return {
      track,
      total: qs.length,
      solved,
      coverage,
      mastery,
      score: Math.round(100 * (0.6 * coverage + 0.4 * mastery)),
    };
  });
  const anySolved = tracks.some((t) => t.solved > 0);
  const weakest = anySolved
    ? tracks.reduce((a, b) => (b.score < a.score ? b : a)).track
    : null;
  return { tracks, weakest };
}

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
  // **A difficulty you have never timed counts as unproven, not as absent.**
  // This used to average only the difficulties that had enough samples, so
  // three quick easy solves and no hard ones scored pace at 100% — printed
  // directly beside the words "hard: no timed solves". Readiness is a claim
  // about an interview, and speed you have not demonstrated at a difficulty is
  // not speed. The divisor is the difficulties the bank actually CONTAINS —
  // you cannot be asked to time a hard solve in a set with no hard questions.
  const paceDifficulties = Object.keys(PACE_TARGETS_MS).filter((d) =>
    questions.some((q) => q.difficulty === d)
  );
  const measuredPace = paceDifficulties.filter((d) => pace[d].n >= PACE_MIN_SAMPLES);
  const paceRatios = measuredPace.map((d) => pace[d].ratio);

  const bigoRight = progress.bigo?.right || 0;
  const bigoAnswered = bigoRight + (progress.bigo?.wrong || 0);
  const bigoActive = bigoAnswered >= BIGO_MIN_SAMPLES;

  const parts = {
    coverage: solvedCount / total,
    mastery: (mastered + 0.5 * reviewing) / total,
    mocks: mockStats.count
      ? mockStats.passRate * Math.min(1, mockStats.count / MOCK_FULL_CREDIT)
      : 0,
    pace: paceDifficulties.length
      ? paceRatios.reduce((a, b) => a + b, 0) / paceDifficulties.length
      : 0,
  };
  if (bigoAnswered > 0) parts.bigo = bigoRight / bigoAnswered;

  // Effective weights: once the Big-O sample is big enough it takes its 10%
  // and the base four scale down to make room; before that they are the score.
  const effWeights = bigoActive
    ? {
        ...Object.fromEntries(
          Object.entries(WEIGHTS).map(([k, w]) => [k, w * (1 - BIGO_WEIGHT)])
        ),
        bigo: BIGO_WEIGHT,
      }
    : WEIGHTS;

  const score = Math.round(
    100 *
      Object.entries(effWeights).reduce((sum, [k, w]) => sum + w * parts[k], 0)
  );

  const weakest = Object.keys(effWeights).reduce((a, b) =>
    parts[b] / effWeights[b] < parts[a] / effWeights[a] ? b : a
  );

  return {
    score,
    level: LEVELS.find(([min]) => score >= min)[1],
    parts,
    pace,
    // Which difficulties actually back the pace number, so the UI can say the
    // dimension is capped by missing evidence rather than by being slow.
    paceCoverage: {
      measured: measuredPace.length,
      of: paceDifficulties.length,
      untimed: paceDifficulties.filter((d) => pace[d].n < PACE_MIN_SAMPLES),
    },
    bigo: { answered: bigoAnswered, active: bigoActive, needed: BIGO_MIN_SAMPLES },
    advice:
      weakest === 'pace' && measuredPace.length < paceDifficulties.length
        ? ADVICE.paceUntimed.replace(
            '{LIST}',
            paceDifficulties.filter((d) => pace[d].n < PACE_MIN_SAMPLES).join(' and ')
          )
        : ADVICE[weakest],
    weakest,
  };
}
