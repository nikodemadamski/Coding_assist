// Attendance + daily-goal tracking — the "reason to come back" layer.
// Records, per calendar day, whether you showed up, how many solves/fails you
// had, which questions you missed (fuel for the drill), and whether you met the
// daily goal: solve at least one question AND leave no review due.
import { todayStr, dueQuestionIds } from './progress.js';

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
// 'none' (didn't show), 'visited' (showed, goal unmet), 'goal' (goal met).
export function calendarDays(progress, days = 84, today = todayStr()) {
  const out = [];
  const [y, m, d] = today.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - i);
    const key = todayStr(dt);
    const rec = (progress.activity || {})[key];
    let status = 'none';
    if (rec?.goalMet) status = 'goal';
    else if (rec?.visited) status = 'visited';
    out.push({ date: key, status, solves: rec?.solves || 0 });
  }
  return out;
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
