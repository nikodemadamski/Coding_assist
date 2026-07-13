// The one place the app touches anime.js (v4). A thin hook that plays a preset
// (or raw params) against element refs and honors prefers-reduced-motion —
// reduced motion runs the same animation with duration 0 and a linear ease, so
// elements snap straight to their final resting state (every preset's last
// keyframe is the correct end state, so this is safe and needs no special-casing).
import { useCallback } from 'react';
import { animate, stagger } from 'animejs';
import { DUR } from './presets.js';

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Returns animate(targets, params) — targets is an element (or array/NodeList),
// params is a preset object (or any anime.js v4 props). Missing targets are a
// no-op so callers never need to guard refs. A spring ease (an object, not a
// name) carries its own duration, so we don't override it with a default.
export function useAnime() {
  const reduced = prefersReducedMotion();
  return useCallback(
    (targets, params = {}) => {
      if (!targets) return null;
      if (reduced) {
        return animate(targets, { ...params, ease: 'linear', duration: 0, delay: 0 });
      }
      const p = { ...params };
      const isSpring = p.ease && typeof p.ease === 'object';
      if (p.duration == null && !isSpring) p.duration = DUR.base;
      return animate(targets, p);
    },
    [reduced]
  );
}

// Re-exported so widgets can stagger a group of targets (v4's signature move)
// without importing anime.js directly — the wrapper stays the only touch point.
export { stagger };
