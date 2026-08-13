import { useEffect, useMemo, useState } from 'react';
import {
  isSolved,
  masteryLevel,
  practiceCounts,
  solvedCount,
  todayStr,
} from '../state/progress.js';
import { todaysMisses, isGoalMetToday } from '../state/activity.js';
import { ROADMAP, categoryKeyOf, categoryOf, byPathOrder, pathStep, nextOnPath } from '../data/roadmap.js';
import { useReveal } from '../anim/useReveal.js';
import { STATUSES, filterQuestions, statusCounts, questionStatus } from '../state/questionFilter.js';
import { Search, X } from 'lucide-react';

const TRACKS = ['all', 'python', 'pandas', 'sql'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];
// Three chips reading "all" sat on one screen — one per filter row — and none
// of them said what they were all OF. The value stays 'all'; only the label
// tells you which axis you are clearing.
const CHIP_LABEL = { track: { all: 'all tracks' }, difficulty: { all: 'any level' } };

const MASTERY_LABEL = {
  new: 'new',
  learning: 'learning',
  reviewing: 'reviewing',
  mastered: 'mastered',
};

function QuestionRow({ q, level, due, solved, mistakes, isNext, onOpen }) {
  const step = pathStep(q.id);
  return (
    <button
      className={`q-card ${isNext ? 'q-next' : ''} ${solved ? 'is-solved' : ''}`}
      onClick={() => onOpen(q.id)}
    >
      {/* A tick, not a coloured dot: whether you've done this is the first
          thing you ask of a row in a question bank, and it should survive a
          squint from across the desk. */}
      <span className={`q-mark ${solved ? 'done' : ''}`} aria-hidden="true">
        {solved ? '✓' : ''}
      </span>
      {step && <span className="step-num">{step}</span>}
      <span className="q-title">
        {q.title}
        {isNext && <span className="you-are-here">← you are here</span>}
      </span>
      <span className="q-meta">
        {mistakes > 0 && (
          <span className="tag miss-tag" title={`${mistakes} wrong submits`}>
            ✗{mistakes}
          </span>
        )}
        {due && <span className="tag due-tag">due</span>}
        {q.imported && <span className="tag imported">imported</span>}
        <span className={`tag diff-${q.difficulty}`}>{q.difficulty}</span>
        {/* `new` is what the missing tick already says and `learning` is the
            default the moment you solve one; neither earns a pill. Reviewing
            and mastered do — those you want to see. */}
        {(level === 'reviewing' || level === 'mastered') && (
          <span className={`pill pill-${level}`}>{MASTERY_LABEL[level]}</span>
        )}
      </span>
    </button>
  );
}

export default function Picker({
  questions,
  progress,
  focusCategory,
  onOpen,
  onPractice,
  onDrill,
  onWarmup,
  onImport,
}) {
  const [track, setTrack] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const today = todayStr();

  // Arriving from the roadmap graph: scroll to the chosen category section.
  useEffect(() => {
    if (focusCategory) {
      document.getElementById(`cat-${focusCategory}`)?.scrollIntoView({ block: 'start' });
    }
  }, [focusCategory]);

  const counts = useMemo(() => practiceCounts(progress, questions, today), [progress, questions, today]);
  // The shared count — see state/progress.js.
  const solveTotal = useMemo(() => solvedCount(progress, questions), [questions, progress]);
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
  const brandNew = solveTotal === 0;

  const filters = { track, difficulty, status, query };
  const filtered = useMemo(
    () => filterQuestions(questions, filters, progress, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, progress, today, track, difficulty, status, query]
  );
  // The chips carry the count they'd return under the *other* live filters, so
  // clicking one never lands you in an empty list you couldn't see coming.
  const counts0 = useMemo(
    () => statusCounts(questions, { track, difficulty, query }, progress, today),
    [questions, progress, today, track, difficulty, query]
  );
  const clearAll = () => {
    setTrack('all');
    setDifficulty('all');
    setStatus('all');
    setQuery('');
  };
  const narrowed = track !== 'all' || difficulty !== 'all' || status !== 'all' || query !== '';

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

  const revealRef = useReveal('browse');

  return (
    <div className="picker" ref={revealRef}>
      {/* ---- Welcome (first visit, nothing solved yet) ---- */}
      {brandNew && (
        <section className="welcome-card" data-reveal>
          <h2>Welcome to the dojo</h2>
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
      <section className="today-card" data-reveal>
        <div className="today-head">
          <h2>Today&apos;s practice</h2>
          <span className="today-progress">
            {solveTotal} of {questions.length} solved
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
              ? 'Start review'
              : brandNew
                ? 'Begin the path'
                : 'Continue the path'}
          </button>
          <button
            className="btn btn-warmup"
            onClick={onWarmup}
            title="Rapid-fire Python one-liners against the clock — stretch before the workout"
          >
            Warm-up
          </button>
          {missCount > 0 && (
            <button className="btn btn-drill" onClick={onDrill}>
              Drill today&apos;s misses ({missCount})
            </button>
          )}
          <button className="btn btn-gold" onClick={onImport}>
            ＋ Import questions
          </button>
        </div>
        <p className={`today-goal ${goalMet ? 'met' : ''}`}>
          {goalMet ? (
            <>✓ Daily goal met — reviews cleared and at least one solved.</>
          ) : (
            <>Daily goal: clear every due review, then solve at least one.</>
          )}
        </p>
      </section>

      {/* ---- the bank ----------------------------------------------------
          159 questions with only a track and a difficulty filter meant the only
          way to find one was to remember roughly where it lived. The three
          questions you actually ask it are "where's that dictionary one",
          "what haven't I done", and "what keeps biting me" — so it now answers
          all three, and every chip carries the count it would return. */}
      <div className="bank-bar" data-reveal>
        <label className="bank-search">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            className="bank-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a question — title, pattern, track…"
            aria-label="Find a question"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              className="bank-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear the search"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          )}
        </label>

        <div className="filters bank-filters" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className={`chip ${status === s.key ? 'active' : ''} ${counts0[s.key] === 0 ? 'is-empty' : ''}`}
              onClick={() => setStatus(s.key)}
              aria-pressed={status === s.key}
            >
              {s.label}
              <span className="chip-n">{counts0[s.key]}</span>
            </button>
          ))}
        </div>

        <div className="filters bank-filters" role="group" aria-label="Track and difficulty">
          {TRACKS.map((t) => (
            <button
              key={t}
              className={`chip ${track === t ? 'active' : ''}`}
              onClick={() => setTrack(t)}
              aria-pressed={track === t}
            >
              {CHIP_LABEL.track[t] ?? t}
            </button>
          ))}
          <span className="bank-gap" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`chip ${difficulty === d ? 'active' : ''}`}
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
            >
              {CHIP_LABEL.difficulty[d] ?? d}
            </button>
          ))}
          {narrowed && (
            <button className="chip bank-clear" onClick={clearAll}>
              clear
            </button>
          )}
        </div>
      </div>

      <h2 className="bank-head" data-reveal>
        {narrowed ? 'Matching questions' : 'The whole bank'}
        <span className="count">
          {filtered.length} of {questions.length}
        </span>
        {!nothingDue && (
          <span className="count bank-head-note">
browse anything — reviews only gate the Start review button
          </span>
        )}
      </h2>

      {groups.map(({ cat, qs }) => (
        <section key={cat.key} id={`cat-${cat.key}`} className="pattern-group" data-reveal>
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
                {...questionStatus(progress, q, today)}
                isNext={nextUp?.id === q.id}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      ))}
      {filtered.length === 0 && (
        <div className="bank-empty" data-reveal>
          <p className="bank-empty-line">Nothing matches that.</p>
          <p className="bank-empty-hint">
            {query
              ? `No question's title, pattern or track contains "${query}".`
              : 'Try a wider status, or a different track.'}
          </p>
          <button className="btn" onClick={clearAll}>
            Clear the filters
          </button>
        </div>
      )}
    </div>
  );
}
