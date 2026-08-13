// Pure tests for the dojo shop: earning, unlocking, buying, wearing.
import {
  ITEMS, SLOTS, RATES, itemById,
  earnBreakdown, coinsEarned, coinBalance, coinsSpent,
  owns, ownedIds, beltIndex, itemState, buyItem, equipItem, equipped, outfitFor,
} from '../src/state/shop.js';
import { BELTS, todayStr, addDays } from '../src/state/progress.js';
import { COSTUMES } from '../src/state/mascot.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Shop tests');

const Q = Array.from({ length: 60 }, (_, i) => ({ id: `q${i}` }));
const solvedN = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`q${i}`, { solves: 1 }]));

// ── catalogue integrity ────────────────────────────────────────────────────
check(new Set(ITEMS.map((i) => i.id)).size === ITEMS.length, 'every item id is unique');
check(ITEMS.every((i) => SLOTS.includes(i.slot)), 'every item sits in a real slot');
check(ITEMS.every((i) => i.belt >= 0 && i.belt < BELTS.length), 'every unlock names a real belt');
check(ITEMS.every((i) => i.price >= 0 && Number.isInteger(i.price)), 'every price is a whole number');
check(ITEMS.some((i) => i.price === 0 && i.belt === 0), 'day one is not a locked door — something is free');
check(SLOTS.every((s) => ITEMS.some((i) => i.slot === s)), 'every slot has something to put in it');
check(itemById('crown')?.belt === BELTS.length - 1, 'the crown is black-belt only');
check(itemById('nope') === null, 'an unknown id resolves to null, not undefined');
// price should broadly rise with rank, or the gating is decorative
const byBelt = [...ITEMS].sort((a, b) => a.belt - b.belt);
check(byBelt[0].price <= byBelt[byBelt.length - 1].price, 'later belts unlock dearer things');

// ── earning ────────────────────────────────────────────────────────────────
const P0 = {};
check(coinsEarned(P0, Q) === 0, 'an empty record has earned nothing');
check(coinBalance(P0, Q) === 0, 'and the balance never goes below zero');

const P1 = {
  solved: solvedN(5),
  srs: { q0: { stage: 2 }, q1: { stage: 1 } },
  lessons: { l1: { completedAt: 'x' }, l2: {} },
  mock: [{ passed: true }, { passed: false }],
  warmup: { beginner: { runs: 3 } },
  streak: { count: 4, lastActiveDate: todayStr() },
};
const b = earnBreakdown(P1, Q);
const expect =
  5 * RATES.solve + 3 * RATES.review + 1 * RATES.lesson + 1 * RATES.mockPassed +
  3 * RATES.warmupRun + 4 * RATES.streakDay + 1 * RATES.belt; // 5 solves = Yellow
check(b.total === expect, `the total is the sum of its parts (${b.total} = ${expect})`);
check(b.rows.reduce((s, r) => s + r.n * r.each, 0) === b.total, 'the shown working adds up to the total');
check(b.rows.every((r) => r.label && r.n >= 0), 'every row is labelled and non-negative');
check(b.rows.length >= 6, 'the breakdown shows where every coin came from');
// only finished lessons and passed mocks count
check(
  earnBreakdown({ lessons: { a: {} } }, Q).total === 0,
  'an unfinished lesson pays nothing'
);
check(earnBreakdown({ mock: [{ passed: false }] }, Q).total === 0, 'a failed mock pays nothing');
// **A streak you are no longer on stops paying.** `streak.count` keeps its
// value after a missed day — the header chip already drops to 0 via
// currentStreak, and the wallet used to read the raw field, so breaking a
// 30-day streak left you collecting for 30 days forever.
check(
  earnBreakdown({ streak: { count: 30, lastActiveDate: addDays(todayStr(), -5) } }, Q).total === 0,
  'a broken streak pays nothing, however high it once was'
);
check(
  earnBreakdown({ streak: { count: 6, lastActiveDate: addDays(todayStr(), -1) } }, Q).total ===
    6 * RATES.streakDay,
  'a streak kept up to yesterday still pays (the day is not over)'
);
check(
  earnBreakdown({ streak: { count: 3 } }, Q).total === 0,
  'a streak with no last-active date pays nothing'
);
// solves for questions that no longer exist must not pay
check(
  earnBreakdown({ solved: { ghost: { solves: 1 } } }, Q).total === 0,
  'a solve for a deleted question pays nothing'
);

// ── belts gate ─────────────────────────────────────────────────────────────
check(beltIndex({}, Q) === 0, 'no solves means White belt');
check(beltIndex({ solved: solvedN(40) }, Q) === BELTS.length - 1, '40 solves means Black');
const rich = { solved: solvedN(5), shop: { spent: 0, owned: [] } };
const crown = itemById('crown');
const st = itemState(crown, rich, Q);
check(st.locked && st.lockedBy === 'Black', 'the crown is locked behind Black, by name');
check(!st.buyable, 'and cannot be bought at Yellow no matter the balance');
const headband = itemById('headband');
check(itemState(headband, {}, Q).buyable, 'the free starter item is buyable from nothing');

// ── buying ─────────────────────────────────────────────────────────────────
const glasses = itemById('glasses');
let P = { solved: solvedN(10), shop: { spent: 0, owned: [] } };
const before = coinBalance(P, Q);
P = buyItem(P, glasses, Q);
check(owns(P, 'glasses'), 'buying puts the item in your wardrobe');
check(coinBalance(P, Q) === before - glasses.price, 'and takes the coins');
check(equipped(P).face === 'glasses', 'and wears it — nobody buys a hat for the box');
// no double-buy, no going negative, no buying what you cannot afford
const twice = buyItem(P, glasses, Q);
check(coinsSpent(twice) === coinsSpent(P), 'buying the same thing twice costs nothing extra');
check(ownedIds(twice).filter((i) => i === 'glasses').length === 1, 'and does not duplicate it');
const broke = buyItem({ shop: { spent: 0, owned: [] } }, itemById('flame'), Q);
check(!owns(broke, 'flame'), 'you cannot buy what you cannot afford');
check(coinsSpent(broke) === 0, 'and a refused purchase charges nothing');
const gated = buyItem({ solved: solvedN(4), shop: { spent: 0, owned: [] } }, crown, Q);
check(!owns(gated, 'crown'), 'you cannot buy past your belt');
check(coinBalance(P, Q) >= 0, 'the balance never goes negative');

// ── equipping ──────────────────────────────────────────────────────────────
check(equipped(equipItem(P, 'face', null)).face === null, 'a slot can be emptied');
check(!owns(equipItem(P, 'hat', 'crown'), 'crown'), 'equipping something you do not own is refused');
check(equipped(equipItem(P, 'hat', 'crown')).hat === undefined, 'and changes nothing');
check(equipped(equipItem(P, 'nonsense', 'glasses')).nonsense === undefined, 'an unreal slot is refused');

// ── what gets worn ─────────────────────────────────────────────────────────
// A real black-belt record: the crown is a stretch goal on purpose, so this
// has to be someone who has actually put the hours in.
let W = {
  solved: solvedN(40),
  srs: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`q${i}`, { stage: 4 }])),
  lessons: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`l${i}`, { completedAt: 'x' }])),
  shop: { spent: 0, owned: [] },
};
W = buyItem(W, itemById('glasses'), Q);
W = buyItem(W, itemById('crown'), Q);
const home = outfitFor(W, null);
check(home.face === 'glasses' && home.hat === 'crown', 'in a lobby you wear what you picked');
const lesson = outfitFor(W, 'cap');
check(lesson.hat === 'cap', "the room's costume takes its slot");
check(lesson.face === 'glasses', 'and your own kit fills every other slot');
check(outfitFor({}, 'cap').hat === 'cap', "a room costume is worn even if you don't own it");
check(
  SLOTS.every((s) => s in outfitFor({}, null)),
  'the outfit always names every slot, even when empty'
);
// an item you sold/lost must not keep being worn
check(
  outfitFor({ shop: { owned: [], equipped: { hat: 'crown' } } }, null).hat === null,
  'a slot pointing at something you do not own renders empty'
);

// ── the wardrobe and the rooms must agree ──────────────────────────────────
for (const key of Object.keys(COSTUMES)) {
  if (key === 'none') continue;
  if (!itemById(key)) check(false, `room costume "${key}" exists as an item`);
}
check(true, 'every room costume is a real item the renderer can draw');

console.log(failures === 0 ? 'All shop tests green.' : `${failures} shop test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
