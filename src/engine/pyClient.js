// Main-thread client for the Pyodide worker. Owns the worker lifecycle:
// user code runs behind a hard 5-second timeout, enforced by terminating the
// worker (the only way to stop an infinite loop in WebAssembly).
import { buildPayload, buildTracePayload, harnessResultToReport } from './pyHarness.js';

export const PY_TIMEOUT_MS = 5000;
const LOAD_TIMEOUT_MS = 240000; // generous: first pyodide+pandas download on slow links

let worker = null;
let runSeq = 0;
// Every in-flight job's "settle with this error" callback. A job that never
// hears back (worker crash, or the worker being terminated by ANOTHER job's
// timeout) would otherwise hang forever, leaving the UI stuck on "Running…"
// with Run/Submit disabled. Killing the worker settles all of them.
const inFlight = new Set();

function ensureWorker() {
  if (!worker) {
    worker = new Worker(new URL('./py.worker.js', import.meta.url), { type: 'module' });
    // A worker-level failure (module load error, wasm abort, OOM) arrives as an
    // `error` event, never as a `message` — without this the promise never settles.
    worker.addEventListener('error', (e) => {
      killWorker({
        errorType: 'runtime',
        message: `The Python runtime crashed${e?.message ? `: ${e.message}` : ''}. It has been restarted — run again.`,
      });
    });
    worker.addEventListener('messageerror', () => {
      killWorker({
        errorType: 'runtime',
        message: 'The Python runtime sent a message that could not be read. It has been restarted — run again.',
      });
    });
  }
  return worker;
}

// Terminate the worker and settle every job still waiting on it, so no caller
// is ever left awaiting a promise that can no longer resolve.
function killWorker(strandedError = null) {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (inFlight.size) {
    const err = strandedError ?? {
      errorType: 'runtime',
      message: 'The Python runtime was restarted. Run again.',
    };
    for (const settle of [...inFlight]) settle(err);
    inFlight.clear();
  }
}

// Escape hatch for the UI: drop the current runtime so the next run boots a
// fresh one, and unblock anything currently waiting on it.
export function resetPythonRuntime() {
  killWorker({
    errorType: 'runtime',
    message: 'The Python runtime was restarted. Run again.',
  });
}

// Shared plumbing for both job kinds: post a message, watch status, enforce
// the 5s execution timeout, resolve with { data } or { error }.
function dispatchJob(type, payload, needsPandas, onStatus) {
  const runId = ++runSeq;
  const w = ensureWorker();

  return new Promise((resolve) => {
    let execTimer = null;
    let loadTimer = null;
    let settled = false;

    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(execTimer);
      clearTimeout(loadTimer);
      w.removeEventListener('message', onMessage);
      inFlight.delete(strand);
      resolve(outcome);
    };

    // How killWorker() settles this job if the runtime dies under it.
    const strand = (error) => finish({ error });
    inFlight.add(strand);

    const onMessage = (event) => {
      const msg = event.data;
      if (msg.runId !== runId) return;
      if (msg.type === 'status') {
        onStatus(msg);
        if (msg.phase === 'running') {
          clearTimeout(loadTimer);
          // Only user code counts toward the 5s budget, not runtime download.
          execTimer = setTimeout(() => {
            // Settle THIS job first, then kill — so the timeout message wins
            // over the generic "runtime was restarted" strand notice.
            finish({
              error: {
                errorType: 'timeout',
                message:
                  'Time limit exceeded (5s) — check for infinite loops.\n' +
                  'The Python runtime was restarted; the next run may take a moment.',
              },
            });
            killWorker(); // next run boots a fresh worker (browser-cached, fast)
          }, PY_TIMEOUT_MS);
        }
      } else if (msg.type === 'result') {
        finish({ data: msg.data });
      } else if (msg.type === 'error') {
        finish({
          error: {
            errorType: 'runtime',
            message: `The Python runtime hit a problem: ${msg.message}`,
          },
        });
      }
    };

    loadTimer = setTimeout(() => {
      finish({
        error: {
          errorType: 'runtime',
          message: 'Loading the Python runtime timed out. Check your connection and try again.',
        },
      });
      killWorker(); // discard the wedged runtime so the next run starts clean
    }, LOAD_TIMEOUT_MS);

    w.addEventListener('message', onMessage);
    w.postMessage({ type, runId, payload, needsPandas });
  });
}

export async function runPythonQuestion(question, code, onStatus = () => {}) {
  const outcome = await dispatchJob(
    'run',
    buildPayload(question, code),
    question.track === 'pandas',
    onStatus
  );
  if (outcome.error) {
    return { status: 'error', ...outcome.error, allPassed: false };
  }
  return harnessResultToReport(outcome.data);
}

// Lesson snippets: run a small script with stdout captured. Resolves to
// { status: 'ok', stdout } or { status: 'error', message, stdout? } — same 5s
// kill switch as question runs.
export async function runPythonSnippet(code, onStatus = () => {}) {
  const outcome = await dispatchJob('snippet', { code }, false, onStatus);
  if (outcome.error) {
    return { status: 'error', message: outcome.error.message };
  }
  return outcome.data;
}

// Visualizer: trace `code` on one test case. Resolves to the tracer outcome
// ({ status:'ok', steps, lines, result, truncated } or { status:'error', message }).
export async function runPythonTrace(question, code, testIndex, onStatus = () => {}) {
  const outcome = await dispatchJob(
    'trace',
    buildTracePayload(question, code, testIndex),
    question.track === 'pandas',
    onStatus
  );
  if (outcome.error) {
    return { status: 'error', message: outcome.error.message };
  }
  return outcome.data;
}
