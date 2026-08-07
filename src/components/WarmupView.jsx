import { useCallback, useEffect, useRef, useState } from 'react';
import { WARMUP_LEVELS, WARMUP_SETS, checkAnswer } from '../data/warmups.js';
import { useReveal } from '../anim/useReveal.js';
import { setMood } from '../anim/mascotBeacon.js';

// Warm-up mode: rapid-fire "type the Python" drills, like stretching before
// the workout. Pick a difficulty, then answer one-liners against a countdown.
// The run ends on the first mistake, on a timeout, or after all 50 — then a
// quick summary: what you nailed, what to sharpen.

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TICK_MS = 100;

export default function WarmupView({ progress, onResult, onExit }) {
  const [level, setLevel] = useState(null); // null = pick screen
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState([]); // { prompt, answer, ms }
  const [timeLeft, setTimeLeft] = useState(0); // ms remaining on this question
  const [result, setResult] = useState(null); // { reason, item?, given? }
  const inputRef = useRef(null);
  const qStartRef = useRef(0);
  const endedRef = useRef(false);

  const pickRef = useReveal('warmup-pick');
  const levelDef = WARMUP_LEVELS.find((l) => l.key === level);
  const [track, setTrack] = useState('python');
  const limitMs = (levelDef?.seconds ?? 0) * 1000;
  const running = level && !result;
  const item = queue[idx];

  const endRun = useCallback(
    (reason, extra = {}) => {
      if (endedRef.current) return;
      endedRef.current = true;
      setResult({ reason, ...extra });
    },
    []
  );

  // Report the finished run once (records best streak).
  useEffect(() => {
    if (result && level) onResult(level, result.reason === 'finished' ? queue.length : idx);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  function start(key) {
    endedRef.current = false;
    setLevel(key);
    setQueue(shuffle(WARMUP_SETS[key]));
    setIdx(0);
    setCorrect([]);
    setInput('');
    setResult(null);
  }

  // Per-question countdown. Restarts whenever the question changes.
  useEffect(() => {
    if (!running || !item) return;
    qStartRef.current = Date.now();
    setTimeLeft(limitMs);
    const t = setInterval(() => {
      const left = limitMs - (Date.now() - qStartRef.current);
      if (left <= 0) {
        clearInterval(t);
        endRun('timeout', { item });
      } else {
        setTimeLeft(left);
      }
    }, TICK_MS);
    return () => clearInterval(t);
  }, [running, idx, item, limitMs, endRun]);

  useEffect(() => {
    if (running) inputRef.current?.focus();
  }, [running, idx]);

  function submit() {
    if (!input.trim() || !item) return; // a stray Enter shouldn't end the run
    if (checkAnswer(item, input, { foldCase: levelDef?.track === 'sql' })) {
      const ms = Date.now() - qStartRef.current;
      setCorrect((c) => [...c, { prompt: item.prompt, answer: item.answer, ms }]);
      setInput('');
      if (idx + 1 >= queue.length) {
        // Only the ends of a run get a reaction. Fifty right answers at typing
        // speed would leave the mascot permanently mid-hop, which is noise.
        setMood('cheer');
        endRun('finished');
      } else {
        setIdx(idx + 1);
      }
    } else {
      setMood('fail');
      endRun('mistake', { item, given: input });
    }
  }

  // ---------- pick screen ----------
  if (!level) {
    return (
      <div className="stats warmup" ref={pickRef}>
        <header className="page-head" data-reveal>
          <h1>Warm-up</h1>
          <p className="page-lede wu-intro">
            Quick one-line drills to get the brain moving. Pick a track, type the answer, hit
            Enter, beat the clock. One mistake — or one expired timer — ends the run.
          </p>
        </header>
        <div className="wu-tracks" role="group" aria-label="Warm-up track" data-reveal>
          <button
            className={`chip ${track === 'python' ? 'active' : ''}`}
            onClick={() => setTrack('python')}
          >
            python
          </button>
          <button
            className={`chip ${track === 'pandas' ? 'active' : ''}`}
            onClick={() => setTrack('pandas')}
          >
            pandas
          </button>
          <button
            className={`chip ${track === 'sql' ? 'active' : ''}`}
            onClick={() => setTrack('sql')}
          >
            sql
          </button>
        </div>
        {/* Wide rows, not three matching columns: the level is the headline and
            your best run is the number on the right, so a glance answers both
            "which one?" and "how am I doing?" */}
        <div className="wu-levels">
          {WARMUP_LEVELS.filter((l) => l.track === track).map((l) => {
            const size = WARMUP_SETS[l.key].length;
            const best = progress.warmup?.[l.key]?.best ?? 0;
            const runs = progress.warmup?.[l.key]?.runs ?? 0;
            return (
              <button key={l.key} className="wu-level-card" onClick={() => start(l.key)} data-reveal>
                <span className="wu-level-main">
                  <span className="wu-level-name">{l.label}</span>
                  <span className="wu-level-blurb">{l.blurb}</span>
                  <span className="wu-level-meta">
                    {size} questions · {l.seconds}s each
                  </span>
                </span>
                <span className="wu-level-score">
                  {runs > 0 ? (
                    <>
                      <span className="wu-level-best-n">{best}</span>
                      <span className="wu-level-best-l">
                        best of {size} · {runs} run{runs === 1 ? '' : 's'}
                      </span>
                      <span className="wu-level-bar" aria-hidden="true">
                        <span className="wu-level-bar-fill" style={{ '--fill': best / size }} />
                      </span>
                    </>
                  ) : (
                    <span className="wu-level-fresh">not attempted yet</span>
                  )}
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

  // ---------- summary screen ----------
  if (result) {
    const total = queue.length;
    const got = correct.length;
    const avg = got ? correct.reduce((s, c) => s + c.ms, 0) / got : 0;
    const slowest = [...correct].sort((a, b) => b.ms - a.ms).slice(0, 3);
    const fastest = got ? correct.reduce((m, c) => (c.ms < m.ms ? c : m)) : null;
    const prevBest = progress.warmup?.[level]?.best ?? 0;
    const newBest = got > prevBest;

    return (
      <div className="stats warmup">
        <header className="page-head">
          <h1>
            {got}
            <span className="wu-score-of"> / {total}</span>
          </h1>
          <p className="page-lede">
            {levelDef.track === 'sql' ? 'SQL' : levelDef.track === 'pandas' ? 'pandas' : 'Python'} warm-up
            · {levelDef.label} · {levelDef.seconds}s per answer
          </p>
        </header>
        {result.reason === 'finished' && (
          <div className="solved-banner">Perfect run — all {total} answered. Fully warm.</div>
        )}
        {result.reason === 'mistake' && (
          <div className="wu-over">Run over — a mistake at question {got + 1} of {total}.</div>
        )}
        {result.reason === 'timeout' && (
          <div className="wu-over">
            Time&apos;s up at question {got + 1} of {total} — {levelDef.seconds}s per answer.
          </div>
        )}

        <div className="wu-stats">
          <div className="wu-stat">
            <strong>
              {got}/{total}
            </strong>
            <span>answered {newBest && got > 0 ? '· new best!' : `· best ${Math.max(prevBest, got)}`}</span>
          </div>
          <div className="wu-stat">
            <strong>{got ? `${(avg / 1000).toFixed(1)}s` : '—'}</strong>
            <span>average per answer</span>
          </div>
          <div className="wu-stat">
            <strong>{fastest ? `${(fastest.ms / 1000).toFixed(1)}s` : '—'}</strong>
            <span>fastest answer</span>
          </div>
        </div>

        <h3>What you did right</h3>
        <p className="wu-right">
          {got === 0 ? (
            <>Nothing landed this run — that&apos;s fine, that&apos;s what warm-ups are for. Read the fix below and go again.</>
          ) : (
            <>
              {got} correct answer{got === 1 ? '' : 's'} in a row without a safety net
              {avg > 0 && avg < 6000 && <> — and at {(avg / 1000).toFixed(1)}s each, that&apos;s a sharp pace</>}
              . {result.reason === 'finished' ? 'This level is warm — consider the next one.' : ''}
            </>
          )}
        </p>

        {(result.reason === 'mistake' || result.reason === 'timeout') && result.item && (
          <>
            <h3>Where you can improve</h3>
            <div className="wu-miss">
              <div className="wu-miss-prompt">{result.item.prompt}</div>
              {result.reason === 'mistake' && (
                <div className="wu-miss-row">
                  <span className="wu-miss-label">you typed</span>
                  <code className="wu-wrong">{result.given}</code>
                </div>
              )}
              <div className="wu-miss-row">
                <span className="wu-miss-label">answer</span>
                <code className="wu-good">{result.item.answer}</code>
              </div>
              {result.item.accept?.length > 0 && (
                <div className="wu-miss-row">
                  <span className="wu-miss-label">also fine</span>
                  <span>
                    {result.item.accept.map((a, i) => (
                      <code className="wu-alt" key={i}>
                        {a}
                      </code>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {slowest.length > 0 && slowest[0].ms > 4000 && (
          <>
            <h3>These took you longest — drill them</h3>
            <ul className="wu-slow">
              {slowest.map((c, i) => (
                <li key={i}>
                  <span className="wu-slow-time">{(c.ms / 1000).toFixed(1)}s</span>
                  {c.prompt} → <code>{c.answer}</code>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="wu-actions">
          <button className="btn btn-primary" onClick={() => start(level)}>
            Warm up again
          </button>
          <button className="btn" onClick={() => setLevel(null)}>
            Change level
          </button>
          <button className="btn" onClick={onExit}>
            Done — to the dojo
          </button>
        </div>
      </div>
    );
  }

  // ---------- run screen ----------
  // The same stage the lesson player uses: header, one thing to do dead centre,
  // one action bar. The countdown is the header's progress bar, so the clock
  // and "where am I in the fifty" live in the same strip instead of stacking
  // two more rows on top of the prompt.
  const pct = limitMs ? (timeLeft / limitMs) * 100 : 0;
  const secsLeft = Math.ceil(timeLeft / 1000);
  return (
    <div className="warmup stage">
      <header className="stage-top wu-runbar">
        <button className="icon-btn stage-exit" onClick={onExit} aria-label="Quit warm-up">
          ✕
        </button>
        <span className="stage-where">
          <span className="stage-kicker">Warm-up · {levelDef.label}</span>
          <h1 className="wu-run-count">
            {idx + 1} <span className="wu-run-of">of {queue.length}</span>
          </h1>
        </span>
        <span className={`wu-clock ${pct < 30 ? 'low' : ''}`} role="timer" aria-label={`${secsLeft} seconds left`}>
          {secsLeft}s
        </span>
        <span className="wu-run-streak" title="Answers in a row this run">
          <span className="wu-streak-n">{correct.length}</span>
          <span className="wu-streak-l">streak</span>
        </span>
      </header>
      <div
        className={`wu-timerbar ${pct < 30 ? 'low' : ''}`}
        aria-hidden="true"
      >
        <div className="wu-timer-fill" style={{ '--fill': pct / 100 }} />
      </div>
      <div className="stage-body">
        <div className="stage-step" key={idx}>
          <div className="stage-scroll">
            <div className="stage-inner wu-card">
              <div className="wu-prompt">{item?.prompt}</div>
              <input
                ref={inputRef}
                className="wu-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="type the Python…"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                aria-label="Your answer"
              />
            </div>
          </div>
          <div className="stage-foot">
            <div className="stage-foot-inner">
              <span className="stage-foot-note">
                Enter ↵ to submit — one wrong answer ends the run
              </span>
              <div className="stage-foot-actions">
                <button className="btn btn-primary" onClick={submit} disabled={!input.trim()}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
