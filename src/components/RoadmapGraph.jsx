import { useEffect, useMemo, useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import { ROADMAP, categoryKeyOf, byPathOrder, pathStep, nextOnPath } from '../data/roadmap.js';
import {
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
} from '../data/roadmapGraph.js';

const MASTERY_LABEL = { new: 'new', learning: 'learning', reviewing: 'reviewing', mastered: 'mastered' };

// The Learn Python entry on the home page — progress, a continue link, and the
// due skill-check count. Structural sibling of the data-track row.
function LearnStrip({ info, onLearn }) {
  return (
    <div className="learn-strip">
      <span className="learn-strip-line">
        <strong>Learn Python from zero</strong>
        <span className="learn-strip-count">
          {info.done}/{info.total}
        </span>
      </span>
      <button className="btn btn-jade" onClick={onLearn}>
        {info.done === 0 ? 'Start from zero' : `Continue: ${info.nextTitle}`} →
      </button>
      {info.due > 0 && (
        <button className="btn btn-warmup" onClick={onLearn}>
          {info.due} skill check{info.due === 1 ? '' : 's'} due
        </button>
      )}
    </div>
  );
}

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

  return (
    <div className="stats roadmap-home">
      {brandNew && (
        <section className="welcome-card">
          <h2>Welcome to the dojo</h2>
          <p>
            This map is your whole journey — <strong>{questions.length} questions</strong> from
            &ldquo;I barely know Python&rdquo; to interview-ready. Learn top to bottom: each
            arrow means &ldquo;this pattern builds on that one.&rdquo; Click any topic to see
            its questions, or just press <strong>Begin the path</strong> and let the dojo pick
            for you.
          </p>
          {onLearn && (
            <p className="welcome-learn">
              New to Python itself?{' '}
              <button className="link-inline" onClick={onLearn}>
                Start from zero →
              </button>
            </p>
          )}
        </section>
      )}

      <div className="home-top">
      {/* Guided next step: what to do next, and why it's worth doing */}
      {nextUp && (
        <button className="next-step-card" onClick={() => onOpenQuestion(nextUp.id)}>
          <span className="next-step-head">
            <span className="next-step-kicker">Your next step</span>
            <span className="next-step-title">
              {pathStep(nextUp.id) && <span className="step-num">{pathStep(nextUp.id)}</span>}
              {nextUp.title}
            </span>
          </span>
          {nextUp.why && <span className="next-step-why">{nextUp.why}</span>}
          <span className="next-step-cue">Open →</span>
        </button>
      )}
        <div className="home-rail">
      {/* Learn Python entry — above the daily strip for beginners. Self-hides
          once the whole curriculum is done. */}
      {onLearn && lessonInfo && lessonInfo.done < lessonInfo.total && brandNew && (
        <LearnStrip info={lessonInfo} onLearn={onLearn} />
      )}

      {/* Daily loop, right on the front door */}
      <div className="map-strip">
        <span className="map-strip-line">
          {counts.due > 0 ? (
            <>
              <strong className="due-num">{counts.due}</strong> review
              {counts.due === 1 ? '' : 's'} to clear today
            </>
          ) : counts.fresh > 0 ? (
            /* The next-step card below names the actual question — saying it
               here too made the page repeat itself three times over. */
            <>No reviews due — the path is open</>
          ) : (
            <>All caught up for today</>
          )}
        </span>
        <button
          className="btn btn-primary"
          onClick={onStartPractice}
          disabled={counts.due === 0 && counts.fresh === 0}
        >
          {counts.due > 0 ? 'Start review' : brandNew ? 'Begin the path' : 'Continue the path'}
        </button>
        {missCount > 0 && !brandNew && (
          <button className="btn btn-drill" onClick={onDrill}>
            Drill misses ({missCount})
          </button>
        )}
        <button className="btn btn-warmup" onClick={onWarmup}>
          Warm-up
        </button>
        {/* Mock interview is meaningless at zero solves — surfaces once you start. */}
        {!brandNew && (
          <button className="btn btn-mock" onClick={onMock} title="Timed, no hints — simulate the real interview">
            Mock interview
          </button>
        )}
      </div>

      {/* For returning users the Learn entry sits below the daily strip. */}
      {onLearn && lessonInfo && lessonInfo.done < lessonInfo.total && !brandNew && (
        <LearnStrip info={lessonInfo} onLearn={onLearn} />
      )}
      {onLearn && lessonInfo && lessonInfo.total > 0 && lessonInfo.done === lessonInfo.total && (
        <button className="learn-done-chip" onClick={onLearn}>
          Python basics ✓ — {lessonInfo.total}/{lessonInfo.total} lessons
        </button>
      )}

      {/* Today's pulse: what you've done, what's left, and the big number */}
      {!brandNew && (
        <div className="today-strip">
          <span className="today-label">Today</span>
          <span className={`today-chip ${pulse.solves > 0 ? 'good' : ''}`}>
            {pulse.solves} solved
          </span>
          {pulse.missedLeft > 0 && (
            <span className="today-chip bad">✗ {pulse.missedLeft} to win back</span>
          )}
          <span className={`today-chip ${pulse.dueLeft === 0 ? 'good' : ''}`}>
            {pulse.dueLeft === 0 ? 'reviews clear' : `${pulse.dueLeft} review${pulse.dueLeft === 1 ? '' : 's'} left`}
          </span>
          <span className={`today-chip ${pulse.goalMet ? 'good' : ''}`}>
            {pulse.goalMet ? '✓ daily goal met' : 'goal: solve 1 + clear reviews'}
          </span>
          {onStats && (
            <button
              className="today-ready"
              onClick={onStats}
              title="Interview readiness — coverage, retention, mocks, pace. Click for the breakdown."
            >
              Readiness <strong>{ready.score}</strong>/100 →
            </button>
          )}
        </div>
      )}

        </div>
      </div>

      {/* The questions that keep biting — one tap from the front door */}
      {weak.length > 0 && (
        <div className="weak-row">
          <span className="weak-label">Sharpen:</span>
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

      <p className="map-hint">
        Learn top to bottom — arrows mean &ldquo;learn this pattern first.&rdquo; Click a topic
        to open its questions.
      </p>

      <div className="graph-fit" ref={fitRef} style={{ height: GRAPH_H * scale }}>
        <div
          className="graph-canvas"
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
            // "You are here": the topic your next step belongs to, so the map
            // answers "where am I?" at a glance instead of only "how much left".
            const current = !done && nextUp && categoryKeyOf(nextUp.pattern) === n.key;
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
