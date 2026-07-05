import { useMemo, useState } from 'react';
import { dueQuestionIds, isDue, todayStr } from '../state/progress.js';

const TRACKS = ['all', 'python', 'pandas', 'sql'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

function QuestionCard({ q, solved, due, onOpen }) {
  return (
    <button className="q-card" onClick={() => onOpen(q.id)}>
      <span className={`solved-mark ${due ? 'due-mark' : ''}`} aria-hidden="true">
        {due ? '⟳' : solved ? '✓' : ''}
      </span>
      <span className="sr-only">{due ? 'due for review' : solved ? 'solved' : 'unsolved'}</span>
      <span className="q-title">{q.title}</span>
      <span className="q-meta">
        {q.forged && <span className="tag forged">forged</span>}
        <span className="tag">{q.pattern}</span>
        <span className={`tag track-${q.track}`}>{q.track}</span>
        <span className={`tag diff-${q.difficulty}`}>{q.difficulty}</span>
      </span>
    </button>
  );
}

export default function Picker({ questions, progress, onOpen, onForge }) {
  const [track, setTrack] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const today = todayStr();

  const dueIds = useMemo(
    () => new Set(dueQuestionIds(progress, new Set(questions.map((q) => q.id)), today)),
    [progress, questions, today]
  );

  const filtered = questions.filter(
    (q) =>
      (track === 'all' || q.track === track) &&
      (difficulty === 'all' || q.difficulty === difficulty)
  );
  const dueList = questions.filter((q) => dueIds.has(q.id));

  return (
    <div className="picker">
      {dueList.length > 0 && (
        <section className="due-banner">
          <h2>
            ⟳ Due today <span className="count">{dueList.length} review(s)</span>
          </h2>
          <div className="q-list">
            {dueList.map((q) => (
              <QuestionCard key={q.id} q={q} solved due onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

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
        <span style={{ flex: 1 }} />
        <button className="btn btn-gold" onClick={onForge}>
          ✦ Forge new question
        </button>
      </div>

      <h2>
        Problems <span className="count">{filtered.length}</span>
      </h2>
      <div className="q-list">
        {filtered.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            solved={!!progress.solved[q.id]}
            due={isDue(progress.srs[q.id], today)}
            onOpen={onOpen}
          />
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No problems match.</p>}
      </div>
    </div>
  );
}
