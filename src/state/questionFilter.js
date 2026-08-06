// Finding one question in a hundred and fifty-nine.
//
// Browse could filter by track and by difficulty — neither of which is what you
// actually ask it. The real questions are "where's that dictionary one", "what
// haven't I done yet", and "what's biting me". So: a text match over title,
// pattern and track, plus a status axis derived from your own record.
//
// Pure, so tests/filter-tests.mjs can pin every rule without a browser.
import { isDue, isSolved, todayStr } from './progress.js';

export const STATUSES = [
  { key: 'all', label: 'all' },
  { key: 'todo', label: 'not solved' },
  { key: 'due', label: 'due' },
  { key: 'weak', label: 'keeps biting' },
  { key: 'solved', label: 'solved' },
];

// One question's standing, as this app understands it. `due` and `weak` are
// deliberately allowed to overlap `solved` — a solved question can still be due
// for review, and that's the whole point of the review system.
export function questionStatus(progress, q, today = todayStr()) {
  const entry = progress.solved?.[q.id];
  return {
    solved: isSolved(entry),
    due: isDue(progress.srs?.[q.id], today),
    mistakes: entry?.mistakes || 0,
  };
}

function matchesStatus(status, st) {
  switch (status) {
    case 'todo':
      return !st.solved;
    case 'due':
      return st.due;
    case 'weak':
      return st.mistakes > 0;
    case 'solved':
      return st.solved;
    default:
      return true;
  }
}

// Case- and punctuation-insensitive: typing "two sum", "twosum" or "TWO-SUM"
// should all find the same question, because none of those is wrong.
function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function matchesText(q, query) {
  const needle = norm(query);
  if (!needle) return true;
  return (
    norm(q.title).includes(needle) ||
    norm(q.pattern).includes(needle) ||
    norm(q.track).includes(needle) ||
    norm(q.difficulty).includes(needle)
  );
}

// The whole filter, in one pass. Returns the matching questions in the order
// they were given — callers own the sort.
export function filterQuestions(
  questions,
  { track = 'all', difficulty = 'all', status = 'all', query = '' } = {},
  progress = { solved: {}, srs: {} },
  today = todayStr()
) {
  return questions.filter((q) => {
    if (track !== 'all' && q.track !== track) return false;
    if (difficulty !== 'all' && q.difficulty !== difficulty) return false;
    if (!matchesText(q, query)) return false;
    if (status === 'all') return true;
    return matchesStatus(status, questionStatus(progress, q, today));
  });
}

// How many questions each status would return under the *other* active
// filters. Shown on the chips, so you can see there's nothing due before you
// click "due" and stare at an empty list.
export function statusCounts(questions, filters = {}, progress = {}, today = todayStr()) {
  const base = filterQuestions(questions, { ...filters, status: 'all' }, progress, today);
  const counts = {};
  for (const { key } of STATUSES) {
    counts[key] =
      key === 'all'
        ? base.length
        : base.filter((q) => matchesStatus(key, questionStatus(progress, q, today))).length;
  }
  return counts;
}
