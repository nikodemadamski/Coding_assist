// Mock-interview logic: problem selection respects difficulty + track + the
// "prefer unseen" rule, and the summary math is right.
import {
  MOCK_FORMATS,
  formatByKey,
  pickMockProblem,
  optimalComplexity,
  summarizeMocks,
  formatDuration,
} from '../src/state/mockSession.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';
import { EMPTY_PROGRESS } from '../src/state/storage.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Mock interview tests\n');

const byId = Object.fromEntries(SEED_QUESTIONS.map((q) => [q.id, q]));
const fresh = () => structuredClone(EMPTY_PROGRESS);

// ---- formats ----
check(MOCK_FORMATS.length >= 3, 'at least three interview formats');
check(formatByKey('standard')?.minutes === 35, 'standard round is 35 minutes');
check(formatByKey('nope') === null, 'unknown format key returns null');

// ---- problem selection respects difficulty + python-only ----
for (const fmt of MOCK_FORMATS.filter((f) => f.difficulty)) {
  let ok = true;
  for (let seed = 1; seed <= 40; seed++) {
    const id = pickMockProblem(SEED_QUESTIONS, fresh(), fmt, seed);
    const q = byId[id];
    if (!q || q.track !== 'python' || q.difficulty !== fmt.difficulty) {
      ok = false;
      break;
    }
  }
  check(ok, `${fmt.key}: always picks a python ${fmt.difficulty} problem`);
}

// surprise draws any difficulty but still python
{
  const diffs = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const q = byId[pickMockProblem(SEED_QUESTIONS, fresh(), formatByKey('surprise'), seed)];
    check(q && q.track === 'python', `surprise seed ${seed} is python`, q?.title);
    diffs.add(q?.difficulty);
    if (diffs.size >= 2) break;
  }
  check(diffs.size >= 2, 'surprise spans more than one difficulty over many seeds');
}

// ---- prefers problems you haven't solved ----
{
  const std = formatByKey('standard');
  const mediumPy = SEED_QUESTIONS.filter((q) => q.track === 'python' && q.difficulty === 'medium');
  // Solve all but one medium python problem; the mock must pick the leftover.
  const p = fresh();
  const target = mediumPy[0];
  for (const q of mediumPy) {
    if (q.id === target.id) continue;
    p.solved[q.id] = { firstSolvedAt: '2020-01-01', attempts: 1, solves: 1 };
  }
  let alwaysTarget = true;
  for (let seed = 1; seed <= 25; seed++) {
    if (pickMockProblem(SEED_QUESTIONS, p, std, seed) !== target.id) {
      alwaysTarget = false;
      break;
    }
  }
  check(alwaysTarget, 'picks the one unsolved problem when the rest are solved');

  // If ALL are solved, it still returns something (falls back to the full pool).
  const allSolved = fresh();
  for (const q of mediumPy) allSolved.solved[q.id] = { firstSolvedAt: '2020-01-01', attempts: 1, solves: 1 };
  const still = pickMockProblem(SEED_QUESTIONS, allSolved, std, 7);
  check(!!byId[still] && byId[still].difficulty === 'medium', 'falls back to the pool once all are solved');
}

// ---- optimal complexity comes from the last (optimal) approach ----
{
  const twoSum = byId['py-two-sum'];
  check(!!optimalComplexity(twoSum), 'two-sum exposes an optimal complexity string', optimalComplexity(twoSum));
  const last = twoSum.approaches[twoSum.approaches.length - 1];
  check(optimalComplexity(twoSum) === last.complexity, 'optimalComplexity uses the final approach');
}

// ---- summary math ----
{
  const hist = [
    { passed: true, ranOutOfTime: false, timeMs: 600000 },
    { passed: true, ranOutOfTime: true, timeMs: 2100000 },
    { passed: false, ranOutOfTime: true, timeMs: 2100000 },
  ];
  const s = summarizeMocks(hist);
  check(s.count === 3, 'counts all mocks');
  check(s.passed === 2, 'counts passes');
  check(Math.abs(s.passRate - 2 / 3) < 1e-9, 'pass rate is passes / count');
  check(s.cleanPasses === 1, 'clean passes = passed AND in time');
  check(s.avgTimeMs === Math.round((600000 + 2100000 + 2100000) / 3), 'avg time over all timed mocks');
  const empty = summarizeMocks([]);
  check(empty.count === 0 && empty.passRate === 0 && empty.avgTimeMs === 0, 'empty history is all zeros');
}

// ---- duration formatting ----
check(formatDuration(0) === '0:00', 'formats zero');
check(formatDuration(65000) === '1:05', 'formats 1:05');
check(formatDuration(2100000) === '35:00', 'formats 35:00');

console.log(failures === 0 ? '\nAll mock tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
