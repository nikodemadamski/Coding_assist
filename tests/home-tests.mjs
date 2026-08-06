// Pure tests for the home screen's greeting.
import { greeting } from '../src/state/greeting.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Home tests');

check(greeting(9, 'Nick') === 'Morning, Nick.', 'morning before noon');
check(greeting(14, 'Nick') === 'Afternoon, Nick.', 'afternoon until six');
check(greeting(20, 'Nick') === 'Evening, Nick.', 'evening after six');
check(greeting(2, 'Nick') === 'Still up, Nick?', 'the small hours get called out');
check(greeting(9, 'Zoro').includes('Zoro'), 'it uses the name it is given');

// What you have already done today outranks the clock — the greeting should
// reflect the session, not just the hour.
check(
  greeting(9, 'Nick', { solvedToday: 3 }) === '3 down today, Nick.',
  "today's solves take priority over the time of day"
);
check(
  greeting(20, 'Nick', { streak: 12 }) === 'Day 12, Nick. Keep it.',
  'a live streak is worth saying out loud'
);
check(
  greeting(20, 'Nick', { streak: 2 }) === 'Evening, Nick.',
  'a one- or two-day streak is not yet a streak'
);
check(
  greeting(9, 'Nick', { streak: 12, solvedToday: 1 }) === '1 down today, Nick.',
  'solved-today outranks the streak'
);
check(greeting(9, 'Nick', {}) === 'Morning, Nick.', 'an empty stats object is safe');

console.log(failures === 0 ? 'All home tests green.' : `${failures} home test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
