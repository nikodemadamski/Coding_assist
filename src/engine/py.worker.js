// Pyodide lives in this worker so the main thread never freezes and an
// infinite loop can be killed by terminating the worker from outside.
import { PY_HARNESS, PY_TRACE_HARNESS, PY_SNIPPET_HARNESS } from './pyHarness.js';

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

// **A dead interpreter must never be reused.** Some failures do not merely
// throw — they END the WebAssembly program (Emscripten's ExitStatus, an abort,
// an out-of-memory). After that the Pyodide object still exists and
// `pyodidePromise` is still a happily-resolved promise, but every call into it
// fails identically forever. That is what made one exit() lock a learner out of
// the app: correct code afterwards never reached Python at all.
//
// Rather than pattern-match Emscripten's wording (which changes between
// versions), ask the interpreter to do the smallest possible thing. If it
// cannot, it is gone.
function isRuntimeUsable(pyodide) {
  try {
    pyodide.runPython('1');
    return true;
  } catch {
    return false;
  }
}

// Drop the cached runtime so the NEXT run boots a clean one. The wasm is
// already in the browser's cache, so the reboot is fast.
function discardRuntime() {
  pyodidePromise = null;
  pandasLoaded = false;
}

// 'run' executes the test harness; 'trace' the visualizer tracer; 'snippet'
// runs a lesson script with stdout captured.
const HARNESS_BY_TYPE = { run: PY_HARNESS, trace: PY_TRACE_HARNESS, snippet: PY_SNIPPET_HARNESS };

self.onmessage = async (event) => {
  const { type, runId, payload, needsPandas } = event.data;
  const harness = HARNESS_BY_TYPE[type];
  if (!harness) return;
  let pyodide = null;
  try {
    pyodide = await getPyodide(runId);
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
    // Did this failure take the interpreter with it? If the runtime never
    // loaded at all there is nothing to probe, and it is equally unusable.
    const fatal = !pyodide || !isRuntimeUsable(pyodide);
    if (fatal) discardRuntime();
    self.postMessage({
      type: 'error',
      runId,
      fatal,
      message: String(err?.message || err),
    });
  }
};
