// A practice session is an explicit, in-memory queue so the learning rule holds
// *within the session*, independent of the spaced-repetition schedule:
//   1. Clear every DUE review (RANDOM order — retrieval practice) before any
//      NEW question appears.
//   2. New questions come in PATH order — you continue exactly where you left
//      off on the curriculum, never a random jump.
//   3. A question you get wrong goes to the back of its queue and comes back
//      around — you cannot move past it by failing.
// Global progress (SRS, streak, mistakes) is still recorded by the caller on
// each pass/fail; this module only governs ordering and gating for one sitting.
import { dueQuestionIds, newQuestionIds, shuffle } from './progress.js';
import { todaysMisses } from './activity.js';
import { byPathOrder } from '../data/roadmap.js';

export function createSession(progress, questions, { seed = (Math.random() * 2 ** 32) >>> 0 } = {}) {
  const validIds = new Set(questions.map((q) => q.id));
  const freshIds = new Set(newQuestionIds(progress, questions));
  const fresh = questions
    .filter((q) => freshIds.has(q.id))
    .sort(byPathOrder)
    .map((q) => q.id);
  return {
    review: shuffle(dueQuestionIds(progress, validIds), seed),
    fresh,
    cleared: [],
  };
}

// "Drill today's misses": a session made only of the questions you got wrong
// today, repeat-until-pass. No new questions — this is targeted remediation.
export function createDrillSession(progress, questions, { seed = (Math.random() * 2 ** 32) >>> 0 } = {}) {
  const validIds = new Set(questions.map((q) => q.id));
  const misses = todaysMisses(progress).filter((id) => validIds.has(id));
  return { review: shuffle(misses, seed), fresh: [], cleared: [] };
}

export function currentId(session) {
  return session.review[0] ?? session.fresh[0] ?? null;
}

export function currentPhase(session) {
  if (session.review.length) return 'review';
  if (session.fresh.length) return 'new';
  return 'done';
}

export function sessionCounts(session) {
  return { reviewLeft: session.review.length, newLeft: session.fresh.length };
}

// Passed the current question: drop it from its queue.
export function onPass(session) {
  const next = { review: [...session.review], fresh: [...session.fresh], cleared: [...session.cleared] };
  if (next.review.length) next.cleared.push(next.review.shift());
  else if (next.fresh.length) next.cleared.push(next.fresh.shift());
  return next;
}

// Skipped/failed the current question: send it to the back of its queue so it
// returns later (unless it's the only one left — then it simply repeats).
export function onRequeue(session) {
  const next = { review: [...session.review], fresh: [...session.fresh], cleared: [...session.cleared] };
  const q = next.review.length ? next.review : next.fresh.length ? next.fresh : null;
  if (q && q.length > 1) q.push(q.shift());
  return next;
}
