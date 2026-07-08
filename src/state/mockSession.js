// Mock interview logic: pure functions over the question bank + progress.
// A mock is ONE python problem, timed, with hints and the solution locked
// away until the debrief — the closest this app gets to the real thing.
import { isSolved, shuffle } from './progress.js';

export const MOCK_FORMATS = [
  {
    key: 'warm',
    label: 'Warm-up round',
    difficulty: 'easy',
    minutes: 20,
    blurb: 'One easy problem, 20 minutes. Rehearse the ritual: clarify, plan, code, test.',
  },
  {
    key: 'standard',
    label: 'Standard round',
    difficulty: 'medium',
    minutes: 35,
    blurb: 'One medium problem, 35 minutes — the typical phone-screen / onsite question.',
  },
  {
    key: 'onsite',
    label: 'Onsite round',
    difficulty: 'hard',
    minutes: 45,
    blurb: 'One hard problem, 45 minutes. The pressure round the loop turns on.',
  },
  {
    key: 'surprise',
    label: 'Surprise',
    difficulty: null,
    minutes: 35,
    blurb: "Random difficulty, 35 minutes — you don't get to pick in real life.",
  },
];

export function formatByKey(key) {
  return MOCK_FORMATS.find((f) => f.key === key) || null;
}

// Choose the problem for a mock. Interviews are algorithmic, so we draw from
// the python track only. Prefer problems you HAVEN'T solved (a mock you've
// already seen the answer to isn't a real test); fall back to the whole pool
// once you've solved everything at that difficulty.
export function pickMockProblem(questions, progress, format, seed = (Math.random() * 2 ** 32) >>> 0) {
  const pool = questions.filter(
    (q) => q.track === 'python' && (!format.difficulty || q.difficulty === format.difficulty)
  );
  if (pool.length === 0) return null;
  const unsolved = pool.filter((q) => !isSolved(progress.solved[q.id]));
  const candidates = unsolved.length ? unsolved : pool;
  return shuffle(candidates.map((q) => q.id), seed)[0];
}

// The optimal approach's complexity string, for the debrief comparison.
export function optimalComplexity(question) {
  if (question.approaches?.length) {
    return question.approaches[question.approaches.length - 1].complexity || '';
  }
  return question.complexity || '';
}

export function summarizeMocks(history = []) {
  const count = history.length;
  const passed = history.filter((m) => m.passed).length;
  const timed = history.filter((m) => typeof m.timeMs === 'number' && m.timeMs > 0);
  const avgTimeMs = timed.length
    ? Math.round(timed.reduce((s, m) => s + m.timeMs, 0) / timed.length)
    : 0;
  const clean = history.filter((m) => m.passed && !m.ranOutOfTime).length;
  return {
    count,
    passed,
    passRate: count ? passed / count : 0,
    avgTimeMs,
    cleanPasses: clean, // passed AND beat the clock — an interview-grade result
  };
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
