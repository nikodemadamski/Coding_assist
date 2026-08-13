// The record is the only copy of the training history that exists anywhere —
// no server, no account. These tests pin the two guarantees that matter:
//   1. a malformed record can never reach the app, and
//   2. counting solves gives ONE answer, whoever asks.
import { sanitizeProgress, parseImport, exportData, importSummary, EMPTY_PROGRESS } from '../src/state/storage.js';
import { solvedCount, beltFor, BELTS } from '../src/state/progress.js';
import { coinBalance, beltIndex } from '../src/state/shop.js';

let pass = 0;
let fail = 0;
function check(cond, label) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`);
  }
}

console.log('\nSanitising a stored record:');

// The exact shape that used to blank the whole app: `mock` is documented as an
// array and every reader calls .filter on it, but nothing enforced that, and
// `?? []` only catches null/undefined.
{
  const repaired = sanitizeProgress({ mock: { runs: 3 } });
  check(Array.isArray(repaired.mock), 'an object where `mock` should be an array is replaced with []');
  check(repaired.mock.length === 0, '  ↳ and the bad value is discarded, not coerced');
}

// Every other field of the wrong kind, in one sweep. None of these crashed the
// app before, but all of them would have propagated garbage into the UI.
{
  const junk = {
    solved: [], drafts: 'x', srs: 7, activity: [], warmup: null,
    notes: [], bigo: [], lessons: [], shop: [], streak: 'nope', mock: 'no',
  };
  const r = sanitizeProgress(junk);
  const objectFields = ['solved', 'drafts', 'srs', 'activity', 'warmup', 'notes', 'bigo', 'lessons', 'shop'];
  check(
    objectFields.every((k) => r[k] && typeof r[k] === 'object' && !Array.isArray(r[k])),
    'every object-shaped field survives as a plain object'
  );
  check(Array.isArray(r.mock), '`mock` survives as an array');
  check(r.streak.count === 0 && r.streak.lastActiveDate === null, 'a non-object streak falls back to the empty streak');
}

// Garbage at the top level, and the legitimately-null field.
check(sanitizeProgress(null).solved !== undefined, 'null parses to a complete empty record');
check(sanitizeProgress('a string').mock.length === 0, 'a string parses to a complete empty record');
check(sanitizeProgress([]).solved !== undefined, 'an array parses to a complete empty record');
check(sanitizeProgress({}).quiz === null, 'quiz stays null — it is legitimately empty until the first drill');

// A newer build's field must survive a round-trip through an older one, or
// opening the app on a second device silently truncates the record.
{
  const r = sanitizeProgress({ solved: {}, futureFeature: { a: 1 } });
  check(r.futureFeature?.a === 1, 'an unknown field from a newer version is preserved');
}

// Real values must not be touched.
{
  const real = {
    ...structuredClone(EMPTY_PROGRESS),
    solved: { 'py-two-sum': { solves: 2, attempts: 3 } },
    mock: [{ id: 'm1', passed: true }],
    streak: { count: 9, lastActiveDate: '2026-08-13' },
  };
  const r = sanitizeProgress(real);
  check(r.solved['py-two-sum'].solves === 2, 'a valid record passes through unchanged');
  check(r.mock.length === 1 && r.streak.count === 9, '  ↳ arrays and streak included');
}

console.log('\nImporting a file:');

// The import path is the realistic way a bad record arrives: `app` says where a
// file came from, not that it is well formed.
{
  const hostile = JSON.stringify({ app: 'zoroclaude-dojo', version: 1, progress: { mock: { runs: 1 } } });
  const { progress } = parseImport(hostile);
  check(Array.isArray(progress.mock), 'an export carrying a wrong-typed field is repaired on import');
}
{
  const round = exportData({ ...structuredClone(EMPTY_PROGRESS), solved: { a: { solves: 1 } } }, []);
  const back = parseImport(round);
  check(back.progress.solved.a.solves === 1, 'a real export round-trips intact');
  check(Array.isArray(back.customQuestions), 'customQuestions is always an array');
}
{
  let threw = false;
  try { parseImport('{"app":"something-else"}'); } catch { threw = true; }
  check(threw, 'a file from another app is still rejected outright');
  threw = false;
  try { parseImport('not json'); } catch { threw = true; }
  check(threw, 'invalid JSON is still rejected outright');
}

// The summary is what Settings shows BEFORE overwriting anything.
{
  const s = importSummary(
    { solved: { a: { solves: 1 }, b: { solves: 0 }, c: { solves: 3 } }, lessons: { l1: { completedAt: 'x' }, l2: {} }, mock: [{}, {}] },
    [{ id: 'q1' }]
  );
  check(s.solves === 2, 'the import summary counts only actually-solved entries');
  check(s.lessons === 1 && s.mocks === 2 && s.customQuestions === 1, '  ↳ and lessons, mocks and custom questions');
  check(importSummary({ mock: 'broken' }).mocks === 0, 'a malformed record summarises without throwing');
}

console.log('\nOne answer for "how many have I solved":');

// The bug this replaces: the record can hold ids the bank no longer has, and
// three surfaces counted them three different ways.
{
  const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const progress = {
    solved: {
      a: { solves: 1 },
      b: { solves: 1 },
      'deleted-custom-question': { solves: 1 }, // no longer in the bank
      'renamed-in-a-later-release': { solves: 4 },
    },
    srs: {},
  };
  check(solvedCount(progress, questions) === 2, 'stale ids in the record are not counted');
  check(
    beltIndex(progress, questions) === BELTS.findIndex((b) => b.name === beltFor(2).name),
    '  ↳ the shop belt is the belt for 2 solves, not for 4 record entries'
  );
  // Coins are derived from the same count, so they cannot drift either.
  const coins = coinBalance(progress, questions);
  const coinsIfStaleCounted = coinBalance(
    { solved: { a: { solves: 1 }, b: { solves: 1 }, c: { solves: 1 }, d: { solves: 1 } }, srs: {} },
    questions
  );
  check(coins < coinsIfStaleCounted, 'coins are not paid for questions that no longer exist');
  check(solvedCount({}, questions) === 0, 'an empty record counts zero without throwing');
  check(solvedCount({ solved: null }, questions) === 0, 'a null solved map counts zero without throwing');
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
