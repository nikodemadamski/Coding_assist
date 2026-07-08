import { useMemo } from 'react';
import { ROADMAP, categoryKeyOf } from '../data/roadmap.js';
import { isSolved } from '../state/progress.js';
import {
  GRAPH_NODES,
  GRAPH_EDGES,
  GRAPH_W,
  GRAPH_H,
  NODE_W,
  NODE_H,
} from '../data/roadmapGraph.js';

// The NeetCode-style visual roadmap: category nodes with progress bars,
// connected by "learn this first" arrows. Clicking a node jumps to that
// section of the Browse list.
export default function RoadmapGraph({ questions, progress, onSelect }) {
  const stats = useMemo(() => {
    const s = {};
    for (const q of questions) {
      const key = categoryKeyOf(q.pattern);
      s[key] = s[key] || { total: 0, solved: 0 };
      s[key].total++;
      if (isSolved(progress.solved[q.id])) s[key].solved++;
    }
    return s;
  }, [questions, progress]);

  const byKey = Object.fromEntries(GRAPH_NODES.map((n) => [n.key, n]));
  const label = (key) => ROADMAP.find((c) => c.key === key)?.label.replace(/^\d+ · /, '') ?? key;

  // Curved edge from the bottom-center of `a` to the top-center of `b`.
  const edgePath = ([from, to]) => {
    const a = byKey[from];
    const b = byKey[to];
    if (!a || !b) return null;
    const x1 = a.x + NODE_W / 2;
    const y1 = a.y + NODE_H;
    const x2 = b.x + NODE_W / 2;
    const y2 = b.y - 6;
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  return (
    <div className="stats">
      <h1>The roadmap</h1>
      <p style={{ color: 'var(--text-dim)', margin: '6px 0 14px' }}>
        Learn top to bottom — each arrow means &ldquo;this pattern builds on that one.&rdquo;
        Click a topic to browse its questions.
      </p>
      <div className="graph-scroll">
        <div className="graph-canvas" style={{ width: GRAPH_W, height: GRAPH_H }}>
          <svg
            className="graph-edges"
            width={GRAPH_W}
            height={GRAPH_H}
            viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e9e7de" />
              </marker>
            </defs>
            {GRAPH_EDGES.map((edge, i) => {
              const d = edgePath(edge);
              return d ? (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#e9e7de"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow)"
                  opacity="0.85"
                />
              ) : null;
            })}
          </svg>
          {GRAPH_NODES.map((n) => {
            const st = stats[n.key] || { total: 0, solved: 0 };
            if (st.total === 0) return null; // e.g. 'other' before any imports
            const pct = st.total ? (st.solved / st.total) * 100 : 0;
            const done = st.total > 0 && st.solved === st.total;
            return (
              <button
                key={n.key}
                className={`graph-node ${done ? 'done' : ''}`}
                style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                onClick={() => onSelect(n.key)}
                title={`${label(n.key)} — ${st.solved}/${st.total} solved`}
              >
                <span className="graph-node-label">{label(n.key)}</span>
                <span className="graph-node-bar">
                  <span className="graph-node-fill" style={{ width: `${pct}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
