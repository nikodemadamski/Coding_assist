// Unit tests for the interview-readiness score (src/state/readiness.js)
// and the solve-timing fields feeding it.
import {
  readiness,
  trackFitness,
  paceByDifficulty,
  medianMs,
  PACE_TARGETS_MS,
  PACE_MIN_SAMPLES,
  MOCK_FULL_CREDIT,
  WEIGHTS,
  BIGO_MIN_SAMPLES,
  BIGO_WEIGHT,
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

  // **Speed you have never demonstrated is not speed.** Pace used to average
  // only the difficulties that had enough timed solves, so three quick easy
  // solves in a bank containing medium and hard scored 100% — printed right
  // beside the words "hard: no timed solves".
  {
    const mixed = [
      q('e1'), q('e2'), q('e3'),
      q('m1', 'medium'), q('m2', 'medium'), q('m3', 'medium'),
      q('h1', 'hard'), q('h2', 'hard'), q('h3', 'hard'),
    ];
    const easyOnly = fresh();
    for (const id of ['e1', 'e2', 'e3']) easyOnly.solved[id] = solvedEntry(min(1));
    const r1 = readiness(easyOnly, mixed);
    check(`fast on easy alone does not score full pace (got ${r1.parts.pace.toFixed(2)})`,
      r1.parts.pace === 1 / 3);
    check('and it reports which difficulties are untimed',
      r1.paceCoverage.measured === 1 && r1.paceCoverage.of === 3 &&
      r1.paceCoverage.untimed.join(',') === 'medium,hard');

    const allTimed = fresh();
    for (const id of ['e1', 'e2', 'e3']) allTimed.solved[id] = solvedEntry(min(1));
    for (const id of ['m1', 'm2', 'm3']) allTimed.solved[id] = solvedEntry(min(1));
    for (const id of ['h1', 'h2', 'h3']) allTimed.solved[id] = solvedEntry(min(1));
    const r2 = readiness(allTimed, mixed);
    check('timing all three difficulties can still reach full pace', r2.parts.pace === 1);
    check('  and nothing is reported untimed', r2.paceCoverage.untimed.length === 0);

    // The advice has to name the actual fix. "Go faster" is wrong when the
    // problem is that you have never been measured.
    const paceWeak = fresh();
    for (const id of ['e1', 'e2', 'e3']) paceWeak.solved[id] = solvedEntry(min(1));
    const adv = readiness(paceWeak, mixed);
    if (adv.weakest === 'pace') {
      check('untimed-pace advice says to get measured, not to hurry',
        adv.advice.includes('medium and hard') && !adv.advice.includes('race the target'));
    }
  }

  // A bank with no hard questions must not be capped for lacking them.
  {
    const noHard = [q('a'), q('b'), q('c'), q('d', 'medium'), q('e', 'medium'), q('f', 'medium')];
    const p2 = fresh();
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) p2.solved[id] = solvedEntry(min(1));
    check('a bank without hard questions can still reach full pace',
      readiness(p2, noHard).parts.pace === 1);
  }

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

console.log('readiness-tests: Big-O fluency dimension (sample-gated)');
{
  const qs = [q('a'), q('b')];
  // no answers at all: no bigo part, base weights untouched
  const none = readiness(fresh(), qs);
  check('no answers -> no bigo part shown', !('bigo' in none.parts));
  check('no answers -> inactive', none.bigo.active === false && none.bigo.answered === 0);

  // a few answers: visible but NOT in the score yet
  const few = fresh();
  few.bigo = { right: 2, wrong: 2 };
  const f = readiness(few, qs);
  check('under the sample floor -> part visible', f.parts.bigo === 0.5);
  check('under the sample floor -> still inactive', f.bigo.active === false);
  check('a 50% bigo below the floor does not move the score', f.score === readiness(fresh(), qs).score);

  // at the floor: joins the score at its weight
  const active = fresh();
  active.bigo = { right: BIGO_MIN_SAMPLES, wrong: 0 };
  const a = readiness(active, qs);
  check('at the floor -> active', a.bigo.active === true);
  check(
    `perfect bigo adds its ${BIGO_WEIGHT * 100}% (score ${a.score})`,
    a.score === Math.round(100 * BIGO_WEIGHT)
  );

  // a bad record can now be the named weakest dimension
  const qs3 = [q('a'), q('b'), q('c')];
  const bad = fresh();
  bad.bigo = { right: 0, wrong: BIGO_MIN_SAMPLES };
  for (const id of ['a', 'b', 'c']) {
    bad.solved[id] = solvedEntry(min(5));
    bad.srs[id] = { stage: 4, nextDue: addDays(todayStr(), 30) };
  }
  bad.mock = Array.from({ length: MOCK_FULL_CREDIT }, () => ({ passed: true, timeMs: min(10) }));
  const b = readiness(bad, qs3);
  check('an 0% bigo record becomes the weakest dimension', b.weakest === 'bigo');
  check('advice targets complexity fluency', b.advice.toLowerCase().includes('complexity'));
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

// ---- per-track fitness ----
{
  console.log('trackFitness:');
  const bank = [
    { ...q('p1'), track: 'python' },
    { ...q('p2'), track: 'python' },
    { ...q('d1'), track: 'pandas' },
    { ...q('d2'), track: 'pandas' },
    { ...q('s1'), track: 'sql' },
    { ...q('s2'), track: 'sql' },
  ];

  const empty = trackFitness(fresh(), bank);
  check('three tracks always reported', empty.tracks.length === 3);
  check('nothing solved -> all zero', empty.tracks.every((t) => t.score === 0));
  check('nothing solved -> no weakest callout', empty.weakest === null);

  // Solve both python questions, one pandas, zero SQL.
  let p = fresh();
  p = recordSolve(p, 'p1', new Date());
  p = recordSolve(p, 'p2', new Date());
  p = recordSolve(p, 'd1', new Date());
  const fit = trackFitness(p, bank);
  const by = Object.fromEntries(fit.tracks.map((t) => [t.track, t]));
  check('python coverage full', by.python.coverage === 1 && by.python.solved === 2);
  check('pandas coverage half', by.pandas.coverage === 0.5);
  check('sql untouched', by.sql.score === 0 && by.sql.solved === 0);
  check('weakest is the empty track', fit.weakest === 'sql');
  check('scores order matches effort', by.python.score > by.pandas.score && by.pandas.score > by.sql.score);
  check('totals count per track', by.python.total === 2 && by.sql.total === 2);
}

if (failures) {
  console.error(`readiness-tests: ${failures} failure(s)`);
  process.exit(1);
}
console.log('readiness-tests: all passed');
