// Model-solution complexity for every question that doesn't carry one on its
// approaches. Each string was written against the ACTUAL reference solution in
// the bank (e.g. LIS ships the O(n²) DP, rotate-array ships slicing), not the
// theoretical best — the point is comparing YOUR answer to THIS code.
// Convention: "<time> time, <space> space", extra context after an em dash.

export const COMPLEXITY = {
  // ---- python foundations ----
  'py-char-frequency': 'O(n) time, O(k) space — k distinct characters',
  'py-common-elements': 'O(n + m) time, O(n) space',
  'py-invert-dict': 'O(n) time, O(n) space',
  'py-reverse-string': 'O(n) time, O(n) space',
  'py-first-unique-char': 'O(n) time, O(k) space',
  'py-merge-counts': 'O(n + m) time, O(n + m) space',
  'py-fizzbuzz': 'O(n) time, O(n) space',
  'py-group-anagrams': 'O(n·k) time, O(n·k) space — k = longest word',
  'py-valid-palindrome': 'O(n) time, O(1) space',
  'py-binary-search': 'O(log n) time, O(1) space',
  'py-valid-parentheses': 'O(n) time, O(n) space',

  // ---- arrays / hashing / two pointers / sliding window ----
  'py-longest-consecutive': 'O(n) time, O(n) space',
  'py-two-sum-sorted': 'O(n) time, O(1) space',
  'py-char-replacement': 'O(n) time, O(26) space',
  'py-permutation-in-string': 'O(n) time, O(26) space',
  'py-min-window-substring': 'O(n + m) time, O(m) space',
  'py-max-product-subarray': 'O(n) time, O(1) space',
  'py-trapping-rain': 'O(n) time, O(1) space — two pointers',

  // ---- stack ----
  'py-eval-rpn': 'O(n) time, O(n) space',
  'py-daily-temperatures': 'O(n) time, O(n) space — monotonic stack',
  'py-min-stack': 'O(1) per operation, O(n) space',
  'py-car-fleet': 'O(n log n) time — the sort dominates, O(n) space',
  'py-largest-rectangle': 'O(n) time, O(n) space — monotonic stack',

  // ---- binary search ----
  'py-search-rotated': 'O(log n) time, O(1) space',
  'py-find-min-rotated': 'O(log n) time, O(1) space',
  'py-koko-bananas': 'O(n log m) time — m = largest pile, O(1) space',
  'py-search-2d-matrix': 'O(log(m·n)) time, O(1) space',

  // ---- sliding window (deque) ----
  'py-sliding-window-max': 'O(n) time, O(k) space — monotonic deque',

  // ---- linked list ----
  'py-merge-sorted-lists': 'O(n + m) time, O(1) extra space',
  'py-reorder-list': 'O(n) time, O(1) space',
  'py-reverse-list': 'O(n) time, O(1) space',
  'py-remove-nth-end': 'O(n) time, O(1) space',
  'py-add-two-numbers': 'O(max(n, m)) time, O(max(n, m)) space',
  'py-merge-k-lists': 'O(N log k) time — N total nodes, k lists; O(k) space',

  // ---- trees ----
  'py-max-depth-tree': 'O(n) time, O(h) space — h = tree height',
  'py-invert-tree': 'O(n) time, O(h) space',
  'py-same-tree': 'O(n) time, O(h) space',
  'py-validate-bst': 'O(n) time, O(h) space',
  'py-tree-diameter': 'O(n) time, O(h) space',
  'py-level-order': 'O(n) time, O(n) space',
  'py-subtree': 'O(n + m) time, O(n + m) space — serialize with null markers',
  'py-kth-smallest-bst': 'O(h + k) time, O(h) space',
  'py-lca-bst': 'O(h) time, O(1) space',
  'py-max-path-sum': 'O(n) time, O(h) space',
  'py-implement-trie': 'O(L) per operation — L = word length',

  // ---- heap ----
  'py-kth-largest': 'O(n log k) time, O(k) space',
  'py-last-stone-weight': 'O(n log n) time, O(n) space',
  'py-task-scheduler': 'O(n) time, O(26) space — counting, no simulation',

  // ---- backtracking ----
  'py-subsets': 'O(n · 2ⁿ) time and space',
  'py-subsets-ii': 'O(n · 2ⁿ) time and space',
  'py-permutations': 'O(n · n!) time and space',
  'py-combination-sum': 'O(2^t) time — t grows with target, O(t) recursion depth',
  'py-generate-parens': 'O(4ⁿ/√n) time — Catalan growth',
  'py-word-search': 'O(m·n · 4^L) time — L = word length, O(L) space',
  'py-palindrome-partition': 'O(n · 2ⁿ) time, O(n²) space — precomputed palindrome table',

  // ---- graphs ----
  'py-number-of-islands': 'O(m·n) time, O(m·n) space worst case',
  'py-max-area-island': 'O(m·n) time, O(m·n) space worst case',
  'py-rotting-oranges': 'O(m·n) time, O(m·n) space — BFS',
  'py-course-schedule': 'O(V + E) time, O(V + E) space',
  'py-course-schedule-ii': 'O(V + E) time, O(V + E) space',
  'py-count-components': 'O(V + E) time, O(V + E) space',
  'py-pacific-atlantic': 'O(m·n) time, O(m·n) space',

  // ---- dynamic programming ----
  'py-climbing-stairs': 'O(n) time, O(1) space',
  'py-house-robber': 'O(n) time, O(1) space',
  'py-house-robber-ii': 'O(n) time, O(1) space',
  'py-coin-change': 'O(amount · coins) time, O(amount) space',
  'py-longest-increasing-subseq': 'O(n log n) time — patience piles, O(n) space',
  'py-unique-paths': 'O(m·n) time, O(n) space — one rolling row',
  'py-longest-common-subseq': 'O(n·m) time, O(n·m) space',
  'py-longest-palindrome-substr': 'O(n²) time, O(1) space — expand around centers',
  'py-count-palindromic-substrings': 'O(n²) time, O(1) space',
  'py-decode-ways': 'O(n) time, O(1) space — two rolling values',
  'py-word-break': 'O(n²) time, O(n) space',
  'py-can-partition': 'O(n · target) time, O(target) space',
  'py-min-path-sum': 'O(m·n) time, O(n) space — one rolling row',
  'py-edit-distance': 'O(n·m) time, O(n·m) space — full table',

  // ---- greedy / intervals ----
  'py-jump-game': 'O(n) time, O(1) space',
  'py-jump-game-ii': 'O(n) time, O(1) space',
  'py-gas-station': 'O(n) time, O(1) space',
  'py-hand-of-straights': 'O(n log n) time, O(n) space',
  'py-merge-intervals': 'O(n log n) time, O(n) space',
  'py-meeting-rooms': 'O(n log n) time, O(1) space',
  'py-insert-interval': 'O(n) time, O(n) space',
  'py-non-overlapping': 'O(n log n) time, O(1) space',
  'py-min-meeting-rooms': 'O(n log n) time, O(n) space',

  // ---- math / matrix ----
  'py-rotate-image': 'O(n²) time, O(1) space — in place',
  'py-spiral-matrix': 'O(m·n) time, O(1) extra space',
  'py-happy-number': 'O(log n) per step, O(1) space — Floyd cycle detection',
  'py-plus-one': 'O(n) time, O(1) extra space',
  'py-pow': 'O(log n) time, O(1) space — fast exponentiation',
  'py-rotate-array': 'O(n) time, O(n) space — slicing copies',

  // ---- bit manipulation ----
  'py-single-number': 'O(n) time, O(1) space',
  'py-count-bits': 'O(n) time, O(n) space',
  'py-hamming-weight': 'O(k) time — k set bits, O(1) space',
  'py-missing-number': 'O(n) time, O(1) space',
  'py-reverse-bits': 'O(32) ≈ O(1) time, O(1) space',
  'py-sum-two-integers': 'O(32) ≈ O(1) time, O(1) space',

  // ---- pandas (n = rows) ----
  'pd-filter-rows': 'O(n) time, O(n) space over the rows',
  'pd-select-columns': 'O(n) time, O(n) space',
  'pd-value-counts': 'O(n) time, O(k) space — k distinct values',
  'pd-groupby-agg': 'O(n) time, O(g) space — g groups',
  'pd-merge-frames': 'O(n + m) time — hash join, O(n + m) space',
  'pd-top-n': 'O(n log n) time — the sort dominates, O(n) space',
  'pd-handle-nan': 'O(n) time, O(n) space',
  'pd-computed-column': 'O(n) time, O(n) space',

  // ---- sql (n = rows scanned) ----
  'sql-select-where': 'O(n) — full-table scan',
  'sql-order-limit': 'O(n log n) — the ORDER BY dominates',
  'sql-count-group': 'O(n) scan, O(g) space — g groups',
  'sql-having': 'O(n) scan, O(g) space',
  'sql-inner-join': 'O(n + m) with a hash/index join; O(n·m) naive',
  'sql-left-join-null': 'O(n + m) with a hash/index join',
  'sql-subquery': 'O(n) — the subquery runs once, then one scan',
  'sql-window-top-per-group': 'O(n log n) — window sort per partition',
  // ── batch 6: the hard tier. Each string is byte-identical to the LAST entry
  // of APPROACHES[id] — the model answer the Big-O check-in grades against.
  'py-alien-order': 'O(n) time, O(1) space — topological sort',
  'py-longest-valid-parens': 'O(n) time, O(1) space — two counter passes',
  'py-n-queens': 'O(n!) time, O(n) space — backtracking with diagonal sets',
  'py-median-two-sorted': 'O(log(min(m, n))) time, O(1) space — binary search on the cut',
  'py-word-search-ii': 'O(m · n · 4ᴸ) time, O(total letters) space — trie-pruned DFS',
  'py-employee-free-time': 'O(n log n) time, O(n) space — merge then read gaps',
  'py-smallest-range-k-lists': 'O(n log k) time, O(k) space — min-heap over k pointers',
  'py-word-ladder': 'O(N · L · 26) time, O(N · L) space — BFS on an implicit graph',
  'py-burst-balloons': 'O(n³) time, O(n²) space — interval DP on the last burst',
  'py-candy': 'O(n) time, O(n) space — two sweeps, max of both',
};
