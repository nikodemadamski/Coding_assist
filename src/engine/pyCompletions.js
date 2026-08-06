// Autocomplete for the Python editor.
//
// CodeMirror's stock Python completions were switched off here on purpose:
// they're the language's whole global namespace, so typing `co` offered
// ConnectionRefusedError and ConnectionResetError before `collections`. That's
// worse than nothing.
//
// This source is the opposite — small, and made of exactly what this app can
// actually run:
//
//   * every name the harness pre-injects (PY_PRELUDE: defaultdict, Counter,
//     deque, heapq, bisect, cache …). These need no import here, which is a
//     rule you have to learn; offering them teaches it.
//   * the builtins you reach for in interview code, and the keywords.
//   * after a dot, the container/string methods that actually come up.
//   * every identifier already in your buffer, so your own variable and
//     helper names complete too.
//
// Everything is data plus one pure function, so it's unit-tested without a
// browser (tests/completion-tests.mjs).

// Names injected into exec globals by PY_PRELUDE — importable-free, and the
// detail string says so, because that surprises people.
export const PRELUDE_NAMES = [
  'defaultdict', 'Counter', 'deque', 'OrderedDict',
  'heapq', 'bisect', 'collections', 'itertools', 'functools', 'math', 're', 'string',
  'lru_cache', 'cache', 'reduce',
  'permutations', 'combinations', 'combinations_with_replacement', 'product', 'accumulate', 'chain',
  'inf', 'gcd',
  'List', 'Optional', 'Dict', 'Tuple', 'Set',
];

export const BUILTIN_NAMES = [
  'abs', 'all', 'any', 'bin', 'bool', 'chr', 'dict', 'divmod', 'enumerate', 'filter',
  'float', 'frozenset', 'int', 'isinstance', 'iter', 'len', 'list', 'map', 'max', 'min',
  'next', 'ord', 'pow', 'print', 'range', 'reversed', 'round', 'set', 'sorted', 'str',
  'sum', 'tuple', 'type', 'zip', 'True', 'False', 'None',
];

export const KEYWORDS = [
  'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
];

// Offered after a `.`. Untyped, so this is a curated union rather than real
// member resolution — but it is the union that shows up in this kind of code,
// which beats CodeMirror's alternative of offering nothing.
export const MEMBER_NAMES = [
  // list
  'append', 'extend', 'insert', 'remove', 'pop', 'clear', 'index', 'count', 'sort', 'reverse', 'copy',
  // dict
  'get', 'keys', 'values', 'items', 'setdefault', 'update',
  // set
  'add', 'discard', 'union', 'intersection', 'difference', 'issubset', 'issuperset',
  // str
  'split', 'rsplit', 'strip', 'lstrip', 'rstrip', 'join', 'replace', 'startswith', 'endswith',
  'find', 'lower', 'upper', 'isdigit', 'isalpha', 'isalnum', 'format', 'zfill',
  // deque / Counter / heapq-adjacent
  'appendleft', 'popleft', 'most_common', 'elements',
];

const IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

// Identifiers already written in this buffer, minus the word being typed —
// completing your own names is most of autocomplete's day-to-day value.
export function documentWords(text, exclude = '') {
  const seen = new Set();
  for (const m of String(text).matchAll(IDENT_RE)) {
    if (m[0].length > 1 && m[0] !== exclude) seen.add(m[0]);
  }
  return [...seen];
}

// Build the option list for a completion at `word`, given the buffer text and
// whether the cursor sits straight after a dot. Pure: the CodeMirror adapter
// below only turns this into CM's shape.
export function optionsFor({ text = '', word = '', afterDot = false } = {}) {
  if (afterDot) {
    return MEMBER_NAMES.map((label) => ({ label, type: 'method' }));
  }
  const opts = [
    ...PRELUDE_NAMES.map((label) => ({
      label,
      type: 'variable',
      detail: 'ready to use — no import needed',
    })),
    ...BUILTIN_NAMES.map((label) => ({ label, type: 'function' })),
    ...KEYWORDS.map((label) => ({ label, type: 'keyword' })),
  ];
  const known = new Set(opts.map((o) => o.label));
  for (const w of documentWords(text, word)) {
    if (!known.has(w)) opts.push({ label: w, type: 'variable', detail: 'in this file' });
  }
  return opts;
}

// CodeMirror completion source. Kept to the last few lines so the whole thing
// stays testable as plain data above.
export function pythonCompletionSource(context) {
  const dot = context.matchBefore(/\.\w*/);
  const word = context.matchBefore(/\w+/);
  if (dot) {
    return {
      from: dot.from + 1,
      options: optionsFor({ afterDot: true }),
      validFor: /^\w*$/,
    };
  }
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: optionsFor({ text: context.state.doc.toString(), word: word.text }),
    validFor: /^\w*$/,
  };
}
