// Pyodide lives in this worker so the main thread never freezes and an
// infinite loop can be killed by terminating the worker from outside.
import { PY_HARNESS, PY_TRACE_HARNESS } from './pyHarness.js';

const PYODIDE_VERSION = '0.27.7'; // keep in sync with the pyodide devDependency
// Overridable so the runtime can be self-hosted (VITE_PYODIDE_BASE=/pyodide/).
const CDN =
  import.meta.env?.VITE_PYODIDE_BASE || `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;
let pandasLoaded = false;

function getPyodide(runId) {
  if (!pyodidePromise) {
    self.postMessage({ type: 'status', phase: 'loading-pyodide', runId });
    pyodidePromise = import(/* @vite-ignore */ `${CDN}pyodide.mjs`).then((mod) =>
      mod.loadPyodide({ indexURL: CDN })
    );
  }
  return pyodidePromise;
}

// 'run' executes the test harness; 'trace' executes the visualizer tracer.
const HARNESS_BY_TYPE = { run: PY_HARNESS, trace: PY_TRACE_HARNESS };

self.onmessage = async (event) => {
  const { type, runId, payload, needsPandas } = event.data;
  const harness = HARNESS_BY_TYPE[type];
  if (!harness) return;
  try {
    const pyodide = await getPyodide(runId);
    if (needsPandas && !pandasLoaded) {
      self.postMessage({ type: 'status', phase: 'loading-pandas', runId });
      await pyodide.loadPackage('pandas');
      pandasLoaded = true;
    }
    self.postMessage({ type: 'status', phase: 'running', runId });
    pyodide.globals.set('PAYLOAD_JSON', JSON.stringify(payload));
    const resultJson = await pyodide.runPythonAsync(harness);
    self.postMessage({ type: 'result', runId, data: JSON.parse(resultJson) });
  } catch (err) {
    self.postMessage({ type: 'error', runId, message: String(err?.message || err) });
  }
};
