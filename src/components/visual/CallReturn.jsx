import { useEffect, useRef } from 'react';
import { useTimeline, stagger } from '../../anim/useAnime.js';

function formatArg(v) {
  return String(v);
}

// A function call as a journey. Each beat: the argument values fly INTO the
// function box (staggered), the body computes, and the return value travels back
// out to the caller — sequenced on an anime.js v4 timeline. Makes the classic
// "print SHOWS, return HANDS BACK" distinction physical.
export default function CallReturn({ visual, beatIndex }) {
  const makeTimeline = useTimeline();
  const argRefs = useRef([]);
  const bodyRef = useRef(null);
  const returnRef = useRef(null);
  const resultRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const args = beat.args ?? [];

  useEffect(() => {
    const t = makeTimeline();
    const D = 260; // keep each step brisk so the whole call→return reads in ~1s
    const argEls = argRefs.current.filter(Boolean);
    if (argEls.length) t.add(argEls, { opacity: [0, 1], y: [12, 0], duration: D, delay: stagger(50) }, 0);
    if (bodyRef.current) t.add(bodyRef.current, { opacity: [0, 1], duration: D }, '+=40');
    if (returnRef.current) t.add(returnRef.current, { opacity: [0, 1], scale: [0.7, 1], duration: D }, '+=40');
    if (resultRef.current) t.add(resultRef.current, { opacity: [0, 1], x: [-16, 0], duration: D }, '+=30');
    return () => t.cancel?.();
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-call" key={beatIndex}>
      <div className="vw-cr-caller">
        <code className="vw-cr-call">
          {beat.into ? `${beat.into} = ` : ''}
          {beat.func}({args.map(formatArg).join(', ')})
        </code>
        <span className="vw-cr-result" ref={resultRef}>
          {beat.into ? beat.into : 'shown'} = <strong>{formatArg(beat.returns)}</strong>
        </span>
      </div>
      <div className="vw-cr-fn">
        <span className="vw-cr-fn-name">def {beat.func}(…)</span>
        {args.length > 0 && (
          <div className="vw-cr-args">
            {args.map((a, i) => (
              <span key={i} ref={(el) => (argRefs.current[i] = el)} className="vw-cr-arg">
                {formatArg(a)}
              </span>
            ))}
          </div>
        )}
        {beat.body && (
          <div className="vw-cr-body" ref={bodyRef}>
            <code>{beat.body}</code>
          </div>
        )}
        <div className="vw-cr-return" ref={returnRef}>
          <span className="vw-cr-return-kw">return</span> <strong>{formatArg(beat.returns)}</strong>
        </div>
      </div>
    </div>
  );
}
