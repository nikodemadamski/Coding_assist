// The post-failure read: every rule, and — just as important — the cases where
// it must stay silent rather than guess.
import { diagnose } from '../src/state/failureDiagnosis.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Failure diagnosis tests');

// Build a report the way the engine does: results index-aligned with tests.
const make = (tests, outs) => {
  const results = outs.map((o) => {
    if (o && o.error) return { pass: false, error: o.error, gotRepr: '' };
    const pass = JSON.stringify(o.got) === JSON.stringify(tests[outs.indexOf(o)]?.expected);
    return { pass, error: null, got: o.got, gotRepr: JSON.stringify(o.got) };
  });
  return [{ tests }, { status: 'ok', results, allPassed: results.every((r) => r.pass) }];
};
const run = (tests, outs) => diagnose(...make(tests, outs));

// ---- nothing to say ----
check(diagnose(null, null) === null, 'no report is safe');
check(diagnose({}, { results: [] }) === null, 'an empty result set says nothing');
check(
  diagnose({ tests: [{ expected: 1 }] }, { results: [{ pass: true }], allPassed: true }) === null,
  'a passing run gets no failure read at all'
);

// ---- crashes come first: a case that threw produced no answer ----
{
  // The engine sends a short traceback, so the exception name sits in the
  // middle of the string, not at the front. This is the real shape.
  const tb = 'File "<string>", line 2, in two_sum\n    IndexError: list index out of range';
  const d = run([{ args: [[1]], expected: 1 }, { args: [[2]], expected: 2 }], [{ error: tb }, { error: tb }]);
  check(d.kind === 'raises', 'every case crashing is its own diagnosis');
  check(/IndexError/.test(d.headline), 'and the exception type is pulled out of the traceback');
  check(!/expected/i.test(d.headline), 'it does not talk about values that were never produced');

  // Two different exceptions are two different bugs — name neither.
  const mixedErr = run(
    [{ args: [[1]], expected: 1 }, { args: [[2]], expected: 2 }],
    [{ error: 'x\n ValueError: bad' }, { error: 'y\n KeyError: 3' }]
  );
  check(
    !/ValueError|KeyError/.test(mixedErr.headline),
    'and disagreeing exceptions are not reported as one kind'
  );
}
{
  const d = run(
    [{ args: [[1]], expected: 1 }, { args: [[]], expected: 0 }],
    [{ got: 1 }, { error: 'ZeroDivisionError: division by zero' }]
  );
  check(d.kind === 'raises-some', 'a partial crash is called out separately');
  check(d.caseIndex === 1, 'and points at the case that threw');
}

// ---- returns nothing ----
{
  const d = run(
    [{ args: [[1, 2]], expected: 3 }, { args: [[4]], expected: 4 }],
    [{ got: null }, { got: null }]
  );
  check(d.kind === 'returns-none', 'returning None everywhere is recognised');
  check(/return/.test(d.detail), 'and the detail mentions returning, not printing');
}

// ---- hands the input back ----
{
  const d = run(
    [{ args: [[3, 1, 2]], expected: [1, 2, 3] }, { args: [[2, 1]], expected: [1, 2] }],
    [{ got: [3, 1, 2] }, { got: [2, 1] }]
  );
  check(d.kind === 'echoes-input', 'returning the input unchanged is recognised');
}
{
  // Case 1 passes AND happens to equal its input; case 2 fails without echoing.
  // The claim is about the failing set, so it must not fire here.
  const d = run(
    [{ args: [[1]], expected: [1] }, { args: [[3, 1]], expected: [1, 3] }],
    [{ got: [1] }, { got: [9, 9] }]
  );
  check(d.kind !== 'echoes-input', 'an echo on a PASSING case never triggers the claim');
}

// ---- right values, wrong order ----
{
  const d = run(
    [{ args: [[3, 1, 2]], expected: [1, 2, 3] }, { args: [[9, 8]], expected: [8, 9] }],
    [{ got: [3, 2, 1] }, { got: [9, 8] }]
  );
  check(d.kind === 'order', 'same items in a different order is recognised');
  check(/order/i.test(d.headline), 'and says so plainly');
}
{
  const d = run([{ args: [[1]], expected: [1, 2] }], [{ got: [1, 1] }]);
  check(d.kind !== 'order', 'a different multiset is never called an ordering problem');
}

// ---- off by a constant ----
{
  const d = run(
    [{ args: ['abc'], expected: 3 }, { args: ['ab'], expected: 2 }, { args: ['abcd'], expected: 4 }],
    [{ got: 4 }, { got: 3 }, { got: 5 }]
  );
  check(d.kind === 'off-by', 'a constant offset across every failure is recognised');
  check(/one/.test(d.headline) && /too high/.test(d.headline), 'named as one too high');
}
{
  const d = run([{ args: ['a'], expected: 5 }, { args: ['b'], expected: 9 }], [{ got: 3 }, { got: 7 }]);
  check(d.kind === 'off-by' && /too low/.test(d.headline), 'and it works in the other direction');
}
{
  // Different deltas — no constant, so no claim of one.
  const d = run([{ args: ['a'], expected: 5 }, { args: ['b'], expected: 9 }], [{ got: 6 }, { got: 20 }]);
  check(d.kind !== 'off-by', 'inconsistent deltas are never called an off-by-one');
}
{
  // One failing case is a coincidence, not a pattern — the same reason a single
  // quiz answer never scores a pattern.
  const d = run(
    [{ args: ['abcd'], expected: 4 }, { args: ['abcde'], expected: 5 }],
    [{ got: 4 }, { got: 6 }]
  );
  check(d.kind !== 'off-by', 'a constant offset is never claimed from ONE failing case');
  check(d.kind === 'single', 'it reports the lone failure instead');
}

// ---- wrong shape ----
{
  const d = run(
    [{ args: [[1, 2]], expected: [0, 1] }, { args: [[3, 4]], expected: [0, 1] }],
    [{ got: 2 }, { got: 3 }]
  );
  check(d.kind === 'type', 'returning a number where a list is expected is recognised');
  check(/list/.test(d.headline) && /number/.test(d.headline), 'both shapes are named');
}
{
  const d = run([{ args: [[1]], expected: [1] }], [{ got: [1, 2] }]);
  check(d.kind !== 'type', 'two lists are never called a type problem');
}

// ---- wrong length ----
{
  const d = run(
    [{ args: [[1, 2, 3]], expected: [1, 2] }, { args: [[4, 5]], expected: [4] }],
    [{ got: [7, 8, 9] }, { got: [7, 8] }]
  );
  check(d.kind === 'length', 'a consistent length mismatch is recognised');
  check(/3 items/.test(d.detail) && /2 /.test(d.detail), 'and the counts are concrete');
}

// ---- the boundary case ----
{
  const d = run(
    [
      { args: ['abc'], expected: 3 },
      { args: ['abcd'], expected: 4 },
      { args: [''], expected: 0 },
    ],
    [{ got: 3 }, { got: 4 }, { got: 1 }]
  );
  check(d.kind === 'edge', 'the empty input being the only failure is recognised');
  check(d.caseIndex === 2, 'and it points at that case');
}
{
  const d = run(
    [
      { args: ['abc'], expected: 3 },
      { args: [''], expected: 0 },
      { args: ['abcdefgh'], expected: 8 },
    ],
    [{ got: 3 }, { got: 0 }, { got: 7 }]
  );
  check(d.kind === 'single', 'a lone failure on a big input is reported as a lone failure');
  check(d.kind !== 'edge', 'and is NOT called a boundary problem, which it is not');
  check(/case 3/.test(d.headline), 'the case number is named');
}

// ---- nothing passes ----
{
  const d = run(
    [{ args: [[1]], expected: 1 }, { args: [[2]], expected: 2 }, { args: [[3]], expected: 3 }],
    [{ got: 9 }, { got: 8 }, { got: 100 }]
  );
  check(d.kind === 'none-pass', 'zero passes is its own message');
  check(/approach/.test(d.detail), 'and points at the approach rather than a detail');
}

// ---- mixed, with nothing certain to say ----
{
  const d = run(
    [
      { args: [[1]], expected: 1 },
      { args: [[2]], expected: 2 },
      { args: [[3]], expected: 3 },
      { args: [[4]], expected: 4 },
    ],
    [{ got: 1 }, { got: 7 }, { got: 3 }, { got: 40 }]
  );
  check(d.kind === 'mixed', 'when no rule fires with certainty it falls back to the facts');
  check(/case 2/.test(d.detail) && /case 4/.test(d.detail), 'which are: exactly which cases broke');
  check(!/forgot|should|try/i.test(d.headline + d.detail), 'and it never guesses at the fix');
}

// ---- every diagnosis is renderable ----
{
  const samples = [
    run([{ args: [[1]], expected: 1 }], [{ error: 'ValueError: x' }]),
    run([{ args: [[1]], expected: 1 }], [{ got: null }]),
    run([{ args: [''], expected: 0 }, { args: ['ab'], expected: 2 }], [{ got: 1 }, { got: 2 }]),
    run([{ args: [[2, 1]], expected: [1, 2] }], [{ got: [2, 1] }]),
  ];
  check(
    samples.every(
      (d) =>
        d &&
        typeof d.headline === 'string' &&
        d.headline.length > 8 &&
        typeof d.detail === 'string' &&
        typeof d.scale === 'string' &&
        Number.isInteger(d.caseIndex)
    ),
    'every diagnosis carries a headline, a detail, a scale and a case to open'
  );
  check(
    samples.every((d) => d.headline.trim().endsWith('.')),
    'every headline is a finished sentence'
  );
}

// The results the engine actually sends carry no `got` when the value was too
// big to serialise. Diagnosis must degrade rather than throw.
{
  const d = diagnose(
    { tests: [{ args: [[1, 2, 3, 4]], expected: 1 }, { args: [[2, 3, 4, 5]], expected: 2 }] },
    {
      status: 'ok',
      allPassed: false,
      results: [
        { pass: false, error: null, gotRepr: '<huge>' },
        { pass: true, error: null, gotRepr: '2' },
      ],
    }
  );
  check(d !== null && d.kind === 'single', 'a result with no structured value still gets the honest fallback');
}

console.log(failures === 0 ? 'All diagnosis tests green.' : `${failures} diagnosis test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
