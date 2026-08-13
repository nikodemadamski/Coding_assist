// What the home screen says to you when it opens.
//
// A training log for one person should sound like one: the front door greets
// you by name, and leads with whatever is actually true right now — what you
// have already done today first, then a streak worth protecting, then the
// clock. Pure, so tests/home-tests.mjs can check every branch.
export function greeting(hour, name, { streak = 0, solvedToday = 0 } = {}) {
  if (solvedToday > 0) return `${solvedToday} down today, ${name}.`;
  if (streak >= 3) return `Day ${streak}, ${name}. Keep it going.`;
  if (hour < 5) return `Still up, ${name}?`;
  if (hour < 12) return `Morning, ${name}.`;
  if (hour < 18) return `Afternoon, ${name}.`;
  return `Evening, ${name}.`;
}
