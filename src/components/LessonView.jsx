import { useEffect, useRef, useState } from 'react';
import Markdown from './Markdown.jsx';
import Editor from './Editor.jsx';
import Results from './Results.jsx';
import VisualizerModal from './VisualizerModal.jsx';
import VisualPlayer from './visual/VisualPlayer.jsx';
import { checkAnswer } from '../data/warmups.js';
import { itemAsQuestion, LESSON_CHAPTERS } from '../data/lessons.js';
import { runQuestion } from '../engine/runnerClient.js';
import { runPythonSnippet } from '../engine/pyClient.js';
import { setMood } from '../anim/mascotBeacon.js';

// The lesson player: a tiny read, then one exercise at a time. Never timed,
// never punitive — two misses on a typed answer reveal it (with the why and a
// real run as proof), stuck code gets a "show the fix" hatch, and missed items
// come back once at the end so every lesson ends in success.
//
// mode 'learn'  — full item list, records completion via onComplete(id, {missedIdx})
// mode 'review' — a 4-item skill check (items passed in), reports via
//                 onReviewResult(id, passed)

const FIX_REVEAL_AFTER = 3; // failed runs before "Show the fix" / "Show the order" appears

// The action bar every step shares. One bar, always in the same place, tinted
// by the outcome — so "what do I press now?" is never a question, and the
// answer never moves. It's the single change that turns a page of cards into
// something you can sit inside for twenty minutes.
function Foot({ tone = '', note = null, children }) {
  return (
    <div className={`stage-foot ${tone}`}>
      <div className="stage-foot-inner">
        {note && <span className="stage-foot-note">{note}</span>}
        <div className="stage-foot-actions ln-run-row">{children}</div>
      </div>
    </div>
  );
}

// Enter advances once a step is settled. Typing answers already uses Enter to
// submit; this covers the "read the explanation, carry on" half, so a whole
// lesson can be done without the mouse leaving the keyboard.
function useAdvanceKey(active, go) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return;
      if (document.querySelector('.modal-backdrop')) return;
      e.preventDefault();
      go();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);
}

// A shuffled [0..n-1] guaranteed NOT already in order (so an arrange puzzle
// always starts scrambled).
function shuffledIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  const sorted = a.every((v, i) => v === i);
  return sorted && n > 1 ? [a[n - 1], ...a.slice(0, n - 1)] : a;
}

// One exercise. Owns its own attempt state; reports up once resolved.
function ItemPlayer({ lesson, item, idx, onResolved }) {
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [state, setResolution] = useState('open'); // open | correct | revealed
  // Every route out of an exercise goes through here, so the mascot reacts to
  // all of them without seven call sites having to remember to tell him.
  // A reveal is sympathy, not disappointment — the lesson is never punitive.
  const setState = (next) => {
    setResolution(next);
    if (next === 'correct') setMood('pass');
    else if (next === 'revealed') setMood('oops');
  };
  const [runOut, setRunOut] = useState(null); // predict "run it" proof
  const [code, setCode] = useState(item.code ?? item.starter_code ?? '');
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [showFix, setShowFix] = useState(false);
  const [viz, setViz] = useState(false);
  const inputRef = useRef(null);
  // arrange (Parsons): a shuffled order of line indices, drag/buttons to sort.
  const [order, setOrder] = useState(() =>
    item.type === 'arrange' ? shuffledIndices(item.lines.length) : []
  );
  const [dragIdx, setDragIdx] = useState(null);
  const rowRefs = useRef([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resolved = state === 'correct' || state === 'revealed';
  const firstTry = state === 'correct' && attempts <= 1;

  function submitTyped() {
    if (!input.trim() || resolved) return;
    const n = attempts + 1;
    setAttempts(n);
    if (checkAnswer(item, input)) {
      setState('correct');
    } else if (n >= 2) {
      setState('revealed');
    } else {
      setMood('fail');
    }
  }

  async function proveIt() {
    setRunOut({ pending: true });
    const res = await runPythonSnippet(item.code);
    setRunOut(res);
  }

  async function runCode() {
    setRunning(true);
    setReport(null);
    const rep = await runQuestion(itemAsQuestion(lesson, item, idx), code, () => {});
    setReport(rep);
    setRunning(false);
    if (rep.allPassed) {
      setState('correct');
    } else {
      setMood('fail');
      setFailedRuns((f) => f + 1);
    }
  }

  const typed = item.type === 'predict' || item.type === 'type';
  const firstTryArrange = state === 'correct' && failedRuns === 0;
  const advance = () =>
    onResolved(
      item.type === 'arrange'
        ? { firstTry: firstTryArrange, missed: state !== 'correct' }
        : { firstTry, missed: !firstTry }
    );
  useAdvanceKey(resolved, advance);

  // A standalone visual item: tap through the beats, then "Got it →". Never
  // fails — it's understanding, not a test.
  if (item.type === 'visual') {
    return (
      <div className="ln-item">
        <div className="stage-scroll">
          <div className="stage-inner">
            {item.caption && <p className="ln-item-ask">{item.caption}</p>}
            <VisualPlayer
              visual={item}
              onDone={() => onResolved({ firstTry: true, missed: false })}
            />
          </div>
        </div>
      </div>
    );
  }

  // arrange (Parsons): drag the shuffled lines into working order.
  if (item.type === 'arrange') {
    const moveRow = (from, to) => {
      if (to < 0 || to >= order.length || from === to) return;
      setOrder((o) => {
        const next = [...o];
        const [x] = next.splice(from, 1);
        next.splice(to, 0, x);
        return next;
      });
    };
    const onPointerMove = (e) => {
      if (dragIdx === null) return;
      const y = e.clientY;
      let target = dragIdx;
      rowRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) target = i;
      });
      if (target !== dragIdx) {
        moveRow(dragIdx, target);
        setDragIdx(target);
      }
    };
    async function checkArrange() {
      setRunning(true);
      setReport(null);
      const assembled = order.map((li) => item.lines[li]).join('\n');
      const rep = await runQuestion(itemAsQuestion(lesson, item, idx), assembled, () => {});
      setReport(rep);
      setRunning(false);
      if (rep.allPassed) setState('correct');
      else {
        setMood('fail');
        setFailedRuns((f) => f + 1);
      }
    }
    const revealOrder = () => {
      setOrder(item.lines.map((_, i) => i));
      setState('revealed');
    };

    return (
      <div className="ln-item">
        <div className="stage-scroll">
          <div className="stage-inner">
        <p className="ln-item-ask">{item.brief}</p>
        <p className="ln-arrange-hint-line">Drag the lines into the right order (indentation is done for you).</p>
        <ol
          className="ln-arrange"
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragIdx(null)}
          onPointerLeave={() => setDragIdx(null)}
        >
          {order.map((li, pos) => (
            <li
              key={li}
              ref={(el) => (rowRefs.current[pos] = el)}
              className={`ln-arrange-row ${dragIdx === pos ? 'dragging' : ''}`}
            >
              <span
                className="ln-arrange-grip"
                aria-hidden="true"
                onPointerDown={(e) => {
                  if (resolved) return;
                  setDragIdx(pos);
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                }}
              >
                ⠿
              </span>
              <code className="ln-arrange-code">{item.lines[li]}</code>
              {!resolved && (
                <span className="ln-arrange-moves">
                  <button aria-label="Move up" onClick={() => moveRow(pos, pos - 1)} disabled={pos === 0}>
                    ↑
                  </button>
                  <button
                    aria-label="Move down"
                    onClick={() => moveRow(pos, pos + 1)}
                    disabled={pos === order.length - 1}
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
        {report && !resolved && <Results report={report} question={itemAsQuestion(lesson, item, idx)} />}
        {resolved && (
          <div className={`ln-outcome ${state === 'correct' ? 'good' : 'shown'}`}>
            <p className="ln-outcome-line">
              {state === 'correct' ? '✓ Assembled and passing — that is the shape.' : 'Here it is, in order.'}
            </p>
          </div>
        )}
          </div>
        </div>
        {resolved ? (
          <Foot tone={state === 'correct' ? 'good' : 'shown'}>
            <button className="btn btn-primary ln-next" onClick={advance}>
              Next →
            </button>
          </Foot>
        ) : (
          <Foot note={failedRuns >= 1 && item.hint ? `Hint: ${item.hint}` : null}>
            {failedRuns >= FIX_REVEAL_AFTER && (
              <button className="btn" onClick={revealOrder}>
                Show the order
              </button>
            )}
            <button className="btn btn-primary" onClick={checkArrange} disabled={running}>
              {running ? 'Running…' : 'Check'}
            </button>
          </Foot>
        )}
      </div>
    );
  }

  return (
    <div className="ln-item">
      <div className="stage-scroll">
        <div className="stage-inner">
          {item.type === 'predict' && (
            <>
              <p className="ln-item-ask">What does this print?</p>
              <pre className="ln-code">{item.code}</pre>
            </>
          )}
          {item.type === 'type' && <p className="ln-item-ask">{item.prompt}</p>}
          {(item.type === 'fix' || item.type === 'write') && (
            <p className="ln-item-ask">{item.brief}</p>
          )}
          {item.type === 'watch' && <p className="ln-item-ask">{item.caption}</p>}

          {typed && (
            <div className="ln-answer-row">
              <input
                ref={inputRef}
                className="wu-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitTyped()}
                placeholder={item.type === 'predict' ? 'the exact output…' : 'type the Python…'}
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                disabled={resolved}
                aria-label="Your answer"
              />
            </div>
          )}

          {typed && !resolved && attempts === 1 && (
            <p className="ln-nudge">Not quite — look again. What exactly would Python do?</p>
          )}

          {(item.type === 'fix' || item.type === 'write') && (
            <>
              <div className="ln-editor">
                <Editor track="python" value={code} onChange={setCode} fontSize={14} />
              </div>
              {report && <Results report={report} question={itemAsQuestion(lesson, item, idx)} />}
              {showFix && !resolved && (
                <div className="ln-reveal">
                  <pre className="ln-code">{item.solution}</pre>
                </div>
              )}
            </>
          )}

          {item.type === 'watch' && !resolved && (
            <>
              <pre className="ln-code">{item.code}</pre>
              {viz && (
                <VisualizerModal
                  question={itemAsQuestion(lesson, item, idx)}
                  code={item.code}
                  label={lesson.title}
                  onClose={() => {
                    setViz(false);
                    setState('correct');
                  }}
                />
              )}
            </>
          )}

          {resolved && (
            <div className={`ln-outcome ${state === 'correct' ? 'good' : 'shown'}`}>
              {state === 'correct' ? (
                <p className="ln-outcome-line">✓ {item.why || 'Exactly.'}</p>
              ) : (
                <>
                  {typed && (
                    <p className="ln-outcome-line">
                      The answer: <code>{item.answer}</code>
                      {item.accept?.length ? <> (also fine: {item.accept.join(' · ')})</> : null}
                    </p>
                  )}
                  {item.why && <p className="ln-outcome-line">{item.why}</p>}
                  {item.type === 'predict' && (
                    <div className="ln-prove">
                      <button className="btn" onClick={proveIt} disabled={runOut?.pending}>
                        {runOut?.pending ? 'Running…' : 'Run it — see for yourself'}
                      </button>
                      {runOut && !runOut.pending && (
                        <pre className="ln-code ln-stdout">
                          {runOut.status === 'ok' ? runOut.stdout.trimEnd() : runOut.message}
                        </pre>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {resolved ? (
        <Foot tone={state === 'correct' ? 'good' : 'shown'}>
          <button className="btn btn-primary ln-next" onClick={advance}>
            Next →
          </button>
        </Foot>
      ) : (
        <Foot note={item.hint && failedRuns >= 1 ? `Hint: ${item.hint}` : null}>
          {(item.type === 'fix' || item.type === 'write') && (
            <>
              {failedRuns >= FIX_REVEAL_AFTER && !showFix && (
                <button className="btn" onClick={() => setShowFix(true)}>
                  Show the fix
                </button>
              )}
              {showFix && (
                <button className="btn" onClick={() => setState('revealed')}>
                  Got it — continue
                </button>
              )}
              <button className="btn btn-primary" onClick={runCode} disabled={running}>
                {running ? 'Running…' : 'Run'}
              </button>
            </>
          )}
          {typed && (
            <button className="btn btn-primary" onClick={submitTyped}>
              Check
            </button>
          )}
          {item.type === 'watch' && (
            <button className="btn btn-primary btn-viz" onClick={() => setViz(true)}>
              Step through it →
            </button>
          )}
        </Foot>
      )}
    </div>
  );
}

export default function LessonView({
  lesson,
  mode = 'learn',
  reviewItems = null, // review mode: [{item, idx}] from buildReviewItems
  onComplete,
  onReviewResult,
  onExit,
  onDone = null, // review mode: completion "Continue" (falls back to onExit)
  onNextLesson = null,
  nextLessonTitle = null,
  onWarmup = null, // chapter-end transfer: speed-test at the warm-up
  onOpenQuestion = null, // chapter-end transfer: try a real path question
}) {
  const baseQueue =
    mode === 'review' && reviewItems
      ? reviewItems.map(({ idx }) => idx)
      : lesson.items.map((_, i) => i);

  const [queue, setQueue] = useState(baseQueue);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState(mode === 'review' ? 'items' : 'read');
  const [missed, setMissed] = useState([]);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [requeued, setRequeued] = useState(false);
  const [readRun, setReadRun] = useState(null);
  // Read phase defaults to "See it" when a visual exists — understanding first.
  const [readMode, setReadMode] = useState(lesson.read.visual ? 'see' : 'read');
  const reportedRef = useRef(false);

  const idx = queue[pos];
  const item = lesson.items[idx];
  const total = baseQueue.length;

  async function runReadExample() {
    setReadRun({ pending: true });
    const res = await runPythonSnippet(lesson.read.example.code);
    setReadRun(res);
  }

  function handleResolved({ firstTry, missed: wasMissed }) {
    const nextMissed = wasMissed && !missed.includes(idx) ? [...missed, idx] : missed;
    if (wasMissed) setMissed(nextMissed);
    if (firstTry && pos < total) setFirstTryCount((c) => c + 1);

    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      return;
    }
    // End of the queue. In learn mode, missed items come back exactly once.
    if (mode === 'learn' && !requeued && nextMissed.length > 0) {
      setQueue([...queue, ...nextMissed]);
      setRequeued(true);
      setPos(pos + 1);
      return;
    }
    finish(nextMissed);
  }

  function finish(finalMissed) {
    if (!reportedRef.current) {
      reportedRef.current = true;
      if (mode === 'review') {
        onReviewResult?.(lesson.id, firstTryCount >= Math.min(3, total));
      } else {
        onComplete?.(lesson.id, { missedIdx: finalMissed });
      }
    }
    setPhase('done');
  }

  const chapterLabel =
    LESSON_CHAPTERS.find((c) => c.key === lesson.chapter)?.label ?? '';

  // The header every phase shares: one way out, where you are, how far along.
  // `progress` is a 0..1 fill for the read/done bookends and a segment list for
  // the drills, because "3 of 8" is a different fact from "part 1 of 3".
  function StageTop({ exitLabel, exitGlyph, segments = null, note = null }) {
    return (
      <header className="stage-top">
        <button className="icon-btn stage-exit" onClick={onExit} aria-label={exitLabel}>
          {exitGlyph}
        </button>
        <span className="stage-where">
          {chapterLabel && <span className="stage-kicker">{chapterLabel}</span>}
          <h1>{lesson.title}</h1>
        </span>
        {segments && (
          <span
            className="stage-prog"
            role="img"
            aria-label={`Exercise ${Math.min(pos + 1, segments.length)} of ${segments.length}`}
          >
            {segments.map((s, i) => (
              <span key={i} className={`stage-prog-seg ${s}`} />
            ))}
          </span>
        )}
        {note && <span className="ln-minutes">{note}</span>}
      </header>
    );
  }

  // ---------- read ----------
  if (phase === 'read') {
    return (
      <div className="ln-page stage">
        <StageTop exitLabel="Back to Learn" exitGlyph="←" note={`${lesson.minutes} min`} />
        <div className="stage-body">
          <div className="stage-scroll">
            <div className="stage-inner">
        <div className="ln-read">
          <Markdown text={lesson.read.text} />
          {lesson.read.visual && (
            <div className="ln-read-tabs" role="tablist">
              <button
                role="tab"
                className={`ln-read-tab ${readMode === 'see' ? 'active' : ''}`}
                aria-selected={readMode === 'see'}
                onClick={() => setReadMode('see')}
              >
                See it
              </button>
              <button
                role="tab"
                className={`ln-read-tab ${readMode === 'read' ? 'active' : ''}`}
                aria-selected={readMode === 'read'}
                onClick={() => setReadMode('read')}
              >
                Read the code
              </button>
            </div>
          )}
          {lesson.read.visual && readMode === 'see' ? (
            <VisualPlayer visual={lesson.read.visual} />
          ) : (
            <>
              <pre className="ln-code">{lesson.read.example.code}</pre>
              <div className="ln-run-row">
                <button className="btn" onClick={runReadExample} disabled={readRun?.pending}>
                  {readRun?.pending ? 'Running…' : 'Run it'}
                </button>
                {readRun && !readRun.pending && (
                  <pre className="ln-code ln-stdout">
                    {readRun.status === 'ok' ? readRun.stdout.trimEnd() : readRun.message}
                  </pre>
                )}
              </div>
            </>
          )}
            </div>
            </div>
          </div>
          <Foot note={`${lesson.items.length} exercises`}>
            <button className="btn btn-primary ln-start" onClick={() => setPhase('items')}>
              Start the drills →
            </button>
          </Foot>
        </div>
      </div>
    );
  }

  // ---------- done ----------
  if (phase === 'done') {
    const passed = mode !== 'review' || firstTryCount >= Math.min(3, total);
    return (
      <div className="ln-page stage stage-done">
        <div className="stage-body">
          <div className="stage-scroll">
            <div className="stage-inner ln-done">
          <span className="ln-done-score" aria-hidden="true">
            {firstTryCount}
            <span className="ln-done-of">/{total}</span>
          </span>
          <h1>
            {mode === 'review'
              ? passed
                ? 'Skill check passed'
                : 'Worth another look'
              : 'Lesson complete'}
          </h1>
          <p className="ln-done-line">
            {firstTryCount}/{total} first try
            {mode === 'review'
              ? passed
                ? ' — this one comes back later, spaced out.'
                : ' — it will come back tomorrow. That is the system working.'
              : missed.length
                ? ' — the ones you missed came back around. That is how it sticks.'
                : ' — clean run.'}
          </p>
          {mode === 'learn' && lesson.transfer && (
            <div className="ln-transfer">
              <span className="ln-transfer-label">Put it to work</span>
              {onWarmup && lesson.transfer.warmup && (
                <button className="ln-transfer-link" onClick={onWarmup}>
                  Speed-test it at the Warm-up →
                </button>
              )}
              {onOpenQuestion && lesson.transfer.question && (
                <button
                  className="ln-transfer-link"
                  onClick={() => onOpenQuestion(lesson.transfer.question)}
                >
                  Try a real problem with it →
                </button>
              )}
            </div>
          )}
            </div>
          </div>
          <Foot tone={passed ? 'good' : 'shown'} note={missed.length ? `${missed.length} came back around` : null}>
            <div className="ln-done-actions">
              {mode === 'review' ? (
                <button className="btn btn-primary" onClick={() => (onDone ?? onExit)()}>
                  Continue →
                </button>
              ) : (
                <>
                  <button className="btn" onClick={onExit}>
                    Back to Learn
                  </button>
                  {onNextLesson && nextLessonTitle && (
                    <button className="btn btn-primary" onClick={onNextLesson}>
                      Next lesson: {nextLessonTitle} →
                    </button>
                  )}
                </>
              )}
            </div>
          </Foot>
        </div>
      </div>
    );
  }

  // ---------- items ----------
  // One segment per exercise, including any that came back around — a bar you
  // watch fill, not eight identical dots you have to count.
  const segments = queue.map((_, i) => (i < pos ? 'done' : i === pos ? 'now' : ''));

  return (
    <div className="ln-page stage">
      <StageTop exitLabel="End lesson" exitGlyph="✕" segments={segments} />
      <div className="stage-body">
        <ItemPlayer
          key={`${idx}-${pos}`}
          lesson={lesson}
          item={item}
          idx={idx}
          onResolved={handleResolved}
        />
      </div>
    </div>
  );
}
