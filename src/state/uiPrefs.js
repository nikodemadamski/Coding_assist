// UI preferences for the problem workspace: how wide the problem panel is
// (draggable divider) and the editor font size. Stored separately from
// training progress so an export/import never touches cosmetic choices.

const KEY = 'zoro.ui.v1';

export const SPLIT_MIN = 25; // % — problem pane never collapses to nothing
export const SPLIT_MAX = 65; // % — the editor always keeps at least a third
export const FONT_MIN = 12;
export const FONT_MAX = 20;

export const UI_DEFAULTS = { split: 42, fontSize: 14 };

export function clampSplit(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return UI_DEFAULTS.split;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(n)));
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
      fontSize: clampFont(parsed.fontSize ?? UI_DEFAULTS.fontSize),
    };
  } catch {
    return { ...UI_DEFAULTS };
  }
}

// Merge a patch into the stored prefs and return the clamped result.
export function saveUiPrefs(patch, storage = globalThis.localStorage) {
  const next = { ...loadUiPrefs(storage), ...patch };
  const clamped = { split: clampSplit(next.split), fontSize: clampFont(next.fontSize) };
  try {
    storage?.setItem(KEY, JSON.stringify(clamped));
  } catch {
    // storage full/unavailable: the in-memory value still applies this session
  }
  return clamped;
}
