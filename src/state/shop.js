// The dojo shop: what you've earned, what it unlocks, and what the mascot wears.
//
// Two ideas hold this together and both matter.
//
// **The balance is derived, never accumulated.** Coins are computed from your
// training record every time they're asked for — solves, reviews, lessons,
// mocks, streak — minus what you've spent. Nothing increments a counter, so
// there is no way to double-count, no migration when the rates change, and an
// export/import carries your wallet without carrying a separate ledger that
// could disagree with the record it came from.
//
// **Belts gate, coins cost.** A belt is proof you did the work; coins are just
// time served. So the good items need both: you can't buy your way past a rank,
// and you can't wear a rank you haven't paid for either.
//
// Everything here is pure. tests/shop-tests.mjs holds all of it.
import { BELTS, beltFor, solvedCount } from './progress.js';

// What a unit of training is worth. Deliberately flat and legible — a learner
// should be able to predict their balance, not reverse-engineer it.
export const RATES = {
  solve: 10, // each question solved at least once
  review: 4, // each review interval you've climbed past the first
  lesson: 8, // each lesson finished
  mockPassed: 25, // each mock interview solved inside the clock
  warmupRun: 5, // each warm-up run completed, any level
  streakDay: 3, // per day of the current streak
  belt: 40, // per belt earned beyond White
};

// Slots, so a hat and a monocle aren't fighting over the same head.
export const SLOTS = ['hat', 'face', 'neck', 'aura'];

// The catalogue. `belt` is the rank that unlocks it — index into BELTS, so
// White is 0 and Black is 6. Free starter items exist so the shop is never a
// locked door on day one.
export const ITEMS = [
  // ── hats ────────────────────────────────────────────────────────────────
  { id: 'headband', slot: 'hat', name: 'Dojo headband', price: 0, belt: 0, blurb: 'The hachimaki. Where everyone starts.' },
  { id: 'sweatband', slot: 'hat', name: 'Sweatband', price: 40, belt: 0, blurb: 'For the rounds that make you sweat.' },
  { id: 'cap', slot: 'hat', name: 'Graduation cap', price: 120, belt: 1, blurb: 'Earned by finishing what you started.' },
  { id: 'kasa', slot: 'hat', name: 'Straw kasa', price: 220, belt: 2, blurb: 'The wandering swordsman look.' },
  { id: 'topknot', slot: 'hat', name: 'Sensei topknot', price: 400, belt: 4, blurb: 'You have taught someone something.' },
  { id: 'crown', slot: 'hat', name: 'Crown', price: 900, belt: 6, blurb: 'Black belt only. Obviously.' },
  // ── face ────────────────────────────────────────────────────────────────
  { id: 'glasses', slot: 'face', name: 'Reading glasses', price: 60, belt: 0, blurb: 'For the long study sessions.' },
  { id: 'monocle', slot: 'face', name: 'Monocle', price: 180, belt: 2, blurb: 'Ah yes. A sliding window.' },
  { id: 'shades', slot: 'face', name: 'Shades', price: 320, belt: 3, blurb: 'Solved it before you finished reading.' },
  // ── neck ────────────────────────────────────────────────────────────────
  { id: 'bowtie', slot: 'neck', name: 'Bow tie', price: 90, belt: 1, blurb: 'Interview clothes.' },
  { id: 'scarf', slot: 'neck', name: 'Scarf', price: 240, belt: 3, blurb: 'Dramatic. Trails in the wind.' },
  // ── aura ────────────────────────────────────────────────────────────────
  { id: 'sparks', slot: 'aura', name: 'Spark aura', price: 300, belt: 3, blurb: 'A few embers, always drifting up.' },
  { id: 'petals', slot: 'aura', name: 'Falling petals', price: 480, belt: 5, blurb: 'Sakura. Very serene. Very earned.' },
  { id: 'flame', slot: 'aura', name: 'Blue flame', price: 750, belt: 6, blurb: 'The last thing they see.' },
];

export const itemById = (id) => ITEMS.find((i) => i.id === id) ?? null;

// ── earning ────────────────────────────────────────────────────────────────

// Where every coin came from, so the shop can show its working. A learner who
// can't see why they have 240 coins will assume the number is arbitrary.
export function earnBreakdown(progress = {}, questions = []) {
  const solves = solvedCount(progress, questions);
  // SRS stage counts the intervals you've climbed — a question reviewed four
  // times is worth more than one solved once and never seen again.
  const reviews = Object.values(progress.srs ?? {}).reduce((n, s) => n + (s?.stage ?? 0), 0);
  const lessons = Object.values(progress.lessons ?? {}).filter((l) => l?.completedAt).length;
  const mocks = (progress.mock ?? []).filter((m) => m?.passed).length;
  const warmups = Object.values(progress.warmup ?? {}).reduce((n, w) => n + (w?.runs ?? 0), 0);
  const streak = progress.streak?.count ?? 0;
  const beltIdx = Math.max(0, BELTS.findIndex((b) => b.name === beltFor(solves).name));

  const rows = [
    { key: 'solve', label: 'Questions solved', n: solves, each: RATES.solve },
    { key: 'review', label: 'Review intervals cleared', n: reviews, each: RATES.review },
    { key: 'lesson', label: 'Lessons finished', n: lessons, each: RATES.lesson },
    { key: 'mockPassed', label: 'Mocks passed', n: mocks, each: RATES.mockPassed },
    { key: 'warmupRun', label: 'Warm-up runs', n: warmups, each: RATES.warmupRun },
    { key: 'streakDay', label: 'Days on the current streak', n: streak, each: RATES.streakDay },
    { key: 'belt', label: 'Belts earned', n: Math.max(0, beltIdx), each: RATES.belt },
  ];
  const total = rows.reduce((sum, r) => sum + r.n * r.each, 0);
  return { rows, total };
}

export const coinsEarned = (progress, questions) => earnBreakdown(progress, questions).total;
export const coinsSpent = (progress = {}) => progress.shop?.spent ?? 0;
export const coinBalance = (progress, questions) =>
  Math.max(0, coinsEarned(progress, questions) - coinsSpent(progress));

// ── owning ─────────────────────────────────────────────────────────────────

export const ownedIds = (progress = {}) => progress.shop?.owned ?? [];
export const owns = (progress, id) => ownedIds(progress).includes(id);

// Which belt you're standing on, as an index into BELTS.
export function beltIndex(progress = {}, questions = []) {
  const name = beltFor(solvedCount(progress, questions)).name;
  return Math.max(0, BELTS.findIndex((b) => b.name === name));
}

// Everything the shop needs to draw one row, in one place — so the button, the
// price tag and the lock note can never disagree about the same item.
export function itemState(item, progress, questions) {
  const owned = owns(progress, item.id);
  const belt = beltIndex(progress, questions);
  const locked = belt < item.belt;
  const balance = coinBalance(progress, questions);
  return {
    owned,
    locked,
    lockedBy: locked ? BELTS[item.belt].name : null,
    affordable: balance >= item.price,
    buyable: !owned && !locked && balance >= item.price,
  };
}

// ── the till ───────────────────────────────────────────────────────────────

// Buying is the one place this module writes. It refuses politely rather than
// throwing: a UI that can't reach a disabled button is still a UI that can be
// driven by a keyboard, and a shop that goes negative is a bug you find weeks
// later.
export function buyItem(progress, item, questions) {
  const st = itemState(item, progress, questions);
  if (!st.buyable) return progress;
  const shop = progress.shop ?? {};
  return {
    ...progress,
    shop: {
      ...shop,
      spent: (shop.spent ?? 0) + item.price,
      owned: [...(shop.owned ?? []), item.id],
      // Buying something equips it — nobody buys a hat to leave it in a box.
      equipped: { ...(shop.equipped ?? {}), [item.slot]: item.id },
    },
  };
}

// Equipping is free and reversible; `null` takes the slot off.
export function equipItem(progress, slot, id) {
  if (!SLOTS.includes(slot)) return progress;
  if (id !== null && !owns(progress, id)) return progress;
  const shop = progress.shop ?? {};
  return { ...progress, shop: { ...shop, equipped: { ...(shop.equipped ?? {}), [slot]: id } } };
}

export const equipped = (progress = {}) => progress.shop?.equipped ?? {};

// ── what the mascot is actually wearing ────────────────────────────────────

// The room's costume takes its slot; your own kit fills the rest. So in a
// lesson you wear the mortarboard AND your monocle, and on the home screen you
// wear everything you picked. One rule, no special cases.
export function outfitFor(progress, roomCostume = null) {
  const mine = equipped(progress);
  const out = {};
  for (const slot of SLOTS) {
    const id = mine[slot];
    out[slot] = id && owns(progress, id) ? id : null;
  }
  if (roomCostume) {
    const item = itemById(roomCostume);
    // A room costume is worn whether or not you own it — it belongs to the
    // room, not to you.
    if (item) out[item.slot] = roomCostume;
  }
  return out;
}
