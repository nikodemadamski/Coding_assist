import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { solveDebrief } from '../state/solveDebrief.js';
import { formatDuration } from '../state/mockSession.js';
import { pathStep } from '../data/roadmap.js';
import { useAnime } from '../anim/useAnime.js';
import { presets } from '../anim/presets.js';

// The moment you clear a question.
//
// This used to be one line of grey-green text wedged above the results, which
// is a strange thing to do with the most rewarding event in the app. It is now
// the loudest thing on the pane for as long as it is there: a headline, the
// three facts worth reading (how fast against the pace you are graded on, when
// it comes back, how many times you have now cleared it) and exactly one
// action — the next question.
//
// All the reasoning lives in state/solveDebrief.js; this only draws it.
export default function SolvedPanel({ question, progress, solveMs, nextQuestion, onOpenNext }) {
  const d = solveDebrief({ question, progress, solveMs });
  const play = useAnime();
  const root = useRef(null);

  // A short entrance, once. The panel appears in place of nothing, so without
  // it the pane simply jumps — and this is the beat that deserves the motion.
  useEffect(() => {
    if (!root.current) return;
    play(root.current.querySelectorAll('[data-pop]'), presets.enter());
  }, [play, question.id]);

  const target = formatDuration(d.pace.target);
  const step = nextQuestion ? pathStep(nextQuestion.id) : null;

  return (
    <div className={`solved-panel band-${d.pace.band ?? 'none'}`} ref={root}>
      <div className="solved-mark" aria-hidden="true" data-pop>
        <Check size={20} strokeWidth={3.2} />
      </div>
      <div className="solved-head" data-pop>
        <h3 className="solved-title">{d.headline}</h3>
        <p className="solved-line">{d.line}</p>
      </div>

      <dl className="solved-facts" data-pop>
        {solveMs != null && (
          <div className="solved-fact">
            <dt>Your time</dt>
            <dd>
              <span className="solved-fact-n">{formatDuration(solveMs)}</span>
              <span className="solved-fact-sub">target {target}</span>
            </dd>
          </div>
        )}
        {d.review && (
          <div className="solved-fact">
            <dt>Next review</dt>
            <dd>
              <span className="solved-fact-n">{d.review.phrase}</span>
              <span className="solved-fact-sub" title={d.review.due}>
                spaced repetition
              </span>
            </dd>
          </div>
        )}
        <div className="solved-fact">
          <dt>Cleared</dt>
          <dd>
            <span className="solved-fact-n">
              {d.solves}
              <span className="solved-fact-x">×</span>
            </span>
            <span className="solved-fact-sub">all time</span>
          </dd>
        </div>
      </dl>

      {/* The pace sentence only appears when there is a time to judge. */}
      {d.pace.line && (
        <p className={`solved-pace pace-${d.pace.band}`} data-pop>
          {d.pace.line}
        </p>
      )}

      {nextQuestion && onOpenNext && (
        <button className="btn btn-primary solved-next" onClick={() => onOpenNext(nextQuestion.id)} data-pop>
          {step ? `Next — step ${step} · ` : 'Next question — '}
          {nextQuestion.title}
          <span className="cue-orb" aria-hidden="true">
            →
          </span>
        </button>
      )}
    </div>
  );
}
