import { useCallback, useEffect, useRef, useState } from 'react';
import {
  QUIZ_SECONDS,
  ROUND_SIZE,
  buildQuizRound,
  roundSummary,
  verdictFor,
} from '../state/patternQuiz.js';
import { PATTERN_GUIDE } from '../data/patternGuide.js';
import { setMood } from '../anim/mascotBeacon.js';
import CountUp from './CountUp.jsx';

// Pattern recognition, against a clock.
//
// This trains the single most valuable interview reflex: seeing which technique
// a problem wants before writing any code. The clock is not decoration — if you
// need thirty seconds you did not *recognise* the pattern, you derived it, and
// deriving it is what you will not have time to do in the room. Running out is
// therefore a wrong answer, scored as one.
//
// It runs on the shared stage shell (the lesson player and the warm-up use the
// same one): one thing at a time, the action always in the same place at the
// bottom, so the button never moves between questions.

const CARD_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p]));
const TICK_MS = 100;
const PICK_KEYS = ['1', '2', '3', '4'];

export default function PatternQuiz({ questions, progress, onResult, onOpenPattern, onExit }) {
  const [round, setRound] = useState(() => buildQuizRound(questions, ROUND_SIZE));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null); // key picked, or '' for a timeout
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_SECONDS * 1000);
  const askedAt = useRef(0);
  const saved = useRef(false);

  const item = round[idx];
  const done = idx >= round.length;
  const answered = chosen !== null;
  const correct = answered && chosen === item?.correctKey;

  // Settle an item exactly once, whether you picked or the clock did. `key` is
  // '' on a timeout, which can never equal a correct key — so a run-out grades
  // itself as wrong without a special case downstream.
  const settle = useCallback(
    (key) => {
      setChosen((prev) => {
        if (prev !== null) return prev;
        const timedOut = key === '';
        const hit = key === item.correctKey;
        setAnswers((a) => [
          ...a,
          { key: item.correctKey, correct: hit, ms: Date.now() - askedAt.current, timedOut },
        ]);
        setMood(hit ? 'pass' : timedOut ? 'oops' : 'fail');
        return key;
      });
    },
    [item]
  );

  // One clock per item, restarted by the idx in the dependency list.
  useEffect(() => {
    if (done || answered) return undefined;
    askedAt.current = Date.now();
    setTimeLeft(QUIZ_SECONDS * 1000);
    const id = setInterval(() => {
      const left = QUIZ_SECONDS * 1000 - (Date.now() - askedAt.current);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) settle('');
    }, TICK_MS);
    return () => clearInterval(id);
  }, [idx, done, answered, settle]);

  const next = useCallback(() => {
    setChosen(null);
    setIdx((i) => i + 1);
  }, []);

  // The whole round is one keyboard loop: 1–4 to name it, Enter to move on.
  // Recognition drills live or die on how fast you can go through them.
  useEffect(() => {
    if (done) return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!answered && PICK_KEYS.includes(e.key)) {
        const opt = item.options[Number(e.key) - 1];
        if (opt) {
          e.preventDefault();
          settle(opt.key);
        }
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, done, item, next, settle]);

  // Save once, when the round ends — not per answer, so quitting halfway
  // doesn't file a two-question round against your recognition record.
  useEffect(() => {
    if (!done || saved.current || answers.length === 0) return;
    saved.current = true;
    onResult?.(answers);
  }, [done, answers, onResult]);

  function restart() {
    saved.current = false;
    setRound(buildQuizRound(questions, ROUND_SIZE));
    setAnswers([]);
    setIdx(0);
    setChosen(null);
  }

  if (done) {
    return (
      <Debrief
        summary={roundSummary(answers)}
        progress={progress}
        onRestart={restart}
        onOpenPattern={onOpenPattern}
        onExit={onExit}
      />
    );
  }

  const card = CARD_BY_KEY[item.correctKey];
  const secsLeft = Math.ceil(timeLeft / 1000);
  const frac = timeLeft / (QUIZ_SECONDS * 1000);
  const low = !answered && frac < 0.3;
  const score = answers.filter((a) => a.correct).length;

  return (
    <div className="quiz stage">
      <header className="stage-top">
        <button className="icon-btn stage-exit" onClick={onExit} aria-label="Quit the drill">
          ✕
        </button>
        <span className="stage-where">
          <span className="stage-kicker">Pattern drill</span>
          <h1 className="quiz-count">
            {idx + 1} <span className="quiz-count-of">of {round.length}</span>
          </h1>
        </span>
        {/* Segments, not a bar: at ten items the shape of the run — which ones
            you missed, and where — is readable at a glance. */}
        <span
          className="stage-prog"
          role="img"
          aria-label={`Question ${idx + 1} of ${round.length}, ${score} named correctly`}
        >
          {round.map((_, i) => (
            <span
              key={i}
              className={`stage-prog-seg ${
                i < answers.length ? (answers[i].correct ? 'done' : 'miss') : i === idx ? 'now' : ''
              }`}
            />
          ))}
        </span>
        <span
          className={`quiz-clock ${low ? 'low' : ''} ${answered ? 'is-stopped' : ''}`}
          role="timer"
          aria-label={`${secsLeft} seconds left`}
        >
          {answered ? '—' : `${secsLeft}s`}
        </span>
        <span className="quiz-score" title="Named correctly this round">
          <span className="quiz-score-n">{score}</span>
          <span className="quiz-score-l">named</span>
        </span>
      </header>

      <div className={`quiz-timerbar ${low ? 'low' : ''} ${answered ? 'is-stopped' : ''}`} aria-hidden="true">
        <div className="quiz-timer-fill" style={{ '--fill': frac }} />
      </div>

      <div className="stage-body">
        <div className="stage-step" key={idx}>
          <div className="stage-scroll">
            <div className="stage-inner">
              <p className="quiz-ask">Which pattern would you reach for?</p>
              <div className="quiz-card">
                <h2 className="quiz-title">{item.title}</h2>
                <p className="quiz-prompt">{item.prompt}</p>
              </div>

              <div className="quiz-options">
                {item.options.map((o, i) => {
                  const isCorrect = o.key === item.correctKey;
                  const cls = !answered
                    ? ''
                    : isCorrect
                      ? 'correct'
                      : o.key === chosen
                        ? 'wrong'
                        : 'dim';
                  return (
                    <button
                      key={o.key}
                      className={`quiz-option ${cls}`}
                      onClick={() => settle(o.key)}
                      disabled={answered}
                    >
                      <span className="quiz-key" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="quiz-option-name">{o.name}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className={`quiz-why ${correct ? 'good' : 'bad'}`}>
                  <p className="quiz-why-line">
                    <strong>
                      {correct ? 'Right.' : chosen === '' ? `Time. It's ${card.name}.` : `No — ${card.name}.`}
                    </strong>{' '}
                    {card.when}
                  </p>
                  {/* The cues are the memorisable part, so they are what the
                      feedback shows — not a restatement of the answer. */}
                  {card.cues?.length > 0 && (
                    <p className="quiz-cues">
                      Say these to yourself:{' '}
                      {card.cues.map((c, i) => (
                        <span className="quiz-cue" key={c}>
                          {c}
                          {i < card.cues.length - 1 ? ' · ' : ''}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* The action never moves between questions. */}
          <div className={`stage-foot ${answered ? (correct ? 'good' : 'shown') : ''}`}>
            <div className="stage-foot-inner">
              <span className="stage-foot-note">
                {answered ? 'Enter ↵ for the next one' : 'Press 1–4 — running out counts as wrong'}
              </span>
              <div className="stage-foot-actions">
                <button className="btn btn-primary" onClick={next} disabled={!answered}>
                  {idx + 1 === round.length ? 'See the debrief →' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The debrief. A score alone tells you nothing you can act on, so the thing
// with the most weight on this screen is the list of patterns you could not
// name — each one a link straight to the template that teaches it.
function Debrief({ summary, onRestart, onOpenPattern, onExit }) {
  const secs = summary.medianMs === null ? null : (summary.medianMs / 1000).toFixed(1);
  return (
    <div className="quiz stage stage-done">
      <div className="stage-scroll">
        <div className="stage-inner quiz-done">
          <p className="quiz-done-kicker">Pattern drill</p>
          <h1>
            You named <CountUp value={summary.right} className="quiz-done-n" /> of {summary.total}
          </h1>
          <p className="quiz-done-line">{verdictFor(summary)}</p>

          <div className="quiz-done-stats">
            <span className="quiz-stat">
              <span className="quiz-stat-n">{summary.pct}%</span>
              <span className="quiz-stat-l">recognised</span>
            </span>
            <span className="quiz-stat">
              <span className="quiz-stat-n">{secs === null ? '—' : `${secs}s`}</span>
              <span className="quiz-stat-l">median call</span>
            </span>
            <span className="quiz-stat">
              <span className="quiz-stat-n">{summary.timedOut}</span>
              <span className="quiz-stat-l">ran out</span>
            </span>
          </div>

          {summary.missed.length > 0 ? (
            <section className="quiz-missed">
              <h2>Go and read these</h2>
              <ul className="quiz-missed-list">
                {summary.missed.map((m) => (
                  <li key={m.key}>
                    <button className="quiz-missed-row" onClick={() => onOpenPattern?.(m.key)}>
                      <span className="quiz-missed-name">{m.name}</span>
                      <span className="quiz-missed-n">
                        missed {m.n}×
                      </span>
                      <span className="quiz-missed-when">{CARD_BY_KEY[m.key]?.when}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="quiz-clean">Nothing missed. Go again and try to beat your median.</p>
          )}
        </div>
      </div>
      <div className="stage-foot">
        <div className="stage-foot-inner">
          <span className="stage-foot-note">Every round is folded into your recognition record.</span>
          <div className="stage-foot-actions">
            <button className="btn" onClick={onExit}>
              Back to the templates
            </button>
            <button className="btn btn-primary" onClick={onRestart}>
              Another round →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
