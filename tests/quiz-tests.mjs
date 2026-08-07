// The pattern quiz must always offer the correct answer among its options, and
// draw distinct, quizzable questions.
import {
  isQuizzable,
  buildQuizItem,
  buildQuizRound,
  MIN_SEEN,
  overallAccuracy,
  patternAccuracy,
  quizRecord,
  recordQuizRound,
  roundSummary,
  verdictFor,
  weakPatterns,
} from '../src/state/patternQuiz.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';
import { categoryKeyOf } from '../src/data/roadmap.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Pattern quiz tests\n');

const twoSum = SEED_QUESTIONS.find((q) => q.id === 'py-two-sum');

// ---- a single quiz item ----
{
  let ok = true;
  let bad = '';
  for (let seed = 1; seed <= 50; seed++) {
    const item = buildQuizItem(twoSum, seed);
    if (item.options.length !== 4) { ok = false; bad = 'not 4 options'; break; }
    const keys = item.options.map((o) => o.key);
    if (new Set(keys).size !== 4) { ok = false; bad = 'duplicate options'; break; }
    if (!keys.includes(item.correctKey)) { ok = false; bad = 'correct not present'; break; }
    if (item.correctKey !== categoryKeyOf(twoSum.pattern)) { ok = false; bad = 'wrong correctKey'; break; }
  }
  check(ok, 'every quiz item has 4 distinct options including the correct one', bad);

  const item = buildQuizItem(twoSum, 7);
  check(item.title === 'Two Sum', 'item carries the question title');
  check(item.prompt.length > 0 && item.prompt.length <= 240, 'prompt is a trimmed first sentence');
  check(!/[`*#]/.test(item.prompt), 'prompt strips markdown markers');
}

// ---- a full round ----
{
  const round = buildQuizRound(SEED_QUESTIONS, 10, 123);
  check(round.length === 10, `round has 10 items (${round.length})`);
  const ids = round.map((r) => r.id);
  check(new Set(ids).size === ids.length, 'round questions are distinct');
  check(
    round.every((r) => r.options.some((o) => o.key === r.correctKey)),
    'every round item is answerable (correct option present)'
  );
}

// ---- all three tracks play, with same-track options ----
{
  const quizzable = SEED_QUESTIONS.filter(isQuizzable);
  check(quizzable.length >= 100, `plenty of quizzable questions (${quizzable.length})`);
  for (const track of ['python', 'pandas', 'sql']) {
    check(
      quizzable.some((q) => q.track === track),
      `${track} questions are quizzable`
    );
  }

  // A data-track item must never leak algorithm distractors (or vice versa):
  // cross-track options would give the answer away by elimination.
  const sql = SEED_QUESTIONS.find((q) => q.id === 'sql-running-total');
  const pd = SEED_QUESTIONS.find((q) => q.id === 'pd-groupby-agg');
  const py = SEED_QUESTIONS.find((q) => q.id === 'py-two-sum');
  let sameTrack = true;
  for (let seed = 1; seed <= 30; seed++) {
    for (const [q, prefix] of [[sql, 'sql-'], [pd, 'pd-']]) {
      const item = buildQuizItem(q, seed);
      if (!item.options.every((o) => o.key.startsWith(prefix))) sameTrack = false;
      if (item.options.length !== 4 || !item.options.some((o) => o.key === item.correctKey)) sameTrack = false;
    }
    const pyItem = buildQuizItem(py, seed);
    if (pyItem.options.some((o) => o.key.startsWith('sql-') || o.key.startsWith('pd-'))) sameTrack = false;
  }
  check(sameTrack, 'quiz options always come from the question’s own track');
}

// ---- the record: a drill you keep score of ----
const ans = (key, correct, ms = 4000, timedOut = false) => ({ key, correct, ms, timedOut });

{
  const empty = quizRecord({});
  check(empty.rounds === 0 && empty.right === 0, 'an untouched record reads as zeros, not undefined');
  check(overallAccuracy({}) === null, 'no accuracy is reported before you have answered anything');

  const p1 = recordQuizRound({}, [ans('hashing', true), ans('sliding-window', false)]);
  check(p1.quiz.rounds === 1, 'a round is counted');
  check(p1.quiz.right === 1 && p1.quiz.wrong === 1, 'right and wrong are tallied');
  check(p1.quiz.bestPct === 50, 'the round percentage is kept as a best');
  check(typeof p1.quiz.lastAt === 'string', 'the record is stamped');
  check(
    p1.quiz.byPattern['sliding-window'].wrong === 1 && p1.quiz.byPattern.hashing.right === 1,
    'the tally is per pattern — that is the whole point'
  );

  const p2 = recordQuizRound(p1, [ans('hashing', true), ans('sliding-window', false)]);
  check(p2.quiz.rounds === 2 && p2.quiz.right === 2, 'a second round accumulates');
  check(p2.quiz.bestPct === 50, 'an equal round does not inflate the best');
  const p3 = recordQuizRound(p2, [ans('hashing', true), ans('sliding-window', true)]);
  check(p3.quiz.bestPct === 100, 'a better round raises it');
  const p4 = recordQuizRound(p3, [ans('hashing', false), ans('sliding-window', false)]);
  check(p4.quiz.bestPct === 100, 'and a worse round never lowers it');
  check(
    Object.keys(recordQuizRound({}, []).quiz.byPattern).length === 0,
    'an empty round is harmless'
  );
}

// A number off one sample is a coin toss shown as a fact.
{
  let p = {};
  for (let i = 0; i < MIN_SEEN - 1; i++) p = recordQuizRound(p, [ans('stack', true)]);
  check(patternAccuracy(p, 'stack') === null, `under ${MIN_SEEN} answers a pattern reports nothing`);
  p = recordQuizRound(p, [ans('stack', true)]);
  const acc = patternAccuracy(p, 'stack');
  check(acc && acc.pct === 100 && acc.seen === MIN_SEEN, 'at the threshold it reports');
  check(patternAccuracy(p, 'never-asked') === null, 'a pattern you were never asked reports nothing');
  const o = overallAccuracy(p);
  check(o.pct === 100 && o.seen === MIN_SEEN, 'the overall figure needs no threshold');
}

// ---- the weak list: what to actually go and read ----
{
  let p = {};
  // greedy: 1/4 · trees: 2/4 · hashing: 4/4 · heap: 0/1 (too few to judge)
  p = recordQuizRound(p, [
    ans('greedy', true), ans('greedy', false), ans('greedy', false), ans('greedy', false),
    ans('trees', true), ans('trees', true), ans('trees', false), ans('trees', false),
    ans('hashing', true), ans('hashing', true), ans('hashing', true), ans('hashing', true),
    ans('heap', false),
  ]);
  const weak = weakPatterns(p);
  check(weak.length === 2, `only patterns asked twice or more are judged (${weak.length})`);
  check(weak[0].key === 'greedy' && weak[0].pct === 25, 'the worst pattern leads');
  check(weak[1].key === 'trees', 'then the next worst');
  check(!weak.some((w) => w.key === 'hashing'), 'a pattern you always get right is not a weak spot');
  check(!weak.some((w) => w.key === 'heap'), 'and one answered once is not enough to accuse you');
  check(typeof weak[0].name === 'string' && weak[0].name.length > 1, 'weak spots carry a readable name');
  check(weakPatterns(p, 1).length === 1, 'the list can be capped');
  check(weakPatterns({}).length === 0, 'a fresh record has no weak spots');

  // Same rate, more misses — the one you have blown more often comes first.
  let q = recordQuizRound({}, [
    ans('bits', true), ans('bits', false),
    ans('math', true), ans('math', true), ans('math', false), ans('math', false),
  ]);
  const tie = weakPatterns(q);
  check(tie[0].key === 'math', 'at equal accuracy the more-missed pattern outranks');
}

// ---- the debrief for one round ----
{
  const s = roundSummary([
    ans('greedy', false, 20000, true),
    ans('hashing', true, 3000),
    ans('hashing', true, 5000),
    ans('greedy', false, 9000),
    ans('trees', true, 7000),
  ]);
  check(s.total === 5 && s.right === 3 && s.pct === 60, 'the round scores itself');
  check(s.timedOut === 1, 'run-outs are counted separately from wrong answers');
  check(s.medianMs === 5000, 'the median is taken over the ones you actually got');
  check(s.missed.length === 1 && s.missed[0].key === 'greedy' && s.missed[0].n === 2,
    'misses are grouped by pattern, so the debrief names a topic and not five questions');
  check(roundSummary([]).medianMs === null, 'an empty round has no median to invent');

  const fast = roundSummary([ans('a', true, 3000), ans('b', true, 4000)]);
  const slow = roundSummary([ans('a', true, 15000), ans('b', true, 16000)]);
  check(verdictFor(fast) !== verdictFor(slow), 'a slow perfect round is not told the same thing as a fast one');
  check(/faster/i.test(verdictFor(slow)), 'and it is told to speed up');
  check(
    /clock/i.test(verdictFor(roundSummary([
      ans('a', false, 20000, true), ans('b', false, 20000, true), ans('c', true, 5000),
    ]))),
    'a round lost mostly to the clock is diagnosed as the clock'
  );
  check(typeof verdictFor(roundSummary([])) === 'string', 'an empty round still gets a sentence');
}

console.log(failures === 0 ? '\nAll quiz tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
