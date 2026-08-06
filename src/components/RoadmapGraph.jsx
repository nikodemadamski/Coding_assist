import { useEffect, useMemo, useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import { useReveal } from '../anim/useReveal.js';
import { useAnime, stagger } from '../anim/useAnime.js';
import { presets } from '../anim/presets.js';
import { usePointerField } from '../anim/usePointerField.js';
import ReadinessRing from './ReadinessRing.jsx';
import CountUp from './CountUp.jsx';
import { loadUiPrefs } from '../state/uiPrefs.js';
import { greeting } from '../state/greeting.js';
import { ROADMAP, categoryKeyOf, byPathOrder, pathStep, nextOnPath } from '../data/roadmap.js';
import {
  currentStreak,
  isSolved,
  isDue,
  masteryLevel,
  practiceCounts,
  todayStr,
  weakSpots,
} from '../state/progress.js';
import { todaysMisses, todayPulse } from '../state/activity.js';
import { readiness } from '../state/readiness.js';
import {
  GRAPH_NODES,
  GRAPH_EDGES,
  GRAPH_W,
  GRAPH_H,
  NODE_W,
  NODE_H,
  liveRouteFor,
} from '../data/roadmapGraph.js';

const MASTERY_LABEL = { new: 'new', learning: 'learning', reviewing: 'reviewing', mastered: 'mastered' };

// The home page: a NeetCode-style visual roadmap. The whole map scales to fit
// the viewport width (no scroll box), each node shows its progress, and
// clicking a node opens a popup listing that topic's questions.
export default function RoadmapGraph({
  questions,
  progress,
  onOpenQuestion,
  onStartPractice,
  onWarmup,
  onMock,
  onDrill,
  onOpenTrack,
  onBrowse,
  onStats,
  onLearn,
  lessonInfo = null, // { done, total, due, nextTitle }
}) {
  const [openCat, setOpenCat] = useState(null);
  const catTrapRef = useRef(null);
  useFocusTrap(catTrapRef, { active: !!openCat });
  const [scale, setScale] = useState(1);
  const fitRef = useRef(null);
  const today = todayStr();

  // Fit the fixed-size canvas to whatever width we actually have.
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / GRAPH_W, 1.2));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const byCat = useMemo(() => {
    const m = new Map();
    for (const q of questions) {
      const key = categoryKeyOf(q.pattern);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(q);
    }
    for (const list of m.values()) list.sort(byPathOrder);
    return m;
  }, [questions]);

  const stats = useMemo(() => {
    const s = {};
    for (const [key, list] of byCat) {
      s[key] = {
        total: list.length,
        solved: list.filter((q) => isSolved(progress.solved[q.id])).length,
      };
    }
    return s;
  }, [byCat, progress]);

  const counts = useMemo(() => practiceCounts(progress, questions, today), [progress, questions, today]);
  const validIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);
  const missCount = useMemo(
    () => todaysMisses(progress).filter((id) => validIds.has(id)).length,
    [progress, validIds]
  );
  const solvedCount = useMemo(
    () => questions.filter((q) => isSolved(progress.solved[q.id])).length,
    [questions, progress]
  );
  const brandNew = solvedCount === 0;
  const nextUp = useMemo(
    () => nextOnPath(questions, (id) => isSolved(progress.solved[id])),
    [questions, progress]
  );
  const weak = useMemo(() => weakSpots(progress, questions), [progress, questions]);
  const pulse = useMemo(() => todayPulse(progress, questions), [progress, questions]);
  const ready = useMemo(() => readiness(progress, questions), [progress, questions]);

  const nodeById = Object.fromEntries(GRAPH_NODES.map((n) => [n.key, n]));
  const catDef = (key) => ROADMAP.find((c) => c.key === key);
  const label = (key) => catDef(key)?.label.replace(/^\d+ · /, '') ?? key;

  // Curved edge from the bottom-center of `a` to the top-center of `b`.
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

  // Esc closes the topic popup.
  useEffect(() => {
    if (!openCat) return;
    const onKey = (e) => e.key === 'Escape' && setOpenCat(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openCat]);

  const openList = openCat ? (byCat.get(openCat) ?? []) : [];
  const openStats = openCat ? (stats[openCat] ?? { total: 0, solved: 0 }) : null;

  const revealRef = useReveal('home');
  // The hero lights up under the cursor; the next-problem card also leans
  // toward it. Both are pure CSS-variable writes — see usePointerField.
  const heroFieldRef = usePointerField();
  const nextFieldRef = usePointerField(4);
  // Which topic you're standing in on the ALGORITHM map, and the route that
  // lights up to show it. Note this is not always the category of `nextUp`:
  // the path interleaves pandas and SQL questions, and when one of those is
  // next, the algorithm map would otherwise lose its "you are here" entirely.
  // The map answers "where am I on the map", so it walks to the next unsolved
  // question that actually lives on it.
  const mapKeys = useMemo(() => new Set(GRAPH_NODES.map((n) => n.key)), []);
  const nextOnMap = useMemo(
    () =>
      nextOnPath(
        questions.filter((q) => mapKeys.has(categoryKeyOf(q.pattern))),
        (id) => isSolved(progress.solved[id])
      ),
    [questions, progress, mapKeys]
  );
  const currentKey = nextOnMap ? categoryKeyOf(nextOnMap.pattern) : null;
  const liveEdges = useMemo(() => liveRouteFor(GRAPH_EDGES, currentKey), [currentKey]);

  // The map builds itself on arrival: every edge draws from its source to its
  // target (stroke-dashoffset, the classic SVG line-draw), and the topic nodes
  // pop in behind them on a stagger. It reads as the path being laid out for
  // you rather than a diagram that was always there. useAnime collapses both
  // to their finished state under prefers-reduced-motion.
  const play = useAnime();
  const canvasRef = useRef(null);
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
        // Once an edge has finished drawing, drop the inline dash values so the
        // `.live` rule can take over and run its travelling current. Leaving
        // them set would pin the dash pattern and kill the loop.
        for (const el of paths) {
          if (!el.classList.contains('live')) continue;
          el.style.removeProperty('stroke-dasharray');
          el.style.removeProperty('stroke-dashoffset');
        }
      },
    });
    play(root.querySelectorAll('.graph-node'), presets.enter());
  }, [play, liveEdges]);

  const name = useMemo(() => loadUiPrefs().name, []);
  const streak = currentStreak(progress.streak);
  const hello = greeting(new Date().getHours(), name, { streak, solvedToday: pulse.solves });
  const pctDone = Math.round((solvedCount / questions.length) * 100);
  // A node with no questions (e.g. 'other' before any import) is never drawn,
  // so it must not be counted in the header either.
  const shownNodes = useMemo(
    () => GRAPH_NODES.filter((n) => (stats[n.key]?.total ?? 0) > 0),
    [stats]
  );

  return (
    <div className="stats roadmap-home" ref={revealRef}>
      {/* ── the hero ────────────────────────────────────────────────────────
          One screenful that answers "what am I doing right now?" before you
          scroll. It greets you, names the next problem in display type, and
          puts one red button under it. Everything else on this page is
          smaller than this on purpose. */}
      <section className="hero" data-reveal ref={heroFieldRef}>
        <div className="hero-lead">
          <h1 className="hero-title">{hello}</h1>
          {/* One live status line under the greeting: what's waiting, then where
              you are. It reads as a sentence rather than a label. */}
          <p className="hero-line">
            {counts.due > 0 && (
              <span className="hero-due">
                <span className="hero-dot" aria-hidden="true" />
                {counts.due} review{counts.due === 1 ? '' : 's'} waiting
              </span>
            )}
            {brandNew ? (
              <>
                {questions.length} problems between here and interview-ready. The order is
                already decided — you just have to start.
              </>
            ) : (
              <>
                <strong>
                  <CountUp value={solvedCount} />
                </strong>{' '}
                solved · <strong>{questions.length - solvedCount}</strong> to go ·{' '}
                <strong>{ready.score}</strong>/100 ready
              </>
            )}
          </p>

          {/* The mission bar: the whole path in one line, filling as you go. */}
          <div className="hero-bar" role="img" aria-label={`${pctDone}% of the path solved`}>
            <span className="hero-bar-fill" style={{ '--fill': solvedCount / questions.length }} />
          </div>
        </div>

        {/* The one loud thing. */}
        {nextUp ? (
          <button className="hero-next" onClick={() => onOpenQuestion(nextUp.id)} ref={nextFieldRef}>
            <span className="hero-next-kicker">
              {solvedCount === 0 ? 'Start here' : 'Next problem'}
              {pathStep(nextUp.id) && <span className="step-num">{pathStep(nextUp.id)}</span>}
            </span>
            <span className="hero-next-title">{nextUp.title}</span>
            {nextUp.why && <span className="hero-next-why">{nextUp.why}</span>}
            <span className="hero-next-foot">
              <span className={`tag diff-${nextUp.difficulty}`}>{nextUp.difficulty}</span>
              <span className="hero-next-pattern">{nextUp.pattern}</span>
              <span className="hero-next-cue">
                Solve it
                <span className="cue-orb" aria-hidden="true">
                  →
                </span>
              </span>
            </span>
          </button>
        ) : (
          <div className="hero-next hero-next-done">
            <span className="hero-next-kicker">The whole path</span>
            <span className="hero-next-title">All {questions.length} solved.</span>
            <span className="hero-next-why">Keep the reviews clear and run mocks.</span>
          </div>
        )}

        {/* Everything else you might do, one row, deliberately quieter. */}
        <div className="hero-actions">
          <button
            className="hero-act hero-act-loud"
            onClick={onStartPractice}
            disabled={counts.due === 0 && counts.fresh === 0}
          >
            <span className="hero-act-n">{counts.due > 0 ? counts.due : '▶'}</span>
            <span className="hero-act-l">{counts.due > 0 ? 'clear reviews' : 'run the queue'}</span>
          </button>
          <button className="hero-act" onClick={onWarmup}>
            <span className="hero-act-n">⚡</span>
            <span className="hero-act-l">warm-up</span>
          </button>
          {!brandNew && (
            <button className="hero-act" onClick={onMock} title="Timed, no hints — simulate the real interview">
              <span className="hero-act-n">⏱</span>
              <span className="hero-act-l">mock interview</span>
            </button>
          )}
          {missCount > 0 && !brandNew && (
            <button className="hero-act hero-act-bad" onClick={onDrill}>
              <span className="hero-act-n">{missCount}</span>
              <span className="hero-act-l">drill misses</span>
            </button>
          )}
          {onStats && !brandNew && (
            <button className="hero-act hero-act-ring" onClick={onStats}>
              <ReadinessRing score={ready.score} size={40} />
              <span className="hero-act-l">readiness</span>
            </button>
          )}
        </div>
      </section>

      {/* Python is the support act: a quiet lane that shrinks to a chip once
          the curriculum is done, and never competes with Solve. */}
      {onLearn && lessonInfo && lessonInfo.total > 0 && (
        <div className="learn-lane" data-reveal>
          {lessonInfo.done < lessonInfo.total ? (
            <>
              <span className="learn-lane-text">
                <span className="learn-lane-label">Rusty on the Python itself?</span>
                <span className="learn-lane-sub">
                  {lessonInfo.done === 0
                    ? `${lessonInfo.total} short lessons, from zero`
                    : `${lessonInfo.done}/${lessonInfo.total} lessons · next: ${lessonInfo.nextTitle}`}
                </span>
              </span>
              <span className="learn-lane-bar" aria-hidden="true">
                <span
                  className="learn-lane-fill"
                  style={{ '--fill': lessonInfo.done / lessonInfo.total }}
                />
              </span>
              {lessonInfo.due > 0 && (
                <button className="btn btn-warmup" onClick={onLearn}>
                  {lessonInfo.due} skill check{lessonInfo.due === 1 ? '' : 's'} due
                </button>
              )}
              <button className="btn btn-jade" onClick={onLearn}>
                {lessonInfo.done === 0 ? 'Start from zero' : 'Continue'} →
              </button>
            </>
          ) : (
            <button className="learn-done-chip" onClick={onLearn}>
              Python basics ✓ — {lessonInfo.total}/{lessonInfo.total} lessons
            </button>
          )}
        </div>
      )}

      {/* The questions that keep biting — one tap from the front door */}
      {weak.length > 0 && (
        <div className="weak-row" data-reveal>
          <span className="weak-label">Keeps biting</span>
          {weak.map(({ q, mistakes }) => (
            <button
              className="weak-chip"
              key={q.id}
              onClick={() => onOpenQuestion(q.id)}
              title={`${mistakes} wrong submits so far — reopen it and make it stick`}
            >
              {q.title} <span className="weak-n">✗{mistakes}</span>
            </button>
          ))}
        </div>
      )}

      <div className="map-head">
        <h2>
          The path — {shownNodes.length} topics, in order
          <span className="map-head-count">
            {solvedCount}/{questions.length} solved
          </span>
        </h2>
        <p className="map-hint">
          Top to bottom — an arrow means &ldquo;learn this pattern first.&rdquo; Click a topic to
          open its questions.
        </p>
      </div>

      <div className="graph-fit" ref={fitRef} style={{ height: GRAPH_H * scale }}>
        <div
          className="graph-canvas"
          ref={canvasRef}
          style={{
            width: GRAPH_W,
            height: GRAPH_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
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
              // The route down to the topic you're on carries a slow travelling
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
          {GRAPH_NODES.map((n) => {
            const st = stats[n.key] || { total: 0, solved: 0 };
            if (st.total === 0) return null; // e.g. 'other' before any imports
            const pct = st.total ? (st.solved / st.total) * 100 : 0;
            const done = st.total > 0 && st.solved === st.total;
            // "You are here": the topic your next step belongs to, so the map
            // answers "where am I?" at a glance instead of only "how much left".
            const current = !done && currentKey === n.key;
            const started = !done && !current && st.solved > 0;
            return (
              <button
                key={n.key}
                className={`graph-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${started ? 'started' : ''}`}
                style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                onClick={() => setOpenCat(n.key)}
                title={`${label(n.key)} — ${st.solved}/${st.total} solved`}
              >
                <span className="graph-node-label">{label(n.key)}</span>
                <span className="graph-node-bar">
                  <span className="graph-node-fill" style={{ '--fill': pct / 100 }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data tracks — separate entities, not woven into the algorithm map */}
      <div className="data-tracks">
        <span className="data-tracks-label">Data tracks — their own map, off the algorithm path</span>
        <div className="data-tracks-row">
          {[
            { key: 'pandas', name: 'pandas' },
            { key: 'sql', name: 'SQL' },
          ].map((t) => {
            const st = stats[t.key] || { total: 0, solved: 0 };
            if (st.total === 0) return null;
            return (
              <button
                key={t.key}
                className="data-track-card"
                onClick={() => (onOpenTrack ? onOpenTrack(t.key) : onBrowse(t.key))}
              >
                <span className="data-track-name">{t.name}</span>
                <span className="data-track-count">
                  {st.solved}/{st.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic popup: the category's questions, click any to open it */}
      {openCat && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setOpenCat(null)}
        >
          <div className="modal cat-modal" role="dialog" aria-modal="true" aria-label={`${label(openCat)} questions`} ref={catTrapRef}>
            <div className="cat-modal-head">
              <div>
                <h2>{label(openCat)}</h2>
                <p className="cat-modal-blurb">{catDef(openCat)?.blurb}</p>
              </div>
              <span className="cat-modal-count">
                {openStats.solved}/{openStats.total} solved
              </span>
              <button className="icon-btn" onClick={() => setOpenCat(null)} aria-label="Close">
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
                      {isSolved(progress.solved[q.id]) && (
                        <span style={{ color: 'var(--jade)' }}>✓ </span>
                      )}
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
              <button className="btn" onClick={() => onBrowse(openCat)}>
                Open in the full list →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
