// Pure tests for the call-signature reader behind the test console.
import { paramNames, argLabel, argToText, parseArgs, caseSummary } from '../src/data/signature.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), `${label} (${JSON.stringify(a)})`);

console.log('Signature tests');

eq(
  paramNames({ function_name: 'two_sum', starter_code: 'def two_sum(nums, target):\n    pass' }),
  ['nums', 'target'],
  'plain positional parameters'
);
eq(
  paramNames({
    function_name: 'f',
    starter_code: 'def f(items: list[int], k: int = 3) -> list[int]:\n    pass',
  }),
  ['items', 'k'],
  'annotations, defaults and a return type are stripped'
);
eq(
  paramNames({ function_name: 'f', starter_code: 'def f(m: Dict[str, int], n):\n    pass' }),
  ['m', 'n'],
  'a comma inside an annotation does not split a parameter'
);
eq(
  paramNames({
    function_name: 'f',
    starter_code: 'def f(\n    a,\n    b,\n):\n    pass',
  }),
  ['a', 'b'],
  'a signature broken across lines still reads'
);
eq(paramNames({ function_name: 'f', starter_code: 'SELECT 1' }), [], 'no signature -> no names');
eq(paramNames({}), [], 'a question with no starter code -> no names');
// A helper method above the target function must not be mistaken for it.
eq(
  paramNames({
    function_name: 'solve',
    starter_code: 'def helper(x, y):\n    pass\n\ndef solve(grid):\n    pass',
  }),
  ['grid'],
  'the named function is found, not the first def in the file'
);

check(argLabel(['nums'], 0) === 'nums', 'a known parameter uses its real name');
check(argLabel(['nums'], 1) === 'arg 2', 'an unknown parameter falls back to a positional label');

check(argToText([2, 7]) === '[2, 7]', 'args render as spaced JSON, for reading');
check(argToText([[1, 2], [3]]) === '[[1, 2], [3]]', 'nested lists keep the spacing');
check(argToText({ a: 1 }) === '{"a": 1}', 'objects render as JSON too');
check(argToText('a,b') === '"a,b"', 'a comma inside a string is left alone');
check(JSON.parse(argToText([[1, 2], null, 'x'])).length === 3, 'the rendered text is still valid JSON');
check(argToText(undefined) === 'null', 'a missing arg renders as null, never undefined');

eq(parseArgs(['[2, 7, 11, 15]', '9']).args, [[2, 7, 11, 15], 9], 'valid input parses to real values');
check(parseArgs(['[1,2]', '']).error?.includes('empty'), 'an empty box is reported, not silently dropped');
check(
  parseArgs(['[1,2', '3'], ['nums', 'target']).error?.includes('nums'),
  'a malformed box is named in the error'
);
check(
  parseArgs(['[1,2]', 'oops'], ['nums', 'target']).error?.includes('target'),
  'the second box is named when it is the broken one'
);
check(parseArgs([]).args.length === 0, 'a zero-argument call is valid');

check(
  caseSummary({ args: [[2, 7], 9] }, ['nums', 'target']) === 'nums = [2, 7], target = 9',
  'a case summarises as named arguments'
);

// Every python/pandas seed question should expose a readable signature — that
// is what lets the console label real cases instead of "arg 1".
const codeQs = SEED_QUESTIONS.filter((q) => q.track !== 'sql' && q.function_name);
const unreadable = codeQs.filter((q) => paramNames(q).length === 0);
check(
  unreadable.length === 0,
  `every python/pandas question has a readable signature (${codeQs.length} checked${
    unreadable.length ? `, missing: ${unreadable.slice(0, 3).map((q) => q.id).join(', ')}` : ''
  })`
);
// and the names must line up with what the tests actually pass
const mismatched = codeQs.filter((q) => {
  const n = paramNames(q).length;
  return (q.tests ?? []).some((t) => t.args.length !== n);
});
check(
  mismatched.length === 0,
  `argument counts match every test case (${mismatched.slice(0, 3).map((q) => q.id).join(', ') || 'all aligned'})`
);

console.log(failures === 0 ? 'All signature tests green.' : `${failures} signature test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
