import { useCallback, useEffect, useRef, useState } from 'react';
import { WARMUP_LEVELS, WARMUP_SETS, checkAnswer } from '../data/warmups.js';

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

  const levelDef = WARMUP_LEVELS.find((l) => l.key === level);
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
    if (checkAnswer(item, input)) {
      const ms = Date.now() - qStartRef.current;
      setCorrect((c) => [...c, { prompt: item.prompt, answer: item.answer, ms }]);
      setInput('');
      if (idx + 1 >= queue.length) {
        endRun('finished');
      } else {
        setIdx(idx + 1);
      }
    } else {
      endRun('mistake', { item, given: input });
    }
  }

  // ---------- pick screen ----------
  if (!level) {
    return (
      <div className="stats warmup">
        <h1>⚡ Warm-up</h1>
        <p className="wu-intro">
          Like stretching before the gym: quick one-line Python drills to get the brain juices
          flowing. Type the answer, hit Enter, beat the clock. One mistake — or one expired
          timer — ends the run. How far down the 50 can you get?
        </p>
        <div className="wu-tracks" role="group" aria-label="Warm-up track">
          <span className="chip active">python</span>
          <span className="chip disabled" title="Coming soon">
            pandas · soon
          </span>
          <span className="chip disabled" title="Coming soon">
            sql · soon
          </span>
        </div>
        <div className="wu-levels">
          {WARMUP_LEVELS.map((l) => {
            const best = progress.warmup?.[l.key]?.best ?? 0;
            const runs = progress.warmup?.[l.key]?.runs ?? 0;
            return (
              <button key={l.key} className="wu-level-card" onClick={() => start(l.key)}>
                <span className="wu-level-name">{l.label}</span>
                <span className="wu-level-blurb">{l.blurb}</span>
                <span className="wu-level-meta">
                  {WARMUP_SETS[l.key].length} questions · {l.seconds}s each
                </span>
                <span className="wu-level-best">
                  {runs > 0 ? (
                    <>
                      best <strong>{best}/{WARMUP_SETS[l.key].length}</strong> · {runs} run
                      {runs === 1 ? '' : 's'}
                    </>
                  ) : (
                    'not attempted yet'
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button className="btn" onClick={onExit}>
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
        <h1>⚡ Warm-up — {levelDef.label}</h1>
        {result.reason === 'finished' && (
          <div className="solved-banner">🏆 Perfect run — all {total} answered. Fully warm.</div>
        )}
        {result.reason === 'mistake' && (
          <div className="wu-over">✋ Run over — a mistake at question {got + 1} of {total}.</div>
        )}
        {result.reason === 'timeout' && (
          <div className="wu-over">
            ⏱ Time&apos;s up at question {got + 1} of {total} — {levelDef.seconds}s per answer.
          </div>
        )}

        <div className="wu-stats">
          <div className="wu-stat">
            <strong>
              {got}/{total}
            </strong>
            <span>answered {newBest && got > 0 ? '· 🎉 new best!' : `· best ${Math.max(prevBest, got)}`}</span>
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
            ⚡ Warm up again
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
  const pct = limitMs ? (timeLeft / limitMs) * 100 : 0;
  return (
    <div className="stats warmup">
      <div className="wu-runbar">
        <button className="icon-btn" onClick={onExit} aria-label="Quit warm-up">
          ✕
        </button>
        <span className="wu-run-level">{levelDef.label}</span>
        <span className="wu-run-count">
          {idx + 1} / {queue.length}
        </span>
        <span className="wu-run-streak">🔥 {correct.length}</span>
      </div>
      <div
        className={`wu-timerbar ${pct < 30 ? 'low' : ''}`}
        role="timer"
        aria-label={`${Math.ceil(timeLeft / 1000)} seconds left`}
      >
        <div className="wu-timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="wu-card" key={idx}>
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
        <div className="wu-hint-row">
          <span>Enter ↵ to submit — one wrong answer ends the run</span>
          <button className="btn" onClick={submit} disabled={!input.trim()}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
