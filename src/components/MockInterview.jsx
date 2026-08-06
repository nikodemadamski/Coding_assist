import { useEffect, useMemo, useRef, useState } from 'react';
import ProblemView from './ProblemView.jsx';
import Approaches from './Approaches.jsx';
import Markdown from './Markdown.jsx';
import {
  MOCK_FORMATS,
  pickMockProblem,
  optimalComplexity,
  formatDuration,
  summarizeMocks,
} from '../state/mockSession.js';
import { useReveal } from '../anim/useReveal.js';

// The interview simulator. One timed python problem, hints locked, then a
// debrief that grades the things a real interviewer grades: did you clarify,
// did you state your complexity, did you communicate — before the solution is
// ever shown.

const COMMS = [
  { v: 1, label: 'Silent' },
  { v: 2, label: 'Some' },
  { v: 3, label: 'Okay' },
  { v: 4, label: 'Clear' },
  { v: 5, label: 'Fluent' },
];

export default function MockInterview({ questions, progress, onRecordMock, onSolve, onFail, onExit }) {
  const [phase, setPhase] = useState('brief'); // brief | coding | debrief
  const [format, setFormat] = useState(null);
  const [qid, setQid] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [end, setEnd] = useState(null); // { report, ranOutOfTime, ended, timeMs }
  const startRef = useRef(0);

  // debrief self-rubric
  const [clarified, setClarified] = useState('');
  const [complexityGuess, setComplexityGuess] = useState('');
  const [communication, setCommunication] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  // Your own record, so the brief can answer "have I done this round, and how
  // did it go" beside each one. Records made before formats were logged simply
  // match no round, which is the honest answer for them.
  const history = useMemo(() => progress.mock ?? [], [progress.mock]);
  const { count: taken, passRate } = useMemo(() => summarizeMocks(history), [history]);
  const briefRef = useReveal('mock-brief');

  const question = qid ? questions.find((q) => q.id === qid) : null;

  function start(fmt) {
    const id = pickMockProblem(questions, progress, fmt);
    if (!id) return; // no python problem at that difficulty (shouldn't happen)
    setFormat(fmt);
    setQid(id);
    startRef.current = Date.now();
    setRemaining(fmt.minutes * 60000);
    setEnd(null);
    setClarified('');
    setComplexityGuess('');
    setCommunication(0);
    setShowSolution(false);
    setPhase('coding');
  }

  function finish(extra) {
    setEnd({
      report: extra.report ?? null,
      ranOutOfTime: !!extra.ranOutOfTime,
      ended: !!extra.ended,
      timeMs: Date.now() - startRef.current,
    });
    setPhase('debrief');
  }
  // Keep the timer's "time up" callback pointed at the latest finish closure.
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Countdown while coding.
  useEffect(() => {
    if (phase !== 'coding' || !format) return;
    const deadline = startRef.current + format.minutes * 60000;
    const tick = () => {
      const left = deadline - Date.now();
      if (left <= 0) {
        setRemaining(0);
        finishRef.current({ ranOutOfTime: true });
      } else {
        setRemaining(left);
      }
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [phase, format]);

  const passed = end?.report?.allPassed ?? false;

  // ---------------- brief ----------------
  if (phase === 'brief') {
    return (
      <div className="stats mock" ref={briefRef}>
        <header className="page-head" data-reveal>
          <h1>Mock interview</h1>
          <p className="page-lede mock-intro">
            One problem, a clock, and no hints. Talk through your thinking as if someone&apos;s
            watching — because in the interview, they are. When the timer stops you grade
            yourself on what actually gets scored, then see the model solution.
          </p>
          {taken > 0 && (
            <p className="mock-record">
              <strong>{taken}</strong> taken · <strong>{Math.round(passRate * 100)}%</strong>{' '}
              solved in time
            </p>
          )}
        </header>

        {/* Wide rows, not a grid of look-alikes: the round is the headline and
            its clock is the number, so picking one is a single glance. Your own
            record on that round sits beside it, because "have I done this
            before, and how did it go" is the question you're really asking. */}
        <div className="mock-formats" data-reveal>
          {MOCK_FORMATS.map((f) => {
            const past = history.filter((m) => m.format === f.key);
            const won = past.filter((m) => m.passed).length;
            return (
              <button key={f.key} className="mock-format-card" onClick={() => start(f)}>
                <span className="mock-format-main">
                  <span className="mock-format-name">{f.label}</span>
                  <span className="mock-format-blurb">{f.blurb}</span>
                </span>
                <span className="mock-format-meta">
                  <span className={`tag diff-${f.difficulty || 'medium'}`}>
                    {f.tracks ? f.tracks.join(' · ') : f.difficulty || 'random'}
                  </span>
                  <span className="mock-format-time">{f.minutes} min</span>
                  <span className="mock-format-record">
                    {past.length ? `${won}/${past.length} passed` : 'not attempted'}
                  </span>
                </span>
                <span className="cue-orb" aria-hidden="true">
                  →
                </span>
              </button>
            );
          })}
        </div>
        <button className="btn" onClick={onExit} data-reveal>
          ← Back to the dojo
        </button>
      </div>
    );
  }

  // ---------------- coding ----------------
  if (phase === 'coding' && question) {
    const low = remaining < 60000;
    const timer = (
      <span className={`mock-timer ${low ? 'low' : ''}`} role="timer" aria-label="Time remaining">
        {formatDuration(remaining)}
      </span>
    );
    return (
      <ProblemView
        key={qid}
        question={question}
        progress={progress}
        onSolve={() => {}}
        onFail={() => {}}
        onDraft={() => {}}
        onBack={() => finish({ ended: true })}
        mockMode
        headerExtra={timer}
        onSubmitReport={(rep) => finish({ report: rep })}
      />
    );
  }

  // ---------------- debrief ----------------
  if (phase === 'debrief' && question) {
    const actual = optimalComplexity(question);
    const canRecord = clarified && communication > 0;
    const timeStr = formatDuration(end.timeMs);

    function record() {
      const rec = {
        id: qid,
        title: question.title,
        difficulty: question.difficulty,
        track: question.track,
        date: new Date().toISOString(),
        format: format.key,
        limitMs: format.minutes * 60000,
        timeMs: end.timeMs,
        ranOutOfTime: end.ranOutOfTime,
        passed,
        clarified,
        complexityGuess: complexityGuess.trim(),
        communication,
      };
      onRecordMock(rec);
      // A mock pass is a real solve — let it count toward streak + SRS.
      if (passed) onSolve(qid);
      else onFail(qid);
      onExit();
    }

    return (
      <div className="stats mock">
        <h1>Debrief — {question.title}</h1>
        <div
          className={`mock-verdict ${passed ? 'pass' : 'fail'}`}
          role="status"
        >
          {passed && !end.ranOutOfTime && (
            <>✓ Solved in {timeStr} of {format.minutes}:00 — that&apos;s an interview-grade result.</>
          )}
          {passed && end.ranOutOfTime && <>✓ Solved, but the clock ran out first. Speed is the next rep.</>}
          {!passed && end.ranOutOfTime && <>Time&apos;s up at {timeStr} — tests not yet passing.</>}
          {!passed && end.ended && <>Ended early at {timeStr}. No shame — log it and go again.</>}
          {!passed && !end.ranOutOfTime && !end.ended && (
            <>Submitted at {timeStr}, tests not passing. The debrief is where the learning is.</>
          )}
        </div>

        <p className="mock-grade-intro">
          Grade yourself honestly — an interviewer is scoring these whether or not the code ran:
        </p>

        <div className="mock-rubric">
          <div className="mock-q">
            <label>Did you clarify the problem before coding? (restate it, ask about input size / edge cases)</label>
            <div className="seg">
              {['yes', 'partly', 'no'].map((v) => (
                <button
                  key={v}
                  className={`seg-btn ${clarified === v ? 'active' : ''}`}
                  onClick={() => setClarified(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="mock-q">
            <label>
              State your solution&apos;s time &amp; space complexity — out loud, then type it here:
            </label>
            <input
              className="mock-input"
              type="text"
              value={complexityGuess}
              onChange={(e) => setComplexityGuess(e.target.value)}
              placeholder="e.g. O(n) time, O(n) space"
              spellCheck="false"
            />
            {complexityGuess.trim() &&
              (actual ? (
                <p className="mock-actual">
                  Model solution&apos;s optimal: <code>{actual}</code> — do they match?
                </p>
              ) : (
                <p className="mock-actual">
                  No reference complexity on file for this one — check yours against the model
                  solution below.
                </p>
              ))}
          </div>

          <div className="mock-q">
            <label>How clearly did you talk through your thinking?</label>
            <div className="seg">
              {COMMS.map((c) => (
                <button
                  key={c.v}
                  className={`seg-btn ${communication === c.v ? 'active' : ''}`}
                  onClick={() => setCommunication(c.v)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mock-solution">
          {showSolution ? (
            <>
              <h3>Model solution</h3>
              {question.approach && <Markdown text={question.approach} />}
              <Approaches question={question} />
            </>
          ) : (
            <button className="btn" onClick={() => setShowSolution(true)}>
              Reveal the model solution
            </button>
          )}
        </div>

        <div className="mock-actions">
          <button className="btn btn-primary" onClick={record} disabled={!canRecord}>
            Record &amp; finish
          </button>
          <button className="btn" onClick={() => start(format)}>
            Another {format.label.toLowerCase()}
          </button>
        </div>
        {!canRecord && (
          <p className="mock-hint-text">Answer the clarify and communication questions to log this round.</p>
        )}
      </div>
    );
  }

  return null;
}
