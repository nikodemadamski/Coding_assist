// The Python test harness. This exact string runs inside Pyodide in the web
// worker AND inside Pyodide-in-Node for `npm test`, so seed verification and
// the real app share one code path. Keep it dependency-free JS (no vite magic).
//
// Protocol: the host sets a global PAYLOAD_JSON containing
//   { code, function_name, tests: [{args, expected}], track }
// and evaluates this script; its final expression is a JSON string:
//   { status: 'ok', results: [...] }
//   { status: 'syntax_error' | 'runtime_error' | 'missing_function', message }
//
// Normalization rules (both sides of the comparison):
//   sets -> sorted lists, tuples -> lists, dict keys -> str, whole floats -> int,
//   other floats rounded to 9 dp, DataFrame -> records, Series -> list,
//   numpy scalars -> python scalars. Compared via json.dumps(sort_keys=True).

export const PY_HARNESS = `
import json, io, sys, copy, traceback
from contextlib import redirect_stdout

payload = json.loads(PAYLOAD_JSON)
user_code = payload["code"]
fn_name = payload["function_name"]
tests = payload["tests"]
track = payload["track"]

def _convert_arg(a):
    if track == "pandas" and isinstance(a, dict) and set(a.keys()) == {"__df__"}:
        import pandas as pd
        return pd.DataFrame(a["__df__"])
    return a

def _normalize(v):
    try:
        import pandas as pd
        if isinstance(v, pd.DataFrame):
            return _normalize(v.reset_index(drop=True).to_dict("records"))
        if isinstance(v, pd.Series):
            return _normalize(v.tolist())
    except ImportError:
        pass
    try:
        import numpy as np
        if isinstance(v, np.generic):
            v = v.item()
    except ImportError:
        pass
    if isinstance(v, bool) or v is None:
        return v
    if isinstance(v, dict):
        return {str(k): _normalize(x) for k, x in v.items()}
    if isinstance(v, set):
        return sorted(
            (_normalize(x) for x in v),
            key=lambda x: json.dumps(x, sort_keys=True, default=str),
        )
    if isinstance(v, (list, tuple)):
        return [_normalize(x) for x in v]
    if isinstance(v, float):
        if v != v or v in (float("inf"), float("-inf")):
            return str(v)
        if v.is_integer():
            return int(v)
        return round(v, 9)
    return v

def _canon(v):
    return json.dumps(_normalize(v), sort_keys=True, default=str)

def _short_repr(v, limit=70):
    r = repr(v)
    return r if len(r) <= limit else r[: limit - 1] + "…"

def _user_error():
    # Keep only traceback frames that come from the user's code (exec'd with
    # filename "<string>"), plus the exception line itself.
    lines = traceback.format_exc().splitlines()
    kept = []
    i = 0
    while i < len(lines):
        if lines[i].lstrip().startswith('File "<string>"'):
            kept.append(lines[i].strip())
            if i + 1 < len(lines) and not lines[i + 1].lstrip().startswith("File"):
                kept.append("    " + lines[i + 1].strip())
                i += 1
        i += 1
    # Don't repeat the exception line when it already surfaced as frame context
    # (exec'd "<string>" code has no source, so the context IS the exception).
    if not kept or kept[-1].strip() != lines[-1].strip():
        kept.append(lines[-1])
    return "\\n".join(kept)

outcome = {"status": "ok", "results": []}

ns = {}
try:
    exec(compile(user_code, "<string>", "exec"), ns)
except SyntaxError:
    outcome = {"status": "syntax_error", "message": traceback.format_exc(limit=0).strip()}
except Exception:
    outcome = {"status": "runtime_error", "message": _user_error()}

if outcome["status"] == "ok":
    fn = ns.get(fn_name)
    if not callable(fn):
        outcome = {
            "status": "missing_function",
            "message": "Function '" + fn_name + "' not found — keep the starter function name.",
        }

if outcome["status"] == "ok":
    for t in tests:
        entry = {
            "pass": False,
            "argsRepr": ", ".join(_short_repr(a) for a in t["args"]),
            "expectedRepr": "",
            "gotRepr": "",
            "error": None,
            "stdout": "",
        }
        buf = io.StringIO()
        try:
            args = [_convert_arg(copy.deepcopy(a)) for a in t["args"]]
            with redirect_stdout(buf):
                got = fn(*args)
            exp_c = _canon(t["expected"])
            got_c = _canon(got)
            entry["pass"] = exp_c == got_c
            # Comparison uses canonical JSON; DISPLAY uses Python repr so the
            # learner sees True/None/'text', not true/null/"text".
            entry["expectedRepr"] = repr(_normalize(t["expected"]))
            entry["gotRepr"] = repr(_normalize(got))
        except Exception:
            entry["error"] = _user_error()
        entry["stdout"] = buf.getvalue()[:4000]
        outcome["results"].append(entry)

json.dumps(outcome)
`;

// ── execution tracer for the algorithm visualizer ───────────────────────
// Runs ONE test case under sys.settrace, capturing every executed line and a
// JSON-safe snapshot of the local variables at that moment. Works for any
// python/pandas question with zero per-question authoring. Protocol:
//   PAYLOAD_JSON = { code, function_name, test: {args, expected}, track }
// Final expression is JSON:
//   { status:'ok', steps:[{line, func, locals}], lines:[...], result,
//     truncated } | { status:'error', message }
// Snapshot markers the UI understands: a set becomes {"__set__":[...]},
// a dict becomes {"__dict__":[[k,v],...]} (order preserved).
export const PY_TRACE_HARNESS = `
import sys, json, copy, traceback

payload = json.loads(PAYLOAD_JSON)
user_code = payload["code"]
fn_name = payload["function_name"]
test = payload["test"]
track = payload["track"]

MAX_STEPS = 400
steps = []

def _convert_arg(a):
    if track == "pandas" and isinstance(a, dict) and set(a.keys()) == {"__df__"}:
        import pandas as pd
        return pd.DataFrame(a["__df__"])
    return a

def _snap(v, depth=0):
    if depth > 3:
        return repr(v)[:60]
    if isinstance(v, bool) or v is None or isinstance(v, int):
        return v
    if isinstance(v, float):
        if v != v or v in (float("inf"), float("-inf")):
            return str(v)
        return v
    if isinstance(v, str):
        return v if len(v) <= 60 else v[:57] + "..."
    if isinstance(v, (list, tuple)):
        return [_snap(x, depth + 1) for x in list(v)[:30]]
    if isinstance(v, set):
        try:
            items = sorted(v)
        except Exception:
            items = list(v)
        return {"__set__": [_snap(x, depth + 1) for x in items[:30]]}
    if isinstance(v, dict):
        return {"__dict__": [[_snap(k, depth + 1), _snap(x, depth + 1)] for k, x in list(v.items())[:30]]}
    return repr(v)[:60]

class _VizLimit(Exception):
    pass

def _tracer(frame, event, arg):
    if frame.f_code.co_filename != "<viz>":
        return None
    if event == "line":
        if len(steps) >= MAX_STEPS:
            raise _VizLimit()
        steps.append({
            "line": frame.f_lineno,
            "func": frame.f_code.co_name,
            "locals": {k: _snap(v) for k, v in frame.f_locals.items() if not k.startswith("_")},
        })
    return _tracer

outcome = {"status": "ok"}
ns = {}
try:
    exec(compile(user_code, "<viz>", "exec"), ns)
    fn = ns.get(fn_name)
    if not callable(fn):
        outcome = {"status": "error", "message": "Function '" + fn_name + "' not found."}
    else:
        args = [_convert_arg(copy.deepcopy(a)) for a in test["args"]]
        truncated = False
        result = None
        sys.settrace(_tracer)
        try:
            result = fn(*args)
        except _VizLimit:
            truncated = True
        finally:
            sys.settrace(None)
        outcome["steps"] = steps
        outcome["truncated"] = truncated
        outcome["result"] = _snap(result)
        outcome["lines"] = user_code.split("\\n")
except SyntaxError:
    outcome = {"status": "error", "message": traceback.format_exc(limit=0).strip()}
except Exception:
    outcome = {"status": "error", "message": traceback.format_exc().splitlines()[-1]}

json.dumps(outcome)
`;

export function buildTracePayload(question, code, testIndex) {
  return {
    code,
    function_name: question.function_name,
    test: question.tests[testIndex],
    track: question.track,
  };
}

// Maps a harness outcome to the UI-facing RunReport. Shared by the browser
// client and the Node test gate.
export function harnessResultToReport(data) {
  if (data.status === 'ok') {
    const results = data.results || [];
    return {
      status: 'ok',
      results,
      allPassed: results.length > 0 && results.every((r) => r.pass),
    };
  }
  const errorTypeByStatus = {
    syntax_error: 'syntax',
    runtime_error: 'runtime',
    missing_function: 'missing_function',
  };
  return {
    status: 'error',
    errorType: errorTypeByStatus[data.status] || 'runtime',
    message: data.message,
    allPassed: false,
  };
}

export function buildPayload(question, code) {
  return {
    code,
    function_name: question.function_name,
    tests: question.tests,
    track: question.track,
  };
}
