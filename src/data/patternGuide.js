// The interview "templates you must know" reference. For each pattern: how to
// recognise it, the reusable code skeleton, and its typical complexity.
// Algorithm cards are keyed by roadmap category; pandas/SQL cards carry
// `track` and a `patterns` list of raw question patterns instead. Templates
// are illustrative skeletons (python/pandas ones parse as valid Python) — the
// point is the shape, not a runnable copy.
import { categoryKeyOf } from './roadmap.js';

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
  {
    key: 'math-geometry',
    name: 'Math & in-place grids',
    when: 'The trick is a numeric property, or moving values around a matrix in place.',
    cues: ['rotate / spiral a matrix', 'digit carry (plus one)', 'in-place with O(1) space', 'fast exponentiation'],
    complexity: 'O(n) or O(n²) for a grid, O(1) extra space',
    template: `# Rotate an n x n matrix 90° clockwise in place: transpose, then reverse rows
n = len(matrix)
for r in range(n):
    for c in range(r + 1, n):
        matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
for row in matrix:
    row.reverse()
# the general move: find the index formula, then shuffle values in place`,
  },

  // ---- pandas track ----------------------------------------------------
  // Data-track cards carry `track` and a `patterns` list of the raw question
  // pattern keys they teach (the whole track shares one roadmap category, so
  // the category key can't identify a card).
  {
    key: 'pd-select-filter',
    track: 'pandas',
    name: 'Select & filter',
    when: 'You want a subset of rows or columns — the boolean mask is the whole game.',
    cues: ['"rows where …"', 'combine conditions', 'pick these columns', 'isin / between / str.startswith'],
    complexity: 'O(n) — one vectorized pass',
    patterns: ['selection', 'filtering'],
    template: `out = df[df['bounty'] > 500]              # mask: a boolean Series aligned to rows
out = df[(df['a'] > 1) & (df['b'] == 'x')]  # AND/OR are & and | — parenthesize!
out = df[df['role'].isin(wanted)]         # membership; ~mask negates
out = df[['name', 'bounty']]              # double brackets -> DataFrame of columns
out = out.reset_index(drop=True)          # tidy row labels after filtering`,
  },
  {
    key: 'pd-sort-rank',
    track: 'pandas',
    name: 'Sort & top-N',
    when: 'The answer is "the best K rows" or a required display order.',
    cues: ['top / bottom N', 'sort by two keys', 'largest per …', 'rank with ties'],
    complexity: 'O(n log n) — the sort dominates',
    patterns: ['sorting'],
    template: `out = df.sort_values('bounty', ascending=False)      # one key, biggest first
out = df.sort_values(['role', 'bounty'],              # two keys,
                     ascending=[True, False])         # each with its own direction
top = df.nlargest(3, 'bounty')                        # faster than sort+head for top-N
df['pos'] = df['bounty'].rank(method='dense', ascending=False)  # ties share, no gaps`,
  },
  {
    key: 'pd-transform',
    track: 'pandas',
    name: 'Computed columns & reshaping',
    when: 'You derive new columns from old ones, or the table is the wrong shape (wide vs long).',
    cues: ['add a derived column', 'bin numbers into labels', 'wide -> long (melt)', 'rolling / cumulative'],
    complexity: 'O(n) vectorized; O(n log n) when a sort is involved',
    patterns: ['transform'],
    template: `df['total'] = df['price'] * df['qty']            # arithmetic is column-at-a-time
df['tier'] = pd.cut(df['bounty'], bins=bins, labels=labels)  # number -> bucket
long = df.melt(id_vars='name',                   # wide -> long: columns become rows
               var_name='stat', value_name='value')
df['avg3'] = df['gold'].rolling(3, min_periods=1).mean()     # sort first — windows
df['so_far'] = df['gold'].cumsum()                           # follow ROW order`,
  },
  {
    key: 'pd-groupby',
    track: 'pandas',
    name: 'Group & aggregate',
    when: 'A per-category number — or a per-row value that depends on the row’s whole group.',
    cues: ['"per role / per crew"', 'count / mean by group', 'running total within group', 'group total on every row'],
    complexity: 'O(n) to group; O(n log n) with sorting',
    patterns: ['groupby'],
    template: `per = df.groupby('role')['bounty'].mean()        # aggregate: one row PER GROUP
per = df.groupby('role').agg(total=('bounty', 'sum'))        # named columns
df['grp_sum'] = df.groupby('role')['bounty'].transform('sum')  # transform: keeps
df['so_far'] = df.groupby('role')['gold'].cumsum()             # every row (window-like)
grid = df.pivot_table(index='month', columns='region',       # groupby + unstack
                      values='gold', aggfunc='sum', fill_value=0)`,
  },
  {
    key: 'pd-join-missing',
    track: 'pandas',
    name: 'Merge & missing data',
    when: 'Two tables must line up — and the holes (NaN) that joins or raw data create need a policy.',
    cues: ['combine two DataFrames', 'keep everyone from the left', 'fill or drop NaN', 'latest row per key'],
    complexity: 'O(n + m) with hash join',
    patterns: ['merge', 'missing-data'],
    template: `out = df.merge(ships, on='name')                 # inner: matches only
out = df.merge(ships, on='name', how='left')     # left: keep every df row (NaN holes)
out['ship'] = out['ship'].fillna('none')         # patch the manufactured NaNs
out = out.dropna(subset=['bounty'])              # or drop rows missing a key field
latest = df.sort_values('day').drop_duplicates('name', keep='last')  # 1 row per key`,
  },

  // ---- SQL track --------------------------------------------------------
  {
    key: 'sql-query-shape',
    track: 'sql',
    name: 'Query shape',
    when: 'Plain reading: filter rows, order them deterministically, cut to N.',
    cues: ['"first / top N rows"', 'WHERE conditions', 'deduplicate', 'sort by two keys'],
    complexity: 'O(n log n) — the sort dominates',
    patterns: ['select-where', 'order-limit'],
    template: `SELECT DISTINCT sea, island     -- DISTINCT dedupes the whole row tuple
FROM sightings
WHERE sea = 'east'              -- filter BEFORE sort and cut
  AND island IS NOT NULL        -- NULL never equals anything: use IS (NOT) NULL
ORDER BY sea, island            -- multi-key = lexicographic; always order before
LIMIT 4;                        -- LIMIT, or "top N" is nondeterministic`,
  },
  {
    key: 'sql-aggregation',
    track: 'sql',
    name: 'GROUP BY & conditional aggregation',
    when: 'One number per category — or several category counts pivoted onto one row.',
    cues: ['count / sum per group', 'filter on an aggregate (HAVING)', 'wins AND losses in one row', 'rates from raw rows'],
    complexity: 'O(n) scan + O(g log g) for g groups',
    patterns: ['group-by', 'having'],
    template: `SELECT dojo,
       COUNT(*)                                        AS duels,
       SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,   -- CASE inside the
       AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0 END) AS rate  -- aggregate = pivot
FROM duels
GROUP BY dojo
HAVING COUNT(*) >= 2;   -- WHERE filters rows; HAVING filters finished groups`,
  },
  {
    key: 'sql-joins',
    track: 'sql',
    name: 'Joins',
    when: 'The answer needs columns from two tables — or two rows of the same table.',
    cues: ['combine two tables', '"everyone, even without …" (LEFT)', 'employee -> manager (self-join)', 'default for no match'],
    complexity: 'O(n + m) with a hash/index join',
    patterns: ['join'],
    template: `SELECT c.name, COALESCE(b.amount, 0) AS bounty  -- patch the NULLs a LEFT
FROM crew c                                     -- JOIN manufactures
LEFT JOIN bounties b ON b.crew_id = c.id;       -- LEFT keeps every crew row

SELECT s.name AS student, m.name AS mentor      -- self-join: alias the table
FROM members s                                  -- twice, join rows to rows
JOIN members m ON s.mentor_id = m.id;`,
  },
  {
    key: 'sql-anti-join',
    track: 'sql',
    name: 'Subqueries & anti-joins',
    when: 'Rows of A with NO match in B — or a filter that depends on another query’s answer.',
    cues: ['"never …" / "without any …"', 'above the overall average', 'NOT EXISTS vs NOT IN', 'correlated condition'],
    complexity: 'O(n + m) with a hash/index; O(n·m) naive',
    patterns: ['subquery'],
    template: `SELECT name FROM islands i
WHERE NOT EXISTS (                    -- anti-join: NULL-safe, reads as the question
  SELECT 1 FROM visits v
  WHERE v.island_id = i.id            -- correlated: inner query sees the outer row
);
-- trap: NOT IN (subquery) returns ZERO rows if the subquery yields a NULL
SELECT name FROM crew
WHERE bounty > (SELECT AVG(bounty) FROM crew);  -- scalar subquery as a threshold`,
  },
  {
    key: 'sql-window',
    track: 'sql',
    name: 'Window functions',
    when: 'Every row needs a value computed from its group — rank, running total, neighbour, share.',
    cues: ['top N per group', 'running / cumulative total', 'compare to previous row (LAG)', 'percent of total'],
    complexity: 'O(n log n) — partition sort, then one pass',
    patterns: ['window-functions'],
    template: `SELECT crew, day, gold,
  ROW_NUMBER() OVER (PARTITION BY crew ORDER BY gold DESC) AS rn,  -- nth per group:
  SUM(gold)    OVER (PARTITION BY crew ORDER BY day)  AS so_far,   -- filter rn in an
  gold - LAG(gold) OVER (PARTITION BY crew ORDER BY day) AS delta, -- outer query
  gold * 100.0 / SUM(gold) OVER ()                    AS pct       -- empty OVER =
FROM haul;                                                         -- whole set
-- ORDER BY inside OVER changes SUM from "group total" to "total so far"`,
  },
];

// Map a question to the guide card that teaches it: data-track cards list
// their raw question patterns; algorithm cards are keyed by roadmap category.
const CARD_BY_PATTERN = (() => {
  const m = {};
  for (const p of PATTERN_GUIDE) if (p.patterns) for (const raw of p.patterns) m[raw] = p.key;
  return m;
})();

export function guideKeyOf(question) {
  if (CARD_BY_PATTERN[question.pattern]) return CARD_BY_PATTERN[question.pattern];
  const key = categoryKeyOf(question.pattern);
  return PATTERN_GUIDE.some((p) => p.key === key) ? key : null;
}
