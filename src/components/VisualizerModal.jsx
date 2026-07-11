import { useEffect, useMemo, useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import Markdown from './Markdown.jsx';
import { runPythonTrace } from '../engine/pyClient.js';
import { scanSubscripts, computeMarkers, spanOf } from '../state/vizPointers.js';

// NeetCode-style algorithm visualizer: replays a REAL traced execution of any
// code (a reference approach or the user's own) on a chosen test case.
// Built to be FOLLOWED: everything fits without page-scrolling, one hero block
// tells you what's happening + what just changed, and inside a collection only
// the element that changed lights up.

const SPEEDS = [0.5, 1, 2];

function fmt(v) {
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'string') return `'${v}'`;
  if (Array.isArray(v)) return `[${v.map(fmt).join(', ')}]`;
  if (typeof v === 'object') {
    if (v.__set__) return `{${v.__set__.map(fmt).join(', ')}}`;
    if (v.__dict__) return `{${v.__dict__.map(([k, x]) => `${fmt(k)}: ${fmt(x)}`).join(', ')}}`;
  }
  return String(v);
}

const shortFmt = (v, n = 32) => {
  const s = fmt(v);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// One short human line per changed variable: "w: 'nat' → 'bat'",
// "groups['abt'] = ['bat']", "res += [1, 2]".
function summarizeChange(name, before, after) {
  if (before === '__new__') return `${name} = ${shortFmt(after)}`;
  const prim = (v) => v === null || typeof v !== 'object';
  if (prim(before) && prim(after)) return `${name}: ${fmt(before)} → ${fmt(after)}`;
  if (after?.__dict__) {
    const prevPairs = new Map((before?.__dict__ ?? []).map(([k, v]) => [JSON.stringify(k), v]));
    const bits = [];
    for (const [k, v] of after.__dict__) {
      const kk = JSON.stringify(k);
      if (!prevPairs.has(kk)) bits.push(`${name}[${fmt(k)}] = ${shortFmt(v, 24)}`);
      else if (!same(prevPairs.get(kk), v)) bits.push(`${name}[${fmt(k)}] → ${shortFmt(v, 24)}`);
    }
    return bits.slice(0, 2).join('  ·  ') || `${name} changed`;
  }
  if (Array.isArray(after)) {
    const b = Array.isArray(before) ? before : [];
    if (after.length > b.length) return `${name} += ${after.slice(b.length).map(fmt).join(', ')}`;
    if (after.length < b.length) return `${name} shrank to ${shortFmt(after)}`;
    for (let i = 0; i < after.length; i++) {
      if (!same(after[i], b[i])) return `${name}[${i}] → ${shortFmt(after[i], 24)}`;
    }
    return `${name} changed`;
  }
  if (after?.__set__) {
    const b = new Set((before?.__set__ ?? []).map((x) => JSON.stringify(x)));
    const added = after.__set__.filter((x) => !b.has(JSON.stringify(x)));
    if (added.length) return `${name} + ${added.map(fmt).join(', ')}`;
    return `${name} changed`;
  }
  return `${name} changed`;
}

// hotIndex predicates: which elements inside a collection just changed.
function listHot(before, after) {
  const b = Array.isArray(before) ? before : [];
  return after.map((x, i) => i >= b.length || !same(x, b[i]));
}
function setHot(before, after) {
  const b = new Set((before?.__set__ ?? []).map((x) => JSON.stringify(x)));
  return after.map((x) => !b.has(JSON.stringify(x)));
}
function dictHot(before, after) {
  const prevPairs = new Map((before?.__dict__ ?? []).map(([k, v]) => [JSON.stringify(k), v]));
  return after.map(([k, v]) => {
    const kk = JSON.stringify(k);
    return !prevPairs.has(kk) || !same(prevPairs.get(kk), v);
  });
}

function Cells({ items, kind, hot, markers, span }) {
  const shown = items.slice(0, 14);
  const ptrAt = {};
  for (const m of markers ?? []) {
    ptrAt[m.index] = ptrAt[m.index] ? `${ptrAt[m.index]},${m.name}` : m.name;
  }
  const inSpan = (i) => span && i >= span[0] && i <= span[1];
  return (
    <span className={`viz-cells ${kind || ''}`}>
      {shown.map((x, i) => (
        <span
          className={`viz-cell ${hot?.[i] ? 'hot' : ''} ${inSpan(i) ? 'in-span' : ''}`}
          key={i}
        >
          <span className="viz-cell-v">{fmt(x)}</span>
          {kind !== 'set' && <span className="viz-cell-i">{i}</span>}
          {ptrAt[i] && <span className="viz-ptr">▲ {ptrAt[i]}</span>}
        </span>
      ))}
      {items.length > shown.length && <span className="viz-more">…+{items.length - shown.length}</span>}
    </span>
  );
}

// Renders a value; when `before` is provided, only the changed elements light
// up (no more whole-collection strike-throughs).
function VarValue({ value, before, markers, span }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="viz-empty">[] empty</span>;
    return (
      <Cells
        items={value}
        hot={before !== undefined ? listHot(before, value) : null}
        markers={markers}
        span={span}
      />
    );
  }
  if (value && typeof value === 'object') {
    if (value.__set__) {
      if (value.__set__.length === 0) return <span className="viz-empty">set() empty</span>;
      return (
        <Cells
          items={value.__set__}
          kind="set"
          hot={before !== undefined ? setHot(before, value.__set__) : null}
        />
      );
    }
    if (value.__dict__) {
      if (value.__dict__.length === 0) return <span className="viz-empty">{'{}'} empty</span>;
      const hot = before !== undefined ? dictHot(before, value.__dict__) : null;
      return (
        <span className="viz-chips">
          {value.__dict__.slice(0, 12).map(([k, v], i) => (
            <span className={`viz-chip ${hot?.[i] ? 'hot' : ''}`} key={i}>
              {fmt(k)} → {fmt(v)}
            </span>
          ))}
          {value.__dict__.length > 12 && <span className="viz-more">…</span>}
        </span>
      );
    }
  }
  return <code className="viz-prim">{fmt(value)}</code>;
}

export default function VisualizerModal({ question, code, label, note, onClose }) {
  const [testIndex, setTestIndex] = useState(0);
  const [trace, setTrace] = useState(null); // null=loading | {status:...}
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const codeRef = useRef(null);
  const trapRef = useRef(null);
  useFocusTrap(trapRef);

  useEffect(() => {
    let cancelled = false;
    setTrace(null);
    setStep(0);
    setPlaying(false);
    runPythonTrace(question, code, testIndex, (s) => {
      if (cancelled) return;
      if (s.phase === 'loading-pyodide') setStatus('Loading Python runtime…');
      else if (s.phase === 'loading-pandas') setStatus('Loading pandas…');
      else setStatus('Tracing execution…');
    }).then((t) => {
      if (!cancelled) setTrace(t);
    });
    return () => {
      cancelled = true;
    };
  }, [question, code, testIndex]);

  const steps = useMemo(() => (trace?.status === 'ok' ? trace.steps : []), [trace]);
  const total = steps.length;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= total - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 900 / speed);
    return () => clearInterval(id);
  }, [playing, speed, total]);

  // Keep the active line visible.
  useEffect(() => {
    codeRef.current?.querySelector('.viz-line.active')?.scrollIntoView({ block: 'nearest' });
  }, [step, trace]);

  // Keyboard player: ←/→ step, Space play/pause, Esc close.
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t?.tagName === 'INPUT' || t?.tagName === 'SELECT') {
        if (e.key === 'Escape') onClose();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlaying(false);
        setStep((s) => Math.min(Math.max(0, total - 1), s + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, onClose]);

  // Union of variable names, in order of first appearance.
  const varNames = useMemo(() => {
    const names = [];
    for (const s of steps) {
      for (const k of Object.keys(s.locals)) {
        if (!names.includes(k)) names.push(k);
      }
    }
    return names;
  }, [steps]);

  // Which int variables index into which lists (from the source code).
  const subscripts = useMemo(() => scanSubscripts(code), [code]);

  const cur = steps[step];
  const prev = step > 0 ? steps[step - 1] : null;
  const test = question.tests[testIndex];
  const atEnd = total > 0 && step === total - 1;

  // What changed since the previous step: name -> previous value (or '__new__').
  const changed = useMemo(() => {
    const out = {};
    if (!cur) return out;
    for (const k of Object.keys(cur.locals)) {
      const now = JSON.stringify(cur.locals[k]);
      const had = prev && k in prev.locals;
      const before = had ? JSON.stringify(prev.locals[k]) : undefined;
      if (before !== now) out[k] = had ? prev.locals[k] : '__new__';
    }
    return out;
  }, [cur, prev]);
  const changedNames = Object.keys(changed);
  const effects = changedNames.map((n) => summarizeChange(n, changed[n], cur.locals[n]));

  const srcLine = cur ? (trace.lines[cur.line - 1] || '').trim() : '';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal viz-modal" role="dialog" aria-modal="true" aria-label="Algorithm visualizer" ref={trapRef}>
        <div className="viz-head">
          <h2>
            Visualize — {question.title}
            <span className="viz-label">{label}</span>
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close visualizer">
            ✕
          </button>
        </div>

        <div className="viz-input-row">
          <label htmlFor="viz-test">Test case</label>
          <select id="viz-test" value={testIndex} onChange={(e) => setTestIndex(Number(e.target.value))}>
            {question.tests.map((t, i) => (
              <option key={i} value={i}>
                {question.function_name}({t.args.map(fmt).join(', ').slice(0, 60)})
              </option>
            ))}
          </select>
          <span className="viz-expected">
            expected → <code>{fmt(test.expected)}</code>
          </span>
          {note && (
            <details className="viz-plan">
              <summary>The idea</summary>
              <div className="viz-plan-body">
                <Markdown text={note} />
              </div>
            </details>
          )}
        </div>

        {trace === null && (
          <div className="loader" style={{ padding: '40px 0' }}>
            <div className="spinner" aria-hidden="true" />
            <span role="status">{status || 'Loading…'}</span>
          </div>
        )}

        {trace?.status === 'error' && <div className="error-box">{trace.message}</div>}

        {trace?.status === 'ok' && (
          <>
            <div className="viz-controls">
              <button className="btn" onClick={() => setStep(0)} disabled={step === 0} aria-label="Restart">
                ⏮
              </button>
              <button
                className="btn"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                aria-label="Previous step"
              >
                ←
              </button>
              <button
                className="btn btn-primary"
                onClick={() => (atEnd ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                className="btn"
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                disabled={atEnd}
                aria-label="Next step"
              >
                →
              </button>
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  className={`chip ${speed === sp ? 'active' : ''}`}
                  onClick={() => setSpeed(sp)}
                >
                  {sp}x
                </button>
              ))}
              <input
                className="viz-scrub"
                type="range"
                min="0"
                max={Math.max(0, total - 1)}
                value={step}
                onChange={(e) => {
                  setPlaying(false);
                  setStep(Number(e.target.value));
                }}
                aria-label="Scrub through steps"
              />
              <span className="viz-step-count">
                Step {total ? step + 1 : 0} / {total}
                {trace.truncated && ' (capped)'}
              </span>
            </div>

            {/* THE reading spot: what's happening, what it just did, and where. */}
            <div className="viz-hero" role="status">
              <div className="viz-hero-top">
                <span className="viz-hero-step">Step {total ? step + 1 : 0}</span>
                {cur && (
                  <span className="viz-src">
                    line {cur.line}
                    {cur.func && cur.func !== question.function_name ? ` in ${cur.func}()` : ''}:{' '}
                    <code>{srcLine}</code>
                  </span>
                )}
              </div>
              <div className="viz-hero-why">
                {cur?.note || (atEnd ? 'Done — the function returns its answer.' : 'Getting started…')}
              </div>
              {effects.length > 0 && (
                <div className="viz-effects">
                  <span className="viz-effects-label">just happened</span>
                  {effects.map((e, i) => (
                    <code className="viz-effect" key={i}>
                      {e}
                    </code>
                  ))}
                </div>
              )}
              {atEnd && (
                <div className="viz-effects">
                  <span className="viz-effects-label done">returned</span>
                  <code className="viz-effect done">{fmt(trace.result)}</code>
                </div>
              )}
            </div>

            <div className="viz-panes">
              <div className="viz-code" ref={codeRef}>
                {trace.lines.map((lineText, i) => (
                  <div
                    key={i}
                    className={`viz-line ${cur && cur.line === i + 1 ? 'active' : ''}`}
                  >
                    <span className="viz-lineno">{i + 1}</span>
                    <span className="viz-linetext">{lineText || ' '}</span>
                  </div>
                ))}
              </div>
              <div className="viz-vars">
                {varNames.map((name) => {
                  const inScope = cur && name in cur.locals;
                  const didChange = name in changed;
                  const wasNew = changed[name] === '__new__';
                  const before = didChange && !wasNew ? changed[name] : undefined;
                  const isPrim =
                    inScope && (cur.locals[name] === null || typeof cur.locals[name] !== 'object');
                  let markers = null;
                  let span = null;
                  if (inScope && Array.isArray(cur.locals[name])) {
                    const listCount = Object.values(cur.locals).filter(Array.isArray).length;
                    markers = computeMarkers({
                      locals: cur.locals,
                      listName: name,
                      listLength: cur.locals[name].length,
                      subscripts,
                      listCount,
                    });
                    span = spanOf(markers);
                  }
                  return (
                    <div
                      className={`viz-var ${didChange ? 'changed' : ''} ${inScope ? '' : 'out'}`}
                      key={name}
                    >
                      <span className="viz-var-name">
                        {name}
                        {didChange && (
                          <span className="viz-var-tag">{wasNew ? 'new' : 'changed'}</span>
                        )}
                      </span>
                      {inScope ? (
                        <span className="viz-var-vals">
                          {isPrim && before !== undefined && (
                            <>
                              <span className="viz-var-was">{fmt(before)}</span>
                              <span className="viz-arrow">→</span>
                            </>
                          )}
                          <VarValue
                            value={cur.locals[name]}
                            before={before}
                            markers={markers}
                            span={span}
                          />
                        </span>
                      ) : (
                        <span className="viz-empty">— not in scope yet</span>
                      )}
                    </div>
                  );
                })}
                {atEnd && (
                  <div className="viz-var viz-result">
                    <span className="viz-var-name">returned</span>
                    <VarValue value={trace.result} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
