import { useMemo } from 'react';
import { useReveal } from '../anim/useReveal.js';
import ReadinessRing from './ReadinessRing.jsx';
import {
  beltFor,
  currentStreak,
  dueQuestionIds,
  isSolved,
  masteryLevel,
  reviewForecast,
} from '../state/progress.js';
import { summarizeMocks, formatDuration } from '../state/mockSession.js';
import { readiness, trackFitness, PACE_MIN_SAMPLES } from '../state/readiness.js';
import { ROADMAP, categoryKeyOf } from '../data/roadmap.js';
import Calendar from './Calendar.jsx';

const MASTERY_ORDER = ['mastered', 'reviewing', 'learning', 'new'];
const MASTERY_LABEL = { mastered: 'mastered', reviewing: 'reviewing', learning: 'learning', new: 'not started' };

// A stacked bar showing the whole bank split by how well you know it.
function JourneyBar({ mastery, total }) {
  return (
    <div className="journey-bar" role="img" aria-label="Mastery breakdown of the question bank">
      {MASTERY_ORDER.map((k) =>
        mastery[k] > 0 ? (
          <span
            key={k}
            className={`journey-seg seg-${k}`}
            style={{ '--fill': mastery[k] / total }}
            title={`${mastery[k]} ${MASTERY_LABEL[k]}`}
          />
        ) : null
      )}
    </div>
  );
}

function ProgressRows({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="prog-rows">
      {rows.map((r) => {
        const done = r.total > 0 && r.solved === r.total;
        return (
          <div className="prog-row" key={r.label}>
            <span className="prog-label">{r.label}</span>
            <span className="prog-track" style={{ maxWidth: `${(r.total / max) * 100}%` }}>
              <span className={`prog-fill ${done ? 'done' : ''}`} style={{ '--fill': r.solved / r.total }} />
            </span>
            <span className="prog-n">
              {r.solved}/{r.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Weekday label for a 'YYYY-MM-DD' date.
function dayLabel(dateStr, i) {
  if (i === 0) return 'today';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
}

const READY_PART_LABEL = {
  coverage: 'Path coverage',
  mastery: 'Retention depth',
  mocks: 'Mock-interview record',
  pace: 'Solve pace',
  bigo: 'Big-O fluency',
};

function ReadinessCard({ ready }) {
  return (
    <section className="ready-card bento-cell b-ready" data-reveal>
      <div className="ready-left" role="img" aria-label={`Interview readiness ${ready.score} out of 100`}>
        <h3 className="bento-title">Interview readiness</h3>
        <ReadinessRing score={ready.score} size={168} label="/100" />
        <div className="ready-level">{ready.level}</div>
      </div>
      <div className="ready-parts">
        {Object.entries(ready.parts).map(([k, v]) => {
          const gated = k === 'bigo' && !ready.bigo.active;
          return (
            <div className={`ready-part ${k === ready.weakest ? 'weakest' : ''}`} key={k}>
              <span
                className="ready-part-label"
                title={gated ? `Joins the score after ${ready.bigo.needed} answered checks` : undefined}
              >
                {READY_PART_LABEL[k]}
              </span>
              <span className="ready-part-track">
                <span className="ready-part-fill" style={{ '--fill': v }} />
              </span>
              <span className="ready-part-pct">
                {gated ? `${ready.bigo.answered}/${ready.bigo.needed}` : `${Math.round(v * 100)}%`}
              </span>
            </div>
          );
        })}
        <div className="ready-pace-row">
          {Object.entries(ready.pace).map(([diff, p]) => (
            <span className={`ready-pace tag diff-${diff}`} key={diff} title={`Median first-solve time vs the ${formatDuration(p.target)} target`}>
              {diff}:{' '}
              {p.n === 0
                ? 'no timed solves'
                : p.n < PACE_MIN_SAMPLES
                  ? `${formatDuration(p.median)} (${p.n}/${PACE_MIN_SAMPLES} timed)`
                  : `${formatDuration(p.median)} vs ${formatDuration(p.target)}`}
            </span>
          ))}
        </div>
        <p className="ready-advice">{ready.advice}</p>
      </div>
    </section>
  );
}

const TRACK_LABEL = { python: 'python', pandas: 'pandas', sql: 'SQL' };

// Per-track slice of the same readiness idea: coverage + mastery, one bar per
// track, weakest highlighted — so a lopsided preparation is visible at a glance.
function TrackFitnessCard({ fit }) {
  return (
    <section className="track-fit bento-cell b-tracks" data-reveal>
      <h3>Fitness by track</h3>
      <div className="ready-parts">
        {fit.tracks.map((t) => (
          <div className={`ready-part ${fit.weakest === t.track ? 'weakest' : ''}`} key={t.track}>
            <span className="ready-part-label">{TRACK_LABEL[t.track]}</span>
            <span className="ready-part-track">
              <span className="ready-part-fill" style={{ '--fill': t.score / 100 }} />
            </span>
            <span className="ready-part-pct">
              {t.score} · {t.solved}/{t.total}
            </span>
          </div>
        ))}
      </div>
      {fit.weakest && (
        <p className="ready-advice">
          Thinnest track: {TRACK_LABEL[fit.weakest]} — its map is where the next sessions pay the most.
        </p>
      )}
    </section>
  );
}

function Forecast({ forecast }) {
  const max = Math.max(1, ...forecast.map((f) => f.count));
  const totalWeek = forecast.reduce((n, f) => n + f.count, 0);
  return (
    <>
      <div className="forecast-row" role="img" aria-label="Reviews due over the next 7 days">
        {forecast.map((f, i) => (
          <div className="fc-day" key={f.date} title={`${f.count} review(s) on ${f.date}`}>
            <span className="fc-n">{f.count > 0 ? f.count : ''}</span>
            <span
              className={`fc-bar ${i === 0 && f.count > 0 ? 'due-now' : ''}`}
              style={{ '--fill': (4 + (f.count / max) * 44) / 48 }}
            />
            <span className="fc-l">{dayLabel(f.date, i)}</span>
          </div>
        ))}
      </div>
      <p className="note" style={{ marginTop: 6 }}>
        {totalWeek === 0
          ? 'Nothing scheduled this week — solve new problems and reviews will start landing here.'
          : 'Clear reviews the day they land and the pile never grows.'}
      </p>
    </>
  );
}

export default function Stats({ questions, progress, backupInfo = null, onBackupNow = null }) {
  const solvedCount = Object.values(progress.solved).filter(isSolved).length;
  const total = questions.length;
  const belt = beltFor(solvedCount);
  const streak = currentStreak(progress.streak);
  const validIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);
  const dueCount = dueQuestionIds(progress, validIds).length;
  const forecast = useMemo(() => reviewForecast(progress, validIds), [progress, validIds]);
  const ready = useMemo(() => readiness(progress, questions), [progress, questions]);
  const trackFit = useMemo(() => trackFitness(progress, questions), [progress, questions]);

  const mastery = useMemo(() => {
    const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    for (const q of questions) counts[masteryLevel(progress, q.id)]++;
    return counts;
  }, [questions, progress]);

  const totalMistakes = useMemo(
    () => Object.values(progress.solved).reduce((n, e) => n + (e.mistakes || 0), 0),
    [progress]
  );

  // Solves per topic (roadmap category), most-complete first.
  const byTopic = useMemo(() => {
    const rows = {};
    for (const q of questions) {
      const key = categoryKeyOf(q.pattern);
      rows[key] = rows[key] || { key, total: 0, solved: 0 };
      rows[key].total++;
      if (isSolved(progress.solved[q.id])) rows[key].solved++;
    }
    const labelOf = (key) => ROADMAP.find((c) => c.key === key)?.label.replace(/^\d+ · /, '') ?? key;
    return Object.values(rows)
      .map((r) => ({ ...r, label: labelOf(r.key) }))
      .sort((a, b) => b.solved / b.total - a.solved / a.total || b.total - a.total);
  }, [questions, progress]);

  const mockHistory = useMemo(() => progress.mock || [], [progress.mock]);
  const mockStats = useMemo(() => summarizeMocks(mockHistory), [mockHistory]);
  const recentMocks = useMemo(() => [...mockHistory].reverse().slice(0, 6), [mockHistory]);

  const troublesome = useMemo(() => {
    return questions
      .map((q) => ({ q, mistakes: progress.solved[q.id]?.mistakes || 0 }))
      .filter((r) => r.mistakes > 0)
      .sort((a, b) => b.mistakes - a.mistakes)
      .slice(0, 8);
  }, [questions, progress]);

  const pct = total ? Math.round((solvedCount / total) * 100) : 0;
  const revealRef = useReveal('stats');

  return (
    <div className="stats stats-page" ref={revealRef}>
      <header className="page-head" data-reveal>
        <h1>Training record</h1>
        <p className="page-lede">
          Everything the dojo knows about how ready you are — and the one thing worth fixing next.
        </p>
      </header>

      {backupInfo?.nudge && onBackupNow && (
        <div className="backup-nudge" role="status" data-reveal>
          <span>
            {solvedCount} solves live only in this browser
            {backupInfo.daysSince != null
              ? ` — last backup was ${backupInfo.daysSince} days ago.`
              : ' — never backed up.'}{' '}
            One cleared cache loses everything.
          </span>
          <button className="btn" onClick={onBackupNow}>
            Back up now
          </button>
        </div>
      )}

      {/* A bento, not a stack. Cells carry their own weight (7/5 · 5/7 · 12),
          so the eye lands on readiness first and the page reads as a dashboard
          instead of a scroll of identical panels. */}
      <div className="bento">
        {/* Am I ready? — the number the whole app exists to move */}
        <ReadinessCard ready={ready} />

        {/* Journey — the whole path at a glance, belt and mastery mix */}
        <section className="journey-card bento-cell b-journey" data-reveal>
          <h3 className="bento-title">The path</h3>
          <div className="journey-headline">
            <span className="journey-count">
              {solvedCount}
              <span className="journey-of"> / {total}</span>
            </span>
            <span className="journey-sub">solved · {pct}% of the path</span>
          </div>
          <div className="journey-belt">
            <span className="belt-name" style={{ color: belt.color }}>
              {belt.name} belt
            </span>
            <span className="belt-strip" role="img" aria-label="Belt progress">
              <span className="belt-strip-fill" style={{ '--fill': belt.progress, background: belt.color }} />
            </span>
            <span className="journey-belt-next">
              {belt.next ? `${belt.next.threshold - solvedCount} to ${belt.next.name}` : 'max rank'}
            </span>
          </div>

          <JourneyBar mastery={mastery} total={total} />
          <div className="journey-legend">
            {MASTERY_ORDER.map((k) => (
              <span className="journey-legend-item" key={k}>
                <span className={`journey-dot seg-${k}`} aria-hidden="true" />
                {mastery[k]} {MASTERY_LABEL[k]}
              </span>
            ))}
          </div>
        </section>

        {/* Five numbers worth glancing at, in a tight block rather than a row
            of look-alike cards spanning the page. */}
        <section className="bento-cell b-metrics" data-reveal>
          <h3 className="bento-title">At a glance</h3>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="v">{streak}</div>
              <div className="l">day streak</div>
            </div>
            <div className="stat-tile">
              <div className="v">{mastery.mastered}</div>
              <div className="l">mastered</div>
            </div>
            <div className="stat-tile">
              <div className="v">{dueCount}</div>
              <div className="l">reviews due</div>
            </div>
            <div className="stat-tile">
              <div className="v">{mockStats.count}</div>
              <div className="l">mock interviews</div>
            </div>
            <div className="stat-tile">
              <div className="v">
                {(progress.bigo?.right || 0) + (progress.bigo?.wrong || 0) > 0
                  ? `${Math.round(
                      (100 * (progress.bigo?.right || 0)) /
                        ((progress.bigo?.right || 0) + (progress.bigo?.wrong || 0))
                    )}%`
                  : '—'}
              </div>
              <div className="l">Big-O accuracy</div>
            </div>
          </div>
        </section>

        <section className="bento-cell b-forecast" data-reveal>
          <h3 className="bento-title">Review forecast</h3>
          <p className="bento-sub">What&apos;s landing this week.</p>
          <Forecast forecast={forecast} />
        </section>

        {/* The same readiness idea sliced by track: lopsided prep shows up here */}
        <TrackFitnessCard fit={trackFit} />

        <section className="bento-cell b-topics" data-reveal>
          <h3 className="bento-title">Progress by topic</h3>
          <ProgressRows rows={byTopic} />
        </section>

        <section className="bento-cell b-calendar" data-reveal>
          <h3 className="bento-title">Attendance</h3>
          <Calendar progress={progress} />
        </section>

        <section className="bento-cell b-mocks" data-reveal>
          <h3 className="bento-title">Mock interviews</h3>
          <p className="bento-sub">Timed, no hints — the real test.</p>
          {mockStats.count === 0 ? (
            <p className="bento-empty">
              None yet. Run one from the home screen — it&apos;s the closest this app gets to the
              real thing, and the fastest way to find out if you&apos;re ready.
            </p>
          ) : (
            <>
              <div className="stat-grid">
                <div className="stat-tile">
                  <div className="v">{mockStats.count}</div>
                  <div className="l">interviews taken</div>
                </div>
                <div className="stat-tile">
                  <div className="v">{Math.round(mockStats.passRate * 100)}%</div>
                  <div className="l">solved in time</div>
                </div>
                <div className="stat-tile">
                  <div className="v">{mockStats.cleanPasses}</div>
                  <div className="l">clean passes</div>
                </div>
                <div className="stat-tile">
                  <div className="v">{mockStats.avgTimeMs ? formatDuration(mockStats.avgTimeMs) : '—'}</div>
                  <div className="l">avg time used</div>
                </div>
              </div>
              <div className="mock-log">
                {recentMocks.map((m, i) => (
                  <div className="mock-log-row" key={i}>
                    <span className={`mock-log-dot ${m.passed ? 'pass' : 'fail'}`} aria-hidden="true" />
                    <span className="mock-log-title">{m.title}</span>
                    <span className={`tag diff-${m.difficulty}`}>{m.difficulty}</span>
                    <span className="mock-log-meta">
                      {m.passed ? (m.ranOutOfTime ? 'solved (over time)' : 'solved') : m.ranOutOfTime ? 'time up' : 'ended'}
                      {' · '}
                      {formatDuration(m.timeMs)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bento-cell b-slips" data-reveal>
          <h3 className="bento-title">Where you slip</h3>
          <p className="bento-sub">{totalMistakes} wrong submits total.</p>
          {troublesome.length === 0 ? (
            <p className="bento-empty">No mistakes logged yet — they&apos;ll show here.</p>
          ) : (
            <div className="slip-list">
              {troublesome.map(({ q, mistakes }) => (
                <div className="slip-row" key={q.id}>
                  <span className="slip-title">{q.title}</span>
                  <span className="slip-n">✗ {mistakes}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
