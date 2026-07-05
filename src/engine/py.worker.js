// Pyodide lives in this worker so the main thread never freezes and an
// infinite loop can be killed by terminating the worker from outside.
import { PY_HARNESS } from './pyHarness.js';

const PYODIDE_VERSION = '0.27.7'; // keep in sync with the pyodide devDependency
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

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

self.onmessage = async (event) => {
  const { type, runId, payload, needsPandas } = event.data;
  if (type !== 'run') return;
  try {
    const pyodide = await getPyodide(runId);
    if (needsPandas && !pandasLoaded) {
      self.postMessage({ type: 'status', phase: 'loading-pandas', runId });
      await pyodide.loadPackage('pandas');
      pandasLoaded = true;
    }
    self.postMessage({ type: 'status', phase: 'running', runId });
    pyodide.globals.set('PAYLOAD_JSON', JSON.stringify(payload));
    const resultJson = await pyodide.runPythonAsync(PY_HARNESS);
    self.postMessage({ type: 'result', runId, data: JSON.parse(resultJson) });
  } catch (err) {
    self.postMessage({ type: 'error', runId, message: String(err?.message || err) });
  }
};
