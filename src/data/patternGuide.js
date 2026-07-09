// The interview "templates you must know" reference. For each algorithm
// pattern: how to recognise it, the reusable code skeleton, and its typical
// complexity. Keyed by roadmap category so the Patterns page can link straight
// to the problems that drill each one. Templates are illustrative skeletons
// (they parse as valid Python) — the point is the shape, not a runnable copy.

export const PATTERN_GUIDE = [
  {
    key: 'arrays-hashing',
    name: 'Hashing',
    when: 'You need fast "have I seen this?" or "how many of these?" lookups.',
    cues: ['find a pair / complement', 'count occurrences', 'detect duplicates', 'dedupe'],
    complexity: 'O(n) time, O(n) space',
    template: `seen = {}                       # value -> index (use a set for pure membership)
for i, x in enumerate(nums):
    if target - x in seen:      # ask: have I already seen what I need?
        return [seen[target - x], i]
    seen[x] = i`,
  },
  {
    key: 'two-pointers',
    name: 'Two pointers',
    when: 'The array is sorted (or can be) and the answer depends on both ends at once.',
    cues: ['sorted input', 'find a pair summing to target', 'palindrome check', 'in-place partition'],
    complexity: 'O(n) time, O(1) space',
    template: `l, r = 0, len(arr) - 1
while l < r:
    s = arr[l] + arr[r]
    if s == target:
        return [l, r]
    elif s < target:
        l += 1                  # need a bigger sum
    else:
        r -= 1                  # need a smaller sum`,
  },
  {
    key: 'sliding-window',
    name: 'Sliding window',
    when: 'You want the best contiguous run — longest/shortest/max-sum subarray or substring.',
    cues: ['"longest/shortest substring"', 'contiguous subarray', 'at most K of something'],
    complexity: 'O(n) time, O(k) space',
    template: `left = 0
window = {}
best = 0
for right, x in enumerate(s):
    window[x] = window.get(x, 0) + 1
    while is_invalid(window):   # shrink from the left until valid again
        window[s[left]] -= 1
        left += 1
    best = max(best, right - left + 1)
return best`,
  },
  {
    key: 'stack',
    name: 'Stack',
    when: 'You keep needing the most recent unmatched item — brackets, next-greater, nesting.',
    cues: ['matching pairs', '"next greater/smaller element"', 'evaluate expression', 'undo/backtrack order'],
    complexity: 'O(n) time, O(n) space',
    template: `stack = []
for x in items:
    while stack and resolves(stack[-1], x):
        top = stack.pop()
        # the current x closes/answers top — handle it here
    stack.append(x)
return stack`,
  },
  {
    key: 'binary-search',
    name: 'Binary search',
    when: 'The data is sorted, or you are hunting a threshold in a monotonic answer space.',
    cues: ['sorted array', '"minimum/maximum value that works"', 'rotated sorted array'],
    complexity: 'O(log n) time, O(1) space',
    template: `lo, hi = 0, len(nums) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target:
        return mid
    if nums[mid] < target:
        lo = mid + 1            # answer is to the right
    else:
        hi = mid - 1            # answer is to the left
return -1`,
  },
  {
    key: 'linked-list',
    name: 'Linked list',
    when: 'You are re-linking nodes or detecting structure in a chain.',
    cues: ['reverse a list', 'merge lists', 'find middle / cycle', 'remove nth node'],
    complexity: 'O(n) time, O(1) space',
    template: `dummy = ListNode(0)
dummy.next = head
prev, cur = dummy, head
while cur:
    nxt = cur.next
    # relink here, e.g. reverse: cur.next = prev
    prev, cur = cur, nxt
return dummy.next
# slow/fast: slow moves 1, fast moves 2 -> finds middle or a cycle`,
  },
  {
    key: 'trees',
    name: 'Trees (DFS / BFS)',
    when: 'The input is a tree and the answer depends on children or depth.',
    cues: ['depth / height', 'path sums', 'subtree properties', 'level-order (use BFS)'],
    complexity: 'O(n) time, O(h) space (h = height)',
    template: `def dfs(node):
    if not node:
        return 0                # base case
    left = dfs(node.left)
    right = dfs(node.right)
    return combine(node.val, left, right)

# level-order:
from collections import deque
q = deque([root])
while q:
    node = q.popleft()
    for child in (node.left, node.right):
        if child:
            q.append(child)`,
  },
  {
    key: 'tries',
    name: 'Trie (prefix tree)',
    when: 'You match many strings that share prefixes.',
    cues: ['autocomplete', '"starts with"', 'word dictionary', 'prefix counting'],
    complexity: 'O(L) per word (L = word length)',
    template: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

def insert(root, word):
    node = root
    for ch in word:
        node = node.children.setdefault(ch, TrieNode())
    node.end = True`,
  },
  {
    key: 'heap',
    name: 'Heap / priority queue',
    when: 'You repeatedly need the smallest or largest of a changing set — "top K", "k-th".',
    cues: ['"top K frequent"', 'k-th largest/smallest', 'merge k lists', 'running median'],
    complexity: 'O(n log k) time, O(k) space',
    template: `import heapq
heap = []                       # min-heap
for x in nums:
    heapq.heappush(heap, x)
    if len(heap) > k:           # keep only the k largest
        heapq.heappop(heap)
return heap[0]                  # the k-th largest`,
  },
  {
    key: 'backtracking',
    name: 'Backtracking',
    when: 'You must enumerate combinations / permutations / subsets, pruning dead ends.',
    cues: ['"all combinations/permutations/subsets"', 'N-Queens', 'word search', 'partitioning'],
    complexity: 'O(branch^depth) — exponential, pruned',
    template: `result = []
def backtrack(start, path):
    if is_complete(path):
        result.append(path[:])  # copy — path keeps mutating
        return
    for i in range(start, len(choices)):
        path.append(choices[i])
        backtrack(i + 1, path)
        path.pop()              # UNDO the choice, then try the next
backtrack(0, [])
return result`,
  },
  {
    key: 'graphs',
    name: 'Graphs (DFS / BFS)',
    when: 'Things are connected — a grid, nodes and edges, reachability, shortest path.',
    cues: ['grid islands', 'connected components', '"shortest path" (use BFS)', 'cycle detection'],
    complexity: 'O(V + E) time',
    template: `seen = set()
def dfs(r, c):
    if not in_bounds(r, c) or (r, c) in seen or blocked(r, c):
        return
    seen.add((r, c))
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        dfs(r + dr, c + dc)
# BFS with a deque gives shortest paths on unweighted graphs`,
  },
  {
    key: 'dp',
    name: 'Dynamic programming',
    when: 'The answer builds on answers to smaller subproblems, and those overlap.',
    cues: ['"number of ways"', 'min/max cost', '"can you reach"', 'subsequence problems'],
    complexity: 'O(states × work per state)',
    template: `dp = [base] * (n + 1)            # dp[i] = the answer for size i
dp[0] = ...                     # seed the base case(s)
for i in range(1, n + 1):
    dp[i] = best_of(dp[i - 1], dp[i - 2], ...)   # the recurrence
return dp[n]
# tip: if dp[i] only needs the last few, keep variables instead of a list`,
  },
  {
    key: 'greedy',
    name: 'Greedy',
    when: 'A locally best choice at each step seems to reach the global best.',
    cues: ['"maximum/minimum number of ..."', 'scheduling', 'jump game', 'assign resources'],
    complexity: 'O(n log n) (usually a sort + a pass)',
    template: `items.sort(key=...)             # order so the greedy pick comes first
result = 0
reach = 0
for x in items:
    if can_take(x, reach):
        result += 1
        reach = update(reach, x)
return result`,
  },
  {
    key: 'intervals',
    name: 'Intervals',
    when: 'You merge, overlap, or schedule ranges.',
    cues: ['"merge intervals"', 'meeting rooms', 'overlapping ranges', 'insert interval'],
    complexity: 'O(n log n) time',
    template: `intervals.sort(key=lambda iv: iv[0])     # by start
merged = [intervals[0]]
for start, end in intervals[1:]:
    if start <= merged[-1][1]:           # overlaps the last merged one
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])
return merged`,
  },
  {
    key: 'bits',
    name: 'Bit manipulation',
    when: 'The problem smells binary — XOR, counting set bits, powers of two.',
    cues: ['"single number"', 'count 1-bits', 'power of two', 'subsets via bitmask'],
    complexity: 'O(n) time, O(1) space',
    template: `# XOR cancels equal pairs, so the lone element survives:
x = 0
for n in nums:
    x ^= n
return x

# n & (n - 1) clears the lowest set bit — loop it to count bits:
count = 0
while n:
    n &= n - 1
    count += 1`,
  },
];
