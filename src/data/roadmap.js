// The learning roadmap — pattern categories in the order a NeetCode-style
// curriculum teaches them, plus THE PATH: an explicit ordered list of every
// seed question. Reviews are served randomly (retrieval practice), but new
// questions always follow the path — step 1 teaches you Python, step 76 is
// interview-grade. "Where do I begin?" → at the next unsolved step.

export const ROADMAP = [
  {
    key: 'warmups',
    label: '0 · Python Warm-ups',
    blurb: 'Loops, strings, dicts and sets — learn the language before the patterns.',
    patterns: ['strings', 'control-flow', 'sets', 'dict-items'],
  },
  {
    key: 'arrays-hashing',
    label: '1 · Arrays & Hashing',
    blurb: 'Counting and dictionaries. Everything else builds on this.',
    patterns: ['hashing', 'arrays-hashing', 'frequency-dict'],
  },
  {
    key: 'two-pointers',
    label: '2 · Two Pointers',
    blurb: 'Converge from both ends of a sorted structure. O(1) space.',
    patterns: ['two-pointers'],
  },
  {
    key: 'sliding-window',
    label: '3 · Sliding Window',
    blurb: 'A moving range over an array/string. Grow right, shrink left.',
    patterns: ['sliding-window'],
  },
  {
    key: 'stack',
    label: '4 · Stack',
    blurb: 'LIFO, matching, and the monotonic-stack "next greater" trick.',
    patterns: ['stack'],
  },
  {
    key: 'binary-search',
    label: '5 · Binary Search',
    blurb: 'Halve the search space — on arrays, and on the answer itself.',
    patterns: ['binary-search'],
  },
  {
    key: 'pandas',
    label: '6 · pandas',
    blurb: 'DataFrame fluency for the data-science side of the loop.',
    patterns: ['filtering', 'selection', 'groupby', 'merge', 'sorting', 'missing-data', 'transform'],
  },
  {
    key: 'sql',
    label: '7 · SQL',
    blurb: 'Joins, aggregation, subqueries, and window functions.',
    patterns: ['select-where', 'order-limit', 'group-by', 'having', 'join', 'subquery', 'window-functions'],
  },
  {
    key: 'linked-list',
    label: '8 · Linked List',
    blurb: 'Pointer surgery: dummy heads, fast/slow, in-place reversal.',
    patterns: ['linked-list'],
  },
  {
    key: 'trees',
    label: '9 · Trees',
    blurb: 'Recursion over structure — DFS depth/validate, BFS by level.',
    patterns: ['trees'],
  },
  {
    key: 'tries',
    label: '10 · Tries',
    blurb: 'Prefix trees — the data structure behind autocomplete and word search.',
    patterns: ['tries'],
  },
  {
    key: 'heap',
    label: '11 · Heap / Priority Queue',
    blurb: 'Top-K and "always grab the extreme" in O(log n).',
    patterns: ['heap'],
  },
  {
    key: 'backtracking',
    label: '12 · Backtracking',
    blurb: 'Build a decision tree; choose, recurse, un-choose.',
    patterns: ['backtracking'],
  },
  {
    key: 'graphs',
    label: '13 · Graphs',
    blurb: 'Grids and adjacency: DFS flood-fill, BFS shortest-time, topo-sort.',
    patterns: ['graphs'],
  },
  {
    key: 'dp',
    label: '14 · Dynamic Programming',
    blurb: 'Overlapping subproblems. Define the state, write the recurrence.',
    patterns: ['dp-1d', 'dp-2d'],
  },
  {
    key: 'greedy',
    label: '15 · Greedy',
    blurb: 'Locally optimal choices that provably reach the global optimum.',
    patterns: ['greedy'],
  },
  {
    key: 'intervals',
    label: '16 · Intervals',
    blurb: 'Sort by start, then sweep. Merge, overlap, schedule.',
    patterns: ['intervals'],
  },
  {
    key: 'math-geometry',
    label: '17 · Math & Geometry',
    blurb: 'Matrix moves, number tricks, and simulation.',
    patterns: ['math-geometry'],
  },
  {
    key: 'bits',
    label: '18 · Bit Manipulation',
    blurb: 'XOR cancellation, masks, and shift tricks.',
    patterns: ['bits'],
  },
  {
    key: 'other',
    label: 'Extra · Imported',
    blurb: 'Questions you brought in from Claude — slotted after the main path.',
    patterns: [],
  },
];

// THE PATH — every seed question in teaching order. New questions in practice
// are always served in this order, so "continue" means exactly that.
export const PATH = [
  // 0 · Python warm-ups: learn the language
  'py-reverse-string',
  'py-fizzbuzz',
  'py-common-elements',
  'py-invert-dict',
  'py-merge-counts',
  // 1 · Arrays & hashing: the counting patterns
  'py-contains-duplicate',
  'py-char-frequency',
  'py-first-unique-char',
  'py-valid-anagram',
  'py-two-sum',
  'py-group-anagrams',
  'py-top-k-frequent',
  'py-product-except-self',
  'py-longest-consecutive',
  // 2 · Two pointers
  'py-valid-palindrome',
  'py-two-sum-sorted',
  'py-container-water',
  'py-three-sum',
  'py-trapping-rain',
  // 3 · Sliding window
  'py-max-profit',
  'py-longest-substring-norepeat',
  'py-char-replacement',
  'py-permutation-in-string',
  'py-min-window-substring',
  'py-sliding-window-max',
  // 4 · Stack
  'py-valid-parentheses',
  'py-min-stack',
  'py-eval-rpn',
  'py-daily-temperatures',
  'py-generate-parens',
  'py-car-fleet',
  'py-largest-rectangle',
  // 5 · Binary search
  'py-binary-search',
  'py-find-min-rotated',
  'py-search-rotated',
  'py-search-2d-matrix',
  'py-koko-bananas',
  'py-median-two-sorted',
  // 6 · pandas: the data-science muscle
  'pd-filter-rows',
  'pd-select-columns',
  'pd-computed-column',
  'pd-value-counts',
  'pd-top-n',
  'pd-groupby-agg',
  'pd-merge-frames',
  'pd-handle-nan',
  'pd-name-prefix',
  'pd-sort-two-keys',
  'pd-dojo-report',
  'pd-left-merge-default',
  'pd-keep-latest',
  'pd-group-champion',
  'pd-rename-cast',
  'pd-melt-long',
  'pd-rolling-mean',
  'pd-group-cumsum',
  'pd-cut-tiers',
  'pd-pivot-grid',
  'pd-scrub-names',
  'pd-split-column',
  'pd-parse-dates',
  'pd-filter-daterange',
  'pd-monthly-agg',
  'pd-weekday-average',
  // 7 · SQL
  'sql-select-where',
  'sql-order-limit',
  'sql-count-group',
  'sql-having',
  'sql-inner-join',
  'sql-left-join-null',
  'sql-subquery',
  'sql-window-top-per-group',
  'sql-distinct-order-limit',
  'sql-left-join-coalesce',
  'sql-self-join-mentor',
  'sql-case-when-pivot',
  'sql-not-exists-anti',
  'sql-running-total',
  'sql-lag-previous',
  'sql-dense-rank-ties',
  'sql-second-per-group',
  'sql-moving-average',
  'sql-percent-of-total',
  'sql-gap-to-leader',
  'sql-scrub-names',
  'sql-badge-labels',
  'sql-month-of-sailing',
  'sql-days-at-sea',
  'sql-monthly-gold',
  'sql-dojo-roster',
  // 8 · Linked list
  'py-reverse-list',
  'py-merge-sorted-lists',
  'py-reorder-list',
  'py-remove-nth-end',
  'py-add-two-numbers',
  'py-merge-k-lists',
  // 9 · Trees
  'py-max-depth-tree',
  'py-same-tree',
  'py-invert-tree',
  'py-subtree',
  'py-tree-diameter',
  'py-level-order',
  'py-validate-bst',
  'py-kth-smallest-bst',
  'py-lca-bst',
  'py-max-path-sum',
  // 10 · Tries
  'py-implement-trie',
  'py-word-search-ii',
  // 11 · Heap
  'py-kth-largest',
  'py-last-stone-weight',
  'py-task-scheduler',
  'py-smallest-range-k-lists',
  // 12 · Backtracking
  'py-subsets',
  'py-subsets-ii',
  'py-combination-sum',
  'py-permutations',
  'py-palindrome-partition',
  'py-n-queens',
  'py-word-search',
  // 13 · Graphs
  'py-number-of-islands',
  'py-max-area-island',
  'py-rotting-oranges',
  'py-pacific-atlantic',
  'py-alien-order',
  'py-word-ladder',
  'py-course-schedule',
  'py-course-schedule-ii',
  'py-count-components',
  // 14 · Dynamic programming
  'py-climbing-stairs',
  'py-house-robber',
  'py-house-robber-ii',
  'py-coin-change',
  'py-longest-increasing-subseq',
  'py-max-product-subarray',
  'py-longest-valid-parens',
  'py-longest-palindrome-substr',
  'py-count-palindromic-substrings',
  'py-decode-ways',
  'py-word-break',
  'py-can-partition',
  'py-unique-paths',
  'py-longest-common-subseq',
  'py-min-path-sum',
  'py-edit-distance',
  'py-burst-balloons',
  // 15 · Greedy
  'py-max-subarray',
  'py-jump-game',
  'py-jump-game-ii',
  'py-gas-station',
  'py-hand-of-straights',
  'py-candy',
  // 16 · Intervals
  'py-meeting-rooms',
  'py-merge-intervals',
  'py-insert-interval',
  'py-non-overlapping',
  'py-min-meeting-rooms',
  'py-employee-free-time',
  // 17 · Math & geometry
  'py-plus-one',
  'py-happy-number',
  'py-rotate-array',
  'py-spiral-matrix',
  'py-rotate-image',
  'py-pow',
  // 18 · Bits
  'py-single-number',
  'py-count-bits',
  'py-hamming-weight',
  'py-missing-number',
  'py-reverse-bits',
  'py-sum-two-integers',
];

const STEP_OF = (() => {
  const map = {};
  PATH.forEach((id, i) => {
    map[id] = i + 1;
  });
  return map;
})();

// 1-based step on the path, or null for questions off the path (imports).
export function pathStep(id) {
  return STEP_OF[id] ?? null;
}

// Sort comparator: path questions in step order, then off-path (imported) ones
// in their existing order.
export function byPathOrder(a, b) {
  const sa = STEP_OF[a.id] ?? Infinity;
  const sb = STEP_OF[b.id] ?? Infinity;
  return sa - sb;
}

// The next unsolved question on the path — "where you left off".
export function nextOnPath(questions, isSolvedFn) {
  const sorted = [...questions].sort(byPathOrder);
  return sorted.find((q) => !isSolvedFn(q.id)) || null;
}

// The question immediately before (step -1) or after (step +1) `id` in path
// order — what "Prev / Next" means while you are sitting on a problem, whether
// you solved it, skipped it, or are just reviewing. Null at either end.
export function neighborOnPath(questions, id, step) {
  const sorted = [...questions].sort(byPathOrder);
  const at = sorted.findIndex((q) => q.id === id);
  if (at < 0) return null;
  return sorted[at + step] ?? null;
}

const PATTERN_TO_CATEGORY = (() => {
  const map = {};
  for (const cat of ROADMAP) for (const p of cat.patterns) map[p] = cat.key;
  return map;
})();

export function categoryKeyOf(pattern) {
  return PATTERN_TO_CATEGORY[pattern] || 'other';
}

export function categoryOf(question) {
  return ROADMAP.find((c) => c.key === categoryKeyOf(question.pattern));
}
