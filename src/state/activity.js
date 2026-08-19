// Attendance + daily-goal tracking — the "reason to come back" layer.
// Records, per calendar day, whether you showed up, how many solves/fails you
// had, which questions you missed (fuel for the drill), and whether you met the
// daily goal: solve at least one question AND leave no review due.
import { todayStr, dueQuestionIds, restAllowance } from './progress.js';

function emptyDay() {
  return { visited: false, solves: 0, fails: 0, missed: [], goalMet: false };
}

function dayOf(progress, date) {
  return { ...emptyDay(), ...((progress.activity || {})[date] || {}) };
}

function withDay(progress, date, day) {
  return { ...progress, activity: { ...(progress.activity || {}), [date]: day } };
}

// Called once when the app opens: stamps attendance for today.
export function markVisit(progress, today = todayStr()) {
  const day = dayOf(progress, today);
  if (day.visited) return progress;
  day.visited = true;
  return withDay(progress, today, day);
}

// Record a correct answer. `progress` should already reflect the solve (call
// after recordSolve) so the due-count check sees the updated schedule.
export function recordDaySolve(progress, questionId, questions, now = new Date()) {
  const today = todayStr(now);
  const day = dayOf(progress, today);
  day.visited = true;
  day.solves += 1;
  day.missed = day.missed.filter((id) => id !== questionId); // you fixed it
  const validIds = new Set(questions.map((q) => q.id));
  const dueLeft = dueQuestionIds(progress, validIds, today).length;
  if (day.solves >= 1 && dueLeft === 0) day.goalMet = true;
  return withDay(progress, today, day);
}

export function recordDayFail(progress, questionId, now = new Date()) {
  const today = todayStr(now);
  const day = dayOf(progress, today);
  day.visited = true;
  day.fails += 1;
  if (!day.missed.includes(questionId)) day.missed = [...day.missed, questionId];
  return withDay(progress, today, day);
}

// Questions you got wrong today and haven't since re-solved — the drill queue.
export function todaysMisses(progress, now = new Date()) {
  return dayOf(progress, todayStr(now)).missed;
}

export function isGoalMetToday(progress, now = new Date()) {
  return dayOf(progress, todayStr(now)).goalMet;
}

// One-line pulse of the current day, for the home page: what you've done and
// what's still standing between you and the daily goal.
export function todayPulse(progress, questions, now = new Date()) {
  const today = todayStr(now);
  const day = dayOf(progress, today);
  const validIds = new Set(questions.map((q) => q.id));
  const dueLeft = dueQuestionIds(progress, validIds, today).length;
  return {
    solves: day.solves,
    fails: day.fails,
    missedLeft: day.missed.filter((id) => validIds.has(id)).length,
    dueLeft,
    goalMet: day.goalMet,
  };
}

// ---- calendar + summary ----

// Returns the last `days` calendar days (oldest first) with their status:
// 'goal' (goal met), 'visited' (showed, goal unmet), 'rest' (no training, but
// inside the rest allowance so the streak held), 'none' (a gap that broke it).
//
// Separating REST from NONE is the whole point of tracking rest days: a day off
// you were entitled to and a day that cost you a run look identical on a plain
// attendance grid, and only one of them is worth feeling bad about.
//
// A day counts as training if it has a solve — that is what touchStreak
// records. Showing up without solving is 'visited': honest attendance, but it
// does not extend the run, so it is treated as a gap day when measuring rest.
export function calendarDays(progress, days = 84, today = todayStr()) {
  const activity = progress.activity || {};
  const allowance = restAllowance(progress.streak);
  const out = [];
  const [y, m, d] = today.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - i);
    const key = todayStr(dt);
    const rec = activity[key];
    const trained = (rec?.solves || 0) > 0;
    let status = 'none';
    if (rec?.goalMet) status = 'goal';
    else if (rec?.visited) status = 'visited';
    out.push({ date: key, status, solves: rec?.solves || 0, trained });
  }

  // Second pass: promote gap days to 'rest' when they sit in a run short enough
  // to have been forgiven. A run is only rest if training PRECEDED it — days
  // before you ever started are not rest, they are just not your history.
  // (A run reaching the start of the window has no visible predecessor, so it
  // stays 'none' rather than being guessed at.)
  let runStart = -1;
  const closeRun = (endExclusive) => {
    if (runStart <= 0) return; // no preceding trained day inside the window
    const len = endExclusive - runStart;
    if (len > 0 && len <= allowance) {
      for (let k = runStart; k < endExclusive; k++) {
        if (out[k].status === 'none') out[k].status = 'rest';
      }
    }
  };
  for (let i = 0; i < out.length; i++) {
    if (out[i].trained) {
      if (runStart >= 0) closeRun(i);
      runStart = i + 1;
    }
  }
  // The trailing run runs up to today and is still open — forgiven on the same
  // terms, which is what keeps today's cell honest while the streak is alive.
  if (runStart >= 0) closeRun(out.length);
  return out;
}

// How many of the days shown were rest days rather than misses.
export function countRestDays(days) {
  return days.filter((d) => d.status === 'rest').length;
}

export function activitySummary(progress) {
  const activity = progress.activity || {};
  const dates = Object.keys(activity).sort();
  const daysVisited = dates.filter((d) => activity[d].visited).length;
  const daysGoalMet = dates.filter((d) => activity[d].goalMet).length;

  // Longest run of consecutive calendar days with the goal met.
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    if (!activity[d].goalMet) {
      run = 0;
      prev = d;
      continue;
    }
    if (prev && isNextDay(prev, d)) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { daysVisited, daysGoalMet, longestGoalStreak: longest };
}

function isNextDay(prevKey, key) {
  const [py, pm, pd] = prevKey.split('-').map(Number);
  const prev = new Date(py, pm - 1, pd);
  prev.setDate(prev.getDate() + 1);
  return todayStr(prev) === key;
}
