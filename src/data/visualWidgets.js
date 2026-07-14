// The visual-widget registry and the beat-validator shared by BOTH the lesson
// gate (tests/lesson-tests.mjs) and the renderer (VisualPlayer). Pure data +
// validation — no anime.js, no React — so it runs in Node and the browser
// alike. A `read.visual` (or a `visual` item) is authored as tap-through beats;
// the validator here guarantees every beat is well-formed for its widget, and
// (when verifyCode/verifyOutput are present) the gate additionally RUNS the code
// so a visual can never misrepresent what Python actually does.

export const VISUAL_WIDGETS = [
  'list-cells',
  'var-boxes',
  'loop-tape',
  'dict-lookup',
  'stack-tower',
  'text-reveal',
  'branch-flow',
  'call-return',
  'pipe-flow',
  'interval-bars',
  'node-chain',
  'tree-view',
];

// Collect every valid node path ('' root, then 'L'/'R' steps) in a nested
// [value, left, right] tree — used to validate tree-view beat targets.
function treePaths(node, path = '', acc = new Set()) {
  if (!node) return acc;
  if (!Array.isArray(node) || node.length !== 3) return acc;
  acc.add(path);
  treePaths(node[1], `${path}L`, acc);
  treePaths(node[2], `${path}R`, acc);
  return acc;
}

const isInt = (n) => Number.isInteger(n);
const isStr = (s) => typeof s === 'string' && s.trim().length > 0;

// Per-widget beat validators. Each returns an error string or null for a beat,
// given the visual's shared context (the list, the vars, etc.).
const BEAT_RULES = {
  'list-cells': (visual, beat) => {
    const len = visual.list?.length ?? 0;
    if (!Array.isArray(visual.list) || len === 0) return 'list-cells needs a non-empty `list`';
    for (const key of ['pointer', 'pointer2', 'mid']) {
      if (beat[key] !== undefined) {
        if (!isInt(beat[key]) || beat[key] < -len || beat[key] > len - 1) {
          return `${key} ${beat[key]} out of range for a list of ${len}`;
        }
      }
    }
    for (const key of ['pointerLabel', 'pointer2Label', 'midLabel']) {
      if (beat[key] !== undefined && !isStr(beat[key])) return `${key} must be a non-empty string`;
    }
    if (beat.slice !== undefined) {
      const s = beat.slice;
      if (!Array.isArray(s) || s.length !== 2 || !isInt(s[0]) || !isInt(s[1])) {
        return 'slice must be [start, end] integers';
      }
      if (s[0] < 0 || s[1] > len || s[0] > s[1]) return `slice [${s[0]}, ${s[1]}] out of range`;
    }
    return null;
  },
  'var-boxes': (visual, beat) => {
    if (!beat.vars || typeof beat.vars !== 'object') return 'var-boxes beat needs a `vars` object';
    for (const [k, v] of Object.entries(beat.vars)) {
      if (!isStr(k)) return 'var name must be a non-empty string';
      if (typeof v !== 'string' && typeof v !== 'number') return `var ${k} value must be a string or number`;
    }
    return null;
  },
  'loop-tape': (visual, beat) => {
    const len = visual.items?.length ?? 0;
    if (!Array.isArray(visual.items) || len === 0) return 'loop-tape needs a non-empty `items`';
    if (beat.at !== undefined && (!isInt(beat.at) || beat.at < -1 || beat.at > len - 1)) {
      return `at ${beat.at} out of range (-1..${len - 1})`;
    }
    if (beat.acc !== undefined && typeof beat.acc !== 'string' && typeof beat.acc !== 'number') {
      return 'acc must be a string or number';
    }
    return null;
  },
  'dict-lookup': (visual, beat) => {
    if (!visual.pairs || typeof visual.pairs !== 'object') return 'dict-lookup needs a `pairs` object';
    if (!isStr(beat.key)) return 'dict-lookup beat needs a `key` string';
    if (beat.fallback !== undefined && typeof beat.fallback !== 'string' && typeof beat.fallback !== 'number') {
      return 'fallback must be a string or number';
    }
    return null;
  },
  'stack-tower': (visual, beat) => {
    if (!isStr(beat.op) || !['push', 'pop', 'peek'].includes(beat.op)) {
      return "stack-tower beat needs op 'push' | 'pop' | 'peek'";
    }
    if (beat.op === 'push' && beat.value === undefined) return 'push needs a value';
    return null;
  },
  'text-reveal': (visual, beat) => {
    if (typeof beat.text !== 'string' || beat.text.length === 0) {
      return 'text-reveal beat needs a non-empty `text` string';
    }
    if (beat.sub !== undefined && !isStr(beat.sub)) return 'sub must be a non-empty string';
    return null;
  },
  'branch-flow': (visual, beat) => {
    if (!Array.isArray(beat.branches) || beat.branches.length === 0) {
      return 'branch-flow beat needs a non-empty `branches` array';
    }
    let taken = 0;
    for (const b of beat.branches) {
      if (!b || typeof b !== 'object') return 'each branch must be an object';
      if (!isStr(b.test)) return 'each branch needs a `test` string';
      if (!isStr(b.label)) return 'each branch needs a `label` string';
      if (typeof b.taken !== 'boolean') return 'each branch needs a boolean `taken`';
      if (b.taken) taken++;
    }
    if (taken > 1) return 'at most one branch can be taken (the first true one wins)';
    if (beat.value !== undefined && !isStr(beat.value)) return 'value must be a string';
    return null;
  },
  'call-return': (visual, beat) => {
    if (!isStr(beat.func)) return 'call-return beat needs a `func` name string';
    if (!Array.isArray(beat.args)) return 'call-return beat needs an `args` array';
    for (const a of beat.args) {
      if (typeof a !== 'string' && typeof a !== 'number') return 'each arg must be a string or number';
    }
    if (typeof beat.returns !== 'string' && typeof beat.returns !== 'number') {
      return 'call-return beat needs a `returns` value (string or number)';
    }
    if (beat.body !== undefined && !isStr(beat.body)) return 'body must be a string';
    if (beat.into !== undefined && !isStr(beat.into)) return 'into must be a string';
    return null;
  },
  'pipe-flow': (visual, beat) => {
    if (!Array.isArray(beat.input) || beat.input.length === 0) {
      return 'pipe-flow beat needs a non-empty `input` array';
    }
    if (!Array.isArray(beat.output)) return 'pipe-flow beat needs an `output` array';
    for (const v of [...beat.input, ...beat.output]) {
      if (typeof v !== 'string' && typeof v !== 'number') return 'input/output items must be strings or numbers';
    }
    if (beat.label !== undefined && !isStr(beat.label)) return 'label must be a string';
    return null;
  },
  'interval-bars': (visual, beat) => {
    const scale = visual.scale;
    if (!(typeof scale === 'number' && scale > 0)) return 'interval-bars needs a positive `scale`';
    if (!Array.isArray(beat.bars) || beat.bars.length === 0) return 'each beat needs a non-empty `bars` array';
    for (const b of beat.bars) {
      if (!Array.isArray(b) || b.length !== 2 || !isInt(b[0]) || !isInt(b[1])) {
        return 'each bar must be [start, end] integers';
      }
      if (b[0] < 0 || b[1] > scale || b[0] > b[1]) return `bar [${b[0]}, ${b[1]}] out of range 0..${scale}`;
    }
    if (beat.tone !== undefined && !['input', 'merged'].includes(beat.tone)) {
      return "tone must be 'input' or 'merged'";
    }
    return null;
  },
  'node-chain': (visual, beat) => {
    const len = visual.nodes?.length ?? 0;
    if (!Array.isArray(visual.nodes) || len === 0) return 'node-chain needs a non-empty `nodes` array';
    for (const v of visual.nodes) {
      if (typeof v !== 'string' && typeof v !== 'number') return 'node values must be strings or numbers';
    }
    if (beat.pointer !== undefined && beat.pointer !== null) {
      if (!isInt(beat.pointer) || beat.pointer < 0 || beat.pointer > len - 1) {
        return `pointer ${beat.pointer} out of range for ${len} nodes`;
      }
    }
    if (beat.pointerLabel !== undefined && !isStr(beat.pointerLabel)) return 'pointerLabel must be a string';
    if (beat.reversed !== undefined && typeof beat.reversed !== 'boolean') return 'reversed must be a boolean';
    return null;
  },
  'tree-view': (visual, beat) => {
    if (!Array.isArray(visual.tree) || visual.tree.length !== 3) {
      return 'tree-view needs a `tree` as a nested [value, left, right] array';
    }
    const paths = treePaths(visual.tree);
    if (beat.active !== undefined && !paths.has(beat.active)) {
      return `active path "${beat.active}" is not a node in the tree`;
    }
    if (beat.visited !== undefined) {
      if (!Array.isArray(beat.visited)) return 'visited must be an array of node paths';
      for (const p of beat.visited) if (!paths.has(p)) return `visited path "${p}" is not a node in the tree`;
    }
    return null;
  },
};

// Validate a visual block (from read.visual or a `visual` item). Returns an
// array of error strings (empty = valid).
export function validateVisual(visual) {
  const errors = [];
  if (!visual || typeof visual !== 'object') return ['visual is not an object'];
  if (!VISUAL_WIDGETS.includes(visual.widget)) {
    return [`unknown visual widget "${visual.widget}"`];
  }
  if (!isStr(visual.caption)) errors.push('visual needs a caption');
  if (!Array.isArray(visual.beats) || visual.beats.length === 0) {
    errors.push('visual needs a non-empty beats array');
    return errors;
  }
  const rule = BEAT_RULES[visual.widget];
  visual.beats.forEach((beat, i) => {
    if (!beat || typeof beat !== 'object') {
      errors.push(`beat ${i + 1} is not an object`);
      return;
    }
    if (!isStr(beat.caption)) errors.push(`beat ${i + 1} needs a caption`);
    const err = rule(visual, beat);
    if (err) errors.push(`beat ${i + 1}: ${err}`);
  });
  // verifyCode ties the visual to real behavior: both or neither, and the gate
  // runs the code to confirm the claimed output.
  if (visual.verifyCode !== undefined || visual.verifyOutput !== undefined) {
    if (!isStr(visual.verifyCode)) errors.push('verifyCode must be a string when verifyOutput is set');
    if (typeof visual.verifyOutput !== 'string') errors.push('verifyOutput must be a string when verifyCode is set');
    // text-reveal's final beat IS the text Python prints — tie them so the
    // scramble can never settle on something other than the real output.
    if (visual.widget === 'text-reveal' && typeof visual.verifyOutput === 'string') {
      const lastText = visual.beats[visual.beats.length - 1]?.text;
      if (lastText !== visual.verifyOutput.trim()) {
        errors.push(`text-reveal last beat "${lastText}" must equal verifyOutput "${visual.verifyOutput.trim()}"`);
      }
    }
  }
  return errors;
}
