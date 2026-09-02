// Rehearsal: everything you have already solved, in random order, on a loop.
// The promise is "it won't reset until all are done", so the two things worth
// proving are that a round covers EVERY solved question exactly once, and that
// the bag survives being put down and picked up again.
import {
  rehearsalPool, startRound, ensureRound, currentRehearsalId,
  passRehearsal, requeueRehearsal, rehearsalStatus,
} from '../src/state/rehearsal.js';
import { EMPTY_PROGRESS, sanitizeProgress } from '../src/state/storage.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

const QS = Array.from({ length: 8 }, (_, i) => ({ id: `q${i}` }));
const solvedRecord = (ids) => ({
  ...structuredClone(EMPTY_PROGRESS),
  solved: Object.fromEntries(ids.map((id) => [id, { solves: 1 }])),
});

console.log('\nRehearsal: the pool');
{
  const p = solvedRecord(['q0', 'q2', 'q5']);
  check(rehearsalPool(p, QS).sort().join(',') === 'q0,q2,q5', 'only questions you have solved');
  // A failed-but-never-solved question has an entry with solves: 0.
  const withFail = { ...p, solved: { ...p.solved, q7: { solves: 0, mistakes: 3 } } };
  check(!rehearsalPool(withFail, QS).includes('q7'), 'an attempted-but-unsolved question is not in it');
  // Skipping is a claim, not a demonstration.
  const withSkip = { ...p, skipped: { q6: true } };
  check(!rehearsalPool(withSkip, QS).includes('q6'), 'a skipped question is not in it');
  check(rehearsalPool(solvedRecord([]), QS).length === 0, 'nothing solved means an empty pool');
  check(rehearsalStatus(solvedRecord([]), QS).ready === false, 'and the mode reports itself unavailable');
}

console.log('\nA round covers everything, exactly once');
{
  const ids = ['q0', 'q1', 'q2', 'q3', 'q4'];
  let p = startRound(solvedRecord(ids), QS, { seed: 12345 });
  const seen = [];
  for (let i = 0; i < ids.length; i++) {
    const id = currentRehearsalId(p, QS);
    seen.push(id);
    p = passRehearsal(p, QS, { seed: 999 });
  }
  check(seen.length === 5 && new Set(seen).size === 5, 'every question appears exactly once in a round');
  check(seen.sort().join(',') === ids.join(','), '  and the round is the whole solved set');
}

console.log('\nRandom, but not random-with-replacement');
{
  const ids = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'];
  const orderFor = (seed) => {
    let p = startRound(solvedRecord(ids), QS, { seed });
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      out.push(currentRehearsalId(p, QS));
      p = passRehearsal(p, QS, { seed: seed + 1 });
    }
    return out.join(',');
  };
  check(orderFor(1) !== orderFor(2), 'different seeds give different orders');
  check(orderFor(7) === orderFor(7), 'the same seed is reproducible');
}

console.log('\nIt loops, and it does not reset early');
{
  const ids = ['q0', 'q1', 'q2'];
  let p = startRound(solvedRecord(ids), QS, { seed: 5 });
  check(rehearsalStatus(p, QS).round === 1, 'the first round is round 1');
  p = passRehearsal(p, QS, { seed: 6 });
  const mid = rehearsalStatus(p, QS);
  check(mid.done === 1 && mid.left === 2, 'progress through the round is reported');
  check(mid.inProgress === true, '  and a part-finished round says so');

  p = passRehearsal(p, QS, { seed: 6 });
  p = passRehearsal(p, QS, { seed: 6 }); // clears the last one
  const after = rehearsalStatus(p, QS);
  check(after.round === 2, 'finishing a round starts the next one automatically');
  check(after.left === 3, '  with the full set back in the bag');
}

console.log('\nFailing does not get you out of a question');
{
  const ids = ['q0', 'q1', 'q2'];
  let p = startRound(solvedRecord(ids), QS, { seed: 3 });
  const first = currentRehearsalId(p, QS);
  p = requeueRehearsal(p, QS);
  check(currentRehearsalId(p, QS) !== first, 'a failed question yields to the next one');
  check(rehearsalStatus(p, QS).left === 3, '  but stays in the round — the count does not drop');
  // A requeued question goes to the BACK, so it is served last — but it is
  // still served: you cannot end a round by failing your way out of one.
  const order = [];
  for (let i = 0; i < 3; i++) {
    order.push(currentRehearsalId(p, QS));
    p = passRehearsal(p, QS, { seed: 4 });
  }
  check(order[order.length - 1] === first, 'a requeued question comes back at the end of the round');
  check(new Set(order).size === 3, '  and the round still covers all three exactly once');

  // A single-question round simply repeats rather than emptying.
  let solo = startRound(solvedRecord(['q0']), QS, { seed: 1 });
  solo = requeueRehearsal(solo, QS);
  check(currentRehearsalId(solo, QS) === 'q0', 'the only question in a round just repeats');
}

console.log('\nThe bag survives being put down');
{
  const ids = ['q0', 'q1', 'q2', 'q3'];
  let p = startRound(solvedRecord(ids), QS, { seed: 42 });
  p = passRehearsal(p, QS, { seed: 43 });
  const expected = currentRehearsalId(p, QS);
  // Round-trip through storage exactly as a reload would.
  const reloaded = sanitizeProgress(JSON.parse(JSON.stringify(p)));
  check(currentRehearsalId(reloaded, QS) === expected, 'a reload resumes the same question');
  check(rehearsalStatus(reloaded, QS).left === 3, '  with the round part-finished, not restarted');
  const untouched = ensureRound(reloaded, QS);
  check(rehearsalStatus(untouched, QS).left === 3, 'entering the mode does not restart a live round');
}

console.log('\nStale ids cannot strand the queue');
{
  // The stored bag names a question the bank no longer has.
  const p = {
    ...solvedRecord(['q0', 'q1']),
    rehearsal: { remaining: ['deleted-question', 'q0', 'q1'], size: 3, round: 1 },
  };
  check(currentRehearsalId(p, QS) === 'q0', 'a deleted question is skipped, not served');
  check(rehearsalStatus(p, QS).left === 2, '  and does not inflate the count');
  // A bag made entirely of stale ids starts a fresh round instead of dead-ending.
  const allStale = { ...solvedRecord(['q0']), rehearsal: { remaining: ['gone'], size: 1, round: 4 } };
  const fixed = ensureRound(allStale, QS);
  check(currentRehearsalId(fixed, QS) === 'q0', 'an entirely stale bag is rebuilt');
  check(rehearsalStatus(fixed, QS).round === 5, '  as the next round');
}

console.log('\nNewly solved questions join the NEXT round');
{
  let p = startRound(solvedRecord(['q0', 'q1']), QS, { seed: 8 });
  // Solve something new mid-round.
  p = { ...p, solved: { ...p.solved, q5: { solves: 1 } } };
  check(rehearsalStatus(p, QS).left === 2, 'a question solved mid-round does not join it');
  p = passRehearsal(p, QS, { seed: 9 });
  p = passRehearsal(p, QS, { seed: 9 }); // round ends, next begins
  check(rehearsalStatus(p, QS).left === 3, 'but it is in the next round');
}

console.log(failures ? `\n${failures} FAILED` : '\nAll rehearsal tests green.');
process.exit(failures ? 1 : 0);
