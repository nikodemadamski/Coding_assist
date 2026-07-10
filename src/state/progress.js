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

// How a confidence rating on a review shifts the SRS stage.
export const RATING_DELTA = { easy: 2, good: 1, hard: -1 };

// A successful submit. `opts.stageDelta` lets a confidence rating move the review
// forward faster (Easy) or hold it back (Hard); default +1 keeps the plain ladder.
// `opts.timeMs` (open→pass) is kept from the FIRST solve only — that's the
// honest "could I do this cold?" number the pace stats are built on.
// Returns a new Progress object.
export function recordSolve(
  progress,
  questionId,
  now = new Date(),
  { stageDelta = 1, timeMs = null } = {}
) {
  const today = todayStr(now);
  const iso = now.toISOString();
  const next = structuredClone(progress);

  const prev = next.solved[questionId];
  const entry = {
    ...prev, // keep mistakes (and any fail history) — a solve doesn't erase them
    firstSolvedAt: prev?.firstSolvedAt || iso, // fail-first entries carry null
    attempts: (prev?.attempts || 0) + 1,
    solves: (prev?.solves || 0) + 1,
    lastSolvedAt: iso,
  };
  if (Number.isFinite(timeMs) && !(prev?.solves > 0)) {
    entry.firstSolveMs = Math.round(timeMs);
  }
  next.solved[questionId] = entry;

  const srs = next.srs[questionId];
  if (!srs) {
    next.srs[questionId] = { stage: 0, nextDue: addDays(today, SRS_INTERVALS[0]) };
  } else if (isDue(srs, today)) {
    // Reviewed on time: move the stage by the rating delta (clamped to the ladder).
    const stage = Math.max(0, Math.min(srs.stage + stageDelta, SRS_INTERVALS.length - 1));
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

  // Track mistakes even on never-solved questions, so "what do I get wrong?"
  // has data from the very first attempt.
  const prev = next.solved[questionId] || { firstSolvedAt: null, attempts: 0, solves: 0 };
  next.solved[questionId] = {
    ...prev,
    attempts: prev.attempts + 1,
    mistakes: (prev.mistakes || 0) + 1,
  };

  const srs = next.srs[questionId];
  if (srs && isDue(srs, today)) {
    next.srs[questionId] = { stage: 0, nextDue: addDays(today, SRS_INTERVALS[0]) };
  }
  return next;
}

// "Solved" for gating/mastery = has actually been solved at least once. A
// never-solved question that only has failed attempts is still New.
export function isSolved(entry) {
  return !!entry && (entry.solves || 0) > 0;
}

export function dueQuestionIds(progress, validIds, today = todayStr()) {
  return Object.entries(progress.srs)
    .filter(([id, entry]) => validIds.has(id) && isDue(entry, today))
    .map(([id]) => id);
}

// Questions never solved yet — the pool that unlocks once reviews are cleared.
export function newQuestionIds(progress, questions) {
  return questions.filter((q) => !isSolved(progress.solved[q.id])).map((q) => q.id);
}

// ---- deterministic shuffle (so a practice session has a stable random order) ----

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, seed = (Math.random() * 2 ** 32) >>> 0) {
  const a = [...arr];
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The clear-reviews-before-new gating and re-queue-on-fail rule lives in
// state/practiceSession.js (an explicit session queue). This module supplies
// the pieces it composes: dueQuestionIds, newQuestionIds, and shuffle.

export function practiceCounts(progress, questions, today = todayStr()) {
  const validIds = new Set(questions.map((q) => q.id));
  return {
    due: dueQuestionIds(progress, validIds, today).length,
    fresh: newQuestionIds(progress, questions).length,
  };
}

// Reviews landing on each of the next `days` days. Anything overdue counts as
// today — that's when you'd actually do it.
export function reviewForecast(progress, validIds, today = todayStr(), days = 7) {
  const out = Array.from({ length: days }, (_, i) => ({ date: addDays(today, i), count: 0 }));
  const index = new Map(out.map((d, i) => [d.date, i]));
  for (const [id, entry] of Object.entries(progress.srs)) {
    if (!validIds.has(id) || !entry?.nextDue) continue;
    if (entry.nextDue <= today) out[0].count++;
    else if (index.has(entry.nextDue)) out[index.get(entry.nextDue)].count++;
  }
  return out;
}

// ---- backup nudge ----
// Everything lives in localStorage; a browser cleanup wipes it. Nudge once
// there's enough progress to hurt and no export in the last two weeks.

export const BACKUP_NUDGE_DAYS = 14;
export const BACKUP_NUDGE_MIN_SOLVES = 8;

export function backupStatus(lastBackupDate, solvedCount, today = todayStr()) {
  if (solvedCount < BACKUP_NUDGE_MIN_SOLVES) return { nudge: false, daysSince: null };
  if (!lastBackupDate) return { nudge: true, daysSince: null };
  const daysSince = Math.max(
    0,
    Math.round((new Date(today) - new Date(lastBackupDate)) / 86400000)
  );
  return { nudge: daysSince >= BACKUP_NUDGE_DAYS, daysSince };
}

// The questions you keep getting wrong — surfaced on the home map so they get
// deliberate attention. One slip is noise; two or more is a pattern.
export function weakSpots(progress, questions, n = 3) {
  return questions
    .map((q) => ({ q, mistakes: progress.solved[q.id]?.mistakes || 0 }))
    .filter((r) => r.mistakes >= 2)
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, n);
}

// Mastery level for a question, for the NeetCode-style status pills.
// new -> learning -> reviewing -> mastered as the SRS stage climbs.
export function masteryLevel(progress, questionId) {
  const entry = progress.solved[questionId];
  if (!isSolved(entry)) return 'new';
  const stage = progress.srs[questionId]?.stage ?? 0;
  if (stage >= 4) return 'mastered';
  if (stage >= 2) return 'reviewing';
  return 'learning';
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
