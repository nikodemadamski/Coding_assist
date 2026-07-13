// Strict Lesson schema validation, mirroring validateQuestion.js. Used by the
// lesson test gate so a malformed lesson can never ship. Content rules encode
// the learning design: tiny reads, mostly doing, deterministic snippets (the
// gate EXECUTES them, so their output claims must be mechanically checkable).

import { validateVisual } from './visualWidgets.js';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ITEM_TYPES = ['predict', 'type', 'fix', 'write', 'watch', 'visual', 'arrange'];
export const READ_WORD_CAP = 120;

// Snippet code the gate runs must be reproducible: no user input, no
// randomness, no clocks. (Questions get freedom; lessons get determinism.)
const NONDETERMINISTIC = /\binput\s*\(|\brandom\b|\btime\b|\bdatetime\b|\bos\b|\bsys\b/;

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateLesson(lesson, { existingIds = [], chapterKeys = [], earlierIds = [] } = {}) {
  const errors = [];
  const need = (cond, msg) => {
    if (!cond) errors.push(msg);
  };

  if (!lesson || typeof lesson !== 'object') return ['lesson is not an object'];

  need(typeof lesson.id === 'string' && ID_RE.test(lesson.id), 'id must be a kebab-case string');
  need(!existingIds.includes(lesson.id), `id "${lesson.id}" already exists`);
  need(chapterKeys.includes(lesson.chapter), `chapter "${lesson.chapter}" is not a real chapter`);
  need(typeof lesson.title === 'string' && lesson.title.trim(), 'title is required');
  need(Number.isFinite(lesson.minutes) && lesson.minutes >= 1, 'minutes must be a number ≥ 1');

  // Prereqs must point at lessons that appear EARLIER in the path — this keeps
  // the dependency chain acyclic by construction.
  need(Array.isArray(lesson.prereqs), 'prereqs must be an array (possibly empty)');
  for (const p of lesson.prereqs ?? []) {
    need(earlierIds.includes(p), `prereq "${p}" must be an earlier lesson id`);
  }

  // Optional chapter-end transfer link: which warm-up level and path question
  // this lesson unlocks. IDs are checked for existence by the lesson gate.
  if (lesson.transfer !== undefined) {
    need(
      lesson.transfer && typeof lesson.transfer.warmup === 'string',
      'transfer.warmup must be a warm-up level key'
    );
    need(
      lesson.transfer.question === undefined || typeof lesson.transfer.question === 'string',
      'transfer.question must be a question id if present'
    );
  }

  // The read: a small text and one runnable example whose output is verified.
  const read = lesson.read;
  need(read && typeof read.text === 'string' && read.text.trim(), 'read.text is required');
  if (read?.text) {
    need(
      wordCount(read.text) <= READ_WORD_CAP,
      `read.text is ${wordCount(read.text)} words — cap is ${READ_WORD_CAP} (read less, do more)`
    );
  }
  need(
    read?.example && typeof read.example.code === 'string' && read.example.code.trim(),
    'read.example.code is required'
  );
  need(
    typeof read?.example?.expectedOutput === 'string',
    'read.example.expectedOutput is required (may be empty string)'
  );
  if (read?.example?.code) {
    need(!NONDETERMINISTIC.test(read.example.code), 'read example must be deterministic (no input/random/time)');
  }

  // Optional "See it" visual: a tap-through animated widget. Beats validated by
  // the shared widget registry; verifyCode determinism enforced here, its real
  // execution checked by the lesson gate.
  if (read?.visual !== undefined) {
    for (const e of validateVisual(read.visual)) errors.push(`read.visual: ${e}`);
    if (read.visual?.verifyCode) {
      need(!NONDETERMINISTIC.test(read.visual.verifyCode), 'read.visual.verifyCode must be deterministic');
    }
  }

  // Items: 4–12 of them, each a valid shape for its type; at least one
  // predict (active recall) and one hands-on (type/fix/write).
  const items = lesson.items;
  if (!Array.isArray(items) || items.length < 4 || items.length > 12) {
    errors.push(`items must be an array of 4–12 exercises (got ${items?.length ?? 'none'})`);
    return errors;
  }
  need(items.some((i) => i.type === 'predict'), 'needs at least one predict item');
  need(
    items.some((i) => ['type', 'fix', 'write', 'arrange'].includes(i.type)),
    'needs at least one hands-on item (type/fix/write/arrange)'
  );

  items.forEach((item, i) => {
    const at = `item ${i + 1}`;
    if (!ITEM_TYPES.includes(item.type)) {
      errors.push(`${at}: unknown type "${item.type}"`);
      return;
    }
    if (item.type === 'predict') {
      need(typeof item.code === 'string' && item.code.trim(), `${at}: predict needs code`);
      need(typeof item.answer === 'string' && item.answer.trim(), `${at}: predict needs the answer`);
      need(item.accept === undefined || Array.isArray(item.accept), `${at}: accept must be an array`);
      need(typeof item.why === 'string' && item.why.trim(), `${at}: predict needs a why`);
      if (item.code) need(!NONDETERMINISTIC.test(item.code), `${at}: predict code must be deterministic`);
    }
    if (item.type === 'type') {
      need(typeof item.prompt === 'string' && item.prompt.trim(), `${at}: type needs a prompt`);
      need(typeof item.answer === 'string' && item.answer.trim(), `${at}: type needs the answer`);
      need(item.accept === undefined || Array.isArray(item.accept), `${at}: accept must be an array`);
      need(typeof item.why === 'string' && item.why.trim(), `${at}: type needs a why`);
    }
    if (item.type === 'fix' || item.type === 'write') {
      need(typeof item.brief === 'string' && item.brief.trim(), `${at}: needs a brief`);
      need(
        typeof item.function_name === 'string' && /^[a-z_][a-z0-9_]*$/i.test(item.function_name || ''),
        `${at}: needs a valid function_name`
      );
      need(Array.isArray(item.tests) && item.tests.length >= 1, `${at}: needs at least one test`);
      (item.tests ?? []).forEach((t, j) => {
        need(t && Array.isArray(t.args), `${at} test ${j + 1}: needs an args array`);
        need(t && 'expected' in t, `${at} test ${j + 1}: needs an expected value`);
      });
      try {
        JSON.stringify(item.tests);
      } catch {
        errors.push(`${at}: tests are not JSON-serializable`);
      }
      need(typeof item.solution === 'string' && item.solution.trim(), `${at}: needs a solution`);
      need(typeof item.hint === 'string' && item.hint.trim(), `${at}: needs a hint`);
      if (item.type === 'fix') {
        need(typeof item.code === 'string' && item.code.trim(), `${at}: fix needs the broken code`);
      }
      if (item.type === 'write') {
        need(
          typeof item.starter_code === 'string' && item.starter_code.trim(),
          `${at}: write needs starter_code`
        );
      }
    }
    if (item.type === 'watch') {
      need(typeof item.caption === 'string' && item.caption.trim(), `${at}: watch needs a caption`);
      need(typeof item.code === 'string' && item.code.trim(), `${at}: watch needs code`);
      need(
        typeof item.function_name === 'string' && /^[a-z_][a-z0-9_]*$/i.test(item.function_name || ''),
        `${at}: watch needs a valid function_name`
      );
      need(Array.isArray(item.tests) && item.tests.length >= 1, `${at}: watch needs a test to trace`);
    }
    if (item.type === 'visual') {
      for (const e of validateVisual(item)) errors.push(`${at}: ${e}`);
      if (item.verifyCode) {
        need(!NONDETERMINISTIC.test(item.verifyCode), `${at}: visual verifyCode must be deterministic`);
      }
    }
    if (item.type === 'arrange') {
      need(typeof item.brief === 'string' && item.brief.trim(), `${at}: arrange needs a brief`);
      need(
        typeof item.function_name === 'string' && /^[a-z_][a-z0-9_]*$/i.test(item.function_name || ''),
        `${at}: arrange needs a valid function_name`
      );
      need(
        Array.isArray(item.lines) && item.lines.length >= 2 && item.lines.every((l) => typeof l === 'string'),
        `${at}: arrange needs a lines array (≥2 code lines, already indented)`
      );
      // The scramble must be able to differ from the answer, or "order" is
      // meaningless — reject all-identical line sets.
      if (Array.isArray(item.lines)) {
        need(new Set(item.lines).size >= 2, `${at}: arrange lines must not be all identical`);
      }
      need(Array.isArray(item.tests) && item.tests.length >= 1, `${at}: arrange needs at least one test`);
      (item.tests ?? []).forEach((t, j) => {
        need(t && Array.isArray(t.args), `${at} test ${j + 1}: needs an args array`);
        need(t && 'expected' in t, `${at} test ${j + 1}: needs an expected value`);
      });
      try {
        JSON.stringify(item.tests);
      } catch {
        errors.push(`${at}: tests are not JSON-serializable`);
      }
      need(typeof item.hint === 'string' && item.hint.trim(), `${at}: arrange needs a hint`);
    }
  });

  return errors;
}
