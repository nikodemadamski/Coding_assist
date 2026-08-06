// A surface that knows where your cursor is.
//
// Entrance animations play once and then the page is a photograph. This is the
// other half: an element that keeps responding while you're just sitting there
// with the mouse. It writes four custom properties and lets CSS do the rest —
//
//   --px, --py  pointer position inside the element, as a percentage
//   --rx, --ry  a tilt in degrees, proportional to how far from centre you are
//   --pin       1 while the pointer is inside, 0 when it leaves
//
// Writing custom properties rather than animating from JS is deliberate: the
// smoothing is a CSS transition, so it's interruption-safe by construction
// (move the mouse mid-settle and it just re-targets), it never fights React,
// and the only thing that changes per frame is a transform — no layout, no
// paint, no per-frame render.
//
// Updates are coalesced into one rAF, so a 1000Hz mouse still costs one write
// per frame. Under prefers-reduced-motion the hook does nothing at all: no
// listeners, no properties, and the CSS falls back to its static values.
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './useAnime.js';

export function usePointerField(tiltDeg = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let frame = 0;
    let pending = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { x, y } = pending;
      pending = null;
      el.style.setProperty('--px', `${x * 100}%`);
      el.style.setProperty('--py', `${y * 100}%`);
      if (tiltDeg) {
        // Away from centre in each axis, mapped to a rotation. Y drives rotateX
        // and X drives rotateY — that's what makes the card lean *towards* the
        // cursor rather than away from it.
        el.style.setProperty('--rx', `${(0.5 - y) * 2 * tiltDeg}deg`);
        el.style.setProperty('--ry', `${(x - 0.5) * 2 * tiltDeg}deg`);
      }
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pending = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      };
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const onEnter = () => el.style.setProperty('--pin', '1');
    const onLeave = () => {
      el.style.setProperty('--pin', '0');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [tiltDeg]);

  return ref;
}
