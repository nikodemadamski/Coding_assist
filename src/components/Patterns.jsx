import { useMemo, useState } from 'react';
import { PATTERN_GUIDE } from '../data/patternGuide.js';
import { categoryKeyOf } from '../data/roadmap.js';
import { isSolved } from '../state/progress.js';

// The "templates you must know" reference. One card per algorithm pattern:
// when to reach for it, the recognition cues, the reusable code skeleton, its
// complexity, and the problems in your bank that drill it.
export default function Patterns({ questions, progress, onOpenQuestion, focusKey }) {
  const [open, setOpen] = useState(focusKey || null);

  const byPattern = useMemo(() => {
    const m = new Map();
    for (const q of questions) {
      const key = categoryKeyOf(q.pattern);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(q);
    }
    return m;
  }, [questions]);

  return (
    <div className="stats patterns">
      <h1>🧩 Patterns — the templates you must know</h1>
      <p className="patterns-intro">
        Interviews are pattern recognition under pressure. Learn to spot which of these a problem
        is, and the code skeleton comes almost for free. Skim them, then drill the linked problems
        until the shape is automatic.
      </p>

      <div className="pattern-cards">
        {PATTERN_GUIDE.map((p) => {
          const probs = byPattern.get(p.key) || [];
          const solved = probs.filter((q) => isSolved(progress.solved[q.id])).length;
          const isOpen = open === p.key;
          return (
            <div className={`pattern-card ${isOpen ? 'open' : ''}`} key={p.key}>
              <button
                className="pattern-card-head"
                onClick={() => setOpen(isOpen ? null : p.key)}
                aria-expanded={isOpen}
              >
                <span className="pattern-card-name">{p.name}</span>
                <span className="pattern-card-when">{p.when}</span>
                <span className="pattern-card-meta">
                  {probs.length > 0 && (
                    <span className="pattern-card-count">
                      {solved}/{probs.length}
                    </span>
                  )}
                  <span className="pattern-card-toggle">{isOpen ? '−' : '+'}</span>
                </span>
              </button>

              {isOpen && (
                <div className="pattern-card-body">
                  <div className="pattern-cues">
                    <span className="pattern-cues-label">Recognise it</span>
                    {p.cues.map((c, i) => (
                      <span className="pattern-cue" key={i}>
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="pattern-template-head">
                    <span>Template</span>
                    <span className="pattern-complexity">{p.complexity}</span>
                  </div>
                  <pre className="pattern-template">{p.template}</pre>

                  {probs.length > 0 && (
                    <div className="pattern-drill">
                      <span className="pattern-drill-label">Drill it</span>
                      <div className="pattern-drill-list">
                        {probs.slice(0, 8).map((q) => (
                          <button
                            key={q.id}
                            className="pattern-drill-q"
                            onClick={() => onOpenQuestion(q.id)}
                          >
                            {isSolved(progress.solved[q.id]) && (
                              <span style={{ color: 'var(--jade)' }}>✓ </span>
                            )}
                            {q.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
