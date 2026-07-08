import { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from './Markdown.jsx';
import { runPythonTrace } from '../engine/pyClient.js';

// NeetCode-style algorithm visualizer: replays a REAL traced execution of the
// chosen solution on a chosen test case — current line highlighted in the
// code, every local variable shown as it changes, play/pause/scrub.

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

function Cells({ items, kind }) {
  const shown = items.slice(0, 14);
  return (
    <span className={`viz-cells ${kind || ''}`}>
      {shown.map((x, i) => (
        <span className="viz-cell" key={i}>
          <span className="viz-cell-v">{typeof x === 'object' && x !== null ? fmt(x) : fmt(x)}</span>
          {kind !== 'set' && <span className="viz-cell-i">{i}</span>}
        </span>
      ))}
      {items.length > shown.length && <span className="viz-more">…+{items.length - shown.length}</span>}
    </span>
  );
}

function VarValue({ value }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="viz-empty">[] empty</span>;
    return <Cells items={value} />;
  }
  if (value && typeof value === 'object') {
    if (value.__set__) {
      if (value.__set__.length === 0) return <span className="viz-empty">set() empty</span>;
      return <Cells items={value.__set__} kind="set" />;
    }
    if (value.__dict__) {
      if (value.__dict__.length === 0) return <span className="viz-empty">{'{}'} empty</span>;
      return (
        <span className="viz-chips">
          {value.__dict__.slice(0, 12).map(([k, v], i) => (
            <span className="viz-chip" key={i}>
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

  const cur = steps[step];
  const prev = step > 0 ? steps[step - 1] : null;
  const test = question.tests[testIndex];
  const atEnd = total > 0 && step === total - 1;

  // What changed since the previous step — the one thing to actually watch.
  // Maps a changed var name to its previous value, or the '__new__' marker if
  // it just came into scope.
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

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal viz-modal" role="dialog" aria-modal="true" aria-label="Algorithm visualizer">
        <div className="viz-head">
          <h2>
            ▶ Visualize — {question.title}
            <span className="viz-label">{label}</span>
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close visualizer">
            ✕
          </button>
        </div>

        <p className="viz-what">
          Watch the <strong>{label}</strong> run for real, one line at a time. Read the{' '}
          <strong>big sentence</strong> for what&apos;s happening; the highlighted variable on the
          right is the one that just <strong>changed</strong>. Step with ← → or press play.
        </p>
        {note && (
          <div className="viz-plan">
            <span className="viz-plan-label">The idea</span>
            <Markdown text={note} />
          </div>
        )}

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
                {playing ? '⏸ Pause' : '▶ Play'}
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
              <span className="viz-step-count">
                Step {total ? step + 1 : 0} / {total}
                {trace.truncated && ' (capped)'}
              </span>
            </div>
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

            {/* One plain-English sentence per step — the thing to actually read. */}
            <div className="viz-hero" role="status">
              <span className="viz-hero-step">Step {total ? step + 1 : 0}</span>
              <span className="viz-hero-why">
                {cur?.note || (atEnd ? 'Done — the function returns its answer.' : 'Getting started…')}
              </span>
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
                <div className="viz-vars-head">
                  Variables
                  {changedNames.length > 0 && (
                    <span className="viz-changed-flag">
                      {changedNames.join(', ')} changed
                    </span>
                  )}
                </div>
                {varNames.map((name) => {
                  const inScope = cur && name in cur.locals;
                  const didChange = name in changed;
                  const wasNew = changed[name] === '__new__';
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
                          {didChange && !wasNew && (
                            <>
                              <span className="viz-var-was">
                                <VarValue value={changed[name]} />
                              </span>
                              <span className="viz-arrow">→</span>
                            </>
                          )}
                          <VarValue value={cur.locals[name]} />
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

            <div className="viz-caption">
              {cur ? (
                <div className="viz-src">
                  Running line {cur.line}
                  {cur.func && cur.func !== question.function_name ? ` · in ${cur.func}()` : ''}:{' '}
                  <code>{(trace.lines[cur.line - 1] || '').trim()}</code>
                </div>
              ) : (
                'No steps captured.'
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
