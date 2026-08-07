// Pure helpers for the pattern-recognition quiz. Kept out of the component so
// the option-building logic is unit-testable.
import { shuffle } from './progress.js';
import { PATTERN_GUIDE, guideKeyOf } from '../data/patternGuide.js';

const NAME_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p.name]));
// Algorithm cards carry no track field; data cards say 'pandas' | 'sql'.
const TRACK_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p.track ?? 'python']));

// A question qualifies if some guide card actually teaches its pattern (so
// the correct answer is always a real option). All three tracks play.
export function isQuizzable(question) {
  return guideKeyOf(question) !== null;
}

// Build one quiz item: the correct pattern plus 3 distractors from the SAME
// track (an SQL question with algorithm distractors would answer itself).
export function buildQuizItem(question, seed = (Math.random() * 2 ** 32) >>> 0) {
  const correctKey = guideKeyOf(question);
  const sameTrack = PATTERN_GUIDE.map((p) => p.key).filter(
    (k) => k !== correctKey && TRACK_BY_KEY[k] === TRACK_BY_KEY[correctKey]
  );
  const distractors = shuffle(sameTrack, seed).slice(0, 3);
  const optionKeys = shuffle([correctKey, ...distractors], seed ^ 0x9e3779b9);
  return {
    id: question.id,
    title: question.title,
    prompt: firstSentence(question.description),
    options: optionKeys.map((k) => ({ key: k, name: NAME_BY_KEY[k] })),
    correctKey,
  };
}

// Pick N distinct quizzable questions for a round.
export function buildQuizRound(questions, n = 10, seed = (Math.random() * 2 ** 32) >>> 0) {
  const pool = questions.filter(isQuizzable);
  return shuffle(pool, seed)
    .slice(0, n)
    .map((q, i) => buildQuizItem(q, (seed + i * 2654435761) >>> 0));
}

// ── the record ─────────────────────────────────────────────────────────────
// A drill you don't keep score of is a toy. Every round is folded into a
// per-pattern tally, which is what lets the app say "you don't recognise
// sliding window" instead of "you got 6/10".

// Recognition is a reflex, not a puzzle: if you need longer than this you
// didn't *know* it, you worked it out — which is not the thing being trained.
export const QUIZ_SECONDS = 20;
export const ROUND_SIZE = 10;

const EMPTY_QUIZ = { rounds: 0, right: 0, wrong: 0, bestPct: 0, lastAt: null, byPattern: {} };

export function quizRecord(progress) {
  return { ...EMPTY_QUIZ, ...(progress?.quiz || {}) };
}

// answers: [{ key, correct, ms, timedOut }] — one per item, in round order.
export function recordQuizRound(progress, answers) {
  const cur = quizRecord(progress);
  const byPattern = { ...cur.byPattern };
  let right = 0;
  for (const a of answers) {
    const prev = byPattern[a.key] || { right: 0, wrong: 0 };
    byPattern[a.key] = {
      right: prev.right + (a.correct ? 1 : 0),
      wrong: prev.wrong + (a.correct ? 0 : 1),
    };
    if (a.correct) right++;
  }
  const pct = answers.length ? Math.round((right / answers.length) * 100) : 0;
  return {
    ...progress,
    quiz: {
      rounds: cur.rounds + 1,
      right: cur.right + right,
      wrong: cur.wrong + (answers.length - right),
      bestPct: Math.max(cur.bestPct, pct),
      lastAt: new Date().toISOString(),
      byPattern,
    },
  };
}

// How reliably you name a single pattern. `null` when you have not been asked
// enough times to say anything — an accuracy off one sample is a coin toss,
// and showing it would be worse than showing nothing.
export const MIN_SEEN = 3;
export function patternAccuracy(progress, key) {
  const p = quizRecord(progress).byPattern[key];
  if (!p) return null;
  const seen = p.right + p.wrong;
  if (seen < MIN_SEEN) return null;
  return { seen, right: p.right, pct: Math.round((p.right / seen) * 100) };
}

export function overallAccuracy(progress) {
  const q = quizRecord(progress);
  const seen = q.right + q.wrong;
  return seen ? { seen, pct: Math.round((q.right / seen) * 100) } : null;
}

// The patterns you keep failing to name. Worst first, ties broken by how often
// you've missed them, so a pattern you've blown five times outranks one you've
// blown once at the same rate.
export function weakPatterns(progress, n = 3) {
  const q = quizRecord(progress);
  return Object.entries(q.byPattern)
    .map(([key, p]) => ({ key, name: NAME_BY_KEY[key] ?? key, ...p, seen: p.right + p.wrong }))
    .filter((r) => r.seen >= 2 && r.wrong > 0)
    .map((r) => ({ ...r, pct: Math.round((r.right / r.seen) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.wrong - a.wrong)
    .slice(0, n);
}

// The debrief for one round, computed from its own answers rather than from
// the saved record — what you want to read is how *this* went.
export function roundSummary(answers) {
  const total = answers.length;
  const right = answers.filter((a) => a.correct).length;
  const times = answers.filter((a) => a.correct).map((a) => a.ms).sort((x, y) => x - y);
  const missed = [];
  for (const a of answers) {
    if (a.correct) continue;
    const hit = missed.find((m) => m.key === a.key);
    if (hit) hit.n++;
    else missed.push({ key: a.key, name: NAME_BY_KEY[a.key] ?? a.key, n: 1 });
  }
  return {
    total,
    right,
    pct: total ? Math.round((right / total) * 100) : 0,
    timedOut: answers.filter((a) => a.timedOut).length,
    medianMs: times.length ? times[Math.floor(times.length / 2)] : null,
    missed: missed.sort((a, b) => b.n - a.n),
  };
}

// What the debrief says to you. Recognition speed matters as much as the
// score, so a slow perfect round still gets told to go faster.
export function verdictFor(summary) {
  if (summary.total === 0) return 'Nothing to grade.';
  if (summary.pct === 100 && summary.medianMs !== null && summary.medianMs < 6000) {
    return 'Instant and perfect. This is the reflex the room rewards.';
  }
  if (summary.pct === 100) return 'Perfect — now do it faster. Under six seconds is the target.';
  if (summary.pct >= 70) return 'Solid. Read the cues for the ones below and go again.';
  if (summary.timedOut > summary.total / 3) {
    return 'Mostly clock, not knowledge — skim the templates, then come straight back.';
  }
  return 'The cues are the thing to memorise. Open the ones you missed.';
}

function firstSentence(text = '') {
  const plain = text.replace(/[`*_#>]/g, '').trim();
  const end = plain.search(/[.!?]\s/);
  const s = end === -1 ? plain : plain.slice(0, end + 1);
  return s.length > 240 ? s.slice(0, 237) + '…' : s;
}
