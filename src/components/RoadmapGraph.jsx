import { useEffect, useMemo, useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import { useIsNarrow } from './useIsNarrow.js';
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
  isSettled,
  practiceCounts,
  solvedCount,
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
  onSkip = null,
  lessonInfo = null, // { done, total, due, nextTitle }
}) {
  const [openCat, setOpenCat] = useState(null);
  const catTrapRef = useRef(null);
  useFocusTrap(catTrapRef, { active: !!openCat });
  const [scale, setScale] = useState(1);
  const fitRef = useRef(null);
  const today = todayStr();
  // Phones get the topic rail instead of the map — see the render below.
  const narrow = useIsNarrow(700);

  // Fit the fixed-size canvas to the window — BOTH axes. Width alone left a
  // tall map pushing the hero past the fold on a short laptop screen, and the
  // page is only ever meant to scroll one way. CHROME is the header plus the
  // caption and breathing room under the map; it is a constant on purpose,
  // because measuring the element's own top would feed the height it is being
  // used to compute back into itself.
  const CHROME = 230;
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const fit = () =>
      setScale(
        Math.max(
          0.3,
          Math.min(el.clientWidth / GRAPH_W, (window.innerHeight - CHROME) / GRAPH_H, 1.2)
        )
      );
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // A viewport that only changes height never resizes the element, so the
    // observer alone would miss it.
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
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
  // The shared count — see state/progress.js. Equivalent to the inline filter
  // it replaces, kept in one place so it cannot drift from Stats or the shop.
  const solveTotal = useMemo(
    () => solvedCount(progress, questions),
    [questions, progress]
  );
  const brandNew = solveTotal === 0;
  const nextUp = useMemo(
    () => nextOnPath(questions, (id) => isSettled(progress, id)),
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
  // The map leans further than a card does — it is the thing you are meant to
  // look at, and a 7° swing is what sells "floating" rather than "printed".
  const orbitFieldRef = usePointerField(7);
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
        (id) => isSettled(progress, id)
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
    // The entrance leaves an inline `transform: scale(1)` on every node, which
    // silently beats the CSS rule that gives each one its depth in the orbit —
    // the map would tilt as a flat picture. Drop the inline value once the
    // animation has landed, exactly as the edges do with their dash values.
    const nodes = [...root.querySelectorAll('.graph-node')];
    play(nodes, {
      ...presets.enter(),
      onComplete: () => {
        for (const el of nodes) el.style.removeProperty('transform');
      },
    });
  }, [play, liveEdges]);

  // Each quick action leads with one of your own numbers rather than a glyph.
  const bestWarmup = useMemo(
    () => Object.values(progress.warmup ?? {}).reduce((n, w) => Math.max(n, w?.best ?? 0), 0),
    [progress]
  );
  const mockCount = (progress.mock ?? []).length;

  const name = useMemo(() => loadUiPrefs().name, []);
  const streak = currentStreak(progress.streak);
  const hello = greeting(new Date().getHours(), name, { streak, solvedToday: pulse.solves });
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
          scroll — and the map is *in* it, not two screens below.
          Left: who you are, what's next, and one red button. Right: the whole
          path, floating in space. The map used to sit under the fold, which
          meant the single most striking thing in the app was something you had
          to go looking for. */}
      <section className="hero hero-split" data-reveal ref={heroFieldRef}>
        <div className="hero-copy">
        <div className="hero-lead">
          <h1 className="hero-title">{hello}</h1>
          {/* One live status line under the greeting: where you are, in a
              sentence. It used to open with "N reviews waiting" as well, which
              is the same number the review button two inches below already
              leads with — and that button is the one you can actually press.
              Saying it twice made neither say it louder. */}
          <p className="hero-line">
            {brandNew ? (
              <>
                {questions.length} problems between here and interview-ready. The order is
                already decided; you just have to start.
              </>
            ) : (
              <>
                <strong>
                  <CountUp value={solveTotal} />
                </strong>{' '}
                solved · <strong>{questions.length - solveTotal}</strong> to go ·{' '}
                <strong>{ready.score}</strong>/100 ready
              </>
            )}
          </p>

        </div>

        {/* The one loud thing. */}
        {nextUp ? (
          <button className="hero-next" onClick={() => onOpenQuestion(nextUp.id)} ref={nextFieldRef}>
            <span className="hero-next-kicker">
              {solveTotal === 0 ? 'Start here' : 'Next problem'}
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

        {/* The path is a fixed order, which is right if you started at the
            beginning and wrong for everyone else — solve Two Sum first and the
            hero still offers Reverse a string, forever. Skipping records nothing
            about your ability: no solve, no coins, no review. It only stops this
            one being OFFERED, and the question stays in Browse, so doing it
            later undoes the decision. Outside the card because .hero-next is
            itself a button. */}
        {nextUp && onSkip && (
          <button
            className="hero-skip"
            onClick={() => onSkip(nextUp.id)}
            title={`Stop offering ${nextUp.title} — it stays in Browse if you change your mind`}
          >
            I know this one — show me the next
          </button>
        )}

        {/* Everything else you might do, one row, deliberately quieter. */}
        <div className="hero-actions">
          {/* The one promise this button makes is "you are about to do coding
              questions". It counts questions, and it only ever serves
              questions — no lessons, no drills, no quizzes. */}
          <button
            className="hero-act hero-act-loud"
            onClick={onStartPractice}
            disabled={counts.due === 0 && counts.fresh === 0}
            title={
              counts.due > 0
                ? `${counts.due} question${counts.due === 1 ? '' : 's'} due for review, then the next one on the path`
                : 'Nothing due — straight on to the next question on the path'
            }
          >
            <span className="hero-act-n">{counts.due > 0 ? counts.due : '▶'}</span>
            <span className="hero-act-l">
              {counts.due > 0 ? 'questions due' : 'next question'}
            </span>
          </button>
          {/* Every chip leads with a number that MEANS something — your own
              record, not a decorative glyph — and says in its tooltip why you
              would press it. A lightning bolt told you nothing. */}
          <button
            className="hero-act"
            onClick={onWarmup}
            title={
              bestWarmup > 0
                ? `Your best run is ${bestWarmup} answers without a miss — go beat it`
                : 'Rapid-fire one-liners against a clock: get the syntax out of the way first'
            }
          >
            <span className="hero-act-n">{bestWarmup > 0 ? bestWarmup : '—'}</span>
            <span className="hero-act-l">{bestWarmup > 0 ? 'best warm-up' : 'warm-up'}</span>
          </button>
          {!brandNew && (
            <button
              className="hero-act"
              onClick={onMock}
              title={
                mockCount > 0
                  ? `${mockCount} mock${mockCount === 1 ? '' : 's'} run so far — timed, no hints, graded like the real thing`
                  : 'Timed, no hints — the closest thing here to the real interview'
              }
            >
              <span className="hero-act-n">{mockCount > 0 ? mockCount : '—'}</span>
              <span className="hero-act-l">{mockCount > 0 ? 'mocks run' : 'mock interview'}</span>
            </button>
          )}
          {missCount > 0 && !brandNew && (
            <button
              className="hero-act hero-act-bad"
              onClick={onDrill}
              title={`${missCount} question${missCount === 1 ? '' : 's'} you got wrong today — re-clear them while they still sting`}
            >
              <span className="hero-act-n">{missCount}</span>
              <span className="hero-act-l">drill misses</span>
            </button>
          )}
          {onStats && !brandNew && (
            <button
              className="hero-act hero-act-ring"
              onClick={onStats}
              title={`${ready.score}/100 interview-ready — coverage, mastery, mocks, pace and Big-O, scored together`}
            >
              <ReadinessRing score={ready.score} size={40} />
              <span className="hero-act-l">readiness</span>
            </button>
          )}
        </div>
        </div>

        {/* ── the map, in orbit ──────────────────────────────────────────────
            Two moving parts, one transform each, because a single element
            cannot own both a keyframe and a pointer-driven variable without the
            two fighting:
              .orbit-drift  — a long, slow bob (keyframe)
              .graph-canvas — the fitted scale AND the lean toward the cursor
                              (--rx/--ry from usePointerField on .hero-orbit,
                              smoothed by a CSS transition)
            The nodes each carry a `--z`, so the lean parallaxes them against
            the edges instead of tipping a flat picture. */}
        {/* **A phone gets a list, not a shrunk diagram.** The map is fitted with
            `min(width/840, …)`, which on a 390px screen is about 0.42 — so an
            11px label renders near 4px. It was still "visible" in the sense the
            old smoke check meant, and completely unreadable in the sense that
            matters, while being the app's primary navigation. The rail carries
            exactly the same information (path order, solved counts, where you
            are, tap for the questions) at a size you can read and hit. */}
        {narrow ? (
          <nav className="topic-rail" aria-label="The path — topics in order">
            <p className="topic-rail-cap">
              The path — {shownNodes.length} topics, in order. Tap one for its questions.
            </p>
            {shownNodes.map((n, i) => {
              const st = stats[n.key] || { total: 0, solved: 0 };
              const pct = st.total ? st.solved / st.total : 0;
              const done = st.total > 0 && st.solved === st.total;
              const current = !done && currentKey === n.key;
              const started = !done && !current && st.solved > 0;
              return (
                <button
                  key={n.key}
                  className={`topic-row ${done ? 'done' : ''} ${current ? 'current' : ''} ${started ? 'started' : ''}`}
                  onClick={() => setOpenCat(n.key)}
                >
                  <span className="topic-row-step">{i + 1}</span>
                  <span className="topic-row-main">
                    <span className="topic-row-label">
                      {label(n.key)}
                      {current && <span className="topic-row-here">you are here</span>}
                    </span>
                    <span className="topic-row-bar">
                      <span className="topic-row-fill" style={{ '--fill': pct }} />
                    </span>
                  </span>
                  <span className="topic-row-count">
                    {st.solved}/{st.total}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : (
        <div className="hero-orbit" ref={orbitFieldRef}>
          {/* data-bleed: an ambient layer that deliberately extends past its
              frame so the nebula never looks cut off. The shell clips it at the
              window; smoke exempts anything that declares itself this way, and
              holds every other element to the page width. */}
          <div className="orbit-space" data-bleed aria-hidden="true" />
          <div className="orbit-drift">
            <div className="graph-fit" ref={fitRef} style={{ height: GRAPH_H * scale }}>
              {/* The lean is composed into the CANVAS's own transform, not an
                  ancestor's. Chromium loses hit-testing for descendants of a
                  rotateX/rotateY ancestor — the topics stay drawn but stop
                  being clickable — so the rotation has to live on the nodes'
                  direct parent. CSS owns `transform` here; React only passes
                  the fitted scale in as a variable. */}
              <div
                className="graph-canvas"
                ref={canvasRef}
                style={{ width: GRAPH_W, height: GRAPH_H, '--scale': scale }}
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
                      // The route down to the topic you're on carries a slow
                      // travelling current, so the map points at you instead of
                      // being read.
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
                    // "You are here": the topic your next step belongs to, so
                    // the map answers "where am I?" at a glance.
                    const current = !done && currentKey === n.key;
                    const started = !done && !current && st.solved > 0;
                    return (
                      <button
                        key={n.key}
                        className={`graph-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${started ? 'started' : ''}`}
                        style={{
                          left: n.x,
                          top: n.y,
                          width: NODE_W,
                          height: NODE_H,
                          // Depth, so the lean parallaxes instead of tipping a
                          // flat picture. Further down the path = closer to you.
                          // Always POSITIVE: under preserve-3d a child behind
                          // its parent's plane loses the hit test to the parent,
                          // and the topics would stop being clickable.
                          '--z': `${Math.round((n.y / GRAPH_H) * 54 + 6)}px`,
                        }}
                        onClick={() => setOpenCat(n.key)}
                        title={`${label(n.key)} — ${st.solved}/${st.total} solved`}
                      >
                        <span className="graph-node-label">{label(n.key)}</span>
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
          </div>
          <p className="orbit-cap">
            <span className="orbit-cap-lead">The path — {shownNodes.length} topics, in order.</span>{' '}
            An arrow means &ldquo;learn this one first&rdquo;. Tap a topic for its questions.
          </p>
        </div>
        )}
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
              {/* Only once it has something to say. At 0/52 this was a long
                  empty line restating the sentence next to it — a bar earns its
                  place by showing a fraction you can read at a glance, and an
                  empty one shows nothing. */}
              {lessonInfo.done > 0 && (
                <span
                  className="learn-lane-bar"
                  role="img"
                  aria-label={`${lessonInfo.done} of ${lessonInfo.total} lessons done`}
                >
                  <span
                    className="learn-lane-fill"
                    style={{ '--fill': lessonInfo.done / lessonInfo.total }}
                  />
                </span>
              )}
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

      {/* Data tracks — separate entities, not woven into the algorithm map */}
      <div className="data-tracks">
        <span className="data-tracks-label">Data tracks: their own map, off the algorithm path</span>
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
