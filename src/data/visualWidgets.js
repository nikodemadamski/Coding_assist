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
];

const isInt = (n) => Number.isInteger(n);
const isStr = (s) => typeof s === 'string' && s.trim().length > 0;

// Per-widget beat validators. Each returns an error string or null for a beat,
// given the visual's shared context (the list, the vars, etc.).
const BEAT_RULES = {
  'list-cells': (visual, beat) => {
    const len = visual.list?.length ?? 0;
    if (!Array.isArray(visual.list) || len === 0) return 'list-cells needs a non-empty `list`';
    if (beat.pointer !== undefined) {
      if (!isInt(beat.pointer) || beat.pointer < -len || beat.pointer > len - 1) {
        return `pointer ${beat.pointer} out of range for a list of ${len}`;
      }
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
