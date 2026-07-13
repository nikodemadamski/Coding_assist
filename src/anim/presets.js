// Named animation presets — the shared vocabulary the visual widgets compose
// with. All easings and durations live here so every animation across the app
// feels like one system (the "self-made connection" to anime.js: widgets speak
// presets, never raw anime.js params).

export const EASE = 'easeOutCubic';
export const DUR = { quick: 240, base: 420, slow: 640 };

export const presets = {
  // Glide an element to an absolute x offset (the list pointer sliding).
  slideTo: (x) => ({ translateX: x, duration: DUR.base, easing: EASE }),
  // A quick attention pulse (a cell being read).
  pulse: () => ({ scale: [1, 1.16, 1], duration: DUR.base, easing: 'easeInOutQuad' }),
  // Fade a new value in over the old (reassignment).
  fadeSwap: () => ({ opacity: [0, 1], duration: DUR.quick, easing: EASE }),
  // Pop a box into existence (push onto a stack, a new value appearing).
  popIn: () => ({ scale: [0.4, 1], opacity: [0, 1], duration: DUR.base, easing: 'easeOutBack' }),
  // Shade a region in (a slice range lighting up).
  shade: () => ({ opacity: [0, 1], duration: DUR.quick, easing: EASE }),
  // Slide a box up and out (pop off a stack).
  popOut: () => ({ translateY: [-4, -26], opacity: [1, 0], duration: DUR.base, easing: EASE }),
};
