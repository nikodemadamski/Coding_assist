import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from './Editor.jsx';
import Results from './Results.jsx';
import Markdown from './Markdown.jsx';
import Approaches from './Approaches.jsx';
import VisualizerModal from './VisualizerModal.jsx';
import { runQuestion } from '../engine/runnerClient.js';
import { RATING_DELTA, isSolved } from '../state/progress.js';
import { pathStep } from '../data/roadmap.js';

const LANG_LABEL = {
  python: '🐍 Python 3',
  pandas: '🐼 Python + pandas',
  sql: '🗄 SQL (SQLite)',
};

const TABS = [
  { id: 'problem', label: 'Problem' },
  { id: 'code', label: 'Code' },
  { id: 'result', label: 'Result' },
];

const RATINGS = [
  { key: 'hard', label: 'Hard', note: 'bring it back soon' },
  { key: 'good', label: 'Good', note: 'normal interval' },
  { key: 'easy', label: 'Easy', note: 'wait longer' },
];

export default function ProblemView({
  question,
  progress,
  onSolve,
  onFail,
  onDraft,
  onBack,
  // practice-mode props (optional)
  practiceMode = false,
  practiceInfo = null,
  onNext,
}) {
  const [code, setCode] = useState(
    () => progress.drafts[question.id] ?? question.starter_code ?? ''
  );
  const [tab, setTab] = useState('problem');
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [justSolved, setJustSolved] = useState(false);
  const [outcome, setOutcome] = useState(null); // practice: 'pass' | 'fail' | null
  const [viz, setViz] = useState(null); // { code, label } → visualizer open
  const draftTimer = useRef(null);

  const openVisualizer = useCallback((vizCode, vizLabel) => {
    setViz({ code: vizCode, label: vizLabel });
  }, []);

  const solved = isSolved(progress.solved[question.id]);

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
    setOutcome(null);
    setReport(null);
    setTab('result');
    try {
      const rep = await runQuestion(question, code, handleStatus);
      setReport(rep);
      if (isSubmit) {
        if (rep.allPassed) {
          if (practiceMode) {
            // Wait for a confidence rating before scheduling — the rating tunes
            // the next review interval.
            setOutcome('pass');
          } else {
            onSolve(question.id);
            setJustSolved(true);
          }
        } else {
          onFail(question.id);
          if (practiceMode) setOutcome('fail');
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

  // Rating a correct answer records the solve (with the confidence delta) AND
  // advances the session — onSolve is the practice handler that drops the
  // question from the queue, so we must NOT also call onNext (that re-queues).
  function rate(level) {
    onSolve(question.id, { stageDelta: RATING_DELTA[level] });
  }

  function handleReset() {
    if (code !== question.starter_code && !window.confirm('Replace your code with the starter?')) {
      return;
    }
    handleChange(question.starter_code);
  }

  const phaseLabel =
    practiceInfo?.phase === 'review'
      ? `⟳ Review · ${practiceInfo.reviewsLeft} to clear`
      : practiceInfo?.phase === 'new'
        ? `✦ New · ${practiceInfo.newLeft} left`
        : practiceInfo?.phase === 'drill'
          ? `🔥 Drill · ${practiceInfo.reviewsLeft} left`
          : '';

  return (
    <div className="problem-view">
      <div className="pv-toolbar">
        <button
          className="icon-btn"
          onClick={onBack}
          aria-label={practiceMode ? 'End practice session' : 'Back to problem list'}
        >
          {practiceMode ? '✕ End' : '←'}
        </button>
        {practiceMode && phaseLabel && (
          <span className={`phase-pill ${practiceInfo.phase}`}>{phaseLabel}</span>
        )}
        <span className="pv-title">
          {solved && !practiceMode && (
            <span style={{ color: 'var(--jade)' }} title="Solved">
              ✓{' '}
            </span>
          )}
          {pathStep(question.id) && (
            <span className="step-num" title="Step on the learning path">
              {pathStep(question.id)}
            </span>
          )}{' '}
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
          {question.approach && (
            <details className="hint">
              <summary>Approach — how the solution works</summary>
              <Markdown text={question.approach} />
            </details>
          )}
          <details className="hint">
            <summary>
              Show solution
              {question.approaches?.length > 1
                ? ' — brute force → optimal'
                : ' (last resort!)'}
            </summary>
            <Approaches question={question} onVisualize={openVisualizer} />
          </details>
        </section>

        <section className={`pv-pane pane-code ${tab === 'code' ? 'visible' : ''}`}>
          <div className="editor-bar">
            <span
              className={`lang-badge lang-${question.track}`}
              title="Each problem targets one runtime. Filter Browse by track to practice another language."
            >
              {LANG_LABEL[question.track]}
            </span>
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

          {/* Practice: correct → reflect + rate to schedule the next review */}
          {practiceMode && outcome === 'pass' && (
            <div className="reflect">
              <div className="solved-banner">✓ Correct! Now lock in the understanding.</div>
              <p className="reflect-q">
                Before you move on: in one sentence, what does your solution actually do — and
                what would break it?
              </p>
              {question.approach && (
                <div className="reflect-block">
                  <h4>How this solution works</h4>
                  <Markdown text={question.approach} />
                </div>
              )}
              <div className="reflect-block">
                <h4>
                  {question.approaches?.length > 1
                    ? 'Solutions — from brute force to optimal'
                    : 'Reference solution — compare with yours'}
                </h4>
                <Approaches question={question} onVisualize={openVisualizer} />
              </div>
              <p className="reflect-q">How well did you know it?</p>
              <div className="rating-row">
                {RATINGS.map((r) => (
                  <button key={r.key} className={`btn rating-btn rating-${r.key}`} onClick={() => rate(r.key)}>
                    <strong>{r.label}</strong>
                    <span>{r.note}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Practice: wrong → it will come back; fix it or skip */}
          {practiceMode && outcome === 'fail' && (
            <div className="reflect">
              <Results report={report} question={question} />
              <div className="retry-note">
                Not quite — this one stays in your queue and will come back until you get it. Fix
                it and Submit again, or skip for now.
              </div>
              <div className="rating-row">
                <button className="btn" onClick={() => setOutcome(null)}>
                  Try again
                </button>
                <button className="btn btn-gold" onClick={() => onNext?.()}>
                  Skip for now →
                </button>
              </div>
            </div>
          )}

          {running ? (
            <div className="loader">
              <div className="spinner" aria-hidden="true" />
              <span>{statusText || 'Running…'}</span>
            </div>
          ) : (
            !outcome && <Results report={report} question={question} />
          )}
        </section>
      </div>

      {viz && (
        <VisualizerModal
          question={question}
          code={viz.code}
          label={viz.label}
          onClose={() => setViz(null)}
        />
      )}
    </div>
  );
}
