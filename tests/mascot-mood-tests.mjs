// Pure tests for the mascot's face: what it does at rest in each room, what it
// does when something happens, and how the two blend.
import {
  MOODS,
  MOOD_LABEL,
  PULSE_MS,
  ambientFace,
  ambientKind,
  expressionFor,
  moodLabel,
} from '../src/state/mascotMood.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

console.log('Mascot mood tests');

// --- the rooms -------------------------------------------------------------
check(ambientKind('problem') === 'focus', 'a problem puts him in the lecturer face');
check(ambientKind('practice') === 'focus', 'so does practice');
check(ambientKind('drill') === 'focus', 'and a drill');
check(ambientKind('mock') === 'focus', 'and the mock');
check(ambientKind('lesson') === 'focus', 'and a lesson');
check(ambientKind('warmup') === 'focus', 'and the warm-up');
check(ambientKind('home') === 'idle', 'the home map is a lobby — he relaxes');
check(ambientKind('browse') === 'idle', 'so is browse');
check(ambientKind('shop') === 'idle', 'and the shop');
check(ambientKind(undefined) === 'idle', 'an unknown view is safe');

// The whole point of `focus`: it must look nothing like the resting face.
check(MOODS.focus.brow < -0.3, 'the working face knits its brow');
check(MOODS.focus.squint > 0.2, 'and narrows its eyes');
check(MOODS.focus.mouth < MOODS.idle.mouth * 0.3, 'and stops smiling — serious, not cross');

// --- typing deepens the room, but only where he is working ------------------
{
  const rest = ambientFace('problem', 0);
  const busy = ambientFace('problem', 1);
  check(near(rest.squint, MOODS.focus.squint), 'at rest in a problem he is exactly `focus`');
  check(busy.squint > rest.squint, 'typing narrows his eyes further');
  check(busy.brow < rest.brow, 'and drops the brow further');
  const half = ambientFace('problem', 0.5);
  check(
    half.squint > rest.squint && half.squint < busy.squint,
    'the deepening is continuous, not a switch'
  );
  check(ambientFace('problem', 5).squint === busy.squint, 'typing heat clamps at 1');
}
{
  const lobby = ambientFace('home', 1);
  check(
    lobby.brow === MOODS.idle.brow && lobby.squint === MOODS.idle.squint,
    'typing in a lobby does NOT make him stern — the room decides the face'
  );
}

// --- pulses ----------------------------------------------------------------
check(
  Object.keys(PULSE_MS).every((k) => MOODS[k]),
  'every pulse with a lifetime has a face to show'
);
check(
  ['pass', 'fail', 'proud', 'oops', 'cheer'].every((k) => PULSE_MS[k] > 0),
  'the five event reactions all hold for a real, visible moment'
);

// The four the user asked for, by shape rather than by number.
check(MOODS.pass.mouth > MOODS.idle.mouth, 'green tests: a bigger smile than resting');
check(MOODS.pass.brow > 0.5 && MOODS.pass.bounce > 0, 'delighted — brows up, and he hops');
check(MOODS.proud.mouth > MOODS.idle.mouth && MOODS.proud.brow > 0, 'a submit reads as proud');
check(MOODS.proud.bounce < MOODS.pass.bounce, 'proud is warmer and quieter than delighted');
check(MOODS.fail.mouth < 0, 'a failure is an actual frown, not a smaller smile');
check(MOODS.fail.shake > 0.5, 'and he shakes his head');
check(MOODS.oops.mouth < 0 && MOODS.oops.mouth > MOODS.fail.mouth, 'a crash is a gentler wince');
check(MOODS.cheer.mouth >= MOODS.pass.mouth, 'a belt is at least as big as a pass');

// --- the blend over time ---------------------------------------------------
{
  const at = 1000;
  const args = { pulse: 'pass', pulseAt: at, view: 'problem', typing: 0 };
  const start = expressionFor({ ...args, now: at });
  check(near(start.mouth, MOODS.pass.mouth), 'the instant it lands, the pulse fully owns the face');
  check(near(start.brow, MOODS.pass.brow), 'every channel, not just the mouth');

  const held = expressionFor({ ...args, now: at + PULSE_MS.pass * 0.3 });
  check(near(held.mouth, MOODS.pass.mouth), 'it holds at full for the first third — not a flinch');

  const late = expressionFor({ ...args, now: at + PULSE_MS.pass * 0.8 });
  const ambient = ambientFace('problem', 0);
  check(
    late.mouth < held.mouth && late.mouth > ambient.mouth,
    'then it melts back toward the room, without arriving early'
  );

  const over = expressionFor({ ...args, now: at + PULSE_MS.pass });
  check(
    near(over.mouth, ambient.mouth) && near(over.brow, ambient.brow),
    'once it expires the room owns the face again — exactly, no residue'
  );
  const later = expressionFor({ ...args, now: at + PULSE_MS.pass * 10 });
  check(near(later.mouth, ambient.mouth), 'and it stays expired — a reaction is not a mask');
}

// A pulse decays into whatever room you are in, not into a default.
{
  const at = 500;
  const inProblem = expressionFor({ pulse: 'fail', pulseAt: at, view: 'problem', now: at + 9e6 });
  const atHome = expressionFor({ pulse: 'fail', pulseAt: at, view: 'home', now: at + 9e6 });
  check(inProblem.brow !== atHome.brow, 'the same expired pulse lands on two different rooms');
  check(near(atHome.mouth, MOODS.idle.mouth), 'at home it lands back on the resting smile');
}

// Impulses are impulses: they are spent well before the expression fades.
{
  const at = 0;
  const args = { pulse: 'pass', pulseAt: at, view: 'home' };
  const t0 = expressionFor({ ...args, now: 0 });
  const mid = expressionFor({ ...args, now: PULSE_MS.pass * 0.2 });
  const spent = expressionFor({ ...args, now: PULSE_MS.pass * 0.5 });
  check(near(t0.bounce, MOODS.pass.bounce), 'the hop starts at full');
  check(mid.bounce < t0.bounce && mid.bounce > 0, 'and decays');
  check(spent.bounce === 0, 'and is gone by halfway, while the face is still glowing');
  check(spent.mouth > ambientFace('home').mouth, '— the face outlives the movement');
}
{
  const shake = expressionFor({ pulse: 'fail', pulseAt: 0, view: 'problem', now: 0 });
  check(near(shake.shake, MOODS.fail.shake), 'a fail shakes at full strength immediately');
  check(shake.bounce === 0, 'and does not also hop');
}

// --- the awkward inputs a live clock will hand it --------------------------
{
  const ambient = ambientFace('problem', 0);
  const future = expressionFor({ pulse: 'pass', pulseAt: 5000, view: 'problem', now: 4000 });
  check(near(future.mouth, ambient.mouth), 'a pulse from the future is ignored, not inverted');
  const bogus = expressionFor({ pulse: 'nonsense', pulseAt: 0, view: 'problem', now: 10 });
  check(near(bogus.mouth, ambient.mouth), 'an unknown pulse falls back to the room');
  const none = expressionFor({ view: 'problem' });
  check(near(none.mouth, ambient.mouth), 'no pulse at all is the room');
  const empty = expressionFor();
  check(near(empty.mouth, MOODS.idle.mouth), 'no arguments at all is safe');
}

// Every expression the renderer can be handed must be finite and in range —
// it drives geometry, and a NaN there is a mesh that vanishes.
{
  const kinds = [null, ...Object.keys(MOODS)];
  const views = ['home', 'problem', 'lesson', 'mock', 'browse'];
  let ok = true;
  for (const pulse of kinds) {
    for (const view of views) {
      for (const typing of [0, 0.5, 1]) {
        for (const f of [0, 0.1, 0.34, 0.5, 0.99, 1, 1.5]) {
          const life = PULSE_MS[pulse] ?? 2000;
          const face = expressionFor({ pulse, pulseAt: 0, view, typing, now: life * f });
          for (const [k, v] of Object.entries(face)) {
            if (!Number.isFinite(v) || v < -1.01 || v > 1.61) ok = false;
            if (k === 'squint' && v > 1.01) ok = false;
          }
        }
      }
    }
  }
  check(ok, 'every reachable expression is finite and inside the channel ranges');
}

// --- the accessible name ---------------------------------------------------
check(moodLabel({ view: 'home', now: 0 }) === null, 'a resting mascot at home says nothing extra');
check(moodLabel({ view: 'problem', now: 0 }) === MOOD_LABEL.focus, 'in a problem it says he is watching');
check(
  moodLabel({ pulse: 'pass', pulseAt: 0, view: 'problem', now: 100 }) === MOOD_LABEL.pass,
  'a live pulse is announced, not only drawn'
);
check(
  moodLabel({ pulse: 'pass', pulseAt: 0, view: 'problem', now: PULSE_MS.pass + 1 }) ===
    MOOD_LABEL.focus,
  'and stops being announced the moment it stops being true'
);
check(
  moodLabel({ pulse: 'proud', pulseAt: 1000, view: 'home', now: 900 }) === null,
  'a pulse that has not happened yet is not announced'
);
check(
  Object.keys(MOODS).every((k) => k === 'idle' || typeof MOOD_LABEL[k] === 'string'),
  'every face except the resting one has words for it'
);

console.log(failures === 0 ? 'All mascot mood tests green.' : `${failures} mascot mood test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
