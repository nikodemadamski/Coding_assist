import { useState } from 'react';
import Markdown from './Markdown.jsx';

// Shows a question's solutions the way you'd actually learn them: the
// brute-force / first-instinct version first, then progressively better ones,
// ending at the optimal. Falls back to the single reference solution when a
// question has no multi-approach breakdown yet.
export default function Approaches({ question }) {
  const list = question.approaches;
  const [active, setActive] = useState(0);

  if (!list || list.length === 0) {
    return <pre className="solution-pre">{question.solution}</pre>;
  }

  const a = list[active];
  return (
    <div className="approaches">
      <div className="approach-tabs" role="tablist">
        {list.map((ap, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            className={`approach-tab ${active === i ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            {ap.name}
          </button>
        ))}
      </div>
      <div className="approach-meta">
        <span className="approach-complexity">{a.complexity}</span>
        {active === 0 && list.length > 1 && (
          <span className="approach-hint-note">start here — how you&apos;d first think of it</span>
        )}
        {active === list.length - 1 && list.length > 1 && (
          <span className="approach-hint-note optimal">the interview answer</span>
        )}
      </div>
      {a.note && (
        <div className="approach-note">
          <Markdown text={a.note} />
        </div>
      )}
      <pre className="solution-pre">{a.code}</pre>
    </div>
  );
}
