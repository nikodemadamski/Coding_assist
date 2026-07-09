import { useEffect, useMemo } from 'react';

// A short, satisfying payoff moment for belt promotions and streak milestones —
// the dopamine that makes a habit stick. Pure CSS confetti (no libraries, so it
// respects the app's strict offline stance and prefers-reduced-motion).

const CONFETTI_COLORS = ['#3dd68c', '#e8b04b', '#e5484d', '#4b9de8', '#7b83eb'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: Math.random() * 100,
        bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.6,
        size: 6 + Math.random() * 6,
        rounded: Math.random() > 0.5,
      })),
    []
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.bg,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.rounded ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Celebration({ celebration, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isBelt = celebration.type === 'belt';
  const belt = celebration.belt;

  return (
    <div className="modal-backdrop celebrate-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Confetti />
      <div className="celebration" role="dialog" aria-modal="true" aria-label="Milestone reached">
        {isBelt ? (
          <>
            <div className="celebrate-icon" aria-hidden="true">
              ⚔️
            </div>
            <div className="celebrate-belt-swatch" style={{ background: belt.color }} />
            <h2 className="celebrate-title">
              {belt.name} belt earned!
            </h2>
            <p className="celebrate-sub">
              {celebration.solvedCount} problems down.{' '}
              {belt.next
                ? `${belt.next.threshold - celebration.solvedCount} more to ${belt.next.name}.`
                : 'You have reached the highest rank — master.'}
            </p>
          </>
        ) : (
          <>
            <div className="celebrate-icon" aria-hidden="true">
              🔥
            </div>
            <h2 className="celebrate-title">{celebration.streak}-day streak!</h2>
            <p className="celebrate-sub">
              You&apos;ve shown up {celebration.streak} days running. Consistency is the whole game
              — keep the chain alive.
            </p>
          </>
        )}
        <button className="btn btn-primary" onClick={onClose}>
          Keep going 🥋
        </button>
      </div>
    </div>
  );
}
