import { useMemo, useState } from 'react';
import { useReveal } from '../anim/useReveal.js';
import { PATTERN_GUIDE } from '../data/patternGuide.js';
import { categoryKeyOf } from '../data/roadmap.js';
import { isSolved } from '../state/progress.js';
import { overallAccuracy, patternAccuracy, weakPatterns } from '../state/patternQuiz.js';

// The "templates you must know" reference. One card per algorithm pattern:
// when to reach for it, the recognition cues, the reusable code skeleton, its
// complexity, and the problems in your bank that drill it.
export default function Patterns({ questions, progress, onOpenQuestion, onQuiz, focusKey }) {
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

  // Algorithm cards link problems via their roadmap category; data-track
  // cards list the raw question patterns they teach.
  const probsOf = (p) =>
    p.patterns ? questions.filter((q) => p.patterns.includes(q.pattern)) : byPattern.get(p.key) || [];

  const sections = [
    { label: 'Algorithms', cards: PATTERN_GUIDE.filter((p) => !p.track) },
    { label: 'pandas', cards: PATTERN_GUIDE.filter((p) => p.track === 'pandas') },
    { label: 'SQL', cards: PATTERN_GUIDE.filter((p) => p.track === 'sql') },
  ];

  const revealRef = useReveal('patterns');
  // Your own recognition record, from the drill. It turns this page from a
  // reference you skim into a scorecard that tells you which cards to reread.
  const overall = overallAccuracy(progress);
  const weak = weakPatterns(progress, 1)[0];

  return (
    <div className="stats patterns" ref={revealRef}>
      <header className="page-head patterns-head" data-reveal>
        <h1>The templates you must know</h1>
        <p className="page-lede patterns-intro">
          Interviews are pattern recognition under pressure. Learn to spot which of these a
          problem is, and the code skeleton comes almost for free. Skim them, then drill the
          linked problems until the shape is automatic.
        </p>
        {onQuiz && (
          <button className="btn btn-primary patterns-quiz-btn" onClick={onQuiz}>
            {overall ? 'Drill it again — name the pattern' : 'Quiz me — name the pattern'}
            <span className="cue-orb" aria-hidden="true">
              →
            </span>
          </button>
        )}
        {overall && (
          <p className="patterns-record">
            You name <strong>{overall.pct}%</strong> of them right over {overall.seen} calls
            {weak && (
              <>
                {' — weakest is '}
                <button className="patterns-record-weak" onClick={() => setOpen(weak.key)}>
                  {weak.name}
                </button>{' '}
                at {weak.pct}%
              </>
            )}
            .
          </p>
        )}
      </header>

      {sections.map((section) => (
      <div className="pattern-section" key={section.label} data-reveal>
        <h2 className="pattern-section-head">{section.label}</h2>
      <div className="pattern-cards">
        {section.cards.map((p) => {
          const probs = probsOf(p);
          const solved = probs.filter((q) => isSolved(progress.solved[q.id])).length;
          const isOpen = open === p.key;
          // Shown only once you've been asked enough times to mean it — a
          // percentage off one answer is a coin toss dressed as a fact.
          const recog = patternAccuracy(progress, p.key);
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
                  {recog && (
                    <span
                      className={`pattern-card-recog ${recog.pct >= 80 ? 'sharp' : recog.pct < 60 ? 'shaky' : ''}`}
                      title={`You named this correctly ${recog.right} of ${recog.seen} times in the drill`}
                    >
                      {recog.pct}%
                    </span>
                  )}
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
      ))}
    </div>
  );
}
