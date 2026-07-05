// Unit tests for the training logic: spaced repetition, streaks, belts.
import {
  recordSolve,
  recordFail,
  currentStreak,
  dueQuestionIds,
  beltFor,
  addDays,
  todayStr,
  SRS_INTERVALS,
} from '../src/state/progress.js';
import { EMPTY_PROGRESS, exportData, parseImport } from '../src/state/storage.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

const day = (offset) => {
  const d = new Date(2026, 0, 10, 12, 0, 0); // fixed local noon, avoids DST edges
  d.setDate(d.getDate() + offset);
  return d;
};

console.log('Training logic tests\n');

// ---- spaced repetition ----
{
  let p = structuredClone(EMPTY_PROGRESS);
  p = recordSolve(p, 'q1', day(0));
  const t0 = todayStr(day(0));
  check(p.srs.q1.stage === 0 && p.srs.q1.nextDue === addDays(t0, 1), 'first solve schedules +1 day at stage 0');
  check(p.solved.q1.attempts === 1, 'first solve counts one attempt');

  // Re-solving before due leaves the schedule alone
  p = recordSolve(p, 'q1', day(0));
  check(p.srs.q1.stage === 0 && p.srs.q1.nextDue === addDays(t0, 1), 'early re-solve leaves schedule');
  check(p.solved.q1.attempts === 2, 'attempts accumulate');

  // Solving on the due date advances: stage 1, +3 days
  p = recordSolve(p, 'q1', day(1));
  check(
    p.srs.q1.stage === 1 && p.srs.q1.nextDue === addDays(todayStr(day(1)), 3),
    'on-time review advances to stage 1 (+3 days)'
  );

  // Walk the full ladder 3 -> 7 -> 16 -> 30
  let offset = 1;
  for (let stage = 2; stage < SRS_INTERVALS.length; stage++) {
    offset += SRS_INTERVALS[stage - 1];
    p = recordSolve(p, 'q1', day(offset));
    check(
      p.srs.q1.stage === stage &&
        p.srs.q1.nextDue === addDays(todayStr(day(offset)), SRS_INTERVALS[stage]),
      `review ladder reaches stage ${stage} (+${SRS_INTERVALS[stage]} days)`
    );
  }

  // At max stage, another on-time solve stays at stage 4, +30 again
  offset += SRS_INTERVALS[4];
  p = recordSolve(p, 'q1', day(offset));
  check(p.srs.q1.stage === 4, 'stage caps at 4');

  // Failing a due review resets to stage 0
  offset += SRS_INTERVALS[4];
  p = recordFail(p, 'q1', day(offset));
  check(
    p.srs.q1.stage === 0 && p.srs.q1.nextDue === addDays(todayStr(day(offset)), 1),
    'failed submit on a due problem resets to stage 0 (+1 day)'
  );

  // Failing when NOT due does not reset
  let p2 = structuredClone(EMPTY_PROGRESS);
  p2 = recordSolve(p2, 'q2', day(0));
  p2 = recordFail(p2, 'q2', day(0)); // not due until tomorrow
  check(p2.srs.q2.stage === 0 && p2.srs.q2.nextDue === addDays(todayStr(day(0)), 1), 'failing early does not reschedule');
  check(p2.solved.q2.attempts === 2, 'failed attempt still counted');

  // dueQuestionIds respects the valid-id set and the date
  const due = dueQuestionIds(p2, new Set(['q2']), todayStr(day(1)));
  check(due.length === 1 && due[0] === 'q2', 'due list contains q2 on its due date');
  check(dueQuestionIds(p2, new Set(['q2']), todayStr(day(0))).length === 0, 'not due before its date');
  check(dueQuestionIds(p2, new Set([]), todayStr(day(1))).length === 0, 'deleted questions never come due');
}

// ---- streaks ----
{
  let p = structuredClone(EMPTY_PROGRESS);
  p = recordSolve(p, 'a', day(0));
  check(currentStreak(p.streak, todayStr(day(0))) === 1, 'first solve starts a 1-day streak');
  p = recordSolve(p, 'b', day(0));
  check(currentStreak(p.streak, todayStr(day(0))) === 1, 'same-day solves do not double-count');
  p = recordSolve(p, 'c', day(1));
  check(currentStreak(p.streak, todayStr(day(1))) === 2, 'consecutive day increments streak');
  check(currentStreak(p.streak, todayStr(day(2))) === 2, 'streak still shows the day after (grace to solve today)');
  check(currentStreak(p.streak, todayStr(day(3))) === 0, 'missed day resets displayed streak to 0');
  p = recordSolve(p, 'd', day(3));
  check(currentStreak(p.streak, todayStr(day(3))) === 1, 'solving after a gap restarts at 1');
}

// ---- belts ----
{
  const expectations = [
    [0, 'White'],
    [3, 'White'],
    [4, 'Yellow'],
    [8, 'Orange'],
    [14, 'Green'],
    [20, 'Blue'],
    [26, 'Brown'],
    [33, 'Brown'],
    [34, 'Black'],
    [99, 'Black'],
  ];
  for (const [solves, name] of expectations) {
    check(beltFor(solves).name === name, `${solves} solves -> ${name} belt`);
  }
  check(beltFor(2).progress === 0.5, 'belt progress is fractional (2/4 to Yellow)');
  check(beltFor(34).progress === 1, 'black belt progress is full');
}

// ---- export / import round trip ----
{
  let p = structuredClone(EMPTY_PROGRESS);
  p = recordSolve(p, 'py-two-sum', day(0));
  p.drafts['py-two-sum'] = 'def two_sum(nums, target): ...';
  const custom = [{ id: 'forged-one', track: 'python', title: 'X' }];
  const json = exportData(p, custom);
  const restored = parseImport(json);
  check(
    JSON.stringify(restored.progress) === JSON.stringify(p) &&
      JSON.stringify(restored.customQuestions) === JSON.stringify(custom),
    'export/import round-trips progress and custom questions'
  );
  let threw = false;
  try {
    parseImport('{"app": "something-else"}');
  } catch {
    threw = true;
  }
  check(threw, 'import rejects foreign JSON');
}

console.log(failures === 0 ? '\nAll training-logic tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
