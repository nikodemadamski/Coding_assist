// Pure tests for what the mascot wears where.
import { COSTUMES, costumeForView, mascotLabel } from '../src/state/mascot.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Mascot tests');

check(costumeForView('lesson') === 'cap', 'a lesson puts on the graduation cap');
check(costumeForView('learn') === 'cap', 'the curriculum list wears it too');
check(costumeForView('problem') === 'headband', 'solving means the dojo headband');
check(costumeForView('practice') === 'headband', 'so does a practice session');
check(costumeForView('drill') === 'headband', 'and a drill');
check(costumeForView('warmup') === 'sweatband', 'the warm-up gets a sweatband');
check(costumeForView('mock') === 'bowtie', 'the mock interview gets a bow tie');
check(costumeForView('stats') === 'glasses', 'your record gets reading glasses');
check(costumeForView('patterns') === 'monocle', 'the reference gets a monocle');
check(costumeForView('guide') === 'topknot', 'Sensei gets the topknot');

// Lobbies dress down — a costume there would be decoration, not a signal.
check(costumeForView('home') === 'none', 'the home map is a lobby, no costume');
check(costumeForView('browse') === 'none', 'so is the browse list');
check(costumeForView(undefined) === 'none', 'an unknown view is safe');
check(costumeForView('not-a-view') === 'none', 'a bogus view is safe');

// Every costume the map can return must actually exist to be rendered.
const views = ['home','browse','track','problem','practice','drill','warmup','mock','stats','patterns','quiz','guide','learn','lesson','review'];
const used = new Set(views.map(costumeForView));
check([...used].every((k) => COSTUMES[k]), `every mapped costume is defined (${[...used].join(', ')})`);
check(used.size >= 7, `the app has a real wardrobe (${used.size} looks in use)`);

// The costume must reach a screen reader too, not only the eye.
check(mascotLabel('home') === 'dojo — home', 'undressed, the label is just the brand');
check(
  /graduation cap/.test(mascotLabel('lesson')),
  `a costume is announced, not only drawn (${mascotLabel('lesson')})`
);
check(
  views.every((v) => mascotLabel(v).startsWith('dojo — home')),
  'every label still says where the button goes'
);

console.log(failures === 0 ? 'All mascot tests green.' : `${failures} mascot test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
