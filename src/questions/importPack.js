// Offline question import. You generate questions by talking to Claude (in a
// Claude Project/chat) using the prompt in ImportModal, paste the JSON here,
// and every question is schema-validated AND its solution is verified in the
// real in-browser runner before it can enter your bank. No network calls to any
// AI service — the app never talks to an LLM itself.
import { validateQuestion } from '../data/validateQuestion.js';
import { runQuestion } from '../engine/runnerClient.js';

function describeFail(report) {
  if (report.status === 'error') return `solution ${report.errorType} error: ${report.message}`;
  if (report.sql) return `solution result rows did not match expected_rows`;
  const bad = (report.results || [])
    .map((r, i) => (r.pass ? null : `test ${i + 1}: ${r.error || `expected ${r.expectedRepr}, got ${r.gotRepr}`}`))
    .filter(Boolean);
  return bad.join('; ') || 'solution did not pass its own tests';
}

// Accepts a single question object, a bare array, or { "questions": [...] }.
export function parsePack(text) {
  const data = JSON.parse(text); // may throw SyntaxError
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.questions)) return data.questions;
  if (data && typeof data === 'object') return [data];
  throw new Error('Expected a question object, an array, or {"questions": [...]}.');
}

// Returns { accepted: Question[], rejected: [{id, reason}] }.
export async function importPack(text, { existingIds = [], onProgress } = {}) {
  const list = parsePack(text);
  if (!list.length) throw new Error('No questions found in that JSON.');

  const seen = new Set(existingIds);
  const accepted = [];
  const rejected = [];

  for (let i = 0; i < list.length; i++) {
    const q = list[i];
    const label = q?.id || q?.title || `item ${i + 1}`;
    const errors = validateQuestion(q, { existingIds: [...seen], minTests: 4 });
    if (errors.length) {
      rejected.push({ id: label, reason: errors[0] });
      continue;
    }
    onProgress?.(`Verifying ${q.id}… (${i + 1}/${list.length})`);
    let report;
    try {
      report = await runQuestion(q, q.solution, () => {});
    } catch (err) {
      rejected.push({ id: q.id, reason: `runner error: ${String(err?.message || err)}` });
      continue;
    }
    if (!report.allPassed) {
      rejected.push({ id: q.id, reason: describeFail(report) });
      continue;
    }
    accepted.push({ ...q, imported: true });
    seen.add(q.id);
  }

  return { accepted, rejected };
}
