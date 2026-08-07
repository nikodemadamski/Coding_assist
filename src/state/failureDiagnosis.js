// What a failing run is actually telling you.
//
// "Expected 3, got 4" is where the app used to stop, and it is the state you
// are in most often while learning. But a failing set carries a mechanical
// signal nobody was reading: whether every wrong answer is off by the same
// amount, whether the values are right and only the order is wrong, whether
// the one case that broke is the empty one. Those are computable facts.
//
// THE RULE: only say things that are certainly true of the results in front of
// us. Never infer intent, never guess at the fix, never say "you forgot to…".
// "Every wrong answer is exactly one more than expected" is a fact and useful;
// "you forgot to shrink the window" is a guess and would sometimes be wrong,
// which is worse than silence. When no rule fires with certainty, we say
// nothing at all — `diagnose` returns null and the UI shows the results alone.
//
// Pure, so tests/diagnosis-tests.mjs can pin every rule without an engine.

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isArr = Array.isArray;

function deepEqual(a, b) {
  if (a === b) return true;
  if (isArr(a) && isArr(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

const sortKey = (v) => JSON.stringify(v);
const sorted = (a) => [...a].map(sortKey).sort();
const sameMultiset = (a, b) =>
  isArr(a) && isArr(b) && a.length === b.length && String(sorted(a)) === String(sorted(b));

// "Smallest possible input": the case a solution forgets. Empty string, empty
// list, zero, a single element.
function isEdgeArgs(args = []) {
  if (args.length === 0) return false;
  return args.some(
    (a) =>
      a === '' ||
      a === 0 ||
      (isArr(a) && a.length <= 1) ||
      (typeof a === 'string' && a.length <= 1)
  );
}

const typeName = (v) => {
  if (v === null || v === undefined) return 'nothing';
  if (isArr(v)) return 'a list';
  if (typeof v === 'string') return 'a string';
  if (typeof v === 'boolean') return 'a boolean';
  if (isNum(v)) return 'a number';
  if (typeof v === 'object') return 'a dictionary';
  return 'something else';
};

const nth = (i) => `case ${i + 1}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// results: the engine's per-test entries, index-aligned with question.tests.
// Each carries { pass, error, got?, gotRepr, expectedRepr }.
export function diagnose(question, report) {
  const results = report?.results;
  if (!isArr(results) || results.length === 0) return null;
  if (report.allPassed) return null;

  const tests = question?.tests ?? [];
  const failing = results
    .map((r, i) => ({ ...r, i, expected: tests[i]?.expected, args: tests[i]?.args ?? [] }))
    .filter((r) => !r.pass);
  if (failing.length === 0) return null;

  const passed = results.length - failing.length;
  const scale = `${passed}/${results.length} passing`;

  // ── crashes first: a case that threw never produced an answer to compare ──
  const errored = failing.filter((r) => r.error);
  if (errored.length) {
    // The engine sends a short traceback, so the exception name is somewhere in
    // the middle of it rather than at the front. Only name it when every crash
    // agrees — two different exceptions are two different bugs.
    const kinds = errored.map((r) => String(r.error).match(/\b(\w*(?:Error|Exception))\b/)?.[1] ?? null);
    const kind = kinds.every((k) => k && k === kinds[0]) ? kinds[0] : null;
    if (errored.length === results.length) {
      return {
        kind: 'raises',
        headline: kind ? `Every case raises ${kind}.` : 'Every case raises an exception.',
        detail: 'Nothing was returned, so there is no output to compare yet. Start with case 1.',
        caseIndex: errored[0].i,
        scale,
      };
    }
    return {
      kind: 'raises-some',
      headline: kind
        ? `${plural(errored.length, 'case', 'cases')} raise ${kind} rather than returning.`
        : `${plural(errored.length, 'case', 'cases')} crashed rather than returning a value.`,
      detail: `The other cases came back with a value. Whatever is different about ${nth(errored[0].i)} is the thing to look at.`,
      caseIndex: errored[0].i,
      scale,
    };
  }

  // Everything below compares real values, so it needs them.
  const cmp = failing.filter((r) => 'got' in r && r.expected !== undefined);
  const all = (fn) => cmp.length === failing.length && cmp.length > 0 && cmp.every(fn);

  // ── returns nothing ──────────────────────────────────────────────────────
  if (all((r) => r.got === null || r.got === undefined)) {
    return {
      kind: 'returns-none',
      headline: 'Your function returns nothing.',
      detail:
        'Every failing case came back as None. Printing a value is not returning it — the grader only sees what you `return`.',
      caseIndex: failing[0].i,
      scale,
    };
  }

  // ── hands the input straight back ────────────────────────────────────────
  if (all((r) => r.args.length > 0 && deepEqual(r.got, r.args[0]))) {
    return {
      kind: 'echoes-input',
      headline: 'You are returning the input unchanged.',
      detail: `On every failing case the output is identical to the first argument, so nothing has been transformed yet.`,
      caseIndex: failing[0].i,
      scale,
    };
  }

  // ── right values, wrong order ────────────────────────────────────────────
  if (all((r) => sameMultiset(r.got, r.expected) && !deepEqual(r.got, r.expected))) {
    return {
      kind: 'order',
      headline: 'The values are right — the order is not.',
      detail:
        'Every failing case contains exactly the expected items, arranged differently. Check the order the question asks for.',
      caseIndex: failing[0].i,
      scale,
    };
  }

  // ── off by the same amount every time ────────────────────────────────────
  // Two failures minimum. "Every wrong answer is exactly one too high" from a
  // single sample is a coincidence dressed as a pattern — the same mistake as
  // scoring a pattern off one quiz answer. The structural rules above are
  // facts about whatever they describe; this one is an extrapolation, so it
  // needs more than one point to stand on.
  if (cmp.length >= 2 && all((r) => isNum(r.got) && isNum(r.expected))) {
    const deltas = new Set(cmp.map((r) => r.got - r.expected));
    if (deltas.size === 1) {
      const d = [...deltas][0];
      if (d !== 0) {
        const mag = Math.abs(d);
        return {
          kind: 'off-by',
          headline: `Every wrong answer is exactly ${mag === 1 ? 'one' : mag} ${d > 0 ? 'too high' : 'too low'}.`,
          detail:
            mag === 1
              ? 'A constant off-by-one usually lives in a range bound or a `<` that should be `<=` (or the reverse).'
              : 'A constant offset points at one line, not at the approach.',
          caseIndex: failing[0].i,
          scale,
        };
      }
    }
  }

  // ── wrong shape: the type is not even the same ───────────────────────────
  const shapeOf = (v) => typeName(v);
  if (all((r) => shapeOf(r.got) !== shapeOf(r.expected))) {
    const g = shapeOf(cmp[0].got);
    const e = shapeOf(cmp[0].expected);
    return {
      kind: 'type',
      headline: `Expected ${e}, your function returns ${g}.`,
      detail: 'The shape of the answer is wrong, so the logic inside has not been graded yet.',
      caseIndex: failing[0].i,
      scale,
    };
  }

  // ── right kind of thing, wrong number of items ───────────────────────────
  if (all((r) => isArr(r.got) && isArr(r.expected) && r.got.length !== r.expected.length)) {
    const r0 = cmp[0];
    return {
      kind: 'length',
      headline: 'Your output has the wrong number of items.',
      detail: `On ${nth(r0.i)} you return ${plural(r0.got.length, 'item', 'items')} where ${r0.expected.length} ${r0.expected.length === 1 ? 'is' : 'are'} expected.`,
      caseIndex: r0.i,
      scale,
    };
  }

  // ── one case, and it is the smallest input ───────────────────────────────
  if (failing.length === 1) {
    const only = failing[0];
    if (isEdgeArgs(only.args)) {
      return {
        kind: 'edge',
        headline: 'Everything passes except the smallest input.',
        detail: `${nth(only.i)} is the empty or single-item case. The approach is working; the boundary is not.`,
        caseIndex: only.i,
        scale,
      };
    }
    return {
      kind: 'single',
      headline: `${passed} of ${results.length} pass — the whole problem is in ${nth(only.i)}.`,
      detail: 'Compare what that case has that the passing ones do not.',
      caseIndex: only.i,
      scale,
    };
  }

  // ── nothing passes at all ────────────────────────────────────────────────
  if (passed === 0) {
    return {
      kind: 'none-pass',
      headline: 'No case passes yet.',
      detail: `Work case 1 by hand and compare it with what you return — when nothing passes it is usually the approach, not a detail.`,
      caseIndex: failing[0].i,
      scale,
    };
  }

  // ── some pass, some do not, and nothing certain unites the failures ──────
  // Deliberately no guess here: saying which cases broke is true and useful,
  // and inventing a reason would sometimes be wrong.
  return {
    kind: 'mixed',
    headline: `${passed} of ${results.length} pass.`,
    detail: `${failing.map((r) => nth(r.i)).join(', ')} came back different. Start with the smallest of them.`,
    caseIndex: failing[0].i,
    scale,
  };
}
