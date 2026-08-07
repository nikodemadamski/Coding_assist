import { useFocusTrap } from './useFocusTrap.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isSolved, isDue, masteryLevel, todayStr } from '../state/progress.js';
import { pathStep, byPathOrder } from '../data/roadmap.js';
import { NODE_W, NODE_H, liveRouteFor } from '../data/roadmapGraph.js';
import { TRACK_GRAPHS } from '../data/trackGraphs.js';
import { useAnime, stagger } from '../anim/useAnime.js';
import { presets } from '../anim/presets.js';
import { useReveal } from '../anim/useReveal.js';

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

  // Fit the tree to the column, and remember how much slack is left over so
  // the map can be centred in it. Measured, not CSS: a max-width driven by the
  // scale would feed back into the width the scale is computed from.
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const el = fitRef.current;
    if (!el || !graph) return;
    const fit = () => {
      const w = el.clientWidth;
      const s = Math.min(w / graph.W, 1.2);
      setScale(s);
      setInset(Math.max(0, (w - graph.W * s) / 2));
    };
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

  const nodeById = useMemo(
    () => (graph ? Object.fromEntries(graph.nodes.map((n) => [n.key, n])) : {}),
    [graph]
  );
  const statOf = (key) => {
    const list = byPattern.get(key) || [];
    return { total: list.length, solved: list.filter((q) => isSolved(progress.solved[q.id])).length };
  };
  const labelOf = (key) => nodeById[key]?.label ?? key;

  // Where you actually are on this track: the first topic, in graph order,
  // that still has something unsolved in it. Without this the tree is a
  // diagram; with it, it is a map with a "you are here".
  const currentKey = useMemo(() => {
    if (!graph) return null;
    for (const n of graph.nodes) {
      const list = byPattern.get(n.key) || [];
      if (list.length && list.some((q) => !isSolved(progress.solved[q.id]))) return n.key;
    }
    return null;
  }, [graph, byPattern, progress]);
  const liveEdges = useMemo(
    () => (graph ? liveRouteFor(graph.edges, currentKey) : new Set()),
    [graph, currentKey]
  );

  // Totals for the head. A track page that doesn't say how far in you are is
  // asking you to count the bars yourself.
  const totals = useMemo(() => {
    let total = 0;
    let solved = 0;
    for (const list of byPattern.values()) {
      total += list.length;
      solved += list.filter((q) => isSolved(progress.solved[q.id])).length;
    }
    return { total, solved };
  }, [byPattern, progress]);

  // The same arrival choreography as the algorithm map: the edges draw
  // themselves from source to target, the topics pop in behind them, and the
  // live route keeps its travelling current once the draw-in lets go of the
  // dash values. useAnime snaps all of it to the finished state under
  // prefers-reduced-motion.
  const play = useAnime();
  const canvasRef = useRef(null);
  const revealRef = useReveal(`track-${trackKey}`);
  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    const paths = [...root.querySelectorAll('.graph-edges path[data-edge]')];
    for (const el of paths) {
      const len = el.getTotalLength?.() ?? 0;
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
    }
    play(paths, {
      strokeDashoffset: 0,
      duration: 700,
      ease: 'outQuad',
      delay: stagger(24, { start: 160 }),
      onComplete: () => {
        for (const el of paths) {
          if (!el.classList.contains('live')) continue;
          el.style.removeProperty('stroke-dasharray');
          el.style.removeProperty('stroke-dashoffset');
        }
      },
    });
    play(root.querySelectorAll('.graph-node'), presets.enter());
  }, [play, liveEdges]);

  if (!graph) return null;

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
    <div className={`stats roadmap-home track-map track-${trackKey}`} ref={revealRef}>
      <button className="btn track-back" onClick={onBack} data-reveal>
        ← Back to the map
      </button>
      <header className="page-head track-head" data-reveal>
        <h1>The {graph.label} track</h1>
        <p className="page-lede">
          A separate journey from the algorithm path — learn it top to bottom, and open a topic
          to see its questions.
        </p>
        <p className="track-count">
          <span className="track-count-n">
            {totals.solved}
            <span className="track-count-of">/{totals.total}</span>
          </span>
          <span className="track-count-l">solved</span>
          {currentKey && (
            <span className="track-here">
              You&apos;re on <strong>{labelOf(currentKey)}</strong>
            </span>
          )}
        </p>
      </header>

      {/* On a wide screen the tree is narrower than the page, so the fitted
          canvas is centred rather than left in a lake of empty space. */}
      <div className="graph-fit" ref={fitRef} style={{ height: graph.H * scale }}>
        <div
          className="graph-canvas"
          ref={canvasRef}
          style={{
            width: graph.W,
            height: graph.H,
            transform: `translateX(${inset}px) scale(${scale})`,
            transformOrigin: 'top left',
          }}
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
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {graph.edges.map((edge, i) => {
              const d = edgePath(edge);
              // The route down to the topic you're on carries a travelling
              // current, so the map points at you instead of being read.
              const live = liveEdges.has(`${edge[0]}>${edge[1]}`);
              return d ? (
                <path
                  key={i}
                  data-edge
                  className={live ? 'live' : ''}
                  d={d}
                  fill="none"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow)"
                />
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
                className={`graph-node ${done ? 'done' : ''} ${n.key === currentKey ? 'current' : ''}`}
                style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                onClick={() => setOpenKey(n.key)}
                title={`${labelOf(n.key)} — ${st.solved}/${st.total} solved`}
              >
                <span className="graph-node-label">{labelOf(n.key)}</span>
                <span className="graph-node-count">
                  {st.solved}/{st.total}
                </span>
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
