// Main-thread client for the Pyodide worker. Owns the worker lifecycle:
// user code runs behind a hard 5-second timeout, enforced by terminating the
// worker (the only way to stop an infinite loop in WebAssembly).
import { buildPayload, harnessResultToReport } from './pyHarness.js';

export const PY_TIMEOUT_MS = 5000;
const LOAD_TIMEOUT_MS = 240000; // generous: first pyodide+pandas download on slow links

let worker = null;
let runSeq = 0;

function ensureWorker() {
  if (!worker) {
    worker = new Worker(new URL('./py.worker.js', import.meta.url), { type: 'module' });
  }
  return worker;
}

function killWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

export function runPythonQuestion(question, code, onStatus = () => {}) {
  const runId = ++runSeq;
  const w = ensureWorker();

  return new Promise((resolve) => {
    let execTimer = null;
    let loadTimer = null;

    const finish = (report) => {
      clearTimeout(execTimer);
      clearTimeout(loadTimer);
      w.removeEventListener('message', onMessage);
      resolve(report);
    };

    const onMessage = (event) => {
      const msg = event.data;
      if (msg.runId !== runId) return;
      if (msg.type === 'status') {
        onStatus(msg);
        if (msg.phase === 'running') {
          clearTimeout(loadTimer);
          // Only user code counts toward the 5s budget, not runtime download.
          execTimer = setTimeout(() => {
            w.removeEventListener('message', onMessage);
            killWorker(); // next run boots a fresh worker (browser-cached, fast)
            clearTimeout(loadTimer);
            resolve({
              status: 'error',
              errorType: 'timeout',
              message:
                'Time limit exceeded (5s) — check for infinite loops.\n' +
                'The Python runtime was restarted; the next run may take a moment.',
              allPassed: false,
            });
          }, PY_TIMEOUT_MS);
        }
      } else if (msg.type === 'result') {
        finish(harnessResultToReport(msg.data));
      } else if (msg.type === 'error') {
        finish({
          status: 'error',
          errorType: 'runtime',
          message: `The Python runtime hit a problem: ${msg.message}`,
          allPassed: false,
        });
      }
    };

    loadTimer = setTimeout(() => {
      w.removeEventListener('message', onMessage);
      killWorker();
      resolve({
        status: 'error',
        errorType: 'runtime',
        message: 'Loading the Python runtime timed out. Check your connection and try again.',
        allPassed: false,
      });
    }, LOAD_TIMEOUT_MS);

    w.addEventListener('message', onMessage);
    w.postMessage({
      type: 'run',
      runId,
      payload: buildPayload(question, code),
      needsPandas: question.track === 'pandas',
    });
  });
}
