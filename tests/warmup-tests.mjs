// Warm-up bank gate: 50 questions per level, unique prompts, every accepted
// answer passes its own checker, the normalizer is quote/whitespace-forgiving
// but not sloppy — and every single answer compiles as real Python.
import './proxy-shim.mjs';
import { WARMUP_SETS, WARMUP_LEVELS, checkAnswer, normalizeAnswer } from '../src/data/warmups.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Warm-up tests\n');

// ---- bank shape ----
for (const level of WARMUP_LEVELS) {
  const set = WARMUP_SETS[level.key];
  check(set?.length === 50, `${level.key}: exactly 50 questions (${set?.length})`);
  const prompts = new Set(set.map((i) => i.prompt));
  check(prompts.size === set.length, `${level.key}: no duplicate prompts`);
  const canonicals = set.filter((i) => checkAnswer(i, i.answer)).length;
  check(canonicals === set.length, `${level.key}: every canonical answer passes its own check`);
  const badAccept = set.flatMap((i) => (i.accept ?? []).filter((a) => !checkAnswer(i, a)));
  check(badAccept.length === 0, `${level.key}: every accept variant passes`, badAccept.join(' | '));
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
// Snippets are single lines out of context, so wrap just enough to compile:
// block headers get a body, `except` gets a `try`, decorators get a function,
// return/yield/global go inside a def.
function wrapForCompile(code) {
  if (code.startsWith('except')) {
    return `try:\n    pass\n${code}\n    pass`;
  }
  if (code.startsWith('@')) {
    return `${code}\ndef _f():\n    pass`;
  }
  if (/^(return|yield|global)\b/.test(code)) {
    return `def _f():\n    ${code}`;
  }
  if (code.endsWith(':')) {
    const body = `${code}\n    pass`;
    return code.startsWith('try') ? `${body}\nexcept Exception:\n    pass` : body;
  }
  return code;
}

const { loadPyodide } = await import('pyodide');
const pyodide = await loadPyodide();
pyodide.globals.set('_wrapped', '');
const compiles = (code) => {
  pyodide.globals.set('_wrapped', code);
  return pyodide.runPython('__import__("builtins").compile(_wrapped, "<warmup>", "exec") and True');
};

for (const level of WARMUP_LEVELS) {
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

// ---- no two questions in a level collide after normalization ----
// (a shuffled run must never show a prompt whose accepted answer also
// satisfies a different prompt's canonical answer exactly)
for (const level of WARMUP_LEVELS) {
  const set = WARMUP_SETS[level.key];
  const collisions = [];
  for (let i = 0; i < set.length; i++) {
    for (let j = 0; j < set.length; j++) {
      if (i !== j && checkAnswer(set[j], set[i].answer)) {
        collisions.push(`"${set[i].answer}" also answers "${set[j].prompt}"`);
      }
    }
  }
  check(collisions.length === 0, `${level.key}: no ambiguous answers across prompts`, collisions.slice(0, 3).join(' | '));
}

console.log(failures === 0 ? '\nAll warm-up tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
