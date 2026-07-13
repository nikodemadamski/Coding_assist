// Lesson gate: every lesson passes the schema, and every code artifact is
// EXECUTED through the real engine — read examples print exactly what they
// claim, predict answers match true stdout via the SAME checker the UI uses,
// type answers compile, fix bugs are real (broken fails, solution passes),
// write/watch code passes its tests.
import './proxy-shim.mjs';
import { LESSONS, LESSON_CHAPTERS, itemAsQuestion } from '../src/data/lessons.js';
import { validateLesson } from '../src/data/validateLesson.js';
import { checkAnswer, WARMUP_SETS } from '../src/data/warmups.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';
import { wrapForCompile } from './py-compile.mjs';
import { runPy, runPySnippet } from './engines.mjs';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Lesson tests\n');

// ---- schema ----
{
  const chapterKeys = LESSON_CHAPTERS.map((c) => c.key);
  const seen = [];
  let schemaErrors = [];
  for (const lesson of LESSONS) {
    const errors = validateLesson(lesson, {
      existingIds: seen,
      chapterKeys,
      earlierIds: [...seen],
    });
    if (errors.length) schemaErrors.push(`${lesson.id}: ${errors.join('; ')}`);
    seen.push(lesson.id);
  }
  check(schemaErrors.length === 0, 'every lesson passes validateLesson', schemaErrors.slice(0, 3).join(' | '));
  const perChapter = Object.fromEntries(chapterKeys.map((k) => [k, 0]));
  for (const l of LESSONS) perChapter[l.chapter]++;
  const populated = chapterKeys.filter((k) => perChapter[k] > 0);
  for (const k of populated) {
    check(perChapter[k] >= 5, `chapter ${k} has a real lesson count (${perChapter[k]})`);
  }
}

// ---- chapter-end transfer links point at real targets ----
{
  const qIds = new Set(SEED_QUESTIONS.map((q) => q.id));
  const bad = [];
  for (const lesson of LESSONS) {
    if (!lesson.transfer) continue;
    if (!WARMUP_SETS[lesson.transfer.warmup]) {
      bad.push(`${lesson.id}: warm-up level "${lesson.transfer.warmup}" does not exist`);
    }
    if (lesson.transfer.question && !qIds.has(lesson.transfer.question)) {
      bad.push(`${lesson.id}: question "${lesson.transfer.question}" does not exist`);
    }
  }
  check(bad.length === 0, 'every transfer link points at a real target', bad.slice(0, 3).join(' | '));
}

// ---- every read example prints exactly what it claims ----
{
  const bad = [];
  for (const lesson of LESSONS) {
    const { code, expectedOutput } = lesson.read.example;
    const res = await runPySnippet(code);
    if (res.status !== 'ok' || res.stdout.trim() !== expectedOutput.trim()) {
      bad.push(`${lesson.id}: got ${JSON.stringify(res.stdout ?? res.message)} wanted ${JSON.stringify(expectedOutput)}`);
    }
  }
  check(bad.length === 0, 'every read example prints its claimed output', bad.slice(0, 3).join(' | '));
}

// ---- predict: true stdout satisfies the app's own checker ----
{
  const bad = [];
  for (const lesson of LESSONS) {
    for (const [i, item] of lesson.items.entries()) {
      if (item.type !== 'predict') continue;
      const res = await runPySnippet(item.code);
      if (res.status !== 'ok') {
        bad.push(`${lesson.id} item ${i + 1}: snippet errored (${res.message})`);
        continue;
      }
      if (!checkAnswer(item, res.stdout.trim())) {
        bad.push(
          `${lesson.id} item ${i + 1}: real output ${JSON.stringify(res.stdout.trim())} does not match answer ${JSON.stringify(item.answer)}`
        );
      }
    }
  }
  check(bad.length === 0, 'every predict answer matches the real stdout', bad.slice(0, 3).join(' | '));
}

// ---- type: answers and accepts compile as Python ----
{
  const { loadPyodide } = await import('pyodide');
  const pyodide = await loadPyodide();
  pyodide.globals.set('_src', '');
  const compiles = (code) => {
    pyodide.globals.set('_src', code);
    return pyodide.runPython('__import__("builtins").compile(_src, "<lesson>", "exec") and True');
  };
  const bad = [];
  for (const lesson of LESSONS) {
    for (const [i, item] of lesson.items.entries()) {
      if (item.type !== 'type') continue;
      for (const ans of [item.answer, ...(item.accept ?? [])]) {
        try {
          compiles(wrapForCompile(ans));
        } catch (err) {
          bad.push(`${lesson.id} item ${i + 1}: ${ans} (${String(err).split('\n')[0]})`);
        }
      }
    }
  }
  check(bad.length === 0, 'every type answer compiles as Python', bad.slice(0, 3).join(' | '));
}

// ---- fix / write / watch: run through the real question engine ----
{
  const bad = [];
  for (const lesson of LESSONS) {
    for (const [i, item] of lesson.items.entries()) {
      if (!['fix', 'write', 'watch'].includes(item.type)) continue;
      const q = itemAsQuestion(lesson, item, i);
      if (item.type === 'fix') {
        const broken = await runPy(q, item.code);
        if (broken.allPassed) bad.push(`${lesson.id} item ${i + 1}: the "broken" code already passes — no real bug`);
        const fixed = await runPy(q, item.solution);
        if (!fixed.allPassed) bad.push(`${lesson.id} item ${i + 1}: the fix solution FAILS its tests`);
      } else {
        const code = item.type === 'watch' ? item.code : item.solution;
        const rep = await runPy(q, code);
        if (!rep.allPassed) bad.push(`${lesson.id} item ${i + 1} (${item.type}): code fails its tests`);
      }
    }
  }
  check(bad.length === 0, 'every fix/write/watch runs green through the engine', bad.slice(0, 3).join(' | '));
}

console.log(failures === 0 ? `\nAll lesson tests green (${LESSONS.length} lessons).` : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
