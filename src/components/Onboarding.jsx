import { useFocusTrap } from './useFocusTrap.js';
import { useEffect, useRef, useState } from 'react';

// First-run orientation. A brand-new user lands on a map full of buttons and
// asks "where do I begin?" — this answers that in four short cards, then gets
// out of the way. Shown once (a flag in localStorage), skippable anytime.

const STEPS = [
  {
    icon: '🗺',
    title: 'This map is your whole journey',
    body: 'Every topic you need, top to bottom. Arrows mean "learn this pattern before that one." New to Python itself? Start with Learn (from the Library menu) — the language first, then this map is your playground.',
  },
  {
    icon: '🎯',
    title: 'Just follow "Your next step"',
    body: 'The green card at the top always names the single next question to do — and why it\'s worth doing. Press it, solve, come back tomorrow. That\'s the whole routine.',
  },
  {
    icon: '🧗',
    title: "Stuck? You never leave",
    body: 'Every problem has a ladder: which pattern is this → a nudge → the plan → the code. Climb one rung at a time. And ▶ Visualize replays the solution line by line, in plain English.',
  },
  {
    icon: '🥋',
    title: 'When you\'re ready to be tested',
    body: 'A 🎤 Mock interview times you with no hints; ⚡ Warm-up sharpens your syntax; 🧩 Patterns is your template cheat-sheet. But for now — just press Begin the path.',
  },
];

export default function Onboarding({ onDone }) {
  const trapRef = useRef(null);
  useFocusTrap(trapRef);
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onDone();
      else if (e.key === 'ArrowRight' && !last) setI((n) => n + 1);
      else if (e.key === 'ArrowLeft' && i > 0) setI((n) => n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, last, onDone]);

  return (
    <div className="modal-backdrop onboard-backdrop">
      <div className="onboard" role="dialog" aria-modal="true" aria-label="Welcome to the dojo" ref={trapRef}>
        <button className="onboard-skip" onClick={onDone}>
          Skip
        </button>
        <div className="onboard-icon" aria-hidden="true">
          {step.icon}
        </div>
        <h2 className="onboard-title">{step.title}</h2>
        <p className="onboard-body">{step.body}</p>

        <div className="onboard-dots" aria-hidden="true">
          {STEPS.map((_, n) => (
            <span key={n} className={`onboard-dot ${n === i ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboard-actions">
          {i > 0 && (
            <button className="btn" onClick={() => setI(i - 1)}>
              ← Back
            </button>
          )}
          {last ? (
            <button className="btn btn-primary" onClick={onDone}>
              Let&apos;s go 🥋
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setI(i + 1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
