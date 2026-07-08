// NeetCode-150 expansion, part 2: binary search, linked list (adapted),
// trees. Trees use a nested-list convention: a node is [value, left, right]
// and an empty tree is null — recursion patterns are identical to TreeNode.

export const NEETCODE_2 = [
  // ── binary search ─────────────────────────────────────────────────
  {
    id: 'py-search-rotated',
    track: 'python',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'medium',
    pattern: 'binary-search',
    description:
      'A sorted array of **distinct** integers was rotated at an unknown pivot (e.g. `[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`). Find the index of `target`, or `-1`, in **O(log n)**.',
    examples: ['search_rotated([4,5,6,7,0,1,2], 0)  ->  4'],
    function_name: 'search_rotated',
    starter_code:
      'def search_rotated(nums, target):\n    # O(log n): one half is always sorted\n    ...\n',
    tests: [
      { args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
      { args: [[1], 0], expected: -1 },
      { args: [[5, 1, 3], 3], expected: 2 },
      { args: [[3, 1], 1], expected: 1 },
    ],
    hint: 'At every mid, at least one half is properly sorted. Check whether the target lies inside that sorted half; if yes go there, else go to the other half.',
    approach:
      'Binary search still works because at any `mid`, **one side is guaranteed sorted** (the rotation point can only be on one side). Determine which (`nums[lo] <= nums[mid]` → left is sorted), then ask a cheap range question: is the target inside that sorted half? If yes, search it; otherwise search the messy half — which becomes a smaller rotated array with the same property.\n\nO(log n). The two range checks (`nums[lo] <= target < nums[mid]` etc.) are where all the off-by-one bugs live — say them out loud when you write them.',
    solution:
      'def search_rotated(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[lo] <= nums[mid]:\n            if nums[lo] <= target < nums[mid]:\n                hi = mid - 1\n            else:\n                lo = mid + 1\n        else:\n            if nums[mid] < target <= nums[hi]:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return -1\n',
  },
  {
    id: 'py-find-min-rotated',
    track: 'python',
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'medium',
    pattern: 'binary-search',
    description:
      'A sorted array of distinct integers was rotated. Return its **minimum element** in O(log n).',
    examples: ['find_min([3,4,5,1,2])  ->  1'],
    function_name: 'find_min',
    starter_code: 'def find_min(nums):\n    # binary search toward the rotation point\n    ...\n',
    tests: [
      { args: [[3, 4, 5, 1, 2]], expected: 1 },
      { args: [[4, 5, 6, 7, 0, 1, 2]], expected: 0 },
      { args: [[11, 13, 15, 17]], expected: 11 },
      { args: [[2, 1]], expected: 1 },
      { args: [[1]], expected: 1 },
    ],
    hint: 'Compare mid against the RIGHT end: if nums[mid] > nums[hi] the minimum is to the right of mid; otherwise it is mid or left of it.',
    approach:
      'Binary search on the shape of the array: compare `nums[mid]` with `nums[hi]`. If `nums[mid] > nums[hi]`, the "cliff" (rotation point) is to the right, so `lo = mid + 1`; otherwise the minimum is at `mid` or left of it, so `hi = mid` (keep mid — it might be the answer). Loop while `lo < hi`; they converge on the minimum.\n\nComparing against `hi` rather than `lo` is deliberate: an already-sorted array (no rotation) is handled for free. This is the template for "binary search on a condition boundary" rather than on an exact value.',
    solution:
      'def find_min(nums):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return nums[lo]\n',
  },
  {
    id: 'py-koko-bananas',
    track: 'python',
    title: 'Koko Eating Bananas',
    difficulty: 'medium',
    pattern: 'binary-search',
    description:
      'Koko has `piles` of bananas and `h` hours. Each hour she picks one pile and eats up to `k` bananas from it (a pile smaller than `k` still costs the full hour). Return the **minimum integer speed `k`** that finishes all piles within `h` hours.\n\nThis is **binary search on the answer**, not on the array.',
    examples: ['min_eating_speed([3,6,7,11], 8)  ->  4'],
    function_name: 'min_eating_speed',
    starter_code:
      'def min_eating_speed(piles, h):\n    # binary search k in [1, max(piles)]\n    ...\n',
    tests: [
      { args: [[3, 6, 7, 11], 8], expected: 4 },
      { args: [[30, 11, 23, 4, 20], 5], expected: 30 },
      { args: [[30, 11, 23, 4, 20], 6], expected: 23 },
      { args: [[1, 1, 1, 1], 4], expected: 1 },
    ],
    hint: 'For a candidate speed k, hours needed = sum(ceil(pile / k)). That is monotonic in k — binary search the smallest k that fits in h.',
    approach:
      'Feasibility is monotonic: if speed `k` finishes in time, any faster speed does too. So binary search the smallest feasible `k` in `[1, max(piles)]`: for each candidate, compute `sum(ceil(pile / k))` hours and compare with `h`. Feasible → try slower (`hi = mid`); infeasible → must go faster (`lo = mid + 1`).\n\nO(n log max(piles)). "Binary search on the answer" (Koko, ship capacity, split array) is one of the highest-yield patterns at Google-style interviews — recognize it whenever the question asks for a minimum value that satisfies a monotonic check. `ceil(p/k)` as `-(-p // k)` avoids floats if you want to show off.',
    solution:
      'def min_eating_speed(piles, h):\n    import math\n    lo, hi = 1, max(piles)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        hours = sum(math.ceil(p / mid) for p in piles)\n        if hours <= h:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo\n',
  },

  // ── linked list (adapted to lists — the pointer patterns still apply) ──
  {
    id: 'py-merge-sorted-lists',
    track: 'python',
    title: 'Merge Two Sorted Lists',
    difficulty: 'easy',
    pattern: 'linked-list',
    description:
      'Given two lists already sorted ascending, merge them into one sorted list.\n\n**Rule of the dojo:** no `sorted(l1 + l2)` — do the real two-pointer merge, it is the heart of merge sort and of the linked-list original.',
    examples: ['merge_sorted_lists([1,2,4], [1,3,4])  ->  [1,1,2,3,4,4]'],
    function_name: 'merge_sorted_lists',
    starter_code:
      'def merge_sorted_lists(l1, l2):\n    # two pointers, take the smaller head each step\n    ...\n',
    tests: [
      { args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { args: [[], []], expected: [] },
      { args: [[], [0]], expected: [0] },
      { args: [[5], [1, 2, 6]], expected: [1, 2, 5, 6] },
    ],
    hint: 'Two index pointers. Repeatedly append whichever current element is smaller, then append the leftover tail.',
    approach:
      'Keep an index into each list; each step take the smaller current element and advance that index. When one list runs out, append the remainder of the other — it is already sorted. O(n + m), and stable if you take from `l1` on ties (`<=`).\n\nIn the ListNode version, the same loop rewires `.next` pointers behind a **dummy head** — the dummy avoids special-casing the first node, a trick worth mentioning. This merge is also step two of *Merge K Sorted Lists* and the inner loop of merge sort.',
    solution:
      'def merge_sorted_lists(l1, l2):\n    i = j = 0\n    out = []\n    while i < len(l1) and j < len(l2):\n        if l1[i] <= l2[j]:\n            out.append(l1[i])\n            i += 1\n        else:\n            out.append(l2[j])\n            j += 1\n    out.extend(l1[i:])\n    out.extend(l2[j:])\n    return out\n',
  },
  {
    id: 'py-reorder-list',
    track: 'python',
    title: 'Reorder List',
    difficulty: 'medium',
    pattern: 'linked-list',
    description:
      'Given the values of a list `[v0, v1, …, vn]`, reorder them to `[v0, vn, v1, vn-1, v2, …]` — first, last, second, second-to-last, alternating inward.',
    examples: ['reorder_list([1,2,3,4,5])  ->  [1,5,2,4,3]'],
    function_name: 'reorder_list',
    starter_code:
      'def reorder_list(vals):\n    # alternate front pointer / back pointer\n    ...\n',
    tests: [
      { args: [[1, 2, 3, 4, 5]], expected: [1, 5, 2, 4, 3] },
      { args: [[1, 2, 3, 4]], expected: [1, 4, 2, 3] },
      { args: [[1]], expected: [1] },
      { args: [[1, 2]], expected: [1, 2] },
    ],
    hint: 'Two pointers at both ends, alternating which one you take from, until they cross.',
    approach:
      'With random access this is just two pointers taking turns from front and back until they meet. The learning is in the **linked-list original**, where you cannot index from the back — the O(1)-space answer chains three sub-skills: find the middle (slow/fast pointers), reverse the second half in place, then interleave the two halves.\n\nBe able to narrate that three-step plan; each step is itself a classic (Middle of Linked List, Reverse Linked List, merge-by-alternation).',
    solution:
      'def reorder_list(vals):\n    out = []\n    lo, hi = 0, len(vals) - 1\n    take_front = True\n    while lo <= hi:\n        if take_front:\n            out.append(vals[lo])\n            lo += 1\n        else:\n            out.append(vals[hi])\n            hi -= 1\n        take_front = not take_front\n    return out\n',
  },

  // ── trees (node = [value, left, right], empty = null) ─────────────
  {
    id: 'py-max-depth-tree',
    track: 'python',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'easy',
    pattern: 'trees',
    description:
      'A binary tree is given as nested lists: each node is `[value, left, right]` where `left`/`right` are subtrees or `None`; the empty tree is `None`.\n\nReturn the tree\'s depth — the number of nodes on the longest root-to-leaf path.',
    examples: ['max_depth([3, [9,None,None], [20, [15,None,None], [7,None,None]]])  ->  3'],
    function_name: 'max_depth',
    starter_code:
      'def max_depth(tree):\n    # tree is [value, left, right] or None\n    ...\n',
    tests: [
      { args: [[3, [9, null, null], [20, [15, null, null], [7, null, null]]]], expected: 3 },
      { args: [null], expected: 0 },
      { args: [[1, null, [2, null, null]]], expected: 2 },
      { args: [[7, null, null]], expected: 1 },
    ],
    hint: 'Empty tree → 0. Otherwise 1 + max(depth of left, depth of right). That is the whole function.',
    approach:
      'The definitional tree recursion: an empty tree has depth 0; a node adds 1 to the deeper of its subtrees. Base case, recursive case, done — three lines.\n\nO(n) time, O(height) stack. Internalize this shape: *invert tree*, *same tree*, *count nodes*, *diameter* are all "handle None, recurse on children, combine". If asked for an iterative version, it is a BFS counting levels.',
    solution:
      'def max_depth(tree):\n    if tree is None:\n        return 0\n    return 1 + max(max_depth(tree[1]), max_depth(tree[2]))\n',
  },
  {
    id: 'py-invert-tree',
    track: 'python',
    title: 'Invert Binary Tree',
    difficulty: 'easy',
    pattern: 'trees',
    description:
      'Mirror a binary tree: every node\'s left and right subtrees swap, all the way down. Nodes are `[value, left, right]`, empty is `None`. Return the inverted tree.\n\n(The problem Google famously rejected the author of Homebrew over. Not today.)',
    examples: [
      'invert_tree([4, [2,None,None], [7,None,None]])  ->  [4, [7,None,None], [2,None,None]]',
    ],
    function_name: 'invert_tree',
    starter_code:
      'def invert_tree(tree):\n    # swap children, recurse\n    ...\n',
    tests: [
      {
        args: [[4, [2, [1, null, null], [3, null, null]], [7, [6, null, null], [9, null, null]]]],
        expected: [4, [7, [9, null, null], [6, null, null]], [2, [3, null, null], [1, null, null]]],
      },
      { args: [null], expected: null },
      { args: [[1, null, null]], expected: [1, null, null] },
      { args: [[1, [2, null, null], null]], expected: [1, null, [2, null, null]] },
    ],
    hint: 'Return a node whose left is the inverted RIGHT child and whose right is the inverted LEFT child.',
    approach:
      'Recurse and swap: the inverted tree is `[value, invert(right), invert(left)]`, with `None → None` as the base case. Swapping while recursing (rather than recursing then swapping) makes it a one-liner body.\n\nO(n) time, O(height) stack. Interview follow-up is usually the iterative version: BFS/DFS over nodes, swapping children as you visit.',
    solution:
      'def invert_tree(tree):\n    if tree is None:\n        return None\n    return [tree[0], invert_tree(tree[2]), invert_tree(tree[1])]\n',
  },
  {
    id: 'py-same-tree',
    track: 'python',
    title: 'Same Tree',
    difficulty: 'easy',
    pattern: 'trees',
    description:
      'Given two binary trees (`[value, left, right]` / `None`), return `True` if they are structurally identical with equal values.',
    examples: ['same_tree([1,[2,None,None],None], [1,None,[2,None,None]])  ->  False'],
    function_name: 'same_tree',
    starter_code: 'def same_tree(p, q):\n    ...\n',
    tests: [
      {
        args: [
          [1, [2, null, null], [3, null, null]],
          [1, [2, null, null], [3, null, null]],
        ],
        expected: true,
      },
      { args: [[1, [2, null, null], null], [1, null, [2, null, null]]], expected: false },
      { args: [null, null], expected: true },
      { args: [[1, null, null], [2, null, null]], expected: false },
    ],
    hint: 'Both None → True. One None or values differ → False. Otherwise recurse on both pairs of children.',
    approach:
      'Structural recursion over two trees at once: both empty → same; exactly one empty or values unequal → different; otherwise the trees are the same iff both left pairs and right pairs are the same.\n\nO(min(n, m)). This "walk two structures in lockstep" shape reappears in *Subtree of Another Tree* (same_tree as a helper called at every node) and *Symmetric Tree* (compare left against mirrored right).',
    solution:
      'def same_tree(p, q):\n    if p is None and q is None:\n        return True\n    if p is None or q is None or p[0] != q[0]:\n        return False\n    return same_tree(p[1], q[1]) and same_tree(p[2], q[2])\n',
  },
  {
    id: 'py-validate-bst',
    track: 'python',
    title: 'Validate Binary Search Tree',
    difficulty: 'medium',
    pattern: 'trees',
    description:
      'Return `True` if a binary tree (`[value, left, right]` / `None`) is a valid **binary search tree**: every node in a left subtree is strictly less than every ancestor it hangs left of, and mirror for the right.\n\nThe trap: checking only each node against its direct children is **wrong** — a grandchild can violate a grandparent.',
    examples: ['is_valid_bst([5, [1,None,None], [4, [3,None,None], [6,None,None]]])  ->  False'],
    function_name: 'is_valid_bst',
    starter_code:
      'def is_valid_bst(tree):\n    # pass (lo, hi) bounds down the recursion\n    ...\n',
    tests: [
      { args: [[2, [1, null, null], [3, null, null]]], expected: true },
      { args: [[5, [1, null, null], [4, [3, null, null], [6, null, null]]]], expected: false },
      { args: [[5, [4, null, null], [6, [3, null, null], [7, null, null]]]], expected: false },
      { args: [[1, null, null]], expected: true },
      { args: [[2, [2, null, null], null]], expected: false },
    ],
    hint: 'Recurse with an allowed open interval (lo, hi). Going left tightens hi to the node value; going right tightens lo.',
    approach:
      'Carry an allowed **open interval** down the tree: the root may be anything in (−∞, +∞); recursing left tightens the upper bound to the node\'s value, recursing right tightens the lower bound. A node is valid iff `lo < value < hi` and both subtrees validate against their tightened bounds.\n\nO(n). The third test case ([5,[4],[6,[3],[7]]]) is exactly the grandparent trap: 3 is fine relative to 6 but violates the `> 5` bound inherited from the root. Alternative accepted answer: an in-order traversal of a BST must be strictly increasing.',
    solution:
      'def is_valid_bst(tree):\n    def check(node, lo, hi):\n        if node is None:\n            return True\n        v = node[0]\n        if not (lo < v < hi):\n            return False\n        return check(node[1], lo, v) and check(node[2], v, hi)\n    return check(tree, float("-inf"), float("inf"))\n',
  },
  {
    id: 'py-tree-diameter',
    track: 'python',
    title: 'Diameter of Binary Tree',
    difficulty: 'medium',
    pattern: 'trees',
    description:
      'The diameter of a binary tree is the number of **edges** on the longest path between any two nodes (the path need not pass through the root). Tree given as `[value, left, right]` / `None`.',
    examples: ['diameter([1, [2, [4,None,None], [5,None,None]], [3,None,None]])  ->  3   # 4→2→1→3'],
    function_name: 'diameter',
    starter_code:
      'def diameter(tree):\n    # track best (left_depth + right_depth) while computing depth\n    ...\n',
    tests: [
      { args: [[1, [2, [4, null, null], [5, null, null]], [3, null, null]]], expected: 3 },
      { args: [[1, [2, null, null], null]], expected: 1 },
      { args: [[1, null, null]], expected: 0 },
      { args: [[1, [2, [3, [4, null, null], null], null], null]], expected: 3 },
    ],
    hint: 'The longest path through a node = depth(left) + depth(right). Compute depth recursively and update a best-so-far at every node.',
    approach:
      'The longest path that *bends* at a node has length `depth(left) + depth(right)` (in edges). So run the ordinary depth recursion, and at every node update a running maximum with that sum before returning `1 + max(left, right)` as the depth.\n\nOne O(n) pass. This "compute X, but harvest Y at every node along the way" structure is a mini-pattern of its own — *Balanced Binary Tree* and *Binary Tree Maximum Path Sum* (the hard version) use exactly it. Watch the units: depth in nodes, diameter in edges.',
    solution:
      'def diameter(tree):\n    best = 0\n    def depth(node):\n        nonlocal best\n        if node is None:\n            return 0\n        l = depth(node[1])\n        r = depth(node[2])\n        best = max(best, l + r)\n        return 1 + max(l, r)\n    depth(tree)\n    return best\n',
  },
  {
    id: 'py-level-order',
    track: 'python',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'medium',
    pattern: 'trees',
    description:
      'Return the values of a binary tree level by level, as a list of lists (top level first, left to right). Tree given as `[value, left, right]` / `None`.\n\nThis is **BFS** on a tree — the counterpart to all the DFS recursion.',
    examples: ['level_order([3, [9,None,None], [20, [15,None,None], [7,None,None]]])  ->  [[3], [9,20], [15,7]]'],
    function_name: 'level_order',
    starter_code:
      'def level_order(tree):\n    # process one whole level at a time\n    ...\n',
    tests: [
      {
        args: [[3, [9, null, null], [20, [15, null, null], [7, null, null]]]],
        expected: [[3], [9, 20], [15, 7]],
      },
      { args: [null], expected: [] },
      { args: [[1, null, null]], expected: [[1]] },
      {
        args: [[1, [2, [4, null, null], null], [3, null, [5, null, null]]]],
        expected: [[1], [2, 3], [4, 5]],
      },
    ],
    hint: 'Keep a list of the current level\'s nodes; collect their values, then build the next level from all their non-None children.',
    approach:
      'Breadth-first traversal, processed a **whole level at a time**: hold the current level as a list of nodes, record its values, then flatten out all non-empty children to form the next level. Loop until the level is empty.\n\nO(n). The equivalent deque formulation (snapshot `len(queue)` per round) is worth knowing since interviewers often expect it; level-at-a-time BFS also powers *Right Side View*, *Zigzag*, and grid problems like Rotting Oranges.',
    solution:
      'def level_order(tree):\n    if tree is None:\n        return []\n    res = []\n    level = [tree]\n    while level:\n        res.append([n[0] for n in level])\n        level = [child for n in level for child in (n[1], n[2]) if child is not None]\n    return res\n',
  },
];
