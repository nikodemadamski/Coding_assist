// localStorage persistence. Everything the app remembers lives under these keys,
// and export/import round-trips all of it as one JSON file.

const PROGRESS_KEY = 'zoro.progress.v1';
const CUSTOM_QUESTIONS_KEY = 'zoro.customQuestions.v1';

export const EMPTY_PROGRESS = {
  solved: {}, // questionId -> { firstSolvedAt, attempts, solves, mistakes, lastSolvedAt }
  drafts: {}, // questionId -> code string
  srs: {}, // questionId -> { stage: 0..4, nextDue: 'YYYY-MM-DD' }
  streak: { count: 0, lastActiveDate: null },
  activity: {}, // 'YYYY-MM-DD' -> { visited, solves, fails, missed: [id], goalMet }
  warmup: {}, // level -> { best, runs, lastRunAt }
  mock: [], // [{ id, title, difficulty, date, format, timeMs, passed, ... }]
  notes: {}, // questionId -> personal note ("what tripped me / key idea")
  bigo: { right: 0, wrong: 0 }, // after-solve complexity check-in record
  lessons: {}, // lessonId -> { completedAt, runs, missedIdx, srs: { stage, nextDue } }
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadProgress() {
  const p = safeParse(localStorage.getItem(PROGRESS_KEY), null);
  if (!p) return structuredClone(EMPTY_PROGRESS);
  return {
    ...structuredClone(EMPTY_PROGRESS),
    ...p,
    streak: { ...EMPTY_PROGRESS.streak, ...(p.streak || {}) },
    activity: p.activity || {},
  };
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
  const progress = {
    ...structuredClone(EMPTY_PROGRESS),
    ...data.progress,
    streak: { ...EMPTY_PROGRESS.streak, ...(data.progress.streak || {}) },
    activity: data.progress.activity || {},
  };
  const customQuestions = Array.isArray(data.customQuestions) ? data.customQuestions : [];
  return { progress, customQuestions };
}
