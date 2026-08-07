import { useFocusTrap } from './useFocusTrap.js';
import { useEffect, useRef } from 'react';

// The keyboard map for the solve loop, and the sheet that teaches it.
//
// A trainer you use every day should be drivable without the mouse, and the
// shortcuts that exist are worthless if nothing ever tells you they do. `?`
// opens this from anywhere in the problem view; the toolbar carries the same
// hint so you find it without being told.
//
// One source of truth: ProblemView binds exactly these keys, and this sheet
// lists exactly what ProblemView binds, so the two cannot drift.
export const PV_SHORTCUTS = [
  { keys: ['Ctrl', '↵'], label: 'Run the tests', group: 'Solve' },
  { keys: ['Ctrl', '⇧', '↵'], label: 'Submit', group: 'Solve' },
  { keys: ['Esc'], label: 'Leave the editor (then the keys below work)', group: 'Solve' },
  { keys: ['['], label: 'Previous question on the path', group: 'Move' },
  { keys: [']'], label: 'Next question on the path', group: 'Move' },
  { keys: ['⌘', 'K'], label: 'Search every question', group: 'Move' },
  { keys: ['f'], label: 'Focus mode — hide everything but the code', group: 'View' },
  { keys: ['v'], label: 'Visualize your code step by step', group: 'View' },
  { keys: ['t'], label: 'Switch the console between Testcase and Result', group: 'View' },
  { keys: ['?'], label: 'This list', group: 'View' },
];

const GROUPS = ['Solve', 'Move', 'View'];

export default function ShortcutSheet({ onClose }) {
  const trapRef = useRef(null);
  useFocusTrap(trapRef, { active: true });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal shortcut-sheet" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" ref={trapRef}>
        <div className="shortcut-head">
          <h2>Keyboard</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="shortcut-groups">
          {GROUPS.map((g) => (
            <section className="shortcut-group" key={g}>
              <h3>{g}</h3>
              <ul>
                {PV_SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <li key={s.label}>
                    <span className="shortcut-keys">
                      {s.keys.map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </span>
                    <span className="shortcut-label">{s.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="shortcut-foot">
          Single-letter keys only fire when the editor doesn&apos;t have focus — press Esc first,
          so typing <kbd>f</kbd> in your code never moves the furniture.
        </p>
      </div>
    </div>
  );
}
