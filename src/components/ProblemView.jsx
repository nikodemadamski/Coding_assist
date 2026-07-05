import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from './Editor.jsx';
import Results from './Results.jsx';
import Markdown from './Markdown.jsx';
import { runQuestion } from '../engine/runnerClient.js';

const TABS = [
  { id: 'problem', label: 'Problem' },
  { id: 'code', label: 'Code' },
  { id: 'result', label: 'Result' },
];

export default function ProblemView({ question, progress, onSolve, onFail, onDraft, onBack }) {
  const [code, setCode] = useState(
    () => progress.drafts[question.id] ?? question.starter_code ?? ''
  );
  const [tab, setTab] = useState('problem');
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [justSolved, setJustSolved] = useState(false);
  const draftTimer = useRef(null);

  const solved = !!progress.solved[question.id];

  // Debounced draft persistence so a reload never loses work.
  const handleChange = useCallback(
    (value) => {
      setCode(value);
      clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => onDraft(question.id, value), 500);
    },
    [question.id, onDraft]
  );

  useEffect(() => () => clearTimeout(draftTimer.current), []);

  const handleStatus = useCallback((status) => {
    if (status.phase === 'loading-pyodide') {
      setStatusText(
        `Loading Python runtime${status.progress != null ? ` — ${status.progress}%` : ''}… (first time only)`
      );
    } else if (status.phase === 'loading-pandas') {
      setStatusText('Loading pandas (~15s first time)…');
    } else if (status.phase === 'running') {
      setStatusText('Running…');
    } else {
      setStatusText('');
    }
  }, []);

  async function execute(isSubmit) {
    // Flush the pending draft save — the code being run must survive a reload
    // even if the 500ms debounce hasn't fired yet.
    clearTimeout(draftTimer.current);
    onDraft(question.id, code);
    setRunning(true);
    setJustSolved(false);
    setReport(null);
    setTab('result');
    try {
      const rep = await runQuestion(question, code, handleStatus);
      setReport(rep);
      if (isSubmit) {
        if (rep.allPassed) {
          onSolve(question.id);
          setJustSolved(true);
        } else {
          onFail(question.id);
        }
      }
    } catch (err) {
      setReport({
        status: 'error',
        errorType: 'runtime',
        message: String(err?.message || err),
        allPassed: false,
      });
    } finally {
      setRunning(false);
      setStatusText('');
    }
  }

  function handleReset() {
    if (code !== question.starter_code && !window.confirm('Replace your code with the starter?')) {
      return;
    }
    handleChange(question.starter_code);
  }

  return (
    <div className="problem-view">
      <div className="pv-toolbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to problem list">
          ←
        </button>
        <span className="pv-title">
          {solved && (
            <span style={{ color: 'var(--jade)' }} title="Solved">
              ✓{' '}
            </span>
          )}
          {question.title}
        </span>
        <span className={`tag track-${question.track}`}>{question.track}</span>
        <span className={`tag diff-${question.difficulty}`}>{question.difficulty}</span>
        <button className="btn" onClick={() => execute(false)} disabled={running}>
          {running ? '…' : '▶ Run'}
        </button>
        <button className="btn btn-primary" onClick={() => execute(true)} disabled={running}>
          Submit
        </button>
      </div>

      <div className="pv-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`pv-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pv-body">
        <section className={`pv-pane pane-problem ${tab === 'problem' ? 'visible' : ''}`}>
          <Markdown text={question.description} />
          {question.examples?.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>Examples</h3>
              {question.examples.map((ex, i) => (
                <div className="example-block" key={i}>
                  {ex}
                </div>
              ))}
            </>
          )}
          <details className="hint">
            <summary>Show hint</summary>
            <Markdown text={question.hint} />
          </details>
          <details className="hint">
            <summary>Show solution (last resort!)</summary>
            <pre
              style={{
                background: 'var(--ink)',
                padding: '10px 12px',
                borderRadius: 8,
                overflowX: 'auto',
                fontSize: '0.83rem',
              }}
            >
              {question.solution}
            </pre>
          </details>
        </section>

        <section className={`pv-pane pane-code ${tab === 'code' ? 'visible' : ''}`}>
          <div className="editor-bar">
            <button className="btn" onClick={handleReset}>
              Reset to starter
            </button>
            <span className="hint-text">
              {question.track === 'sql'
                ? 'Write a single SELECT query.'
                : `Keep the function name ${question.function_name}().`}
            </span>
          </div>
          <div className="editor-wrap">
            <Editor track={question.track} value={code} onChange={handleChange} />
          </div>
        </section>

        <section
          className={`pv-pane pane-result ${tab === 'result' ? 'visible' : ''}`}
          aria-live="polite"
        >
          {justSolved && (
            <div className="solved-banner">
              ⚔ Solved! Scheduled for review — spaced repetition will bring it back.
            </div>
          )}
          {running ? (
            <div className="loader">
              <div className="spinner" aria-hidden="true" />
              <span>{statusText || 'Running…'}</span>
            </div>
          ) : (
            <Results report={report} question={question} />
          )}
        </section>
      </div>
    </div>
  );
}
