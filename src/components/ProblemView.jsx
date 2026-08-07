import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from './Editor.jsx';
import TestConsole from './TestConsole.jsx';
import SolveTimer from './SolveTimer.jsx';
import Markdown from './Markdown.jsx';
import Approaches from './Approaches.jsx';
import StuckLadder from './StuckLadder.jsx';
import Notes from './Notes.jsx';
import BigOCheck from './BigOCheck.jsx';
import SolvedPanel from './SolvedPanel.jsx';
import ShortcutSheet from './ShortcutSheet.jsx';
import VisualizerModal from './VisualizerModal.jsx';
import { runQuestion } from '../engine/runnerClient.js';
import { resetPythonRuntime } from '../engine/pyClient.js';
import { setMood } from '../anim/mascotBeacon.js';
import { isSolved } from '../state/progress.js';
import { lessonsForQuestion } from '../data/lessonLinks.js';
import { lessonById } from '../data/lessons.js';
import { formatDuration } from '../state/mockSession.js';
import {
  loadUiPrefs,
  saveUiPrefs,
  clampSplit,
  clampVSplit,
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

// User code is killed at 5s, but a first run also downloads the runtime. Past
// this, offer a manual restart rather than leaving the editor locked.
const STUCK_AFTER_MS = 20000;

// Phone keyboards bury the characters Python lives on. This strip sits above
// the editor on narrow screens — one tap for the symbols, indent and dedent.
const MOBILE_KEYS = [':', '(', ')', '[', ']', '{', '}', "'", '"', ',', '.', '_', '=', '<', '>', '#'];

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
  onRate = null,
  // mock-interview props (optional): lock help, show a timer, report result
  mockMode = false,
  headerExtra = null,
  onSubmitReport = null,
  // jump to the Patterns reference for this problem's pattern (optional)
  onSeePattern = null,
  // learn-before-use: open a prerequisite lesson (optional)
  onOpenLesson = null,
  // personal notes (optional): save handler; the note itself is read from progress
  onNote = null,
  // after-solve Big-O check-in result recorder (optional)
  onBigO = null,
  // free-mode continuation (optional): the next unsolved path question
  nextUp = null,
  onOpenNext = null,
  // free-mode path stepping (optional): the questions either side of this one,
  // so you can move on without solving and continue straight after finishing
  prevInPath = null,
  nextInPath = null,
  // start from a clean slate, ignoring any saved draft (reviews, drills, mocks
  // — re-deriving the answer is the whole point; browsing keeps your draft)
  freshStart = false,
}) {
  const [code, setCode] = useState(() =>
    freshStart || mockMode
      ? question.starter_code ?? ''
      : progress.drafts[question.id] ?? question.starter_code ?? ''
  );
  const [tab, setTab] = useState('problem');
  const [focusCode, setFocusCode] = useState(false); // desktop: hide problem, widen editor
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  // Watchdog: a run that has not finished after a while offers a manual restart,
  // so the editor can never be left permanently locked behind a wedged runtime.
  const [stuck, setStuck] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [loadPct, setLoadPct] = useState(null); // 0-100 while Pyodide loads
  const [justSolved, setJustSolved] = useState(false);
  const [outcome, setOutcome] = useState(null); // practice: 'pass' | 'fail' | null
  const [viz, setViz] = useState(null); // { code, label } → visualizer open
  // The console under the editor: 'testcase' (the cases + a custom one) or
  // 'result' (the graded run). Runs snap it to 'result'; a fresh question
  // opens on the cases, because that's what you read before you write.
  const [consoleTab, setConsoleTab] = useState(() =>
    (question.tests?.length ?? 0) > 0 ? 'testcase' : 'result'
  );
  const [customReport, setCustomReport] = useState(null); // ungraded scratch run
  const [customRunning, setCustomRunning] = useState(false);
  const [lessonDismissed, setLessonDismissed] = useState(false); // "I know it — continue"
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

  // Mobile key strip: dispatch straight into CodeMirror. pointerdown +
  // preventDefault so the tap never steals focus — the phone keyboard stays up.
  const cmRef = useRef(null);
  const tapInsert = useCallback((text) => {
    const view = cmRef.current?.view;
    if (!view) return;
    view.dispatch(view.state.replaceSelection(text));
    view.focus();
  }, []);
  const tapIndent = useCallback((dir) => {
    const view = cmRef.current?.view;
    if (!view) return;
    const { state } = view;
    const changes = [];
    const seen = new Set();
    for (const r of state.selection.ranges) {
      const from = Math.min(r.from, r.to);
      const to = Math.max(r.from, r.to);
      for (let pos = from; pos <= to; ) {
        const line = state.doc.lineAt(pos);
        if (!seen.has(line.number)) {
          seen.add(line.number);
          if (dir > 0) changes.push({ from: line.from, insert: '    ' });
          else {
            const m = line.text.match(/^ {1,4}/);
            if (m) changes.push({ from: line.from, to: line.from + m[0].length });
          }
        }
        if (line.to >= to) break;
        pos = line.to + 1;
      }
    }
    if (changes.length) view.dispatch({ changes });
    view.focus();
  }, []);

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

  // The horizontal divider: how much of the code column the editor keeps and
  // how much the console gets. Same live-resize / persist-on-release contract
  // as the vertical one.
  const startVDividerDrag = useCallback((e) => {
    e.preventDefault();
    const rect = bodyRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pctAt = (y) => clampVSplit(((y - rect.top) / rect.height) * 100);
    const onMove = (ev) => setUiPrefs((p) => ({ ...p, vsplit: pctAt(ev.clientY) }));
    const onUp = (ev) => {
      setUiPrefs(saveUiPrefs({ vsplit: pctAt(ev.clientY) }));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('cursor');
    };
    document.body.style.cursor = 'row-resize';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  const openVisualizer = useCallback((vizCode, vizLabel, vizNote) => {
    setViz({ code: vizCode, label: vizLabel, note: vizNote });
  }, []);

  // Mobile: horizontal swipe on the reading panes flips Problem/Code/Result.
  // Swipes that start in the editor or the key strip are ignored — horizontal
  // movement there means scrolling code, never switching tabs.
  const swipeRef = useRef(null);
  const onSwipeStart = useCallback((e) => {
    if (e.target.closest('.cm-editor, .mkeys, input, select, textarea')) {
      swipeRef.current = null;
      return;
    }
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onSwipeEnd = useCallback((e) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 40) return; // a scroll, not a swipe
    setTab((cur) => {
      const order = TABS.map((x) => x.id);
      const i = order.indexOf(cur);
      return order[Math.max(0, Math.min(order.length - 1, dx < 0 ? i + 1 : i - 1))];
    });
  }, []);

  const solved = isSolved(progress.solved[question.id]);

  // ── the keyboard solve loop ───────────────────────────────────────────────
  // Two tiers, because they need different rules.
  //
  // The modified pair (Ctrl/⌘+Enter to run, +Shift to submit) is bound in the
  // CAPTURE phase so it fires while the editor has focus, before CodeMirror
  // sees it — running your code is the one thing you must be able to do
  // without leaving the buffer.
  //
  // The single letters are the opposite: they must NEVER fire while you're
  // typing, or `f` in a variable name would toggle focus mode. They bind in
  // the bubble phase and bail on any editable target, so you press Esc to
  // leave the editor and then the furniture responds. ShortcutSheet says so
  // out loud, because a rule nobody knows is a bug.
  const executeRef = useRef(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.querySelector('.modal-backdrop')) return; // a modal owns the keys
        e.preventDefault();
        e.stopPropagation();
        executeRef.current?.(e.shiftKey);
        return;
      }
      // Escape has to actually leave the editor, because that is the rule the
      // shortcut sheet teaches. CodeMirror swallows it and keeps focus, so the
      // documented escape hatch would otherwise be a lie. Read the completion
      // popup HERE, in the capture phase — by the time CodeMirror is done it
      // has already closed one, and we'd blur on the same keypress that was
      // only meant to dismiss it.
      if (e.key === 'Escape' && e.target?.closest?.('.cm-editor')) {
        if (document.querySelector('.cm-tooltip-autocomplete')) return; // that Esc is the popup's
        document.activeElement?.blur?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // A new run scrolls the results back to the top. Without this you land
  // wherever you had scrolled to on the previous run — usually halfway down a
  // test row — and miss the read at the top, which is the part written for you.
  const resultPaneRef = useRef(null);
  useEffect(() => {
    if (report && resultPaneRef.current) resultPaneRef.current.scrollTop = 0;
  }, [report]);

  const codeRef = useRef(code);
  codeRef.current = code;
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('.modal-backdrop')) return;
      const t = e.target;
      if (
        t?.tagName === 'INPUT' ||
        t?.tagName === 'TEXTAREA' ||
        t?.isContentEditable ||
        t?.closest?.('.cm-editor')
      ) {
        return;
      }
      const act = {
        '?': () => setShortcutsOpen(true),
        f: () => setFocusCode((v) => !v),
        v: () => openVisualizer(codeRef.current, 'Your code'),
        t: () => setConsoleTab((v) => (v === 'result' ? 'testcase' : 'result')),
        '[': () => prevInPath && onOpenNext?.(prevInPath.id),
        ']': () => nextInPath && onOpenNext?.(nextInPath.id),
      }[e.key];
      if (!act) return;
      e.preventDefault();
      act();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openVisualizer, prevInPath, nextInPath, onOpenNext]);

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

  // A run is capped at 5s of user code, but the first boot downloads the runtime.
  // If we are still going well past that, surface the escape hatch.
  useEffect(() => {
    if (!running) {
      setStuck(false);
      return undefined;
    }
    const t = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [running]);

  // Drop the Python runtime and unlock the editor. resetPythonRuntime settles any
  // in-flight job (so execute's finally clears `running`); the local reset covers
  // the case where nothing was actually in flight.
  function forceReset() {
    resetPythonRuntime();
    setRunning(false);
    setStuck(false);
    setStatusText('');
  }

  // A scratch run: the learner's own arguments, through the same engine, with
  // no expected value and no consequences. Never records a solve or a miss.
  async function runCustomCase(tests) {
    if (customRunning || running) return;
    setCustomRunning(true);
    setCustomReport(null);
    try {
      const rep = await runQuestion({ ...question, tests }, code, handleStatus);
      setCustomReport(rep);
    } catch (err) {
      setCustomReport({
        status: 'error',
        errorType: 'runtime',
        message: String(err?.message || err),
        allPassed: false,
      });
    } finally {
      setCustomRunning(false);
      setStatusText('');
    }
  }

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
    setConsoleTab('result');
    try {
      const rep = await runQuestion(question, code, handleStatus);
      setReport(rep);
      // The mascot watches the same result you do. Code that broke gets a
      // wince rather than a scolding — that isn't a wrong answer, it's a typo.
      setMood(
        rep.status === 'error' ? 'oops' : !rep.allPassed ? 'fail' : isSubmit ? 'proud' : 'pass'
      );
      if (isSubmit) {
        if (mockMode) {
          // The mock owns the outcome — hand it the report and let it run the
          // debrief. No solved banner, no practice reflect here.
          onSubmitReport?.(rep);
        } else if (rep.allPassed) {
          solveMsRef.current = elapsedMs();
          if (practiceMode) {
            // Record the solve NOW — leaving the session early must never lose
            // it. The confidence rating that follows only re-tunes the interval
            // (and advances the queue).
            onSolve(question.id, { timeMs: solveMsRef.current });
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
      setMood('oops');
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

  // The solve was already recorded on submit; rating re-tunes the interval and
  // advances the session queue (onRate is the practice handler for both).
  function rate(level) {
    onRate?.(question.id, level);
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
        {/* Step along the path without going home first. Practice and mock own
            their own queues, so the stepper is free-mode only. */}
        {!practiceMode && !mockMode && (prevInPath || nextInPath) && (
          <span className="pv-stepper">
            <button
              className="icon-btn pv-step-btn"
              onClick={() => prevInPath && onOpenNext?.(prevInPath.id)}
              disabled={!prevInPath}
              aria-label="Previous question on the path"
              title={prevInPath ? `Previous: ${prevInPath.title}` : 'Start of the path'}
            >
              ‹
            </button>
            <button
              className="icon-btn pv-step-btn"
              onClick={() => nextInPath && onOpenNext?.(nextInPath.id)}
              disabled={!nextInPath}
              aria-label="Next question on the path"
              title={nextInPath ? `Next: ${nextInPath.title}` : 'End of the path'}
            >
              ›
            </button>
          </span>
        )}
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
        {/* Pace is a scored dimension of readiness, so the clock belongs where
            you can see it while solving — not only in the debrief. Mock mode
            runs its own countdown in headerExtra, so it doesn't get two. */}
        {!mockMode && (
          <SolveTimer
            startedAt={openedAt.current}
            difficulty={question.difficulty}
            frozenMs={solveMsRef.current}
          />
        )}
        <button
          className="icon-btn pv-focus-toggle"
          onClick={() => setFocusCode((f) => !f)}
          aria-pressed={focusCode}
          title={focusCode ? 'Show the problem again (f)' : 'Focus the editor, hide the problem (f)'}
        >
          {focusCode ? 'Show problem' : 'Focus'}
        </button>
        {/* Shortcuts nobody knows about are shortcuts nobody has. */}
        <button
          className="icon-btn pv-keys"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <kbd>?</kbd>
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

      <div
        className="pv-body"
        ref={bodyRef}
        style={{ '--pv-split': `${uiPrefs.split}%`, '--pv-vsplit': `${uiPrefs.vsplit}%` }}
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        <section className={`pv-pane pane-problem ${tab === 'problem' ? 'visible' : ''}`}>
          {/* Learn-before-use: if this problem leans on a Python basic you
              haven't met, offer the 2-minute lesson first — with an escape
              hatch. Never blocks. */}
          {!mockMode &&
            onOpenLesson &&
            !lessonDismissed &&
            (() => {
              const ids = lessonsForQuestion(question, progress);
              if (ids.length === 0) return null;
              const lesson = lessonById(ids[0]);
              if (!lesson) return null;
              return (
                <div className="pv-learn-first">
                  <span className="pv-learn-first-text">
                    New to this? It uses <strong>{lesson.title}</strong> — learn it first, then
                    this clicks.
                  </span>
                  <div className="pv-learn-first-actions">
                    <button className="btn btn-jade" onClick={() => onOpenLesson(lesson.id)}>
                      Learn it ({lesson.minutes} min) →
                    </button>
                    <button className="btn-plain" onClick={() => setLessonDismissed(true)}>
                      I know it — continue
                    </button>
                  </div>
                </div>
              );
            })()}
          {/* The question itself comes first — description, examples,
              constraints — exactly what you'd see in the interview. All
              guidance (why, stuck ladder, go-deeper, notes) waits below. */}
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
            <div className="pv-extras">
              {question.why && (
                <div className="why-card">
                  <span className="why-card-label">Why this one</span>
                  <Markdown text={question.why} />
                </div>
              )}
              {/* Once you've solved it, a ladder of hints is the wrong thing
                  to have sitting open — you want the model approaches instead.
                  It's still one click away, because a re-clear can still stall. */}
              {solved ? (
                <>
                  <Approaches question={question} onVisualize={openVisualizer} />
                  <details className="stuck-after">
                    <summary>Still want the hint ladder?</summary>
                    <StuckLadder
                      question={question}
                      progress={progress}
                      onVisualize={openVisualizer}
                      onSeePattern={onSeePattern}
                      onOpenLesson={onOpenLesson}
                    />
                  </details>
                </>
              ) : (
                <StuckLadder
                  question={question}
                  progress={progress}
                  onVisualize={openVisualizer}
                  onSeePattern={onSeePattern}
                  onOpenLesson={onOpenLesson}
                />
              )}
            </div>
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
          {/* One quiet strip: what you're writing on the left, the tools that
              act on the editor on the right. Everything here used to be a
              full-weight button competing with Run and Submit. */}
          <div className="editor-bar">
            <span
              className={`lang-badge lang-${question.track}`}
              title="Each problem targets one runtime. Filter Browse by track to practice another language."
            >
              {LANG_LABEL[question.track]}
            </span>
            <span className="hint-text">
              {question.track === 'sql'
                ? 'Write a single SELECT query.'
                : `${question.function_name}()`}
            </span>
            <span className="editor-bar-tools">
              {!mockMode && question.track !== 'sql' && (question.tests?.length ?? 0) > 0 && (
                <button
                  className="bar-btn"
                  onClick={() => openVisualizer(code, 'Your code')}
                  title="Trace YOUR code line by line on a real test case"
                >
                  Visualize
                </button>
              )}
              <span className="font-ctl" title="Editor font size">
                <button
                  className="bar-btn font-btn"
                  onClick={() => bumpFont(-1)}
                  disabled={uiPrefs.fontSize <= FONT_MIN}
                  aria-label="Smaller editor font"
                >
                  A−
                </button>
                <span className="font-size-val">{uiPrefs.fontSize}px</span>
                <button
                  className="bar-btn font-btn"
                  onClick={() => bumpFont(1)}
                  disabled={uiPrefs.fontSize >= FONT_MAX}
                  aria-label="Larger editor font"
                >
                  A+
                </button>
              </span>
              <button className="bar-btn" onClick={handleReset} title="Replace your code with the starter">
                Reset
              </button>
            </span>
          </div>
          <div className="mkeys" role="toolbar" aria-label="Coding keys">
            <button
              type="button"
              className="mkey mkey-wide"
              title="Indent line"
              onPointerDown={(e) => {
                e.preventDefault();
                tapIndent(1);
              }}
            >
              ⇥
            </button>
            <button
              type="button"
              className="mkey mkey-wide"
              title="Unindent line"
              onPointerDown={(e) => {
                e.preventDefault();
                tapIndent(-1);
              }}
            >
              ⇤
            </button>
            {MOBILE_KEYS.map((k) => (
              <button
                type="button"
                className="mkey"
                key={k}
                onPointerDown={(e) => {
                  e.preventDefault();
                  tapInsert(k);
                }}
              >
                {k}
              </button>
            ))}
            <span className="mkeys-gap" />
            <button type="button" className="mkey mkey-run" onClick={() => execute(false)} disabled={running}>
              Run
            </button>
            <button type="button" className="mkey mkey-submit" onClick={() => execute(true)} disabled={running}>
              Submit
            </button>
          </div>
          <div className="editor-wrap">
            <Editor
              track={question.track}
              value={code}
              onChange={handleChange}
              fontSize={uiPrefs.fontSize}
              cmRef={cmRef}
            />
          </div>
        </section>

        <div
          className="pv-vdivider"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the editor (arrow keys or drag; double-click resets)"
          tabIndex={0}
          title="Drag to resize · double-click to reset"
          onPointerDown={startVDividerDrag}
          onDoubleClick={() => setUiPrefs(saveUiPrefs({ vsplit: UI_DEFAULTS.vsplit }))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setUiPrefs((p) => saveUiPrefs({ vsplit: p.vsplit - 3 }));
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setUiPrefs((p) => saveUiPrefs({ vsplit: p.vsplit + 3 }));
            }
          }}
        />

        <section
          ref={resultPaneRef}
          className={`pv-pane pane-result ${tab === 'result' ? 'visible' : ''}`}
          aria-live="polite"
        >
          {running && (
            <div className="loader" role="status">
              {loadPct != null ? (
                <div className="loader-bar">
                  <div className="loader-bar-fill" style={{ '--fill': loadPct / 100 }} />
                </div>
              ) : (
                /* A skeleton in the shape of the results that are coming, rather
                   than a spinner that says nothing about what to expect. */
                <div className="result-skeleton" aria-hidden="true">
                  <span className="sk-line sk-head" />
                  <span className="sk-row" />
                  <span className="sk-row sk-short" />
                </div>
              )}
              <span>{statusText || 'Running your code…'}</span>
              {stuck && (
                <div className="run-stuck">
                  <span>Taking longer than expected.</span>
                  <button className="btn btn-restart" onClick={forceReset}>
                    Restart Python & unlock the editor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* The console is always mounted: its tabs are how you read the test
              cases, so they must not vanish while a run is in flight or behind
              a banner. Everything below is handed to it as banners above the
              case list. */}
          <TestConsole
            question={question}
            report={report}
            running={running}
            tab={consoleTab}
            onTabChange={setConsoleTab}
            onRunCase={runCustomCase}
            customReport={customReport}
            customRunning={customRunning}
          >
            {justSolved && (
              <SolvedPanel
                key={question.id}
                question={question}
                progress={progress}
                solveMs={solveMsRef.current}
                nextQuestion={nextUp ?? nextInPath ?? null}
                onOpenNext={onOpenNext}
              />
            )}
            {justSolved && (
              <BigOCheck question={question} onResult={onBigO} key={`bigo-${question.id}`} />
            )}

            {/* Practice: correct → reflect + rate to schedule the next review */}
            {practiceMode && outcome === 'pass' && (
              <div className="reflect">
                <div className="solved-banner">
                  ✓ Correct{solveMsRef.current != null ? ` in ${formatDuration(solveMsRef.current)}` : ''} —
                  recorded. Now lock in the understanding, then rate it to continue.
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

            {/* Practice: wrong → it will come back; fix it or skip. The failing
                cases themselves are one tab away, so this is just the verdict
                and the two ways forward. */}
            {practiceMode && outcome === 'fail' && (
              <div className="reflect">
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
          </TestConsole>
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

      {shortcutsOpen && <ShortcutSheet onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
