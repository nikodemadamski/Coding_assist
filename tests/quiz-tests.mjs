// The pattern quiz must always offer the correct answer among its options, and
// draw distinct, quizzable questions.
import { isQuizzable, buildQuizItem, buildQuizRound } from '../src/state/patternQuiz.js';
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

// ---- only quizzable (algorithm) questions are used ----
{
  const sql = SEED_QUESTIONS.find((q) => q.track === 'sql');
  check(sql && !isQuizzable(sql), 'SQL questions are excluded from the quiz');
  const quizzable = SEED_QUESTIONS.filter(isQuizzable);
  check(quizzable.length >= 80, `plenty of quizzable questions (${quizzable.length})`);
  check(quizzable.every((q) => q.track === 'python'), 'all quizzable questions are python');
}

console.log(failures === 0 ? '\nAll quiz tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
