// Reading a question's call signature back out of its starter code.
//
// The test console shows each case as named arguments (`nums = [2, 7, 11, 15]`
// rather than a bare positional list), and lets you edit one and re-run it. To
// do that it needs the parameter names, and the only place they exist is the
// starter code the learner is already looking at:
//
//     def two_sum(nums, target):   ->   ['nums', 'target']
//
// Everything here is pure and unit-tested (tests/signature-tests.mjs) — the
// console degrades to `arg 1 / arg 2` labels if a signature can't be read, and
// never blocks a run.

// Split a parameter list on top-level commas only, so an annotation like
// `Dict[str, int]` stays in one piece.
function splitTopLevel(src) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of src) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

// The declared parameter names of `question.function_name` in its starter code.
// Returns [] when there is no readable signature (SQL questions, hand-edited
// starters); callers fall back to positional labels.
export function paramNames(question) {
  const fname = question?.function_name;
  const src = question?.starter_code;
  if (!fname || typeof src !== 'string') return [];
  const m = new RegExp(`def\\s+${fname}\\s*\\(([\\s\\S]*?)\\)\\s*(->[^:]*)?:`).exec(src);
  if (!m) return [];
  return splitTopLevel(m[1])
    .map((p) =>
      p
        .split('=')[0] // drop a default value
        .split(':')[0] // drop a type annotation
        .replace(/[*]/g, '') // *args / **kwargs -> args / kwargs
        .trim()
    )
    .filter((p) => p && p !== 'self');
}

// Label for the nth argument: its real name when we could read one.
export function argLabel(names, i) {
  return names[i] || `arg ${i + 1}`;
}

// One argument as editable text. JSON is the wire format for test args, so it
// is also the honest edit format — the learner sees exactly what gets passed.
// Spaced after commas because these are read far more often than typed, and
// `[2,7,11,15]` is meaningfully harder to scan than `[2, 7, 11, 15]`.
export function argToText(value) {
  if (Array.isArray(value)) return `[${value.map(argToText).join(', ')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${argToText(v)}`)
      .join(', ')}}`;
  }
  return JSON.stringify(value ?? null);
}

// Parse the console's edited argument boxes back into real values.
// -> { args } on success, { error } with the offending box named on failure.
export function parseArgs(texts, names = []) {
  const args = [];
  for (let i = 0; i < texts.length; i++) {
    const raw = String(texts[i] ?? '').trim();
    if (raw === '') return { error: `${argLabel(names, i)} is empty.` };
    try {
      args.push(JSON.parse(raw));
    } catch {
      return {
        error: `${argLabel(names, i)} isn't valid input — use JSON form: [1, 2], "text", 5, true, null.`,
      };
    }
  }
  return { args };
}

// A one-line summary of a case's inputs for its chip's tooltip.
export function caseSummary(test, names = []) {
  return (test?.args ?? [])
    .map((a, i) => `${argLabel(names, i)} = ${argToText(a)}`)
    .join(', ');
}
