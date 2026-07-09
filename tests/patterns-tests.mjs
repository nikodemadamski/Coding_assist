// The Patterns reference must stay coherent: one entry per real algorithm
// category, complete fields, and every code template must be valid Python
// syntax (it parses — even if its placeholder helpers aren't defined).
import './proxy-shim.mjs';
import { PATTERN_GUIDE } from '../src/data/patternGuide.js';
import { ROADMAP } from '../src/data/roadmap.js';
import { OFF_MAP_CATEGORIES } from '../src/data/roadmapGraph.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Patterns reference tests\n');

const catKeys = new Set(ROADMAP.map((c) => c.key));

// ---- shape ----
check(PATTERN_GUIDE.length >= 12, `covers the core patterns (${PATTERN_GUIDE.length})`);
const seen = new Set();
for (const p of PATTERN_GUIDE) {
  check(catKeys.has(p.key), `"${p.key}" is a real roadmap category`);
  check(!seen.has(p.key), `"${p.key}" appears once`);
  seen.add(p.key);
  check(!OFF_MAP_CATEGORIES.includes(p.key), `"${p.key}" is an algorithm pattern (not a data track)`);
  check(!!p.name && !!p.when && !!p.complexity, `"${p.key}" has name / when / complexity`);
  check(Array.isArray(p.cues) && p.cues.length >= 2, `"${p.key}" lists recognition cues`);
  check(typeof p.template === 'string' && p.template.trim().length > 20, `"${p.key}" has a real template`);
}

// ---- every template is syntactically valid Python ----
const { loadPyodide } = await import('pyodide');
const pyodide = await loadPyodide();
pyodide.globals.set('_src', '');
const parses = (code) => {
  // Templates are function-body skeletons (they use `return`), so wrap them in
  // a def before the syntax check. compile() checks SYNTAX only — undefined
  // placeholder helpers are runtime, not compile, errors.
  const wrapped = 'def _tmpl():\n' + code.split('\n').map((l) => '    ' + l).join('\n');
  pyodide.globals.set('_src', wrapped);
  return pyodide.runPython('__import__("builtins").compile(_src, "<tmpl>", "exec") and True');
};
for (const p of PATTERN_GUIDE) {
  let ok = true;
  let err = '';
  try {
    parses(p.template);
  } catch (e) {
    ok = false;
    err = String(e).split('\n')[0];
  }
  check(ok, `"${p.key}" template is valid Python syntax`, err);
}

console.log(failures === 0 ? '\nAll patterns tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
