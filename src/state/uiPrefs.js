// UI preferences for the problem workspace: how wide the problem panel is,
// how tall the editor is above the test console (both draggable dividers), and
// the editor font size. Stored separately from training progress so an
// export/import never touches cosmetic choices.

const KEY = 'zoro.ui.v1';

export const SPLIT_MIN = 25; // % — problem pane never collapses to nothing
export const SPLIT_MAX = 65; // % — the editor always keeps at least a third
// % of the code column given to the editor; the console takes the rest. The
// console must always keep enough height to show its tabs and one case.
export const VSPLIT_MIN = 30;
export const VSPLIT_MAX = 85;
export const FONT_MIN = 12;
export const FONT_MAX = 20;

// Whose dojo this is. The home screen greets you by name — it's a training
// log for one person, and it should sound like it.
export const NAME_MAX = 24;
export const UI_DEFAULTS = { split: 42, vsplit: 62, fontSize: 14, name: 'Nick' };

export function clampName(v) {
  const s = typeof v === 'string' ? v.trim().slice(0, NAME_MAX) : '';
  return s || UI_DEFAULTS.name;
}

export function clampSplit(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return UI_DEFAULTS.split;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(n)));
}

export function clampVSplit(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return UI_DEFAULTS.vsplit;
  return Math.min(VSPLIT_MAX, Math.max(VSPLIT_MIN, Math.round(n)));
}

export function clampFont(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return UI_DEFAULTS.fontSize;
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));
}

export function loadUiPrefs(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      split: clampSplit(parsed.split ?? UI_DEFAULTS.split),
      vsplit: clampVSplit(parsed.vsplit ?? UI_DEFAULTS.vsplit),
      fontSize: clampFont(parsed.fontSize ?? UI_DEFAULTS.fontSize),
      name: clampName(parsed.name ?? UI_DEFAULTS.name),
    };
  } catch {
    return { ...UI_DEFAULTS };
  }
}

// Merge a patch into the stored prefs and return the clamped result.
export function saveUiPrefs(patch, storage = globalThis.localStorage) {
  const next = { ...loadUiPrefs(storage), ...patch };
  const clamped = {
    split: clampSplit(next.split),
    vsplit: clampVSplit(next.vsplit),
    fontSize: clampFont(next.fontSize),
    name: clampName(next.name),
  };
  try {
    storage?.setItem(KEY, JSON.stringify(clamped));
  } catch {
    // storage full/unavailable: the in-memory value still applies this session
  }
  return clamped;
}
