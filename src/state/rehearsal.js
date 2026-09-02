// **Rehearsal: everything you have already solved, on a loop.**
//
// This is a different activity from both a practice session and the drill, and
// the difference is worth stating because all three serve questions:
//   - a SESSION clears what is due, then walks the path forward — it is about
//     making progress, and it is governed by the review schedule;
//   - the DRILL is today's misses, repeat-until-pass — targeted remediation;
//   - REHEARSAL ignores the schedule completely. It is the whole set of
//     questions you have solved at least once, in random order, and it never
//     offers the same one twice until it has offered all of them. You stop when
//     you are satisfied, not when a queue runs out.
//
// Two consequences follow from "it won't reset until all are done", and they
// are what make this module exist at all rather than reusing practiceSession:
//
//  1. **The bag is persistent.** A session lives in React state and is gone on
//     reload; a rehearsal round has to survive closing the tab, or "I'll finish
//     the rest tomorrow" silently starts over. It lives in the record and is
//     therefore also carried by export/import.
//
//  2. **Draw without replacement.** Random picking with replacement would show
//     you the same question three times while another never appears. A shuffled
//     bag that empties before it refills is the only way "all of them" is a
//     promise rather than a probability.
//
// Solving during a rehearsal records exactly like any other solve — the streak,
// coins and mistake history are all real. It cannot corrupt the review
// schedule, because recordSolve leaves the SRS ladder untouched for a question
// that is not yet due.
import { isSolved, shuffle } from './progress.js';

// Only questions you have actually solved, and that still exist in the bank.
// A skipped question was never solved, so it is not here — "I already know this
// one" is a claim you made, not one you demonstrated.
export function rehearsalPool(progress, questions) {
  return questions.filter((q) => isSolved(progress?.solved?.[q.id])).map((q) => q.id);
}

const record = (progress) => progress?.rehearsal ?? {};

// Begin a fresh round over everything currently eligible. Questions solved
// since the last round started join here — not mid-round, so "all of them"
// keeps meaning the set you agreed to when the round began.
export function startRound(progress, questions, { seed, round } = {}) {
  const pool = rehearsalPool(progress, questions);
  const order = seed === undefined ? shuffle(pool) : shuffle(pool, seed);
  return {
    ...progress,
    rehearsal: {
      remaining: order,
      size: order.length,
      round: round ?? (record(progress).round ?? 0) + 1,
    },
  };
}

// The remaining ids that are still eligible. The stored bag can go stale — a
// custom question deleted, a seed id renamed — and a queue that hands out an id
// the bank no longer has would strand the view on a blank screen.
function liveRemaining(progress, questions) {
  const eligible = new Set(rehearsalPool(progress, questions));
  const stored = record(progress).remaining;
  return Array.isArray(stored) ? stored.filter((id) => eligible.has(id)) : [];
}

// Make sure there is a usable round in progress, without disturbing one that is
// already under way. Call this when entering the mode.
export function ensureRound(progress, questions, opts = {}) {
  const live = liveRemaining(progress, questions);
  if (live.length > 0) {
    // Prune in place if anything went stale, but keep the order and the round.
    const stored = record(progress).remaining ?? [];
    if (live.length === stored.length) return progress;
    return { ...progress, rehearsal: { ...record(progress), remaining: live } };
  }
  return startRound(progress, questions, opts);
}

export function currentRehearsalId(progress, questions) {
  return liveRemaining(progress, questions)[0] ?? null;
}

// Cleared it: drop it from the bag. When the bag empties the next round starts
// immediately — the loop is the point, so there is no dead end to back out of.
// The caller can tell a round just turned over by comparing `round`.
export function passRehearsal(progress, questions, opts = {}) {
  const live = liveRemaining(progress, questions);
  const remaining = live.slice(1);
  if (remaining.length === 0) return startRound(progress, questions, opts);
  return { ...progress, rehearsal: { ...record(progress), remaining } };
}

// Failed or skipped it: back of the bag, so it returns before the round ends.
// You cannot finish a round by failing your way through it.
export function requeueRehearsal(progress, questions) {
  const live = liveRemaining(progress, questions);
  if (live.length < 2) return { ...progress, rehearsal: { ...record(progress), remaining: live } };
  return {
    ...progress,
    rehearsal: { ...record(progress), remaining: [...live.slice(1), live[0]] },
  };
}

// What the UI needs: how far through this round, and whether the mode is even
// available. `ready` is false only when you have solved nothing yet.
export function rehearsalStatus(progress, questions) {
  const pool = rehearsalPool(progress, questions);
  const left = liveRemaining(progress, questions).length;
  const size = Math.max(left, Math.min(record(progress).size ?? pool.length, pool.length));
  return {
    ready: pool.length > 0,
    poolSize: pool.length,
    left,
    size,
    done: Math.max(0, size - left),
    round: record(progress).round ?? 0,
    inProgress: left > 0 && left < size,
  };
}
