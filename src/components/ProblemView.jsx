import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from './Editor.jsx';
import Results from './Results.jsx';
import Markdown from './Markdown.jsx';
import Approaches from './Approaches.jsx';
import StuckLadder from './StuckLadder.jsx';
import Notes from './Notes.jsx';
import BigOCheck from './BigOCheck.jsx';
import VisualizerModal from './VisualizerModal.jsx';
import { runQuestion } from '../engine/runnerClient.js';
import { RATING_DELTA, isSolved } from '../state/progress.js';
import { formatDuration } from '../state/mockSession.js';
import {
  loadUiPrefs,
  saveUiPrefs,
  clampSplit,
  FONT_MIN,
  FONT_MAX,
  UI_DEFAULTS,
} from '../state/uiPrefs.js';
import { pathStep } from '../data/roadmap.js';

const LANG_LABEL = {
  python: 'Python 3',
  pandas: 'Python + pandas',
  sql: 'SQL (SQLite)',
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

const MOD = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl';

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
  // mock-interview props (optional): lock help, show a timer, report result
  mockMode = false,
  headerExtra = null,
  onSubmitReport = null,
  // jump to the Patterns reference for this problem's pattern (optional)
  onSeePattern = null,
  // personal notes (optional): save handler; the note itself is read from progress
  onNote = null,
  // after-solve Big-O check-in result recorder (optional)
  onBigO = null,
  // free-mode continuation (optional): the next unsolved path question
  nextUp = null,
  onOpenNext = null,
}) {
  const [code, setCode] = useState(
    () => progress.drafts[question.id] ?? question.starter_code ?? ''
  );
  const [tab, setTab] = useState('problem');
  const [focusCode, setFocusCode] = useState(false); // desktop: hide problem, widen editor
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [loadPct, setLoadPct] = useState(null); // 0-100 while Pyodide loads
  const [justSolved, setJustSolved] = useState(false);
  const [outcome, setOutcome] = useState(null); // practice: 'pass' | 'fail' | null
  const [viz, setViz] = useState(null); // { code, label } → visualizer open
  const [uiPrefs, setUiPrefs] = useState(loadUiPrefs); // divider split % + editor font size
  const draftTimer = useRef(null);
  const bodyRef = useRef(null);
  // Interview pace: the component remounts per question (key={id}), so mount
  // time is "problem opened". Capped so a left-open tab doesn't poison stats.
  const openedAt = useRef(Date.now());
  const solveMsRef = useRef(null);
  const SOLVE_TIME_CAP = 90 * 60000;
  const elapsedMs = () => Math.min(Date.now() - openedAt.current, SOLVE_TIME_CAP);

  const bumpFont = useCallback(
    (d) => setUiPrefs((p) => saveUiPrefs({ fontSize: p.fontSize + d })),
    []
  );

  // Drag the divider: live-resize while moving, persist on release.
  const startDividerDrag = useCallback((e) => {
    e.preventDefault();
    const rect = bodyRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pctAt = (x) => clampSplit(((x - rect.left) / rect.width) * 100);
    const onMove = (ev) => setUiPrefs((p) => ({ ...p, split: pctAt(ev.clientX) }));
    const onUp = (ev) => {
      setUiPrefs(saveUiPrefs({ split: pctAt(ev.clientX) }));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('cursor');
    };
    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  const openVisualizer = useCallback((vizCode, vizLabel, vizNote) => {
    setViz({ code: vizCode, label: vizLabel, note: vizNote });
  }, []);

  const solved = isSolved(progress.solved[question.id]);

  // Keyboard solve loop: Ctrl/⌘+Enter runs, Ctrl/⌘+Shift+Enter submits.
  // Capture phase so it works while the editor has focus (before CodeMirror).
  const executeRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.querySelector('.modal-backdrop')) return; // a modal owns the keys
        e.preventDefault();
        e.stopPropagation();
        executeRef.current?.(e.shiftKey);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

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
      setLoadPct(status.progress ?? null);
      setStatusText('Booting Python — first run only, a few seconds…');
    } else if (status.phase === 'loading-pandas') {
      setLoadPct(null);
      setStatusText('Loading pandas (~15s first time)…');
    } else if (status.phase === 'running') {
      setLoadPct(null);
      setStatusText('Running your code…');
    } else {
      setStatusText('');
    }
  }, []);

  async function execute(isSubmit) {
    if (running) return;
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
        if (mockMode) {
          // The mock owns the outcome — hand it the report and let it run the
          // debrief. No solved banner, no practice reflect here.
          onSubmitReport?.(rep);
        } else if (rep.allPassed) {
          solveMsRef.current = elapsedMs();
          if (practiceMode) {
            // Wait for a confidence rating before scheduling — the rating tunes
            // the next review interval.
            setOutcome('pass');
          } else {
            onSolve(question.id, { timeMs: solveMsRef.current });
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

  executeRef.current = execute;

  // Rating a correct answer records the solve (with the confidence delta) AND
  // advances the session — onSolve is the practice handler that drops the
  // question from the queue, so we must NOT also call onNext (that re-queues).
  function rate(level) {
    onSolve(question.id, { stageDelta: RATING_DELTA[level], timeMs: solveMsRef.current });
  }

  function handleReset() {
    if (code !== question.starter_code && !window.confirm('Replace your code with the starter?')) {
      return;
    }
    handleChange(question.starter_code);
  }

  const phaseLabel =
    practiceInfo?.phase === 'review'
      ? `Review · ${practiceInfo.reviewsLeft} to clear`
      : practiceInfo?.phase === 'new'
        ? `New · ${practiceInfo.newLeft} left`
        : practiceInfo?.phase === 'drill'
          ? `Drill · ${practiceInfo.reviewsLeft} left`
          : '';

  return (
    <div className={`problem-view ${focusCode ? 'focus-code' : ''}`}>
      <div className="pv-toolbar">
        <button
          className="icon-btn"
          onClick={onBack}
          aria-label={
            mockMode
              ? 'End interview'
              : practiceMode
                ? 'End practice session'
                : 'Back to problem list'
          }
        >
          {mockMode ? '✕ End interview' : practiceMode ? '✕ End' : '←'}
        </button>
        {practiceMode && phaseLabel && (
          <span className={`phase-pill ${practiceInfo.phase}`}>{phaseLabel}</span>
        )}
        {headerExtra}
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
        <button
          className="icon-btn pv-focus-toggle"
          onClick={() => setFocusCode((f) => !f)}
          aria-pressed={focusCode}
          title={focusCode ? 'Show the problem again' : 'Focus the editor (hide the problem)'}
        >
          {focusCode ? 'Show problem' : 'Focus'}
        </button>
        <button
          className="btn"
          onClick={() => execute(false)}
          disabled={running}
          title={`Run against the tests (${MOD}+Enter)`}
        >
          {running ? '…' : 'Run'} <kbd className="kbd-hint">{MOD}↩</kbd>
        </button>
        <button
          className="btn btn-primary"
          onClick={() => execute(true)}
          disabled={running}
          title={`Submit — counts the attempt (${MOD}+Shift+Enter)`}
        >
          Submit <kbd className="kbd-hint">{MOD}⇧↩</kbd>
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

      <div className="pv-body" ref={bodyRef} style={{ '--pv-split': `${uiPrefs.split}%` }}>
        <section className={`pv-pane pane-problem ${tab === 'problem' ? 'visible' : ''}`}>
          <Markdown text={question.description} />
          {!mockMode && question.why && (
            <div className="why-card">
              <span className="why-card-label">Why this one</span>
              <Markdown text={question.why} />
            </div>
          )}
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
          {question.constraints?.length > 0 && (
            <div className="constraints">
              <h3>Constraints</h3>
              <ul>
                {question.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {mockMode ? (
            <div className="mock-reminder">
              <strong>Interview mode — no hints, no solution.</strong>
              <ol>
                <li>Clarify: restate the problem, ask about input size and edge cases.</li>
                <li>Plan out loud: name your approach and its time/space complexity before coding.</li>
                <li>Code it, then walk a example through by hand.</li>
                <li>Submit when ready — you&apos;ll compare against the model solution after.</li>
              </ol>
            </div>
          ) : (
            <StuckLadder question={question} onVisualize={openVisualizer} onSeePattern={onSeePattern} />
          )}
          {!mockMode && question.insight && (
            <details className="go-deeper">
              <summary>Go deeper — why this works &amp; why it&apos;s worth knowing</summary>
              <div className="go-deeper-body">
                <Markdown text={question.insight} />
              </div>
            </details>
          )}
          {!mockMode && onNote && (
            <Notes
              questionId={question.id}
              note={progress.notes?.[question.id]}
              onSave={onNote}
            />
          )}
        </section>

        <div
          className="pv-divider"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the problem panel (arrow keys or drag; double-click resets)"
          tabIndex={0}
          title="Drag to resize · double-click to reset"
          onPointerDown={startDividerDrag}
          onDoubleClick={() => setUiPrefs(saveUiPrefs({ split: UI_DEFAULTS.split }))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setUiPrefs((p) => saveUiPrefs({ split: p.split - 2 }));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setUiPrefs((p) => saveUiPrefs({ split: p.split + 2 }));
            }
          }}
        />

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
            <span className="font-ctl" title="Editor font size">
              <button
                className="btn font-btn"
                onClick={() => bumpFont(-1)}
                disabled={uiPrefs.fontSize <= FONT_MIN}
                aria-label="Smaller editor font"
              >
                A−
              </button>
              <span className="font-size-val">{uiPrefs.fontSize}px</span>
              <button
                className="btn font-btn"
                onClick={() => bumpFont(1)}
                disabled={uiPrefs.fontSize >= FONT_MAX}
                aria-label="Larger editor font"
              >
                A+
              </button>
            </span>
            {!mockMode && question.track !== 'sql' && (question.tests?.length ?? 0) > 0 && (
              <button
                className="btn btn-viz"
                onClick={() => openVisualizer(code, 'Your code')}
                title="Trace YOUR code line by line on a real test case"
              >
                Visualize my code
              </button>
            )}
            <span className="hint-text">
              {question.track === 'sql'
                ? 'Write a single SELECT query.'
                : `Keep the function name ${question.function_name}().`}
            </span>
          </div>
          <div className="editor-wrap">
            <Editor
              track={question.track}
              value={code}
              onChange={handleChange}
              fontSize={uiPrefs.fontSize}
            />
          </div>
        </section>

        <section
          className={`pv-pane pane-result ${tab === 'result' ? 'visible' : ''}`}
          aria-live="polite"
        >
          {justSolved && (
            <div className="solved-banner">
              <span>
                Solved{solveMsRef.current != null ? ` in ${formatDuration(solveMsRef.current)}` : ''}!
                Scheduled for review — spaced repetition will bring it back.
              </span>
              {nextUp && onOpenNext && (
                <button className="btn btn-jade next-q-btn" onClick={() => onOpenNext(nextUp.id)}>
                  Next on your path: {pathStep(nextUp.id) ? `step ${pathStep(nextUp.id)} · ` : ''}
                  {nextUp.title} →
                </button>
              )}
            </div>
          )}
          {justSolved && (
            <BigOCheck question={question} onResult={onBigO} key={`bigo-${question.id}`} />
          )}

          {/* Practice: correct → reflect + rate to schedule the next review */}
          {practiceMode && outcome === 'pass' && (
            <div className="reflect">
              <div className="solved-banner">
                ✓ Correct{solveMsRef.current != null ? ` in ${formatDuration(solveMsRef.current)}` : ''}!
                Now lock in the understanding.
              </div>
              {progress.notes?.[question.id] && (
                <div className="past-note">
                  <span className="past-note-label">Your note from last time</span>
                  <p>{progress.notes[question.id]}</p>
                </div>
              )}
              <BigOCheck question={question} onResult={onBigO} key={`bigo-r-${question.id}`} />
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
              {onNote && (
                <Notes
                  questionId={question.id}
                  note={progress.notes?.[question.id]}
                  onSave={onNote}
                  heading="Note to future you — it'll be here at the next review"
                />
              )}
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
            <div className="loader" role="status">
              {loadPct != null ? (
                <div className="loader-bar">
                  <div className="loader-bar-fill" style={{ width: `${loadPct}%` }} />
                </div>
              ) : (
                <div className="spinner" aria-hidden="true" />
              )}
              <span>{statusText || 'Running your code…'}</span>
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
          note={viz.note}
          onClose={() => setViz(null)}
        />
      )}
    </div>
  );
}
