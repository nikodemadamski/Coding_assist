// The Patterns reference must stay coherent. Algorithm cards: one entry per
// real roadmap category, complete fields, template parses as Python. Data
// cards (track: pandas | sql): their `patterns` lists must exactly cover the
// track's roadmap pattern keys, so no question is ever orphaned from a card.
import './proxy-shim.mjs';
import { PATTERN_GUIDE, guideKeyOf } from '../src/data/patternGuide.js';
import { ROADMAP, categoryKeyOf } from '../src/data/roadmap.js';
import { OFF_MAP_CATEGORIES } from '../src/data/roadmapGraph.js';
import { SEED_QUESTIONS } from '../src/data/questions.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Patterns reference tests\n');

const catKeys = new Set(ROADMAP.map((c) => c.key));
const algoCards = PATTERN_GUIDE.filter((p) => !p.track);
const dataCards = PATTERN_GUIDE.filter((p) => p.track);

// ---- shape: every card ----
check(algoCards.length >= 12, `covers the core algorithm patterns (${algoCards.length})`);
check(dataCards.length >= 8, `covers the data tracks (${dataCards.length})`);
const seen = new Set();
for (const p of PATTERN_GUIDE) {
  check(!seen.has(p.key), `"${p.key}" appears once`);
  seen.add(p.key);
  check(!!p.name && !!p.when && !!p.complexity, `"${p.key}" has name / when / complexity`);
  check(Array.isArray(p.cues) && p.cues.length >= 2, `"${p.key}" lists recognition cues`);
  check(typeof p.template === 'string' && p.template.trim().length > 20, `"${p.key}" has a real template`);
}

// ---- algorithm cards are keyed by real on-map roadmap categories ----
for (const p of algoCards) {
  check(catKeys.has(p.key), `"${p.key}" is a real roadmap category`);
  check(!OFF_MAP_CATEGORIES.includes(p.key), `"${p.key}" is an algorithm pattern (not a data track)`);
}

// ---- data cards exactly cover their track's roadmap patterns ----
for (const track of ['pandas', 'sql']) {
  const cards = dataCards.filter((p) => p.track === track);
  const claimed = cards.flatMap((p) => p.patterns ?? []);
  check(
    claimed.length === new Set(claimed).size,
    `${track}: no pattern is claimed by two cards`
  );
  const roadmapPatterns = ROADMAP.find((c) => c.key === track).patterns;
  const missing = roadmapPatterns.filter((raw) => !claimed.includes(raw));
  const extra = claimed.filter((raw) => !roadmapPatterns.includes(raw));
  check(missing.length === 0, `${track}: every roadmap pattern has a template card`, missing.join(', '));
  check(extra.length === 0, `${track}: no card claims an unknown pattern`, extra.join(', '));
}

// ---- guideKeyOf: every seed question resolves to a card ----
// (except the intro warm-ups — basics have no pattern template by design)
{
  const orphans = SEED_QUESTIONS.filter(
    (q) => guideKeyOf(q) === null && categoryKeyOf(q.pattern) !== 'warmups'
  );
  check(orphans.length === 0, 'every non-warm-up question maps to a guide card', orphans.map((q) => q.id).slice(0, 5).join(', '));
  const sql = SEED_QUESTIONS.find((q) => q.id === 'sql-running-total');
  check(guideKeyOf(sql) === 'sql-window', 'a window question maps to the window card');
  const pd = SEED_QUESTIONS.find((q) => q.id === 'pd-groupby-agg');
  check(guideKeyOf(pd) === 'pd-groupby', 'a groupby question maps to the groupby card');
  const py = SEED_QUESTIONS.find((q) => q.id === 'py-two-sum');
  check(guideKeyOf(py) === 'arrays-hashing', 'an algorithm question still maps by category');
}

// ---- every data pattern has a per-pattern stuck-ladder hint ----
{
  const { DATA_HINTS } = await import('../src/data/patternHints.js');
  for (const track of ['pandas', 'sql']) {
    const pats = ROADMAP.find((c) => c.key === track).patterns;
    const missing = pats.filter((p) => !DATA_HINTS[p]?.tell || !DATA_HINTS[p]?.reach);
    check(missing.length === 0, `${track}: every pattern has a tell/reach hint`, missing.join(', '));
  }
}

// ---- SQL templates look like SQL ----
for (const p of dataCards.filter((c) => c.track === 'sql')) {
  check(/select/i.test(p.template), `"${p.key}" template contains a SELECT`);
}

// ---- python + pandas templates are syntactically valid Python ----
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
for (const p of PATTERN_GUIDE.filter((c) => c.track !== 'sql')) {
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
