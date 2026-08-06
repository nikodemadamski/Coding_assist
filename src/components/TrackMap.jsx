import { useFocusTrap } from './useFocusTrap.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isSolved, isDue, masteryLevel, todayStr } from '../state/progress.js';
import { pathStep, byPathOrder } from '../data/roadmap.js';
import { NODE_W, NODE_H } from '../data/roadmapGraph.js';
import { TRACK_GRAPHS } from '../data/trackGraphs.js';

const MASTERY_LABEL = { new: 'new', learning: 'learning', reviewing: 'reviewing', mastered: 'mastered' };

// A dedicated map tree for a data track (pandas or SQL). Same look as the
// algorithm map — scaled-to-fit nodes with progress bars, click a sub-topic to
// see its questions — but keyed by the question's `pattern`.
export default function TrackMap({ trackKey, questions, progress, onOpenQuestion, onBrowse, onBack }) {
  const graph = TRACK_GRAPHS[trackKey];
  const [openKey, setOpenKey] = useState(null);
  const catTrapRef = useRef(null);
  useFocusTrap(catTrapRef, { active: !!openKey });
  const [scale, setScale] = useState(1);
  const fitRef = useRef(null);
  const today = todayStr();

  useEffect(() => {
    const el = fitRef.current;
    if (!el || !graph) return;
    const fit = () => setScale(Math.min(el.clientWidth / graph.W, 1.2));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [graph]);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e) => e.key === 'Escape' && setOpenKey(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openKey]);

  const byPattern = useMemo(() => {
    const m = new Map();
    for (const q of questions) {
      if (q.track !== trackKey) continue;
      if (!m.has(q.pattern)) m.set(q.pattern, []);
      m.get(q.pattern).push(q);
    }
    for (const list of m.values()) list.sort(byPathOrder);
    return m;
  }, [questions, trackKey]);

  if (!graph) return null;

  const nodeById = Object.fromEntries(graph.nodes.map((n) => [n.key, n]));
  const statOf = (key) => {
    const list = byPattern.get(key) || [];
    return { total: list.length, solved: list.filter((q) => isSolved(progress.solved[q.id])).length };
  };
  const labelOf = (key) => nodeById[key]?.label ?? key;

  const edgePath = ([from, to]) => {
    const a = nodeById[from];
    const b = nodeById[to];
    if (!a || !b) return null;
    const x1 = a.x + NODE_W / 2;
    const y1 = a.y + NODE_H;
    const x2 = b.x + NODE_W / 2;
    const y2 = b.y - 6;
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  const openList = openKey ? (byPattern.get(openKey) ?? []) : [];
  const openStat = openKey ? statOf(openKey) : { total: 0, solved: 0 };

  return (
    <div className="stats roadmap-home">
      <div className="track-map-head">
        <button className="btn" onClick={onBack}>
          ← Back to the map
        </button>
        <h1>
          {graph.label} track
        </h1>
      </div>
      <p className="map-hint">
        A separate journey from the algorithm path — learn top to bottom, click a topic to open
        its questions.
      </p>

      <div className="graph-fit" ref={fitRef} style={{ height: graph.H * scale }}>
        <div
          className="graph-canvas"
          style={{ width: graph.W, height: graph.H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <svg
            className="graph-edges"
            width={graph.W}
            height={graph.H}
            viewBox={`0 0 ${graph.W} ${graph.H}`}
            aria-hidden="true"
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e9e7de" />
              </marker>
            </defs>
            {graph.edges.map((edge, i) => {
              const d = edgePath(edge);
              return d ? (
                <path key={i} d={d} fill="none" stroke="#e9e7de" strokeWidth="2.5" markerEnd="url(#arrow)" opacity="0.85" />
              ) : null;
            })}
          </svg>
          {graph.nodes.map((n) => {
            const st = statOf(n.key);
            if (st.total === 0) return null;
            const pct = st.total ? (st.solved / st.total) * 100 : 0;
            const done = st.solved === st.total;
            return (
              <button
                key={n.key}
                className={`graph-node ${done ? 'done' : ''}`}
                style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                onClick={() => setOpenKey(n.key)}
                title={`${labelOf(n.key)} — ${st.solved}/${st.total} solved`}
              >
                <span className="graph-node-label">{labelOf(n.key)}</span>
                <span className="graph-node-bar">
                  <span className="graph-node-fill" style={{ '--fill': pct / 100 }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {openKey && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpenKey(null)}>
          <div className="modal cat-modal" role="dialog" aria-modal="true" aria-label={`${labelOf(openKey)} questions`} ref={catTrapRef}>
            <div className="cat-modal-head">
              <div>
                <h2>{labelOf(openKey)}</h2>
              </div>
              <span className="cat-modal-count">
                {openStat.solved}/{openStat.total} solved
              </span>
              <button className="icon-btn" onClick={() => setOpenKey(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="cat-modal-list">
              {openList.map((q) => {
                const level = masteryLevel(progress, q.id);
                const step = pathStep(q.id);
                return (
                  <button key={q.id} className="cat-q" onClick={() => onOpenQuestion(q.id)}>
                    <span className={`mastery-dot dot-${level}`} aria-hidden="true" />
                    {step && <span className="step-num">{step}</span>}
                    <span className="cat-q-title">
                      {isSolved(progress.solved[q.id]) && <span style={{ color: 'var(--jade)' }}>✓ </span>}
                      {q.title}
                    </span>
                    <span className="q-meta">
                      {isDue(progress.srs[q.id], today) && <span className="tag due-tag">due</span>}
                      <span className={`tag diff-${q.difficulty}`}>{q.difficulty}</span>
                      <span className={`pill pill-${level}`}>{MASTERY_LABEL[level]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="cat-modal-foot">
              <button className="btn" onClick={() => onBrowse(trackKey)}>
                Open in the full list →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
