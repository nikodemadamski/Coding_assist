// Named animation presets — the shared vocabulary the visual widgets compose
// with. All easings and durations live here so every animation across the app
// feels like one system (the "self-made connection" to anime.js v4: widgets
// speak presets, never raw anime.js params).
import { spring, stagger, scrambleText } from 'animejs';

export const DUR = { quick: 240, base: 420, slow: 640 };

// anime.js v4's signature feel: a spring settles with real physics instead of a
// fixed easing curve, so the pointer and boxes arrive with a little life and a
// hint of overshoot. One shared spring keeps every widget consistent.
const settle = spring({ stiffness: 130, damping: 14 });

export const presets = {
  // Glide an element to an absolute x offset (the list pointer sliding) — spring
  // physics so it eases in and gently settles rather than stopping dead.
  slideTo: (x) => ({ x, ease: settle }),
  // The same, vertically (a flow marker dropping to the branch that runs).
  glideY: (y) => ({ y, ease: settle }),
  // A quick attention pulse (a cell being read).
  pulse: () => ({ scale: [1, 1.18, 1], duration: DUR.base, ease: 'inOutQuad' }),
  // Fade a new value in over the old, rising slightly into place (reassignment).
  fadeSwap: () => ({ opacity: [0, 1], y: [8, 0], duration: DUR.quick, ease: 'outCubic' }),
  // Pop a box into existence with a springy bounce (push, a new value appearing).
  popIn: () => ({ scale: [0.4, 1], opacity: [0, 1], ease: settle }),
  // Shade a region in (a slice range lighting up).
  shade: () => ({ opacity: [0, 1], duration: DUR.quick, ease: 'outCubic' }),
  // Slide a box up and out (pop off a stack).
  popOut: () => ({ y: [0, -26], opacity: [1, 0], duration: DUR.base, ease: 'inCubic' }),
  // A staggered spring entrance for a whole group of cells at once — anime.js's
  // flagship move (delay: stagger). Fed an array/NodeList of targets on mount.
  enter: () => ({ scale: [0.6, 1], opacity: [0, 1], ease: settle, delay: stagger(45) }),
  // A whole view arriving: each tagged block rises and fades in, one beat after
  // the next. Deliberately NOT a spring — body copy that overshoots reads as
  // jitter, so this is a heavy, single-direction settle (see useReveal).
  reveal: (step = 45) => ({
    opacity: [0, 1],
    y: [18, 0],
    duration: DUR.slow,
    ease: 'outCubic',
    delay: stagger(step),
  }),
  // Reveal an element's text with a randomized character scramble (anime.js v4
  // scrambleText) — the element's textContent must already be the target string;
  // this plays the scramble→settle. Teaches "this expression produces this text".
  scramble: () => ({ innerHTML: scrambleText(), duration: DUR.slow, ease: 'outQuad' }),
};
