import { useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import { importPack } from '../questions/importPack.js';

// The prompt you paste into a Claude Project/chat to generate a daily pack.
// Claude replies with JSON; you paste that JSON below. The app never calls an
// LLM itself — you are the bridge.
export const CLAUDE_PROMPT = `You are generating practice problems for my personal LeetCode-style trainer. Output RAW JSON ONLY — no prose, no markdown fences — shaped as {"questions": [ ... ]}.

Each question object:
{
  "id": "kebab-case-unique-id",
  "track": "python" | "pandas" | "sql",
  "title": "Short title",
  "difficulty": "easy" | "medium" | "hard",
  "pattern": "kebab-case-tag, e.g. hashing, two-pointers, sliding-window, groupby, window-functions",
  "description": "Markdown problem statement. Be precise about the exact return value / result shape.",
  "examples": ["input -> output as short strings"],
  "function_name": "snake_case_name",   // python/pandas only; "" for sql
  "starter_code": "runnable starter stub I edit",
  "tests": [ {"args": [...], "expected": ...}, ... ],   // >= 4 tests incl. one edge case; python/pandas only, [] for sql
  "hint": "One nudge, not the full answer.",
  "approach": "Markdown walkthrough of how the reference solution works and its complexity.",
  "solution": "A complete, correct reference solution.",

  // SQL ONLY, instead of tests:
  "sql_setup": "CREATE TABLE ...; INSERT INTO ... ;",
  "expected_rows": [[...], ...],
  "order_matters": false
}

Rules:
- Every value must be JSON-serializable. No NaN/Infinity/dates.
- Solutions must be deterministic: no input(), randomness, files, or network.
- The runner normalizes results before comparing: tuples->lists, sets->sorted lists, dict keys->strings, whole floats->ints (10.0->10), DataFrames->records lists, Series->lists. Write "expected" in that normalized form.
- pandas: pass a DataFrame arg as {"__df__": [{"col": val, ...}, ...]}; expected DataFrames are plain records arrays. Solutions start with "import pandas as pd".
- sql: include full sql_setup + expected_rows (the exact result of your solution).
- CRITICAL: mentally execute your solution against EVERY test (or sql_setup) and make the expected values exactly what it produces. Wrong expected values make the question unusable — my app re-runs your solution and rejects any that don't pass.

Make N questions on these topics/difficulties: [FILL IN — e.g. "3 easy python: contains-duplicate, valid-palindrome, group-anagrams"].`;

export default function ImportModal({ existingIds, onImported, onClose }) {
  const trapRef = useRef(null);
  useFocusTrap(trapRef, { onEscape: onClose });
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null); // { accepted, rejected }
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleImport() {
    if (!text.trim()) {
      setError('Paste the JSON Claude gave you first.');
      return;
    }
    setWorking(true);
    setError('');
    setResult(null);
    setStatus('Reading…');
    try {
      const res = await importPack(text, { existingIds, onProgress: setStatus });
      setResult(res);
      if (res.accepted.length) onImported(res.accepted);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setWorking(false);
      setStatus('');
    }
  }

  function copyPrompt() {
    navigator.clipboard?.writeText(CLAUDE_PROMPT).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setError('Could not copy — select the text manually.')
    );
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !working && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Import questions" ref={trapRef}>
        <h2>＋ Import questions</h2>
        <p className="note">
          Ask Claude (in a Project or chat) for questions using the prompt below, paste the JSON it
          returns, and the dojo verifies every solution in the real runner before adding it. Nothing
          here talks to an AI — you bring the questions in.
        </p>

        <details className="hint" style={{ marginTop: 12 }}>
          <summary>Step 1 — the prompt to give Claude</summary>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', margin: '8px 0' }}>
            <button className="btn" onClick={copyPrompt}>
              {copied ? '✓ Copied' : 'Copy prompt'}
            </button>
          </div>
          <pre className="solution-pre" style={{ maxHeight: 220 }}>
            {CLAUDE_PROMPT}
          </pre>
        </details>

        <label htmlFor="import-json">Step 2 — paste Claude&apos;s JSON</label>
        <textarea
          id="import-json"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{"questions": [ ... ]}'
          rows={8}
          disabled={working}
        />

        {working && (
          <div className="loader" style={{ padding: '14px 0 2px' }}>
            <div className="spinner" aria-hidden="true" />
            <span role="status">{status || 'Working…'}</span>
          </div>
        )}
        {error && (
          <p className="note" role="alert" style={{ color: 'var(--crimson)', marginTop: 12 }}>
            {error}
          </p>
        )}
        {result && (
          <div className="import-result" role="status">
            {result.accepted.length > 0 && (
              <p style={{ color: 'var(--jade)' }}>
                ✓ Added {result.accepted.length} verified question
                {result.accepted.length === 1 ? '' : 's'}.
              </p>
            )}
            {result.rejected.length > 0 && (
              <>
                <p style={{ color: 'var(--crimson)' }}>
                  ✗ Rejected {result.rejected.length}:
                </p>
                <ul className="reject-list">
                  {result.rejected.map((r, i) => (
                    <li key={i}>
                      <code>{r.id}</code> — {r.reason}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={working}>
            {result?.accepted.length ? 'Done' : 'Close'}
          </button>
          <button className="btn btn-gold" onClick={handleImport} disabled={working}>
            {working ? 'Verifying…' : 'Import & verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
