// Batch 6 — the hard tier.
//
// The bank had 159 questions and only 7 hard Python ones, with ZERO in dp-1d,
// backtracking, graphs, binary-search and tries: the five families where hard
// interview questions actually live. These are one apiece.
//
// All wording is original. Every solution and every approach in approaches.js
// is executed against these tests by `npm test` (tests/run-seed-tests.mjs).

export const NEETCODE_6 = [
  // ── graphs: topological sort from an ordering ─────────────────────────────
  {
    id: 'py-alien-order',
    track: 'python',
    title: 'Alphabet of Another World',
    difficulty: 'hard',
    pattern: 'graphs',
    description:
      'You are handed `words`, a list already sorted by the rules of an unknown alphabet that uses the usual lowercase letters in an unusual order. Work out that order.\n\nReturn the letters as a string. Where the evidence does not pin the order down, return the **lexicographically smallest** ordering consistent with it. If no ordering can explain the list, return `""`.',
    examples: [
      'alien_order(["wrt", "wrf", "er", "ett", "rftt"])  ->  "wertf"',
      'alien_order(["z", "x", "z"])  ->  ""      # z before x and x before z',
      'alien_order(["abc", "ab"])  ->  ""        # a prefix can never sort last',
    ],
    function_name: 'alien_order',
    starter_code: 'def alien_order(words):\n    ...\n',
    tests: [
      { args: [['wrt', 'wrf', 'er', 'ett', 'rftt']], expected: 'wertf' },
      { args: [['z', 'x']], expected: 'zx' },
      { args: [['z', 'x', 'z']], expected: '' },
      { args: [['abc', 'ab']], expected: '' },
      { args: [['abc']], expected: 'abc' },
      { args: [['ba', 'bc', 'ac', 'cab']], expected: 'bac' },
    ],
    hint: 'Only ADJACENT pairs carry information, and only their first differing letter. Those pairs are edges; the answer is a topological order — take the smallest available letter each time to make it unique.',
    approach:
      "Two words next to each other tell you exactly one thing: at their first differing position, the earlier word's letter comes first. That is a single edge. Collect every letter as a node, every adjacent pair as one edge, then topologically sort.\n\nTwo failure modes have to be handled or the answer is quietly wrong: a pair like `[\"abc\", \"ab\"]` where the longer word comes first is impossible under any alphabet, and a cycle means the constraints contradict each other — detected because Kahn's algorithm cannot place every letter.\n\nPopping the smallest available letter (a heap rather than a queue) makes the result unique instead of merely valid, which is what lets it be graded.",
    solution:
      "def alien_order(words):\n    adj = {c: set() for w in words for c in w}\n    indeg = {c: 0 for c in adj}\n    for first, second in zip(words, words[1:]):\n        if len(first) > len(second) and first.startswith(second):\n            return ''\n        for a, b in zip(first, second):\n            if a != b:\n                if b not in adj[a]:\n                    adj[a].add(b)\n                    indeg[b] += 1\n                break\n    ready = [c for c in indeg if indeg[c] == 0]\n    heapq.heapify(ready)\n    out = []\n    while ready:\n        c = heapq.heappop(ready)\n        out.append(c)\n        for nxt in sorted(adj[c]):\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                heapq.heappush(ready, nxt)\n    return ''.join(out) if len(out) == len(indeg) else ''\n",
  },

  // ── dp-1d: the longest run that balances ──────────────────────────────────
  {
    id: 'py-longest-valid-parens',
    track: 'python',
    title: 'Longest Balanced Run',
    difficulty: 'hard',
    pattern: 'dp-1d',
    description:
      'Given a string `s` of only `(` and `)`, return the length of the longest **contiguous** substring that is correctly balanced.\n\nA substring is balanced when every `(` has a later matching `)` and nothing is left over.',
    examples: [
      'longest_valid_parentheses("(()")     ->  2   # "()"',
      'longest_valid_parentheses(")()())")  ->  4   # "()()"',
      'longest_valid_parentheses("")        ->  0',
    ],
    function_name: 'longest_valid_parentheses',
    starter_code: 'def longest_valid_parentheses(s):\n    ...\n',
    tests: [
      { args: ['(()'], expected: 2 },
      { args: [')()())'], expected: 4 },
      { args: [''], expected: 0 },
      { args: ['()(())'], expected: 6 },
      { args: ['()(()'], expected: 2 },
      { args: [')))((('], expected: 0 },
      { args: ['()(()))())'], expected: 6 },
    ],
    hint: 'A stack of INDICES, not brackets. Keep the index of the last unmatched `)` at the bottom; when you close a pair, the run length is the current index minus whatever index is now on top.',
    approach:
      "Counting brackets tells you whether a string is balanced but not where the longest balanced *run* is, because a stray `)` chops the string in two.\n\nSo push indices. Seed the stack with `-1` to stand for \"the last position that broke a run\". On `(` push the index. On `)` pop; if the stack is now empty this `)` was unmatched, so it becomes the new breakpoint — push its index. Otherwise the current run reaches back to the index now on top, and its length is `i - stack[-1]`.\n\nOne pass, each index pushed and popped at most once.",
    solution:
      'def longest_valid_parentheses(s):\n    best = 0\n    stack = [-1]\n    for i, ch in enumerate(s):\n        if ch == "(":\n            stack.append(i)\n        else:\n            stack.pop()\n            if not stack:\n                stack.append(i)\n            else:\n                best = max(best, i - stack[-1])\n    return best\n',
  },

  // ── backtracking: the canonical constraint search ─────────────────────────
  {
    id: 'py-n-queens',
    track: 'python',
    title: 'Queens That Cannot See Each Other',
    difficulty: 'hard',
    pattern: 'backtracking',
    description:
      'Place `n` queens on an `n × n` board so that no two share a row, a column, or a diagonal.\n\nReturn every distinct arrangement. A board is a list of `n` strings, each `n` characters long, using `"Q"` for a queen and `"."` for an empty square. The order of the arrangements does not matter.',
    examples: [
      'solve_n_queens(4)  ->  [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]]',
      'solve_n_queens(2)  ->  []',
      'solve_n_queens(1)  ->  [["Q"]]',
    ],
    function_name: 'solve_n_queens',
    starter_code: 'def solve_n_queens(n):\n    ...\n',
    tests: [
      { args: [1], expected: [['Q']] },
      { args: [2], expected: [] },
      { args: [3], expected: [] },
      {
        args: [4],
        expected: [
          ['.Q..', '...Q', 'Q...', '..Q.'],
          ['..Q.', 'Q...', '...Q', '.Q..'],
        ],
      },
    ],
    hint: 'Go row by row, so rows can never clash. Track used columns and both diagonals in sets: a square is attacked when `col`, `row - col`, or `row + col` has been seen.',
    approach:
      "Placing one queen per row removes the row conflict for free, so the search is \"which column in this row?\" — n choices deep, n rows down.\n\nThe trick that makes it fast is recognising the two diagonals as arithmetic. Every square on a ↘ diagonal shares `row - col`; every square on a ↙ diagonal shares `row + col`. Three sets — columns, `row - col`, `row + col` — make \"is this square attacked?\" a constant-time question instead of a scan.\n\nAdd the square to all three sets, recurse into the next row, then remove them again. That undo is the whole of backtracking.",
    solution:
      "def solve_n_queens(n):\n    res = []\n    cols, diag, anti = set(), set(), set()\n    board = [['.'] * n for _ in range(n)]\n\n    def place(row):\n        if row == n:\n            res.append([''.join(r) for r in board])\n            return\n        for col in range(n):\n            if col in cols or (row - col) in diag or (row + col) in anti:\n                continue\n            cols.add(col)\n            diag.add(row - col)\n            anti.add(row + col)\n            board[row][col] = 'Q'\n            place(row + 1)\n            board[row][col] = '.'\n            cols.remove(col)\n            diag.remove(row - col)\n            anti.remove(row + col)\n\n    place(0)\n    return res\n",
  },

  // ── binary search: search the ANSWER, not the array ───────────────────────
  {
    id: 'py-median-two-sorted',
    track: 'python',
    title: 'Median of Two Sorted Lists',
    difficulty: 'hard',
    pattern: 'binary-search',
    description:
      'Two lists `a` and `b` are each already sorted. Return the median of all their values combined, without building the combined list.\n\nWith an even total, the median is the mean of the two middle values. Aim for `O(log(min(m, n)))`.',
    examples: [
      'find_median_sorted_arrays([1, 3], [2])     ->  2.0',
      'find_median_sorted_arrays([1, 2], [3, 4])  ->  2.5',
      'find_median_sorted_arrays([], [1])         ->  1.0',
    ],
    function_name: 'find_median_sorted_arrays',
    starter_code: 'def find_median_sorted_arrays(a, b):\n    ...\n',
    tests: [
      { args: [[1, 3], [2]], expected: 2 },
      { args: [[1, 2], [3, 4]], expected: 2.5 },
      { args: [[], [1]], expected: 1 },
      { args: [[2], []], expected: 2 },
      { args: [[0, 0], [0, 0]], expected: 0 },
      { args: [[1, 2, 3, 4, 5], [6, 7, 8]], expected: 4.5 },
      { args: [[3], [-2, -1]], expected: -1 },
    ],
    hint: 'Do not binary search for a value — binary search for a CUT. Pick how many of the left half come from `a`; the rest must come from `b`. The cut is right when both left values are ≤ both right values.',
    approach:
      "The median is defined by a partition: split the combined ordering into a left half and a right half of known sizes. So search for the split, not for a number.\n\nBinary search over `i`, how many of the smaller list fall on the left. That fixes `j` for the other list, since the two halves have fixed sizes. The cut is correct when the last value on each left side is no greater than the first value on each right side. If `a[i-1] > b[j]` the cut in `a` is too far right, so move left; otherwise move right.\n\nSearching the shorter list keeps it `O(log(min(m, n)))`. The ±infinity sentinels are what let the empty-side cases fall out without special-casing them.",
    solution:
      "def find_median_sorted_arrays(a, b):\n    if len(a) > len(b):\n        a, b = b, a\n    m, n = len(a), len(b)\n    lo, hi = 0, m\n    half = (m + n + 1) // 2\n    while lo <= hi:\n        i = (lo + hi) // 2\n        j = half - i\n        a_left = a[i - 1] if i > 0 else -inf\n        a_right = a[i] if i < m else inf\n        b_left = b[j - 1] if j > 0 else -inf\n        b_right = b[j] if j < n else inf\n        if a_left <= b_right and b_left <= a_right:\n            if (m + n) % 2:\n                return float(max(a_left, b_left))\n            return (max(a_left, b_left) + min(a_right, b_right)) / 2\n        if a_left > b_right:\n            hi = i - 1\n        else:\n            lo = i + 1\n    return 0.0\n",
  },

  // ── tries: a prefix tree that prunes a backtracking search ────────────────
  {
    id: 'py-word-search-ii',
    track: 'python',
    title: 'Every Word Hidden in the Grid',
    difficulty: 'hard',
    pattern: 'tries',
    description:
      'Given a `board` of single letters and a list of `words`, return every word that can be spelled by stepping between horizontally or vertically adjacent squares, never using the same square twice in one word.\n\nThe order of the returned words does not matter.',
    examples: [
      'find_words([["o","a","a","n"], ["e","t","a","e"], ["i","h","k","r"], ["i","f","l","v"]], ["oath","pea","eat","rain"])  ->  ["oath", "eat"]',
      'find_words([["a","b"], ["c","d"]], ["abcb"])  ->  []',
    ],
    function_name: 'find_words',
    starter_code: 'def find_words(board, words):\n    ...\n',
    tests: [
      {
        args: [
          [
            ['o', 'a', 'a', 'n'],
            ['e', 't', 'a', 'e'],
            ['i', 'h', 'k', 'r'],
            ['i', 'f', 'l', 'v'],
          ],
          ['oath', 'pea', 'eat', 'rain'],
        ],
        expected: ['oath', 'eat'],
      },
      { args: [[['a', 'b'], ['c', 'd']], ['abcb']], expected: [] },
      { args: [[['a']], ['a']], expected: ['a'] },
      { args: [[['a', 'b']], ['ba', 'ab', 'c']], expected: ['ba', 'ab'] },
      { args: [[['a', 'a']], ['aaa']], expected: [] },
    ],
    hint: 'Do not run a separate search per word. Put every word into a trie, then walk the board ONCE — at each square you follow the trie, and the moment there is no child you stop.',
    approach:
      'Searching the board once per word re-walks the same squares for every shared prefix. A trie collapses that: `"oath"` and `"oats"` share one path until they diverge.\n\nBuild the trie from the words, then depth-first search from every square, carrying the current trie node alongside. A step is only worth taking if the letter is a child of that node — which is what prunes the search, because a dead prefix is discovered after one lookup instead of after a full walk.\n\nMark the square used before recursing and restore it after. Storing the whole word on its terminal node means a hit needs no reconstruction, and deleting that marker keeps duplicates out of the result.',
    solution:
      "def find_words(board, words):\n    root = {}\n    for w in words:\n        node = root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node['$'] = w\n\n    rows, cols = len(board), len(board[0])\n    found = []\n\n    def walk(r, c, node):\n        ch = board[r][c]\n        nxt = node.get(ch)\n        if nxt is None:\n            return\n        word = nxt.pop('$', None)\n        if word is not None:\n            found.append(word)\n        board[r][c] = '#'\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':\n                walk(nr, nc, nxt)\n        board[r][c] = ch\n\n    for r in range(rows):\n        for c in range(cols):\n            walk(r, c, root)\n    return found\n",
  },
  // ── intervals: merge across schedules, then read the GAPS ─────────────────
  {
    id: 'py-employee-free-time',
    track: 'python',
    title: 'When Is Everyone Free?',
    difficulty: 'hard',
    pattern: 'intervals',
    description:
      "You are given `schedules`, one entry per person. Each entry is that person's busy periods as `[start, end]` pairs, already sorted and never overlapping each other.\n\nReturn every period during which **nobody** is busy, as a sorted list of `[start, end]`. Ignore the time before the first person starts and after the last one finishes — only the gaps in between count.",
    examples: [
      'free_time([[[1, 2], [5, 6]], [[1, 3]], [[4, 10]]])  ->  [[3, 4]]',
      'free_time([[[1, 3], [6, 7]], [[2, 4]], [[2, 5], [9, 12]]])  ->  [[5, 6], [7, 9]]',
    ],
    function_name: 'free_time',
    starter_code: 'def free_time(schedules):\n    ...\n',
    tests: [
      { args: [[[[1, 2], [5, 6]], [[1, 3]], [[4, 10]]]], expected: [[3, 4]] },
      { args: [[[[1, 3], [6, 7]], [[2, 4]], [[2, 5], [9, 12]]]], expected: [[5, 6], [7, 9]] },
      { args: [[[[1, 2]]]], expected: [] },
      { args: [[[[1, 2], [3, 4]]]], expected: [[2, 3]] },
      { args: [[[[1, 4]], [[2, 3]]]], expected: [] },
      { args: [[[[1, 2]], [[3, 4]], [[5, 6]]]], expected: [[2, 3], [4, 5]] },
    ],
    hint: 'Whose busy period it is never matters. Pour every interval into one list, merge the overlaps, and the free time is exactly the space between consecutive merged blocks.',
    approach:
      "The per-person structure is a distraction. Nobody is free at time t precisely when SOME interval covers t, so flatten every schedule into one list and forget who owns what.\n\nSort by start and merge: extend the current block while the next interval starts at or before the block's end, otherwise close the block and open a new one. The answer is then the space between consecutive merged blocks — the merge does the hard part, and reading off gaps is two lines.\n\nThe alternative, a min-heap over the k schedules to merge them in order, is worth mentioning in an interview: it avoids sorting everything when the schedules are long and k is small.",
    solution:
      'def free_time(schedules):\n    flat = sorted(\n        (iv for person in schedules for iv in person), key=lambda iv: iv[0]\n    )\n    if not flat:\n        return []\n    merged = [list(flat[0])]\n    for start, end in flat[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return [[merged[i][1], merged[i + 1][0]] for i in range(len(merged) - 1)]\n',
  },

  // ── heap: k pointers advanced by the smallest ─────────────────────────────
  {
    id: 'py-smallest-range-k-lists',
    track: 'python',
    title: 'Smallest Range Touching Every List',
    difficulty: 'hard',
    pattern: 'heap',
    description:
      'You have `lists`, each one sorted ascending. Find the smallest range `[a, b]` that contains at least one number from **every** list.\n\nA range is smaller when `b - a` is smaller; if two ranges tie, the one with the smaller `a` wins. Return it as `[a, b]`.',
    examples: [
      'smallest_range([[4, 10, 15, 24, 26], [0, 9, 12, 20], [5, 18, 22, 30]])  ->  [20, 24]',
      'smallest_range([[1, 2, 3], [1, 2, 3], [1, 2, 3]])  ->  [1, 1]',
    ],
    function_name: 'smallest_range',
    starter_code: 'def smallest_range(lists):\n    ...\n',
    tests: [
      { args: [[[4, 10, 15, 24, 26], [0, 9, 12, 20], [5, 18, 22, 30]]], expected: [20, 24] },
      { args: [[[1, 2, 3], [1, 2, 3], [1, 2, 3]]], expected: [1, 1] },
      { args: [[[1], [2], [3]]], expected: [1, 3] },
      { args: [[[10, 10], [11, 11]]], expected: [10, 11] },
      { args: [[[1, 2, 3]]], expected: [1, 1] },
      { args: [[[-5, 0], [1], [2]]], expected: [0, 2] },
    ],
    hint: 'Keep one finger in each list. The range is always [smallest finger, largest finger] — and the ONLY way to shrink it is to move the smallest finger forward.',
    approach:
      "Hold a pointer into each list. Whatever those pointers touch, the current range must span from the smallest of them to the largest, so the range is fully determined by the pointers.\n\nNow ask which pointer to advance. Moving the largest, or anything in between, can only keep the range the same width or widen it — the low end stays put and the high end cannot fall. Only advancing the **smallest** can shrink it. That is the whole algorithm, and a min-heap makes \"which is smallest\" O(log k).\n\nTrack the running maximum separately as you push, because a heap gives you the minimum for free and the maximum not at all. Stop the moment any list runs out: from then on no range can cover every list.",
    solution:
      'def smallest_range(lists):\n    heap = [(row[0], i, 0) for i, row in enumerate(lists) if row]\n    if len(heap) != len(lists):\n        return []\n    heapq.heapify(heap)\n    high = max(row[0] for row in lists)\n    best = [heap[0][0], high]\n    while True:\n        low, i, j = heapq.heappop(heap)\n        if high - low < best[1] - best[0]:\n            best = [low, high]\n        if j + 1 == len(lists[i]):\n            return best\n        nxt = lists[i][j + 1]\n        high = max(high, nxt)\n        heapq.heappush(heap, (nxt, i, j + 1))\n',
  },

  // ── graphs: BFS over a graph that is never built ──────────────────────────
  {
    id: 'py-word-ladder',
    track: 'python',
    title: 'One Letter at a Time',
    difficulty: 'hard',
    pattern: 'graphs',
    description:
      'Change `begin` into `end` by altering one letter at a time, where every word along the way — including `end` — must appear in `word_list`. All words are the same length.\n\nReturn how many words the shortest such chain contains, counting both ends. Return `0` if it cannot be done.',
    examples: [
      'ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"])  ->  5   # hit→hot→dot→dog→cog',
      'ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log"])  ->  0   # cog is not available',
    ],
    function_name: 'ladder_length',
    starter_code: 'def ladder_length(begin, end, word_list):\n    ...\n',
    tests: [
      { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']], expected: 5 },
      { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log']], expected: 0 },
      { args: ['a', 'c', ['a', 'b', 'c']], expected: 2 },
      { args: ['hot', 'dog', ['hot', 'dog']], expected: 0 },
      { args: ['hot', 'hot', ['hot']], expected: 1 },
      { args: ['red', 'tax', ['ted', 'tex', 'red', 'tax', 'tad', 'den', 'rex', 'pee']], expected: 4 },
    ],
    hint: 'Shortest path with equal-cost steps means BFS, not DP. Do not build the graph — generate a word’s neighbours on demand by trying all 26 letters in each position.',
    approach:
      'Every step costs the same, so the shortest chain is a breadth-first search and the answer is the level you find `end` on.\n\nThe trap is building the graph first. Comparing every pair of words to find the ones differing by a letter is O(N²·L) before the search even starts. Instead generate neighbours on demand: for each position, substitute all 26 letters and keep the results that are still in the unvisited set — O(26·L) per word, independent of how many words there are.\n\nRemove a word from the set the moment you queue it. That is the visited check, and doing it at enqueue rather than dequeue is what stops the same word being queued once per neighbour.',
    solution:
      "def ladder_length(begin, end, word_list):\n    pool = set(word_list)\n    if end not in pool:\n        return 0\n    queue = deque([(begin, 1)])\n    pool.discard(begin)\n    while queue:\n        word, depth = queue.popleft()\n        if word == end:\n            return depth\n        for i in range(len(word)):\n            for ch in 'abcdefghijklmnopqrstuvwxyz':\n                nxt = word[:i] + ch + word[i + 1 :]\n                if nxt in pool:\n                    pool.discard(nxt)\n                    queue.append((nxt, depth + 1))\n    return 0\n",
  },

  // ── dp-2d: interval DP, chosen by what bursts LAST ────────────────────────
  {
    id: 'py-burst-balloons',
    track: 'python',
    title: 'The Last Balloon',
    difficulty: 'hard',
    pattern: 'dp-2d',
    description:
      'A row of balloons carries the numbers in `nums`. Bursting balloon `i` pays `nums[i-1] * nums[i] * nums[i+1]`, where a missing neighbour counts as `1`. The balloon vanishes and its neighbours become adjacent.\n\nBurst every balloon, in whatever order you like. Return the most you can be paid.',
    examples: [
      'max_coins([3, 1, 5, 8])  ->  167   # burst 1, then 5, then 3, then 8',
      'max_coins([1, 5])  ->  10',
    ],
    function_name: 'max_coins',
    starter_code: 'def max_coins(nums):\n    ...\n',
    tests: [
      { args: [[3, 1, 5, 8]], expected: 167 },
      { args: [[1, 5]], expected: 10 },
      { args: [[]], expected: 0 },
      { args: [[5]], expected: 5 },
      { args: [[1, 2, 3]], expected: 12 },
      { args: [[7, 9, 8, 0, 7, 1, 3, 5, 5, 2, 3]], expected: 1654 },
    ],
    hint: 'Thinking about which balloon bursts FIRST is hopeless — it splits the row into two halves that are no longer independent. Ask which one bursts LAST in a range instead.',
    approach:
      "Picking the first balloon to burst does not decompose: the two sides left behind become neighbours, so their sub-problems depend on each other. That is why the greedy and the obvious recursion both fail.\n\nInvert it. Fix the balloon that bursts **last** inside a range. By the time it goes, everything else in that range is gone, so its neighbours are exactly the range's two boundary balloons — which are untouched by definition. Now the two sides really are independent, and the recurrence is clean:\n\n`dp[i][j] = max over k in (i, j) of dp[i][k] + dp[k][j] + nums[i]·nums[k]·nums[j]`\n\nPad the array with a 1 at each end so the boundary balloons always exist and the missing-neighbour rule needs no special case. Fill by increasing range width. O(n³) time, O(n²) space — and it is one of the few problems where the direction of the thinking, not the code, is the whole difficulty.",
    solution:
      'def max_coins(nums):\n    vals = [1] + [n for n in nums] + [1]\n    n = len(vals)\n    dp = [[0] * n for _ in range(n)]\n    for width in range(2, n):\n        for i in range(n - width):\n            j = i + width\n            for k in range(i + 1, j):\n                gain = dp[i][k] + dp[k][j] + vals[i] * vals[k] * vals[j]\n                if gain > dp[i][j]:\n                    dp[i][j] = gain\n    return dp[0][n - 1]\n',
  },

  // ── greedy: two sweeps, because one direction cannot see both rules ───────
  {
    id: 'py-candy',
    track: 'python',
    title: 'Sweets Along the Line',
    difficulty: 'hard',
    pattern: 'greedy',
    description:
      'Children stand in a line with the given `ratings`. Every child must get at least one sweet, and any child rated higher than the child immediately beside them must get more sweets than that neighbour.\n\nReturn the smallest number of sweets that satisfies both rules.',
    examples: [
      'min_candies([1, 0, 2])  ->  5   # 2, 1, 2',
      'min_candies([1, 2, 2])  ->  4   # 1, 2, 1',
    ],
    function_name: 'min_candies',
    starter_code: 'def min_candies(ratings):\n    ...\n',
    tests: [
      { args: [[1, 0, 2]], expected: 5 },
      { args: [[1, 2, 2]], expected: 4 },
      { args: [[]], expected: 0 },
      { args: [[1]], expected: 1 },
      { args: [[1, 3, 2, 2, 1]], expected: 7 },
      { args: [[1, 2, 87, 87, 87, 2, 1]], expected: 13 },
      { args: [[5, 4, 3, 2, 1]], expected: 15 },
    ],
    hint: 'One sweep can only enforce the rule against the neighbour it has already seen. Sweep left to right for the left-hand rule, then right to left for the other, and take the larger requirement at each child.',
    approach:
      "There are two constraints per child — beat the left neighbour when rated higher, beat the right neighbour when rated higher — and a single pass can only ever see one of them, because the other neighbour has not been decided yet.\n\nSo do it twice. Start everyone on one sweet. Going left to right, whenever a rating climbs, give that child one more than the child before. Going right to left, whenever a rating climbs in that direction, give the child at least one more than the child after — `max` of what it already has, so the first pass is never undone.\n\nTaking the maximum of the two requirements is what makes the result both valid and minimal: each child gets exactly enough for whichever rule binds harder, and nothing more.",
    solution:
      'def min_candies(ratings):\n    n = len(ratings)\n    if n == 0:\n        return 0\n    sweets = [1] * n\n    for i in range(1, n):\n        if ratings[i] > ratings[i - 1]:\n            sweets[i] = sweets[i - 1] + 1\n    for i in range(n - 2, -1, -1):\n        if ratings[i] > ratings[i + 1]:\n            sweets[i] = max(sweets[i], sweets[i + 1] + 1)\n    return sum(sweets)\n',
  },
  // ── trees: greedy on a tree, decided bottom-up ────────────────────────────
  {
    id: 'py-binary-tree-cameras',
    track: 'python',
    title: 'Cameras in the Branches',
    difficulty: 'hard',
    pattern: 'trees',
    description:
      'A camera placed at a node watches that node, its parent, and its immediate children. Given the root of a binary tree, return the fewest cameras needed so that **every** node is watched.\n\nThe tree is encoded as nested `[value, left, right]`, with `null` for an empty child. The values themselves are irrelevant.',
    examples: [
      'min_cameras([0, [0, null, [0, null, null]], null])  ->  1',
      'min_cameras([0, null, null])  ->  1',
      'min_cameras(null)  ->  0',
    ],
    function_name: 'min_cameras',
    starter_code: 'def min_cameras(root):\n    ...\n',
    tests: [
      { args: [null], expected: 0 },
      { args: [[0, null, null]], expected: 1 },
      { args: [[0, [0, null, [0, null, null]], null]], expected: 1 },
      { args: [[0, [0, [0, null, null], [0, null, null]], null]], expected: 1 },
      { args: [[0, [0, null, null], [0, [0, null, null], [0, null, null]]]], expected: 2 },
      { args: [[0, [0, [0, [0, null, null], null], null], null]], expected: 2 },
    ],
    hint: 'Decide bottom-up, and give each subtree one of three answers: I am uncovered, I am covered, I hold a camera. A parent only needs a camera when a child says "uncovered".',
    approach:
      'Top-down fails because a camera at the root is nearly always wasted — leaves are the nodes hardest to cover, and covering them from below is free.\n\nSo return a state from every node instead of a number. Three states are enough: **needs covering**, **covered**, **has a camera**. A node places a camera exactly when one of its children reports "needs covering" — because that child will never get another chance. If a child has a camera, this node is already covered. Otherwise both children are merely covered, so this node is uncovered and passes the problem up.\n\nThe only special case is the root, which has no parent to rescue it: if it comes back "needs covering", buy one more camera. Every node is visited once.',
    solution:
      'def min_cameras(root):\n    NEED, OK, CAM = 0, 1, 2\n    count = 0\n\n    def walk(node):\n        nonlocal count\n        if node is None:\n            return OK\n        left = walk(node[1])\n        right = walk(node[2])\n        if left == NEED or right == NEED:\n            count += 1\n            return CAM\n        if left == CAM or right == CAM:\n            return OK\n        return NEED\n\n    if walk(root) == NEED:\n        count += 1\n    return count\n',
  },

  // ── stack: parse with a stack instead of recursion ────────────────────────
  {
    id: 'py-basic-calculator',
    track: 'python',
    title: 'Evaluate It By Hand',
    difficulty: 'hard',
    pattern: 'stack',
    description:
      'Evaluate the arithmetic in a string `s`. It may contain non-negative integers, `+`, `-`, brackets `(` `)`, and spaces — and nothing else. A `-` may be unary, as in `-2` or `1-(-2)`.\n\nReturn the result as an integer. Do not use `eval`.',
    examples: [
      'calculate("1 + 1")  ->  2',
      'calculate("(1+(4+5+2)-3)+(6+8)")  ->  23',
      'calculate("2-(5-6)")  ->  3',
    ],
    function_name: 'calculate',
    starter_code: 'def calculate(s):\n    ...\n',
    tests: [
      { args: ['1 + 1'], expected: 2 },
      { args: [' 2-1 + 2 '], expected: 3 },
      { args: ['(1+(4+5+2)-3)+(6+8)'], expected: 23 },
      { args: ['2-(5-6)'], expected: 3 },
      { args: ['-2+ 1'], expected: -1 },
      { args: ['1-(-2)'], expected: 3 },
      { args: [''], expected: 0 },
      { args: ['(((10)))'], expected: 10 },
    ],
    hint: 'Carry a running result and a running sign. On `(` push both and start fresh; on `)` fold the bracket back in by multiplying by the pushed sign and adding the pushed result.',
    approach:
      'With only `+` and `-` there is no precedence to worry about, so you never need a full expression parser — a running total and a running sign is enough.\n\nBrackets are the only nesting, and a stack handles them: on `(`, push the total so far AND the sign in front of the bracket, then reset both. On `)`, close off the inner total, multiply it by the pushed sign, and add the pushed total back. The sign has to be pushed too, or `2-(5-6)` silently becomes `2+(5-6)`.\n\nDigits accumulate with `num = num * 10 + digit` because a number can be several characters. Unary minus needs no special case: `-2` starts with the total at zero, so `0 - 2` is the right answer already.',
    solution:
      "def calculate(s):\n    result = 0\n    num = 0\n    sign = 1\n    stack = []\n    for ch in s:\n        if ch.isdigit():\n            num = num * 10 + int(ch)\n        elif ch in '+-':\n            result += sign * num\n            num = 0\n            sign = 1 if ch == '+' else -1\n        elif ch == '(':\n            stack.append(result)\n            stack.append(sign)\n            result = 0\n            sign = 1\n        elif ch == ')':\n            result += sign * num\n            num = 0\n            result *= stack.pop()\n            result += stack.pop()\n    return result + sign * num\n",
  },

  // ── dp-1d: a sort that turns 2-D into the LIS you already know ────────────
  {
    id: 'py-russian-doll-envelopes',
    track: 'python',
    title: 'Envelopes Inside Envelopes',
    difficulty: 'hard',
    pattern: 'dp-1d',
    description:
      'Each envelope is `[width, height]`. One envelope fits inside another only when **both** its width and its height are strictly smaller.\n\nReturn the largest number of envelopes you can nest, each inside the next.',
    examples: [
      'max_envelopes([[5, 4], [6, 4], [6, 7], [2, 3]])  ->  3   # 2×3 → 5×4 → 6×7',
      'max_envelopes([[1, 1], [1, 1], [1, 1]])  ->  1',
    ],
    function_name: 'max_envelopes',
    starter_code: 'def max_envelopes(envelopes):\n    ...\n',
    tests: [
      { args: [[[5, 4], [6, 4], [6, 7], [2, 3]]], expected: 3 },
      { args: [[[1, 1], [1, 1], [1, 1]]], expected: 1 },
      { args: [[]], expected: 0 },
      { args: [[[4, 5], [4, 6], [6, 7], [2, 3], [1, 1]]], expected: 4 },
      { args: [[[30, 50], [12, 2], [3, 4], [12, 15]]], expected: 3 },
      { args: [[[2, 100], [3, 200], [4, 300], [5, 500], [5, 400], [5, 250], [6, 370], [6, 360], [7, 380]]], expected: 5 },
    ],
    hint: 'Sort so that one dimension is already handled, then the answer is a Longest Increasing Subsequence on the other. The tie-break on equal widths is the whole problem.',
    approach:
      'Sorting by width reduces this to a one-dimensional question: among envelopes in width order, find the longest run of strictly increasing heights.\n\nBut equal widths break it. Two envelopes of the same width can never nest, and a naive width sort would happily let their heights form an increasing run. The fix is the trick: sort by width **ascending, height descending**. Now equal widths appear with heights going down, so no two of them can ever be part of the same increasing subsequence — the constraint is enforced by the sort rather than by a check.\n\nAfter that it is exactly LIS, and the `bisect` patience-sorting version gives O(n log n). Note the `tails` array is not a real subsequence; it is only the smallest possible tail for each length, which is all the length needs.',
    solution:
      'def max_envelopes(envelopes):\n    order = sorted(envelopes, key=lambda e: (e[0], -e[1]))\n    tails = []\n    for _, height in order:\n        i = bisect.bisect_left(tails, height)\n        if i == len(tails):\n            tails.append(height)\n        else:\n            tails[i] = height\n    return len(tails)\n',
  },

  // ── arrays-hashing: the array IS the hash table ───────────────────────────
  {
    id: 'py-first-missing-positive',
    track: 'python',
    title: 'The Smallest Positive That Is Missing',
    difficulty: 'hard',
    pattern: 'arrays-hashing',
    description:
      'Given `nums`, return the smallest positive integer that does **not** appear in it. Negative numbers, zero and duplicates may all be present.\n\nAim for `O(n)` time and constant extra space — the answer is always between `1` and `len(nums) + 1`.',
    examples: [
      'first_missing_positive([1, 2, 0])  ->  3',
      'first_missing_positive([3, 4, -1, 1])  ->  2',
      'first_missing_positive([7, 8, 9, 11, 12])  ->  1',
    ],
    function_name: 'first_missing_positive',
    starter_code: 'def first_missing_positive(nums):\n    ...\n',
    tests: [
      { args: [[1, 2, 0]], expected: 3 },
      { args: [[3, 4, -1, 1]], expected: 2 },
      { args: [[7, 8, 9, 11, 12]], expected: 1 },
      { args: [[]], expected: 1 },
      { args: [[1]], expected: 2 },
      { args: [[2, 2, 2]], expected: 1 },
      { args: [[1, 1]], expected: 2 },
    ],
    hint: 'With n numbers the answer cannot exceed n + 1, so only values in 1..n matter. Put each such value at its own index by swapping, then the first index that disagrees is the answer.',
    approach:
      "Constant space rules out a set, so the array has to be the hash table. The observation that makes that possible: with n numbers you can block at most n of the values 1..n, so the answer is somewhere in 1..n+1 and everything outside that range is irrelevant.\n\nSo put value v at index v-1. Walk the array, and while the value at i belongs somewhere else, swap it there. Loop with `while`, not `if` — one swap brings in a new value that may itself be misplaced. Guard the swap with `nums[nums[i] - 1] != nums[i]` rather than an index check: on duplicates the target already holds the right value, and without that guard the two keep swapping forever.\n\nAfter the placement pass, the first index where `nums[i] != i + 1` gives the answer, and if every slot agrees the answer is n + 1. Two passes, no extra memory.",
    solution:
      'def first_missing_positive(nums):\n    n = len(nums)\n    for i in range(n):\n        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:\n            target = nums[i] - 1\n            nums[i], nums[target] = nums[target], nums[i]\n    for i in range(n):\n        if nums[i] != i + 1:\n            return i + 1\n    return n + 1\n',
  },

  // ── math-geometry: exact slopes, never floats ─────────────────────────────
  {
    id: 'py-max-points-line',
    track: 'python',
    title: 'The Busiest Straight Line',
    difficulty: 'hard',
    pattern: 'math-geometry',
    description:
      'Given `points` on a plane as `[x, y]` pairs, return the greatest number of them that lie on a single straight line.\n\nPoints may be repeated, and a repeated point counts every time it appears.',
    examples: [
      'max_points([[1, 1], [2, 2], [3, 3]])  ->  3',
      'max_points([[1, 1], [3, 2], [5, 3], [4, 1], [2, 3], [1, 4]])  ->  4',
    ],
    function_name: 'max_points',
    starter_code: 'def max_points(points):\n    ...\n',
    tests: [
      { args: [[[1, 1], [2, 2], [3, 3]]], expected: 3 },
      { args: [[[1, 1], [3, 2], [5, 3], [4, 1], [2, 3], [1, 4]]], expected: 4 },
      { args: [[[1, 1]]], expected: 1 },
      { args: [[]], expected: 0 },
      { args: [[[0, 0], [0, 1], [0, 2]]], expected: 3 },
      { args: [[[1, 1], [1, 1], [2, 2]]], expected: 3 },
      { args: [[[0, 0], [1, 1], [2, 2], [3, 4], [5, 6]]], expected: 3 },
    ],
    hint: 'Fix one point and group the others by the slope to it — the biggest group plus that point is a line. Store the slope as a reduced (dx, dy) pair, never as a float.',
    approach:
      "Any line with two or more points contains some point, so fixing each point in turn and grouping the rest by slope finds every line. The largest group plus the fixed point is the answer.\n\nThe part that separates a working solution from a subtly broken one is representing the slope. `dy / dx` is a float, and floats lie: very large coordinates make distinct slopes compare equal, and vertical lines divide by zero. Store `(dx, dy)` divided by their gcd instead — exact, and no special case for vertical.\n\nTwo details finish it. Normalise the sign, or `(1, 2)` and `(-1, -2)` are recorded as different directions along the same line. And count exact duplicates separately, since they sit on every line through the fixed point and have no slope of their own.",
    solution:
      'def max_points(points):\n    n = len(points)\n    if n <= 2:\n        return n\n    best = 1\n    for i in range(n):\n        slopes = defaultdict(int)\n        same = 0\n        for j in range(i + 1, n):\n            dx = points[j][0] - points[i][0]\n            dy = points[j][1] - points[i][1]\n            if dx == 0 and dy == 0:\n                same += 1\n                continue\n            g = math.gcd(abs(dx), abs(dy))\n            dx, dy = dx // g, dy // g\n            if dx < 0 or (dx == 0 and dy < 0):\n                dx, dy = -dx, -dy\n            slopes[(dx, dy)] += 1\n        here = same + 1 + (max(slopes.values()) if slopes else 0)\n        best = max(best, here)\n    return best\n',
  },
];
