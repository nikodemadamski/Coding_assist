// Chapter 9 — Graphs, DP & bits: the deep end, and the finish line. Graphs as
// adjacency dicts walked by BFS/DFS, 1-D and 2-D dynamic-programming tables, bit
// tricks, number tricks, and a capstone that ties the whole toolkit together.
// Every snippet is executed by the lesson gate.

export const LESSONS_CH9 = [
  {
    id: 'ch9-graphs',
    chapter: 'graphs-dp',
    title: 'Graphs — BFS & DFS',
    minutes: 8,
    prereqs: ['ch8-tries'],
    read: {
      text:
        'A **graph** is nodes joined by edges, stored as an adjacency dict `{node: [neighbours]}`. **BFS** explores in rings using a queue (`deque`); **DFS** dives deep using recursion or a stack. A `visited` set stops you looping forever.\n\nBoth are the same skeleton: take a node, mark it seen, push its unseen neighbours.',
      example: {
        code:
          "from collections import deque\ngraph = {'A': ['B', 'C'], 'B': ['D'], 'C': [], 'D': []}\nseen = {'A'}\nq = deque(['A'])\ncount = 0\nwhile q:\n    node = q.popleft()\n    count = count + 1\n    for nb in graph[node]:\n        if nb not in seen:\n            seen.add(nb)\n            q.append(nb)\nprint(count)",
        expectedOutput: '4',
      },
      visual: {
        widget: 'graph-view',
        nodes: [
          { id: 'A', x: 50, y: 15 },
          { id: 'B', x: 25, y: 50 },
          { id: 'C', x: 75, y: 50 },
          { id: 'D', x: 25, y: 85 },
        ],
        edges: [['A', 'B'], ['A', 'C'], ['B', 'D']],
        caption: 'BFS spreads out in rings; a queue holds the frontier, a set stops repeats.',
        beats: [
          { active: 'A', frontier: ['B', 'C'], caption: 'Start at A; queue its neighbours B and C.' },
          { active: 'B', visited: ['A'], frontier: ['C', 'D'], caption: 'Dequeue B (first in), visit it, queue D.' },
          { active: 'C', visited: ['A', 'B'], frontier: ['D'], caption: 'Dequeue C — its neighbours are already seen.' },
          { active: 'D', visited: ['A', 'B', 'C'], caption: 'Dequeue D. All four reached, ring by ring.' },
        ],
        why: 'Queue = BFS (rings); a set of visited nodes keeps it from looping.',
        verifyCode:
          "from collections import deque\ngraph = {'A': ['B', 'C'], 'B': ['D'], 'C': [], 'D': []}\nseen = {'A'}\nq = deque(['A'])\ncount = 0\nwhile q:\n    node = q.popleft()\n    count = count + 1\n    for nb in graph[node]:\n        if nb not in seen:\n            seen.add(nb)\n            q.append(nb)\nprint(count)",
        verifyOutput: '4',
      },
    },
    items: [
      {
        type: 'predict',
        code: "graph = {'A': ['B', 'C'], 'B': [], 'C': []}\nprint(graph['A'])",
        answer: "['B', 'C']",
        why: "The adjacency dict maps a node to its neighbour list; graph['A'] is [B, C].",
      },
      {
        type: 'predict',
        code:
          "graph = {'A': ['B'], 'B': ['C'], 'C': []}\nseen = set()\ndef dfs(node):\n    seen.add(node)\n    for nb in graph[node]:\n        if nb not in seen:\n            dfs(nb)\ndfs('A')\nprint(len(seen))",
        answer: '3',
        why: 'DFS follows A→B→C, marking each seen once — three nodes reached.',
      },
      {
        type: 'type',
        prompt: 'Mark neighbour nb as visited by adding it to the set seen.',
        answer: 'seen.add(nb)',
        why: 'A visited set is what stops BFS/DFS from revisiting nodes and looping.',
      },
      {
        type: 'write',
        brief: 'count_reachable(graph, start): how many nodes are reachable from start (adjacency dict).',
        function_name: 'count_reachable',
        starter_code:
          'from collections import deque\n\ndef count_reachable(graph, start):\n    seen = {start}\n    q = deque([start])\n    count = 0\n    \n',
        tests: [
          { args: [{ A: ['B', 'C'], B: ['D'], C: [], D: [] }, 'A'], expected: 4 },
          { args: [{ A: [] }, 'A'], expected: 1 },
          { args: [{ A: ['B'], B: ['A'] }, 'A'], expected: 2 },
        ],
        solution:
          'from collections import deque\n\ndef count_reachable(graph, start):\n    seen = {start}\n    q = deque([start])\n    count = 0\n    while q:\n        node = q.popleft()\n        count = count + 1\n        for nb in graph[node]:\n            if nb not in seen:\n                seen.add(nb)\n                q.append(nb)\n    return count\n',
        hint: 'BFS from start: pop a node, count it, queue any neighbour not yet seen.',
      },
    ],
  },
  {
    id: 'ch9-dp-1d',
    chapter: 'graphs-dp',
    title: 'Dynamic programming — 1-D',
    minutes: 8,
    prereqs: ['ch9-graphs'],
    read: {
      text:
        '**Dynamic programming** builds a table of sub-answers, each from earlier ones, so nothing is recomputed. In **1-D**, `dp[i]` depends on a few cells before it.\n\nClimbing stairs (1 or 2 at a time): the ways to reach step `i` equal the ways to reach `i-1` plus the ways to reach `i-2` — the same recurrence as Fibonacci.',
      example: {
        code:
          'n = 5\ndp = [0] * (n + 1)\ndp[0] = 1\ndp[1] = 1\nfor i in range(2, n + 1):\n    dp[i] = dp[i - 1] + dp[i - 2]\nprint(dp[n])',
        expectedOutput: '8',
      },
      visual: {
        widget: 'dp-table',
        grid: [[1, 1, 2, 3, 5, 8]],
        caption: 'Each cell is built from the two before it — fill left to right, once.',
        beats: [
          { active: [0, 2], deps: [[0, 0], [0, 1]], caption: 'dp[2] = dp[1] + dp[0] = 1 + 1 = 2.' },
          { active: [0, 3], deps: [[0, 1], [0, 2]], caption: 'dp[3] = dp[2] + dp[1] = 2 + 1 = 3.' },
          { active: [0, 5], deps: [[0, 3], [0, 4]], caption: 'dp[5] = dp[4] + dp[3] = 5 + 3 = 8 ways.' },
        ],
        why: 'Store each sub-answer once; later cells read it instead of recomputing.',
        verifyCode:
          'n = 5\ndp = [0] * (n + 1)\ndp[0] = 1\ndp[1] = 1\nfor i in range(2, n + 1):\n    dp[i] = dp[i - 1] + dp[i - 2]\nprint(dp[n])',
        verifyOutput: '8',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'dp = [1, 1]\nfor i in range(2, 5):\n    dp.append(dp[i - 1] + dp[i - 2])\nprint(dp)',
        answer: '[1, 1, 2, 3, 5]',
        why: 'Each appended value is the sum of the two before it — 2, 3, 5.',
      },
      {
        type: 'predict',
        code: 'dp = [0] * 4\ndp[0] = 1\ndp[1] = 2\ndp[2] = dp[1] + dp[0]\ndp[3] = dp[2] + dp[1]\nprint(dp[3])',
        answer: '5',
        why: 'dp[2] = 3, dp[3] = 3 + 2 = 5 — each from the two prior cells.',
      },
      {
        type: 'type',
        prompt: 'The recurrence: this step from the two before it.',
        answer: 'dp[i] = dp[i - 1] + dp[i - 2]',
        why: 'The heart of 1-D DP — build cell i from already-computed earlier cells.',
      },
      {
        type: 'write',
        brief: 'climb_stairs(n): the number of ways to climb n stairs taking 1 or 2 steps.',
        function_name: 'climb_stairs',
        starter_code: 'def climb_stairs(n):\n    if n <= 1:\n        return 1\n    dp = [0] * (n + 1)\n    \n',
        tests: [
          { args: [2], expected: 2 },
          { args: [5], expected: 8 },
          { args: [1], expected: 1 },
          { args: [0], expected: 1 },
        ],
        solution:
          'def climb_stairs(n):\n    if n <= 1:\n        return 1\n    dp = [0] * (n + 1)\n    dp[0] = 1\n    dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]\n    return dp[n]\n',
        hint: 'Seed dp[0] and dp[1] to 1, then fill each dp[i] from the two before it.',
      },
    ],
  },
  {
    id: 'ch9-dp-2d',
    chapter: 'graphs-dp',
    title: 'Dynamic programming — 2-D',
    minutes: 8,
    prereqs: ['ch9-dp-1d'],
    read: {
      text:
        '**2-D DP** fills a grid where each cell builds on its neighbours — usually the cell ABOVE and the one to the LEFT.\n\nUnique paths (moving only right or down through an m×n grid): the number of paths to a cell is paths-from-above plus paths-from-left. The first row and first column are all `1` (one straight-line way).',
      example: {
        code:
          'm, n = 3, 3\ndp = [[1] * n for _ in range(m)]\nfor r in range(1, m):\n    for c in range(1, n):\n        dp[r][c] = dp[r - 1][c] + dp[r][c - 1]\nprint(dp[m - 1][n - 1])',
        expectedOutput: '6',
      },
      visual: {
        widget: 'dp-table',
        grid: [
          [1, 1, 1],
          [1, 2, 3],
          [1, 3, 6],
        ],
        caption: 'Each inner cell = the cell above + the cell to its left.',
        beats: [
          { active: [1, 1], deps: [[0, 1], [1, 0]], caption: 'dp[1][1] = above (1) + left (1) = 2.' },
          { active: [1, 2], deps: [[0, 2], [1, 1]], caption: 'dp[1][2] = above (1) + left (2) = 3.' },
          { active: [2, 2], deps: [[1, 2], [2, 1]], caption: 'dp[2][2] = above (3) + left (3) = 6 paths to the corner.' },
        ],
        why: 'Fill row by row; each cell reads the two neighbours already computed.',
        verifyCode:
          'm, n = 3, 3\ndp = [[1] * n for _ in range(m)]\nfor r in range(1, m):\n    for c in range(1, n):\n        dp[r][c] = dp[r - 1][c] + dp[r][c - 1]\nprint(dp[m - 1][n - 1])',
        verifyOutput: '6',
      },
    },
    items: [
      {
        type: 'predict',
        code:
          'dp = [[1, 1], [1, 0]]\ndp[1][1] = dp[0][1] + dp[1][0]\nprint(dp[1][1])',
        answer: '2',
        why: 'above (1) + left (1) = 2 — the number of paths to the bottom-right of a 2×2.',
      },
      {
        type: 'predict',
        code: 'grid = [[1, 2], [3, 4]]\nprint(grid[0][1] + grid[1][0])',
        answer: '5',
        why: 'The cell above (2) plus the cell to the left (3) — the 2-D DP move.',
      },
      {
        type: 'type',
        prompt: 'Each inner cell from the one above plus the one to the left.',
        answer: 'dp[r][c] = dp[r - 1][c] + dp[r][c - 1]',
        why: 'Above + left is the unique-paths recurrence.',
      },
      {
        type: 'write',
        brief: 'unique_paths(m, n): paths from top-left to bottom-right moving only right or down.',
        function_name: 'unique_paths',
        starter_code: 'def unique_paths(m, n):\n    dp = [[1] * n for _ in range(m)]\n    \n',
        tests: [
          { args: [3, 3], expected: 6 },
          { args: [2, 2], expected: 2 },
          { args: [1, 5], expected: 1 },
          { args: [3, 7], expected: 28 },
        ],
        solution:
          'def unique_paths(m, n):\n    dp = [[1] * n for _ in range(m)]\n    for r in range(1, m):\n        for c in range(1, n):\n            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]\n    return dp[m - 1][n - 1]\n',
        hint: 'First row and column are 1; each inner cell is above + left.',
      },
    ],
  },
  {
    id: 'ch9-bits',
    chapter: 'graphs-dp',
    title: 'Bit manipulation',
    minutes: 6,
    prereqs: ['ch9-dp-2d'],
    read: {
      text:
        'Numbers are bits, and the bitwise operators are fast: `&` AND, `|` OR, `^` XOR, `<<` / `>>` shift.\n\nThree facts win interviews: `n & 1` is the last bit (odd check); `n >> 1` drops it (halve); and `x ^ x == 0`, so XOR-ing a list where everything is paired leaves only the lone unpaired value.',
      example: { code: 'print(4 ^ 4 ^ 7)', expectedOutput: '7' },
      visual: {
        widget: 'text-reveal',
        caption: 'Each bit trick settles on the value it computes.',
        beats: [
          { sub: '5 & 1   # last bit', text: '1', caption: '5 is 101; & 1 keeps the last bit → 1, so 5 is odd.' },
          { sub: '5 >> 1  # drop last bit', text: '2', caption: 'Shift right drops the last bit: 101 → 10 = 2.' },
          { sub: '4 ^ 4 ^ 7', text: '7', caption: 'XOR cancels the pair (4 ^ 4 = 0), leaving the lone 7.' },
        ],
        why: 'n & 1 reads the last bit, >> 1 halves, and XOR cancels pairs.',
        verifyCode: 'print(4 ^ 4 ^ 7)',
        verifyOutput: '7',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'print(6 & 1, 6 >> 1, 1 << 3)',
        answer: '0 3 8',
        why: '6 is even (last bit 0); >> 1 halves to 3; 1 << 3 is 2³ = 8.',
      },
      {
        type: 'predict',
        code: 'x = 0\nfor n in [2, 3, 2]:\n    x = x ^ n\nprint(x)',
        answer: '3',
        why: 'XOR cancels the two 2s, leaving the lone 3.',
      },
      {
        type: 'type',
        prompt: 'Check the last bit of n (is it odd?).',
        answer: 'n & 1',
        why: 'The lowest bit is 1 for odd numbers, 0 for even.',
      },
      {
        type: 'write',
        brief: 'count_bits(n): how many 1-bits are in n.',
        function_name: 'count_bits',
        starter_code: 'def count_bits(n):\n    count = 0\n    \n',
        tests: [
          { args: [5], expected: 2 },
          { args: [0], expected: 0 },
          { args: [7], expected: 3 },
          { args: [8], expected: 1 },
        ],
        solution: 'def count_bits(n):\n    count = 0\n    while n > 0:\n        count = count + (n & 1)\n        n = n >> 1\n    return count\n',
        hint: 'Add the last bit (n & 1), then shift it away (n >> 1), until n is 0.',
      },
      {
        type: 'fix',
        brief: 'This should find the number that appears once (rest appear twice) — but it sums instead of XOR-ing.',
        function_name: 'single',
        code: 'def single(nums):\n    x = 0\n    for n in nums:\n        x = x + n\n    return x\n',
        tests: [
          { args: [[2, 2, 3]], expected: 3 },
          { args: [[4, 1, 1]], expected: 4 },
        ],
        solution: 'def single(nums):\n    x = 0\n    for n in nums:\n        x = x ^ n\n    return x\n',
        hint: 'XOR cancels the pairs and leaves the lone value: x = x ^ n.',
      },
    ],
  },
  {
    id: 'ch9-math',
    chapter: 'graphs-dp',
    title: 'Math tricks',
    minutes: 6,
    prereqs: ['ch9-bits'],
    read: {
      text:
        'A few number moves show up constantly. Peel digits with `% 10` (the last digit) and `// 10` (drop it). Reverse a number by peeling and rebuilding: `rev = rev * 10 + n % 10`.\n\nGreatest common divisor by Euclid: replace `(a, b)` with `(b, a % b)` until `b` is 0 — then `a` is the answer. Python ints never overflow.',
      example: {
        code: 'n = 123\nrev = 0\nwhile n > 0:\n    rev = rev * 10 + n % 10\n    n = n // 10\nprint(rev)',
        expectedOutput: '321',
      },
      visual: {
        widget: 'text-reveal',
        caption: 'Peel a digit at a time, then rebuild the number.',
        beats: [
          { sub: '123 % 10', text: '3', caption: '% 10 peels off the last digit.' },
          { sub: '123 // 10', text: '12', caption: '// 10 drops the last digit.' },
          { sub: 'reverse 123', text: '321', caption: 'Peel and rebuild: 3, then 32, then 321.' },
        ],
        why: '% 10 and // 10 split off digits; rev * 10 + digit rebuilds them backwards.',
        verifyCode: 'n = 123\nrev = 0\nwhile n > 0:\n    rev = rev * 10 + n % 10\n    n = n // 10\nprint(rev)',
        verifyOutput: '321',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'print(47 % 10, 47 // 10)',
        answer: '7 4',
        why: '% 10 is the last digit (7); // 10 drops it, leaving 4.',
      },
      {
        type: 'predict',
        code: 'a, b = 12, 8\nwhile b:\n    a, b = b, a % b\nprint(a)',
        answer: '4',
        why: "Euclid: (12,8)→(8,4)→(4,0); when b hits 0, a is the gcd, 4.",
      },
      {
        type: 'type',
        prompt: 'Peel the last digit of n.',
        answer: 'n % 10',
        why: 'Remainder by 10 is always the final digit.',
      },
      {
        type: 'write',
        brief: 'digit_sum(n): the sum of the digits of n (n ≥ 0).',
        function_name: 'digit_sum',
        starter_code: 'def digit_sum(n):\n    total = 0\n    \n',
        tests: [
          { args: [123], expected: 6 },
          { args: [0], expected: 0 },
          { args: [99], expected: 18 },
        ],
        solution: 'def digit_sum(n):\n    total = 0\n    while n > 0:\n        total = total + n % 10\n        n = n // 10\n    return total\n',
        hint: 'Add n % 10, then drop it with n // 10, until n is 0.',
      },
    ],
  },
  {
    id: 'ch9-capstone',
    chapter: 'graphs-dp',
    title: 'Capstone: the whole toolkit',
    minutes: 8,
    prereqs: ['ch9-math'],
    read: {
      text:
        'The finish line. You now have arrays, hashing, two-pointers, stacks, recursion, classes, search, heaps, intervals, greedy, linked lists, trees, backtracking, graphs, DP, and bit tricks — every NeetCode pattern.\n\nThe skill that remains is the same one from the start: name the pattern, invent 2–3 tiny tests, then code toward them. Here Counter + a heap solve "top-k frequent" in three lines.',
      example: {
        code:
          "from collections import Counter\nimport heapq\nnums = [1, 1, 1, 2, 2, 3]\ncounts = Counter(nums)\nprint(heapq.nlargest(2, counts.keys(), key=lambda k: counts[k]))",
        expectedOutput: '[1, 2]',
      },
      visual: {
        widget: 'pipe-flow',
        caption: 'Count, then let a heap pick the top — two tools, one pipeline.',
        beats: [
          {
            label: 'Counter(nums)',
            input: ['1', '1', '1', '2', '2', '3'],
            output: ['1×3', '2×2', '3×1'],
            caption: 'Count how often each value appears.',
          },
          {
            label: 'nlargest(2, by count)',
            input: ['1×3', '2×2', '3×1'],
            output: ['1', '2'],
            caption: 'A heap hands back the two most frequent values.',
          },
        ],
        why: 'Recognise the pieces (count + top-k), reach for Counter + heapq, done.',
        verifyCode:
          "from collections import Counter\nimport heapq\nnums = [1, 1, 1, 2, 2, 3]\ncounts = Counter(nums)\nprint(heapq.nlargest(2, counts.keys(), key=lambda k: counts[k]))",
        verifyOutput: '[1, 2]',
      },
    },
    items: [
      {
        type: 'predict',
        code: "from collections import Counter\nc = Counter('aabbbc')\nprint(c.most_common(1))",
        answer: "[('b', 3)]",
        why: 'most_common(1) returns the single most frequent (value, count) pair.',
      },
      {
        type: 'predict',
        code: 'import heapq\nprint(heapq.nlargest(2, [3, 1, 4, 1, 5]))',
        answer: '[5, 4]',
        why: 'nlargest(2) returns the two biggest values, largest first.',
      },
      {
        type: 'type',
        prompt: 'The k keys of counts with the highest counts, using heapq.',
        answer: 'heapq.nlargest(k, counts.keys(), key=lambda x: counts[x])',
        why: 'nlargest with a key by count pulls the k most frequent keys.',
      },
      {
        type: 'write',
        brief: 'top_k_frequent(nums, k): the k values that appear most often (clear winners, no ties).',
        function_name: 'top_k_frequent',
        starter_code: 'from collections import Counter\nimport heapq\n\ndef top_k_frequent(nums, k):\n    counts = Counter(nums)\n    \n',
        tests: [
          { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
          { args: [[7, 7, 4], 1], expected: [7] },
          { args: [[9], 1], expected: [9] },
        ],
        solution:
          'from collections import Counter\nimport heapq\n\ndef top_k_frequent(nums, k):\n    counts = Counter(nums)\n    return heapq.nlargest(k, counts.keys(), key=lambda x: counts[x])\n',
        hint: 'Count with Counter, then heapq.nlargest(k, keys, key=count).',
      },
    ],
  },
];
