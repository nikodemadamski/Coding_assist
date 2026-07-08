import { useMemo } from 'react';
import { beltFor, currentStreak, dueQuestionIds, isSolved, masteryLevel } from '../state/progress.js';
import { summarizeMocks, formatDuration } from '../state/mockSession.js';
import Calendar from './Calendar.jsx';

function BarChart({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(r.solved / max) * 100}%` }} />
          </span>
          <span className="bar-n">
            {r.solved}/{r.total}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Stats({ questions, progress }) {
  const solvedCount = Object.values(progress.solved).filter(isSolved).length;
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

  const byTrack = useMemo(() => {
    const rows = {};
    for (const q of questions) {
      rows[q.track] = rows[q.track] || { label: q.track, total: 0, solved: 0 };
      rows[q.track].total++;
      if (isSolved(progress.solved[q.id])) rows[q.track].solved++;
    }
    return Object.values(rows);
  }, [questions, progress]);

  const byPattern = useMemo(() => {
    const rows = {};
    for (const q of questions) {
      rows[q.pattern] = rows[q.pattern] || { label: q.pattern, total: 0, solved: 0 };
      rows[q.pattern].total++;
      if (isSolved(progress.solved[q.id])) rows[q.pattern].solved++;
    }
    return Object.values(rows).sort((a, b) => b.solved - a.solved || b.total - a.total);
  }, [questions, progress]);

  const mockHistory = useMemo(() => progress.mock || [], [progress.mock]);
  const mockStats = useMemo(() => summarizeMocks(mockHistory), [mockHistory]);
  const recentMocks = useMemo(() => [...mockHistory].reverse().slice(0, 6), [mockHistory]);

  // Questions you get wrong most — "what mistakes do I make?"
  const troublesome = useMemo(() => {
    return questions
      .map((q) => ({ q, mistakes: progress.solved[q.id]?.mistakes || 0 }))
      .filter((r) => r.mistakes > 0)
      .sort((a, b) => b.mistakes - a.mistakes)
      .slice(0, 8);
  }, [questions, progress]);

  return (
    <div className="stats">
      <h1>Training record</h1>
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="v">{solvedCount}</div>
          <div className="l">problems solved</div>
        </div>
        <div className="stat-tile">
          <div className="v">🔥 {streak}</div>
          <div className="l">day streak</div>
        </div>
        <div className="stat-tile">
          <div className="v" style={{ color: belt.color }}>
            {belt.name}
          </div>
          <div className="l">belt rank</div>
        </div>
        <div className="stat-tile">
          <div className="v">{dueCount}</div>
          <div className="l">reviews due</div>
        </div>
      </div>

      <h2 style={{ margin: '20px 0 8px' }}>Attendance</h2>
      <Calendar progress={progress} />

      <h2 style={{ margin: '22px 0 8px' }}>Mastery</h2>
      <div className="mastery-row">
        <span className="pill pill-new">{mastery.new} new</span>
        <span className="pill pill-learning">{mastery.learning} learning</span>
        <span className="pill pill-reviewing">{mastery.reviewing} reviewing</span>
        <span className="pill pill-mastered">{mastery.mastered} mastered</span>
      </div>

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

      <h2 style={{ margin: '22px 0 8px' }}>Solves per track</h2>
      <BarChart rows={byTrack} />

      <h2 style={{ margin: '22px 0 8px' }}>Solves per pattern</h2>
      <BarChart rows={byPattern} />

      <h2 style={{ margin: '22px 0 8px' }}>
        Where you slip <span className="count">{totalMistakes} wrong submits total</span>
      </h2>
      {troublesome.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>No mistakes logged yet — they&apos;ll show here.</p>
      ) : (
        <div>
          {troublesome.map(({ q, mistakes }) => (
            <div className="bar-row" key={q.id}>
              <span className="bar-label" style={{ width: 200 }}>
                {q.title}
              </span>
              <span className="bar-n" style={{ color: 'var(--crimson)' }}>
                ✗ {mistakes}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
