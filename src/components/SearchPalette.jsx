import { useEffect, useMemo, useRef, useState } from 'react';
import { isSolved, masteryLevel } from '../state/progress.js';
import { pathStep } from '../data/roadmap.js';

// Global quick-open: Ctrl/⌘+K (or "/", or the header Search) from anywhere.
// Type a few letters, arrow through the matches, Enter to jump straight in.

const MAX_RESULTS = 12;

function rank(q, needle) {
  const title = q.title.toLowerCase();
  if (title.startsWith(needle)) return 0;
  if (title.includes(needle)) return 1;
  const hay = `${q.pattern} ${q.track} ${q.difficulty}`.toLowerCase();
  if (hay.includes(needle)) return 2;
  return -1;
}

export default function SearchPalette({ questions, progress, onOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => inputRef.current?.focus(), []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      // Empty query: show where you are — the next few unsolved steps.
      return questions
        .filter((q) => !isSolved(progress.solved[q.id]) && pathStep(q.id))
        .sort((a, b) => pathStep(a.id) - pathStep(b.id))
        .slice(0, MAX_RESULTS);
    }
    return questions
      .map((q) => ({ q, r: rank(q, needle) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || (pathStep(a.q.id) ?? 999) - (pathStep(b.q.id) ?? 999))
      .slice(0, MAX_RESULTS)
      .map((x) => x.q);
  }, [query, questions, progress]);

  useEffect(() => setCursor(0), [query]);

  // Keep the highlighted row in view while arrowing.
  useEffect(() => {
    listRef.current
      ?.querySelector('.palette-row.active')
      ?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  function handleKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault();
      onOpen(results[cursor].id);
    }
  }

  return (
    <div
      className="modal-backdrop palette-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search questions">
        <input
          ref={inputRef}
          className="palette-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Search ${questions.length} questions — title, pattern, track…`}
          spellCheck="false"
          aria-label="Search questions"
        />
        <div className="palette-list" ref={listRef} role="listbox">
          {results.map((q, i) => {
            const level = masteryLevel(progress, q.id);
            const step = pathStep(q.id);
            return (
              <button
                key={q.id}
                role="option"
                aria-selected={i === cursor}
                className={`palette-row ${i === cursor ? 'active' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => onOpen(q.id)}
              >
                <span className={`mastery-dot dot-${level}`} aria-hidden="true" />
                {step && <span className="step-num">{step}</span>}
                <span className="palette-title">
                  {isSolved(progress.solved[q.id]) && <span style={{ color: 'var(--jade)' }}>✓ </span>}
                  {q.title}
                </span>
                <span className="q-meta">
                  <span className={`tag track-${q.track}`}>{q.track}</span>
                  <span className={`tag diff-${q.difficulty}`}>{q.difficulty}</span>
                </span>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="palette-empty">Nothing matches &ldquo;{query}&rdquo;.</p>
          )}
        </div>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
          {!query && <span className="palette-foot-note">showing your next steps on the path</span>}
        </div>
      </div>
    </div>
  );
}
