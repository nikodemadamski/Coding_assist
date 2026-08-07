// The post-solve debrief: the pace bands, the review phrase, and the sentence
// each kind of solve earns.
import {
  HEADLINE,
  debriefLine,
  nextReviewPhrase,
  paceBand,
  paceVerdict,
  solveDebrief,
  solveKind,
} from '../src/state/solveDebrief.js';
import { PACE_TARGETS_MS } from '../src/state/readiness.js';
import { addDays, todayStr } from '../src/state/progress.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Solve debrief tests');

const MIN = 60000;
const today = todayStr();

// ---- pace bands ----
check(paceBand(5 * MIN, 'easy').band === 'fast', '5 minutes on an easy is fast (target 15)');
check(paceBand(14 * MIN, 'easy').band === 'ontrack', '14 minutes on an easy is still inside it');
check(paceBand(15 * MIN, 'easy').band === 'ontrack', 'exactly on target counts as inside');
check(paceBand(20 * MIN, 'easy').band === 'over', 'past the target is over, not a failure');
check(paceBand(40 * MIN, 'easy').band === 'slow', 'far past it is called what it is');
check(
  paceBand(20 * MIN, 'medium').band === 'ontrack',
  'the same 20 minutes on a medium is fine — the band is per difficulty'
);
check(paceBand(20 * MIN, 'hard').band === 'fast', 'and fast on a hard');
check(
  paceBand(10 * MIN).target === PACE_TARGETS_MS.medium,
  'an unknown difficulty falls back to the medium target, never to undefined'
);
check(
  paceBand(10 * MIN, 'nonsense').target === PACE_TARGETS_MS.medium,
  'and so does a difficulty that is not one of the three'
);

// The timer is optional — a question solved without one must not invent a band.
check(paceBand(null, 'easy').band === null, 'no recorded time means no verdict');
check(paceBand(undefined).band === null, 'undefined is safe');
check(paceBand(NaN).band === null, 'NaN never reaches the UI as a band');
check(paceBand(-5).band === null, 'a negative duration is rejected rather than shown');
check(paceBand(null).target > 0, 'but the target is still reported, so the UI can show the goal');
check(paceVerdict(null).line === null, 'and no sentence is invented either');
check(
  ['fast', 'ontrack', 'over', 'slow'].every((b) => {
    const ms = { fast: 1, ontrack: 0.9, over: 1.2, slow: 3 }[b] * PACE_TARGETS_MS.medium;
    return typeof paceVerdict(ms, 'medium').line === 'string';
  }),
  'every band has a sentence'
);
check(
  paceVerdict(3 * MIN, 'easy').line !== paceVerdict(60 * MIN, 'easy').line,
  'and fast is not told the same thing as slow'
);

// ---- when it comes back ----
check(nextReviewPhrase(null) === null, 'a question with no schedule says nothing about one');
check(nextReviewPhrase({}) === null, 'nor does an entry without a due date');
check(nextReviewPhrase({ nextDue: today }, today).phrase === 'back today', 'due today reads plainly');
check(
  nextReviewPhrase({ nextDue: addDays(today, 1) }, today).phrase === 'back tomorrow',
  'one day is "tomorrow", not "in 1 days"'
);
check(
  nextReviewPhrase({ nextDue: addDays(today, 3) }, today).phrase === 'back in 3 days',
  'a few days counts days'
);
check(
  nextReviewPhrase({ nextDue: addDays(today, 7) }, today).phrase === 'back in 1 week',
  'a week is a week, singular'
);
check(
  nextReviewPhrase({ nextDue: addDays(today, 30) }, today).phrase === 'back in 4 weeks',
  'a month is weeks, plural'
);
check(
  nextReviewPhrase({ nextDue: addDays(today, -3) }, today).days === 0,
  'an overdue review is "today" — that is when you would actually do it'
);
check(
  nextReviewPhrase({ nextDue: addDays(today, 3) }, today).due === addDays(today, 3),
  'the raw date is carried through for a title attribute'
);

// The SRS ladder is [1,3,7,16,30] — every rung must produce a phrase.
check(
  [1, 3, 7, 16, 30].every((d) => {
    const p = nextReviewPhrase({ nextDue: addDays(today, d) }, today);
    return p && typeof p.phrase === 'string' && p.days === d;
  }),
  'every rung of the real SRS ladder gets a readable phrase'
);

// ---- first solve vs re-clear ----
check(solveKind(undefined) === 'first', 'no record yet is a first solve');
check(solveKind({ solves: 1 }) === 'first', 'one solve is a first solve');
check(solveKind({ solves: 2 }) === 'review', 'a second is a re-clear');
check(HEADLINE.first !== HEADLINE.review, 'the two get different headlines');
check(
  debriefLine('first', 0) !== debriefLine('first', 2),
  'a clean first solve is not told the same thing as a hard-won one'
);
check(/2 misses/.test(debriefLine('first', 2)), 'the misses are named');
check(/1 miss\b/.test(debriefLine('first', 1)), 'and one miss is singular');
check(debriefLine('review') !== debriefLine('first', 0), 'a re-clear gets its own sentence');

// ---- the whole thing ----
{
  const question = { id: 'q', difficulty: 'easy' };
  const progress = {
    solved: { q: { solves: 1, mistakes: 0 } },
    srs: { q: { stage: 0, nextDue: addDays(today, 1) } },
  };
  const d = solveDebrief({ question, progress, solveMs: 6 * MIN, today });
  check(d.headline === 'Cleared', 'a first solve is Cleared');
  check(d.pace.band === 'fast', 'the pace band is computed against the question difficulty');
  check(d.review.phrase === 'back tomorrow', 'and the schedule is spelled out');
  check(d.solves === 1, 'the solve count is carried');

  const again = solveDebrief({
    question,
    progress: { solved: { q: { solves: 3, mistakes: 1 } }, srs: { q: { nextDue: addDays(today, 16) } } },
    solveMs: 4 * MIN,
    today,
  });
  check(again.headline === 'Re-cleared', 'a later solve is Re-cleared');
  check(again.review.phrase === 'back in 2 weeks', 'with the longer interval it earned');

  // Nothing recorded yet, no timer, no schedule — the panel still renders.
  const bare = solveDebrief({ question, progress: {}, solveMs: null, today });
  check(bare.headline === 'Cleared' && bare.pace.band === null && bare.review === null,
    'an empty record degrades to a headline and nothing invented');
}

console.log(failures === 0 ? 'All solve debrief tests green.' : `${failures} debrief test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
