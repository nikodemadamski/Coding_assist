// Unit tests for the training logic: spaced repetition, streaks, belts.
import {
  recordSolve,
  recordFail,
  applyRating,
  isDue,
  currentStreak,
  dueQuestionIds,
  beltFor,
  addDays,
  todayStr,
  SRS_INTERVALS,
  isSolved,
  newQuestionIds,
  masteryLevel,
  practiceCounts,
  RATING_DELTA,
  reviewForecast,
  backupStatus,
  weakSpots,
  BACKUP_NUDGE_DAYS,
  BACKUP_NUDGE_MIN_SOLVES,
} from '../src/state/progress.js';
import {
  createSession,
  currentId,
  currentPhase,
  sessionCounts,
  onPass,
  onRequeue,
} from '../src/state/practiceSession.js';
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

// ---- mastery-gated random practice (the core learning rule) ----
{
  const questions = [
    { id: 'a', track: 'python', pattern: 'p' },
    { id: 'b', track: 'python', pattern: 'p' },
    { id: 'c', track: 'python', pattern: 'p' },
    { id: 'd', track: 'python', pattern: 'p' },
  ];
  const today = todayStr();

  // a,b are learned and due today; c,d are brand new.
  const prog = {
    solved: {
      a: { firstSolvedAt: '2026-01-01', attempts: 1, solves: 1, lastSolvedAt: '2026-01-01' },
      b: { firstSolvedAt: '2026-01-01', attempts: 1, solves: 1, lastSolvedAt: '2026-01-01' },
    },
    drafts: {},
    srs: {
      a: { stage: 0, nextDue: today },
      b: { stage: 0, nextDue: today },
    },
    streak: { count: 0, lastActiveDate: null },
  };

  check(isSolved(prog.solved.a) === true, 'isSolved true for a solved question');
  check(isSolved(prog.solved.c) === false, 'isSolved false for a never-solved question');
  check(
    JSON.stringify(newQuestionIds(prog, questions).sort()) === JSON.stringify(['c', 'd']),
    'newQuestionIds returns exactly the unsolved questions'
  );
  const counts = practiceCounts(prog, questions, today);
  check(counts.due === 2 && counts.fresh === 2, 'practiceCounts: 2 due, 2 new');

  // ---- session gating: reviews before new, re-queue on fail ----
  let sess = createSession(prog, questions, { seed: 7 });
  check(currentPhase(sess) === 'review', 'session starts in the review phase');
  check(sessionCounts(sess).reviewLeft === 2 && sessionCounts(sess).newLeft === 2, 'session queues 2 reviews + 2 new');
  check(['a', 'b'].includes(currentId(sess)), 'first served question is a due review');

  // Failing/skipping a review keeps it in the review queue (it comes back).
  const firstReview = currentId(sess);
  const afterSkip = onRequeue(sess);
  check(currentPhase(afterSkip) === 'review', 'still in review phase after a skip');
  check(currentId(afterSkip) !== firstReview, 'skip moves to the other review, not the same one');
  check(sessionCounts(afterSkip).reviewLeft === 2, 'skipped review is re-queued, not dropped');

  // New stays locked until BOTH reviews are passed.
  let s2 = onPass(sess); // clear first review
  check(currentPhase(s2) === 'review', 'new still locked with one review left');
  s2 = onPass(s2); // clear second review
  check(currentPhase(s2) === 'new', 'new unlocks only after all reviews cleared');
  check(['c', 'd'].includes(currentId(s2)), 'now serving a new question');
  s2 = onPass(s2);
  s2 = onPass(s2);
  check(currentId(s2) === null && currentPhase(s2) === 'done', 'session ends after clearing everything');

  // A lone remaining item repeats on skip rather than vanishing.
  const oneLeft = createSession(
    { ...prog, solved: { a: prog.solved.a }, srs: { a: prog.srs.a } },
    [{ id: 'a', track: 'python', pattern: 'p' }],
    { seed: 1 }
  );
  check(currentId(onRequeue(oneLeft)) === 'a', 'the only remaining question repeats on skip (must clear it)');

  // Failing a brand-new question does NOT mark it solved — still counts as new.
  let failedNew = recordFail(prog, 'c', new Date());
  check(!isSolved(failedNew.solved.c), 'failing a new question leaves it unsolved (new)');
  check(failedNew.solved.c.mistakes === 1, 'mistake logged on a failed new question');

  // Confidence rating tunes the interval: Easy jumps further than Good.
  const dueProg = {
    solved: { a: { firstSolvedAt: 'x', attempts: 1, solves: 1, lastSolvedAt: 'x' } },
    drafts: {},
    srs: { a: { stage: 1, nextDue: today } },
    streak: { count: 0, lastActiveDate: null },
  };
  const good = recordSolve(dueProg, 'a', new Date(), { stageDelta: RATING_DELTA.good });
  const easy = recordSolve(dueProg, 'a', new Date(), { stageDelta: RATING_DELTA.easy });
  const hard = recordSolve(dueProg, 'a', new Date(), { stageDelta: RATING_DELTA.hard });
  check(good.srs.a.stage === 2, 'Good advances one stage');
  check(easy.srs.a.stage === 3, 'Easy advances two stages');
  check(hard.srs.a.stage === 0, 'Hard drops a stage');

  // The bug-fix contract: a passing submit records the solve IMMEDIATELY (the
  // review is no longer due even if the session ends right here), and the
  // rating that follows re-tunes the interval as if it had been the delta.
  const recorded = recordSolve(dueProg, 'a', new Date(), { timeMs: 1000 });
  check(!isDue(recorded.srs.a, today), 'solve on submit clears due-ness before any rating');
  check(recorded.srs.a.prevStage === 1, 'the pre-solve stage is remembered for the rating');
  const ratedEasy = applyRating(recorded, 'a', 'easy');
  const ratedHard = applyRating(recorded, 'a', 'hard');
  const ratedGood = applyRating(recorded, 'a', 'good');
  check(ratedEasy.srs.a.stage === easy.srs.a.stage, 'rating Easy after the fact matches solve-with-Easy');
  check(ratedHard.srs.a.stage === hard.srs.a.stage, 'rating Hard after the fact matches solve-with-Hard');
  check(ratedGood.srs.a.stage === good.srs.a.stage, 'rating Good after the fact matches solve-with-Good');

  // First solves and early solves ignore ratings — same as recordSolve does.
  const firstSolve = recordSolve(structuredClone(EMPTY_PROGRESS), 'z', new Date());
  check(applyRating(firstSolve, 'z', 'easy').srs.z.stage === 0, 'rating a first solve is a no-op');
  const early = {
    ...dueProg,
    srs: { a: { stage: 2, nextDue: addDays(today, 5) } },
  };
  const earlySolved = recordSolve(early, 'a', new Date());
  check(
    applyRating(earlySolved, 'a', 'hard').srs.a.stage === 2,
    'rating an early (not-due) solve is a no-op'
  );

  // Mastery levels track the ladder.
  check(masteryLevel(prog, 'c') === 'new', 'never-solved -> new');
  check(masteryLevel({ ...prog, srs: { a: { stage: 0, nextDue: today } } }, 'a') === 'learning', 'stage 0 -> learning');
  check(masteryLevel({ ...prog, srs: { a: { stage: 2, nextDue: today } } }, 'a') === 'reviewing', 'stage 2 -> reviewing');
  check(masteryLevel({ ...prog, srs: { a: { stage: 4, nextDue: today } } }, 'a') === 'mastered', 'stage 4 -> mastered');
}

// ---- review forecast ----
{
  console.log('\nReview forecast:');
  const today = todayStr();
  const prog = {
    ...structuredClone(EMPTY_PROGRESS),
    srs: {
      overdue: { stage: 1, nextDue: addDays(today, -3) },
      dueToday: { stage: 0, nextDue: today },
      in2: { stage: 0, nextDue: addDays(today, 2) },
      in2b: { stage: 1, nextDue: addDays(today, 2) },
      in6: { stage: 2, nextDue: addDays(today, 6) },
      beyond: { stage: 3, nextDue: addDays(today, 10) },
      notInBank: { stage: 0, nextDue: today },
    },
  };
  const ids = new Set(['overdue', 'dueToday', 'in2', 'in2b', 'in6', 'beyond']);
  const fc = reviewForecast(prog, ids, today);
  check(fc.length === 7, 'forecast covers 7 days');
  check(fc[0].date === today && fc[0].count === 2, 'overdue reviews land on today');
  check(fc[2].count === 2, 'two reviews on day +2');
  check(fc[6].count === 1, 'one review on day +6');
  check(fc[1].count === 0 && fc[3].count === 0, 'quiet days show zero');
  check(!fc.some((d) => d.count > 6), 'beyond-horizon and unknown ids are excluded');
}

// ---- backup nudge ----
{
  console.log('\nBackup nudge:');
  const today = todayStr();
  const few = backupStatus(null, BACKUP_NUDGE_MIN_SOLVES - 1, today);
  check(!few.nudge, 'too little progress -> no nudge');
  const never = backupStatus(null, BACKUP_NUDGE_MIN_SOLVES, today);
  check(never.nudge && never.daysSince === null, 'enough progress + never exported -> nudge');
  const fresh = backupStatus(addDays(today, -2), 30, today);
  check(!fresh.nudge && fresh.daysSince === 2, 'recent backup -> no nudge, days counted');
  const stale = backupStatus(addDays(today, -BACKUP_NUDGE_DAYS), 30, today);
  check(stale.nudge && stale.daysSince === BACKUP_NUDGE_DAYS, `${BACKUP_NUDGE_DAYS}+ days -> nudge`);
}

// ---- weak spots ----
{
  console.log('\nWeak spots:');
  const qs = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'c', title: 'C' }, { id: 'd', title: 'D' }, { id: 'e', title: 'E' }];
  const prog = {
    ...structuredClone(EMPTY_PROGRESS),
    solved: {
      a: { attempts: 5, solves: 1, mistakes: 4 },
      b: { attempts: 2, solves: 1, mistakes: 1 }, // one slip: not a pattern
      c: { attempts: 3, solves: 0, mistakes: 2 }, // never solved still counts
      d: { attempts: 9, solves: 2, mistakes: 6 },
      e: { attempts: 4, solves: 1, mistakes: 3 },
    },
  };
  const weak = weakSpots(prog, qs);
  check(weak.length === 3, 'caps at 3 chips');
  check(weak[0].q.id === 'd' && weak[0].mistakes === 6, 'worst offender first');
  check(weak.map((w) => w.q.id).join(',') === 'd,a,e', 'sorted by mistake count');
  check(!weak.some((w) => w.q.id === 'b'), 'a single mistake does not qualify');
  check(weakSpots(structuredClone(EMPTY_PROGRESS), qs).length === 0, 'no data -> no chips');
}

console.log(failures === 0 ? '\nAll training-logic tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
