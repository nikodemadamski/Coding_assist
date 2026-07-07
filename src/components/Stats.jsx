import { useMemo } from 'react';
import { beltFor, currentStreak, dueQuestionIds, isSolved, masteryLevel } from '../state/progress.js';

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

      <h2 style={{ margin: '18px 0 8px' }}>Mastery</h2>
      <div className="mastery-row">
        <span className="pill pill-new">{mastery.new} new</span>
        <span className="pill pill-learning">{mastery.learning} learning</span>
        <span className="pill pill-reviewing">{mastery.reviewing} reviewing</span>
        <span className="pill pill-mastered">{mastery.mastered} mastered</span>
      </div>

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
