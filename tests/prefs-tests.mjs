// Unit tests for UI preferences (src/state/uiPrefs.js)
import {
  clampVSplit,
  VSPLIT_MIN,
  VSPLIT_MAX,
  clampSplit,
  clampFont,
  loadUiPrefs,
  saveUiPrefs,
  UI_DEFAULTS,
  SPLIT_MIN,
  SPLIT_MAX,
  FONT_MIN,
  FONT_MAX,
} from '../src/state/uiPrefs.js';

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok - ${name}`);
  } else {
    failures++;
    console.error(`  FAIL - ${name}`);
  }
}

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
}

console.log('prefs-tests: clamping');
check('split clamps low', clampSplit(5) === SPLIT_MIN);
check('split clamps high', clampSplit(90) === SPLIT_MAX);
check('split rounds', clampSplit(41.6) === 42);
check('split rejects garbage', clampSplit('nope') === UI_DEFAULTS.split);
check('font clamps low', clampFont(6) === FONT_MIN);
check('font clamps high', clampFont(99) === FONT_MAX);
check('font rejects garbage', clampFont(NaN) === UI_DEFAULTS.fontSize);

console.log('prefs-tests: load');
{
  const s = fakeStorage();
  const p = loadUiPrefs(s);
  check('empty storage yields defaults', p.split === UI_DEFAULTS.split && p.fontSize === UI_DEFAULTS.fontSize);
}
{
  const s = fakeStorage({ 'zoro.ui.v1': '{"split":55,"fontSize":16}' });
  const p = loadUiPrefs(s);
  check('stored values load', p.split === 55 && p.fontSize === 16);
}
{
  const s = fakeStorage({ 'zoro.ui.v1': 'not json{{{' });
  const p = loadUiPrefs(s);
  check('corrupt storage falls back to defaults', p.split === UI_DEFAULTS.split);
}
{
  const s = fakeStorage({ 'zoro.ui.v1': '{"split":999,"fontSize":-3}' });
  const p = loadUiPrefs(s);
  check('out-of-range stored values are clamped on load', p.split === SPLIT_MAX && p.fontSize === FONT_MIN);
}

console.log('prefs-tests: save');
{
  const s = fakeStorage();
  const p = saveUiPrefs({ split: 50 }, s);
  check('save returns merged+clamped prefs', p.split === 50 && p.fontSize === UI_DEFAULTS.fontSize);
  check('save persists', loadUiPrefs(s).split === 50);
  const p2 = saveUiPrefs({ fontSize: 18 }, s);
  check('patch keeps other keys', p2.split === 50 && p2.fontSize === 18);
  const p3 = saveUiPrefs({ split: 200 }, s);
  check('save clamps', p3.split === SPLIT_MAX);
}
{
  // the editor/console divider clamps the same way the problem divider does
  check('vsplit clamps low', clampVSplit(1) === VSPLIT_MIN);
  check('vsplit clamps high', clampVSplit(99) === VSPLIT_MAX);
  check('vsplit rejects garbage', clampVSplit('nope') === UI_DEFAULTS.vsplit);
  const s = fakeStorage();
  check('vsplit defaults when unset', loadUiPrefs(s).vsplit === UI_DEFAULTS.vsplit);
  saveUiPrefs({ vsplit: 75 }, s);
  check('vsplit persists', loadUiPrefs(s).vsplit === 75);
  check('saving vsplit keeps the other prefs', loadUiPrefs(s).fontSize === UI_DEFAULTS.fontSize);
}
{
  // storage that throws must not crash saving
  const boom = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  const p = saveUiPrefs({ split: 30 }, boom);
  check('save survives a throwing storage', p.split === 30);
}

if (failures) {
  console.error(`prefs-tests: ${failures} failure(s)`);
  process.exit(1);
}
console.log('prefs-tests: all passed');
