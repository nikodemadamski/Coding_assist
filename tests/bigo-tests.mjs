// Unit tests for the Big-O bucket classifier + full-bank complexity coverage.
import { bigOBucket, timePart, BIGO_BUCKETS } from '../src/state/bigo.js';
import { optimalComplexity } from '../src/state/mockSession.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.error(`  FAIL - ${name}`);
  }
}

console.log('bigo-tests: timePart');
check('takes everything before "time"', timePart('O(n) time, O(n) space') === 'O(n)');
check('whole string when no "time" word', timePart('O(n log n) — the ORDER BY dominates') === 'O(n log n) — the ORDER BY dominates');
check('empty in, empty out', timePart('') === '');

console.log('bigo-tests: buckets');
const cases = [
  ['O(n) time, O(n) space', 'O(n)'],
  ['O(n + m) time, O(n) space', 'O(n)'],
  ['O(V + E) time, O(V + E) space', 'O(n)'],
  ['O(max(n, m)) time, O(max(n, m)) space', 'O(n)'],
  ['O(log n) time, O(1) space', 'O(log n)'],
  ['O(log(m·n)) time, O(1) space', 'O(log n)'],
  ['O(n log n) time, O(n) space', 'O(n log n)'],
  ['O(N log k) time — N total nodes, k lists; O(k) space', 'O(n log n)'],
  ['O(n log m) time — m = largest pile, O(1) space', 'O(n log n)'],
  ['O(n²) time, O(1) space', 'O(n²)'],
  ['O(1) per operation, O(n) space', 'O(1)'],
  ['O(32) ≈ O(1) time, O(1) space', 'O(1)'],
  ['O(26) time', 'O(1)'],
  ['O(n · 2ⁿ) time and space', 'O(2ⁿ)+'],
  ['O(n · n!) time and space', 'O(2ⁿ)+'],
  ['O(4ⁿ/√n) time — Catalan growth', 'O(2ⁿ)+'],
  ['O(2^t) time — t grows with target, O(t) recursion depth', 'O(2ⁿ)+'],
  ['O(n) — full-table scan', 'O(n)'],
  ['O(n log n) — the ORDER BY dominates', 'O(n log n)'],
  // honest refusals: product/height/length bounds aren't gradeable buckets
  ['O(m·n) time, O(m·n) space', null],
  ['O(n·k) time, O(n·k) space — k = longest word', null],
  ['O(amount · coins) time, O(amount) space', null],
  ['O(h) time, O(1) space', null],
  ['O(L) per operation — L = word length', null],
  ['O(h + k) time, O(h) space', null],
  ['O(k) time — k set bits, O(1) space', null],
];
for (const [input, expected] of cases) {
  const got = bigOBucket(input);
  check(`${input} -> ${expected}`, got === expected);
}
check('every graded bucket is a real option', cases.every(([, e]) => e === null || BIGO_BUCKETS.includes(e)));

console.log('bigo-tests: full-bank coverage');
{
  const missing = SEED_QUESTIONS.filter((q) => !optimalComplexity(q));
  check(`all ${SEED_QUESTIONS.length} questions carry a model complexity`, missing.length === 0);
  if (missing.length) console.error('    missing:', missing.map((q) => q.id).join(', '));
  const gradeable = SEED_QUESTIONS.filter((q) => bigOBucket(optimalComplexity(q)) !== null).length;
  check(`most of the bank is auto-gradeable (${gradeable}/${SEED_QUESTIONS.length})`, gradeable >= SEED_QUESTIONS.length * 0.6);
}

if (failures) {
  console.error(`bigo-tests: ${failures} failure(s)`);
  process.exit(1);
}
console.log('bigo-tests: all passed');
