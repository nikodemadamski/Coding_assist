// Training logic: spaced repetition, streaks, belt ranks.
// Pure functions over the Progress shape — no storage access here.

export const SRS_INTERVALS = [1, 3, 7, 16, 30]; // days for stages 0..4

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayStr(dt);
}

function yesterdayStr(today) {
  return addDays(today, -1);
}

export function isDue(srsEntry, today = todayStr()) {
  return !!srsEntry && srsEntry.nextDue <= today;
}

// Streak the user should *see*: 0 if they missed a day.
export function currentStreak(streak, today = todayStr()) {
  if (!streak || !streak.lastActiveDate) return 0;
  if (streak.lastActiveDate === today || streak.lastActiveDate === yesterdayStr(today)) {
    return streak.count;
  }
  return 0;
}

function touchStreak(streak, today) {
  if (streak.lastActiveDate === today) return streak;
  if (streak.lastActiveDate === yesterdayStr(today)) {
    return { count: streak.count + 1, lastActiveDate: today };
  }
  return { count: 1, lastActiveDate: today };
}

// A successful submit. Returns a new Progress object.
export function recordSolve(progress, questionId, now = new Date()) {
  const today = todayStr(now);
  const iso = now.toISOString();
  const next = structuredClone(progress);

  const prev = next.solved[questionId];
  next.solved[questionId] = {
    firstSolvedAt: prev ? prev.firstSolvedAt : iso,
    attempts: (prev ? prev.attempts : 0) + 1,
    lastSolvedAt: iso,
  };

  const srs = next.srs[questionId];
  if (!srs) {
    next.srs[questionId] = { stage: 0, nextDue: addDays(today, SRS_INTERVALS[0]) };
  } else if (isDue(srs, today)) {
    // Reviewed on time: advance the stage (cap at the last interval).
    const stage = Math.min(srs.stage + 1, SRS_INTERVALS.length - 1);
    next.srs[questionId] = { stage, nextDue: addDays(today, SRS_INTERVALS[stage]) };
  }
  // Solving early (not due yet) leaves the schedule untouched.

  next.streak = touchStreak(next.streak, today);
  return next;
}

// A failed submit. Failing a *due* review knocks it back to stage 0.
export function recordFail(progress, questionId, now = new Date()) {
  const today = todayStr(now);
  const next = structuredClone(progress);

  const prev = next.solved[questionId];
  if (prev) next.solved[questionId] = { ...prev, attempts: prev.attempts + 1 };

  const srs = next.srs[questionId];
  if (srs && isDue(srs, today)) {
    next.srs[questionId] = { stage: 0, nextDue: addDays(today, SRS_INTERVALS[0]) };
  }
  return next;
}

export function dueQuestionIds(progress, validIds, today = todayStr()) {
  return Object.entries(progress.srs)
    .filter(([id, entry]) => validIds.has(id) && isDue(entry, today))
    .map(([id]) => id);
}

// ---- belts ----

export const BELTS = [
  { name: 'White', threshold: 0, color: '#e9e7de' },
  { name: 'Yellow', threshold: 4, color: '#e8b04b' },
  { name: 'Orange', threshold: 8, color: '#e87d4b' },
  { name: 'Green', threshold: 14, color: '#3dd68c' },
  { name: 'Blue', threshold: 20, color: '#4b9de8' },
  { name: 'Brown', threshold: 26, color: '#a97142' },
  { name: 'Black', threshold: 34, color: '#454754' },
];

export function beltFor(solvedCount) {
  let belt = BELTS[0];
  for (const b of BELTS) if (solvedCount >= b.threshold) belt = b;
  const idx = BELTS.indexOf(belt);
  const nextBelt = BELTS[idx + 1] || null;
  const span = nextBelt ? nextBelt.threshold - belt.threshold : 1;
  const into = nextBelt ? solvedCount - belt.threshold : 1;
  return {
    ...belt,
    next: nextBelt,
    // 0..1 progress toward the next belt (1 when at black belt)
    progress: nextBelt ? Math.min(1, into / span) : 1,
  };
}
