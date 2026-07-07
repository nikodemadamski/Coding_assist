// Strict Question schema validation. Used by the seed test gate and by the
// import flow before any pasted question is accepted.

const TRACKS = ['python', 'pandas', 'sql'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateQuestion(q, { existingIds = [], minTests = 1 } = {}) {
  const errors = [];
  const need = (cond, msg) => {
    if (!cond) errors.push(msg);
  };

  if (!q || typeof q !== 'object') return ['question is not an object'];

  need(typeof q.id === 'string' && ID_RE.test(q.id), 'id must be a kebab-case string');
  need(!existingIds.includes(q.id), `id "${q.id}" already exists`);
  need(TRACKS.includes(q.track), `track must be one of ${TRACKS.join(', ')}`);
  need(typeof q.title === 'string' && q.title.trim(), 'title is required');
  need(DIFFICULTIES.includes(q.difficulty), `difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  need(typeof q.pattern === 'string' && q.pattern.trim(), 'pattern is required');
  need(typeof q.description === 'string' && q.description.trim(), 'description is required');
  need(Array.isArray(q.examples), 'examples must be an array of strings');
  need(typeof q.starter_code === 'string' && q.starter_code.trim(), 'starter_code is required');
  need(typeof q.hint === 'string' && q.hint.trim(), 'hint is required');
  need(typeof q.solution === 'string' && q.solution.trim(), 'solution is required');
  // approach is optional, but if present it must be a string
  need(q.approach === undefined || typeof q.approach === 'string', 'approach must be a string if present');

  if (q.track === 'sql') {
    need(
      typeof q.sql_setup === 'string' && /create\s+table/i.test(q.sql_setup || ''),
      'sql questions need sql_setup with CREATE TABLE'
    );
    need(
      Array.isArray(q.expected_rows) && q.expected_rows.every((r) => Array.isArray(r)),
      'sql questions need expected_rows as an array of row arrays'
    );
    need(
      /select/i.test(q.solution || ''),
      'sql solution must be a SELECT query'
    );
  } else {
    need(
      typeof q.function_name === 'string' && /^[a-z_][a-z0-9_]*$/i.test(q.function_name || ''),
      'python/pandas questions need a valid function_name'
    );
    need(
      Array.isArray(q.tests) && q.tests.length >= minTests,
      `python/pandas questions need at least ${minTests} test(s)`
    );
    if (Array.isArray(q.tests)) {
      q.tests.forEach((t, i) => {
        need(t && Array.isArray(t.args), `test ${i + 1} needs an args array`);
        need(t && 'expected' in t, `test ${i + 1} needs an expected value`);
      });
    }
    // Everything must survive JSON — the runner round-trips through JSON.
    try {
      JSON.stringify(q.tests);
    } catch {
      errors.push('tests contain values that are not JSON-serializable');
    }
  }
  return errors;
}
