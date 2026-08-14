// **The interpreter must survive anything a learner can type.**
//
// The bug this suite exists to prevent: SystemExit is a BaseException, not an
// Exception, so exit() / quit() / sys.exit() escaped the harness's
// `except Exception`, reached Emscripten, and ended the WebAssembly program.
// After that the Pyodide instance was dead but still cached — so every later
// run in that worker failed identically with "program terminated with exit(1)".
// A learner who typed exit() once was locked out of the app: correct solutions
// afterwards were reported as failures, because they never reached Python.
//
// These tests run the REAL harnesses through the REAL engine, and after every
// hostile input they re-run a known-good solution. If the interpreter died, the
// follow-up run is what catches it.
import { runPy, runPySnippet } from './engines.mjs';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

const QUESTION = {
  track: 'python',
  function_name: 'two_sum',
  tests: [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { args: [[3, 3], 6], expected: [0, 1] },
  ],
};

const GOOD = `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []`;

// A hostile input may make the engine THROW rather than return — and if the
// interpreter died, the throw is what we would see. Catching it here means the
// suite reports the death instead of dying with it.
async function statusOf(code) {
  try {
    const r = await runPy(QUESTION, code);
    if (r.status === 'error') return `reported:${r.errorType}`;
    if (r.status === 'ok' || r.results) {
      return (r.allPassed ?? r.results?.every((x) => x.pass)) ? 'pass' : 'fail';
    }
    return r.status;
  } catch (e) {
    return `THREW:${String(e?.message || e).split('\n').pop().slice(0, 60)}`;
  }
}

// What we require of hostile input: it must NOT be reported as a pass, and it
// must not have thrown out of the engine. Being reported as an error or as a
// failing run are both fine — that is the harness doing its job.
const contained = (s) => s !== 'pass' && !s.startsWith('THREW:');

console.log('\nRuntime survival: code that used to kill the interpreter');

// Each hostile input is followed by the known-good solution. The second half of
// every pair is the real assertion — it only passes if Python is still alive.
const HOSTILE = [
  ['exit() at the top level', 'def two_sum(nums, target):\n    return [0, 1]\nexit()'],
  ['quit() at the top level', 'def two_sum(nums, target):\n    return [0, 1]\nquit()'],
  ['sys.exit() with a code', 'import sys\ndef two_sum(nums, target):\n    return [0, 1]\nsys.exit(2)'],
  ['exit() inside the function under test', 'def two_sum(nums, target):\n    exit()'],
  ['raise SystemExit directly', 'def two_sum(nums, target):\n    return [0, 1]\nraise SystemExit'],
  ['SystemExit raised inside the function', 'def two_sum(nums, target):\n    raise SystemExit(1)'],
  ['a bare BaseException', 'def two_sum(nums, target):\n    raise BaseException("boom")'],
];

check((await statusOf(GOOD)) === 'pass', 'the known-good solution passes to begin with');

for (const [label, code] of HOSTILE) {
  const s = await statusOf(code);
  check(contained(s), `${label} is contained and reported (got ${s})`);
  check((await statusOf(GOOD)) === 'pass', `  ↳ and a correct solution still passes afterwards`);
}

// Ordinary mistakes must keep behaving exactly as before — the fix must not
// have turned real errors into something else.
console.log('\nOrdinary errors still behave normally');
check((await statusOf('def two_sum(nums, target):\n    return nope')) === 'fail', 'a NameError still fails the tests');
check(contained(await statusOf('def two_sum(nums, target)\n    return []')), 'a syntax error is still reported');
check(contained(await statusOf('def wrong_name(nums, target):\n    return []')), 'a renamed function is still caught');
check((await statusOf(GOOD)) === 'pass', 'and the runtime is still healthy at the end');

// The lesson-snippet harness shares the same hole and the same fix.
console.log('\nLesson snippets');
{
  const before = await runPySnippet('print("hello")');
  check(before.status === 'ok' && before.stdout.includes('hello'), 'a snippet runs');
  const exited = await runPySnippet('print("bye")\nexit()');
  check(exited.status === 'error', 'a snippet calling exit() reports an error');
  const after = await runPySnippet('print("still here")');
  check(
    after.status === 'ok' && after.stdout.includes('still here'),
    '  ↳ and the runtime survives it',
  );
}

console.log(failures ? `\n${failures} FAILED` : '\nRuntime survival: all green.');
if (failures) process.exit(1);
