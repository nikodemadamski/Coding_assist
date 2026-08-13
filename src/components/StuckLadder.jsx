import { useState } from 'react';
import Markdown from './Markdown.jsx';
import Approaches from './Approaches.jsx';
import { patternHint } from '../data/patternHints.js';
import { guideKeyOf } from '../data/patternGuide.js';
import { lessonsForQuestion } from '../data/lessonLinks.js';
import { lessonById } from '../data/lessons.js';

// The "I'm stuck" ladder. Instead of one hint and then the whole solution
// spoiler, you climb one rung at a time — each reveals a little more, so you
// stay here and learn instead of bouncing to YouTube:
//   1. which pattern is this?   2. a nudge   3. the plan   4. the code
// A YouTube search link waits at the very bottom, for when you truly want to
// hear someone else explain it.
// `hideInsight` drops the last rung: once a question is solved ProblemView
// shows the take-away as its own block, and the folded ladder must not repeat
// it two inches below.
export default function StuckLadder({
  question,
  progress,
  onVisualize,
  onSeePattern,
  onOpenLesson,
  hideInsight = false,
}) {
  const hint = patternHint(question);
  const missingLesson =
    onOpenLesson && progress
      ? lessonById(lessonsForQuestion(question, progress)[0] ?? '')
      : null;

  const rungs = [
    {
      key: 'pattern',
      label: 'Which pattern is this?',
      teaser: 'Name the technique before you write a line.',
      body: (
        <div className="rung-body">
          <p>
            <strong>Spot it:</strong> {hint.tell}
          </p>
          <p>
            <strong>Reach for:</strong> {hint.reach}
          </p>
          {onSeePattern && guideKeyOf(question) && (
            <button
              className="rung-link"
              onClick={() => onSeePattern(guideKeyOf(question))}
            >
              See the full pattern template →
            </button>
          )}
          {missingLesson && (
            <button className="rung-link" onClick={() => onOpenLesson(missingLesson.id)}>
              Missing a Python basic? · {missingLesson.title} in {missingLesson.minutes} min →
            </button>
          )}
        </div>
      ),
    },
    question.hint && {
      key: 'nudge',
      label: 'Give me a nudge',
      teaser: 'One idea to unstick you — then go try again.',
      body: (
        <div className="rung-body">
          <Markdown text={question.hint} />
        </div>
      ),
    },
    question.approach && {
      key: 'plan',
      label: 'Walk me through the plan',
      teaser: 'The whole strategy in plain English — how the solution actually works.',
      body: (
        <div className="rung-body">
          <Markdown text={question.approach} />
        </div>
      ),
    },
    {
      key: 'code',
      label:
        question.approaches?.length > 1
          ? 'Show the code — brute force → optimal'
          : 'Show the code (last resort)',
      teaser: 'The full solution. Read it, then close it and rebuild it from memory.',
      body: (
        <div className="rung-body">
          <Approaches question={question} onVisualize={onVisualize} />
        </div>
      ),
    },
    // The "go deeper" essay used to be its own disclosure further down the
    // column, which meant two separate places to look for an explanation. It
    // is the same ladder, one rung further: read it AFTER the code, when the
    // shape is fresh and the generalisation can land.
    !hideInsight &&
      question.insight && {
        key: 'insight',
        label: 'Why it works, and why it is worth knowing',
        teaser: 'The generalisation — what this technique buys you on the next problem.',
        body: (
          <div className="rung-body">
            <Markdown text={question.insight} />
          </div>
        ),
      },
  ].filter(Boolean);

  const [open, setOpen] = useState(0); // number of rungs revealed so far

  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${question.title} leetcode explained`
  )}`;

  return (
    <div className="stuck">
      <div className="stuck-head">
        <span className="stuck-title">Stuck? Climb one rung at a time.</span>
        <span className="stuck-sub">
          Each rung tells you a bit more. Try the problem again before you take the next one — the
          struggle is where the learning is.
        </span>
      </div>

      {rungs.map((r, i) => {
        if (i < open) {
          return (
            <div className="stuck-rung open" key={r.key}>
              <div className="stuck-rung-top">
                <span className="stuck-rung-label">
                  <span className="stuck-rung-num">Step {i + 1}</span>
                  {r.label}
                </span>
              </div>
              {r.body}
            </div>
          );
        }
        if (i === open) {
          return (
            <button className="stuck-rung stuck-next" key={r.key} onClick={() => setOpen(open + 1)}>
              <span className="stuck-rung-label">
                <span className="stuck-rung-num">Step {i + 1}</span>
                {r.label}
                <span className="stuck-rung-teaser">{r.teaser}</span>
              </span>
              <span className="stuck-reveal-cue">Reveal →</span>
            </button>
          );
        }
        return null; // rungs beyond the next one stay hidden until you climb
      })}

      {open >= rungs.length && (
        <a className="stuck-youtube" href={ytUrl} target="_blank" rel="noopener noreferrer">
          Still fuzzy? Hear someone explain &ldquo;{question.title}&rdquo; on YouTube ↗
        </a>
      )}
    </div>
  );
}
