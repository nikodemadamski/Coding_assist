import { useMemo, useState } from 'react';
import {
  isDue,
  isSolved,
  masteryLevel,
  practiceCounts,
  todayStr,
} from '../state/progress.js';
import { todaysMisses, isGoalMetToday } from '../state/activity.js';
import { ROADMAP, categoryKeyOf, categoryOf, byPathOrder, pathStep, nextOnPath } from '../data/roadmap.js';

const TRACKS = ['all', 'python', 'pandas', 'sql'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const MASTERY_LABEL = {
  new: 'new',
  learning: 'learning',
  reviewing: 'reviewing',
  mastered: 'mastered',
};

function QuestionRow({ q, level, due, isNext, onOpen }) {
  const step = pathStep(q.id);
  return (
    <button className={`q-card ${isNext ? 'q-next' : ''}`} onClick={() => onOpen(q.id)}>
      <span className={`mastery-dot dot-${level}`} aria-hidden="true" />
      {step && <span className="step-num">{step}</span>}
      <span className="q-title">
        {q.title}
        {isNext && <span className="you-are-here">← you are here</span>}
      </span>
      <span className="q-meta">
        {due && <span className="tag due-tag">⟳ due</span>}
        {q.imported && <span className="tag imported">imported</span>}
        <span className={`tag diff-${q.difficulty}`}>{q.difficulty}</span>
        <span className={`pill pill-${level}`}>{MASTERY_LABEL[level]}</span>
      </span>
    </button>
  );
}

export default function Picker({ questions, progress, onOpen, onPractice, onDrill, onImport }) {
  const [track, setTrack] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const today = todayStr();

  const counts = useMemo(() => practiceCounts(progress, questions, today), [progress, questions, today]);
  const solvedCount = useMemo(
    () => questions.filter((q) => isSolved(progress.solved[q.id])).length,
    [questions, progress]
  );
  const validIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);
  const missCount = useMemo(
    () => todaysMisses(progress).filter((id) => validIds.has(id)).length,
    [progress, validIds]
  );
  const goalMet = isGoalMetToday(progress);

  // Where you left off on the path — the next unsolved question in order.
  const nextUp = useMemo(
    () => nextOnPath(questions, (id) => isSolved(progress.solved[id])),
    [questions, progress]
  );
  const brandNew = solvedCount === 0;

  const filtered = questions.filter(
    (q) =>
      (track === 'all' || q.track === track) &&
      (difficulty === 'all' || q.difficulty === difficulty)
  );

  // NeetCode-style: group by roadmap category, questions in path order.
  const groups = useMemo(() => {
    const byCat = new Map();
    for (const q of filtered) {
      const key = categoryKeyOf(q.pattern);
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key).push(q);
    }
    return ROADMAP.filter((cat) => byCat.has(cat.key)).map((cat) => ({
      cat,
      qs: byCat.get(cat.key).sort(byPathOrder),
    }));
  }, [filtered]);

  const nothingDue = counts.due === 0;

  return (
    <div className="picker">
      {/* ---- Welcome (first visit, nothing solved yet) ---- */}
      {brandNew && (
        <section className="welcome-card">
          <h2>Welcome to the dojo 🥋</h2>
          <p>
            This is a <strong>{questions.length}-step path</strong> from &ldquo;I barely know
            Python&rdquo; to interview-ready — the same arc as NeetCode: warm-ups first, then
            hashing, pointers, windows, trees, graphs, and dynamic programming, with pandas and
            SQL on the way. You don&apos;t choose what to study; the path does. Just press the
            button, solve, and come back tomorrow.
          </p>
        </section>
      )}

      {/* ---- Today's Practice ---- */}
      <section className="today-card">
        <div className="today-head">
          <h2>Today&apos;s practice</h2>
          <span className="today-progress">
            step {Math.min(solvedCount + 1, questions.length)} of {questions.length}
          </span>
        </div>
        <p className="today-line">
          {counts.due > 0 ? (
            <>
              <strong className="due-num">{counts.due}</strong> review
              {counts.due === 1 ? '' : 's'} to clear
              {counts.fresh > 0 && <>, then the path continues</>}.
            </>
          ) : counts.fresh > 0 ? (
            <>No reviews due — the path is open.</>
          ) : (
            <>All caught up. Import more questions to keep going.</>
          )}
        </p>
        {nextUp && (
          <p className="next-up">
            Next on your path:{' '}
            <button className="next-up-link" onClick={() => onOpen(nextUp.id)}>
              Step {pathStep(nextUp.id) ?? '—'} · {nextUp.title}
            </button>{' '}
            <span className="next-up-cat">({categoryOf(nextUp)?.label})</span>
          </p>
        )}
        <div className="today-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={onPractice}
            disabled={counts.due === 0 && counts.fresh === 0}
          >
            {counts.due > 0
              ? '⟳ Start review'
              : brandNew
                ? '▶ Begin the path'
                : '▶ Continue the path'}
          </button>
          {missCount > 0 && (
            <button className="btn btn-drill" onClick={onDrill}>
              🔥 Drill today&apos;s misses ({missCount})
            </button>
          )}
          <button className="btn btn-gold" onClick={onImport}>
            ＋ Import questions
          </button>
        </div>
        <p className={`today-goal ${goalMet ? 'met' : ''}`}>
          {goalMet ? (
            <>✓ Daily goal met — reviews cleared and at least one solved. Come back tomorrow.</>
          ) : (
            <>Daily goal: clear every due review and solve at least one question.</>
          )}
        </p>
        <p className="today-rule">
          Reviews come first, in random order — that&apos;s retrieval practice. Then new
          questions continue the path <em>in order</em>, exactly where you left off.
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

      {groups.map(({ cat, qs }) => (
        <section key={cat.key} className="pattern-group">
          <h3 className="pattern-head">
            <span>
              {cat.label}
              <span className="pattern-blurb">{cat.blurb}</span>
            </span>
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
                isNext={nextUp?.id === q.id}
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
