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

// Common names pre-loaded into the exec namespace so learners don't have to
// import the usual suspects (defaultdict, Counter, deque, heapq, List, …) —
// the same convenience LeetCode gives you. Injected into globals rather than
// prepended to the source, so user line numbers stay correct for tracebacks
// and the visualizer.
const PY_PRELUDE = `
import collections, heapq, bisect, math, itertools, functools, re, string
from collections import defaultdict, Counter, deque, OrderedDict
from functools import lru_cache, reduce
from itertools import permutations, combinations, combinations_with_replacement, product, accumulate, chain
from typing import List, Optional, Dict, Tuple, Set
_PRELUDE = {
    "collections": collections, "heapq": heapq, "bisect": bisect, "math": math,
    "itertools": itertools, "functools": functools, "re": re, "string": string,
    "defaultdict": defaultdict, "Counter": Counter, "deque": deque, "OrderedDict": OrderedDict,
    "lru_cache": lru_cache, "cache": getattr(functools, "cache", lru_cache), "reduce": reduce,
    "permutations": permutations, "combinations": combinations,
    "combinations_with_replacement": combinations_with_replacement,
    "product": product, "accumulate": accumulate, "chain": chain,
    "inf": math.inf, "gcd": math.gcd,
    "List": List, "Optional": Optional, "Dict": Dict, "Tuple": Tuple, "Set": Set,
}
`;

export const PY_HARNESS = `
import json, io, sys, copy, traceback
from contextlib import redirect_stdout
${PY_PRELUDE}
payload = json.loads(PAYLOAD_JSON)
user_code = payload["code"]
fn_name = payload["function_name"]
tests = payload["tests"]
track = payload["track"]
unordered = payload.get("unordered")

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

def _sort_key(x):
    return json.dumps(x, sort_keys=True, default=str)

def _deep_sort(v):
    # Recursively sort every list so order never matters at any depth — for
    # "group these / return all subsets/combinations" answers where neither the
    # outer order nor the order inside each group is significant.
    if isinstance(v, list):
        return sorted((_deep_sort(x) for x in v), key=_sort_key)
    if isinstance(v, dict):
        return {k: _deep_sort(x) for k, x in v.items()}
    return v

def _canon(v):
    n = _normalize(v)
    # A question can opt out of order-sensitivity:
    #   "deep"  -> order is irrelevant at every level (group anagrams, subsets)
    #   "outer" -> the collection is a set but each item keeps its order
    #              (permutations, coordinate pairs, generated strings)
    if unordered in (True, "deep"):
        n = _deep_sort(n)
    elif unordered == "outer" and isinstance(n, list):
        n = sorted(n, key=_sort_key)
    return json.dumps(n, sort_keys=True, default=str)

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

ns = dict(_PRELUDE)
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
import sys, json, copy, traceback, ast
${PY_PRELUDE}
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

# ---- per-step narration: say WHY each line runs, with the live values ----
# The statement on each source line is looked up in the AST; conditions and
# pure sub-expressions are re-evaluated against the frame's locals so the
# caption can read "Is target - n (= 7) in seen (= {2: 0})? No -> skip it."
_MUT = {"append", "pop", "add", "insert", "remove", "extend", "popleft",
        "appendleft", "update", "discard", "clear", "sort", "reverse",
        "heappush", "heappop", "heapify", "heappushpop", "heapreplace",
        "setdefault", "write", "next", "input", "open", "print", "readline"}

def _is_pure(node):
    for sub in ast.walk(node):
        if isinstance(sub, ast.Call):
            f = sub.func
            name = f.attr if isinstance(f, ast.Attribute) else (f.id if isinstance(f, ast.Name) else "?")
            if name in _MUT:
                return False
        if isinstance(sub, (ast.NamedExpr, ast.Yield, ast.YieldFrom, ast.Await)):
            return False
    return True

_MISS = object()

def _ev(node, frame):
    if node is None or not _is_pure(node):
        return _MISS
    try:
        expr = ast.Expression(body=node)
        ast.fix_missing_locations(expr)
        return eval(compile(expr, "<viz-ev>", "eval"), frame.f_globals, dict(frame.f_locals))
    except Exception:
        return _MISS

def _short(v, n=44):
    r = repr(v)
    return r if len(r) <= n else r[: n - 3] + "..."

def _seg(node):
    try:
        return (ast.get_source_segment(user_code, node) or "?").strip()
    except Exception:
        return "?"

def _with_val(node, frame):
    src = _seg(node)
    v = _ev(node, frame)
    if v is _MISS or _short(v) == src:
        return src
    return src + " (= " + _short(v) + ")"

_CMP = {ast.Eq: "equal to", ast.NotEq: "different from", ast.Lt: "less than",
        ast.LtE: "at most", ast.Gt: "greater than", ast.GtE: "at least",
        ast.In: "in", ast.NotIn: "not in", ast.Is: "is", ast.IsNot: "is not"}
_OPS = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/",
        ast.FloorDiv: "//", ast.Mod: "%", ast.Pow: "**", ast.BitOr: "|",
        ast.BitAnd: "&", ast.BitXor: "^", ast.LShift: "<<", ast.RShift: ">>"}

def _cond_text(test, frame, yes, no):
    if isinstance(test, ast.Compare) and len(test.ops) == 1 and type(test.ops[0]) in _CMP:
        head = ("Is " + _with_val(test.left, frame) + " "
                + _CMP[type(test.ops[0])] + " "
                + _with_val(test.comparators[0], frame) + "?")
    else:
        head = "Check " + _with_val(test, frame) + "."
    v = _ev(test, frame)
    if v is _MISS:
        return head
    return head + (" Yes -> " + yes if v else " No -> " + no)

_CALL_VERBS = {
    "append": "Add {a} to the end of {b}",
    "add": "Add {a} to the set {b}",
    "appendleft": "Add {a} to the LEFT end of {b}",
    "insert": "Insert into {b}",
    "remove": "Remove {a} from {b}",
    "extend": "Extend {b} with {a}",
    "pop": "Remove an item from {b}",
    "popleft": "Take the leftmost item off {b}",
    "sort": "Sort {b} in place",
    "reverse": "Reverse {b} in place",
    "update": "Update {b} with {a}",
}

def _narrate(frame):
    node = _stmts.get(frame.f_lineno)
    if node is None:
        return None
    if isinstance(node, ast.Assign) and len(node.targets) == 1:
        t = node.targets[0]
        if isinstance(t, ast.Subscript):
            return ("Store " + _with_val(node.value, frame) + " under key "
                    + _with_val(t.slice, frame) + " in " + _seg(t.value) + ".")
        if isinstance(t, (ast.Tuple, ast.List)):
            return "Unpack " + _with_val(node.value, frame) + " into " + _seg(t) + "."
        return "Set " + _seg(t) + " to " + _with_val(node.value, frame) + "."
    if isinstance(node, ast.AugAssign):
        sym = _OPS.get(type(node.op), "?")
        msg = ("Update " + _seg(node.target) + " with " + sym + " "
               + _with_val(node.value, frame))
        if isinstance(node.target, ast.Name):
            cur = _ev(ast.Name(id=node.target.id, ctx=ast.Load()), frame)
            if cur is not _MISS:
                msg += " (it was " + _short(cur) + ")"
        return msg + "."
    if isinstance(node, ast.If):
        return _cond_text(node.test, frame, "take this branch.", "skip it.")
    if isinstance(node, ast.While):
        return _cond_text(node.test, frame, "run the loop body.", "leave the loop.")
    if isinstance(node, ast.For):
        return ("Take the next " + _seg(node.target) + " from "
                + _seg(node.iter) + " (or stop if it's exhausted).")
    if isinstance(node, ast.Return):
        if node.value is None:
            return "Done -- return."
        return "Return " + _with_val(node.value, frame) + "."
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
        f = node.value.func
        if isinstance(f, ast.Attribute) and f.attr in _CALL_VERBS:
            a = _with_val(node.value.args[0], frame) if node.value.args else ""
            return _CALL_VERBS[f.attr].replace("{a}", a).replace("{b}", _seg(f.value)) + "."
        return "Run " + _seg(node) + "."
    return None

_stmts = {}
try:
    for _n in ast.walk(ast.parse(user_code)):
        if isinstance(_n, ast.stmt):
            _stmts.setdefault(_n.lineno, _n)
except Exception:
    _stmts = {}

class _VizLimit(Exception):
    pass

def _tracer(frame, event, arg):
    if frame.f_code.co_filename != "<viz>":
        return None
    if event == "line":
        if len(steps) >= MAX_STEPS:
            raise _VizLimit()
        note = None
        if not frame.f_code.co_name.startswith("<"):
            try:
                note = _narrate(frame)
            except Exception:
                note = None
        steps.append({
            "line": frame.f_lineno,
            "func": frame.f_code.co_name,
            "note": note,
            "locals": {k: _snap(v) for k, v in frame.f_locals.items() if not k.startswith(("_", "."))},
        })
    return _tracer

outcome = {"status": "ok"}
ns = dict(_PRELUDE)
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
    unordered: question.unordered,
  };
}
