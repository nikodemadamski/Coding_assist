// The learning roadmap — pattern categories in the order a NeetCode-style
// curriculum teaches them. Raw question `pattern` tags map into these buckets so
// the browse view reads like a syllabus, foundations first.

export const ROADMAP = [
  {
    key: 'arrays-hashing',
    label: '1 · Arrays & Hashing',
    blurb: 'Counting, sets, and dictionaries. Everything else builds on this.',
    patterns: ['hashing', 'arrays-hashing', 'frequency-dict', 'sets', 'dict-items', 'strings', 'control-flow'],
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
    key: 'linked-list',
    label: '6 · Linked List',
    blurb: 'Pointer surgery: dummy heads, fast/slow, in-place reversal.',
    patterns: ['linked-list'],
  },
  {
    key: 'trees',
    label: '7 · Trees',
    blurb: 'Recursion over structure — DFS depth/validate, BFS by level.',
    patterns: ['trees'],
  },
  {
    key: 'heap',
    label: '8 · Heap / Priority Queue',
    blurb: 'Top-K and "always grab the extreme" in O(log n).',
    patterns: ['heap'],
  },
  {
    key: 'backtracking',
    label: '9 · Backtracking',
    blurb: 'Build a decision tree; choose, recurse, un-choose.',
    patterns: ['backtracking'],
  },
  {
    key: 'graphs',
    label: '10 · Graphs',
    blurb: 'Grids and adjacency: DFS flood-fill, BFS shortest-time, topo-sort.',
    patterns: ['graphs'],
  },
  {
    key: 'dp',
    label: '11 · Dynamic Programming',
    blurb: 'Overlapping subproblems. Define the state, write the recurrence.',
    patterns: ['dp-1d', 'dp-2d'],
  },
  {
    key: 'greedy',
    label: '12 · Greedy',
    blurb: 'Locally optimal choices that provably reach the global optimum.',
    patterns: ['greedy'],
  },
  {
    key: 'intervals',
    label: '13 · Intervals',
    blurb: 'Sort by start, then sweep. Merge, overlap, schedule.',
    patterns: ['intervals'],
  },
  {
    key: 'bits',
    label: '14 · Bit Manipulation',
    blurb: 'XOR cancellation, masks, and shift tricks.',
    patterns: ['bits'],
  },
  {
    key: 'pandas',
    label: 'pandas',
    blurb: 'DataFrame fluency for the data-science side of the loop.',
    patterns: ['filtering', 'selection', 'groupby', 'merge', 'sorting', 'missing-data', 'transform'],
  },
  {
    key: 'sql',
    label: 'SQL',
    blurb: 'Joins, aggregation, subqueries, and window functions.',
    patterns: ['select-where', 'order-limit', 'group-by', 'having', 'join', 'subquery', 'window-functions'],
  },
  {
    key: 'other',
    label: 'Other',
    blurb: 'Everything else, including questions you imported.',
    patterns: [],
  },
];

const PATTERN_TO_CATEGORY = (() => {
  const map = {};
  for (const cat of ROADMAP) for (const p of cat.patterns) map[p] = cat.key;
  return map;
})();

export function categoryKeyOf(pattern) {
  return PATTERN_TO_CATEGORY[pattern] || 'other';
}

export const ROADMAP_ORDER = ROADMAP.reduce((acc, cat, i) => {
  acc[cat.key] = i;
  return acc;
}, {});
