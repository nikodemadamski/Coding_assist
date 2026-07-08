// NeetCode-150 expansion, part 3: heap / priority queue, backtracking, graphs.

export const NEETCODE_3 = [
  // ── heap / priority queue ─────────────────────────────────────────
  {
    id: 'py-kth-largest',
    track: 'python',
    title: 'Kth Largest Element',
    difficulty: 'medium',
    pattern: 'heap',
    description:
      'Return the `k`-th largest element of a list (by sorted order, duplicates count). Do it with a **heap of size k**, not by sorting everything.\n\nPython\'s `heapq` is a min-heap — that turns out to be exactly what you want.',
    examples: ['find_kth_largest([3,2,1,5,6,4], 2)  ->  5'],
    function_name: 'find_kth_largest',
    starter_code:
      'import heapq\n\ndef find_kth_largest(nums, k):\n    # maintain a min-heap of the k largest seen\n    ...\n',
    tests: [
      { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
      { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
      { args: [[1], 1], expected: 1 },
      { args: [[7, 7, 7], 2], expected: 7 },
    ],
    hint: 'Push everything through a min-heap, popping whenever its size exceeds k. The k largest survive; the root is the smallest of them — the answer.',
    approach:
      'Keep a min-heap holding the **k largest values seen so far**: push each number, and if the heap grows past `k`, pop (which evicts the smallest — never a top-k value). After the scan, the heap root is the k-th largest.\n\nO(n log k) time, O(k) space — beats full sorting when k ≪ n, and it works on streams. Interview add-ons: quickselect gives O(n) average, and the *why min-heap for largest* inversion is a favorite conceptual check.',
    solution:
      'import heapq\n\ndef find_kth_largest(nums, k):\n    heap = []\n    for n in nums:\n        heapq.heappush(heap, n)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]\n',
  },
  {
    id: 'py-last-stone-weight',
    track: 'python',
    title: 'Last Stone Weight',
    difficulty: 'easy',
    pattern: 'heap',
    description:
      'You have stones with positive weights. Each turn, smash the **two heaviest** together: equal weights → both destroyed; unequal → the lighter is destroyed and the heavier becomes the difference. Return the final stone\'s weight (0 if none remain).',
    examples: ['last_stone_weight([2,7,4,1,8,1])  ->  1'],
    function_name: 'last_stone_weight',
    starter_code:
      'import heapq\n\ndef last_stone_weight(stones):\n    # max-heap via negated values\n    ...\n',
    tests: [
      { args: [[2, 7, 4, 1, 8, 1]], expected: 1 },
      { args: [[1]], expected: 1 },
      { args: [[3, 3]], expected: 0 },
      { args: [[10, 4, 2, 10]], expected: 2 },
    ],
    hint: 'Python has no max-heap — negate every value on the way in and out of heapq.',
    approach:
      'Repeatedly extracting the two largest is a **max-heap** job. Python only ships a min-heap, so store negated weights: pushing `-w` makes the smallest stored value the heaviest stone. Pop two, push back the difference if nonzero, until ≤1 stone remains.\n\nO(n log n). The negation trick is boilerplate you should be able to type without thinking — it comes up any time you need "largest first" in Python.',
    solution:
      'import heapq\n\ndef last_stone_weight(stones):\n    heap = [-s for s in stones]\n    heapq.heapify(heap)\n    while len(heap) > 1:\n        a = -heapq.heappop(heap)\n        b = -heapq.heappop(heap)\n        if a != b:\n            heapq.heappush(heap, -(a - b))\n    return -heap[0] if heap else 0\n',
  },

  // ── backtracking ──────────────────────────────────────────────────
  {
    id: 'py-subsets',
    track: 'python',
    title: 'Subsets',
    difficulty: 'medium',
    pattern: 'backtracking',
    description:
      'Given a list of **distinct** integers, return every possible subset (the power set).\n\nFor a deterministic answer: sort each subset ascending, and sort the list of subsets (plain `sorted()` on the result).',
    examples: ['subsets([1,2,3])  ->  [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]'],
    function_name: 'subsets',
    starter_code:
      'def subsets(nums):\n    # decision per element: include it or not\n    ...\n',
    tests: [
      {
        args: [[1, 2, 3]],
        expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]],
      },
      { args: [[0]], expected: [[], [0]] },
      { args: [[2, 1]], expected: [[], [1], [1, 2], [2]] },
    ],
    hint: 'At each index make two recursive calls: one that skips the element, one that includes it. When you run out of elements, record the path.',
    approach:
      'Backtracking as a **decision tree**: at index `i` you either exclude `nums[i]` or include it, then move to `i+1`; reaching the end records the current path. Two branches per element → 2ⁿ subsets. Append/`pop` around the include-branch is the "backtrack" — undoing the choice before trying the alternative.\n\nO(n · 2ⁿ) output-bound. This include/exclude skeleton is the base for *Subsets II* (skip duplicate branches), *Combination Sum*, and *Partition Equal Subset* thinking. The slick iterative alternative (`res += [s + [n] for s in res]`) is worth knowing too.',
    solution:
      'def subsets(nums):\n    nums = sorted(nums)\n    res = []\n    path = []\n    def backtrack(i):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        backtrack(i + 1)\n        path.append(nums[i])\n        backtrack(i + 1)\n        path.pop()\n    backtrack(0)\n    return sorted(res)\n',
  },
  {
    id: 'py-permutations',
    track: 'python',
    title: 'Permutations',
    difficulty: 'medium',
    pattern: 'backtracking',
    description:
      'Given a list of distinct integers, return **all orderings** (permutations) of it.\n\nDeterministic output: return the list of permutations sorted (`sorted()` of the result).',
    examples: ['permutations([1,2,3])  ->  [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]'],
    function_name: 'permutations',
    starter_code:
      'def permutations(nums):\n    # grow a path; recurse on what remains\n    ...\n',
    tests: [
      {
        args: [[1, 2, 3]],
        expected: [
          [1, 2, 3],
          [1, 3, 2],
          [2, 1, 3],
          [2, 3, 1],
          [3, 1, 2],
          [3, 2, 1],
        ],
      },
      { args: [[0, 1]], expected: [[0, 1], [1, 0]] },
      { args: [[1]], expected: [[1]] },
    ],
    hint: 'State = (path so far, values still unused). For each unused value: add it to the path and recurse on the rest.',
    approach:
      'Another decision tree, but the branching is "which unused element comes next": for every value still remaining, place it and recurse on the remainder; an empty remainder means the path is a complete permutation. n! leaves — permutations are inherently factorial, say so before the interviewer asks.\n\nThe list-slicing version here trades a bit of copying for clarity; the in-place swap version (`nums[i], nums[first] = ...`) is the O(1)-extra-space refinement. *Permutations II* adds duplicate handling: sort and skip equal siblings at the same depth.',
    solution:
      'def permutations(nums):\n    res = []\n    def backtrack(path, remaining):\n        if not remaining:\n            res.append(path[:])\n            return\n        for i in range(len(remaining)):\n            backtrack(path + [remaining[i]], remaining[:i] + remaining[i + 1 :])\n    backtrack([], sorted(nums))\n    return sorted(res)\n',
  },
  {
    id: 'py-combination-sum',
    track: 'python',
    title: 'Combination Sum',
    difficulty: 'medium',
    pattern: 'backtracking',
    description:
      'Given distinct positive `candidates` and a `target`, return all unique combinations (each candidate usable **unlimited times**) summing to `target`.\n\nDeterministic output: combinations ascending inside, and the outer list sorted.',
    examples: ['combination_sum([2,3,6,7], 7)  ->  [[2,2,3], [7]]'],
    function_name: 'combination_sum',
    starter_code:
      'def combination_sum(candidates, target):\n    # recurse with a start index so combinations stay unique\n    ...\n',
    tests: [
      { args: [[2, 3, 6, 7], 7], expected: [[2, 2, 3], [7]] },
      { args: [[2, 3, 5], 8], expected: [[2, 2, 2, 2], [2, 3, 3], [3, 5]] },
      { args: [[2], 1], expected: [] },
      { args: [[1], 2], expected: [[1, 1]] },
    ],
    hint: 'Pass a `start` index down: a call may reuse candidates[start:] but never look back. Reusing the SAME index allows repeats without duplicate combos.',
    approach:
      'The uniqueness trick is the `start` index: each recursive call may only use candidates from `start` onward, so `[2,3]` and `[3,2]` can never both appear. Allowing **reuse** means recursing with the *same* index `i` (not `i+1`) after choosing `candidates[i]`. Subtract from a running remainder; 0 records the path, and with sorted candidates you can `break` as soon as one exceeds the remainder.\n\nExponential in the worst case (it must be — the output can be). The `start`-index idea is the difference between combinations and permutations in every backtracking problem.',
    solution:
      'def combination_sum(candidates, target):\n    candidates = sorted(candidates)\n    res = []\n    def backtrack(start, path, remaining):\n        if remaining == 0:\n            res.append(path[:])\n            return\n        for i in range(start, len(candidates)):\n            c = candidates[i]\n            if c > remaining:\n                break\n            path.append(c)\n            backtrack(i, path, remaining - c)\n            path.pop()\n    backtrack(0, [], target)\n    return sorted(res)\n',
  },

  // ── graphs ────────────────────────────────────────────────────────
  {
    id: 'py-number-of-islands',
    track: 'python',
    title: 'Number of Islands',
    difficulty: 'medium',
    pattern: 'graphs',
    description:
      'Given a 2-D grid of `"1"` (land) and `"0"` (water), count the islands — groups of land cells connected **up/down/left/right** (not diagonally).\n\nThe single most-asked graph question in industry interviews.',
    examples: ['num_islands([["1","1","0"],["1","0","0"],["0","0","1"]])  ->  2'],
    function_name: 'num_islands',
    starter_code:
      'def num_islands(grid):\n    # flood-fill each unvisited land cell\n    ...\n',
    tests: [
      {
        args: [
          [
            ['1', '1', '1', '1', '0'],
            ['1', '1', '0', '1', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
          ],
        ],
        expected: 1,
      },
      {
        args: [
          [
            ['1', '1', '0', '0', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '1', '0', '0'],
            ['0', '0', '0', '1', '1'],
          ],
        ],
        expected: 3,
      },
      { args: [[['0']]], expected: 0 },
      { args: [[['1'], ['1']]], expected: 1 },
    ],
    hint: 'Scan every cell. On unvisited land: count += 1, then DFS-flood the whole island so it is never counted again.',
    approach:
      'Treat the grid as a graph where each land cell connects to its 4 neighbors. Scan all cells; each time you hit land you haven\'t visited, that\'s a **new island** — increment the count and flood-fill (DFS or BFS) from it, marking every reachable land cell visited so the rest of the island never triggers another count.\n\nO(rows × cols): every cell is visited a constant number of times. Bundle the bounds-check + water-check + seen-check at the top of the DFS and the recursion stays four clean lines. Same skeleton: Max Area of Island, Flood Fill, Surrounded Regions, Pacific Atlantic.',
    solution:
      'def num_islands(grid):\n    if not grid:\n        return 0\n    rows, cols = len(grid), len(grid[0])\n    seen = set()\n    def sink(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols:\n            return\n        if (r, c) in seen or grid[r][c] == "0":\n            return\n        seen.add((r, c))\n        sink(r + 1, c)\n        sink(r - 1, c)\n        sink(r, c + 1)\n        sink(r, c - 1)\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == "1" and (r, c) not in seen:\n                count += 1\n                sink(r, c)\n    return count\n',
  },
  {
    id: 'py-max-area-island',
    track: 'python',
    title: 'Max Area of Island',
    difficulty: 'medium',
    pattern: 'graphs',
    description:
      'Given a 2-D grid of `1` (land) and `0` (water) integers, return the **area of the largest island** (4-directional connectivity). Return 0 if there is no land.',
    examples: ['max_area_island([[0,1,1,0],[1,1,0,0],[0,0,0,1]])  ->  4'],
    function_name: 'max_area_island',
    starter_code:
      'def max_area_island(grid):\n    # flood fill, but RETURN the size this time\n    ...\n',
    tests: [
      { args: [[[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 1]]], expected: 4 },
      { args: [[[0, 0], [0, 0]]], expected: 0 },
      { args: [[[1]]], expected: 1 },
      { args: [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], expected: 1 },
    ],
    hint: 'Same flood fill as Number of Islands, but the DFS returns 1 + the areas of its four neighbor calls.',
    approach:
      'Identical flood fill to Number of Islands, except the DFS **returns a value**: 0 for water/out-of-bounds/visited, else `1 +` the sum of the four recursive neighbor calls — the area of the component containing that cell. Track the max over all starting cells.\n\nO(rows × cols). The pair of these two problems teaches the two DFS flavors: *do something* (mark) vs *compute something* (return and combine) — most grid questions are one or the other.',
    solution:
      'def max_area_island(grid):\n    rows, cols = len(grid), len(grid[0])\n    seen = set()\n    def area(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols:\n            return 0\n        if (r, c) in seen or grid[r][c] == 0:\n            return 0\n        seen.add((r, c))\n        return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1)\n    best = 0\n    for r in range(rows):\n        for c in range(cols):\n            best = max(best, area(r, c))\n    return best\n',
  },
  {
    id: 'py-rotting-oranges',
    track: 'python',
    title: 'Rotting Oranges',
    difficulty: 'medium',
    pattern: 'graphs',
    description:
      'A grid holds `0` (empty), `1` (fresh orange), `2` (rotten orange). Every minute, fresh oranges adjacent (4-dir) to a rotten one rot. Return the minutes until no fresh orange remains, or `-1` if some can never rot.\n\nMulti-source **BFS** — time-steps mean breadth-first, always.',
    examples: ['oranges_rotting([[2,1,1],[1,1,0],[0,1,1]])  ->  4'],
    function_name: 'oranges_rotting',
    starter_code:
      'def oranges_rotting(grid):\n    # BFS from ALL rotten oranges at once\n    ...\n',
    tests: [
      { args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], expected: 4 },
      { args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], expected: -1 },
      { args: [[[0, 2]]], expected: 0 },
      { args: [[[1]]], expected: -1 },
      { args: [[[0]]], expected: 0 },
    ],
    hint: 'Seed a queue with every rotten orange (minute 0) and count the fresh ones. BFS outward; if fresh remain at the end, return -1.',
    approach:
      '"How long until X spreads everywhere" is **multi-source BFS**: seed the queue with *every* rotten orange at minute 0 (not one source — all of them), count the fresh oranges, then expand level by level, stamping each newly-rotted orange with its minute and decrementing the fresh count. Answer = largest minute stamp, or −1 if fresh oranges survive (unreachable pockets).\n\nO(rows × cols). BFS gives shortest times because it explores strictly in order of distance — the reason DFS can\'t solve this. Same template: Walls and Gates, 01-Matrix, shortest path in a grid.',
    solution:
      'def oranges_rotting(grid):\n    from collections import deque\n    rows, cols = len(grid), len(grid[0])\n    q = deque()\n    fresh = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 2:\n                q.append((r, c, 0))\n            elif grid[r][c] == 1:\n                fresh += 1\n    rotted = set()\n    minutes = 0\n    while q:\n        r, c, m = q.popleft()\n        minutes = max(minutes, m)\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in rotted:\n                rotted.add((nr, nc))\n                fresh -= 1\n                q.append((nr, nc, m + 1))\n    return minutes if fresh == 0 else -1\n',
  },
  {
    id: 'py-course-schedule',
    track: 'python',
    title: 'Course Schedule',
    difficulty: 'medium',
    pattern: 'graphs',
    description:
      'There are `num_courses` courses labeled `0 … n-1` and a list of pairs `[course, prerequisite]`. Return `True` if you can finish every course — i.e. the prerequisite graph has **no cycle**.\n\nCycle detection in a directed graph / topological sort.',
    examples: ['can_finish(2, [[1,0]])  ->  True     can_finish(2, [[1,0],[0,1]])  ->  False'],
    function_name: 'can_finish',
    starter_code:
      'def can_finish(num_courses, prerequisites):\n    # DFS with three node states: unseen / visiting / done\n    ...\n',
    tests: [
      { args: [2, [[1, 0]]], expected: true },
      { args: [2, [[1, 0], [0, 1]]], expected: false },
      { args: [5, [[1, 4], [2, 4], [3, 1], [3, 2]]], expected: true },
      { args: [1, []], expected: true },
      { args: [4, [[1, 0], [2, 1], [3, 2], [1, 3]]], expected: false },
    ],
    hint: 'DFS each course. Mark nodes "visiting" on the way down and "done" on the way up — hitting a "visiting" node again means a cycle.',
    approach:
      'Build an adjacency list, then DFS every course with **three states**: unseen, *visiting* (currently on the recursion stack), *done* (fully explored, known safe). Re-entering a `visiting` node means the path looped back on itself — a cycle → impossible. Reaching a `done` node is fine (shared prerequisite, not a cycle) — conflating those two states is *the* classic bug here.\n\nO(V + E). Equivalent BFS answer: Kahn\'s algorithm — repeatedly remove in-degree-0 nodes; leftovers mean a cycle. Course Schedule II just asks for the removal order.',
    solution:
      'def can_finish(num_courses, prerequisites):\n    graph = {i: [] for i in range(num_courses)}\n    for course, pre in prerequisites:\n        graph[course].append(pre)\n    state = {}\n    def has_cycle(node):\n        if state.get(node) == 0:\n            return True\n        if state.get(node) == 1:\n            return False\n        state[node] = 0\n        for nxt in graph[node]:\n            if has_cycle(nxt):\n                return True\n        state[node] = 1\n        return False\n    return not any(has_cycle(i) for i in range(num_courses))\n',
  },
];
