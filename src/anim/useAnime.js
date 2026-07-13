// The one place the app touches anime.js. A thin hook that plays a preset (or
// raw params) against element refs and honors prefers-reduced-motion — reduced
// motion runs the same animation with duration 0, so elements snap straight to
// their final resting state (every preset's last keyframe is the correct end
// state, so this is safe and needs no special-casing).
import { useCallback } from 'react';
import anime from 'animejs';
import { DUR } from './presets.js';

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Returns animate(targets, params) — targets is an element (or array), params
// is a preset object (or any anime.js props). Missing targets are a no-op so
// callers never need to guard refs.
export function useAnime() {
  const reduced = prefersReducedMotion();
  return useCallback(
    (targets, params = {}) => {
      if (!targets) return null;
      return anime({
        targets,
        ...params,
        duration: reduced ? 0 : (params.duration ?? DUR.base),
      });
    },
    [reduced]
  );
}
