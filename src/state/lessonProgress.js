// Lesson progress + spaced skill checks. Pure functions over Progress,
// mirroring progress.js SRS semantics — but in its own progress.lessons map,
// so the question schedule (progress.srs) is never touched.
//
// progress.lessons[lessonId] = {
//   completedAt, runs, missedIdx: [item indexes missed on the last full run],
//   srs: { stage: 0..4, nextDue: 'YYYY-MM-DD' },
// }
import { SRS_INTERVALS, addDays, todayStr, shuffle } from './progress.js';

// Completing a lesson schedules its first skill check for tomorrow.
export function recordLessonComplete(progress, lessonId, { missedIdx = [] } = {}, now = new Date()) {
  const today = todayStr(now);
  const next = structuredClone(progress);
  next.lessons = next.lessons || {};
  const prev = next.lessons[lessonId];
  next.lessons[lessonId] = {
    completedAt: prev?.completedAt || now.toISOString(),
    runs: (prev?.runs || 0) + 1,
    missedIdx: [...missedIdx],
    // Re-taking a completed lesson keeps its existing review schedule.
    srs: prev?.srs ?? { stage: 0, nextDue: addDays(today, SRS_INTERVALS[0]) },
  };
  return next;
}

// A passed skill check climbs the ladder; a failed one restarts it — the same
// clamp semantics as question reviews.
export function recordLessonReview(progress, lessonId, passed, now = new Date()) {
  const today = todayStr(now);
  const entry = progress.lessons?.[lessonId];
  if (!entry?.srs) return progress;
  const next = structuredClone(progress);
  const stage = passed ? Math.min(entry.srs.stage + 1, SRS_INTERVALS.length - 1) : 0;
  next.lessons[lessonId] = {
    ...entry,
    srs: { stage, nextDue: addDays(today, SRS_INTERVALS[stage]) },
  };
  return next;
}

export function dueLessonIds(progress, validIds, today = todayStr()) {
  return Object.entries(progress.lessons || {})
    .filter(([id, e]) => validIds.has(id) && e.srs && e.srs.nextDue <= today)
    .map(([id]) => id);
}

// A skill check: 4 quick predict/type items from the lesson — the ones missed
// last time first, then a seeded-random fill. fix/write/watch stay out (a
// review must fit in ~90 seconds).
export const REVIEW_ITEM_COUNT = 4;
export const REVIEW_PASS_MIN = 3;

export function buildReviewItems(lesson, entry, seed = (Math.random() * 2 ** 32) >>> 0) {
  const quick = lesson.items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.type === 'predict' || item.type === 'type');
  const missed = quick.filter(({ idx }) => (entry?.missedIdx || []).includes(idx));
  const rest = shuffle(
    quick.filter(({ idx }) => !(entry?.missedIdx || []).includes(idx)),
    seed
  );
  return [...missed, ...rest].slice(0, REVIEW_ITEM_COUNT);
}
