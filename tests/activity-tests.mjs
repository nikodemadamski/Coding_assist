// Unit tests for attendance / daily-goal tracking and the drill session.
import {
  markVisit,
  recordDaySolve,
  recordDayFail,
  todaysMisses,
  isGoalMetToday,
  calendarDays,
  countRestDays,
  activitySummary,
  todayPulse,
} from '../src/state/activity.js';
import { createDrillSession, currentId, sessionCounts } from '../src/state/practiceSession.js';
import { todayStr, setRestDays } from '../src/state/progress.js';
import { EMPTY_PROGRESS } from '../src/state/storage.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Attendance + drill tests\n');

// Use the real current day so the functions' default `now` lines up with the
// activity keys we write (createDrillSession/todaysMisses default to today).
const NOW = new Date();
const TODAY = todayStr(NOW);
const dayAgo = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return todayStr(d);
};
const base = () => structuredClone(EMPTY_PROGRESS);

// A tiny question set: q1 solved+not-due, q2 a due review, q3 new.
const questions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];

// ---- attendance ----
{
  let p = markVisit(base(), TODAY);
  check(p.activity[TODAY].visited === true, 'markVisit stamps today as visited');
  const p2 = markVisit(p, TODAY);
  check(p2 === p, 'markVisit is idempotent (same object when already visited)');
}

// ---- misses + drill fuel ----
{
  let p = base();
  p = recordDayFail(p, 'q2', NOW);
  p = recordDayFail(p, 'q3', NOW);
  check(p.activity[TODAY].fails === 2, 'two fails recorded');
  check(
    JSON.stringify(todaysMisses(p, NOW).sort()) === JSON.stringify(['q2', 'q3']),
    "today's misses list both failed questions"
  );
  // re-failing the same question does not duplicate it
  p = recordDayFail(p, 'q2', NOW);
  check(todaysMisses(p, NOW).filter((id) => id === 'q2').length === 1, 'a repeated fail is not double-listed');
  check(p.activity[TODAY].fails === 3, 'but the fail COUNT still increments');

  // solving a missed question removes it from the drill list
  p = { ...p, solved: { q2: { solves: 1 } }, srs: { q2: { stage: 0, nextDue: '2999-01-01' } } };
  p = recordDaySolve(p, 'q2', questions, NOW);
  check(!todaysMisses(p, NOW).includes('q2'), 'solving a missed question clears it from the drill list');
  check(todaysMisses(p, NOW).includes('q3'), 'the still-unsolved miss remains');

  // drill session is built from those misses
  const drill = createDrillSession(p, questions, { seed: 1 });
  check(sessionCounts(drill).reviewLeft === 1 && sessionCounts(drill).newLeft === 0, 'drill queues only the misses, no new');
  check(currentId(drill) === 'q3', 'drill serves the outstanding miss');
}

// ---- daily goal ----
{
  // Goal met: no reviews due (q1/q2/q3 all scheduled in the future or solved) + a solve today.
  let met = base();
  met = { ...met, solved: { q1: { solves: 1 } }, srs: { q1: { stage: 0, nextDue: '2999-01-01' } } };
  met = recordDaySolve(met, 'q1', [{ id: 'q1' }], NOW);
  check(isGoalMetToday(met, NOW) === true, 'goal met when a solve happens and nothing is due');

  // Goal NOT met: a review is still due today.
  let unmet = base();
  unmet = {
    ...unmet,
    solved: { q1: { solves: 1 }, q2: { solves: 1 } },
    srs: { q1: { stage: 0, nextDue: '2999-01-01' }, q2: { stage: 0, nextDue: TODAY } },
  };
  unmet = recordDaySolve(unmet, 'q1', questions, NOW);
  check(isGoalMetToday(unmet, NOW) === false, 'goal NOT met while a review is still due');
}

// ---- calendar + summary ----
{
  const p = base();
  const yesterday = dayAgo(1);
  const twoAgo = dayAgo(2);
  const gap = dayAgo(4);
  p.activity = {
    [gap]: { visited: true, solves: 1, fails: 0, missed: [], goalMet: true },
    [twoAgo]: { visited: true, solves: 2, fails: 0, missed: [], goalMet: true },
    [yesterday]: { visited: true, solves: 1, fails: 0, missed: [], goalMet: true },
    [TODAY]: { visited: true, solves: 0, fails: 1, missed: ['q3'], goalMet: false },
  };
  const cal = calendarDays(p, 84, TODAY);
  check(cal.length === 84, 'calendar returns 84 days');
  check(cal[cal.length - 1].date === TODAY, 'calendar ends on today');
  check(cal[cal.length - 1].status === 'visited', 'today shows visited (goal not yet met)');
  check(cal.find((d) => d.date === yesterday).status === 'goal', 'a goal-met day is marked goal');

  const sum = activitySummary(p);
  check(sum.daysVisited === 4, 'summary counts 4 visited days');
  check(sum.daysGoalMet === 3, 'summary counts 3 goal-met days');
  check(sum.longestGoalStreak === 2, 'longest consecutive goal streak is 2 (the gap breaks it)');
}

// ---- today pulse ----
{
  const TODAY = todayStr(NOW);
  const qs = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];
  const p = structuredClone(EMPTY_PROGRESS);
  p.activity = {
    [TODAY]: { visited: true, solves: 2, fails: 3, missed: ['q3', 'gone-from-bank'], goalMet: false },
  };
  p.srs = { q1: { stage: 0, nextDue: TODAY }, q2: { stage: 0, nextDue: '2999-01-01' } };
  const pulse = todayPulse(p, qs, NOW);
  check(pulse.solves === 2 && pulse.fails === 3, 'pulse carries today solves/fails');
  check(pulse.missedLeft === 1, 'pulse counts only misses still in the bank');
  check(pulse.dueLeft === 1, 'pulse counts reviews still due today');
  check(pulse.goalMet === false, 'pulse carries goal state');
  const empty = todayPulse(structuredClone(EMPTY_PROGRESS), qs, NOW);
  check(empty.solves === 0 && empty.dueLeft === 0 && !empty.goalMet, 'fresh day pulses zeros');
}

// ---- rest days on the calendar ----
// A day off you were entitled to and a day that cost you a run look identical
// on a plain attendance grid. Only one of them is worth feeling bad about, so
// the grid has to tell them apart.
{
  const d = (n) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + n);
    return todayStr(dt);
  };
  const trained = { visited: true, solves: 1, fails: 0, missed: [], goalMet: true };
  // Trained 6 and 5 days ago, then again 3 days ago: day -4 is a single rest
  // day inside the allowance. Days -9/-8 sit before any training in the window.
  const p = {
    ...structuredClone(EMPTY_PROGRESS),
    activity: { [d(-6)]: trained, [d(-5)]: trained, [d(-3)]: trained },
  };
  const days = calendarDays(p, 10);
  const byDate = Object.fromEntries(days.map((x) => [x.date, x.status]));
  check(byDate[d(-6)] === 'goal' && byDate[d(-5)] === 'goal', 'trained days show as goal met');
  check(byDate[d(-4)] === 'rest', 'a single day off inside the allowance reads as REST');
  check(byDate[d(-9)] === 'none', 'days before you ever trained are not rest, just empty');
  check(countRestDays(days) >= 1, 'rest days are counted for tracking');

  // Two days off is still rest (allowance 2); three is a break.
  const p2 = {
    ...structuredClone(EMPTY_PROGRESS),
    activity: { [d(-8)]: trained, [d(-5)]: trained },
  };
  const s2 = Object.fromEntries(calendarDays(p2, 12).map((x) => [x.date, x.status]));
  check(s2[d(-7)] === 'rest' && s2[d(-6)] === 'rest', 'two consecutive days off are both rest');

  const p3 = {
    ...structuredClone(EMPTY_PROGRESS),
    activity: { [d(-9)]: trained, [d(-5)]: trained },
  };
  const s3 = Object.fromEntries(calendarDays(p3, 12).map((x) => [x.date, x.status]));
  check(
    s3[d(-8)] === 'none' && s3[d(-7)] === 'none' && s3[d(-6)] === 'none',
    'three days off exceed the allowance and read as a real break'
  );

  // With the allowance turned off, nothing is ever rest.
  const strict = setRestDays(
    { ...structuredClone(EMPTY_PROGRESS), activity: { [d(-6)]: trained, [d(-3)]: trained } },
    0
  );
  check(countRestDays(calendarDays(strict, 10)) === 0, 'restDays 0 means no day is ever rest');

  // The open run up to today is forgiven on the same terms — otherwise today
  // would read as a miss while the streak is still alive.
  const openRun = {
    ...structuredClone(EMPTY_PROGRESS),
    activity: { [d(-1)]: trained },
  };
  check(
    Object.fromEntries(calendarDays(openRun, 5).map((x) => [x.date, x.status]))[d(0)] === 'rest',
    'today reads as rest while the streak is still alive'
  );
}

console.log(failures === 0 ? '\nAll attendance/drill tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
