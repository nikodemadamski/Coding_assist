// Test-side execution engines. These reuse the exact same harness string and
// comparison logic as the browser app (src/engine/*), so a green `npm test`
// means the real runners accept every reference solution.
import './proxy-shim.mjs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { PY_HARNESS, PY_SNIPPET_HARNESS, buildPayload, harnessResultToReport } from '../src/engine/pyHarness.js';
import { runSqlQuestion } from '../src/engine/sqlCore.js';

const require = createRequire(import.meta.url);

let pyodide = null;
let pandasEngine = null; // 'pyodide' | 'cpython'

async function getPyodide() {
  if (!pyodide) {
    const { loadPyodide } = await import('pyodide');
    pyodide = await loadPyodide();
  }
  return pyodide;
}

async function runInPyodide(question, code) {
  const py = await getPyodide();
  py.globals.set('PAYLOAD_JSON', JSON.stringify(buildPayload(question, code)));
  const resultJson = await py.runPythonAsync(PY_HARNESS);
  return harnessResultToReport(JSON.parse(resultJson));
}

// Fallback for environments where the Pyodide package CDN is unreachable:
// run the identical harness under system CPython (needs `pip install pandas`).
const CPYTHON_WRAPPER = `
import sys, json
g = {"PAYLOAD_JSON": sys.argv[2]}
exec(sys.argv[1], g)
sys.stdout.write("\\n__HARNESS_RESULT__" + json.dumps(g["outcome"]))
`;

function runInCPython(question, code) {
  const payload = JSON.stringify(buildPayload(question, code));
  const proc = spawnSync('python3', ['-c', CPYTHON_WRAPPER, PY_HARNESS, payload], {
    encoding: 'utf8',
    timeout: 60000,
  });
  if (proc.status !== 0) {
    throw new Error(`CPython harness failed: ${proc.stderr || proc.stdout}`);
  }
  const marker = proc.stdout.lastIndexOf('__HARNESS_RESULT__');
  if (marker === -1) throw new Error(`CPython harness produced no result: ${proc.stdout}`);
  return harnessResultToReport(
    JSON.parse(proc.stdout.slice(marker + '__HARNESS_RESULT__'.length))
  );
}

async function resolvePandasEngine() {
  if (pandasEngine) return pandasEngine;
  try {
    const py = await getPyodide();
    // loadPackage logs-but-resolves on download failure; verify importability.
    await py.loadPackage('pandas');
    const ok = py.runPython('__import__("importlib.util").util.find_spec("pandas") is not None');
    if (!ok) throw new Error('pandas wheel did not load');
    pandasEngine = 'pyodide';
  } catch {
    const check = spawnSync('python3', ['-c', 'import pandas'], { encoding: 'utf8' });
    if (check.status !== 0) {
      throw new Error(
        'pandas is unavailable: the Pyodide CDN is unreachable and system python3 has no pandas. ' +
          'Either allow network access to cdn.jsdelivr.net or `pip install pandas`.'
      );
    }
    pandasEngine = 'cpython';
    console.log('  (Pyodide CDN unreachable — verifying pandas questions with system CPython)');
  }
  return pandasEngine;
}

export async function runPy(question, code) {
  if (question.track === 'pandas') {
    const engine = await resolvePandasEngine();
    if (engine === 'cpython') return runInCPython(question, code);
  }
  return runInPyodide(question, code);
}

// Run a lesson snippet (a small python SCRIPT) with stdout captured, through
// the EXACT harness the browser worker uses. Returns { status, stdout|message }.
export async function runPySnippet(code) {
  const py = await getPyodide();
  py.globals.set('PAYLOAD_JSON', JSON.stringify({ code }));
  return JSON.parse(await py.runPythonAsync(PY_SNIPPET_HARNESS));
}

// Execute standalone pandas snippets (warm-up answers) against a prelude that
// builds the DataFrames they reference. Each snippet runs in a fresh namespace
// so assignment drills can't leak into each other. Returns failure strings.
const SNIPPET_RUNNER = `
import json
_payload = json.loads(SNIPPETS_JSON)
_failures = []
for _ans in _payload["answers"]:
    _ns = {}
    try:
        exec(_payload["prelude"], _ns)
        exec(compile(_ans, "<warmup>", "exec"), _ns)
    except Exception as _err:
        _failures.append(f"{_ans}  ({type(_err).__name__}: {_err})")
json.dumps(_failures)
`;

export async function runPandasSnippets(prelude, answers) {
  const engine = await resolvePandasEngine();
  const payload = JSON.stringify({ prelude, answers });
  if (engine === 'pyodide') {
    const py = await getPyodide();
    py.globals.set('SNIPPETS_JSON', payload);
    return JSON.parse(await py.runPythonAsync(SNIPPET_RUNNER));
  }
  const wrapper = `
import sys, json
payload = json.loads(sys.argv[1])
failures = []
for ans in payload["answers"]:
    ns = {}
    try:
        exec(payload["prelude"], ns)
        exec(compile(ans, "<warmup>", "exec"), ns)
    except Exception as err:
        failures.append(f"{ans}  ({type(err).__name__}: {err})")
sys.stdout.write("\\n__SNIPPETS_RESULT__" + json.dumps(failures))
`;
  const proc = spawnSync('python3', ['-c', wrapper, payload], {
    encoding: 'utf8',
    timeout: 120000,
  });
  if (proc.status !== 0) {
    throw new Error(`CPython snippet runner failed: ${proc.stderr || proc.stdout}`);
  }
  const marker = proc.stdout.lastIndexOf('__SNIPPETS_RESULT__');
  if (marker === -1) throw new Error(`snippet runner produced no result: ${proc.stdout}`);
  return JSON.parse(proc.stdout.slice(marker + '__SNIPPETS_RESULT__'.length));
}

let SQL = null;

export async function runSql(question, code) {
  if (!SQL) {
    const initSqlJs = require('sql.js');
    SQL = await initSqlJs();
  }
  return runSqlQuestion(SQL, question, code);
}
