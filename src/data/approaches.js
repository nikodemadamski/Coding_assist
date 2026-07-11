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
