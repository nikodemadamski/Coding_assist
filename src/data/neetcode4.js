// NeetCode-150 expansion, part 4: dynamic programming (1-D and 2-D),
// greedy, intervals, and bit manipulation.

export const NEETCODE_4 = [
  // ── 1-D dynamic programming ───────────────────────────────────────
  {
    id: 'py-climbing-stairs',
    track: 'python',
    title: 'Climbing Stairs',
    difficulty: 'easy',
    pattern: 'dp-1d',
    description:
      'You climb a staircase of `n` steps, taking 1 or 2 steps at a time. Return the number of distinct ways to reach the top.\n\nThe "hello world" of dynamic programming — and secretly Fibonacci.',
    examples: ['climb_stairs(2) -> 2   climb_stairs(3) -> 3   climb_stairs(5) -> 8'],
    function_name: 'climb_stairs',
    starter_code: 'def climb_stairs(n):\n    # ways(n) = ways(n-1) + ways(n-2)\n    ...\n',
    tests: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
      { args: [5], expected: 8 },
      { args: [1], expected: 1 },
      { args: [10], expected: 89 },
    ],
    hint: 'To reach step n you came from n-1 (a 1-step) or n-2 (a 2-step). So ways(n) = ways(n-1) + ways(n-2).',
    approach:
      'The recurrence writes itself: the last move onto step `n` was either a single step from `n-1` or a double from `n-2`, so `ways(n) = ways(n-1) + ways(n-2)` with `ways(0)=ways(1)=1`. That is Fibonacci.\n\nInstead of a full array, carry the last two values in two variables — O(n) time, O(1) space. This "keep only the last k states" compression is the first optimization to reach for in any 1-D DP (House Robber and Min Cost Climbing Stairs are the same skeleton).',
    solution:
      'def climb_stairs(n):\n    a, b = 1, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n',
  },
  {
    id: 'py-house-robber',
    track: 'python',
    title: 'House Robber',
    difficulty: 'medium',
    pattern: 'dp-1d',
    description:
      'Given `nums`, the money in a row of houses, return the maximum you can rob **without taking two adjacent houses**.',
    examples: ['rob([2,7,9,3,1]) -> 12   # houses 0,2,4 = 2+9+1'],
    function_name: 'rob',
    starter_code: 'def rob(nums):\n    # for each house: skip it, or take it + best two back\n    ...\n',
    tests: [
      { args: [[2, 7, 9, 3, 1]], expected: 12 },
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[]], expected: 0 },
      { args: [[5]], expected: 5 },
      { args: [[2, 1, 1, 2]], expected: 4 },
    ],
    hint: 'At each house choose the better of: skip it (carry the previous best), or rob it + the best from two houses back.',
    approach:
      'The choice at house `i`: **skip** it and keep the best total up to `i-1`, or **rob** it and add the best total up to `i-2` (never `i-1`, since adjacency is banned). So `best[i] = max(best[i-1], nums[i] + best[i-2])`.\n\nTrack the two rolling values `prev` (best up to i-1) and `prev2` (best up to i-2) — O(n) time, O(1) space. House Robber II wraps this in a circle: run it twice, once excluding the first house and once the last, and take the max.',
    solution:
      'def rob(nums):\n    prev, prev2 = 0, 0\n    for n in nums:\n        prev, prev2 = max(prev, prev2 + n), prev\n    return prev\n',
  },
  {
    id: 'py-coin-change',
    track: 'python',
    title: 'Coin Change',
    difficulty: 'medium',
    pattern: 'dp-1d',
    description:
      'Given coin denominations `coins` (unlimited supply) and an `amount`, return the **fewest coins** that sum to `amount`, or `-1` if it is impossible.',
    examples: ['coin_change([1,2,5], 11) -> 3   # 5+5+1'],
    function_name: 'coin_change',
    starter_code:
      'def coin_change(coins, amount):\n    # best[a] = 1 + min(best[a - coin]) over coins\n    ...\n',
    tests: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0 },
      { args: [[1, 3, 4, 5], 7], expected: 2 },
      { args: [[2, 5, 10, 1], 27], expected: 4 },
    ],
    hint: 'Build up best[0..amount]. best[a] = 1 + the smallest best[a - coin] among coins that fit.',
    approach:
      'Bottom-up DP over amounts `0..amount`. `best[a]` is the fewest coins for amount `a`: try each coin, and if it fits, `best[a] = min(best[a], 1 + best[a - coin])`. Seed `best[0] = 0` and everything else to infinity; a leftover infinity at the end means unreachable → −1.\n\nO(amount × len(coins)). The key realization for interviews: **greedy (always take the biggest coin) fails** — [1,3,4] for 6 is 3+3, not 4+1+1 — which is exactly why this needs DP. This unbounded-knapsack shape also solves Coin Change II (count combinations) and Perfect Squares.',
    solution:
      'def coin_change(coins, amount):\n    best = [0] + [float("inf")] * amount\n    for a in range(1, amount + 1):\n        for coin in coins:\n            if coin <= a:\n                best[a] = min(best[a], 1 + best[a - coin])\n    return best[amount] if best[amount] != float("inf") else -1\n',
  },
  {
    id: 'py-longest-increasing-subseq',
    track: 'python',
    title: 'Longest Increasing Subsequence',
    difficulty: 'medium',
    pattern: 'dp-1d',
    description:
      'Return the length of the longest **strictly increasing subsequence** of `nums` (elements keep their order but need not be adjacent).',
    examples: ['length_of_lis([10,9,2,5,3,7,101,18]) -> 4   # 2,3,7,101'],
    function_name: 'length_of_lis',
    starter_code:
      'def length_of_lis(nums):\n    # dp[i] = longest increasing subsequence ending at i\n    ...\n',
    tests: [
      { args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
      { args: [[0, 1, 0, 3, 2, 3]], expected: 4 },
      { args: [[7, 7, 7, 7]], expected: 1 },
      { args: [[]], expected: 0 },
      { args: [[4, 10, 4, 3, 8, 9]], expected: 3 },
    ],
    hint: 'dp[i] = 1 + max(dp[j]) over all j < i with nums[j] < nums[i]. Answer is max(dp).',
    approach:
      'Classic O(n²) DP: `dp[i]` is the length of the longest increasing subsequence **ending exactly at** `i`. For each `i`, look back at every `j < i` with `nums[j] < nums[i]` and take `dp[i] = 1 + max(dp[j])`. The answer is the max over all `dp[i]`.\n\nThe advanced O(n log n) version maintains a "tails" array with binary search (`bisect_left`) — worth naming even if you code the quadratic one. LIS is the template behind Russian Doll Envelopes and Longest Chain problems.',
    solution:
      'def length_of_lis(nums):\n    if not nums:\n        return 0\n    dp = [1] * len(nums)\n    for i in range(len(nums)):\n        for j in range(i):\n            if nums[j] < nums[i]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp)\n',
  },

  // ── 2-D dynamic programming ───────────────────────────────────────
  {
    id: 'py-unique-paths',
    track: 'python',
    title: 'Unique Paths',
    difficulty: 'medium',
    pattern: 'dp-2d',
    description:
      'A robot at the top-left of an `m × n` grid can move only right or down. Return the number of distinct paths to the bottom-right corner.',
    examples: ['unique_paths(3, 7) -> 28'],
    function_name: 'unique_paths',
    starter_code:
      'def unique_paths(m, n):\n    # paths(cell) = paths(above) + paths(left)\n    ...\n',
    tests: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 3 },
      { args: [1, 1], expected: 1 },
      { args: [3, 3], expected: 6 },
      { args: [1, 10], expected: 1 },
    ],
    hint: 'Ways to reach a cell = ways to the cell above + ways to the cell to the left. First row and column are all 1.',
    approach:
      'Grid DP: the only way into a cell is from above or from the left, so `paths(r,c) = paths(r-1,c) + paths(r-1,c)`, with the top row and left column all 1 (a single straight path). Fill row by row.\n\nCompress to a single row of length `n` updated left-to-right — O(n) space. (There is also a pure combinatorics answer: C(m+n-2, m-1) — mention it to show range.) The rolling-row idea generalizes to Minimum Path Sum and Unique Paths II with obstacles.',
    solution:
      'def unique_paths(m, n):\n    row = [1] * n\n    for _ in range(m - 1):\n        for c in range(1, n):\n            row[c] += row[c - 1]\n    return row[n - 1]\n',
  },
  {
    id: 'py-longest-common-subseq',
    track: 'python',
    title: 'Longest Common Subsequence',
    difficulty: 'medium',
    pattern: 'dp-2d',
    description:
      'Given two strings, return the length of their longest common **subsequence** (characters in the same relative order, not necessarily contiguous).',
    examples: ['lcs("abcde", "ace") -> 3   # "ace"'],
    function_name: 'lcs',
    starter_code:
      'def lcs(a, b):\n    # 2-D table over prefixes of a and b\n    ...\n',
    tests: [
      { args: ['abcde', 'ace'], expected: 3 },
      { args: ['abc', 'abc'], expected: 3 },
      { args: ['abc', 'def'], expected: 0 },
      { args: ['bl', 'yby'], expected: 1 },
      { args: ['', 'x'], expected: 0 },
    ],
    hint: 'dp[i][j] over prefixes: if last chars match, 1 + dp[i-1][j-1]; else max(dp[i-1][j], dp[i][j-1]).',
    approach:
      'The canonical two-string DP. `dp[i][j]` is the LCS of the first `i` chars of `a` and first `j` of `b`. If `a[i-1] == b[j-1]` those characters can extend a common subsequence: `1 + dp[i-1][j-1]`. Otherwise drop one character from either string and take the better: `max(dp[i-1][j], dp[i][j-1])`.\n\nO(m·n) time and space (compressible to two rows). Master this grid and you get Edit Distance, Longest Palindromic Subsequence (LCS of s and reversed s), and string-alignment problems almost for free.',
    solution:
      'def lcs(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = 1 + dp[i - 1][j - 1]\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[m][n]\n',
  },

  // ── greedy ────────────────────────────────────────────────────────
  {
    id: 'py-max-subarray',
    track: 'python',
    title: 'Maximum Subarray',
    difficulty: 'medium',
    pattern: 'greedy',
    description:
      'Given `nums`, return the largest sum of any **contiguous** non-empty subarray (Kadane\'s algorithm).',
    examples: ['max_subarray([-2,1,-3,4,-1,2,1,-5,4]) -> 6   # [4,-1,2,1]'],
    function_name: 'max_subarray',
    starter_code:
      'def max_subarray(nums):\n    # extend the running sum, or restart at the current element\n    ...\n',
    tests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
      { args: [[-1, -2, -3]], expected: -1 },
      { args: [[-2, -1]], expected: -1 },
    ],
    hint: 'Running sum: at each element, either extend (add it) or restart from it — whichever is larger. Track the best running sum ever seen.',
    approach:
      "Kadane's algorithm. Keep a running best-ending-here: at each element decide to **extend** the previous subarray (`running + n`) or **restart** fresh (`n`) — whichever is larger. The global answer is the max running value ever seen.\n\nO(n), O(1). The all-negatives case is why you seed with the first element (not 0) and take max, not a floor of zero. Kadane generalizes to Maximum Product Subarray (track both max and min, since a negative flips them) and to the circular variant.",
    solution:
      'def max_subarray(nums):\n    best = running = nums[0]\n    for n in nums[1:]:\n        running = max(n, running + n)\n        best = max(best, running)\n    return best\n',
  },
  {
    id: 'py-jump-game',
    track: 'python',
    title: 'Jump Game',
    difficulty: 'medium',
    pattern: 'greedy',
    description:
      'Given `nums` where `nums[i]` is the maximum jump length from index `i`, return `True` if you can reach the last index starting from index 0.',
    examples: ['can_jump([2,3,1,1,4]) -> True   can_jump([3,2,1,0,4]) -> False'],
    function_name: 'can_jump',
    starter_code:
      'def can_jump(nums):\n    # track the furthest index reachable so far\n    ...\n',
    tests: [
      { args: [[2, 3, 1, 1, 4]], expected: true },
      { args: [[3, 2, 1, 0, 4]], expected: false },
      { args: [[0]], expected: true },
      { args: [[2, 0, 0]], expected: true },
      { args: [[1, 0, 1, 0]], expected: false },
    ],
    hint: 'Sweep left to right tracking the furthest index reachable. If you ever stand on an index beyond that reach, you are stuck.',
    approach:
      'Greedy reachability in one pass: keep `furthest`, the maximum index reachable so far. At index `i`, if `i > furthest` you can never have arrived here → return False. Otherwise update `furthest = max(furthest, i + nums[i])`. If the loop finishes, the end is reachable.\n\nO(n), O(1) — no DP array needed. The insight is that you only need the single furthest reach, not which path produced it. Jump Game II (fewest jumps) extends this with a BFS-like "current jump boundary" sweep.',
    solution:
      'def can_jump(nums):\n    furthest = 0\n    for i, n in enumerate(nums):\n        if i > furthest:\n            return False\n        furthest = max(furthest, i + n)\n    return True\n',
  },

  // ── intervals ─────────────────────────────────────────────────────
  {
    id: 'py-merge-intervals',
    track: 'python',
    title: 'Merge Intervals',
    difficulty: 'medium',
    pattern: 'intervals',
    description:
      'Given a list of intervals `[start, end]`, merge all overlapping intervals and return them sorted by start.',
    examples: ['merge_intervals([[1,3],[2,6],[8,10],[15,18]]) -> [[1,6],[8,10],[15,18]]'],
    function_name: 'merge_intervals',
    starter_code:
      'def merge_intervals(intervals):\n    # sort by start, then sweep and merge overlaps\n    ...\n',
    tests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
      { args: [[[1, 4]]], expected: [[1, 4]] },
      { args: [[[1, 4], [5, 6]]], expected: [[1, 4], [5, 6]] },
    ],
    hint: 'Sort by start. Walk through: if the next interval starts at or before the current end, extend the end; otherwise close the current interval and open a new one.',
    approach:
      '**Sort by start first** — that is the move that makes every interval problem tractable. Then sweep once, keeping the "current" merged interval: if the next interval starts `<=` the current end, they overlap, so extend the end to `max(end, next_end)`; otherwise the current interval is finished, push it and start fresh.\n\nO(n log n) for the sort, O(n) sweep. Once you internalize "sort by start, sweep, extend-or-push," you also have Insert Interval, Non-overlapping Intervals, and Meeting Rooms.',
    solution:
      'def merge_intervals(intervals):\n    intervals = sorted(intervals, key=lambda x: x[0])\n    merged = [intervals[0][:]]\n    for start, end in intervals[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged\n',
  },
  {
    id: 'py-meeting-rooms',
    track: 'python',
    title: 'Meeting Rooms',
    difficulty: 'easy',
    pattern: 'intervals',
    description:
      'Given meeting time intervals `[start, end]`, return `True` if a single person could attend **all** meetings — i.e. no two overlap. (A meeting ending exactly when another starts is fine.)',
    examples: ['can_attend_all([[0,30],[5,10],[15,20]]) -> False   can_attend_all([[7,10],[2,4]]) -> True'],
    function_name: 'can_attend_all',
    starter_code:
      'def can_attend_all(intervals):\n    # sort by start; any meeting starting before the previous ends is a clash\n    ...\n',
    tests: [
      { args: [[[0, 30], [5, 10], [15, 20]]], expected: false },
      { args: [[[7, 10], [2, 4]]], expected: true },
      { args: [[]], expected: true },
      { args: [[[1, 5], [5, 8]]], expected: true },
      { args: [[[1, 5], [4, 8]]], expected: false },
    ],
    hint: 'Sort by start. If any meeting begins strictly before the previous one ends, there is a conflict.',
    approach:
      'Sort by start time, then a single adjacent-pair scan settles it: if any meeting starts **strictly before** the previous one ends, they overlap → False. Touching endpoints (`start == prev_end`) are allowed, so the comparison is `start < prev_end`.\n\nO(n log n). Meeting Rooms II (minimum rooms needed) is the natural follow-up: sort starts and ends separately and sweep, or use a min-heap of end times — a great thing to be able to pivot to when the interviewer raises the stakes.',
    solution:
      'def can_attend_all(intervals):\n    intervals = sorted(intervals, key=lambda x: x[0])\n    for i in range(1, len(intervals)):\n        if intervals[i][0] < intervals[i - 1][1]:\n            return False\n    return True\n',
  },

  // ── bit manipulation ──────────────────────────────────────────────
  {
    id: 'py-single-number',
    track: 'python',
    title: 'Single Number',
    difficulty: 'easy',
    pattern: 'bits',
    description:
      'Every element in `nums` appears **twice except one**. Find the loner in O(n) time and O(1) space.',
    examples: ['single_number([4,1,2,1,2]) -> 4'],
    function_name: 'single_number',
    starter_code: 'def single_number(nums):\n    # XOR cancels pairs\n    ...\n',
    tests: [
      { args: [[4, 1, 2, 1, 2]], expected: 4 },
      { args: [[2, 2, 1]], expected: 1 },
      { args: [[1]], expected: 1 },
      { args: [[-3, -3, 7]], expected: 7 },
      { args: [[0, 0, 5]], expected: 5 },
    ],
    hint: 'XOR has two magic properties: x ^ x = 0 and x ^ 0 = x. XOR the whole list together.',
    approach:
      'XOR everything together. Because `x ^ x == 0` and `x ^ 0 == x`, every duplicated pair annihilates itself and the lone element is left standing. Order does not matter (XOR is commutative), so a single left-to-right fold does it.\n\nO(n) time, O(1) space — beating the obvious hash-set approach on memory. This is the gateway bit trick; Single Number II (every element thrice but one) and Missing Number are variations on the same "let XOR cancel the noise" idea.',
    solution:
      'def single_number(nums):\n    result = 0\n    for n in nums:\n        result ^= n\n    return result\n',
  },
  {
    id: 'py-count-bits',
    track: 'python',
    title: 'Counting Bits',
    difficulty: 'easy',
    pattern: 'bits',
    description:
      'Given `n`, return a list `ans` of length `n+1` where `ans[i]` is the number of set bits (1s) in the binary representation of `i`.',
    examples: ['count_bits(5) -> [0, 1, 1, 2, 1, 2]'],
    function_name: 'count_bits',
    starter_code:
      'def count_bits(n):\n    # ans[i] = ans[i >> 1] + (i & 1)\n    ...\n',
    tests: [
      { args: [5], expected: [0, 1, 1, 2, 1, 2] },
      { args: [2], expected: [0, 1, 1] },
      { args: [0], expected: [0] },
      { args: [8], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1] },
    ],
    hint: 'i in binary is (i >> 1) with one extra low bit. So ans[i] = ans[i >> 1] + (i & 1).',
    approach:
      'DP on bits: `i` shifted right by one (`i >> 1`) drops its lowest bit, and that value is smaller than `i`, so its bit count is already computed. Add back the bit you dropped — `i & 1` — giving `ans[i] = ans[i >> 1] + (i & 1)`.\n\nO(n) total, one pass, versus the naive O(n log n) of counting each number\'s bits independently. Recognizing that `i >> 1` is a strictly smaller already-solved subproblem is the whole trick — the same "reuse a shifted-down result" idea recurs in bitmask DP.',
    solution:
      'def count_bits(n):\n    ans = [0] * (n + 1)\n    for i in range(1, n + 1):\n        ans[i] = ans[i >> 1] + (i & 1)\n    return ans\n',
  },
];
