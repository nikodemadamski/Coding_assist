// Multi-approach ladders (brute force → optimal) merged onto questions that
// shipped with a single reference solution. Every code string here is run
// against the question's real tests by the seed gate — a broken "approach"
// cannot merge. The LAST approach is the model: its complexity string is what
// the mock debrief and the Big-O check-in grade against, so it must stay in
// sync with src/data/complexity.js.

export const APPROACHES = {
  // ── python warm-ups: the naive way vs the pythonic way ──────────────────
  'py-reverse-string': [
    {
      name: 'Build it backwards',
      complexity: 'O(n) time, O(n) space',
      code: 'def reverse_string(s):\n    out = ""\n    for ch in s:\n        out = ch + out\n    return out',
      note: 'Prepending each character works but rebuilds the string every step — O(n²) in CPython terms. Fine to say in an interview, then improve it.',
    },
    {
      name: 'Slice',
      complexity: 'O(n) time, O(n) space',
      code: 'def reverse_string(s):\n    return s[::-1]',
      note: 'The pythonic answer: a negative-step slice copies the string once, back to front.',
    },
  ],
  'py-common-elements': [
    {
      name: 'Nested loops',
      complexity: 'O(n·m) time, O(n) space',
      code: 'def common_elements(a, b):\n    out = []\n    for x in a:\n        if x in b and x not in out:\n            out.append(x)\n    return sorted(out)',
      note: 'Every `x in b` is a hidden scan of the whole second list — that is where the n·m comes from.',
    },
    {
      name: 'Set intersection',
      complexity: 'O(n + m) time, O(n) space',
      code: 'def common_elements(a, b):\n    return sorted(set(a) & set(b))',
      note: 'Sets make membership O(1); `&` does in one operation what the nested loop did slowly.',
    },
  ],
  'py-invert-dict': [
    {
      name: 'Explicit loop',
      complexity: 'O(n) time, O(n) space',
      code: 'def invert_dict(d):\n    out = {}\n    for k, v in d.items():\n        out[v] = k\n    return out',
      note: 'Same complexity as the comprehension — write whichever you can produce without thinking.',
    },
    {
      name: 'Dict comprehension',
      complexity: 'O(n) time, O(n) space',
      code: 'def invert_dict(d):\n    return {v: k for k, v in d.items()}',
      note: 'One line, reads like the problem statement: value becomes key, key becomes value.',
    },
  ],
  'py-merge-counts': [
    {
      name: 'Manual merge',
      complexity: 'O(n + m) time, O(n + m) space',
      code: 'def merge_counts(a, b):\n    merged = dict(a)\n    for k, v in b.items():\n        merged[k] = merged.get(k, 0) + v\n    return merged',
      note: 'Copy one dict, fold the other in with .get(k, 0) — the default rescues missing keys.',
    },
    {
      name: 'Counter addition',
      complexity: 'O(n + m) time, O(n + m) space',
      code: 'def merge_counts(a, b):\n    return dict(Counter(a) + Counter(b))',
      note: 'Counter defines + as element-wise addition. Know this exists; write the manual version if asked to avoid libraries.',
    },
  ],
  'py-char-frequency': [
    {
      name: 'Manual dict',
      complexity: 'O(n) time, O(k) space',
      code: 'def char_frequency(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    return counts',
      note: 'The counting idiom you will write a hundred times — worth having in muscle memory.',
    },
    {
      name: 'Counter',
      complexity: 'O(n) time, O(k) space — k distinct characters',
      code: 'def char_frequency(s):\n    return dict(Counter(s))',
      note: 'Counter IS this loop, packaged. Interviewers accept it; know what it does underneath.',
    },
  ],

  // ── arrays & hashing ─────────────────────────────────────────────────────
  'py-first-unique-char': [
    {
      name: 'Rescan per character',
      complexity: 'O(n²) time, O(1) space',
      code: 'def first_unique_char(s):\n    for i, ch in enumerate(s):\n        if s.count(ch) == 1:\n            return i\n    return -1',
      note: 's.count() walks the whole string for every position — n scans of length n.',
    },
    {
      name: 'Count once, scan once',
      complexity: 'O(n) time, O(k) space',
      code: 'def first_unique_char(s):\n    counts = Counter(s)\n    for i, ch in enumerate(s):\n        if counts[ch] == 1:\n            return i\n    return -1',
      note: 'Two linear passes: one to count, one to find the first count-of-1. Trading a little memory for a lot of time — the core hashing move.',
    },
  ],
  'py-group-anagrams': [
    {
      name: 'Sorted-word key',
      complexity: 'O(n · k log k) time, O(n·k) space',
      code: 'def group_anagrams(words):\n    groups = {}\n    for w in words:\n        key = "".join(sorted(w))\n        groups.setdefault(key, []).append(w)\n    return list(groups.values())',
      note: 'Anagrams sort to the same string, so the sorted word is a perfect group key.',
    },
    {
      name: 'Letter-count key',
      complexity: 'O(n·k) time, O(n·k) space — k = longest word',
      code: 'def group_anagrams(words):\n    groups = defaultdict(list)\n    for w in words:\n        key = [0] * 26\n        for ch in w:\n            key[ord(ch) - ord("a")] += 1\n        groups[tuple(key)].append(w)\n    return list(groups.values())',
      note: 'Counting letters replaces the sort: a 26-slot tuple identifies an anagram class in O(k) instead of O(k log k).',
    },
  ],
  'py-longest-consecutive': [
    {
      name: 'Sort and walk',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def longest_consecutive(nums):\n    if not nums:\n        return 0\n    ordered = sorted(set(nums))\n    best = run = 1\n    for prev, cur in zip(ordered, ordered[1:]):\n        run = run + 1 if cur == prev + 1 else 1\n        best = max(best, run)\n    return best',
      note: 'Sorting makes runs adjacent. Correct — but the problem asks for O(n), which is the interviewer’s real question.',
    },
    {
      name: 'Set + start-of-run scan',
      complexity: 'O(n) time, O(n) space',
      code: 'def longest_consecutive(nums):\n    values = set(nums)\n    best = 0\n    for n in values:\n        if n - 1 not in values:\n            length = 1\n            while n + length in values:\n                length += 1\n            best = max(best, length)\n    return best',
      note: 'Only numbers with no left neighbour start a run, so every element is visited at most twice — that is the O(n) trick.',
    },
  ],

  // ── linked list (value arrays here; notes name the real-node version) ────
  'py-merge-sorted-lists': [
    {
      name: 'Concatenate and sort',
      complexity: 'O((n + m) log(n + m)) time, O(n + m) space',
      code: 'def merge_sorted_lists(a, b):\n    return sorted(a + b)',
      note: 'Throws away the one thing you were given — both inputs are already sorted.',
    },
    {
      name: 'Two-pointer merge',
      complexity: 'O(n + m) time, O(1) extra space',
      code: 'def merge_sorted_lists(a, b):\n    out = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            out.append(a[i])\n            i += 1\n        else:\n            out.append(b[j])\n            j += 1\n    out.extend(a[i:])\n    out.extend(b[j:])\n    return out',
      note: 'Always take the smaller head — the merge step of merge sort. On real ListNodes you splice pointers instead of appending, which is where the O(1) space comes from.',
    },
  ],
  'py-reverse-list': [
    {
      name: 'Recursive',
      complexity: 'O(n) recursion depth — the slices make it O(n²) on arrays',
      code: 'def reverse_list(vals):\n    if not vals:\n        return []\n    return reverse_list(vals[1:]) + [vals[0]]',
      note: 'Reverse the rest, put the head at the end. Elegant, but every call slices a copy and recursion costs stack.',
    },
    {
      name: 'Pointer flip',
      complexity: 'O(n) time, O(1) space',
      code: 'def reverse_list(vals):\n    return vals[::-1]',
      note: 'On real ListNodes this is the prev/cur/next loop — flip each .next as you walk, three variables, no extra memory. Practice writing that loop until it is automatic.',
    },
  ],
  'py-reorder-list': [
    {
      name: 'Deque: alternate ends',
      complexity: 'O(n) time, O(n) space',
      code: 'def reorder_list(vals):\n    dq = deque(vals)\n    out = []\n    while dq:\n        out.append(dq.popleft())\n        if dq:\n            out.append(dq.pop())\n    return out',
      note: 'Take from the front, then the back, alternating. Clear, but needs the whole list copied into a deque.',
    },
    {
      name: 'Two indices walking inward',
      complexity: 'O(n) time, O(1) space',
      code: 'def reorder_list(vals):\n    out = []\n    lo, hi = 0, len(vals) - 1\n    take_front = True\n    while lo <= hi:\n        if take_front:\n            out.append(vals[lo])\n            lo += 1\n        else:\n            out.append(vals[hi])\n            hi -= 1\n        take_front = not take_front\n    return out',
      note: 'On real ListNodes the same idea is: find the middle (slow/fast), reverse the second half, interleave — the three-step combo interviewers want to see.',
    },
  ],
  'py-remove-nth-end': [
    {
      name: 'Two passes: count, then cut',
      complexity: 'O(n) time, O(1) space — two passes',
      code: 'def remove_nth_from_end(vals, n):\n    idx = len(vals) - n\n    return vals[:idx] + vals[idx + 1:]',
      note: 'Measure the length first, then the target is position len − n. Two walks over the data.',
    },
    {
      name: 'One pass: two pointers n apart',
      complexity: 'O(n) time, O(1) space',
      code: 'def remove_nth_from_end(vals, n):\n    lead = n\n    trail = 0\n    while lead < len(vals):\n        lead += 1\n        trail += 1\n    return vals[:trail] + vals[trail + 1:]',
      note: 'Send the lead pointer n steps ahead; when it falls off the end, the trailing pointer stands on the node to delete. One walk, no length needed.',
    },
  ],
  'py-add-two-numbers': [
    {
      name: 'Convert to ints and back',
      complexity: 'O(n + m) time, O(n + m) space',
      code: 'def add_two_numbers(a, b):\n    x = int("".join(map(str, reversed(a))))\n    y = int("".join(map(str, reversed(b))))\n    return [int(d) for d in str(x + y)][::-1]',
      note: 'Works because Python ints are unbounded — say that out loud, because in most languages (and with real ListNodes) this overflows and you must carry.',
    },
    {
      name: 'Digit-by-digit with carry',
      complexity: 'O(max(n, m)) time, O(max(n, m)) space',
      code: 'def add_two_numbers(a, b):\n    out = []\n    carry = 0\n    i = 0\n    while i < len(a) or i < len(b) or carry:\n        s = carry\n        if i < len(a):\n            s += a[i]\n        if i < len(b):\n            s += b[i]\n        out.append(s % 10)\n        carry = s // 10\n        i += 1\n    return out',
      note: 'Grade-school addition: sum the digits, keep s % 10, carry s // 10. The while condition including `carry` handles the final 1 for free.',
    },
  ],
  'py-merge-k-lists': [
    {
      name: 'Flatten and sort',
      complexity: 'O(N log N) time, O(N) space',
      code: 'def merge_k_lists(lists):\n    out = []\n    for lst in lists:\n        out.extend(lst)\n    return sorted(out)',
      note: 'Dump everything into one list and sort. Ignores that each list is already sorted — that order is worth a log factor.',
    },
    {
      name: 'Min-heap of list heads',
      complexity: 'O(N log k) time — N total nodes, k lists; O(k) space',
      code: 'def merge_k_lists(lists):\n    heap = []\n    for i, lst in enumerate(lists):\n        if lst:\n            heapq.heappush(heap, (lst[0], i, 0))\n    out = []\n    while heap:\n        val, i, j = heapq.heappop(heap)\n        out.append(val)\n        if j + 1 < len(lists[i]):\n            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))\n    return out',
      note: 'Only k candidates can be the next smallest — one head per list. A heap hands you the winner in log k instead of log N.',
    },
  ],

  // ── trees (encoded [value, left, right], None = empty) ───────────────────
  'py-max-depth-tree': [
    {
      name: 'BFS: count the levels',
      complexity: 'O(n) time, O(w) space — w = widest level',
      code: 'def max_depth(tree):\n    if tree is None:\n        return 0\n    depth = 0\n    level = [tree]\n    while level:\n        depth += 1\n        level = [kid for node in level for kid in (node[1], node[2]) if kid is not None]\n    return depth',
      note: 'Peel the tree one level at a time and count the peels.',
    },
    {
      name: 'One-line recursion',
      complexity: 'O(n) time, O(h) space — h = tree height',
      code: 'def max_depth(tree):\n    if tree is None:\n        return 0\n    return 1 + max(max_depth(tree[1]), max_depth(tree[2]))',
      note: 'The tree-recursion template: answer at a node = combine(answers of children) — this shape solves half the tree category.',
    },
  ],
  'py-invert-tree': [
    {
      name: 'BFS: swap with a queue',
      complexity: 'O(n) time, O(w) space',
      code: 'def invert_tree(tree):\n    def copy(node):\n        if node is None:\n            return None\n        return [node[0], copy(node[1]), copy(node[2])]\n    root = copy(tree)\n    if root is None:\n        return None\n    queue = deque([root])\n    while queue:\n        node = queue.popleft()\n        node[1], node[2] = node[2], node[1]\n        for kid in (node[1], node[2]):\n            if kid is not None:\n                queue.append(kid)\n    return root',
      note: 'Visit every node, swap its children. The queue version proves you do not NEED recursion — but look how much shorter the recursive one is.',
    },
    {
      name: 'Recursive swap',
      complexity: 'O(n) time, O(h) space',
      code: 'def invert_tree(tree):\n    if tree is None:\n        return None\n    return [tree[0], invert_tree(tree[2]), invert_tree(tree[1])]',
      note: 'Build each node with its children inverted and swapped. Three lines — the famous "Homebrew author" interview question.',
    },
  ],
  'py-same-tree': [
    {
      name: 'BFS: compare in lockstep',
      complexity: 'O(n) time, O(w) space',
      code: 'def same_tree(p, q):\n    queue = deque([(p, q)])\n    while queue:\n        a, b = queue.popleft()\n        if a is None and b is None:\n            continue\n        if a is None or b is None or a[0] != b[0]:\n            return False\n        queue.append((a[1], b[1]))\n        queue.append((a[2], b[2]))\n    return True',
      note: 'Walk both trees together, pair by pair; any mismatch ends it.',
    },
    {
      name: 'Recursive compare',
      complexity: 'O(n) time, O(h) space',
      code: 'def same_tree(p, q):\n    if p is None and q is None:\n        return True\n    if p is None or q is None or p[0] != q[0]:\n        return False\n    return same_tree(p[1], q[1]) and same_tree(p[2], q[2])',
      note: 'Same value here, same left subtrees, same right subtrees. The base cases carry all the logic.',
    },
  ],
  'py-validate-bst': [
    {
      name: 'Inorder must come out sorted',
      complexity: 'O(n) time, O(n) space',
      code: 'def is_valid_bst(tree):\n    order = []\n    def inorder(node):\n        if node is None:\n            return\n        inorder(node[1])\n        order.append(node[0])\n        inorder(node[2])\n    inorder(tree)\n    return all(a < b for a, b in zip(order, order[1:]))',
      note: 'A BST inorder traversal is strictly increasing — collect it and check. Costs a full O(n) list.',
    },
    {
      name: 'Pass down (lo, hi) bounds',
      complexity: 'O(n) time, O(h) space',
      code: 'def is_valid_bst(tree):\n    def check(node, lo, hi):\n        if node is None:\n            return True\n        v = node[0]\n        if not (lo < v < hi):\n            return False\n        return check(node[1], lo, v) and check(node[2], v, hi)\n    return check(tree, float("-inf"), float("inf"))',
      note: 'The classic trap is checking only parent vs child. Every node must respect bounds inherited from ALL ancestors — carry them down.',
    },
  ],
  'py-tree-diameter': [
    {
      name: 'Height per node, separately',
      complexity: 'O(n²) time, O(h) space',
      code: 'def diameter(tree):\n    def height(node):\n        if node is None:\n            return 0\n        return 1 + max(height(node[1]), height(node[2]))\n    def walk(node):\n        if node is None:\n            return 0\n        through = height(node[1]) + height(node[2])\n        return max(through, walk(node[1]), walk(node[2]))\n    return walk(tree)',
      note: 'The longest path through a node is left height + right height. Recomputing heights at every node repeats work all the way down.',
    },
    {
      name: 'One post-order pass',
      complexity: 'O(n) time, O(h) space',
      code: 'def diameter(tree):\n    best = 0\n    def height(node):\n        nonlocal best\n        if node is None:\n            return 0\n        lh = height(node[1])\n        rh = height(node[2])\n        best = max(best, lh + rh)\n        return 1 + max(lh, rh)\n    height(tree)\n    return best',
      note: 'Compute height once per node and update the diameter as a side effect on the way back up — the "return one thing, track another" trick shows up all over tree problems.',
    },
  ],
  'py-level-order': [
    {
      name: 'Recursion with a depth index',
      complexity: 'O(n) time, O(n) space',
      code: 'def level_order(tree):\n    levels = []\n    def walk(node, d):\n        if node is None:\n            return\n        if d == len(levels):\n            levels.append([])\n        levels[d].append(node[0])\n        walk(node[1], d + 1)\n        walk(node[2], d + 1)\n    walk(tree, 0)\n    return levels',
      note: 'DFS can fake BFS: carry the depth and file each value into its level bucket.',
    },
    {
      name: 'BFS queue',
      complexity: 'O(n) time, O(n) space',
      code: 'def level_order(tree):\n    if tree is None:\n        return []\n    levels = []\n    queue = deque([tree])\n    while queue:\n        row = []\n        for _ in range(len(queue)):\n            node = queue.popleft()\n            row.append(node[0])\n            for kid in (node[1], node[2]):\n                if kid is not None:\n                    queue.append(kid)\n        levels.append(row)\n    return levels',
      note: 'The canonical version: snapshot the queue length so each while-iteration drains exactly one level.',
    },
  ],
  'py-subtree': [
    {
      name: 'Match at every node',
      complexity: 'O(n·m) time, O(h) space',
      code: 'def is_subtree(root, sub):\n    def same(a, b):\n        if a is None and b is None:\n            return True\n        if a is None or b is None or a[0] != b[0]:\n            return False\n        return same(a[1], b[1]) and same(a[2], b[2])\n    def walk(node):\n        if node is None:\n            return sub is None\n        if same(node, sub):\n            return True\n        return walk(node[1]) or walk(node[2])\n    return walk(root)',
      note: 'Try a full same-tree comparison rooted at every node. Worst case each of n nodes pays an m-node check.',
    },
    {
      name: 'Serialize with null markers + substring',
      complexity: 'O(n + m) time, O(n + m) space — serialize with null markers',
      code: 'def is_subtree(root, sub):\n    def ser(node):\n        if node is None:\n            return "#"\n        return "[" + str(node[0]) + "," + ser(node[1]) + "," + ser(node[2]) + "]"\n    return ser(sub) in ser(root)',
      note: 'A bracketed serialization with explicit null markers makes every subtree a unique substring — tree containment becomes string containment.',
    },
  ],
  'py-kth-smallest-bst': [
    {
      name: 'Full inorder, then index',
      complexity: 'O(n) time, O(n) space',
      code: 'def kth_smallest(tree, k):\n    order = []\n    def inorder(node):\n        if node is None:\n            return\n        inorder(node[1])\n        order.append(node[0])\n        inorder(node[2])\n    inorder(tree)\n    return order[k - 1]',
      note: 'Inorder gives the sorted order; take element k−1. Simple, but traverses everything even when k = 1.',
    },
    {
      name: 'Iterative inorder, stop at k',
      complexity: 'O(h + k) time, O(h) space',
      code: 'def kth_smallest(tree, k):\n    stack = []\n    node = tree\n    while True:\n        while node is not None:\n            stack.append(node)\n            node = node[1]\n        node = stack.pop()\n        k -= 1\n        if k == 0:\n            return node[0]\n        node = node[2]',
      note: 'Drive the inorder traversal by hand with a stack and bail the moment the k-th value pops — no wasted visits.',
    },
  ],
  'py-lca-bst': [
    {
      name: 'Generic LCA (ignores the BST)',
      complexity: 'O(n) time, O(h) space',
      code: 'def lca_bst(root, p, q):\n    def path(node, target):\n        if node is None:\n            return None\n        if node[0] == target:\n            return [node[0]]\n        for kid in (node[1], node[2]):\n            rest = path(kid, target)\n            if rest is not None:\n                return [node[0]] + rest\n    pa, pb = path(root, p), path(root, q)\n    ans = pa[0]\n    for a, b in zip(pa, pb):\n        if a == b:\n            ans = a\n    return ans',
      note: 'Find the root-to-node path for each and take the last common entry. Works on any tree — which means it wastes the BST ordering.',
    },
    {
      name: 'Walk down using the ordering',
      complexity: 'O(h) time, O(1) space',
      code: 'def lca_bst(root, p, q):\n    node = root\n    while node:\n        if p < node[0] and q < node[0]:\n            node = node[1]\n        elif p > node[0] and q > node[0]:\n            node = node[2]\n        else:\n            return node[0]',
      note: 'The first node where p and q fall on different sides (or one equals it) IS the split point — the BST tells you which way to walk.',
    },
  ],

  // ── binary search ────────────────────────────────────────────────────────
  'py-binary-search': [
    {
      name: 'Linear scan',
      complexity: 'O(n) time, O(1) space',
      code: 'def binary_search(nums, target):\n    for i, n in enumerate(nums):\n        if n == target:\n            return i\n    return -1',
      note: 'Correct but never uses the sorted order — the one property the problem hands you.',
    },
    {
      name: 'Binary search',
      complexity: 'O(log n) time, O(1) space',
      code: 'def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1',
      note: 'Halve the search space every comparison. Get the invariant right (lo <= hi, mid±1) and it writes itself.',
    },
  ],
  'py-search-rotated': [
    {
      name: 'Linear scan',
      complexity: 'O(n) time, O(1) space',
      code: 'def search_rotated(nums, target):\n    for i, n in enumerate(nums):\n        if n == target:\n            return i\n    return -1',
      note: 'Ignores the structure entirely. The interviewer wants the O(log n) that survives the rotation.',
    },
    {
      name: 'Binary search on the sorted half',
      complexity: 'O(log n) time, O(1) space',
      code: 'def search_rotated(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[lo] <= nums[mid]:\n            if nums[lo] <= target < nums[mid]:\n                hi = mid - 1\n            else:\n                lo = mid + 1\n        else:\n            if nums[mid] < target <= nums[hi]:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return -1',
      note: 'One half of a rotated array is always properly sorted — check which, decide if the target lives there, discard the other.',
    },
  ],
  'py-find-min-rotated': [
    {
      name: 'Just take min()',
      complexity: 'O(n) time, O(1) space',
      code: 'def find_min(nums):\n    return min(nums)',
      note: 'One honest line — and the interviewer will immediately ask for O(log n), which is the actual exercise.',
    },
    {
      name: 'Binary search toward the break',
      complexity: 'O(log n) time, O(1) space',
      code: 'def find_min(nums):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return nums[lo]',
      note: 'Compare mid to the right end: if mid is bigger, the drop (and the minimum) is to the right; otherwise it is at mid or left.',
    },
  ],
  'py-koko-bananas': [
    {
      name: 'Try every speed',
      complexity: 'O(n·m) time — m = largest pile, O(1) space',
      code: 'def min_eating_speed(piles, h):\n    speed = 1\n    while True:\n        hours = sum((p + speed - 1) // speed for p in piles)\n        if hours <= h:\n            return speed\n        speed += 1',
      note: 'Test speeds 1, 2, 3… until one fits. Correct, and it exposes the key insight: feasibility is monotonic in speed.',
    },
    {
      name: 'Binary search the answer',
      complexity: 'O(n log m) time — m = largest pile, O(1) space',
      code: 'def min_eating_speed(piles, h):\n    lo, hi = 1, max(piles)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        hours = sum((p + mid - 1) // mid for p in piles)\n        if hours <= h:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo',
      note: 'Once "does speed k work?" is monotonic, binary-search the answer space itself — a pattern worth naming out loud in interviews.',
    },
  ],
  'py-search-2d-matrix': [
    {
      name: 'Scan every cell',
      complexity: 'O(m·n) time, O(1) space',
      code: 'def search_matrix(matrix, target):\n    for row in matrix:\n        for val in row:\n            if val == target:\n                return True\n    return False',
      note: 'Ignores both sorted properties. Fine first sentence, then improve.',
    },
    {
      name: 'One binary search over the flat index',
      complexity: 'O(log(m·n)) time, O(1) space',
      code: 'def search_matrix(matrix, target):\n    rows, cols = len(matrix), len(matrix[0])\n    lo, hi = 0, rows * cols - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        val = matrix[mid // cols][mid % cols]\n        if val == target:\n            return True\n        if val < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return False',
      note: 'Row-major order makes the whole matrix one sorted array; divmod turns a flat index back into (row, col).',
    },
  ],

  // ── stack ────────────────────────────────────────────────────────────────
  'py-valid-parentheses': [
    {
      name: 'Delete pairs until stable',
      complexity: 'O(n²) time, O(n) space',
      code: 'def is_valid(s):\n    prev = None\n    while prev != s:\n        prev = s\n        s = s.replace("()", "").replace("[]", "").replace("{}", "")\n    return s == ""',
      note: 'Keep erasing innermost pairs; a valid string erases to nothing. Each pass copies the string — that is the n².',
    },
    {
      name: 'Stack',
      complexity: 'O(n) time, O(n) space',
      code: 'def is_valid(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack',
      note: 'A closer must match the MOST RECENT opener — "most recent" is the word that should make you say stack.',
    },
  ],
  'py-eval-rpn': [
    {
      name: 'Splice out one operation at a time',
      complexity: 'O(n²) time, O(n) space',
      code: 'def eval_rpn(tokens):\n    tokens = list(tokens)\n    ops = {"+", "-", "*", "/"}\n    while len(tokens) > 1:\n        i = next(k for k, t in enumerate(tokens) if t in ops)\n        a, b = int(tokens[i - 2]), int(tokens[i - 1])\n        if tokens[i] == "+":\n            r = a + b\n        elif tokens[i] == "-":\n            r = a - b\n        elif tokens[i] == "*":\n            r = a * b\n        else:\n            r = int(a / b)\n        tokens[i - 2 : i + 1] = [str(r)]\n    return int(tokens[0])',
      note: 'Find the first operator, apply it to the two numbers before it, splice the result back in. Works — each splice reshuffles the list.',
    },
    {
      name: 'Stack',
      complexity: 'O(n) time, O(n) space',
      code: 'def eval_rpn(tokens):\n    stack = []\n    for tok in tokens:\n        if tok in ("+", "-", "*", "/"):\n            b = stack.pop()\n            a = stack.pop()\n            if tok == "+":\n                stack.append(a + b)\n            elif tok == "-":\n                stack.append(a - b)\n            elif tok == "*":\n                stack.append(a * b)\n            else:\n                stack.append(int(a / b))\n        else:\n            stack.append(int(tok))\n    return stack[0]',
      note: 'RPN is literally a stack encoding: numbers push, operators pop two and push one. int(a / b) truncates toward zero — // would round the wrong way on negatives.',
    },
  ],
  'py-daily-temperatures': [
    {
      name: 'Scan forward per day',
      complexity: 'O(n²) time, O(1) extra space',
      code: 'def daily_temperatures(temps):\n    n = len(temps)\n    res = [0] * n\n    for i in range(n):\n        for j in range(i + 1, n):\n            if temps[j] > temps[i]:\n                res[i] = j - i\n                break\n    return res',
      note: 'For each day, walk forward until something warmer. A long cooling streak makes this quadratic.',
    },
    {
      name: 'Monotonic stack',
      complexity: 'O(n) time, O(n) space — monotonic stack',
      code: 'def daily_temperatures(temps):\n    res = [0] * len(temps)\n    stack = []\n    for i, t in enumerate(temps):\n        while stack and temps[stack[-1]] < t:\n            j = stack.pop()\n            res[j] = i - j\n        stack.append(i)\n    return res',
      note: 'Keep indices of days still waiting for warmth; each new day answers every colder day on the stack. Every index is pushed and popped once — O(n).',
    },
  ],
  'py-min-stack': [
    {
      name: 'Rescan for the min',
      complexity: 'O(n) per getMin, O(n) space',
      code: 'def min_stack(ops):\n    stack, out = [], []\n    for op in ops:\n        if op[0] == "push":\n            stack.append(op[1])\n        elif op[0] == "pop":\n            stack.pop()\n        elif op[0] == "top":\n            out.append(stack[-1])\n        else:\n            out.append(min(stack))\n    return out',
      note: 'min(stack) walks the whole stack every call — exactly what the O(1) requirement forbids.',
    },
    {
      name: 'Parallel min stack',
      complexity: 'O(1) per operation, O(n) space',
      code: 'def min_stack(ops):\n    stack, mins, out = [], [], []\n    for op in ops:\n        name = op[0]\n        if name == "push":\n            v = op[1]\n            stack.append(v)\n            mins.append(v if not mins else min(v, mins[-1]))\n        elif name == "pop":\n            stack.pop()\n            mins.pop()\n        elif name == "top":\n            out.append(stack[-1])\n        else:\n            out.append(mins[-1])\n    return out',
      note: 'Store "the min as of this depth" beside every element; pops keep both stacks in lockstep, so the answer is always sitting on top.',
    },
  ],
  'py-car-fleet': [
    {
      name: 'Compare each car to the fleet ahead',
      complexity: 'O(n log n) time, O(1) extra space',
      code: 'def car_fleet(target, position, speed):\n    cars = sorted(zip(position, speed), reverse=True)\n    fleets = 0\n    lead_time = 0.0\n    for pos, spd in cars:\n        time = (target - pos) / spd\n        if time > lead_time:\n            fleets += 1\n            lead_time = time\n    return fleets',
      note: 'Front car first: anyone who would arrive no later than the fleet ahead merges into it; a strictly later arrival starts a new fleet.',
    },
    {
      name: 'Stack of arrival times',
      complexity: 'O(n log n) time — the sort dominates, O(n) space',
      code: 'def car_fleet(target, position, speed):\n    cars = sorted(zip(position, speed), reverse=True)\n    stack = []\n    for pos, spd in cars:\n        time = (target - pos) / spd\n        if not stack or time > stack[-1]:\n            stack.append(time)\n    return len(stack)',
      note: 'Same idea with the fleets kept explicitly — the stack version generalises when follow-ups ask which cars ended up together.',
    },
  ],
  'py-largest-rectangle': [
    {
      name: 'Expand around each bar',
      complexity: 'O(n²) time, O(1) space',
      code: 'def largest_rectangle_area(heights):\n    best = 0\n    for i, h in enumerate(heights):\n        left = i\n        while left > 0 and heights[left - 1] >= h:\n            left -= 1\n        right = i\n        while right < len(heights) - 1 and heights[right + 1] >= h:\n            right += 1\n        best = max(best, h * (right - left + 1))\n    return best',
      note: 'Each bar is the height of some rectangle — push left and right as far as neighbours stay at least this tall.',
    },
    {
      name: 'Monotonic stack',
      complexity: 'O(n) time, O(n) space — monotonic stack',
      code: 'def largest_rectangle_area(heights):\n    stack = []\n    best = 0\n    for i, h in enumerate(heights + [0]):\n        start = i\n        while stack and stack[-1][1] > h:\n            idx, height = stack.pop()\n            best = max(best, height * (i - idx))\n            start = idx\n        stack.append((start, h))\n    return best',
      note: 'A bar shorter than the stack top settles every taller bar behind it — you learn each rectangle\'s right edge the moment it dies. The appended 0 flushes the stack.',
    },
  ],

  // ── backtracking ─────────────────────────────────────────────────────────
  'py-subsets': [
    {
      name: 'Iterative doubling',
      complexity: 'O(n · 2ⁿ) time and space',
      code: 'def subsets(nums):\n    res = [[]]\n    for n in sorted(nums):\n        res += [s + [n] for s in res]\n    return res',
      note: 'Each new element doubles the answer: every existing subset, with and without it. Three lines, no recursion.',
    },
    {
      name: 'Backtracking: include or exclude',
      complexity: 'O(n · 2ⁿ) time and space',
      code: 'def subsets(nums):\n    nums = sorted(nums)\n    res = []\n    path = []\n    def backtrack(i):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        backtrack(i + 1)\n        path.append(nums[i])\n        backtrack(i + 1)\n        path.pop()\n    backtrack(0)\n    return res',
      note: 'The decision tree made explicit: at each index, branch on skip vs take. This shape generalises to every constrained variant the doubling trick cannot handle.',
    },
  ],
  'py-subsets-ii': [
    {
      name: 'Enumerate all, dedupe with a set',
      complexity: 'O(n · 2ⁿ) time and space',
      code: 'def subsets_with_dup(nums):\n    nums = sorted(nums)\n    seen = set()\n    for mask in range(1 << len(nums)):\n        sub = tuple(nums[i] for i in range(len(nums)) if mask & (1 << i))\n        seen.add(sub)\n    return [list(s) for s in seen]',
      note: 'Generate every bitmask subset of the SORTED input and let a set eat the duplicates. Wasteful but obviously correct.',
    },
    {
      name: 'Sort + skip duplicate branches',
      complexity: 'O(n · 2ⁿ) time and space',
      code: 'def subsets_with_dup(nums):\n    nums = sorted(nums)\n    res = []\n    path = []\n    def bt(i):\n        res.append(path[:])\n        for j in range(i, len(nums)):\n            if j > i and nums[j] == nums[j - 1]:\n                continue\n            path.append(nums[j])\n            bt(j + 1)\n            path.pop()\n    bt(0)\n    return res',
      note: 'After sorting, a duplicate may only extend the branch where its twin was just used — the `j > i and nums[j] == nums[j-1]` skip prevents duplicates from ever being BUILT, not filtered after.',
    },
  ],
  'py-permutations': [
    {
      name: 'itertools.permutations',
      complexity: 'O(n · n!) time and space',
      code: 'def permutations(nums):\n    return [list(p) for p in itertools.permutations(sorted(nums))]',
      note: 'Know the library exists — and that the interviewer will immediately say "now do it yourself". (Note the module path: this function\'s own name shadows the bare `permutations` import.)',
    },
    {
      name: 'Backtracking on the remainder',
      complexity: 'O(n · n!) time and space',
      code: 'def permutations(nums):\n    res = []\n    def backtrack(path, remaining):\n        if not remaining:\n            res.append(path)\n            return\n        for i in range(len(remaining)):\n            backtrack(path + [remaining[i]], remaining[:i] + remaining[i + 1:])\n    backtrack([], sorted(nums))\n    return res',
      note: 'Pick each remaining element as the next slot and recurse on what is left. n choices, then n−1, then n−2 — that product IS n!.',
    },
  ],
  'py-combination-sum': [
    {
      name: 'DP: build the lists per amount',
      complexity: 'O(target · combos) time, O(target · combos) space',
      code: 'def combination_sum(candidates, target):\n    dp = [[] for _ in range(target + 1)]\n    dp[0] = [[]]\n    for c in sorted(candidates):\n        for t in range(c, target + 1):\n            for combo in dp[t - c]:\n                dp[t].append(combo + [c])\n    return dp[target]',
      note: 'Coin-change, but storing the actual combinations instead of counts. Iterating candidates in the outer loop keeps each combo in one canonical order — no duplicates to filter.',
    },
    {
      name: 'Backtracking with a start index',
      complexity: 'O(2^t) time — t grows with target, O(t) recursion depth',
      code: 'def combination_sum(candidates, target):\n    candidates = sorted(candidates)\n    res = []\n    def backtrack(start, path, remaining):\n        if remaining == 0:\n            res.append(path[:])\n            return\n        for i in range(start, len(candidates)):\n            c = candidates[i]\n            if c > remaining:\n                break\n            path.append(c)\n            backtrack(i, path, remaining - c)\n            path.pop()\n    backtrack(0, [], target)\n    return res',
      note: 'Reuse is allowed, so recurse with the SAME index i (not i+1); the start index stops [2,3] and [3,2] both appearing; sorted + break prunes dead branches early.',
    },
  ],
  'py-generate-parens': [
    {
      name: 'Generate everything, filter the valid',
      complexity: 'O(2²ⁿ · n) time, O(2²ⁿ) space',
      code: 'def generate_parenthesis(n):\n    def valid(s):\n        bal = 0\n        for ch in s:\n            bal += 1 if ch == "(" else -1\n            if bal < 0:\n                return False\n        return bal == 0\n    return [\n        "".join(p) for p in product("()", repeat=2 * n) if valid("".join(p))\n    ]',
      note: 'All 2²ⁿ strings, keep the balanced ones. The waste is the point: most strings die at their first character — which is exactly what the backtracking version never generates.',
    },
    {
      name: 'Backtrack on open/close counts',
      complexity: 'O(4ⁿ/√n) time — Catalan growth',
      code: 'def generate_parenthesis(n):\n    res = []\n    def bt(s, o, c):\n        if len(s) == 2 * n:\n            res.append(s)\n            return\n        if o < n:\n            bt(s + "(", o + 1, c)\n        if c < o:\n            bt(s + ")", o, c + 1)\n    bt("", 0, 0)\n    return res',
      note: 'Two rules — open while you can, close only below the open count — mean every path in the tree is a valid prefix. You only ever build answers.',
    },
  ],
  'py-word-search': [
    {
      name: 'Visited set on the path',
      complexity: 'O(m·n · 4^L) time, O(L) space',
      code: 'def exist(board, word):\n    rows, cols = len(board), len(board[0])\n    def dfs(r, c, i, used):\n        if i == len(word):\n            return True\n        if r < 0 or r >= rows or c < 0 or c >= cols:\n            return False\n        if (r, c) in used or board[r][c] != word[i]:\n            return False\n        used.add((r, c))\n        found = (\n            dfs(r + 1, c, i + 1, used)\n            or dfs(r - 1, c, i + 1, used)\n            or dfs(r, c + 1, i + 1, used)\n            or dfs(r, c - 1, i + 1, used)\n        )\n        used.discard((r, c))\n        return found\n    return any(dfs(r, c, 0, set()) for r in range(rows) for c in range(cols))',
      note: 'Track the current path in a set and un-add on the way back — the add/undo pair is the heart of every backtracking solution.',
    },
    {
      name: 'Mark the board in place',
      complexity: 'O(m·n · 4^L) time — L = word length, O(L) space',
      code: 'def exist(board, word):\n    rows, cols = len(board), len(board[0])\n    def dfs(r, c, i):\n        if i == len(word):\n            return True\n        if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[i]:\n            return False\n        tmp = board[r][c]\n        board[r][c] = "#"\n        found = dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1)\n        board[r][c] = tmp\n        return found\n    for r in range(rows):\n        for c in range(cols):\n            if dfs(r, c, 0):\n                return True\n    return False',
      note: 'The board itself becomes the visited set: stamp a sentinel, restore on backtrack. Same asymptotics, no extra structure — mention you are mutating the input.',
    },
  ],
  'py-palindrome-partition': [
    {
      name: 'Check each piece as you cut',
      complexity: 'O(n · 2ⁿ) time, O(n) space',
      code: 'def partition(s):\n    res = []\n    path = []\n    def is_pal(x):\n        return x == x[::-1]\n    def bt(start):\n        if start == len(s):\n            res.append(path[:])\n            return\n        for end in range(start + 1, len(s) + 1):\n            piece = s[start:end]\n            if is_pal(piece):\n                path.append(piece)\n                bt(end)\n                path.pop()\n    bt(0)\n    return res',
      note: 'Cut a palindromic prefix, recurse on the rest. Each piece is re-verified with a fresh reversal every time it is considered.',
    },
    {
      name: 'Precompute a palindrome table',
      complexity: 'O(n · 2ⁿ) time, O(n²) space — precomputed palindrome table',
      code: 'def partition(s):\n    n = len(s)\n    pal = [[False] * n for _ in range(n)]\n    for i in range(n - 1, -1, -1):\n        for j in range(i, n):\n            pal[i][j] = s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1])\n    res = []\n    path = []\n    def bt(start):\n        if start == len(s):\n            res.append(path[:])\n            return\n        for end in range(start, n):\n            if pal[start][end]:\n                path.append(s[start : end + 1])\n                bt(end + 1)\n                path.pop()\n    bt(0)\n    return res',
      note: 'pal[i][j] is true when the ends match and the inside was already a palindrome — an O(n²) table turns every is-palindrome check into a lookup.',
    },
  ],

  // ── graphs ───────────────────────────────────────────────────────────────
  'py-number-of-islands': [
    {
      name: 'BFS flood with a queue',
      complexity: 'O(m·n) time, O(min(m, n)) queue space',
      code: 'def num_islands(grid):\n    if not grid:\n        return 0\n    rows, cols = len(grid), len(grid[0])\n    seen = set()\n    def flood(sr, sc):\n        queue = deque([(sr, sc)])\n        seen.add((sr, sc))\n        while queue:\n            r, c = queue.popleft()\n            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and grid[nr][nc] == "1":\n                    seen.add((nr, nc))\n                    queue.append((nr, nc))\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == "1" and (r, c) not in seen:\n                count += 1\n                flood(r, c)\n    return count',
      note: 'Every unvisited land cell starts a new island; the flood claims everything connected. BFS keeps the recursion depth off the call stack.',
    },
    {
      name: 'Recursive DFS sink',
      complexity: 'O(m·n) time, O(m·n) space worst case',
      code: 'def num_islands(grid):\n    if not grid:\n        return 0\n    rows, cols = len(grid), len(grid[0])\n    seen = set()\n    def sink(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols:\n            return\n        if (r, c) in seen or grid[r][c] == "0":\n            return\n        seen.add((r, c))\n        sink(r + 1, c)\n        sink(r - 1, c)\n        sink(r, c + 1)\n        sink(r, c - 1)\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == "1" and (r, c) not in seen:\n                count += 1\n                sink(r, c)\n    return count',
      note: 'The four recursive calls read like the problem statement. On a giant all-land grid the recursion can hit Python\'s stack limit — say that trade-off out loud.',
    },
  ],
  'py-max-area-island': [
    {
      name: 'Iterative stack flood',
      complexity: 'O(m·n) time, O(m·n) space',
      code: 'def max_area_island(grid):\n    rows, cols = len(grid), len(grid[0])\n    seen = set()\n    best = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 1 and (r, c) not in seen:\n                stack = [(r, c)]\n                seen.add((r, c))\n                size = 0\n                while stack:\n                    cr, cc = stack.pop()\n                    size += 1\n                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                        nr, nc = cr + dr, cc + dc\n                        if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and grid[nr][nc] == 1:\n                            seen.add((nr, nc))\n                            stack.append((nr, nc))\n                best = max(best, size)\n    return best',
      note: 'A DFS with an explicit stack — same order of exploration, immune to recursion limits, and the counting is a plain loop variable.',
    },
    {
      name: 'Recursion that returns the area',
      complexity: 'O(m·n) time, O(m·n) space worst case',
      code: 'def max_area_island(grid):\n    rows, cols = len(grid), len(grid[0])\n    seen = set()\n    def area(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols:\n            return 0\n        if (r, c) in seen or grid[r][c] == 0:\n            return 0\n        seen.add((r, c))\n        return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1)\n    return max(\n        (area(r, c) for r in range(rows) for c in range(cols)),\n        default=0,\n    )',
      note: '"1 + the areas of my four neighbours" — the flood computes its own size on the way back up, no counter needed.',
    },
  ],
  'py-rotting-oranges': [
    {
      name: 'Sweep the grid minute by minute',
      complexity: 'O((m·n)²) time, O(m·n) space',
      code: 'def oranges_rotting(grid):\n    grid = [row[:] for row in grid]\n    rows, cols = len(grid), len(grid[0])\n    minutes = 0\n    while True:\n        to_rot = [\n            (r, c)\n            for r in range(rows)\n            for c in range(cols)\n            if grid[r][c] == 1\n            and any(\n                0 <= r + dr < rows and 0 <= c + dc < cols and grid[r + dr][c + dc] == 2\n                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))\n            )\n        ]\n        if not to_rot:\n            break\n        for r, c in to_rot:\n            grid[r][c] = 2\n        minutes += 1\n    if any(cell == 1 for row in grid for cell in row):\n        return -1\n    return minutes',
      note: 'Play the process forward: each minute, everything adjacent to rot rots. A full grid scan per minute is the cost of the literal simulation.',
    },
    {
      name: 'Multi-source BFS',
      complexity: 'O(m·n) time, O(m·n) space — BFS',
      code: 'def oranges_rotting(grid):\n    rows, cols = len(grid), len(grid[0])\n    q = deque()\n    fresh = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 2:\n                q.append((r, c, 0))\n            elif grid[r][c] == 1:\n                fresh += 1\n    rotted = set()\n    minutes = 0\n    while q:\n        r, c, m = q.popleft()\n        minutes = max(minutes, m)\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in rotted:\n                rotted.add((nr, nc))\n                fresh -= 1\n                q.append((nr, nc, m + 1))\n    return minutes if fresh == 0 else -1',
      note: 'Seed the queue with EVERY rotten orange at minute 0 — BFS from many sources at once computes each orange\'s rot time in one pass. "Simultaneous spread" is the multi-source cue.',
    },
  ],
  'py-course-schedule': [
    {
      name: "Kahn's: peel courses with no prerequisites",
      complexity: 'O(V + E) time, O(V + E) space',
      code: 'def can_finish(num_courses, prerequisites):\n    graph = {i: [] for i in range(num_courses)}\n    indeg = [0] * num_courses\n    for course, pre in prerequisites:\n        graph[pre].append(course)\n        indeg[course] += 1\n    queue = deque(i for i in range(num_courses) if indeg[i] == 0)\n    done = 0\n    while queue:\n        node = queue.popleft()\n        done += 1\n        for nxt in graph[node]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                queue.append(nxt)\n    return done == num_courses',
      note: 'Repeatedly take any course whose prerequisites are all done. If a cycle exists, its courses never reach indegree 0 and the count falls short.',
    },
    {
      name: 'DFS three-colour cycle detection',
      complexity: 'O(V + E) time, O(V + E) space',
      code: 'def can_finish(num_courses, prerequisites):\n    graph = {i: [] for i in range(num_courses)}\n    for course, pre in prerequisites:\n        graph[course].append(pre)\n    state = {}\n    def has_cycle(node):\n        if state.get(node) == 0:\n            return True\n        if state.get(node) == 1:\n            return False\n        state[node] = 0\n        for nxt in graph[node]:\n            if has_cycle(nxt):\n                return True\n        state[node] = 1\n        return False\n    return not any(has_cycle(i) for i in range(num_courses))',
      note: 'Three states per node: unvisited / in-progress (0) / done (1). Meeting an in-progress node again means you walked back into your own path — a cycle.',
    },
  ],
  'py-course-schedule-ii': [
    {
      name: 'Scan for the smallest ready course',
      complexity: 'O(V²) time, O(V + E) space',
      code: 'def find_order(num_courses, prerequisites):\n    graph = {i: [] for i in range(num_courses)}\n    indeg = [0] * num_courses\n    for course, pre in prerequisites:\n        graph[pre].append(course)\n        indeg[course] += 1\n    order = []\n    taken = [False] * num_courses\n    for _ in range(num_courses):\n        ready = [i for i in range(num_courses) if not taken[i] and indeg[i] == 0]\n        if not ready:\n            return []\n        node = min(ready)\n        taken[node] = True\n        order.append(node)\n        for nxt in graph[node]:\n            indeg[nxt] -= 1\n    return order',
      note: 'Each round, rescan everything for a course with no remaining prerequisites. V scans of V courses — the heap exists to kill this rescan.',
    },
    {
      name: "Kahn's with a min-heap",
      complexity: 'O(V + E) time, O(V + E) space',
      code: 'def find_order(num_courses, prerequisites):\n    graph = {i: [] for i in range(num_courses)}\n    indeg = [0] * num_courses\n    for course, pre in prerequisites:\n        graph[pre].append(course)\n        indeg[course] += 1\n    ready = [i for i in range(num_courses) if indeg[i] == 0]\n    heapq.heapify(ready)\n    order = []\n    while ready:\n        node = heapq.heappop(ready)\n        order.append(node)\n        for nxt in graph[node]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                heapq.heappush(ready, nxt)\n    return order if len(order) == num_courses else []',
      note: 'Same peeling, but ready courses wait in a heap (min-heap keeps the output deterministic; a plain deque is fine when any valid order is accepted). Short output = cycle = [].',
    },
  ],
  'py-count-components': [
    {
      name: 'DFS from every unvisited node',
      complexity: 'O(V + E) time, O(V + E) space',
      code: 'def count_components(n, edges):\n    graph = {i: [] for i in range(n)}\n    for a, b in edges:\n        graph[a].append(b)\n        graph[b].append(a)\n    seen = set()\n    def visit(node):\n        stack = [node]\n        while stack:\n            cur = stack.pop()\n            for nxt in graph[cur]:\n                if nxt not in seen:\n                    seen.add(nxt)\n                    stack.append(nxt)\n    count = 0\n    for i in range(n):\n        if i not in seen:\n            seen.add(i)\n            count += 1\n            visit(i)\n    return count',
      note: 'Every node that starts a fresh traversal is a new component. Build the adjacency list, flood, count the floods.',
    },
    {
      name: 'Union-Find',
      complexity: 'O(V + E) time, O(V + E) space',
      code: 'def count_components(n, edges):\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    count = n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n            count -= 1\n    return count',
      note: 'Start with n components; every edge that joins two different roots merges one away. No adjacency list, no traversal — union-find counts by subtraction.',
    },
  ],
  'py-pacific-atlantic': [
    {
      name: 'From every cell, try to reach both oceans',
      complexity: 'O((m·n)²) time, O(m·n) space',
      code: 'def pacific_atlantic(heights):\n    if not heights:\n        return []\n    rows, cols = len(heights), len(heights[0])\n    def reaches(sr, sc):\n        seen = {(sr, sc)}\n        stack = [(sr, sc)]\n        pac = atl = False\n        while stack:\n            r, c = stack.pop()\n            if r == 0 or c == 0:\n                pac = True\n            if r == rows - 1 or c == cols - 1:\n                atl = True\n            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and heights[nr][nc] <= heights[r][c]:\n                    seen.add((nr, nc))\n                    stack.append((nr, nc))\n        return pac and atl\n    return sorted([r, c] for r in range(rows) for c in range(cols) if reaches(r, c))',
      note: 'Simulate the water from each cell, flowing only downhill-or-level. Correct, and each cell repeats almost all of its neighbour\'s work.',
    },
    {
      name: 'Flood inward from both coasts',
      complexity: 'O(m·n) time, O(m·n) space',
      code: 'def pacific_atlantic(heights):\n    if not heights:\n        return []\n    rows, cols = len(heights), len(heights[0])\n    pac, atl = set(), set()\n    def dfs(r, c, seen, prev):\n        if r < 0 or r >= rows or c < 0 or c >= cols or (r, c) in seen or heights[r][c] < prev:\n            return\n        seen.add((r, c))\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            dfs(r + dr, c + dc, seen, heights[r][c])\n    for c in range(cols):\n        dfs(0, c, pac, heights[0][c])\n        dfs(rows - 1, c, atl, heights[rows - 1][c])\n    for r in range(rows):\n        dfs(r, 0, pac, heights[r][0])\n        dfs(r, cols - 1, atl, heights[r][cols - 1])\n    return sorted([r, c] for r, c in (pac & atl))',
      note: 'Reverse the flow: walk UPHILL from each ocean\'s shore, marking everything that could drain to it. Two floods and a set intersection replace mn simulations — inverting the direction of search is the transferable trick.',
    },
  ],

  // ── tries ────────────────────────────────────────────────────────────────
  'py-implement-trie': [
    {
      name: 'Word list + scans',
      complexity: 'O(W · L) per query — W stored words',
      code: 'def run_trie(ops):\n    words = []\n    out = []\n    for op in ops:\n        name, arg = op[0], op[1]\n        if name == "insert":\n            words.append(arg)\n        elif name == "search":\n            out.append(arg in words)\n        else:\n            out.append(any(w.startswith(arg) for w in words))\n    return out',
      note: 'A list and startswith answer everything — each query rescans every stored word. Fine for ten words; the trie exists for ten million.',
    },
    {
      name: 'Nested dicts',
      complexity: 'O(L) per operation — L = word length',
      code: 'def run_trie(ops):\n    root = {}\n    out = []\n    def walk(word):\n        node = root\n        for ch in word:\n            if ch not in node:\n                return None\n            node = node[ch]\n        return node\n    for op in ops:\n        name, arg = op[0], op[1]\n        if name == "insert":\n            node = root\n            for ch in arg:\n                node = node.setdefault(ch, {})\n            node["#"] = True\n        elif name == "search":\n            node = walk(arg)\n            out.append(node is not None and node.get("#", False))\n        else:\n            out.append(walk(arg) is not None)\n    return out',
      note: 'One dict per node, one level per character, "#" marks a complete word. Cost depends only on the word\'s length, never on how many words are stored — that independence is the whole point of tries.',
    },
  ],

  // ── bit manipulation ─────────────────────────────────────────────────────
  'py-single-number': [
    {
      name: 'Count occurrences',
      complexity: 'O(n) time, O(n) space',
      code: 'def single_number(nums):\n    counts = Counter(nums)\n    for n, c in counts.items():\n        if c == 1:\n            return n',
      note: 'Count everything, return the loner. Works — but the problem whispers "O(1) space" and this is not it.',
    },
    {
      name: 'XOR everything',
      complexity: 'O(n) time, O(1) space',
      code: 'def single_number(nums):\n    result = 0\n    for n in nums:\n        result ^= n\n    return result',
      note: 'x ^ x = 0 and x ^ 0 = x, so every pair annihilates itself and only the single survives. The most famous bit trick in interviews.',
    },
  ],
  'py-missing-number': [
    {
      name: 'Set lookup',
      complexity: 'O(n) time, O(n) space',
      code: 'def missing_number(nums):\n    have = set(nums)\n    for i in range(len(nums) + 1):\n        if i not in have:\n            return i',
      note: 'Check 0..n against a set of what you have. Simple, linear — and O(n) extra memory.',
    },
    {
      name: 'XOR indices against values',
      complexity: 'O(n) time, O(1) space',
      code: 'def missing_number(nums):\n    result = len(nums)\n    for i, v in enumerate(nums):\n        result ^= i ^ v\n    return result',
      note: 'XOR all indices 0..n with all values: everything present cancels, the missing number remains. (The Gauss sum n(n+1)/2 − sum works too.)',
    },
  ],
  'py-count-bits': [
    {
      name: 'Count each number separately',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def count_bits(n):\n    return [bin(i).count("1") for i in range(n + 1)]',
      note: 'One bin() and count per number — each costs the bit-length, hence the log factor.',
    },
    {
      name: 'DP on the shifted value',
      complexity: 'O(n) time, O(n) space',
      code: 'def count_bits(n):\n    ans = [0] * (n + 1)\n    for i in range(1, n + 1):\n        ans[i] = ans[i >> 1] + (i & 1)\n    return ans',
      note: 'i has exactly the bits of i>>1 plus its own last bit — an answer you already computed plus one AND. DP hiding inside a bits problem.',
    },
  ],
  'py-hamming-weight': [
    {
      name: 'Check all 32 positions',
      complexity: 'O(32) time, O(1) space',
      code: 'def hamming_weight(n):\n    count = 0\n    for i in range(32):\n        if n & (1 << i):\n            count += 1\n    return count',
      note: 'Probe every bit position with a mask. Fixed 32 iterations no matter the input.',
    },
    {
      name: 'Drop the lowest set bit',
      complexity: 'O(k) time — k set bits, O(1) space',
      code: 'def hamming_weight(n):\n    count = 0\n    while n:\n        n &= n - 1\n        count += 1\n    return count',
      note: 'n & (n−1) erases exactly the lowest 1-bit, so the loop runs once per set bit — Kernighan\'s trick, and a favourite follow-up.',
    },
  ],
  'py-reverse-bits': [
    {
      name: 'String reversal',
      complexity: 'O(32) time, O(32) space',
      code: 'def reverse_bits(n):\n    return int(f"{n:032b}"[::-1], 2)',
      note: 'Format to a 32-char binary string, flip it, parse it back. Pythonic and honest — just not the bit-level answer they are probing for.',
    },
    {
      name: 'Shift out, shift in',
      complexity: 'O(32) ≈ O(1) time, O(1) space',
      code: 'def reverse_bits(n):\n    result = 0\n    for _ in range(32):\n        result = (result << 1) | (n & 1)\n        n >>= 1\n    return result',
      note: 'Pull the lowest bit off n and push it onto the result, 32 times — a conveyor belt reversing the order.',
    },
  ],
  'py-sum-two-integers': [
    {
      name: 'Full adder, bit by bit',
      complexity: 'O(32) time, O(1) space',
      code: 'def get_sum(a, b):\n    result = 0\n    carry = 0\n    for i in range(32):\n        x = (a >> i) & 1\n        y = (b >> i) & 1\n        s = x ^ y ^ carry\n        carry = (x & y) | (x & carry) | (y & carry)\n        result |= s << i\n    return result if result <= 0x7FFFFFFF else ~(result ^ 0xFFFFFFFF)',
      note: 'Hardware addition in slow motion: per bit, sum = x^y^carry and a new carry from any two ones. This is literally the circuit.',
    },
    {
      name: 'XOR + shifted carry until it clears',
      complexity: 'O(32) ≈ O(1) time, O(1) space',
      code: 'def get_sum(a, b):\n    mask = 0xFFFFFFFF\n    while b & mask:\n        a, b = (a ^ b) & mask, ((a & b) << 1) & mask\n    a &= mask\n    return a if a <= 0x7FFFFFFF else ~(a ^ mask)',
      note: 'XOR is addition without carries; AND<<1 is the carries alone. Repeat until the carries die out. The mask fakes 32-bit overflow because Python ints never overflow on their own.',
    },
  ],

  // ── math & geometry ──────────────────────────────────────────────────────
  'py-rotate-image': [
    {
      name: 'Build a rotated copy',
      complexity: 'O(n²) time, O(n²) space',
      code: 'def rotate(matrix):\n    n = len(matrix)\n    rotated = [[matrix[n - 1 - c][r] for c in range(n)] for r in range(n)]\n    for r in range(n):\n        matrix[r] = rotated[r]\n    return matrix',
      note: 'Row r of the result is column r of the original, read bottom-up. Easy to write — but the problem says in place.',
    },
    {
      name: 'Transpose, then reverse each row',
      complexity: 'O(n²) time, O(1) space — in place',
      code: 'def rotate(matrix):\n    n = len(matrix)\n    for i in range(n):\n        for j in range(i + 1, n):\n            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]\n    for row in matrix:\n        row.reverse()\n    return matrix',
      note: 'A 90° rotation decomposes into two mirror flips, both trivially in place. Decomposing transforms beats juggling four-way index gymnastics.',
    },
  ],
  'py-spiral-matrix': [
    {
      name: 'Peel the top row, rotate the rest',
      complexity: 'O((m·n)²) time worst case — repeated copies, O(m·n) space',
      code: 'def spiral_order(matrix):\n    out = []\n    grid = [list(row) for row in matrix]\n    while grid:\n        out.extend(grid.pop(0))\n        grid = [list(row) for row in zip(*grid)][::-1]\n    return out',
      note: 'Take the top row, rotate what is left counter-clockwise, repeat. Three lines of pure Python elegance — each rotation copies the whole remaining grid.',
    },
    {
      name: 'Walk the four boundaries',
      complexity: 'O(m·n) time, O(1) extra space',
      code: 'def spiral_order(matrix):\n    if not matrix:\n        return []\n    res = []\n    top, bottom = 0, len(matrix) - 1\n    left, right = 0, len(matrix[0]) - 1\n    while top <= bottom and left <= right:\n        for c in range(left, right + 1):\n            res.append(matrix[top][c])\n        top += 1\n        for r in range(top, bottom + 1):\n            res.append(matrix[r][right])\n        right -= 1\n        if top <= bottom:\n            for c in range(right, left - 1, -1):\n                res.append(matrix[bottom][c])\n            bottom -= 1\n        if left <= right:\n            for r in range(bottom, top - 1, -1):\n                res.append(matrix[r][left])\n            left += 1\n    return res',
      note: 'Four shrinking boundary indices; the two if-guards stop single rows/columns being read twice. Boring, linear, correct — the interview answer.',
    },
  ],
  'py-happy-number': [
    {
      name: 'Remember what you have seen',
      complexity: 'O(log n) per step, O(log n) space for seen',
      code: 'def is_happy(n):\n    def sq(x):\n        return sum(int(d) ** 2 for d in str(x))\n    seen = set()\n    while n != 1 and n not in seen:\n        seen.add(n)\n        n = sq(n)\n    return n == 1',
      note: 'Unhappy numbers loop forever — a seen-set catches the cycle the first time it repeats.',
    },
    {
      name: 'Floyd slow/fast pointers',
      complexity: 'O(log n) per step, O(1) space — Floyd cycle detection',
      code: 'def is_happy(n):\n    def sq(x):\n        return sum(int(d) ** 2 for d in str(x))\n    slow = n\n    fast = sq(n)\n    while fast != 1 and slow != fast:\n        slow = sq(slow)\n        fast = sq(sq(fast))\n    return fast == 1',
      note: 'The sequence is a hidden linked list, so cycle detection works without memory: the tortoise and hare meet inside any loop. Same trick as Linked List Cycle.',
    },
  ],
  'py-plus-one': [
    {
      name: 'Convert to int and back',
      complexity: 'O(n) time, O(n) space',
      code: 'def plus_one(digits):\n    n = int("".join(map(str, digits))) + 1\n    return [int(d) for d in str(n)]',
      note: 'Only legal because Python ints are unbounded — say so out loud, because the digit-array framing exists to forbid exactly this in other languages.',
    },
    {
      name: 'Carry walk from the right',
      complexity: 'O(n) time, O(1) extra space',
      code: 'def plus_one(digits):\n    digits = digits[:]\n    for i in range(len(digits) - 1, -1, -1):\n        if digits[i] < 9:\n            digits[i] += 1\n            return digits\n        digits[i] = 0\n    return [1] + digits',
      note: 'A non-9 digit absorbs the carry and you are done; 9s roll to 0 and pass it on. All-nines falls out the bottom and grows the number.',
    },
  ],
  'py-pow': [
    {
      name: 'Multiply n times',
      complexity: 'O(n) time, O(1) space',
      code: 'def my_pow(x, n):\n    if n < 0:\n        x = 1 / x\n        n = -n\n    result = 1.0\n    for _ in range(n):\n        result *= x\n    return result',
      note: 'The definition, verbatim. For n in the billions this is the answer that fails the follow-up.',
    },
    {
      name: 'Square-and-multiply',
      complexity: 'O(log n) time, O(1) space — fast exponentiation',
      code: 'def my_pow(x, n):\n    if n < 0:\n        x = 1 / x\n        n = -n\n    result = 1.0\n    while n:\n        if n & 1:\n            result *= x\n        x *= x\n        n >>= 1\n    return result',
      note: 'Read n in binary: square x for every bit, multiply it in when the bit is 1. x¹⁰ costs four squarings instead of ten multiplies.',
    },
  ],
  'py-rotate-array': [
    {
      name: 'Rotate one step, k times',
      complexity: 'O(n·k) time, O(1) extra space',
      code: 'def rotate_array(nums, k):\n    nums = list(nums)\n    for _ in range(k % len(nums) if nums else 0):\n        nums.insert(0, nums.pop())\n    return nums',
      note: 'Pop the tail onto the front, k times. Every insert(0, …) shifts the whole list — k full shuffles.',
    },
    {
      name: 'Slice at the split point',
      complexity: 'O(n) time, O(n) space — slicing copies',
      code: 'def rotate_array(nums, k):\n    n = len(nums)\n    if n == 0:\n        return nums\n    k %= n\n    return nums[-k:] + nums[:-k] if k else nums[:]',
      note: 'The rotated array is just the last k elements followed by the rest. (The O(1)-space in-place version is the triple-reverse trick — worth knowing by name.)',
    },
  ],

  // ── sliding window ───────────────────────────────────────────────────────
  'py-char-replacement': [
    {
      name: 'Check every substring',
      complexity: 'O(n²) time, O(26) space',
      code: 'def character_replacement(s, k):\n    best = 0\n    for i in range(len(s)):\n        counts = {}\n        maxf = 0\n        for j in range(i, len(s)):\n            counts[s[j]] = counts.get(s[j], 0) + 1\n            maxf = max(maxf, counts[s[j]])\n            if (j - i + 1) - maxf <= k:\n                best = max(best, j - i + 1)\n    return best',
      note: 'A substring works if (length − most frequent letter) ≤ k. Testing every start makes that condition visible before you optimise it.',
    },
    {
      name: 'Sliding window',
      complexity: 'O(n) time, O(26) space',
      code: 'def character_replacement(s, k):\n    counts = {}\n    start = 0\n    best = 0\n    maxf = 0\n    for i, ch in enumerate(s):\n        counts[ch] = counts.get(ch, 0) + 1\n        maxf = max(maxf, counts[ch])\n        while (i - start + 1) - maxf > k:\n            counts[s[start]] -= 1\n            start += 1\n        best = max(best, i - start + 1)\n    return best',
      note: 'Grow the right edge; shrink the left only when the window breaks the ≤ k rule. maxf never needs to decrease — a stale value only makes the window too cautious, never wrong.',
    },
  ],
  'py-permutation-in-string': [
    {
      name: 'Sort every window',
      complexity: 'O(n · k log k) time, O(k) space',
      code: 'def check_inclusion(s1, s2):\n    key = sorted(s1)\n    k = len(s1)\n    for i in range(len(s2) - k + 1):\n        if sorted(s2[i : i + k]) == key:\n            return True\n    return False',
      note: 'A permutation sorts to the same string — so sort each window and compare. Correct, but re-sorts overlapping windows from scratch.',
    },
    {
      name: 'Rolling counts',
      complexity: 'O(n) time, O(26) space',
      code: 'def check_inclusion(s1, s2):\n    if len(s1) > len(s2):\n        return False\n    need = Counter(s1)\n    window = Counter(s2[: len(s1)])\n    if window == need:\n        return True\n    for i in range(len(s1), len(s2)):\n        window[s2[i]] += 1\n        left = s2[i - len(s1)]\n        window[left] -= 1\n        if window[left] == 0:\n            del window[left]\n        if window == need:\n            return True\n    return False',
      note: 'Slide the window one character at a time: +1 for the letter entering, −1 for the one leaving. Counts equal ⇒ permutation found.',
    },
  ],
  'py-min-window-substring': [
    {
      name: 'Expand from every start',
      complexity: 'O(n²) time, O(m) space',
      code: 'def min_window(s, t):\n    if not t or not s:\n        return ""\n    best = ""\n    for i in range(len(s)):\n        need = Counter(t)\n        missing = len(t)\n        for j in range(i, len(s)):\n            if need[s[j]] > 0:\n                missing -= 1\n            need[s[j]] -= 1\n            if missing == 0:\n                if not best or j - i + 1 < len(best):\n                    best = s[i : j + 1]\n                break\n    return best',
      note: 'From each start, extend until every needed letter is covered. Each start rebuilds the tally — that repetition is what the real window removes.',
    },
    {
      name: 'Shrinking window with a missing counter',
      complexity: 'O(n + m) time, O(m) space',
      code: 'def min_window(s, t):\n    if not t or not s:\n        return ""\n    need = Counter(t)\n    missing = len(t)\n    best = ""\n    lo = 0\n    for hi, ch in enumerate(s):\n        if need[ch] > 0:\n            missing -= 1\n        need[ch] -= 1\n        while missing == 0:\n            if not best or hi - lo + 1 < len(best):\n                best = s[lo : hi + 1]\n            need[s[lo]] += 1\n            if need[s[lo]] > 0:\n                missing += 1\n            lo += 1\n    return best',
      note: 'One `missing` integer stands in for comparing whole Counters. When it hits zero, shrink from the left until the window breaks — every character enters and leaves at most once.',
    },
  ],
  'py-sliding-window-max': [
    {
      name: 'Max of every window',
      complexity: 'O(n·k) time, O(1) extra space',
      code: 'def max_sliding_window(nums, k):\n    return [max(nums[i : i + k]) for i in range(len(nums) - k + 1)]',
      note: 'One line, honest, and rescans k elements per window — the interviewer will ask what happens when k is huge.',
    },
    {
      name: 'Monotonic deque',
      complexity: 'O(n) time, O(k) space — monotonic deque',
      code: 'def max_sliding_window(nums, k):\n    dq = deque()\n    res = []\n    for i, n in enumerate(nums):\n        while dq and nums[dq[-1]] < n:\n            dq.pop()\n        dq.append(i)\n        if dq[0] <= i - k:\n            dq.popleft()\n        if i >= k - 1:\n            res.append(nums[dq[0]])\n    return res',
      note: 'Keep indices whose values are decreasing: a new element evicts everything smaller (they can never be a max again), the front expires when it leaves the window. Front = current max, always.',
    },
  ],

  // ── heap ─────────────────────────────────────────────────────────────────
  'py-kth-largest': [
    {
      name: 'Sort and index',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def find_kth_largest(nums, k):\n    return sorted(nums, reverse=True)[k - 1]',
      note: 'Sorting answers a harder question than asked — you only need ONE position, not total order.',
    },
    {
      name: 'Heap capped at k',
      complexity: 'O(n log k) time, O(k) space',
      code: 'def find_kth_largest(nums, k):\n    heap = []\n    for n in nums:\n        heapq.heappush(heap, n)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]',
      note: 'A min-heap of size k holds the k largest seen so far; its root is exactly the k-th largest. log k beats log n whenever k is small.',
    },
  ],
  'py-last-stone-weight': [
    {
      name: 'Re-sort every round',
      complexity: 'O(n² log n) time, O(n) space',
      code: 'def last_stone_weight(stones):\n    stones = list(stones)\n    while len(stones) > 1:\n        stones.sort()\n        a = stones.pop()\n        b = stones.pop()\n        if a != b:\n            stones.append(a - b)\n    return stones[0] if stones else 0',
      note: 'Sort, smash the top two, repeat. Each round pays a full sort just to find two elements.',
    },
    {
      name: 'Max-heap via negation',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def last_stone_weight(stones):\n    heap = [-s for s in stones]\n    heapq.heapify(heap)\n    while len(heap) > 1:\n        a = -heapq.heappop(heap)\n        b = -heapq.heappop(heap)\n        if a != b:\n            heapq.heappush(heap, -(a - b))\n    return -heap[0] if heap else 0',
      note: '"Repeatedly take the largest" is the heap use-case sentence. Python only ships a min-heap — store negatives, the classic workaround.',
    },
  ],
  'py-task-scheduler': [
    {
      name: 'Simulate with a heap + cooldown queue',
      complexity: 'O(n log 26) time, O(26) space',
      code: 'def least_interval(tasks, n):\n    counts = Counter(tasks)\n    heap = [-c for c in counts.values()]\n    heapq.heapify(heap)\n    time = 0\n    cooling = deque()\n    while heap or cooling:\n        time += 1\n        if heap:\n            c = heapq.heappop(heap) + 1\n            if c:\n                cooling.append((time + n, c))\n        if cooling and cooling[0][0] == time:\n            heapq.heappush(heap, cooling[0][1])\n            cooling.popleft()\n    return time',
      note: 'Tick a clock: run the most-frequent available task, park it in a cooldown queue for n ticks. Simulation always works — and shows what the formula shortcuts.',
    },
    {
      name: 'Count the idle slots directly',
      complexity: 'O(n) time, O(26) space — counting, no simulation',
      code: 'def least_interval(tasks, n):\n    counts = Counter(tasks)\n    max_count = max(counts.values())\n    max_tasks = sum(1 for v in counts.values() if v == max_count)\n    return max(len(tasks), (max_count - 1) * (n + 1) + max_tasks)',
      note: 'The busiest task forces a frame of (max_count−1) blocks of size n+1, plus one slot per tied task. Everything else fills the gaps — unless there are so many tasks the schedule is simply len(tasks).',
    },
  ],

  // ── greedy ───────────────────────────────────────────────────────────────
  'py-jump-game': [
    {
      name: 'DP reachability',
      complexity: 'O(n²) time, O(n) space',
      code: 'def can_jump(nums):\n    n = len(nums)\n    reach = [False] * n\n    reach[0] = True\n    for i in range(n):\n        if reach[i]:\n            for j in range(i + 1, min(n, i + nums[i] + 1)):\n                reach[j] = True\n    return reach[n - 1]',
      note: 'Mark everything reachable from every reachable index. Works, but re-marks the same cells over and over.',
    },
    {
      name: 'Greedy furthest reach',
      complexity: 'O(n) time, O(1) space',
      code: 'def can_jump(nums):\n    furthest = 0\n    for i, n in enumerate(nums):\n        if i > furthest:\n            return False\n        furthest = max(furthest, i + n)\n    return True',
      note: 'Only one number matters: the furthest index reachable so far. Fall behind it and you are stranded; keep it ≥ i and everything before it is reachable too.',
    },
  ],
  'py-jump-game-ii': [
    {
      name: 'BFS over indices',
      complexity: 'O(n²) time, O(n) space',
      code: 'def jump(nums):\n    n = len(nums)\n    dist = [None] * n\n    dist[0] = 0\n    queue = deque([0])\n    while queue:\n        i = queue.popleft()\n        if i == n - 1:\n            return dist[i]\n        for j in range(i + 1, min(n, i + nums[i] + 1)):\n            if dist[j] is None:\n                dist[j] = dist[i] + 1\n                queue.append(j)\n    return dist[n - 1]',
      note: 'Fewest jumps = shortest path, and shortest path says BFS. Naming that mapping out loud scores points even before you optimise.',
    },
    {
      name: 'Greedy level windows',
      complexity: 'O(n) time, O(1) space',
      code: 'def jump(nums):\n    jumps = 0\n    cur_end = 0\n    farthest = 0\n    for i in range(len(nums) - 1):\n        farthest = max(farthest, i + nums[i])\n        if i == cur_end:\n            jumps += 1\n            cur_end = farthest\n    return jumps',
      note: 'This IS the BFS, compressed: [cur_end..farthest] is the next BFS level, and crossing cur_end means one more jump. Same levels, two variables.',
    },
  ],
  'py-gas-station': [
    {
      name: 'Try every start',
      complexity: 'O(n²) time, O(1) space',
      code: 'def can_complete_circuit(gas, cost):\n    n = len(gas)\n    for start in range(n):\n        tank = 0\n        for step in range(n):\n            i = (start + step) % n\n            tank += gas[i] - cost[i]\n            if tank < 0:\n                break\n        else:\n            return start\n    return -1',
      note: 'Simulate the loop from each station. The for/else is doing real work here: else runs only if the lap never went negative.',
    },
    {
      name: 'One pass with restart',
      complexity: 'O(n) time, O(1) space',
      code: 'def can_complete_circuit(gas, cost):\n    if sum(gas) < sum(cost):\n        return -1\n    tank = 0\n    start = 0\n    for i in range(len(gas)):\n        tank += gas[i] - cost[i]\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return start',
      note: 'If you run dry at i, no station between your start and i can work either (they would arrive with even less). So restart at i+1 — and total gas ≥ total cost guarantees the survivor is valid.',
    },
  ],
  'py-hand-of-straights': [
    {
      name: 'Repeatedly pull the minimum',
      complexity: 'O(n²) time, O(n) space',
      code: 'def is_n_straight_hand(hand, group_size):\n    if len(hand) % group_size != 0:\n        return False\n    counts = Counter(hand)\n    while counts:\n        start = min(counts)\n        for x in range(start, start + group_size):\n            if counts[x] <= 0:\n                return False\n            counts[x] -= 1\n            if counts[x] == 0:\n                del counts[x]\n    return True',
      note: 'The smallest remaining card MUST start a straight — nothing else can absorb it. min() over the dict every round is the cost.',
    },
    {
      name: 'Sort the keys once',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def is_n_straight_hand(hand, group_size):\n    if len(hand) % group_size != 0:\n        return False\n    counts = Counter(hand)\n    for card in sorted(counts):\n        need = counts[card]\n        if need > 0:\n            for x in range(card, card + group_size):\n                if counts[x] < need:\n                    return False\n                counts[x] -= need\n    return True',
      note: 'Same greedy, but one sort replaces all the min() scans — and taking `need` copies at once batches identical straights.',
    },
  ],

  // ── intervals ────────────────────────────────────────────────────────────
  'py-merge-intervals': [
    {
      name: 'Merge pairs until stable',
      complexity: 'O(n²) time, O(n) space',
      code: 'def merge_intervals(intervals):\n    items = [list(iv) for iv in intervals]\n    changed = True\n    while changed:\n        changed = False\n        out = []\n        for iv in items:\n            for m in out:\n                if iv[0] <= m[1] and m[0] <= iv[1]:\n                    m[0] = min(m[0], iv[0])\n                    m[1] = max(m[1], iv[1])\n                    changed = True\n                    break\n            else:\n                out.append(iv)\n        items = out\n    return sorted(items)',
      note: 'Keep folding overlapping pairs together until nothing changes. It terminates and it is correct — and it screams for a sort.',
    },
    {
      name: 'Sort, then sweep',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def merge_intervals(intervals):\n    intervals = sorted(intervals, key=lambda x: x[0])\n    merged = [intervals[0][:]]\n    for start, end in intervals[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged',
      note: 'Sorted by start, an interval can only overlap the LAST merged one — extend it or start fresh. Sort-then-sweep is the intervals category in one sentence.',
    },
  ],
  'py-meeting-rooms': [
    {
      name: 'Compare every pair',
      complexity: 'O(n²) time, O(1) space',
      code: 'def can_attend_all(intervals):\n    for i in range(len(intervals)):\n        for j in range(i + 1, len(intervals)):\n            a, b = intervals[i], intervals[j]\n            if a[0] < b[1] and b[0] < a[1]:\n                return False\n    return True',
      note: 'Two meetings clash if each starts before the other ends. Checking all pairs works — n² comparisons for what sorting exposes adjacently.',
    },
    {
      name: 'Sort, check neighbours',
      complexity: 'O(n log n) time, O(1) space',
      code: 'def can_attend_all(intervals):\n    intervals = sorted(intervals, key=lambda x: x[0])\n    for i in range(1, len(intervals)):\n        if intervals[i][0] < intervals[i - 1][1]:\n            return False\n    return True',
      note: 'After sorting by start, any clash must be between neighbours — one linear scan settles it.',
    },
  ],
  'py-insert-interval': [
    {
      name: 'Append, then re-merge everything',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def insert_interval(intervals, new_interval):\n    items = sorted([list(iv) for iv in intervals] + [list(new_interval)])\n    merged = [items[0]]\n    for start, end in items[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged',
      note: 'Reduce to the problem you already solved: drop the new interval in and run merge-intervals. Honest, and it wastes the fact the list was ALREADY sorted.',
    },
    {
      name: 'Three linear phases',
      complexity: 'O(n) time, O(n) space',
      code: 'def insert_interval(intervals, new_interval):\n    res = []\n    i = 0\n    n = len(intervals)\n    while i < n and intervals[i][1] < new_interval[0]:\n        res.append(intervals[i])\n        i += 1\n    start, end = new_interval\n    while i < n and intervals[i][0] <= end:\n        start = min(start, intervals[i][0])\n        end = max(end, intervals[i][1])\n        i += 1\n    res.append([start, end])\n    while i < n:\n        res.append(intervals[i])\n        i += 1\n    return res',
      note: 'Copy everything strictly before, absorb everything that touches, copy the rest. Sorted input means one pass, no sort.',
    },
  ],
  'py-non-overlapping': [
    {
      name: 'DP: max compatible set',
      complexity: 'O(n²) time, O(n) space',
      code: 'def erase_overlap_intervals(intervals):\n    if not intervals:\n        return 0\n    items = sorted(intervals, key=lambda x: x[1])\n    n = len(items)\n    dp = [1] * n\n    for i in range(n):\n        for j in range(i):\n            if items[j][1] <= items[i][0]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return n - max(dp)',
      note: 'Fewest removals = n − the largest non-overlapping set, found LIS-style. Correct — and the O(n²) hints the greedy exists.',
    },
    {
      name: 'Greedy by earliest end',
      complexity: 'O(n log n) time, O(1) space',
      code: 'def erase_overlap_intervals(intervals):\n    intervals = sorted(intervals, key=lambda x: x[1])\n    removed = 0\n    prev_end = float("-inf")\n    for start, end in intervals:\n        if start >= prev_end:\n            prev_end = end\n        else:\n            removed += 1\n    return removed',
      note: 'Always keep the interval that ends first — it leaves the most room for everything after. The classic exchange-argument greedy.',
    },
  ],
  'py-min-meeting-rooms': [
    {
      name: 'Count overlaps at each start',
      complexity: 'O(n²) time, O(1) space',
      code: 'def min_meeting_rooms(intervals):\n    best = 0\n    for a in intervals:\n        rooms = 0\n        for b in intervals:\n            if b[0] <= a[0] < b[1]:\n                rooms += 1\n        best = max(best, rooms)\n    return best',
      note: 'Peak occupancy happens at some meeting start — count how many meetings are live at each one.',
    },
    {
      name: 'Two sorted sweeps',
      complexity: 'O(n log n) time, O(n) space',
      code: 'def min_meeting_rooms(intervals):\n    if not intervals:\n        return 0\n    starts = sorted(i[0] for i in intervals)\n    ends = sorted(i[1] for i in intervals)\n    rooms = 0\n    best = 0\n    e = 0\n    for s in starts:\n        if s < ends[e]:\n            rooms += 1\n            best = max(best, rooms)\n        else:\n            e += 1\n    return best',
      note: 'Sort starts and ends separately and walk them together: a start before the next end needs a new room; otherwise one just freed up. You never need to know WHICH meeting — only the counts.',
    },
  ],

  // ── dynamic programming: memoized recursion -> the tight loop ────────────
  'py-climbing-stairs': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n) time, O(n) space — memo + recursion stack',
      code: 'def climb_stairs(n):\n    @cache\n    def ways(k):\n        if k <= 1:\n            return 1\n        return ways(k - 1) + ways(k - 2)\n    return ways(n)',
      note: 'Write the recurrence you would say out loud — ways(n) = ways(n−1) + ways(n−2) — and let @cache kill the exponential blowup. This is step one of every DP.',
    },
    {
      name: 'Two rolling values',
      complexity: 'O(n) time, O(1) space',
      code: 'def climb_stairs(n):\n    a, b = 1, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a',
      note: 'The recursion only ever looks two steps back, so two variables replace the whole cache. It is Fibonacci wearing a costume.',
    },
  ],
  'py-house-robber': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n) time, O(n) space',
      code: 'def rob(nums):\n    @cache\n    def best(i):\n        if i >= len(nums):\n            return 0\n        return max(nums[i] + best(i + 2), best(i + 1))\n    return best(0)',
      note: 'At each house: rob it and skip a neighbour, or walk past. The max of those two choices IS the recurrence.',
    },
    {
      name: 'Rolling pair',
      complexity: 'O(n) time, O(1) space',
      code: 'def rob(nums):\n    prev, prev2 = 0, 0\n    for n in nums:\n        prev, prev2 = max(prev, prev2 + n), prev\n    return prev',
      note: 'Only best-so-far and best-two-back matter; the tuple assignment advances both in one line.',
    },
  ],
  'py-house-robber-ii': [
    {
      name: 'Memoized recursion on the circle',
      complexity: 'O(n) time, O(n) space',
      code: 'def rob2(nums):\n    n = len(nums)\n    if n == 1:\n        return nums[0]\n    @cache\n    def best(i, took_first):\n        if i >= n:\n            return 0\n        take = 0 if (i == n - 1 and took_first) else nums[i] + best(i + 2, took_first or i == 0)\n        skip = best(i + 1, took_first)\n        return max(take, skip)\n    return best(0, False)',
      note: 'Carry one bit of state — "did I rob house 0?" — so the last house knows whether it is allowed. State-in-the-recursion is a move worth practising.',
    },
    {
      name: 'Run House Robber twice',
      complexity: 'O(n) time, O(1) space',
      code: 'def rob2(nums):\n    if len(nums) == 1:\n        return nums[0]\n    def rob_line(vals):\n        prev, prev2 = 0, 0\n        for v in vals:\n            prev, prev2 = max(prev, prev2 + v), prev\n        return prev\n    return max(rob_line(nums[1:]), rob_line(nums[:-1]))',
      note: 'The circle only forbids taking BOTH ends — so solve the line without the first house, the line without the last, and take the better. Reduce to a solved problem.',
    },
  ],
  'py-coin-change': [
    {
      name: 'Memoized recursion',
      complexity: 'O(amount · coins) time, O(amount) space',
      code: 'def coin_change(coins, amount):\n    @cache\n    def best(rem):\n        if rem == 0:\n            return 0\n        if rem < 0:\n            return inf\n        return min((1 + best(rem - c) for c in coins), default=inf)\n    ans = best(amount)\n    return -1 if ans == inf else ans',
      note: 'Fewest coins for rem = 1 + fewest for (rem − some coin). Greedy fails here ([1,3,4] for 6) — that failure is why this is DP.',
    },
    {
      name: 'Bottom-up table',
      complexity: 'O(amount · coins) time, O(amount) space',
      code: 'def coin_change(coins, amount):\n    best = [0] + [float("inf")] * amount\n    for a in range(1, amount + 1):\n        for coin in coins:\n            if coin <= a:\n                best[a] = min(best[a], 1 + best[a - coin])\n    return best[amount] if best[amount] != float("inf") else -1',
      note: 'Same recurrence, filled smallest-amount-first so every lookup is already computed. No recursion limit, no cache magic.',
    },
  ],
  'py-longest-increasing-subseq': [
    {
      name: 'DP over pairs',
      complexity: 'O(n²) time, O(n) space — DP over pairs',
      code: 'def length_of_lis(nums):\n    if not nums:\n        return 0\n    dp = [1] * len(nums)\n    for i in range(len(nums)):\n        for j in range(i):\n            if nums[j] < nums[i]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp)',
      note: 'dp[i] = longest subsequence ending at i: check every earlier smaller element. Clean, quadratic, and the version to write first.',
    },
    {
      name: 'Patience piles + bisect',
      complexity: 'O(n log n) time — patience piles, O(n) space',
      code: 'def length_of_lis(nums):\n    piles = []\n    for n in nums:\n        i = bisect.bisect_left(piles, n)\n        if i == len(piles):\n            piles.append(n)\n        else:\n            piles[i] = n\n    return len(piles)',
      note: 'piles[i] holds the smallest possible tail of an increasing run of length i+1 — each number replaces the first tail ≥ it. The pile count is the answer; the follow-up interviewers save for strong candidates.',
    },
  ],
  'py-unique-paths': [
    {
      name: 'Memoized recursion',
      complexity: 'O(m·n) time, O(m·n) space',
      code: 'def unique_paths(m, n):\n    @cache\n    def ways(r, c):\n        if r == 0 or c == 0:\n            return 1\n        return ways(r - 1, c) + ways(r, c - 1)\n    return ways(m - 1, n - 1)',
      note: 'Paths to a cell = paths from above + paths from the left; the edges have exactly one way in.',
    },
    {
      name: 'One rolling row',
      complexity: 'O(m·n) time, O(n) space — one rolling row',
      code: 'def unique_paths(m, n):\n    row = [1] * n\n    for _ in range(m - 1):\n        for c in range(1, n):\n            row[c] += row[c - 1]\n    return row[n - 1]',
      note: 'Each row only reads the row above — overwrite in place and the grid collapses to one array.',
    },
  ],
  'py-longest-common-subseq': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n·m) time, O(n·m) space',
      code: 'def lcs(a, b):\n    @cache\n    def go(i, j):\n        if i == len(a) or j == len(b):\n            return 0\n        if a[i] == b[j]:\n            return 1 + go(i + 1, j + 1)\n        return max(go(i + 1, j), go(i, j + 1))\n    return go(0, 0)',
      note: 'Match → both pointers advance; mismatch → try skipping either side. Three lines of logic is the whole problem.',
    },
    {
      name: 'Bottom-up table',
      complexity: 'O(n·m) time, O(n·m) space',
      code: 'def lcs(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = 1 + dp[i - 1][j - 1]\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[m][n]',
      note: 'The 2D-string-DP template — edit distance, distinct subsequences and friends are this same table with a different cell rule.',
    },
  ],
  'py-longest-palindrome-substr': [
    {
      name: 'Check every substring',
      complexity: 'O(n³) time, O(n) space',
      code: 'def longest_palindrome(s):\n    best = ""\n    for i in range(len(s)):\n        for j in range(i, len(s)):\n            sub = s[i : j + 1]\n            if len(sub) > len(best) and sub == sub[::-1]:\n                best = sub\n    return best',
      note: 'n² substrings, each reversed to check — honest, cubic, and the baseline to beat.',
    },
    {
      name: 'Expand around centers',
      complexity: 'O(n²) time, O(1) space — expand around centers',
      code: 'def longest_palindrome(s):\n    if not s:\n        return ""\n    start, end = 0, 0\n    def expand(l, r):\n        while l >= 0 and r < len(s) and s[l] == s[r]:\n            l -= 1\n            r += 1\n        return l + 1, r - 1\n    for i in range(len(s)):\n        for lo, hi in (expand(i, i), expand(i, i + 1)):\n            if hi - lo > end - start:\n                start, end = lo, hi\n    return s[start : end + 1]',
      note: 'Every palindrome has a center — 2n−1 of them (letters and gaps). Growing outward from each checks all palindromes without re-checking any.',
    },
  ],
  'py-count-palindromic-substrings': [
    {
      name: 'Check every substring',
      complexity: 'O(n³) time, O(n) space',
      code: 'def count_substrings(s):\n    total = 0\n    for i in range(len(s)):\n        for j in range(i, len(s)):\n            sub = s[i : j + 1]\n            if sub == sub[::-1]:\n                total += 1\n    return total',
      note: 'Same shape as the longest-palindrome brute force — count instead of keep.',
    },
    {
      name: 'Expand around centers',
      complexity: 'O(n²) time, O(1) space',
      code: 'def count_substrings(s):\n    total = 0\n    def expand(l, r):\n        cnt = 0\n        while l >= 0 and r < len(s) and s[l] == s[r]:\n            cnt += 1\n            l -= 1\n            r += 1\n        return cnt\n    for i in range(len(s)):\n        total += expand(i, i) + expand(i, i + 1)\n    return total',
      note: 'Each successful expansion step IS one palindrome — count as you grow.',
    },
  ],
  'py-decode-ways': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n) time, O(n) space',
      code: 'def num_decodings(s):\n    @cache\n    def ways(i):\n        if i == len(s):\n            return 1\n        if s[i] == "0":\n            return 0\n        total = ways(i + 1)\n        if i + 1 < len(s) and 10 <= int(s[i : i + 2]) <= 26:\n            total += ways(i + 2)\n        return total\n    return ways(0)',
      note: 'Take one digit (if not "0") or two (if 10–26). The zeros are the whole difficulty — the recursion states the rules plainly.',
    },
    {
      name: 'Two rolling values',
      complexity: 'O(n) time, O(1) space — two rolling values',
      code: 'def num_decodings(s):\n    if not s:\n        return 0\n    prev2, prev1 = 1, (0 if s[0] == "0" else 1)\n    for i in range(1, len(s)):\n        cur = 0\n        if s[i] != "0":\n            cur += prev1\n        two = int(s[i - 1 : i + 1])\n        if 10 <= two <= 26:\n            cur += prev2\n        prev2, prev1 = prev1, cur\n    return prev1',
      note: 'Climbing-stairs with entry rules: each position sums the one-step and two-step ways in, gated by validity.',
    },
  ],
  'py-word-break': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n²) time, O(n) space',
      code: 'def word_break(s, word_dict):\n    words = set(word_dict)\n    @cache\n    def can(i):\n        if i == len(s):\n            return True\n        return any(s[i:j] in words and can(j) for j in range(i + 1, len(s) + 1))\n    return can(0)',
      note: 'Can I break the rest? Try every prefix that is a word. Without @cache the "aaaa…b" adversarial input is exponential.',
    },
    {
      name: 'Bottom-up table',
      complexity: 'O(n²) time, O(n) space',
      code: 'def word_break(s, word_dict):\n    words = set(word_dict)\n    dp = [False] * (len(s) + 1)\n    dp[0] = True\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in words:\n                dp[i] = True\n                break\n    return dp[len(s)]',
      note: 'dp[i] = "the first i characters break cleanly". Each position looks back for a True followed by a dictionary word.',
    },
  ],
  'py-can-partition': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n · target) time, O(n · target) space',
      code: 'def can_partition(nums):\n    total = sum(nums)\n    if total % 2 == 1:\n        return False\n    target = total // 2\n    @cache\n    def can(i, rem):\n        if rem == 0:\n            return True\n        if i == len(nums) or rem < 0:\n            return False\n        return can(i + 1, rem - nums[i]) or can(i + 1, rem)\n    return can(0, target)',
      note: 'Subset-sum in disguise: hit total/2 by taking or skipping each number. Take-or-skip over an index + budget is THE knapsack shape.',
    },
    {
      name: 'Reachable-sums set',
      complexity: 'O(n · target) time, O(target) space',
      code: 'def can_partition(nums):\n    total = sum(nums)\n    if total % 2 == 1:\n        return False\n    target = total // 2\n    reachable = {0}\n    for n in nums:\n        reachable |= {r + n for r in reachable if r + n <= target}\n    return target in reachable',
      note: 'Keep the set of sums you can build; each number doubles the candidates (capped at target). A set comprehension replaces the whole DP table.',
    },
  ],
  'py-min-path-sum': [
    {
      name: 'Memoized recursion',
      complexity: 'O(m·n) time, O(m·n) space',
      code: 'def min_path_sum(grid):\n    rows, cols = len(grid), len(grid[0])\n    @cache\n    def best(r, c):\n        if r == 0 and c == 0:\n            return grid[0][0]\n        if r < 0 or c < 0:\n            return inf\n        return grid[r][c] + min(best(r - 1, c), best(r, c - 1))\n    return best(rows - 1, cols - 1)',
      note: 'Cheapest way into a cell = its cost + the cheaper of the two ways in. Out-of-bounds returns infinity so edges handle themselves.',
    },
    {
      name: 'One rolling row',
      complexity: 'O(m·n) time, O(n) space — one rolling row',
      code: 'def min_path_sum(grid):\n    rows, cols = len(grid), len(grid[0])\n    dp = [0] * cols\n    for r in range(rows):\n        for c in range(cols):\n            if r == 0 and c == 0:\n                dp[c] = grid[r][c]\n            elif r == 0:\n                dp[c] = dp[c - 1] + grid[r][c]\n            elif c == 0:\n                dp[c] = dp[c] + grid[r][c]\n            else:\n                dp[c] = min(dp[c], dp[c - 1]) + grid[r][c]\n    return dp[cols - 1]',
      note: 'dp[c] still holds the row above when you read it, and the row you are building to its left — the standard grid-DP compression.',
    },
  ],
  'py-edit-distance': [
    {
      name: 'Memoized recursion',
      complexity: 'O(n·m) time, O(n·m) space',
      code: 'def min_distance(a, b):\n    @cache\n    def go(i, j):\n        if i == len(a):\n            return len(b) - j\n        if j == len(b):\n            return len(a) - i\n        if a[i] == b[j]:\n            return go(i + 1, j + 1)\n        return 1 + min(go(i + 1, j), go(i, j + 1), go(i + 1, j + 1))\n    return go(0, 0)',
      note: 'Match → free; otherwise 1 + the best of delete / insert / replace. The three recursive calls ARE the three edit operations.',
    },
    {
      name: 'Bottom-up table',
      complexity: 'O(n·m) time, O(n·m) space — full table',
      code: 'def min_distance(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n    return dp[m][n]',
      note: 'The first row/column say "turning nothing into a prefix costs its length" — get those bases right and the fill is mechanical.',
    },
  ],
  'py-max-product-subarray': [
    {
      name: 'Try every subarray',
      complexity: 'O(n²) time, O(1) space',
      code: 'def max_product(nums):\n    best = nums[0]\n    for i in range(len(nums)):\n        prod = 1\n        for j in range(i, len(nums)):\n            prod *= nums[j]\n            best = max(best, prod)\n    return best',
      note: 'Extend the product from each start — quadratic but honest, and it shows why negatives make running-max alone insufficient.',
    },
    {
      name: 'Track max AND min',
      complexity: 'O(n) time, O(1) space',
      code: 'def max_product(nums):\n    best = nums[0]\n    cur_max = cur_min = nums[0]\n    for n in nums[1:]:\n        cands = (n, cur_max * n, cur_min * n)\n        cur_max = max(cands)\n        cur_min = min(cands)\n        best = max(best, cur_max)\n    return best',
      note: 'A huge negative times a negative becomes the new maximum — so carry the running minimum too. One extra variable fixes the whole sign problem.',
    },
  ],

  // ── two pointers ─────────────────────────────────────────────────────────
  'py-valid-palindrome': [
    {
      name: 'Clean and compare',
      complexity: 'O(n) time, O(n) space',
      code: 'def is_palindrome(s):\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]',
      note: 'Filter to alphanumerics, compare with the reversal. Simple, but it copies the string twice.',
    },
    {
      name: 'Two pointers in place',
      complexity: 'O(n) time, O(1) space',
      code: 'def is_palindrome(s):\n    l, r = 0, len(s) - 1\n    while l < r:\n        while l < r and not s[l].isalnum():\n            l += 1\n        while l < r and not s[r].isalnum():\n            r -= 1\n        if s[l].lower() != s[r].lower():\n            return False\n        l += 1\n        r -= 1\n    return True',
      note: 'Walk in from both ends, skipping junk as you go — no extra copy, and the follow-up every interviewer asks for.',
    },
  ],
  'py-two-sum-sorted': [
    {
      name: 'Hash map (ignores the sort)',
      complexity: 'O(n) time, O(n) space',
      code: 'def two_sum_sorted(numbers, target):\n    seen = {}\n    for i, n in enumerate(numbers):\n        if target - n in seen:\n            return [seen[target - n] + 1, i + 1]\n        seen[n] = i',
      note: 'Plain Two Sum works — but it never uses the fact the array is sorted, and the problem demands O(1) space.',
    },
    {
      name: 'Two pointers',
      complexity: 'O(n) time, O(1) space',
      code: 'def two_sum_sorted(numbers, target):\n    lo, hi = 0, len(numbers) - 1\n    while lo < hi:\n        s = numbers[lo] + numbers[hi]\n        if s == target:\n            return [lo + 1, hi + 1]\n        if s < target:\n            lo += 1\n        else:\n            hi -= 1',
      note: 'Sorted order makes the sum steerable: too small → move the left pointer up, too big → move the right one down.',
    },
  ],
  'py-trapping-rain': [
    {
      name: 'Scan both ways per bar',
      complexity: 'O(n²) time, O(1) space',
      code: 'def trap(height):\n    total = 0\n    for i in range(len(height)):\n        left = max(height[: i + 1])\n        right = max(height[i:])\n        total += min(left, right) - height[i]\n    return total',
      note: 'Water above a bar = min(tallest-left, tallest-right) − bar. Computing both maxes fresh for every bar is the honest brute force.',
    },
    {
      name: 'Prefix/suffix max arrays',
      complexity: 'O(n) time, O(n) space',
      code: 'def trap(height):\n    if not height:\n        return 0\n    n = len(height)\n    left = [0] * n\n    right = [0] * n\n    left[0] = height[0]\n    for i in range(1, n):\n        left[i] = max(left[i - 1], height[i])\n    right[n - 1] = height[n - 1]\n    for i in range(n - 2, -1, -1):\n        right[i] = max(right[i + 1], height[i])\n    return sum(min(left[i], right[i]) - height[i] for i in range(n))',
      note: 'Precompute the running maxes once each way — the classic time-for-space trade.',
    },
    {
      name: 'Two pointers',
      complexity: 'O(n) time, O(1) space — two pointers',
      code: 'def trap(height):\n    if not height:\n        return 0\n    l, r = 0, len(height) - 1\n    left_max, right_max = height[l], height[r]\n    total = 0\n    while l < r:\n        if left_max < right_max:\n            l += 1\n            left_max = max(left_max, height[l])\n            total += left_max - height[l]\n        else:\n            r -= 1\n            right_max = max(right_max, height[r])\n            total += right_max - height[r]\n    return total',
      note: 'The smaller running max is the binding constraint, so you can settle that side immediately — both arrays collapse into two variables.',
    },
  ],
};
