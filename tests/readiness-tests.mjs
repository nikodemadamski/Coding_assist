// Unit tests for the interview-readiness score (src/state/readiness.js)
// and the solve-timing fields feeding it.
import {
  readiness,
  paceByDifficulty,
  medianMs,
  PACE_TARGETS_MS,
  PACE_MIN_SAMPLES,
  MOCK_FULL_CREDIT,
  WEIGHTS,
} from '../src/state/readiness.js';
import { recordSolve, recordFail, todayStr, addDays } from '../src/state/progress.js';
import { EMPTY_PROGRESS } from '../src/state/storage.js';

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.error(`  FAIL - ${name}`);
  }
}

const min = (n) => n * 60000;
const q = (id, difficulty = 'easy') => ({ id, title: id, difficulty });
const solvedEntry = (ms) => ({ firstSolvedAt: 'x', attempts: 1, solves: 1, firstSolveMs: ms });
const fresh = () => structuredClone(EMPTY_PROGRESS);

console.log('readiness-tests: medianMs');
check('empty -> null', medianMs([]) === null);
check('odd count -> middle', medianMs([5, 1, 9]) === 5);
check('even count -> mean of middles', medianMs([2, 4, 10, 100]) === 7);

console.log('readiness-tests: pace');
{
  const qs = [q('a'), q('b'), q('c'), q('d', 'medium')];
  const p = fresh();
  p.solved = { a: solvedEntry(min(10)), b: solvedEntry(min(20)), c: solvedEntry(min(12)) };
  const pace = paceByDifficulty(p, qs);
  check('median over easy solves', pace.easy.median === min(12));
  check('ratio 1 when at/under target', pace.easy.ratio === 1);
  check('untimed difficulty -> null median', pace.medium.median === null && pace.medium.n === 0);
  p.solved = { a: solvedEntry(min(30)), b: solvedEntry(min(30)), c: solvedEntry(min(30)) };
  const slow = paceByDifficulty(p, qs);
  check('overshooting the target shrinks the ratio', slow.easy.ratio === PACE_TARGETS_MS.easy / min(30));
}

console.log('readiness-tests: score');
{
  const qs = [q('a'), q('b'), q('c'), q('d')];
  check('empty progress -> score 0', readiness(fresh(), qs).score === 0);

  // Everything maxed: all solved & mastered, 5 passed mocks, pace on target.
  const today = todayStr();
  const p = fresh();
  for (const id of ['a', 'b', 'c', 'd']) {
    p.solved[id] = solvedEntry(min(10));
    p.srs[id] = { stage: 4, nextDue: addDays(today, 30) };
  }
  p.mock = Array.from({ length: MOCK_FULL_CREDIT }, () => ({ passed: true, timeMs: min(20) }));
  const full = readiness(p, qs);
  check(`all dimensions maxed -> 100 (got ${full.score})`, full.score === 100);
  check('level says ready', full.level.toLowerCase().includes('ready'));

  // Pace needs PACE_MIN_SAMPLES timed solves before it counts at all.
  const few = fresh();
  few.solved = { a: solvedEntry(min(5)) };
  const r = readiness(few, qs);
  check('too few timed solves -> pace part stays 0', r.parts.pace === 0);
  check(`${PACE_MIN_SAMPLES} timed solves unlock pace`, (() => {
    const enough = fresh();
    enough.solved = { a: solvedEntry(min(5)), b: solvedEntry(min(5)), c: solvedEntry(min(5)) };
    return readiness(enough, qs).parts.pace === 1;
  })());

  // One passed mock is heavily discounted vs five.
  const one = fresh();
  one.mock = [{ passed: true, timeMs: min(20) }];
  check('a single passed mock earns only partial credit', readiness(one, qs).parts.mocks === 1 / MOCK_FULL_CREDIT);

  // Advice targets the weakest dimension (relative to its weight).
  check('advice names the biggest gap', typeof full.advice === 'string' && full.advice.length > 10);
  const noMocks = readiness(
    (() => {
      const x = fresh();
      for (const id of ['a', 'b', 'c', 'd']) {
        x.solved[id] = solvedEntry(min(5));
        x.srs[id] = { stage: 4, nextDue: addDays(today, 30) };
      }
      return x;
    })(),
    qs
  );
  check('with everything strong but mocks, advice says run mocks', noMocks.weakest === 'mocks');

  // Weights sum to 1 so the score is a true 0-100.
  check('weights sum to 1', Math.abs(Object.values(WEIGHTS).reduce((a, b) => a + b, 0) - 1) < 1e-9);
}

console.log('readiness-tests: recordSolve timing + preserved history');
{
  const p = fresh();
  const failedFirst = recordFail(p, 'a');
  const thenSolved = recordSolve(failedFirst, 'a', new Date(), { timeMs: min(7) });
  check('mistakes survive a later solve', thenSolved.solved.a.mistakes === 1);
  check('firstSolvedAt backfills after a fail-first history', !!thenSolved.solved.a.firstSolvedAt);
  check('first solve records firstSolveMs', thenSolved.solved.a.firstSolveMs === min(7));
  const resolved = recordSolve(thenSolved, 'a', new Date(), { timeMs: min(1) });
  check('re-solves never overwrite the first-solve time', resolved.solved.a.firstSolveMs === min(7));
  const untimed = recordSolve(fresh(), 'b');
  check('untimed solves store no firstSolveMs', !('firstSolveMs' in untimed.solved.b));
}

if (failures) {
  console.error(`readiness-tests: ${failures} failure(s)`);
  process.exit(1);
}
console.log('readiness-tests: all passed');
