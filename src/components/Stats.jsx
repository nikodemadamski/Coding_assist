import { useMemo } from 'react';
import { beltFor, currentStreak, dueQuestionIds, isSolved, masteryLevel } from '../state/progress.js';
import { summarizeMocks, formatDuration } from '../state/mockSession.js';
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
            style={{ width: `${(mastery[k] / total) * 100}%` }}
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
              <span className={`prog-fill ${done ? 'done' : ''}`} style={{ width: `${(r.solved / r.total) * 100}%` }} />
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

export default function Stats({ questions, progress }) {
  const solvedCount = Object.values(progress.solved).filter(isSolved).length;
  const total = questions.length;
  const belt = beltFor(solvedCount);
  const streak = currentStreak(progress.streak);
  const dueCount = dueQuestionIds(progress, new Set(questions.map((q) => q.id))).length;

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

  return (
    <div className="stats">
      <h1>Training record</h1>

      {/* Journey hero — the whole path at a glance */}
      <section className="journey-card">
        <div className="journey-top">
          <div className="journey-headline">
            <span className="journey-count">
              {solvedCount}
              <span className="journey-of"> / {total}</span>
            </span>
            <span className="journey-sub">problems solved · {pct}% of the path</span>
          </div>
          <div className="journey-belt">
            <span className="belt-name" style={{ color: belt.color }}>
              {belt.name} belt
            </span>
            <span className="belt-strip" role="img" aria-label="Belt progress">
              <span className="belt-strip-fill" style={{ width: `${belt.progress * 100}%`, background: belt.color }} />
            </span>
            <span className="journey-belt-next">
              {belt.next ? `${belt.next.threshold - solvedCount} to ${belt.next.name}` : 'max rank'}
            </span>
          </div>
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

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="v">🔥 {streak}</div>
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
      </div>

      <h2 style={{ margin: '22px 0 8px' }}>Attendance</h2>
      <Calendar progress={progress} />

      <h2 style={{ margin: '22px 0 8px' }}>Progress by topic</h2>
      <ProgressRows rows={byTopic} />

      <h2 style={{ margin: '22px 0 8px' }}>
        Mock interviews <span className="count">timed, no hints — the real test</span>
      </h2>
      {mockStats.count === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>
          No mock interviews yet. Run one from the home screen — it&apos;s the closest this app
          gets to the real thing, and the fastest way to find out if you&apos;re ready.
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

      <h2 style={{ margin: '22px 0 8px' }}>
        Where you slip <span className="count">{totalMistakes} wrong submits total</span>
      </h2>
      {troublesome.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>No mistakes logged yet — they&apos;ll show here.</p>
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
    </div>
  );
}
