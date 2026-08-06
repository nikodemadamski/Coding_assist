// Pure tests for the editor's Python completion source.
import {
  optionsFor,
  documentWords,
  PRELUDE_NAMES,
  BUILTIN_NAMES,
  MEMBER_NAMES,
} from '../src/engine/pyCompletions.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};
const labels = (opts) => opts.map((o) => o.label);

console.log('Completion tests');

const CODE = 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        pass\n';

check(documentWords(CODE).includes('seen'), "your own variables are offered");
check(documentWords(CODE).includes('two_sum'), 'your own function name is offered');
check(!documentWords(CODE).includes('i'), 'single letters are skipped — they are noise, not completions');
check(!documentWords(CODE, 'nums').includes('nums'), 'the word being typed is not offered back to you');

const opts = optionsFor({ text: CODE, word: 'de' });
check(labels(opts).includes('defaultdict'), 'prelude names are offered');
check(labels(opts).includes('deque'), 'deque is offered');
check(
  opts.find((o) => o.label === 'Counter')?.detail?.includes('no import'),
  'prelude names say they need no import — that rule is easy to miss'
);
check(labels(opts).includes('enumerate'), 'builtins are offered');
check(labels(opts).includes('return'), 'keywords are offered');
check(labels(opts).includes('seen'), 'document words join the same list');
check(new Set(labels(opts)).size === labels(opts).length, 'no duplicate entries');
// the regression this source exists to fix
check(
  !labels(opts).some((l) => /Error$/.test(l)),
  'no exception-class noise (the reason the stock source was switched off)'
);

const dotOpts = optionsFor({ afterDot: true, text: CODE });
check(labels(dotOpts).includes('append'), 'members are offered after a dot');
check(labels(dotOpts).includes('most_common'), 'Counter.most_common is offered');
check(
  !labels(dotOpts).some((l) => PRELUDE_NAMES.includes(l) || BUILTIN_NAMES.includes(l)),
  'a dot offers members only, never globals'
);
check(dotOpts.every((o) => o.type === 'method'), 'members are typed as methods');
check(MEMBER_NAMES.length > 30, 'the member list covers list/dict/set/str');

check(optionsFor().length > 0, 'called with no arguments it still returns the static set');

console.log(failures === 0 ? 'All completion tests green.' : `${failures} completion test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
