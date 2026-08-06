// What the mascot is wearing, and why.
//
// The `dojo` mark is the one warm thing in an otherwise stern training app, so
// it dresses for the occasion: a mortarboard in the lessons, a headband when
// you're solving, a bow tie for the mock interview. It costs nothing, it tells
// you which room you're in from the corner of your eye, and it's the kind of
// detail that makes a tool you use for hours feel like it's yours.
//
// Pure data + one lookup, so tests/mascot-tests.mjs can hold every view to it.

export const COSTUMES = {
  none: { label: 'no costume' },
  headband: { label: 'a dojo headband', why: 'solving — this is the mat' },
  cap: { label: 'a graduation cap', why: 'the lessons' },
  sweatband: { label: 'a sweatband', why: 'the warm-up' },
  bowtie: { label: 'a bow tie', why: 'the mock interview' },
  glasses: { label: 'reading glasses', why: 'your record' },
  monocle: { label: 'a monocle', why: 'the pattern reference' },
  topknot: { label: 'a sensei topknot', why: "the how-to-train guide" },
};

// One costume per room. Views not listed dress down — the home map and the
// browse list are lobbies, and a mascot in costume there would be noise.
const BY_VIEW = {
  lesson: 'cap',
  learn: 'cap',
  problem: 'headband',
  practice: 'headband',
  drill: 'headband',
  warmup: 'sweatband',
  mock: 'bowtie',
  stats: 'glasses',
  patterns: 'monocle',
  quiz: 'monocle',
  guide: 'topknot',
};

export function costumeForView(view) {
  const key = BY_VIEW[view];
  return key && COSTUMES[key] ? key : 'none';
}

// The alt text the logo announces, so the costume is never information that
// only sighted users get.
export function mascotLabel(view) {
  const key = costumeForView(view);
  return key === 'none' ? 'dojo — home' : `dojo — home (wearing ${COSTUMES[key].label})`;
}
