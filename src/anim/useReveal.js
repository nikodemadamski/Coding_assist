// Entrance choreography for a whole view.
//
// A view hands its root element to this hook and every `data-reveal` descendant
// cascades in on mount instead of the page popping into existence all at once.
// Content arriving in reading order is the single biggest "this feels alive"
// lever in the app, and it costs each view one ref plus an attribute per block.
//
// Two details make it safe rather than decorative:
//   * it runs in a LAYOUT effect, so anime sets the opening frame (opacity 0)
//     before the browser paints — no flash of finished layout, and nothing is
//     ever left invisible if the effect never runs, because the CSS baseline is
//     the finished state.
//   * the stagger step shrinks as the group grows, so a 60-row list still
//     finishes inside SPREAD_MS rather than trickling in for four seconds.
//
// Reduced motion is handled centrally by useAnime (duration 0, linear), so the
// same call snaps straight to the resting state.
import { useLayoutEffect, useRef } from 'react';
import { useAnime } from './useAnime.js';
import { presets } from './presets.js';

const SPREAD_MS = 620; // total time from the first block to the last one starting
const STEP_MIN = 12;
const STEP_MAX = 55;

// `key` re-plays the cascade whenever it changes (a route/tab switch). Returns
// the ref to spread onto the view's root element.
export function useReveal(key = null) {
  const ref = useRef(null);
  const play = useAnime();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const step = Math.max(STEP_MIN, Math.min(STEP_MAX, SPREAD_MS / els.length));
    play(els, presets.reveal(step));
  }, [key, play]);
  return ref;
}
