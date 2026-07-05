import { useMemo } from 'react';
import { beltFor, currentStreak, dueQuestionIds } from '../state/progress.js';

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
  const solvedCount = Object.keys(progress.solved).length;
  const belt = beltFor(solvedCount);
  const streak = currentStreak(progress.streak);
  const dueCount = dueQuestionIds(progress, new Set(questions.map((q) => q.id))).length;

  const byTrack = useMemo(() => {
    const rows = {};
    for (const q of questions) {
      rows[q.track] = rows[q.track] || { label: q.track, total: 0, solved: 0 };
      rows[q.track].total++;
      if (progress.solved[q.id]) rows[q.track].solved++;
    }
    return Object.values(rows);
  }, [questions, progress]);

  const byPattern = useMemo(() => {
    const rows = {};
    for (const q of questions) {
      rows[q.pattern] = rows[q.pattern] || { label: q.pattern, total: 0, solved: 0 };
      rows[q.pattern].total++;
      if (progress.solved[q.id]) rows[q.pattern].solved++;
    }
    return Object.values(rows).sort((a, b) => b.solved - a.solved || b.total - a.total);
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

      <h2 style={{ margin: '18px 0 8px' }}>Solves per track</h2>
      <BarChart rows={byTrack} />

      <h2 style={{ margin: '22px 0 8px' }}>Solves per pattern</h2>
      <BarChart rows={byPattern} />
    </div>
  );
}
