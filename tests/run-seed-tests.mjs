// The Phase 4 verification gate: every seed question's reference solution must
// pass its own tests through the real runner logic. Wired as `npm test`.
import { SEED_QUESTIONS } from '../src/data/questions.js';
import { validateQuestion } from '../src/data/validateQuestion.js';
import { runPy, runSql } from './engines.mjs';

let failures = 0;
const say = (ok, label, detail = '') => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

console.log('ZoroClaude Dojo — seed bank verification\n');

// ---- bank shape ----
const counts = { python: 0, pandas: 0, sql: 0 };
const seenIds = [];
for (const q of SEED_QUESTIONS) {
  const errors = validateQuestion(q, { existingIds: seenIds });
  if (errors.length) say(false, `${q.id || '(no id)'} schema`, errors.join('; '));
  seenIds.push(q.id);
  counts[q.track] = (counts[q.track] || 0) + 1;
}
say(SEED_QUESTIONS.length >= 30, `bank has ${SEED_QUESTIONS.length} questions (need ≥ 30)`);
say(counts.python >= 14, `python track: ${counts.python} (need ≥ 14)`);
say(counts.pandas >= 8, `pandas track: ${counts.pandas} (need ≥ 8)`);
say(counts.sql >= 8, `sql track: ${counts.sql} (need ≥ 8)`);

// ---- every reference solution passes through the real runners ----
async function verify(q, code) {
  return q.track === 'sql' ? runSql(q, code) : runPy(q, code);
}
function reportDetail(report) {
  if (report.status === 'error') return `${report.errorType}: ${report.message}`;
  return (
    (report.results || [])
      .map((r, i) => (r.pass ? null : `test ${i + 1}: expected ${r.expectedRepr} got ${r.gotRepr}${r.error ? ` (${r.error})` : ''}`))
      .filter(Boolean)
      .join(' | ') || 'failed'
  );
}

console.log('\nRunning reference solutions through the real engines:');
let approachChecks = 0;
for (const q of SEED_QUESTIONS) {
  try {
    const report = await verify(q, q.solution);
    say(report.allPassed, `${q.id} (${q.track})`, report.allPassed ? '' : reportDetail(report));
    // Every alternative approach must ALSO be a correct solution.
    for (const a of q.approaches || []) {
      const ar = await verify(q, a.code);
      approachChecks++;
      say(ar.allPassed, `  ↳ ${q.id} · ${a.name}`, ar.allPassed ? '' : reportDetail(ar));
    }
  } catch (err) {
    say(false, `${q.id} (${q.track})`, `engine error: ${err.message}`);
  }
}
console.log(`\n(verified ${approachChecks} alternative approaches)`);

// ---- the gate itself must be able to fail: sabotage checks ----
console.log('\nSabotage checks (a broken solution must NOT pass):');
{
  const q = SEED_QUESTIONS.find((x) => x.id === 'py-two-sum');
  const r = await runPy(q, 'def two_sum(nums, target):\n    return [0, 0]');
  say(!r.allPassed, 'wrong python solution rejected');
  const r2 = await runPy(q, 'def wrong_name(nums, target):\n    return [0, 1]');
  say(r2.errorType === 'missing_function', 'renamed function detected');
  const r3 = await runPy(q, 'def two_sum(nums, target:\n    pass');
  say(r3.errorType === 'syntax', 'syntax error detected');
}
{
  const q = SEED_QUESTIONS.find((x) => x.id === 'sql-select-where');
  const r = await runSql(q, 'SELECT name, power FROM fighters ORDER BY power DESC');
  say(!r.allPassed, 'wrong sql solution rejected');
  const r2 = await runSql(q, 'SELEC oops');
  say(r2.errorType === 'sql', 'sql error surfaced', r2.message);
}

console.log(
  failures === 0
    ? `\nAll green — ${SEED_QUESTIONS.length} questions verified.`
    : `\n${failures} FAILURE(S).`
);
process.exit(failures === 0 ? 0 : 1);
