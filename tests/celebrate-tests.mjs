// The celebration trigger: belt promotions and streak milestones fire once, at
// the right moment, and never on a plain solve or on first load.
import { nextCelebration, STREAK_MILESTONES } from '../src/state/celebrate.js';
import { BELTS, beltFor } from '../src/state/progress.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Celebration tests\n');

// ---- first render never celebrates ----
check(nextCelebration(null, { solvedCount: 5, streak: 7 }) === null, 'no celebration on the first render (no baseline)');

// ---- belt promotions fire exactly on the crossing ----
{
  // Yellow belt threshold is 4.
  const yellow = beltFor(4).name;
  const promo = nextCelebration({ solvedCount: 3, streak: 1 }, { solvedCount: 4, streak: 1 });
  check(promo?.type === 'belt' && promo.belt.name === yellow, `crossing to Yellow belt fires (${promo?.belt?.name})`);
  check(promo.solvedCount === 4, 'belt celebration carries the new solved count');

  // a solve that does NOT cross a threshold stays quiet
  check(nextCelebration({ solvedCount: 4, streak: 1 }, { solvedCount: 5, streak: 1 }) === null, 'a plain solve within a belt is quiet');

  // every belt threshold (except White at 0) is celebrated when crossed
  let allBelts = true;
  for (const b of BELTS) {
    if (b.threshold === 0) continue;
    const cel = nextCelebration({ solvedCount: b.threshold - 1, streak: 1 }, { solvedCount: b.threshold, streak: 1 });
    if (cel?.type !== 'belt' || cel.belt.name !== b.name) allBelts = false;
  }
  check(allBelts, 'every belt promotion fires on its threshold');
}

// ---- streak milestones ----
{
  const cel = nextCelebration({ solvedCount: 4, streak: 6 }, { solvedCount: 4, streak: 7 });
  check(cel?.type === 'streak' && cel.streak === 7, 'hitting a 7-day streak fires');
  check(
    nextCelebration({ solvedCount: 4, streak: 7 }, { solvedCount: 4, streak: 8 }) === null,
    'a non-milestone streak day is quiet'
  );
  // belt takes priority when both happen at once
  const both = nextCelebration({ solvedCount: 3, streak: 6 }, { solvedCount: 4, streak: 7 });
  check(both?.type === 'belt', 'belt promotion takes priority over a streak milestone');
  check(STREAK_MILESTONES.includes(7) && STREAK_MILESTONES.includes(30), 'milestone list includes the key days');
}

// ---- a streak that resets (drops) never celebrates ----
check(nextCelebration({ solvedCount: 4, streak: 9 }, { solvedCount: 4, streak: 3 }) === null, 'a dropped streak does not celebrate');

console.log(failures === 0 ? '\nAll celebration tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
