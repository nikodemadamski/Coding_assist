import { useEffect, useRef } from 'react';
import { useAnime } from '../anim/useAnime.js';

// A number that counts up to its value when it lands on screen.
//
// A static "4" is a fact. A 0→4 that races up and settles is the same fact plus
// the feeling that it moved — which is the whole point of a progress number on
// a home screen. anime.js drives a plain object and we write the rounded value
// into the node, so there's no per-frame React render.
//
// useAnime collapses this to duration 0 under prefers-reduced-motion, which
// lands the final value immediately. The element's text is also the final value
// on first paint, so a run that never happens still shows the right number.
export default function CountUp({ value, duration = 1100, className = '', suffix = '' }) {
  const ref = useRef(null);
  const play = useAnime();
  const from = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const target = Number(value) || 0;
    const state = { n: from.current };
    from.current = target;
    if (target === state.n) {
      el.textContent = `${target}${suffix}`;
      return undefined;
    }
    play(state, {
      n: target,
      duration,
      ease: 'outExpo',
      onUpdate: () => {
        el.textContent = `${Math.round(state.n)}${suffix}`;
      },
      onComplete: () => {
        el.textContent = `${target}${suffix}`;
      },
    });
    return undefined;
  }, [value, duration, suffix, play]);

  return (
    <span className={className} ref={ref}>
      {value}
      {suffix}
    </span>
  );
}
