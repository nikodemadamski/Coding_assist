// What the mascot is watching: your cursor, anywhere on screen, and your
// typing, wherever it lands.
//
// Both are module-level and shared. The mark is a 40px canvas in the corner —
// it must not own a window listener per instance, and nothing here may cause a
// React render, so the whole thing is refs read inside useFrame.
//
// Pointer is stored in raw client coordinates because the mascot needs the
// direction from *itself* to the cursor, and only it knows where it is.

export const beacon = {
  // Where the cursor is, in client pixels. Starts off-screen-ish so the eyes
  // rest looking forward until the pointer first moves.
  x: -1,
  y: -1,
  seen: false,
  // Typing: a timestamp of the last keystroke, and a counter that ticks once
  // per key so the mascot can bob on each one rather than once per burst.
  lastKeyAt: 0,
  keyCount: 0,
  // What just happened to you, and when. A pulse kind out of mascotMood's
  // MOODS ('pass' | 'fail' | 'proud' | 'oops' | 'cheer'), or null at rest.
  mood: null,
  moodAt: 0,
};

// The app tells the mascot that something happened. Deliberately NOT React
// state: a run finishing must not re-render the header, and the canvas is
// already reading this object every frame. Firing the same mood twice in a row
// restamps it, so two failures in a row wince twice.
// The canvas reads `beacon.mood` per frame and needs no notification. The
// *label* does: a mascot that visibly reacts and says nothing is a joke only
// sighted users are in on. This fires a handful of times per session, not per
// frame, so a React render on it is free.
const moodWatchers = new Set();
export function subscribeMood(fn) {
  moodWatchers.add(fn);
  return () => moodWatchers.delete(fn);
}

export function setMood(kind) {
  beacon.mood = kind || null;
  beacon.moodAt = performance.now();
  for (const fn of moodWatchers) fn(beacon.mood);
}

// Keys that mean "writing", as opposed to "navigating". Arrows and modifiers
// shouldn't make the mascot look busy.
function isTyping(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') return true;
  return e.key.length === 1;
}

let refs = 0;
let frame = 0;
let pending = null;

function flushPointer() {
  frame = 0;
  if (!pending) return;
  beacon.x = pending.x;
  beacon.y = pending.y;
  beacon.seen = true;
  pending = null;
}

function onMove(e) {
  pending = { x: e.clientX, y: e.clientY };
  if (!frame) frame = requestAnimationFrame(flushPointer);
}

function onKey(e) {
  if (!isTyping(e)) return;
  beacon.lastKeyAt = performance.now();
  beacon.keyCount++;
}

// Ref-counted so several watchers share one pair of listeners and the last one
// out puts them away.
export function watchBeacon() {
  if (refs++ === 0) {
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey, { passive: true });
  }
  return () => {
    if (--refs === 0) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
    }
  };
}

// How "mid-sentence" the mascot should look right now: 1 while you're typing,
// easing to 0 about a second after you stop.
export const TYPING_TAIL_MS = 900;
export function typingHeat(now = performance.now()) {
  const since = now - beacon.lastKeyAt;
  if (!beacon.lastKeyAt || since > TYPING_TAIL_MS) return 0;
  return 1 - since / TYPING_TAIL_MS;
}
