// localStorage persistence. Everything the app remembers lives under these keys,
// and export/import round-trips all of it as one JSON file.

const PROGRESS_KEY = 'zoro.progress.v1';
const CUSTOM_QUESTIONS_KEY = 'zoro.customQuestions.v1';

export const EMPTY_PROGRESS = {
  solved: {}, // questionId -> { firstSolvedAt, attempts, solves, mistakes, lastSolvedAt }
  drafts: {}, // questionId -> code string
  srs: {}, // questionId -> { stage: 0..4, nextDue: 'YYYY-MM-DD' }
  streak: { count: 0, lastActiveDate: null, restDays: 2 }, // restDays = rest allowance, see progress.restAllowance
  activity: {}, // 'YYYY-MM-DD' -> { visited, solves, fails, missed: [id], goalMet }
  warmup: {}, // level -> { best, runs, lastRunAt }
  mock: [], // [{ id, title, difficulty, date, format, timeMs, passed, ... }]
  notes: {}, // questionId -> personal note ("what tripped me / key idea")
  bigo: { right: 0, wrong: 0 }, // after-solve complexity check-in record
  quiz: null, // pattern-recognition record — see state/patternQuiz.js (quizRecord)
  lessons: {}, // lessonId -> { completedAt, runs, missedIdx, srs: { stage, nextDue } }
  shop: {}, // { spent, owned: [itemId], equipped: { slot -> itemId } } — see state/shop.js
  skipped: {}, // questionId -> true: "I already know this one, stop offering it"
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// The shape every field must have. A spread alone is NOT enough protection:
// `{...EMPTY_PROGRESS, ...stored}` lets a field of the WRONG TYPE overwrite the
// correct default rather than fall back to it, and downstream `?? []` only
// guards null/undefined. One object where `mock` should be an array used to
// throw inside render — and with no server copy and the bad value sitting in
// localStorage, every reload re-read it. The app was unrecoverable without
// devtools. So every field is checked by kind, and anything that fails is
// replaced with its default instead of being trusted.
const PLAIN_OBJECT = 'object';
const FIELD_KINDS = {
  solved: PLAIN_OBJECT,
  drafts: PLAIN_OBJECT,
  srs: PLAIN_OBJECT,
  streak: PLAIN_OBJECT,
  activity: PLAIN_OBJECT,
  warmup: PLAIN_OBJECT,
  notes: PLAIN_OBJECT,
  bigo: PLAIN_OBJECT,
  lessons: PLAIN_OBJECT,
  shop: PLAIN_OBJECT,
  skipped: PLAIN_OBJECT,
  mock: 'array',
  quiz: 'any', // legitimately null until the first drill round
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Repair a parsed record into something every reader can rely on. Unknown keys
// are kept (a newer version's field must survive a round-trip through an older
// build), but every KNOWN key is forced to its declared kind.
export function sanitizeProgress(raw) {
  const base = structuredClone(EMPTY_PROGRESS);
  if (!isPlainObject(raw)) return base;

  const out = { ...base, ...raw };
  for (const [key, kind] of Object.entries(FIELD_KINDS)) {
    if (kind === 'any') continue;
    const ok = kind === 'array' ? Array.isArray(out[key]) : isPlainObject(out[key]);
    if (!ok) out[key] = key in base ? structuredClone(base[key]) : kind === 'array' ? [] : {};
  }
  // streak carries required members, so merge rather than only type-check it.
  out.streak = { ...EMPTY_PROGRESS.streak, ...out.streak };
  return out;
}

export function loadProgress() {
  return sanitizeProgress(safeParse(localStorage.getItem(PROGRESS_KEY), null));
}

export function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadCustomQuestions() {
  const qs = safeParse(localStorage.getItem(CUSTOM_QUESTIONS_KEY), []);
  return Array.isArray(qs) ? qs : [];
}

export function saveCustomQuestions(questions) {
  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
}

// ---- backup bookkeeping ----

const BACKUP_KEY = 'zoro.backup.v1'; // 'YYYY-MM-DD' of the last export

export function loadLastBackup(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(BACKUP_KEY) || null;
  } catch {
    return null;
  }
}

export function markBackedUp(dateStr, storage = globalThis.localStorage) {
  try {
    storage?.setItem(BACKUP_KEY, dateStr);
  } catch {
    // non-fatal: the nudge just stays
  }
}

// Trigger the JSON download and record the backup date. Returns the date.
export function downloadExport(progress, customQuestions) {
  const blob = new Blob([exportData(progress, customQuestions)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `zoroclaude-dojo-export-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  markBackedUp(date);
  return date;
}

// ---- export / import ----

export function exportData(progress, customQuestions) {
  return JSON.stringify(
    {
      app: 'zoroclaude-dojo',
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      customQuestions,
    },
    null,
    2
  );
}

// Returns { progress, customQuestions } or throws with a human-readable message.
export function parseImport(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!data || data.app !== 'zoroclaude-dojo' || !data.progress) {
    throw new Error('That file does not look like a ZoroClaude Dojo export.');
  }
  // An export is the ONE piece of data a user hands us from outside, and
  // restoring it replaces their whole record. `app: 'zoroclaude-dojo'` says
  // where a file came from, not that it is well formed — a file from a newer
  // build, or one edited by hand, passes that check and can still carry a
  // field of the wrong type. Sanitize it exactly like a stored record.
  const progress = sanitizeProgress(data.progress);
  const customQuestions = Array.isArray(data.customQuestions) ? data.customQuestions : [];
  return { progress, customQuestions };
}

// What restoring this file would do, so Settings can say it out loud BEFORE
// overwriting anything. Import is destructive and was silent; a count of what
// arrives is the difference between a restore and an accident.
export function importSummary(progress, customQuestions = []) {
  const p = sanitizeProgress(progress);
  const solves = Object.values(p.solved).filter((e) => (e?.solves || 0) > 0).length;
  return {
    solves,
    lessons: Object.values(p.lessons).filter((l) => l?.completedAt).length,
    mocks: p.mock.length,
    customQuestions: customQuestions.length,
  };
}
