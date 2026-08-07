// What the mascot's face is doing, and why.
//
// Two kinds of feeling, and the difference matters:
//
// **Ambient** is where you are. Open a problem and he settles into the serious,
// slightly severe face of someone watching you work; type and he leans further
// into it. It has no end — it's the room, not an event.
//
// **A pulse** is something that just happened. You passed, you failed, you
// submitted. It overrides the ambient face completely at first, then fades back
// into it over a couple of seconds, because a reaction that never ends is a
// mask, not a reaction.
//
// The renderer only ever asks one question — "what should the face look like
// right now" — and gets five numbers back. Everything here is pure, so
// tests/mood-tests.mjs can pin every expression without a canvas.

// Five channels, each -1..1 (except mouth, which goes to 1.6 for a real grin):
//   brow    -1 knitted and low (severe)  ·  +1 raised (delighted, surprised)
//   squint   0 wide open  ·  1 narrowed to a concentrating slit
//   mouth   -1 frown  ·  0 flat  ·  1 the resting smile  ·  1.6 a grin
//   bounce   a vertical hop, decaying
//   shake    a horizontal no, decaying
export const MOODS = {
  idle: { brow: 0, squint: 0, mouth: 1, bounce: 0, shake: 0 },
  // The lecturer. Watching, not smiling, not unkind.
  focus: { brow: -0.55, squint: 0.34, mouth: 0.12, bounce: 0, shake: 0 },
  // Tests went green.
  pass: { brow: 0.85, squint: -0.25, mouth: 1.6, bounce: 1, shake: 0 },
  // Recorded. He knew you had it.
  proud: { brow: 0.5, squint: -0.1, mouth: 1.35, bounce: 0.55, shake: 0 },
  // Not this time.
  fail: { brow: -0.9, squint: 0.2, mouth: -0.85, bounce: 0, shake: 1 },
  // Something broke rather than being wrong — a smaller, sympathetic version.
  oops: { brow: -0.45, squint: 0.1, mouth: -0.35, bounce: 0, shake: 0.45 },
  // A belt, a streak milestone.
  cheer: { brow: 1, squint: -0.3, mouth: 1.6, bounce: 1, shake: 0 },
};

// How long each reaction holds before it melts back into the room's face.
export const PULSE_MS = {
  pass: 2600,
  proud: 3200,
  fail: 2400,
  oops: 1800,
  cheer: 3600,
};

// Rooms where he's supervising rather than idling.
const WORKING_VIEWS = new Set(['problem', 'practice', 'drill', 'mock', 'lesson', 'warmup']);

export function ambientKind(view) {
  return WORKING_VIEWS.has(view) ? 'focus' : 'idle';
}

const CHANNELS = ['brow', 'squint', 'mouth', 'bounce', 'shake'];

function blend(a, b, t) {
  const out = {};
  for (const k of CHANNELS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

// Ambient face for a room, deepened by how hard you're typing. Typing in a
// lobby shouldn't make him stern, so the deepening only applies where he's
// already working.
export function ambientFace(view, typing = 0) {
  const kind = ambientKind(view);
  if (kind !== 'focus') return { ...MOODS.idle };
  // At rest in a working room he's already serious; typing pushes further.
  return blend(MOODS.focus, { ...MOODS.focus, squint: 0.55, brow: -0.75 }, Math.min(1, typing));
}

// The one question the renderer asks. `now` and `pulseAt` are millisecond
// clocks — any monotonic pair will do, which is what makes this testable.
export function expressionFor({ pulse = null, pulseAt = 0, view = 'home', typing = 0, now = 0 } = {}) {
  const base = ambientFace(view, typing);
  if (!pulse || !MOODS[pulse]) return base;
  const life = PULSE_MS[pulse] ?? 2000;
  const age = now - pulseAt;
  if (age < 0 || age >= life) return base;
  // Hold near full for the first third, then ease back. A reaction that starts
  // fading immediately reads as a flinch rather than a feeling.
  const t = age / life;
  const strength = t < 0.34 ? 1 : 1 - (t - 0.34) / 0.66;
  const face = blend(base, MOODS[pulse], strength);
  // bounce and shake are impulses: they spend themselves early rather than
  // riding the whole decay.
  const impulse = Math.max(0, 1 - t * 2.4);
  face.bounce = MOODS[pulse].bounce * impulse;
  face.shake = MOODS[pulse].shake * impulse;
  return face;
}

// A one-line description of the face, for the logo's accessible name. A mascot
// that visibly reacts and says nothing is a joke only sighted users are in on.
export const MOOD_LABEL = {
  idle: null,
  focus: 'watching you work',
  pass: 'delighted',
  proud: 'proud of you',
  fail: 'wincing',
  oops: 'sympathetic',
  cheer: 'celebrating',
};

export function moodLabel({ pulse = null, pulseAt = 0, view = 'home', now = 0 } = {}) {
  if (pulse && MOODS[pulse] && now - pulseAt < (PULSE_MS[pulse] ?? 2000) && now >= pulseAt) {
    return MOOD_LABEL[pulse];
  }
  return MOOD_LABEL[ambientKind(view)];
}
