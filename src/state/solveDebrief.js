// What to say to someone who just solved a question.
//
// The moment you clear a problem is the most rewarding event in the app and it
// used to be one grey line of text. This module computes the three things that
// are actually worth reading at that moment — how fast you were against the
// pace you're being graded on, when it comes back, and what it moved — and
// leaves the rendering to SolvedPanel.
//
// Pure, so tests/debrief-tests.mjs can pin every band and phrase without a DOM.
import { PACE_TARGETS_MS } from './readiness.js';
import { addDays, todayStr } from './progress.js';

// Bands against the difficulty's target. The target is the same one readiness
// grades you on, so this never contradicts your score.
//   fast     — comfortably inside it
//   ontrack  — inside it
//   over     — past it, but recoverable
//   slow     — a long way past it
export function paceBand(ms, difficulty = 'medium') {
  const target = PACE_TARGETS_MS[difficulty] ?? PACE_TARGETS_MS.medium;
  if (ms == null || !Number.isFinite(ms) || ms < 0) return { target, ratio: null, band: null };
  const ratio = ms / target;
  const band = ratio <= 0.6 ? 'fast' : ratio <= 1 ? 'ontrack' : ratio <= 1.6 ? 'over' : 'slow';
  return { target, ratio, band };
}

const PACE_LINE = {
  fast: 'Well inside the interview pace for this difficulty.',
  ontrack: 'Inside the interview pace for this difficulty.',
  over: 'Over the pace target — the idea is right, the speed comes with reps.',
  slow: 'A long way over the target. Re-solve it from a blank editor tomorrow.',
};

export function paceVerdict(ms, difficulty = 'medium') {
  const { target, ratio, band } = paceBand(ms, difficulty);
  return { target, ratio, band, line: band ? PACE_LINE[band] : null };
}

// When this question comes back. Spaced repetition is the reason the app works
// and it is invisible unless something says it out loud.
export function nextReviewPhrase(srsEntry, today = todayStr()) {
  const due = srsEntry?.nextDue;
  if (!due) return null;
  const days = daysBetween(today, due);
  if (days <= 0) return { due, days: 0, phrase: 'back today' };
  if (days === 1) return { due, days, phrase: 'back tomorrow' };
  if (days < 7) return { due, days, phrase: `back in ${days} days` };
  const weeks = Math.round(days / 7);
  return { due, days, phrase: `back in ${weeks} week${weeks === 1 ? '' : 's'}` };
}

function daysBetween(from, to) {
  // Both are 'YYYY-MM-DD'; walking days keeps this free of timezone drift, and
  // the SRS ladder tops out at 30 so the loop is bounded and short.
  if (to <= from) return 0;
  for (let d = 1; d <= 400; d++) if (addDays(from, d) >= to) return d;
  return 400;
}

// Was this the first time, or a re-clear? They deserve different sentences:
// the first is progress on the path, the second is the schedule working.
export function solveKind(entry) {
  const solves = entry?.solves ?? 0;
  if (solves <= 1) return 'first';
  return 'review';
}

export const HEADLINE = {
  first: 'Cleared',
  review: 'Re-cleared',
};

// The one-line summary under the headline.
export function debriefLine(kind, mistakes = 0) {
  if (kind === 'review') return 'The schedule worked — you still had it.';
  if (mistakes > 0) {
    return `Solved after ${mistakes} miss${mistakes === 1 ? '' : 'es'}. That is the one you will remember.`;
  }
  return 'First time, clean. On to the next one.';
}

// Everything the panel needs, in one call.
export function solveDebrief({ question, progress, solveMs, today = todayStr() }) {
  const entry = progress?.solved?.[question.id];
  const kind = solveKind(entry);
  return {
    kind,
    headline: HEADLINE[kind],
    line: debriefLine(kind, entry?.mistakes ?? 0),
    pace: paceVerdict(solveMs, question.difficulty),
    review: nextReviewPhrase(progress?.srs?.[question.id], today),
    solves: entry?.solves ?? 1,
  };
}
