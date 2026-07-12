import { categoryKeyOf } from './roadmap.js';

// First-rung help by pattern family: how to RECOGNISE the problem type and what
// tool to reach for. Keyed by roadmap category, so one line covers every
// question in that family (no per-question authoring). This is the "I don't
// even know where to start" nudge — technique-level, never a spoiler.
const HINTS = {
  'arrays-hashing': {
    tell: 'You need fast "have I seen this?" or "how many of these?" lookups.',
    reach: 'Reach for a hash map or set — O(1) membership turns an O(n²) scan into a single O(n) pass.',
  },
  'two-pointers': {
    tell: 'The array is sorted (or can be), and you are pairing or scanning from both ends.',
    reach: 'Use two indices — one at each end moving inward, or a slow/fast pair — to replace a nested loop.',
  },
  'sliding-window': {
    tell: 'You want the best (longest / smallest / max-sum) contiguous run of a subarray or substring.',
    reach: 'Grow a window with the right pointer; shrink it from the left the moment it breaks the rule; track the answer as you go.',
  },
  stack: {
    tell: 'You keep needing the most recent unmatched thing — brackets, "next greater", nesting.',
    reach: 'Push onto a stack as you scan and pop when the current item resolves whatever is on top.',
  },
  'binary-search': {
    tell: 'The data is sorted, or you are hunting a threshold in a monotonic answer space.',
    reach: 'Halve the range each step: pick the middle, decide which half can still hold the answer, discard the other.',
  },
  'linked-list': {
    tell: 'You are re-linking nodes or detecting structure in a chain.',
    reach: 'Use a dummy head plus careful pointer moves; a slow/fast pair finds the middle or a cycle.',
  },
  trees: {
    tell: 'The input is a tree and the answer depends on its children or its depth.',
    reach: 'Recurse: solve the left and right subtrees, then combine. Use BFS with a queue when you need level-by-level.',
  },
  tries: {
    tell: 'You are matching many strings that share prefixes.',
    reach: 'Build a trie: one node per character, children keyed by letter, a flag marking where words end.',
  },
  heap: {
    tell: 'You repeatedly need the smallest or largest of a changing set — "top K", "k-th largest".',
    reach: 'Use a heap (heapq) for the min/max in O(log n); keep only K elements when you want the top K.',
  },
  backtracking: {
    tell: 'You must enumerate combinations, permutations, or subsets while pruning dead ends.',
    reach: 'Recurse choosing one element at a time: add it, recurse, then UNDO the choice before trying the next.',
  },
  graphs: {
    tell: 'Things are connected — a grid, nodes and edges, reachability, or shortest path.',
    reach: 'DFS or BFS from each unvisited node with a visited set to stop loops; BFS gives shortest unweighted paths.',
  },
  dp: {
    tell: 'The answer builds on answers to smaller subproblems, and those subproblems overlap.',
    reach: 'Define the state (what does dp[i] mean?), write the recurrence, then fill a table or memoize.',
  },
  greedy: {
    tell: 'Taking the locally best choice at each step looks like it reaches the global best.',
    reach: 'Sort or scan, grab the best available option each step, and be ready to argue it never needs undoing.',
  },
  intervals: {
    tell: 'You are merging, overlapping, or scheduling ranges.',
    reach: 'Sort by start (or end), then sweep left to right, merging or counting overlaps as you pass them.',
  },
  'math-geometry': {
    tell: 'The trick is a numeric property or an in-place index manipulation.',
    reach: 'Look for a formula, a modulo / carry pattern, or moving values in place with index arithmetic.',
  },
  bits: {
    tell: 'The problem smells binary — XOR, counting set bits, powers of two.',
    reach: 'Reach for bit ops: XOR cancels equal pairs, n & (n-1) clears the lowest set bit, << and >> shift.',
  },
  pandas: {
    tell: 'You are reshaping or aggregating tabular data.',
    reach: 'Think in whole columns: filter with a boolean mask, then groupby / agg / merge — avoid Python loops.',
  },
  sql: {
    tell: 'You are selecting rows from tables.',
    reach: 'Start SELECT … FROM … WHERE; add GROUP BY for aggregates, JOIN to combine tables, window functions for per-row rankings.',
  },
  warmups: {
    tell: 'This is a fundamentals warm-up — small and self-contained.',
    reach: 'Read the examples closely and translate them straight into a loop or a built-in.',
  },
  other: {
    tell: 'Start from the examples — what has to happen to turn the input into the output?',
    reach: 'Name the data structure that makes the key operation cheap, then write the simplest loop that works.',
  },
};

// Data-track questions get sharper, per-pattern nudges (the two categories
// above stay as fallbacks). Keyed by the RAW question pattern.
const DATA_HINTS = {
  // pandas
  selection: {
    tell: 'You only need some of the columns, or a cleaned-up view of them.',
    reach: 'Select with a list of column names (double brackets keep a DataFrame), and rename/retype columns explicitly rather than working around them.',
  },
  filtering: {
    tell: 'You want the subset of ROWS that satisfy a condition.',
    reach: 'Build a boolean mask from whole-column comparisons and index the frame with it; combine conditions with & and | (parenthesized), negate with ~.',
  },
  sorting: {
    tell: 'The answer is "the best K rows" or a specific display order.',
    reach: 'One sort_values call can take a list of keys with a direction per key; top-N is a sort (or nlargest) followed by head.',
  },
  transform: {
    tell: 'You are deriving new columns from old ones, or the table is the wrong shape (wide vs long, raw vs binned).',
    reach: 'Compute on whole columns at once, and know the reshapers: melt for wide→long, pivot for long→wide, rolling/cumulative for windows, cut for binning.',
  },
  groupby: {
    tell: 'The answer is one number per category — or a per-row value that depends on the row’s whole group.',
    reach: 'groupby the key, then decide the shape: an aggregation collapses to one row per group, a transform keeps every row (that is the window-function move).',
  },
  merge: {
    tell: 'The answer needs columns that live in two different tables.',
    reach: 'merge on the shared key and choose `how` deliberately: inner keeps matches, left keeps every left row and manufactures NaN for the holes.',
  },
  'missing-data': {
    tell: 'The data has holes (NaN) and the spec says what should happen to them.',
    reach: 'State a policy per column: isna/notna to find them, dropna to remove rows, fillna to substitute defaults — never let NaN flow through silently.',
  },
  // SQL
  'select-where': {
    tell: 'You are reading rows that satisfy a condition — no grouping, no second table.',
    reach: 'SELECT the needed columns FROM the table, filter in WHERE; remember NULL never equals anything — test it with IS (NOT) NULL.',
  },
  'order-limit': {
    tell: 'The result must come back in a specific order, or only the first N rows of it.',
    reach: 'ORDER BY (multiple keys, each ASC/DESC) before LIMIT — an unordered LIMIT is nondeterministic; DISTINCT dedupes before both.',
  },
  'group-by': {
    tell: 'The answer is one row per category with a count / sum / average.',
    reach: 'GROUP BY the category and aggregate the rest; a CASE WHEN inside an aggregate counts conditionally, turning categories into columns.',
  },
  having: {
    tell: 'You are filtering on the RESULT of an aggregate ("teams with more than 10 wins").',
    reach: 'WHERE filters rows before grouping; HAVING filters the finished groups — put the aggregate condition there.',
  },
  join: {
    tell: 'The answer needs columns from two tables — or two different rows of the same table.',
    reach: 'JOIN ON the key that links them. Ask "who must survive without a match?" — that side goes LEFT, and its manufactured NULLs need COALESCE or IS NULL handling.',
  },
  subquery: {
    tell: 'The filter depends on another query’s answer — a threshold, or "rows of A with no match in B".',
    reach: 'Nest a query: a scalar subquery works anywhere a value could; EXISTS / NOT EXISTS asks "does a matching row exist?" per row and is NULL-safe where IN is not.',
  },
  'window-functions': {
    tell: 'EVERY row needs a value computed from its group — a rank, running total, neighbour, or share of total.',
    reach: 'Aggregate OVER a window instead of collapsing: PARTITION BY resets per group, ORDER BY inside the OVER makes it cumulative, and rank/offset functions (ROW_NUMBER, LAG) ride the same sort. Filter on a window in an outer query.',
  },
};

export function patternHint(question) {
  return DATA_HINTS[question.pattern] || HINTS[categoryKeyOf(question.pattern)] || HINTS.other;
}

export { HINTS as PATTERN_HINTS, DATA_HINTS };
