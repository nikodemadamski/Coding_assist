import { useEffect, useRef, useState } from 'react';
import Markdown from './Markdown.jsx';
import Editor from './Editor.jsx';
import Results from './Results.jsx';
import VisualizerModal from './VisualizerModal.jsx';
import { checkAnswer } from '../data/warmups.js';
import { itemAsQuestion } from '../data/lessons.js';
import { runQuestion } from '../engine/runnerClient.js';
import { runPythonSnippet } from '../engine/pyClient.js';

// The lesson player: a tiny read, then one exercise at a time. Never timed,
// never punitive — two misses on a typed answer reveal it (with the why and a
// real run as proof), stuck code gets a "show the fix" hatch, and missed items
// come back once at the end so every lesson ends in success.
//
// mode 'learn'  — full item list, records completion via onComplete(id, {missedIdx})
// mode 'review' — a 4-item skill check (items passed in), reports via
//                 onReviewResult(id, passed)

const FIX_REVEAL_AFTER = 3; // failed runs before "Show the fix" appears

// One exercise. Owns its own attempt state; reports up once resolved.
function ItemPlayer({ lesson, item, idx, onResolved }) {
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [state, setState] = useState('open'); // open | correct | revealed
  const [runOut, setRunOut] = useState(null); // predict "run it" proof
  const [code, setCode] = useState(item.code ?? item.starter_code ?? '');
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [showFix, setShowFix] = useState(false);
  const [viz, setViz] = useState(false);
  const inputRef = useRef(null);

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
      setFailedRuns((f) => f + 1);
    }
  }

  const typed = item.type === 'predict' || item.type === 'type';

  return (
    <div className="ln-item">
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
          {!resolved && (
            <button className="btn btn-primary" onClick={submitTyped}>
              Check
            </button>
          )}
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
          <div className="ln-run-row">
            <button className="btn btn-primary" onClick={runCode} disabled={running}>
              {running ? 'Running…' : 'Run'}
            </button>
            {!resolved && failedRuns >= FIX_REVEAL_AFTER && !showFix && (
              <button className="btn" onClick={() => setShowFix(true)}>
                Show the fix
              </button>
            )}
            {item.hint && !resolved && failedRuns >= 1 && (
              <span className="ln-hint">Hint: {item.hint}</span>
            )}
          </div>
          {report && <Results report={report} question={itemAsQuestion(lesson, item, idx)} />}
          {showFix && !resolved && (
            <div className="ln-reveal">
              <pre className="ln-code">{item.solution}</pre>
              <button className="btn" onClick={() => setState('revealed')}>
                Got it — continue
              </button>
            </div>
          )}
        </>
      )}

      {item.type === 'watch' && !resolved && (
        <>
          <pre className="ln-code">{item.code}</pre>
          <button className="btn btn-viz" onClick={() => setViz(true)}>
            Step through it →
          </button>
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
          <button
            className="btn btn-primary ln-next"
            onClick={() => onResolved({ firstTry, missed: !firstTry })}
          >
            Next →
          </button>
        </div>
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

  // ---------- read ----------
  if (phase === 'read') {
    return (
      <div className="stats ln-page">
        <div className="ln-top">
          <button className="icon-btn" onClick={onExit} aria-label="Back to Learn">
            ←
          </button>
          <h1>{lesson.title}</h1>
          <span className="ln-minutes">{lesson.minutes} min</span>
        </div>
        <div className="ln-read">
          <Markdown text={lesson.read.text} />
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
        </div>
        <button className="btn btn-primary ln-start" onClick={() => setPhase('items')}>
          Start the drills →
        </button>
      </div>
    );
  }

  // ---------- done ----------
  if (phase === 'done') {
    const passed = mode !== 'review' || firstTryCount >= Math.min(3, total);
    return (
      <div className="stats ln-page">
        <div className="ln-done">
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
          <div className="ln-done-actions">
            {mode === 'learn' && onNextLesson && nextLessonTitle && (
              <button className="btn btn-primary" onClick={onNextLesson}>
                Next lesson: {nextLessonTitle} →
              </button>
            )}
            {mode === 'review' ? (
              <button className="btn btn-primary" onClick={() => (onDone ?? onExit)()}>
                Continue →
              </button>
            ) : (
              <button className="btn" onClick={onExit}>
                Back to Learn
              </button>
            )}
          </div>
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
    );
  }

  // ---------- items ----------
  return (
    <div className="stats ln-page">
      <div className="ln-top">
        <button className="icon-btn" onClick={onExit} aria-label="End lesson">
          ✕
        </button>
        <h1>{lesson.title}</h1>
        <span className="ln-dots" aria-label={`Exercise ${Math.min(pos + 1, total)} of ${total}`}>
          {baseQueue.map((_, i) => (
            <span key={i} className={`ln-dot ${i < pos ? 'done' : i === pos ? 'now' : ''}`} />
          ))}
          {requeued && <span className="ln-dot-extra">+{queue.length - total}</span>}
        </span>
      </div>
      <ItemPlayer
        key={`${idx}-${pos}`}
        lesson={lesson}
        item={item}
        idx={idx}
        onResolved={handleResolved}
      />
    </div>
  );
}
