// Premium learning layer, kept OUT of the question objects so the content lives
// in one place and merges in at load time. Keyed by question id:
//   why         — one or two sentences: what you learn and why it matters. The
//                 guided "here's your next step, and here's why it's worth it".
//   constraints — the LeetCode-style limits, so the exercise reads properly.
//   examples    — 2–3 worked examples (overrides the question's default), so a
//                 problem is never illustrated by a single case.
//   insight     — the unlockable "go deeper": the transferable idea, why
//                 interviewers love it, where else it shows up.
// Everything here is our own wording — no problem text is copied from anywhere.

export const LEARN = {
  // ── Python warm-ups ────────────────────────────────────────────────────
  'py-reverse-string': {
    why: 'Your first taste of Python slicing. `s[::-1]` reversing a string is the kind of one-liner that shows you the language rewards knowing its tools.',
    constraints: ['0 ≤ len(s) ≤ 10⁴', 's contains printable ASCII characters'],
    examples: [
      'reverse_string("dojo")  ->  "ojod"',
      'reverse_string("a")  ->  "a"',
      'reverse_string("")  ->  ""',
    ],
  },
  'py-fizzbuzz': {
    why: 'The classic warm-up interviewers open with to check you can turn plain rules into clean control flow. Getting the order of the conditions right is the whole game.',
    constraints: ['1 ≤ n ≤ 10⁴'],
    examples: [
      'fizzbuzz(5)  ->  ["1", "2", "Fizz", "4", "Buzz"]',
      'fizzbuzz(3)  ->  ["1", "2", "Fizz"]',
      'fizzbuzz(15)[-1]  ->  "FizzBuzz"   # 15 is divisible by both 3 and 5',
    ],
  },
  'py-common-elements': {
    why: 'Teaches sets as a tool, not just a type: `&`, `|`, `-` do in one operation what a nested loop does slowly. This mindset returns constantly.',
    constraints: ['0 ≤ len(a), len(b) ≤ 10⁴', 'elements are comparable so the result can be sorted'],
    examples: [
      'common_elements([1, 2, 3], [2, 3, 4])  ->  [2, 3]',
      'common_elements([4, 4, 5], [5, 4])  ->  [4, 5]   # distinct and sorted',
      'common_elements([1, 2], [3, 4])  ->  []',
    ],
  },
  'py-invert-dict': {
    why: 'Dict comprehensions over `.items()` are everyday Python. You will reach for this shape reshaping JSON, counts, and pandas results for years.',
    constraints: ['values in the input dict are unique (so the inverse is well-defined)'],
    examples: [
      'invert_dict({"a": 1, "b": 2})  ->  {1: "a", 2: "b"}',
      'invert_dict({"x": "y"})  ->  {"y": "x"}',
      'invert_dict({})  ->  {}',
    ],
  },
  'py-merge-counts': {
    why: 'Combining two frequency maps is the seed of every "aggregate then compare" task. Meet `dict.get` and `collections.Counter` here before you need them under pressure.',
    constraints: ['keys are hashable', '0 ≤ number of keys ≤ 10⁴'],
    examples: [
      'merge_counts({"a": 2}, {"a": 3, "b": 1})  ->  {"a": 5, "b": 1}',
      'merge_counts({"a": 1, "b": 2}, {})  ->  {"a": 1, "b": 2}',
      'merge_counts({}, {"z": 4})  ->  {"z": 4}',
    ],
  },

  // ── Arrays & hashing ───────────────────────────────────────────────────
  'py-contains-duplicate': {
    why: 'The gateway to hashing: a `set` answers "have I seen this before?" in O(1), turning an O(n²) scan into a single pass. Almost every array problem starts from this instinct.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    examples: [
      'contains_duplicate([1, 2, 3, 1])  ->  True   # the 1 repeats',
      'contains_duplicate([1, 2, 3, 4])  ->  False',
      'contains_duplicate([])  ->  False',
    ],
    insight:
      'The transferable move: whenever a brute force does repeated *membership* checks ("is X somewhere in this collection?"), a hash set makes each check O(1) and collapses O(n²) to O(n). The price is O(n) extra memory — say that trade out loud in an interview. You will reuse this exact reflex in Two Sum, Longest Consecutive, and dedup problems everywhere.',
  },
  'py-char-frequency': {
    why: 'The counting pattern that underlies anagrams, sliding windows, and "most common X". Build it by hand with `dict.get` once so `Counter` never feels like magic.',
    constraints: ['0 ≤ len(s) ≤ 10⁵', 's is any Unicode string'],
    examples: [
      'char_frequency("banana")  ->  {"b": 1, "a": 3, "n": 2}',
      'char_frequency("aaa")  ->  {"a": 3}',
      'char_frequency("")  ->  {}',
    ],
  },
  'py-first-unique-char': {
    why: 'Two passes beat one clever pass here: count first, then scan for the first count of 1. Learning to split work into phases is a real interview skill.',
    constraints: ['0 ≤ len(s) ≤ 10⁵', 's consists of lowercase English letters'],
    examples: [
      'first_unique_char("leetcode")  ->  0     # "l" is the first non-repeating char',
      'first_unique_char("loveleetcode")  ->  2  # "v" at index 2',
      'first_unique_char("aabb")  ->  -1        # none are unique',
    ],
  },
  'py-valid-anagram': {
    why: 'Shows two valid answers — sort both strings (simple) or compare frequency counts (optimal). Knowing when the "worse" complexity is the right interview answer matters.',
    constraints: ['1 ≤ len(s), len(t) ≤ 5·10⁴', 's and t consist of lowercase English letters'],
    examples: [
      'is_anagram("anagram", "nagaram")  ->  True',
      'is_anagram("rat", "car")  ->  False',
      'is_anagram("a", "ab")  ->  False   # different lengths can never match',
    ],
    insight:
      'Two strings are anagrams iff they have the same multiset of characters. Sorting proves it in O(n log n); a frequency dict proves it in O(n). Both are correct — the interview lesson is to *offer* the simple one, state its cost, then improve it. This "count and compare" shape reappears in Group Anagrams and permutation-in-string.',
  },
  'py-two-sum': {
    why: 'The single most important pattern in this whole set: trade memory for time with a hash map that remembers what you have seen, so a nested loop becomes one pass.',
    constraints: [
      '2 ≤ len(nums) ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      'exactly one valid pair exists',
      'you may not use the same element twice',
    ],
    examples: [
      'two_sum([2, 7, 11, 15], 9)  ->  [0, 1]   # nums[0] + nums[1] = 2 + 7 = 9',
      'two_sum([3, 2, 4], 6)  ->  [1, 2]',
      'two_sum([3, 3], 6)  ->  [0, 1]',
    ],
    insight:
      'As you scan, you already know the number you *need* (target − current). A hash map from value → index lets you ask "have I already seen the complement?" in O(1). That reframing — store what you have seen, look up what you need — is the backbone of countless problems. Interviewers use Two Sum precisely because the O(n²) → O(n) jump reveals whether you reach for hashing instinctively.',
  },
  'py-group-anagrams': {
    why: 'Hashing by a *computed key* (the sorted word, or its letter counts) groups related items. Choosing a good signature is a pattern you will reuse forever.',
    constraints: ['1 ≤ len(strs) ≤ 10⁴', '0 ≤ len(strs[i]) ≤ 100', 'strs[i] is lowercase English'],
    examples: [
      'group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])\n  ->  [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]',
      'group_anagrams(["a"])  ->  [["a"]]',
      'group_anagrams([""])  ->  [[""]]',
    ],
  },
  'py-top-k-frequent': {
    why: 'Introduces the "top K" family — count, then select. Bucket sort by frequency is O(n) and beats the obvious heap, a great "can you do better?" answer.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', 'k is in the range [1, number of distinct values]'],
    examples: [
      'top_k_frequent([1, 1, 1, 2, 2, 3], 2)  ->  [1, 2]   # 1 appears 3×, 2 appears 2×',
      'top_k_frequent([7], 1)  ->  [7]',
      'top_k_frequent([4, 4, 5, 5, 6], 3)  ->  [4, 5, 6]',
    ],
  },
  'py-product-except-self': {
    why: 'The prefix/suffix trick: two directional passes carry running products so you never divide and never nest a loop. A genuinely clever idea worth owning.',
    constraints: ['2 ≤ len(nums) ≤ 10⁵', 'the answer fits in a 32-bit integer', 'solve it without using division'],
    examples: [
      'product_except_self([1, 2, 3, 4])  ->  [24, 12, 8, 6]',
      'product_except_self([2, 3])  ->  [3, 2]',
      'product_except_self([0, 4, 0])  ->  [0, 0, 0]   # two zeros zero everything',
    ],
    insight:
      'Each output is (product of everything to the left) × (product of everything to the right). Sweep left building prefix products, sweep right building suffix products, multiply. The pattern — precompute directional running values in two passes — also cracks trapping-rain-water and stock problems. The "no division" rule forces the insight instead of letting you cheat.',
  },
  'py-longest-consecutive': {
    why: 'Looks like it needs sorting (O(n log n)) but a set gets it in O(n): only start counting from numbers that have no left-neighbour. A beautiful "why is this O(n)?" moment.',
    constraints: ['0 ≤ len(nums) ≤ 10⁵', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    examples: [
      'longest_consecutive([100, 4, 200, 1, 3, 2])  ->  4   # the run 1,2,3,4',
      'longest_consecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])  ->  9   # 0..8',
      'longest_consecutive([])  ->  0',
    ],
  },

  // ── Two pointers ───────────────────────────────────────────────────────
  'py-valid-palindrome': {
    why: 'The two-pointer template in its purest form: one index from each end walking inward. Cheap, O(1) space, and the mental model for the whole family.',
    constraints: ['1 ≤ len(s) ≤ 2·10⁵', 'compare alphanumerics only, case-insensitively'],
    examples: [
      'is_palindrome("A man, a plan, a canal: Panama")  ->  True',
      'is_palindrome("race a car")  ->  False',
      'is_palindrome(" ")  ->  True   # empty once non-alphanumerics are dropped',
    ],
    insight:
      'Two indices converging from the ends check a symmetric property in one pass with no extra memory — the opposite trade from hashing (time-for-nothing instead of time-for-space). Recognising "the answer depends on both ends at once" is the trigger to reach for two pointers, which then powers two-sum-on-sorted, container-with-most-water, and 3Sum.',
  },
  'py-two-sum-sorted': {
    why: 'Because the array is sorted, two converging pointers replace the hash map entirely — O(1) space. Seeing how sortedness unlocks a cheaper tool is the lesson.',
    constraints: ['2 ≤ len(numbers) ≤ 10⁴', 'numbers is sorted ascending', 'exactly one solution exists'],
    examples: [
      'two_sum_sorted([2, 7, 11, 15], 9)  ->  [1, 2]   # 1-indexed positions',
      'two_sum_sorted([2, 3, 4], 6)  ->  [1, 3]',
      'two_sum_sorted([-1, 0], -1)  ->  [1, 2]',
    ],
  },
  'py-container-water': {
    why: 'A greedy two-pointer gem: always move the shorter wall inward, because it is the only move that could ever help. Learning *why* that is safe is the point.',
    constraints: ['2 ≤ len(height) ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
    examples: [
      'max_area([1, 8, 6, 2, 5, 4, 8, 3, 7])  ->  49',
      'max_area([1, 1])  ->  1',
      'max_area([4, 3, 2, 1, 4])  ->  16   # the two 4s, 4 apart',
    ],
    insight:
      'Area is limited by the shorter of the two walls, so widening past the taller wall can never gain you anything — only moving the shorter one in has upside. That "the shorter side is the bottleneck, so move it" argument is a greedy proof in miniature, and the kind of out-loud reasoning that separates a hire from a maybe.',
  },
  'py-three-sum': {
    why: 'The pattern-stacking problem: sort, fix one number, then two-pointer the rest — with careful duplicate-skipping. Combining two techniques cleanly is the interview jump.',
    constraints: ['3 ≤ len(nums) ≤ 3000', '-10⁵ ≤ nums[i] ≤ 10⁵', 'the solution set must not contain duplicate triplets'],
    examples: [
      'three_sum([-1, 0, 1, 2, -1, -4])  ->  [[-1, -1, 2], [-1, 0, 1]]',
      'three_sum([0, 0, 0])  ->  [[0, 0, 0]]',
      'three_sum([1, 2, 3])  ->  []   # no triplet sums to 0',
    ],
  },
  'py-trapping-rain': {
    why: 'A hard classic that rewards the prefix/suffix-max idea (or two pointers): water above each bar is set by the tallest walls on either side. Big payoff for the pattern.',
    constraints: ['1 ≤ len(height) ≤ 2·10⁴', '0 ≤ height[i] ≤ 10⁵'],
    examples: [
      'trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])  ->  6',
      'trap([4, 2, 0, 3, 2, 5])  ->  9',
      'trap([2, 0, 2])  ->  2   # 2 units pool in the dip',
    ],
  },

  // ── Sliding window ─────────────────────────────────────────────────────
  'py-max-profit': {
    why: 'The gentlest window: track the lowest price seen so far and the best profit against it. A one-pass "remember the best baseline" idea you will reuse a lot.',
    constraints: ['1 ≤ len(prices) ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
  },
  'py-longest-substring-norepeat': {
    why: 'The canonical variable-size window: expand right, and when a character repeats, shrink from the left past its last position. The template for every "longest valid substring".',
    constraints: ['0 ≤ len(s) ≤ 5·10⁴', 's consists of English letters, digits, symbols and spaces'],
    insight:
      'Keep a window that always holds distinct characters. Store each char\'s last index; when you hit a repeat inside the window, jump the left edge to just past it. Every element enters and leaves the window at most once, so it is O(n) despite looking nested. This expand-then-shrink skeleton solves the whole sliding-window family — only the "is the window valid?" test changes.',
  },
  'py-char-replacement': {
    why: 'Window validity gets subtler: a window is legal when (length − count of its most common char) ≤ k. Learning to define that predicate is the real skill.',
    constraints: ['1 ≤ len(s) ≤ 10⁵', 's is uppercase English', '0 ≤ k ≤ len(s)'],
  },
  'py-permutation-in-string': {
    why: 'A fixed-size window plus a frequency match: slide a window the size of the pattern and compare letter counts. Fixed windows are the easier half of the family.',
    constraints: ['1 ≤ len(s1), len(s2) ≤ 10⁴', 's1 and s2 consist of lowercase English letters'],
  },
  'py-min-window-substring': {
    why: 'The hard boss of sliding windows: grow until the window is valid, then shrink to make it minimal, tracking a "have/need" count. Master this and the pattern is yours.',
    constraints: ['1 ≤ len(s), len(t) ≤ 10⁵', 's and t consist of English letters'],
  },
  'py-sliding-window-max': {
    why: 'Introduces the monotonic deque: keep indices whose values are decreasing so the front is always the window max. A O(n) trick that feels like magic the first time.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴', '1 ≤ k ≤ len(nums)'],
  },

  // ── Binary search ──────────────────────────────────────────────────────
  'py-binary-search': {
    why: 'The template every other binary search is built from. Nail the loop bounds (lo ≤ hi) and the mid update so off-by-ones never bite you later.',
    constraints: ['1 ≤ len(nums) ≤ 10⁴', 'nums is sorted ascending', 'all values are unique'],
    insight:
      'Binary search works on any *monotonic* space, not just sorted arrays: at each step you must be able to throw away half. Get the invariant right — "the answer is always inside [lo, hi]" — and decide which half to keep. Once that clicks, "binary search on the answer" (Koko Bananas, capacity/threshold problems) is the same code with a different check.',
  },
  'py-search-rotated': {
    why: 'Binary search with a twist: one half of a rotated array is always sorted, so you decide which half to keep by checking that. Reasoning about invariants under a rotation is the lesson.',
    constraints: ['1 ≤ len(nums) ≤ 5000', '-10⁴ ≤ nums[i] ≤ 10⁴', 'values are unique, array was sorted then rotated'],
  },
  'py-find-min-rotated': {
    why: 'Find the pivot of a rotated sorted array in O(log n) by comparing mid to the right end. A clean warm-up for the "which half is sorted?" reasoning.',
    constraints: ['1 ≤ len(nums) ≤ 5000', 'values are unique', 'the array was sorted ascending then rotated'],
  },
  'py-koko-bananas': {
    why: 'The eye-opener: binary-search the *answer* (an eating speed), not an index. Once you see the answer space is monotonic, a search problem hides in a "minimum rate" question.',
    constraints: ['1 ≤ len(piles) ≤ 10⁴', '1 ≤ piles[i] ≤ 10⁹', 'len(piles) ≤ h ≤ 10⁹'],
  },
  'py-search-2d-matrix': {
    why: 'A sorted 2D grid is just one long sorted list if you map an index to (row, col). Treating structure as a flat space is a handy reframing trick.',
    constraints: ['1 ≤ rows, cols ≤ 100', 'each row is sorted, and each row\'s first > previous row\'s last'],
  },

  // ── Stack ──────────────────────────────────────────────────────────────
  'py-valid-parentheses': {
    why: 'The stack "hello world": push openers, pop and match on closers. If it recognises nesting, a stack is almost always the tool.',
    constraints: ['1 ≤ len(s) ≤ 10⁴', 's contains only the characters ()[]{}'],
  },
  'py-eval-rpn': {
    why: 'Postfix evaluation is a stack in its purest form: push numbers, and on an operator pop two, combine, push back. The mental model behind how calculators actually work.',
    constraints: ['1 ≤ len(tokens) ≤ 10⁴', 'tokens are integers or the operators + - * /'],
  },
  'py-daily-temperatures': {
    why: 'The monotonic stack: keep indices of unresolved days, and when a warmer day arrives, pop everything it answers. The template for every "next greater element".',
    constraints: ['1 ≤ len(temperatures) ≤ 10⁵', '30 ≤ temperatures[i] ≤ 100'],
    insight:
      'A monotonic stack holds items still "waiting" for an answer, in decreasing order. When the current item beats what is on top, it resolves those tops — each element is pushed and popped once, so O(n). This one idea powers next-greater/next-smaller, stock spans, and even Largest Rectangle in Histogram. Spot "for each element, find the next one that is bigger/smaller" and reach for it.',
  },
  'py-min-stack': {
    why: 'Design a stack that returns its min in O(1) by pushing the running minimum alongside each value. A neat "carry the answer with the data" trick.',
    constraints: ['operations ≤ 3·10⁴', 'pop/top/getMin are only called on a non-empty stack'],
  },
  'py-car-fleet': {
    why: 'Sort by position, then a stack of arrival times collapses cars into fleets. Shows how the right ordering turns a messy simulation into a single clean pass.',
    constraints: ['1 ≤ len(position) ≤ 10⁵', '0 ≤ position[i] < 10⁶', '0 < speed[i] ≤ 10⁶'],
  },
  'py-largest-rectangle': {
    why: 'The monotonic stack at its most powerful: each bar is popped when a shorter bar bounds its rectangle. Hard, but the payoff cements the pattern for good.',
    constraints: ['1 ≤ len(heights) ≤ 10⁵', '0 ≤ heights[i] ≤ 10⁴'],
  },

  // ── Linked list ────────────────────────────────────────────────────────
  'py-reverse-list': {
    why: 'The pointer-juggling fundamental: walk the list flipping each next pointer with three variables. Once this is automatic, half of linked-list problems fall.',
    constraints: ['0 ≤ number of nodes ≤ 5000', '-5000 ≤ node value ≤ 5000'],
    insight:
      'Reversal is just three pointers — prev, cur, and a saved next — advancing in lockstep while you flip cur.next to prev. Draw it once and the moves stick. This exact dance shows up inside Reorder List, reversing sub-lists in k-groups, and palindrome checks; the linked-list "hard" problems are mostly this plus a slow/fast pointer to find the middle.',
  },
  'py-merge-sorted-lists': {
    why: 'The merge step of merge sort, on lists: a dummy head plus a tail pointer stitches two sorted lists into one. Dummy-node technique you will lean on constantly.',
    constraints: ['0 ≤ nodes in each list ≤ 50', '-100 ≤ node value ≤ 100', 'both lists are sorted ascending'],
  },
  'py-reorder-list': {
    why: 'Three techniques in one: find the middle (slow/fast), reverse the second half, then weave the halves together. A great test of pointer fluency.',
    constraints: ['1 ≤ number of nodes ≤ 5·10⁴', '1 ≤ node value ≤ 1000'],
  },
  'py-remove-nth-end': {
    why: 'The gap trick: advance one pointer n steps first, then move both until it hits the end — now the other sits just before the target. One clean pass, no length count.',
    constraints: ['1 ≤ number of nodes ≤ 30', '1 ≤ n ≤ number of nodes'],
  },
  'py-add-two-numbers': {
    why: 'Grade-school addition on lists: walk both, sum digit + digit + carry, and build the result. Handling the trailing carry is the classic edge case.',
    constraints: ['1 ≤ nodes in each list ≤ 100', '0 ≤ node value ≤ 9', 'digits are stored in reverse order'],
  },
  'py-merge-k-lists': {
    why: 'Scale the two-list merge with a heap of the current heads (or pairwise merging). The bridge from linked lists to heaps and divide-and-conquer.',
    constraints: ['0 ≤ k ≤ 10⁴', '0 ≤ nodes per list ≤ 500', 'each list is sorted ascending'],
  },

  // ── Trees ──────────────────────────────────────────────────────────────
  'py-max-depth-tree': {
    why: 'The recursion template for trees: depth is 1 + max(depth of children). If you can write this, you can write most tree problems.',
    constraints: ['0 ≤ number of nodes ≤ 10⁴', '-100 ≤ node value ≤ 100'],
    insight:
      'Almost every tree problem is the same shape: recurse on left and right, then combine their answers with the current node. Depth combines with max+1; sum combines with addition; "is balanced" combines heights with a check. Get comfortable trusting the recursion on the subtrees and only reasoning about the combine step — that leap is the whole skill.',
  },
  'py-invert-tree': {
    why: 'The famous "swap every node\'s children" one-liner. Tiny, but it drills the recurse-then-combine reflex on trees.',
    constraints: ['0 ≤ number of nodes ≤ 100', '-100 ≤ node value ≤ 100'],
  },
  'py-same-tree': {
    why: 'Compare two trees in lockstep: same value here, and recursively the same on both sides. The base cases (one empty, both empty) are the lesson.',
    constraints: ['0 ≤ number of nodes ≤ 100', '-10⁴ ≤ node value ≤ 10⁴'],
  },
  'py-validate-bst': {
    why: 'The subtle one: a node must be inside a shrinking (low, high) range, not just bigger than its parent. Passing bounds down the recursion is a technique worth owning.',
    constraints: ['1 ≤ number of nodes ≤ 10⁴', '-2³¹ ≤ node value < 2³¹'],
  },
  'py-tree-diameter': {
    why: 'Compute height and update a global "best path through this node = left height + right height" in one pass. The "return one thing, track another" trick.',
    constraints: ['1 ≤ number of nodes ≤ 10⁴', '-100 ≤ node value ≤ 100'],
  },
  'py-level-order': {
    why: 'The BFS template on a tree: a queue processes one level at a time. Whenever a problem says "by level" or "shortest", this is the shape.',
    constraints: ['0 ≤ number of nodes ≤ 2000', '-1000 ≤ node value ≤ 1000'],
  },
  'py-subtree': {
    why: 'Compose two ideas: "is this the same tree?" checked at every node of the big tree. Reusing a helper as a subroutine is a real design move.',
    constraints: ['1 ≤ nodes in root ≤ 2000', '1 ≤ nodes in subRoot ≤ 1000'],
  },
  'py-kth-smallest-bst': {
    why: 'An in-order walk of a BST visits values in sorted order — stop at the k-th. Knowing that BST property turns a "sort" into a partial traversal.',
    constraints: ['1 ≤ k ≤ number of nodes ≤ 10⁴', '0 ≤ node value ≤ 10⁴'],
  },
  'py-lca-bst': {
    why: 'The BST shortcut: walk down, and the first node that sits between the two targets is their lowest common ancestor. Uses ordering to skip the general-tree work.',
    constraints: ['2 ≤ number of nodes ≤ 10⁵', 'all node values are unique', 'both targets exist in the tree'],
  },
  'py-max-path-sum': {
    why: 'A hard classic: each node returns its best downward arm, while a global tracks the best "left arm + node + right arm". The return-vs-track split at its trickiest.',
    constraints: ['1 ≤ number of nodes ≤ 3·10⁴', '-1000 ≤ node value ≤ 1000'],
  },

  // ── Tries ──────────────────────────────────────────────────────────────
  'py-implement-trie': {
    why: 'Build the prefix tree from scratch — insert, search, startsWith. Once you have written the node-per-character structure, prefix problems become easy.',
    constraints: ['1 ≤ word/prefix length ≤ 2000', 'words consist of lowercase English letters', '≤ 3·10⁴ operations'],
  },

  // ── Heap ───────────────────────────────────────────────────────────────
  'py-kth-largest': {
    why: 'A size-k min-heap keeps the k largest seen so far in O(n log k) — the front is your answer. The go-to shape for every "k-th / top-K" question.',
    constraints: ['1 ≤ k ≤ len(nums) ≤ 10⁴', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    insight:
      'To keep the k largest of a stream, hold a min-heap of size k: push each value, and if the heap grows past k, pop the smallest. Whatever survives are the k biggest, and the root is the k-th largest — all in O(n log k), no full sort. Flip to a max-heap for the k smallest. This bounded-heap trick is the backbone of top-K frequent, k closest points, and merge-k-lists.',
  },
  'py-last-stone-weight': {
    why: 'A max-heap simulation: repeatedly smash the two heaviest stones. Simple, but it makes heapq muscle memory concrete (negate values for a max-heap).',
    constraints: ['1 ≤ len(stones) ≤ 30', '1 ≤ stones[i] ≤ 1000'],
  },
  'py-task-scheduler': {
    why: 'Greedy + counting: schedule the most frequent task first and fill idle gaps. Teaches reasoning about "the busiest item sets the pace".',
    constraints: ['1 ≤ len(tasks) ≤ 10⁴', 'tasks are uppercase letters', '0 ≤ n ≤ 100'],
  },

  // ── Backtracking ───────────────────────────────────────────────────────
  'py-subsets': {
    why: 'The purest backtracking: at each element, choose to include it or not. The include → recurse → undo skeleton that every other backtracking problem reuses.',
    constraints: ['1 ≤ len(nums) ≤ 10', '-10 ≤ nums[i] ≤ 10', 'all values are unique'],
    insight:
      'Backtracking is a decision tree walked depth-first: make a choice, recurse, then *undo it* before the next choice. The undo (path.pop()) is what makes one list explore every branch. Subsets, permutations, combinations and N-Queens are all this template with a different set of choices and a different "is this a complete answer?" test. Add a "skip duplicates" line and Subsets II falls out.',
  },
  'py-permutations': {
    why: 'Backtracking where order matters: pick an unused element at each depth. Managing the "used" set is the new wrinkle over subsets.',
    constraints: ['1 ≤ len(nums) ≤ 6', '-10 ≤ nums[i] ≤ 10', 'all values are unique'],
  },
  'py-combination-sum': {
    why: 'Backtracking with reuse: you may pick the same number again, so recurse from the current index, not the next. Pruning when the running sum overshoots is key.',
    constraints: ['1 ≤ len(candidates) ≤ 30', '2 ≤ candidates[i] ≤ 40', 'candidates are distinct', '1 ≤ target ≤ 40'],
  },
  'py-generate-parens': {
    why: 'Backtracking with a validity rule: only add ")" when it does not exceed the "(" placed so far. Encoding the constraint in the choices is the lesson.',
    constraints: ['1 ≤ n ≤ 8'],
  },
  'py-subsets-ii': {
    why: 'Subsets with duplicates: sort first, then skip a value equal to its predecessor at the same depth. The canonical "avoid duplicate branches" move.',
    constraints: ['1 ≤ len(nums) ≤ 10', '-10 ≤ nums[i] ≤ 10'],
  },
  'py-word-search': {
    why: 'Backtracking on a grid: DFS from each cell, marking visited and un-marking on return. Where backtracking meets graph traversal.',
    constraints: ['1 ≤ rows·cols ≤ 200', 'board and word are English letters', '1 ≤ len(word) ≤ 15'],
  },
  'py-palindrome-partition': {
    why: 'Backtracking that cuts a string: at each position, try every prefix that is a palindrome, then recurse on the rest. Combines a check with the choose/undo loop.',
    constraints: ['1 ≤ len(s) ≤ 16', 's consists of lowercase English letters'],
  },

  // ── Graphs ─────────────────────────────────────────────────────────────
  'py-number-of-islands': {
    why: 'The grid-DFS gateway: each unvisited land cell floods its whole island; count the floods. The template for every connected-component problem on a grid.',
    constraints: ['1 ≤ rows, cols ≤ 300', 'grid cells are "0" (water) or "1" (land)'],
    insight:
      'Treat the grid as a graph where each cell links to its four neighbours. Walk from every unvisited land cell with DFS/BFS, marking cells seen so you never revisit — one walk drowns one whole island. Counting the walks counts the components. This flood-fill is the same engine behind Max Area of Island, Pacific Atlantic, and Rotting Oranges (which just uses BFS for simultaneous spread).',
  },
  'py-max-area-island': {
    why: 'Number of Islands, but each flood returns its size. Shows how a traversal can compute a value, not just mark cells.',
    constraints: ['1 ≤ rows, cols ≤ 50', 'grid cells are 0 or 1'],
  },
  'py-rotting-oranges': {
    why: 'Multi-source BFS: all rotten oranges spread at once, one minute per BFS layer. The model for "shortest time for something to spread".',
    constraints: ['1 ≤ rows, cols ≤ 10', 'cells are 0 (empty), 1 (fresh), or 2 (rotten)'],
  },
  'py-course-schedule': {
    why: 'Cycle detection on a dependency graph — if the prerequisites form a cycle, you can never finish. Your introduction to topological reasoning.',
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ len(prerequisites) ≤ 5000', 'pairs are distinct'],
  },
  'py-course-schedule-ii': {
    why: 'Topological sort: produce an actual valid order (Kahn\'s algorithm with in-degrees, or DFS post-order). The ordering companion to cycle detection.',
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ len(prerequisites) ≤ numCourses·(numCourses−1)'],
  },
  'py-count-components': {
    why: 'Count connected components in a general graph via DFS or union-find. A clean place to meet union-find if you have not yet.',
    constraints: ['1 ≤ n ≤ 2000', '0 ≤ len(edges) ≤ n·(n−1)/2', 'no self-loops or duplicate edges'],
  },
  'py-pacific-atlantic': {
    why: 'Flip the question: instead of "can this cell reach both oceans?", flood *inward* from each ocean and intersect. Reversing the search direction is a powerful trick.',
    constraints: ['1 ≤ rows, cols ≤ 200', '0 ≤ height ≤ 10⁵'],
  },

  // ── Dynamic programming ────────────────────────────────────────────────
  'py-climbing-stairs': {
    why: 'The "hello world" of DP: ways(n) = ways(n−1) + ways(n−2). It is Fibonacci in disguise, and the gentlest place to meet a recurrence.',
    constraints: ['1 ≤ n ≤ 45'],
    insight:
      'Every DP starts by answering two questions: what does dp[i] mean, and how does it build from smaller i? Here dp[i] = ways to reach step i, and the last move was a single or double step, so dp[i] = dp[i−1] + dp[i−2]. Once the recurrence is written, filling a table (or keeping the last two values) is mechanical. House Robber, Decode Ways and Min Cost Climbing Stairs are all this same 1-D shape.',
  },
  'py-house-robber': {
    why: 'The "take it or skip it" recurrence: rob(i) = max(skip this house, this house + rob(i−2)). The decision-DP template in miniature.',
    constraints: ['1 ≤ len(nums) ≤ 100', '0 ≤ nums[i] ≤ 400'],
  },
  'py-coin-change': {
    why: 'Unbounded DP: the fewest coins for amount a is 1 + the best over a−coin. Your first "min over choices" table, and a super common interview shape.',
    constraints: ['1 ≤ len(coins) ≤ 12', '1 ≤ coins[i] ≤ 2³¹−1', '0 ≤ amount ≤ 10⁴'],
  },
  'py-longest-increasing-subseq': {
    why: 'The O(n²) DP is easy; the O(n log n) patience-sorting version is a classic "can you do better?". Great for seeing two solutions of very different cleverness.',
    constraints: ['1 ≤ len(nums) ≤ 2500', '-10⁴ ≤ nums[i] ≤ 10⁴'],
  },
  'py-unique-paths': {
    why: 'Grid DP: paths to a cell = paths from above + paths from the left. The 2-D table that generalises to edit distance and min-path-sum.',
    constraints: ['1 ≤ m, n ≤ 100', 'the answer fits in a 32-bit integer'],
  },
  'py-longest-common-subseq': {
    why: 'The two-string DP grid: match extends the diagonal, mismatch takes the better neighbour. The skeleton behind edit distance and diff tools.',
    constraints: ['1 ≤ len(text1), len(text2) ≤ 1000', 'strings consist of lowercase English letters'],
  },
  'py-house-robber-ii': {
    why: 'House Robber on a circle: the first and last house are now neighbours, so run the line-DP twice (exclude one end each time). Reducing a new problem to a solved one.',
    constraints: ['1 ≤ len(nums) ≤ 100', '0 ≤ nums[i] ≤ 1000'],
  },
  'py-longest-palindrome-substr': {
    why: 'Expand around every centre (each char and each gap) and keep the longest. A tidy O(n²) idea that beats the naive O(n³).',
    constraints: ['1 ≤ len(s) ≤ 1000', 's consists of digits and English letters'],
  },
  'py-count-palindromic-substrings': {
    why: 'Same expand-around-centre engine as the longest-palindrome problem, but counting instead of maximising. Reusing a technique for a new question.',
    constraints: ['1 ≤ len(s) ≤ 1000', 's consists of lowercase English letters'],
  },
  'py-decode-ways': {
    why: 'A 1-D DP with fiddly rules: a digit can stand alone or pair with the previous one if it is 10–26. All the learning is in the edge cases (zeros!).',
    constraints: ['1 ≤ len(s) ≤ 100', 's consists of digits and may contain leading-zero traps'],
  },
  'py-word-break': {
    why: 'DP over string positions: s[:i] is breakable if some word ends at i and s[:start] was breakable. A clean "can I reach here?" table.',
    constraints: ['1 ≤ len(s) ≤ 300', '1 ≤ len(wordDict) ≤ 1000', 'words and s are lowercase English'],
  },
  'py-can-partition': {
    why: 'The subset-sum trick: can any subset hit total/2? A boolean DP over reachable sums — your gateway to knapsack problems.',
    constraints: ['1 ≤ len(nums) ≤ 200', '1 ≤ nums[i] ≤ 100'],
  },
  'py-min-path-sum': {
    why: 'Grid DP with costs: cheapest way to a cell = its value + min(from above, from left). The weighted cousin of Unique Paths.',
    constraints: ['1 ≤ rows, cols ≤ 200', '0 ≤ grid[i][j] ≤ 200'],
  },
  'py-edit-distance': {
    why: 'The heavyweight two-string DP: insert, delete, or replace, taking the cheapest at each cell. Master this grid and most string-DP looks familiar.',
    constraints: ['0 ≤ len(word1), len(word2) ≤ 500', 'words consist of lowercase English letters'],
  },
  'py-max-product-subarray': {
    why: 'A twist on Kadane: track both the max and min running product, because a negative can flip the smallest into the largest. Carrying two states is the insight.',
    constraints: ['1 ≤ len(nums) ≤ 2·10⁴', '-10 ≤ nums[i] ≤ 10', 'every prefix product fits in 32 bits'],
  },

  // ── Greedy ─────────────────────────────────────────────────────────────
  'py-max-subarray': {
    why: 'Kadane\'s algorithm: reset the running sum whenever it drops below zero. The one-liner that everyone should be able to derive on the spot.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    insight:
      'A negative running total can only hurt what comes next, so drop it: keep a current sum, and whenever it goes negative reset it to the next element. Track the best sum seen along the way. That one greedy decision — "would starting fresh here be better?" — is Kadane\'s algorithm, and the same "reset when the prefix stops helping" instinct shows up in stock and gas-station problems.',
  },
  'py-jump-game': {
    why: 'Greedy reachability: sweep left to right tracking the farthest index you can reach; if you ever fall behind it, you are stuck. Simple and beautiful.',
    constraints: ['1 ≤ len(nums) ≤ 10⁴', '0 ≤ nums[i] ≤ 10⁵'],
  },
  'py-jump-game-ii': {
    why: 'Greedy BFS-by-levels: each "jump" covers a range, and you extend to the farthest reachable within it. Counting minimum jumps without any DP table.',
    constraints: ['1 ≤ len(nums) ≤ 10⁴', '0 ≤ nums[i] ≤ 1000', 'you can always reach the last index'],
  },
  'py-gas-station': {
    why: 'A greedy gem: if total gas ≥ total cost a solution exists, and the start is just after the point where the running tank dips lowest. A lovely "one pass proves it" argument.',
    constraints: ['1 ≤ len(gas) ≤ 10⁵', '0 ≤ gas[i], cost[i] ≤ 10⁴'],
  },
  'py-hand-of-straights': {
    why: 'Greedy with a count map: always start the next group from the smallest remaining card. Teaches "commit to the forced move" reasoning.',
    constraints: ['1 ≤ len(hand) ≤ 10⁴', '0 ≤ hand[i] ≤ 10⁹', '1 ≤ groupSize ≤ len(hand)'],
  },

  // ── Intervals ──────────────────────────────────────────────────────────
  'py-merge-intervals': {
    why: 'Sort by start, then merge any interval that overlaps the last one kept. The template every other interval problem builds on.',
    constraints: ['1 ≤ len(intervals) ≤ 10⁴', '0 ≤ start ≤ end ≤ 10⁴'],
    insight:
      'Almost every interval problem begins by sorting — by start to merge/insert, by end to pack the most non-overlapping ranges. After sorting you sweep once, comparing each interval to the previous kept one: overlap means merge (or a conflict to drop), otherwise start a new group. Merge Intervals, Insert Interval, Non-overlapping Intervals and Meeting Rooms are all this one sweep with a different bookkeeping rule.',
  },
  'py-meeting-rooms': {
    why: 'The lightest interval check: sort by start and see if any meeting begins before the previous ends. The "do these ranges collide?" primitive.',
    constraints: ['0 ≤ len(intervals) ≤ 10⁴', '0 ≤ start < end ≤ 10⁶'],
  },
  'py-insert-interval': {
    why: 'Merge a single new interval into a sorted list in one pass: emit everything before it, absorb overlaps, emit the rest. Careful three-phase bookkeeping.',
    constraints: ['0 ≤ len(intervals) ≤ 10⁴', 'intervals are sorted by start and non-overlapping'],
  },
  'py-non-overlapping': {
    why: 'Greedy interval scheduling: sort by *end* and keep the earliest-finishing compatible interval — the classic proof that finishing soonest leaves the most room.',
    constraints: ['1 ≤ len(intervals) ≤ 10⁵', '-5·10⁴ ≤ start < end ≤ 5·10⁴'],
  },
  'py-min-meeting-rooms': {
    why: 'Count peak overlap with two sorted timelines (starts and ends) or a min-heap of end times. The "how many resources at once?" pattern.',
    constraints: ['1 ≤ len(intervals) ≤ 10⁴', '0 ≤ start < end ≤ 10⁶'],
  },

  // ── Bit manipulation ───────────────────────────────────────────────────
  'py-single-number': {
    why: 'XOR everything: equal pairs cancel to 0 and the lone number survives — O(1) space, no hash set. The definitive "XOR cancels pairs" trick.',
    constraints: ['1 ≤ len(nums) ≤ 3·10⁴', 'every element appears twice except one', '-3·10⁴ ≤ nums[i] ≤ 3·10⁴'],
    insight:
      'XOR has two magic properties: x ^ x = 0 and x ^ 0 = x. Fold it across the array and every duplicated value zeroes itself out, leaving the unique one — constant space, one pass. The other bit staples: n & (n−1) clears the lowest set bit (count bits by looping it), n & 1 reads the last bit, and n >> 1 drops it. Those cover most "bit" interview questions.',
  },
  'py-count-bits': {
    why: 'DP meets bits: count[i] = count[i >> 1] + (i & 1). A clever recurrence that reuses answers you already computed.',
    constraints: ['0 ≤ n ≤ 10⁵'],
  },
  'py-hamming-weight': {
    why: 'Count set bits by repeatedly clearing the lowest one with n &= n − 1 — it loops only once per set bit. A tidy bit-trick to have in hand.',
    constraints: ['input is a 32-bit integer'],
  },
  'py-missing-number': {
    why: 'Two O(1)-space tricks in one problem: the sum formula n(n+1)/2 minus the actual sum, or XOR of indices and values. Nice to see both.',
    constraints: ['1 ≤ len(nums) ≤ 10⁴', 'nums holds n distinct values from 0..n with one missing'],
  },
  'py-reverse-bits': {
    why: 'Build the result bit by bit: shift the answer left, OR in the input\'s lowest bit, shift the input right. Pure bit plumbing.',
    constraints: ['input is a 32-bit unsigned integer'],
  },
  'py-sum-two-integers': {
    why: 'Add without +: XOR gives the sum-without-carry, AND-then-shift gives the carry, repeat until no carry. Shows how hardware actually adds.',
    constraints: ['-1000 ≤ a, b ≤ 1000'],
  },

  // ── Math & geometry ────────────────────────────────────────────────────
  'py-rotate-image': {
    why: 'Rotate a matrix in place by transposing then reversing each row — no extra grid. The trick that turns a scary-looking task into two easy sweeps.',
    constraints: ['1 ≤ n ≤ 20 (n × n matrix)', '-1000 ≤ matrix[i][j] ≤ 1000'],
    insight:
      'A 90° clockwise rotation equals transpose (swap across the main diagonal) followed by reversing each row — both O(1) extra space. Decomposing a hard in-place transform into two simple, reversible sweeps is the reusable idea; the same "find the index formula, move values in place" mindset drives Spiral Matrix and Rotate Array.',
  },
  'py-spiral-matrix': {
    why: 'Walk the matrix in shrinking rings by maintaining four boundaries. Fiddly index bookkeeping done carefully — a real test of attention to edges.',
    constraints: ['1 ≤ rows, cols ≤ 10', '-100 ≤ matrix[i][j] ≤ 100'],
  },
  'py-happy-number': {
    why: 'Cycle detection outside a linked list: iterate the digit-square-sum and use a seen-set (or slow/fast) to spot a loop. Patterns transfer across shapes.',
    constraints: ['1 ≤ n ≤ 2³¹ − 1'],
  },
  'py-plus-one': {
    why: 'Simulate carrying across a digit array from the right — with the all-nines edge case that grows the array. Small, but the edge case teaches care.',
    constraints: ['1 ≤ len(digits) ≤ 100', '0 ≤ digits[i] ≤ 9', 'no leading zeros (except the number 0)'],
  },
  'py-pow': {
    why: 'Fast exponentiation: square the base and halve the exponent for O(log n) instead of O(n). The divide-and-conquer idea behind many "compute x^n" tasks.',
    constraints: ['-100 < x < 100', '-2³¹ ≤ n ≤ 2³¹ − 1', 'the answer fits in a double'],
  },
  'py-rotate-array': {
    why: 'Rotate in place with the three-reversal trick: reverse all, then reverse the two parts. A surprising, elegant O(1)-space move.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-2³¹ ≤ nums[i] ≤ 2³¹ − 1', '0 ≤ k ≤ 10⁵'],
  },
};
