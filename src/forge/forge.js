// The Forge: asks Claude to write a brand-new question, validates it strictly,
// then proves the generated solution actually passes its own tests in the real
// runner before it can enter the bank. One automatic retry with failure
// details; never accept an unverified question.
import { validateQuestion } from '../data/validateQuestion.js';
import { runQuestion } from '../engine/runnerClient.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function buildPrompt({ track, topic, difficulty, existingIds }) {
  const trackRules =
    track === 'sql'
      ? `- "track" is "sql". Include "sql_setup" (full CREATE TABLE statements plus INSERT statements with enough rows that the query is meaningfully tested, including at least one edge-case row), "expected_rows" (array of row arrays — the exact result of running your solution against sql_setup), and "order_matters" (true only if the task specifies an ordering). "tests" must be []. "function_name" must be "". The solution must be a single SELECT query (subqueries/CTEs/window functions allowed). starter_code should be a short SQL comment describing the table schema plus "SELECT ...".`
      : `- "track" is "${track}". Include "function_name" (snake_case) and "tests": at least 4 test cases, one of which must be an edge case (empty input, single element, ties, negatives, or similar). Each test is {"args": [...], "expected": ...}.
- The runner compares values after normalization: tuples become lists, sets become sorted lists, dict keys become strings, floats with whole values become integers (e.g. 10.0 -> 10), DataFrames become records-orient lists of dicts, Series become lists. Write "expected" in that normalized form. If a function returns a set, write "expected" as a sorted list.${
          track === 'pandas'
            ? `
- To pass a DataFrame as an argument, write it as {"__df__": [{"col": value, ...}, ...]} (records orient). The runner converts it to a pd.DataFrame before calling the function. Expected DataFrames are plain records-orient arrays (no __df__ wrapper). The solution must start with "import pandas as pd". Avoid empty DataFrames as inputs. If the solution returns a DataFrame, reset the index.`
            : ''
        }`;

  return `Create ONE brand-new ${difficulty} ${track} practice question about "${topic}" for a data scientist rebuilding fundamentals for DS/FDE interviews.

Respond with RAW JSON ONLY — no markdown fences, no commentary, nothing before the first { or after the last }.

The JSON must match exactly this shape:
{
  "id": "kebab-case-unique-id",
  "track": "${track}",
  "title": "Short title",
  "difficulty": "${difficulty}",
  "pattern": "kebab-case-pattern-tag",
  "description": "Markdown problem statement. Be precise about the required return value/result shape.",
  "examples": ["input -> output examples as short strings"],
  "function_name": ${track === 'sql' ? '""' : '"snake_case_name"'},
  "starter_code": "runnable starter stub the user edits",
  "tests": [...],
  ${track === 'sql' ? '"sql_setup": "CREATE TABLE ...; INSERT INTO ...;",\n  "expected_rows": [[...], ...],\n  "order_matters": false,' : ''}
  "hint": "One concrete nudge, not the full answer.",
  "solution": "A complete reference solution."
}

Hard rules:
- Every value must be JSON-serializable. No NaN, Infinity, dates, or custom objects in args/expected.
- The solution must be fully deterministic: no input(), no randomness, no file or network access, no printing required for correctness.
- The id must be kebab-case and must NOT be one of: ${existingIds.join(', ')}.
${trackRules}
- CRITICAL: before answering, mentally execute your solution against EVERY test case (or against sql_setup) step by step and make sure the expected values are exactly what the solution produces. Wrong expected values make the question unusable.`;
}

async function callClaude(apiKey, messages) {
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required opt-in for calling the API from a browser. The key lives in
        // the user's own localStorage and goes only to api.anthropic.com.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        messages,
      }),
    });
  } catch {
    throw new Error('Could not reach api.anthropic.com — check your connection.');
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.error?.message || detail;
    } catch {
      /* keep the status text */
    }
    if (response.status === 401) {
      throw new Error('Anthropic rejected the API key (401). Check it in Settings.');
    }
    throw new Error(`Anthropic API error: ${detail}`);
  }

  const data = await response.json();
  if (data.stop_reason === 'refusal') {
    throw new Error('Claude declined this topic — try a different one.');
  }
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
  if (!text) throw new Error('Claude returned an empty response — try again.');
  return text;
}

export function extractJson(text) {
  // Strip markdown fences if present, then take first { ... last }.
  const cleaned = text.replace(/```(?:json)?/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('The response contained no JSON object.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function describeVerifyFailure(report) {
  if (report.status === 'error') {
    return `running your solution produced a ${report.errorType} error: ${report.message}`;
  }
  if (report.sql) {
    return `your solution's result rows were ${JSON.stringify(
      report.sql.userRows
    )} but expected_rows was ${JSON.stringify(report.sql.expectedRows)}`;
  }
  const bad = (report.results || [])
    .map((r, i) =>
      r.pass
        ? null
        : `test ${i + 1} (args: ${r.argsRepr}): ${
            r.error ? `raised ${r.error}` : `expected ${r.expectedRepr} but your solution returned ${r.gotRepr}`
          }`
    )
    .filter(Boolean);
  return `your own solution failed its tests — ${bad.join('; ')}`;
}

// Main entry. Resolves to a verified Question, or throws with a friendly message.
export async function forgeQuestion({ apiKey, track, topic, difficulty, existingIds, onStatus }) {
  if (!apiKey) {
    const err = new Error('No API key set. Add your Anthropic API key in Settings first.');
    err.code = 'no-api-key';
    throw err;
  }

  const prompt = buildPrompt({ track, topic, difficulty, existingIds });
  const messages = [{ role: 'user', content: prompt }];

  for (let attempt = 1; attempt <= 2; attempt++) {
    onStatus?.(attempt === 1 ? 'Asking Claude to forge the question…' : 'Asking Claude to fix it…');
    const rawText = await callClaude(apiKey, messages);

    let question;
    let failureDetail = null;
    try {
      question = extractJson(rawText);
      const schemaErrors = validateQuestion(question, { existingIds, minTests: 4 });
      if (schemaErrors.length) {
        failureDetail = `the JSON did not match the schema: ${schemaErrors.join('; ')}`;
        question = null;
      }
    } catch (err) {
      failureDetail = `the response was not valid JSON (${err.message})`;
    }

    if (question) {
      onStatus?.('Verifying the solution in the real runner…');
      const report = await runQuestion(question, question.solution, () => {});
      if (report.allPassed) {
        return question; // verified — safe to add to the bank
      }
      failureDetail = describeVerifyFailure(report);
    }

    if (attempt === 1) {
      messages.push(
        { role: 'assistant', content: rawText },
        {
          role: 'user',
          content: `That question failed verification: ${failureDetail}. Fix the problem and resend the FULL corrected JSON (raw JSON only, same rules as before).`,
        }
      );
    }
  }

  throw new Error('Forge failed twice — try a different topic or difficulty.');
}
