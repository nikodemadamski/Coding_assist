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

export function isDue(srsEntry, today = todayStr()) {
  return !!srsEntry && srsEntry.nextDue <= today;
}

// ---- rest days ----
// A streak that breaks the first day you cannot train is measuring the wrong
// thing. The goal here is "one more question whenever I have time", and a
// person with a job has days where there is no time — punishing those turns a
// motivator into a reason to give up. So the streak tolerates a REST ALLOWANCE:
// you may miss up to this many consecutive days and the run continues.
//
// Rest days are not counted as training. `count` stays the number of days you
// actually solved something, so the number never flatters you — resting simply
// does not reset it. Coins follow the same rule, because they are paid from
// currentStreak.
export const REST_DAYS_DEFAULT = 2;
export const REST_DAYS_MAX = 6; // beyond this a "streak" stops meaning anything

// Stored on the streak itself so it exports/imports with the record — the same
// history must produce the same streak on any device.
export function restAllowance(streak) {
  const n = Number(streak?.restDays);
  if (!Number.isFinite(n)) return REST_DAYS_DEFAULT;
  return Math.min(REST_DAYS_MAX, Math.max(0, Math.round(n)));
}

// Whole calendar days from `from` to `to` (both 'YYYY-MM-DD'). 0 = same day.
export function daysBetween(from, to) {
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

// Days with no training between the last active day and `today`. Same day or
// yesterday means none missed yet — today is not over.
export function missedSince(lastActiveDate, today) {
  return Math.max(0, daysBetween(lastActiveDate, today) - 1);
}

// Streak the user should *see*: it survives rest days, and breaks only when the
// gap exceeds the allowance.
export function currentStreak(streak, today = todayStr()) {
  if (!streak || !streak.lastActiveDate) return 0;
  const gap = daysBetween(streak.lastActiveDate, today);
  // A last-active date in the future means a clock change, not a missed day.
  if (gap < 0) return streak.count;
  return missedSince(streak.lastActiveDate, today) <= restAllowance(streak) ? streak.count : 0;
}

// How much rest is left before the run breaks — what the UI needs to say
// "rest tomorrow and it holds" rather than leaving you to guess.
export function restStatus(streak, today = todayStr()) {
  const allowance = restAllowance(streak);
  if (!streak?.lastActiveDate) return { allowance, used: 0, left: allowance, alive: false };
  const used = Math.min(allowance + 1, missedSince(streak.lastActiveDate, today));
  return {
    allowance,
    used,
    left: Math.max(0, allowance - used),
    alive: used <= allowance && streak.count > 0,
    restingToday: used > 0,
  };
}

function touchStreak(streak, today) {
  if (streak.lastActiveDate === today) return streak;
  // `...streak` preserves restDays — rebuilding the object from scratch here
  // would silently reset the user's allowance on every solve.
  if (streak.lastActiveDate && missedSince(streak.lastActiveDate, today) <= restAllowance(streak)) {
    return { ...streak, count: streak.count + 1, lastActiveDate: today };
  }
  return { ...streak, count: 1, lastActiveDate: today };
}

// Change the allowance without disturbing the run it governs.
export function setRestDays(progress, days) {
  const n = Math.min(REST_DAYS_MAX, Math.max(0, Math.round(Number(days) || 0)));
  return { ...progress, streak: { ...(progress.streak ?? {}), restDays: n } };
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
    // `prevStage` remembers where the ladder stood BEFORE this solve, so a
    // confidence rating arriving moments later (applyRating) can re-derive the
    // schedule exactly as if that delta had been passed here.
    const stage = Math.max(0, Math.min(srs.stage + stageDelta, SRS_INTERVALS.length - 1));
    next.srs[questionId] = { stage, nextDue: addDays(today, SRS_INTERVALS[stage]), prevStage: srs.stage };
  }
  // Solving early (not due yet) leaves the schedule untouched.

  next.streak = touchStreak(next.streak, today);
  return next;
}

// Re-tune the schedule chosen by the solve that JUST happened. The solve is
// recorded immediately on a passing submit (so ending a session early never
// loses it); the confidence rating arrives afterwards and only adjusts the
// interval. No-op for first solves and early (not-due) solves — exactly the
// cases where recordSolve ignores the delta too.
export function applyRating(progress, questionId, rating, now = new Date()) {
  const delta = RATING_DELTA[rating];
  const srs = progress.srs?.[questionId];
  if (delta === undefined || !srs || srs.prevStage === undefined || srs.prevStage === null) {
    return progress;
  }
  const today = todayStr(now);
  const next = structuredClone(progress);
  const stage = Math.max(0, Math.min(srs.prevStage + delta, SRS_INTERVALS.length - 1));
  next.srs[questionId] = { stage, nextDue: addDays(today, SRS_INTERVALS[stage]), prevStage: srs.prevStage };
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

// How many questions you have actually solved. **The record is not the
// authority on its own size** — it can hold ids the bank no longer has (a
// deleted custom question, a seed id renamed in a later release), and those
// must not be counted. This existed three times with two different answers:
// App and shop filtered against the bank, Stats counted raw keys, so a record
// with two stale ids showed 17 on the home screen, 19 on Stats, and a belt
// distance that disagreed on all three surfaces. One function now, so a
// disagreement is impossible rather than merely unlikely.
export function solvedCount(progress, questions) {
  const solved = progress?.solved ?? {};
  return questions.filter((q) => isSolved(solved[q.id])).length;
}

export function dueQuestionIds(progress, validIds, today = todayStr()) {
  return Object.entries(progress.srs)
    .filter(([id, entry]) => validIds.has(id) && isDue(entry, today))
    .map(([id]) => id);
}

// "I already know this one." The path is a fixed order, which is right for
// someone starting at the beginning and wrong for everyone else: solve Two Sum
// and Group Anagrams first and the home screen still offers you Reverse a
// string, forever, with no way to say otherwise. Skipping records nothing about
// your ability — it is not a solve, it earns no coins and no review — it only
// stops a question being OFFERED as the next new one. It still appears in
// Browse and is still solvable, so the decision is reversible by just doing it.
export function isSkipped(progress, id) {
  return !!progress?.skipped?.[id];
}

export function skipQuestion(progress, questionId) {
  return { ...progress, skipped: { ...(progress.skipped ?? {}), [questionId]: true } };
}

// Solved OR skipped — "do not offer me this as something new".
export function isSettled(progress, id) {
  return isSolved(progress.solved?.[id]) || isSkipped(progress, id);
}

// Questions never solved yet — the pool that unlocks once reviews are cleared.
// Skipped ones are excluded so the hero and the practice session agree about
// what "next" means; DUE REVIEWS are untouched, because a question you chose to
// solve is one you chose to keep.
export function newQuestionIds(progress, questions) {
  return questions.filter((q) => !isSettled(progress, q.id)).map((q) => q.id);
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

// Record an answer to the after-solve Big-O check-in.
export function recordBigO(progress, correct) {
  const cur = progress.bigo || { right: 0, wrong: 0 };
  return {
    ...progress,
    bigo: { right: cur.right + (correct ? 1 : 0), wrong: cur.wrong + (correct ? 0 : 1) },
  };
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
