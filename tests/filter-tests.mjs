// Pure tests for the Browse filter.
import {
  STATUSES,
  filterQuestions,
  matchesText,
  questionStatus,
  statusCounts,
} from '../src/state/questionFilter.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Filter tests');

const Q = [
  { id: 'a', title: 'Two Sum', pattern: 'hash-map', track: 'python', difficulty: 'easy' },
  { id: 'b', title: 'Group Anagrams', pattern: 'hash-map', track: 'python', difficulty: 'medium' },
  { id: 'c', title: 'Stat sheet to long format', pattern: 'reshape', track: 'pandas', difficulty: 'medium' },
  { id: 'd', title: 'Top earners', pattern: 'window-functions', track: 'sql', difficulty: 'hard' },
];
const TODAY = '2026-08-06';
const P = {
  solved: {
    a: { solves: 1, mistakes: 3 },
    c: { solves: 1, mistakes: 0 },
  },
  srs: { a: { stage: 0, nextDue: '2026-08-01' }, c: { stage: 1, nextDue: '2026-09-01' } },
};

// ---- text ----
check(matchesText(Q[0], 'two sum'), 'a plain title match works');
check(matchesText(Q[0], 'TWOSUM'), 'case and spacing are ignored');
check(matchesText(Q[0], 'two-sum'), 'punctuation is ignored');
check(matchesText(Q[1], 'anagram'), 'a partial word matches');
check(matchesText(Q[1], 'hash'), 'the pattern is searchable, not just the title');
check(matchesText(Q[3], 'sql'), 'the track is searchable');
check(matchesText(Q[3], 'hard'), 'the difficulty is searchable');
check(matchesText(Q[0], ''), 'an empty query matches everything');
check(!matchesText(Q[0], 'zzz'), 'a miss is a miss');

// ---- status ----
const st = (id) => questionStatus(P, Q.find((q) => q.id === id), TODAY);
check(st('a').solved && st('a').due && st('a').mistakes === 3, 'a solved-but-overdue question is both');
check(st('c').solved && !st('c').due, 'a solved question scheduled ahead is not due');
check(!st('b').solved && !st('b').due, 'an untouched question is neither');

const ids = (list) => list.map((q) => q.id).join('');
check(ids(filterQuestions(Q, {}, P, TODAY)) === 'abcd', 'no filters returns everything, in order');
check(ids(filterQuestions(Q, { status: 'todo' }, P, TODAY)) === 'bd', 'not-solved excludes solves');
check(ids(filterQuestions(Q, { status: 'solved' }, P, TODAY)) === 'ac', 'solved returns solves');
check(ids(filterQuestions(Q, { status: 'due' }, P, TODAY)) === 'a', 'due returns what is overdue');
check(ids(filterQuestions(Q, { status: 'weak' }, P, TODAY)) === 'a', 'weak returns what has bitten you');
check(
  ids(filterQuestions(Q, { track: 'python' }, P, TODAY)) === 'ab',
  'the track filter still works'
);
check(
  ids(filterQuestions(Q, { difficulty: 'medium' }, P, TODAY)) === 'bc',
  'the difficulty filter still works'
);
// filters compose, rather than the last one winning
check(
  ids(filterQuestions(Q, { track: 'python', status: 'todo' }, P, TODAY)) === 'b',
  'track and status compose'
);
check(
  ids(filterQuestions(Q, { query: 'hash', status: 'todo' }, P, TODAY)) === 'b',
  'text and status compose'
);
check(
  filterQuestions(Q, { track: 'sql', status: 'solved' }, P, TODAY).length === 0,
  'a combination with no answer returns nothing, not everything'
);

// ---- counts ----
const c = statusCounts(Q, {}, P, TODAY);
check(c.all === 4 && c.todo === 2 && c.solved === 2 && c.due === 1 && c.weak === 1, `counts are right (${JSON.stringify(c)})`);
// counts respect the OTHER filters, so a chip never promises rows a click can't show
const cPy = statusCounts(Q, { track: 'python' }, P, TODAY);
check(cPy.all === 2 && cPy.solved === 1, 'counts narrow with the other filters');
for (const { key } of STATUSES) {
  const n = filterQuestions(Q, { status: key }, P, TODAY).length;
  if (n !== c[key]) check(false, `count for "${key}" matches what the filter returns`);
}
check(true, 'every chip count equals the rows that chip actually shows');

// ---- against the real bank ----
check(
  filterQuestions(SEED_QUESTIONS, { query: 'two sum' }).length >= 1,
  'the real bank is searchable by title'
);
check(
  filterQuestions(SEED_QUESTIONS, { status: 'todo' }, { solved: {}, srs: {} }).length ===
    SEED_QUESTIONS.length,
  'with nothing solved, everything is to-do'
);
check(
  filterQuestions(SEED_QUESTIONS, { track: 'sql' }).every((q) => q.track === 'sql'),
  'a track filter over the real bank never leaks another track'
);

console.log(failures === 0 ? 'All filter tests green.' : `${failures} filter test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
