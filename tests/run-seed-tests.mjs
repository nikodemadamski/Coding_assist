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
console.log('\nRunning reference solutions through the real engines:');
for (const q of SEED_QUESTIONS) {
  try {
    const report =
      q.track === 'sql' ? await runSql(q, q.solution) : await runPy(q, q.solution);
    if (report.allPassed) {
      say(true, `${q.id} (${q.track})`);
    } else if (report.status === 'error') {
      say(false, `${q.id} (${q.track})`, `${report.errorType}: ${report.message}`);
    } else {
      const bad = (report.results || [])
        .map((r, i) => (r.pass ? null : `test ${i + 1}: expected ${r.expectedRepr} got ${r.gotRepr}${r.error ? ` (${r.error})` : ''}`))
        .filter(Boolean)
        .join(' | ');
      say(false, `${q.id} (${q.track})`, bad || 'failed');
    }
  } catch (err) {
    say(false, `${q.id} (${q.track})`, `engine error: ${err.message}`);
  }
}

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
