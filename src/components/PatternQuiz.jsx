import { useState } from 'react';
import { buildQuizRound } from '../state/patternQuiz.js';
import { PATTERN_GUIDE } from '../data/patternGuide.js';

// Pattern-recognition drill: read a problem, name its pattern. This trains the
// single most valuable interview reflex — seeing which technique a problem wants
// before writing any code.

const REACH_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p]));

export default function PatternQuiz({ questions, onExit }) {
  const [round, setRound] = useState(() => buildQuizRound(questions, 10));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null); // key the user picked, or null
  const [score, setScore] = useState(0);

  const item = round[idx];
  const done = idx >= round.length;
  const answered = chosen !== null;
  const correct = answered && chosen === item?.correctKey;

  function pick(key) {
    if (answered) return;
    setChosen(key);
    if (key === item.correctKey) setScore((s) => s + 1);
  }
  function next() {
    setChosen(null);
    setIdx((i) => i + 1);
  }
  function restart() {
    setRound(buildQuizRound(questions, 10));
    setIdx(0);
    setChosen(null);
    setScore(0);
  }

  if (done) {
    const pct = Math.round((score / round.length) * 100);
    return (
      <div className="stats quiz">
        <h1>Pattern quiz — results</h1>
        <div className={`quiz-result ${pct >= 70 ? 'good' : ''}`}>
          You named <strong>{score}</strong> of {round.length} patterns correctly ({pct}%).
          {pct >= 70
            ? ' Sharp — that recognition is exactly what saves you in the room.'
            : ' Skim the Patterns page and go again — the cues are what to memorise.'}
        </div>
        <div className="quiz-actions">
          <button className="btn btn-primary" onClick={restart}>
            Another round
          </button>
          <button className="btn" onClick={onExit}>
            Back to Patterns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stats quiz">
      <div className="quiz-bar">
        <button className="icon-btn" onClick={onExit} aria-label="Quit quiz">
          ✕
        </button>
        <span className="quiz-count">
          {idx + 1} / {round.length}
        </span>
        <span className="quiz-score">✓ {score}</span>
      </div>

      <h1 className="quiz-h1">Which pattern would you reach for?</h1>
      <div className="quiz-card">
        <div className="quiz-title">{item.title}</div>
        <p className="quiz-prompt">{item.prompt}</p>
      </div>

      <div className="quiz-options">
        {item.options.map((o) => {
          const isCorrect = o.key === item.correctKey;
          const cls = !answered
            ? ''
            : isCorrect
              ? 'correct'
              : o.key === chosen
                ? 'wrong'
                : 'dim';
          return (
            <button
              key={o.key}
              className={`quiz-option ${cls}`}
              onClick={() => pick(o.key)}
              disabled={answered}
            >
              {o.name}
              {answered && isCorrect && <span className="quiz-tick">✓</span>}
              {answered && o.key === chosen && !isCorrect && <span className="quiz-cross">✗</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`quiz-feedback ${correct ? 'good' : 'bad'}`}>
          <strong>{correct ? 'Right.' : `It's ${REACH_BY_KEY[item.correctKey].name}.`}</strong>{' '}
          {REACH_BY_KEY[item.correctKey].when}
          <button className="btn btn-primary quiz-next" onClick={next}>
            {idx + 1 === round.length ? 'See results →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
