// Warm-up bank gate: 50 questions per level, unique prompts, every accepted
// answer passes its own checker, the normalizer is quote/whitespace-forgiving
// but not sloppy — every python answer compiles, every SQL answer executes.
import './proxy-shim.mjs';
import { WARMUP_SETS, WARMUP_LEVELS, checkAnswer, normalizeAnswer } from '../src/data/warmups.js';
import { wrapForCompile } from './py-compile.mjs';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Warm-up tests\n');

// ---- bank shape ----
const foldOf = (level) => ({ foldCase: level.track === 'sql' });
for (const level of WARMUP_LEVELS) {
  const set = WARMUP_SETS[level.key];
  check(set?.length === 50, `${level.key}: exactly 50 questions (${set?.length})`);
  const prompts = new Set(set.map((i) => i.prompt));
  check(prompts.size === set.length, `${level.key}: no duplicate prompts`);
  const canonicals = set.filter((i) => checkAnswer(i, i.answer, foldOf(level))).length;
  check(canonicals === set.length, `${level.key}: every canonical answer passes its own check`);
  const badAccept = set.flatMap((i) => (i.accept ?? []).filter((a) => !checkAnswer(i, a, foldOf(level))));
  check(badAccept.length === 0, `${level.key}: every accept variant passes`, badAccept.join(' | '));
}

// ---- SQL case folding ----
{
  const item = { prompt: '', answer: 'select name from crew' };
  check(checkAnswer(item, 'SELECT name FROM crew', { foldCase: true }), 'SQL keywords are case-insensitive');
  check(!checkAnswer(item, 'SELECT NAME FROM CREW', { foldCase: false }), 'python stays case-sensitive');
  const lit = { prompt: '', answer: "select * from crew where name = 'zoro'" };
  check(!checkAnswer(lit, "SELECT * FROM crew WHERE name = 'ZORO'", { foldCase: true }), 'case inside SQL string literals still matters');
}

// ---- normalizer behaviour ----
{
  const item = { prompt: '', answer: 'nums = []', accept: ['nums = list()'] };
  check(checkAnswer(item, 'nums=[]'), 'spacing is forgiven (nums=[] == nums = [])');
  check(checkAnswer(item, '  nums   =  [ ]  '), 'extra whitespace forgiven');
  check(checkAnswer(item, 'nums = list()'), 'accept variant works');
  check(!checkAnswer(item, 'nums = {}'), 'wrong answer rejected');
  check(!checkAnswer(item, ''), 'empty input rejected');

  const str = { prompt: '', answer: "name = 'zoro'" };
  check(checkAnswer(str, 'name = "zoro"'), 'double quotes count as single quotes');
  check(!checkAnswer(str, "name = 'Zoro'"), 'case inside strings still matters');

  const join = { prompt: '', answer: "' '.join(words)" };
  check(checkAnswer(join, '" ".join( words )'), 'spaces outside quotes forgiven on join');
  check(!checkAnswer(join, "''.join(words)"), 'the space INSIDE the quotes is preserved and required');

  check(normalizeAnswer('for n in nums:') === normalizeAnswer('for n in nums :'), 'header spacing forgiven');
  check(normalizeAnswer('x==5') === normalizeAnswer('x == 5'), 'operator spacing forgiven');
}

// ---- every answer is real, compilable Python ----
// (wrapping shared with the lesson gate — see tests/py-compile.mjs)

const { loadPyodide } = await import('pyodide');
const pyodide = await loadPyodide();
pyodide.globals.set('_wrapped', '');
const compiles = (code) => {
  pyodide.globals.set('_wrapped', code);
  return pyodide.runPython('__import__("builtins").compile(_wrapped, "<warmup>", "exec") and True');
};

for (const level of WARMUP_LEVELS.filter((l) => l.track === 'python')) {
  const bad = [];
  for (const item of WARMUP_SETS[level.key]) {
    for (const ans of [item.answer, ...(item.accept ?? [])]) {
      try {
        compiles(wrapForCompile(ans));
      } catch (err) {
        bad.push(`${ans}  (${String(err).split('\n')[0]})`);
      }
    }
  }
  check(bad.length === 0, `${level.key}: every answer compiles as Python`, bad.slice(0, 3).join(' | '));
}

// ---- every pandas answer executes against the real DataFrames ----
{
  const { runPandasSnippets } = await import('./engines.mjs');
  const { WARMUP_PD_PRELUDE } = await import('../src/data/warmups-pandas.js');
  for (const level of WARMUP_LEVELS.filter((l) => l.track === 'pandas')) {
    const answers = WARMUP_SETS[level.key].flatMap((i) => [i.answer, ...(i.accept ?? [])]);
    const bad = await runPandasSnippets(WARMUP_PD_PRELUDE, answers);
    check(
      bad.length === 0,
      `${level.key}: every answer executes against the real DataFrames`,
      bad.slice(0, 3).join(' | ')
    );
  }
}

// ---- every SQL answer executes against the warm-up schema ----
{
  const initSqlJs = (await import('sql.js')).default;
  const { WARMUP_SQL_SCHEMA } = await import('../src/data/warmups-sql.js');
  const SQL = await initSqlJs();
  for (const level of WARMUP_LEVELS.filter((l) => l.track === 'sql')) {
    const bad = [];
    for (const item of WARMUP_SETS[level.key]) {
      for (const ans of [item.answer, ...(item.accept ?? [])]) {
        const db = new SQL.Database();
        try {
          db.run(WARMUP_SQL_SCHEMA);
          db.exec(ans);
        } catch (err) {
          bad.push(`${ans}  (${String(err).split('\n')[0]})`);
        } finally {
          db.close();
        }
      }
    }
    check(bad.length === 0, `${level.key}: every answer executes as real SQLite`, bad.slice(0, 3).join(' | '));
  }
}

// ---- no two questions in a level collide after normalization ----
// (a shuffled run must never show a prompt whose accepted answer also
// satisfies a different prompt's canonical answer exactly)
for (const level of WARMUP_LEVELS) {
  const set = WARMUP_SETS[level.key];
  const collisions = [];
  for (let i = 0; i < set.length; i++) {
    for (let j = 0; j < set.length; j++) {
      if (i !== j && checkAnswer(set[j], set[i].answer, foldOf(level))) {
        collisions.push(`"${set[i].answer}" also answers "${set[j].prompt}"`);
      }
    }
  }
  check(collisions.length === 0, `${level.key}: no ambiguous answers across prompts`, collisions.slice(0, 3).join(' | '));
}

console.log(failures === 0 ? '\nAll warm-up tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
