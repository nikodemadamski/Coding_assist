import { useMemo, useState } from 'react';
import {
  isDue,
  isSolved,
  masteryLevel,
  practiceCounts,
  todayStr,
} from '../state/progress.js';

const TRACKS = ['all', 'python', 'pandas', 'sql'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const MASTERY_LABEL = {
  new: 'new',
  learning: 'learning',
  reviewing: 'reviewing',
  mastered: 'mastered',
};

function QuestionRow({ q, level, due, onOpen }) {
  return (
    <button className="q-card" onClick={() => onOpen(q.id)}>
      <span className={`mastery-dot dot-${level}`} aria-hidden="true" />
      <span className="q-title">{q.title}</span>
      <span className="q-meta">
        {due && <span className="tag due-tag">⟳ due</span>}
        {q.imported && <span className="tag imported">imported</span>}
        <span className={`tag diff-${q.difficulty}`}>{q.difficulty}</span>
        <span className={`pill pill-${level}`}>{MASTERY_LABEL[level]}</span>
      </span>
    </button>
  );
}

export default function Picker({ questions, progress, onOpen, onPractice, onImport }) {
  const [track, setTrack] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const today = todayStr();

  const counts = useMemo(() => practiceCounts(progress, questions, today), [progress, questions, today]);
  const solvedCount = useMemo(
    () => questions.filter((q) => isSolved(progress.solved[q.id])).length,
    [questions, progress]
  );

  const filtered = questions.filter(
    (q) =>
      (track === 'all' || q.track === track) &&
      (difficulty === 'all' || q.difficulty === difficulty)
  );

  // NeetCode-style: group the list by pattern.
  const groups = useMemo(() => {
    const byPattern = new Map();
    for (const q of filtered) {
      if (!byPattern.has(q.pattern)) byPattern.set(q.pattern, []);
      byPattern.get(q.pattern).push(q);
    }
    return [...byPattern.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const nothingDue = counts.due === 0;

  return (
    <div className="picker">
      {/* ---- Today's Practice ---- */}
      <section className="today-card">
        <div className="today-head">
          <h2>Today&apos;s practice</h2>
          <span className="today-progress">
            {solvedCount}/{questions.length} learned
          </span>
        </div>
        <p className="today-line">
          {counts.due > 0 ? (
            <>
              <strong className="due-num">{counts.due}</strong> review
              {counts.due === 1 ? '' : 's'} to clear
              {counts.fresh > 0 && (
                <>
                  , then <strong>{counts.fresh}</strong> new unlock{counts.fresh === 1 ? 's' : ''}
                </>
              )}
              .
            </>
          ) : counts.fresh > 0 ? (
            <>
              No reviews due — <strong>{counts.fresh}</strong> new question
              {counts.fresh === 1 ? '' : 's'} ready.
            </>
          ) : (
            <>All caught up. Import more questions to keep going.</>
          )}
        </p>
        <div className="today-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={onPractice}
            disabled={counts.due === 0 && counts.fresh === 0}
          >
            {counts.due > 0 ? '⟳ Start review' : '▶ Start practice'}
          </button>
          <button className="btn btn-gold" onClick={onImport}>
            ＋ Import questions
          </button>
        </div>
        <p className="today-rule">
          Reviews come first, in random order. New questions unlock only once every review is
          answered correctly — the way you learn NeetCode.
        </p>
      </section>

      {/* ---- browse ---- */}
      <div className="filters" role="group" aria-label="Filters">
        {TRACKS.map((t) => (
          <button
            key={t}
            className={`chip ${track === t ? 'active' : ''}`}
            onClick={() => setTrack(t)}
          >
            {t}
          </button>
        ))}
        <span style={{ width: 10 }} />
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            className={`chip ${difficulty === d ? 'active' : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 18 }}>
        Browse <span className="count">{filtered.length} questions</span>
        {!nothingDue && (
          <span className="count" style={{ color: 'var(--gold)' }}>
            {' '}
            · free practice doesn&apos;t enforce the review gate
          </span>
        )}
      </h2>

      {groups.map(([pattern, qs]) => (
        <section key={pattern} className="pattern-group">
          <h3 className="pattern-head">
            {pattern}
            <span className="count">
              {qs.filter((q) => isSolved(progress.solved[q.id])).length}/{qs.length}
            </span>
          </h3>
          <div className="q-list">
            {qs.map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                level={masteryLevel(progress, q.id)}
                due={isDue(progress.srs[q.id], today)}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      ))}
      {filtered.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No problems match.</p>}
    </div>
  );
}
