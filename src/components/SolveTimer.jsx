import { useEffect, useState } from 'react';
import { PACE_TARGETS_MS } from '../state/readiness.js';
import { formatDuration } from '../state/mockSession.js';

// Elapsed time on this problem, against the pace a strong candidate would hold
// in a real interview (15 / 25 / 40 minutes by difficulty — the same targets
// the readiness score grades you on).
//
// The app has always *recorded* first-solve time and scored pace with it, but
// while you were actually solving there was no clock anywhere on screen. You
// cannot pace yourself against a number you can't see. This is that number.
//
// It freezes the moment you solve, so the banner and the clock agree.
export default function SolveTimer({ startedAt, difficulty, frozenMs = null }) {
  const [now, setNow] = useState(() => Date.now());
  const frozen = frozenMs != null;

  useEffect(() => {
    if (frozen) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [frozen]);

  const ms = frozen ? frozenMs : Math.max(0, now - startedAt);
  const target = PACE_TARGETS_MS[difficulty] ?? PACE_TARGETS_MS.medium;
  const ratio = Math.min(1, ms / target);
  const tone = ms > target ? 'over' : ratio > 0.8 ? 'close' : '';

  return (
    <span
      className={`solve-timer ${tone} ${frozen ? 'frozen' : ''}`}
      title={`Elapsed time · the ${difficulty} target is ${formatDuration(target)}`}
    >
      <span className="solve-timer-now">{formatDuration(ms)}</span>
      <span className="solve-timer-target">/ {formatDuration(target)}</span>
      <span className="solve-timer-track" aria-hidden="true">
        <span className="solve-timer-fill" style={{ '--fill': ratio }} />
      </span>
    </span>
  );
}
