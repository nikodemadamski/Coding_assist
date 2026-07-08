// Verifies the visualizer's execution tracer: real steps, correct lines,
// variable snapshots, and the infinite-loop step cap.
import './proxy-shim.mjs';
import { PY_TRACE_HARNESS, buildTracePayload } from '../src/engine/pyHarness.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Visualizer trace tests\n');

const { loadPyodide } = await import('pyodide');
const pyodide = await loadPyodide();

async function trace(question, code, testIndex) {
  pyodide.globals.set('PAYLOAD_JSON', JSON.stringify(buildTracePayload(question, code, testIndex)));
  return JSON.parse(await pyodide.runPythonAsync(PY_TRACE_HARNESS));
}

const twoSum = SEED_QUESTIONS.find((q) => q.id === 'py-two-sum');

// ---- happy path: optimal solution, first test ----
{
  const t = await trace(twoSum, twoSum.solution, 0);
  check(t.status === 'ok', 'trace runs the reference solution');
  check(Array.isArray(t.steps) && t.steps.length >= 4, `captures steps (${t.steps?.length})`);
  check(t.truncated === false, 'not truncated');
  check(
    t.steps.every((s) => s.line >= 1 && s.line <= t.lines.length),
    'every step line maps into the source'
  );
  const withSeen = t.steps.filter((s) => 'seen' in s.locals);
  check(withSeen.length > 0, "captures the 'seen' dict as it grows");
  const last = withSeen[withSeen.length - 1];
  check(
    last.locals.seen.__dict__ !== undefined,
    'dict snapshot uses the __dict__ marker',
    JSON.stringify(last.locals.seen)
  );
  check(JSON.stringify(t.result) === JSON.stringify([0, 1]), `traced result is the answer (${JSON.stringify(t.result)})`);
}

// ---- brute-force approach traces too ----
{
  const brute = twoSum.approaches.find((a) => a.name === 'Brute force');
  const t = await trace(twoSum, brute.code, 1);
  check(t.status === 'ok' && t.steps.length > 0, 'brute-force approach traces');
  check(
    t.steps.some((s) => 'i' in s.locals && 'j' in s.locals),
    'nested-loop indices i and j appear in snapshots'
  );
}

// ---- sets get the __set__ marker ----
{
  const dup = SEED_QUESTIONS.find((q) => q.id === 'py-contains-duplicate');
  const manual =
    'def contains_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return True\n        seen.add(n)\n    return False';
  const t = await trace(dup, manual, 0);
  check(
    t.steps.some((s) => s.locals.seen && s.locals.seen.__set__ !== undefined),
    'set snapshot uses the __set__ marker'
  );
}

// ---- infinite loop is capped, not hung ----
{
  const t = await trace(twoSum, 'def two_sum(nums, target):\n    while True:\n        pass', 0);
  check(t.status === 'ok' && t.truncated === true, 'infinite loop is truncated by the step cap');
  check(t.steps.length === 400, `capped at MAX_STEPS (${t.steps.length})`);
}

// ---- broken code reports an error, not a crash ----
{
  const t = await trace(twoSum, 'def two_sum(nums, target:\n    pass', 0);
  check(t.status === 'error', 'syntax error surfaces as a trace error');
  const t2 = await trace(twoSum, 'def other(nums, target):\n    pass', 0);
  check(t2.status === 'error' && t2.message.includes('two_sum'), 'missing function reported');
}

console.log(failures === 0 ? '\nAll trace tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
