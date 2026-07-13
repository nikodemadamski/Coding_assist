import { useEffect, useRef } from 'react';
import { useAnime, stopAnim } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

// Text as something that BUILDS. Each beat is a resulting string (with the
// expression that produced it shown above); on tap the text reveals itself with
// a randomized character scramble (anime.js v4 scrambleText) — so concatenation,
// repetition, f-string fill-in and print output become "watch the text appear"
// instead of a wall of predict prompts.
export default function TextReveal({ visual, beatIndex }) {
  const animate = useAnime();
  const textRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};

  useEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;
    stopAnim(el); // kill any in-flight scramble so it can't overwrite the new text
    el.textContent = beat.text; // the scramble target must already be in place
    animate(el, presets.scramble());
    // On beat change, stop this scramble before the next one starts (overlapping
    // innerHTML tweens otherwise fight and revert to the previous text).
    return () => stopAnim(el);
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-textreveal">
      {beat.sub && (
        <div className="vw-tr-expr">
          <code>{beat.sub}</code>
          <span className="vw-tr-arrow" aria-hidden="true">→</span>
        </div>
      )}
      {/* Fresh node per beat (key) so anime's innerHTML scramble never fights
          React reconciling the previous beat's text onto the same element. */}
      <p key={beatIndex} className="vw-tr-text" ref={textRef}>
        {beat.text}
      </p>
    </div>
  );
}
