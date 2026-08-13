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
    why: 'Your first taste of how Python rewards knowing its tools: this one has a famous one-line spelling. If you cannot produce it instantly, repeat the rep until you can.',
    constraints: ['0 ≤ len(s) ≤ 10⁴', 's contains printable ASCII characters'],
    examples: [
      'reverse_string("dojo")  ->  "ojod"',
      'reverse_string("a")  ->  "a"',
      'reverse_string("")  ->  ""',
    ],
    insight:
      "`s[::-1]` is a slice with a negative step, and the general form is `s[start:stop:step]` — so `s[::2]` takes every other character and `s[::-2]` walks backwards two at a time. Knowing that one syntax removes a loop from dozens of later problems.\n\nThe immutability point matters more than the trick. Because a Python string can never be edited in place, every 'modify a string' problem is really 'build a new one'. That is why the idiom for assembling text is a list plus `''.join(parts)` and never `text += piece` in a loop: the second one copies the whole string every iteration, turning an O(n) job into O(n²). You will meet that exact trap in the palindrome and encoding problems later on.",
  },
  'py-fizzbuzz': {
    why: 'The classic warm-up interviewers open with to check you can turn plain rules into clean control flow. Getting the order of the conditions right is the whole game.',
    constraints: ['1 ≤ n ≤ 10⁴'],
    examples: [
      'fizzbuzz(5)  ->  ["1", "2", "Fizz", "4", "Buzz"]',
      'fizzbuzz(3)  ->  ["1", "2", "Fizz"]',
      'fizzbuzz(15)[-1]  ->  "FizzBuzz"   # 15 is divisible by both 3 and 5',
    ],
    insight:
      'The whole point is the ORDER of the branches. Checking `% 3` first means 15 is caught by the wrong arm and never reaches the FizzBuzz case, so the most specific condition has to be tested first. That ordering rule is the same one that governs `elif` chains everywhere — and it is precisely why `% 15` rather than `% 3 and % 5` is the clearer spelling: it names the case instead of reconstructing it.\n\nThe generalisation worth carrying: when several conditions can be true at once, an `if/elif` chain silently picks the FIRST match, not the best one. If the branches are not ordered from most specific to least, the bug is invisible on small inputs and obvious on the one case the interviewer picks.',
  },
  'py-common-elements': {
    why: 'Teaches sets as a tool, not just a type: `&`, `|`, `-` do in one operation what a nested loop does slowly. This mindset returns constantly.',
    constraints: [
      '0 ≤ len(a), len(b) ≤ 10⁴',
      'elements are comparable so the result can be sorted',
    ],
    examples: [
      'common_elements([1, 2, 3], [2, 3, 4])  ->  [2, 3]',
      'common_elements([4, 4, 5], [5, 4])  ->  [4, 5]   # distinct and sorted',
      'common_elements([1, 2], [3, 4])  ->  []',
    ],
    insight:
      'Sets exist to make membership O(1) and to give you the algebra: `&` intersection, `|` union, `-` difference, `^` symmetric difference. Reaching for them turns a nested loop into an operator.\n\nThe cost to know is the conversion. `set(a) & set(b)` is O(n + m) but allocates both sets, and it DESTROYS order and duplicates — which is why the answer has to be sorted back into a list here. That trade is the thing to weigh in later problems: if you need order or counts, a set is the wrong tool and a dict of counts is the right one. And `x in some_list` is O(n) while `x in some_set` is O(1) — that single swap is the fix for a surprising number of accidentally-quadratic solutions.',
  },
  'py-invert-dict': {
    why: 'Turning a dict inside-out is everyday Python — you will reach for this shape reshaping JSON, counts, and pandas results for years. There is a one-line spelling worth owning.',
    constraints: ['values in the input dict are unique (so the inverse is well-defined)'],
    examples: [
      'invert_dict({"a": 1, "b": 2})  ->  {1: "a", 2: "b"}',
      'invert_dict({"x": "y"})  ->  {"y": "x"}',
      'invert_dict({})  ->  {}',
    ],
    insight:
      'The dict comprehension `{v: k for k, v in d.items()}` is worth having in your fingers, but the interesting part is the precondition. Inverting is only lossless because the values are unique; if two keys shared a value, one would silently overwrite the other and you would never know.\n\nThat is the question to ask whenever you build a dict from data you did not create: can two rows produce the same key? If they can, you do not want a dict of values — you want a dict of LISTS, built with `setdefault(key, []).append(...)` or a `defaultdict(list)`. Group Anagrams a few steps later is exactly that shape, and recognising it here is what makes that one feel obvious.',
  },
  'py-merge-counts': {
    why: 'Combining two frequency maps is the seed of every "aggregate then compare" task. Meet `dict.get` and `collections.Counter` here before you need them under pressure.',
    constraints: ['keys are hashable', '0 ≤ number of keys ≤ 10⁴'],
    examples: [
      'merge_counts({"a": 2}, {"a": 3, "b": 1})  ->  {"a": 5, "b": 1}',
      'merge_counts({"a": 1, "b": 2}, {})  ->  {"a": 1, "b": 2}',
      'merge_counts({}, {"z": 4})  ->  {"z": 4}',
    ],
    insight:
      '`dict(a)` makes a shallow copy, and copying before mutating is what keeps the function pure. A caller handing you a dict rarely expects it back modified, and a function that quietly edits its arguments is one of the hardest bugs to find later — worth saying out loud in an interview.\n\n`merged.get(k, 0) + v` is the counting idiom in its general form: read with a default, add, write back. Once it is automatic you will see `collections.Counter` for what it is — this pattern with `+` already defined, so `Counter(a) + Counter(b)` does the whole function. Write it by hand first, then use the shortcut knowing exactly what it replaced.',
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
    insight:
      'This is the single most reused shape in the whole bank. Counting characters, counting words, counting anything — the loop is always `counts[x] = counts.get(x, 0) + 1`, and `defaultdict(int)` or `Counter` are the same thing with the default supplied for you.\n\nWhat makes it powerful later is that a count dict is a fingerprint. Two strings are anagrams exactly when their count dicts are equal; a sliding window matches a pattern exactly when its count dict matches; a character is unique exactly when its count is 1. Every one of those problems is this loop plus one comparison — so the fluency you build here is what makes Valid Anagram, Group Anagrams, Permutation in String and Minimum Window Substring feel like the same problem wearing different clothes.',
  },
  'py-first-unique-char': {
    why: 'Two passes beat one clever pass here: count first, then scan for the first count of 1. Learning to split work into phases is a real interview skill.',
    constraints: ['0 ≤ len(s) ≤ 10⁵', 's consists of lowercase English letters'],
    examples: [
      'first_unique_char("leetcode")  ->  0     # "l" is the first non-repeating char',
      'first_unique_char("loveleetcode")  ->  2  # "v" at index 2',
      'first_unique_char("aabb")  ->  -1        # none are unique',
    ],
    insight:
      "The lesson is that TWO passes are often cheaper than one clever pass. You cannot know whether the first character is unique until you have seen the whole string, so any attempt to answer in a single scan ends up rescanning — the honest O(n) answer counts first, then walks in order.\n\nThat shape recurs constantly: gather the facts, then use them. It is why Two Sum is a count-then-look, why Top K Frequent counts before sorting, and why the two-sweep answers to Candy and Product of Array Except Self exist at all. When a single pass feels impossible, the question to ask is not 'how do I be cleverer' but 'what would I need to know in advance, and can I get it in one cheap pass first?'",
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
    insight:
      "The idea is a CANONICAL KEY: map every member of a group to one identical value, and a dict does the grouping for free. Sorted letters is the obvious key here — `'eat'`, `'tea'` and `'ate'` all become `'aet'`.\n\nThe upgrade worth knowing is that sorting costs O(k log k) per word, and a 26-slot count tuple is O(k). `tuple(counts)` is hashable where a list is not, which is the practical reason count-tuples show up as dict keys so often.\n\nThe transferable move is bigger than anagrams: whenever you must group 'things that are the same in some way', ask what function makes them literally equal, then use that as the key. Grouping shifted strings, grouping isomorphic words, grouping points by slope — all the same instruction with a different key function.",
  },
  'py-top-k-frequent': {
    why: 'Introduces the "top K" family — count, then select. Bucket sort by frequency is O(n) and beats the obvious heap, a great "can you do better?" answer.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', 'k is in the range [1, number of distinct values]'],
    examples: [
      'top_k_frequent([1, 1, 1, 2, 2, 3], 2)  ->  [1, 2]   # 1 appears 3×, 2 appears 2×',
      'top_k_frequent([7], 1)  ->  [7]',
      'top_k_frequent([4, 4, 5, 5, 6], 3)  ->  [4, 5, 6]',
    ],
    insight:
      "Two ideas stack here. First the count dict, again. Then the selection: sorting the counts is O(m log m), but you only need the top k — a heap of size k is O(m log k), and bucket sort by frequency is O(n), because a count can never exceed the length of the input so you can index straight into a list of buckets.\n\nThat last observation is the one to keep. Whenever a value is bounded by n, an array indexed by that value beats a sort. It is the same trick behind counting sort, behind the 26-slot letter arrays, and behind First Missing Positive's use of the array as its own hash table.\n\nThe tie-break exists to make the answer gradable, but it is realistic: 'most frequent' is ambiguous when counts tie, and asking the interviewer what to do about ties is a point in your favour.",
  },
  'py-product-except-self': {
    why: 'The prefix/suffix trick: two directional passes carry running products so you never divide and never nest a loop. A genuinely clever idea worth owning.',
    constraints: [
      '2 ≤ len(nums) ≤ 10⁵',
      'the answer fits in a 32-bit integer',
      'solve it without using division',
    ],
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
    insight:
      "Sorting gives O(n log n) in one line and is a perfectly good first answer. The O(n) version turns on a single question: how do you avoid re-walking a run you have already counted?\n\nThe answer is to only start counting at a run's BEGINNING — a value `n` where `n - 1` is absent from the set. Every run is then walked exactly once, so the nested-looking loop is linear overall, not quadratic. Being able to explain that amortised argument out loud is most of the value of this problem.\n\nThe general move: when a brute force repeats work, look for a cheap test that identifies the ONE canonical starting point for each unit of work. The same idea makes the island-counting problems linear — you only flood-fill from a cell you have not already visited.",
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
    constraints: [
      '2 ≤ len(numbers) ≤ 10⁴',
      'numbers is sorted ascending',
      'exactly one solution exists',
    ],
    examples: [
      'two_sum_sorted([2, 7, 11, 15], 9)  ->  [1, 2]   # 1-indexed positions',
      'two_sum_sorted([2, 3, 4], 6)  ->  [1, 3]',
      'two_sum_sorted([-1, 0], -1)  ->  [1, 2]',
    ],
    insight:
      "This is the two-pointer template in its purest form, and it only works because of a monotonicity argument worth stating explicitly: if the current sum is too small, no smaller left value can help, so `lo` must move up; if it is too big, `hi` must come down. Each step permanently eliminates a whole row or column of the pair space, which is why O(n) suffices where the unsorted version needs a hash map.\n\nThat argument — 'moving this pointer can only ever make things worse, so move the other one' — is the thing to carry. It is the identical justification behind Container With Most Water, behind the Trapping Rain Water two-pointer solution, and behind advancing the smallest finger in Smallest Range. If you cannot state why one pointer must move, you do not yet have a two-pointer solution; you have a guess.",
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
    constraints: [
      '3 ≤ len(nums) ≤ 3000',
      '-10⁵ ≤ nums[i] ≤ 10⁵',
      'the solution set must not contain duplicate triplets',
    ],
    examples: [
      'three_sum([-1, 0, 1, 2, -1, -4])  ->  [[-1, -1, 2], [-1, 0, 1]]',
      'three_sum([0, 0, 0])  ->  [[0, 0, 0]]',
      'three_sum([1, 2, 3])  ->  []   # no triplet sums to 0',
    ],
    insight:
      'The move is to REDUCE, not to invent: fix one number and the rest is Two Sum on a sorted array, which you already know. Most k-sum problems collapse the same way — 4Sum is a loop around 3Sum.\n\nDe-duplication is where solutions actually fail, and sorting is what makes it tractable. Duplicates end up adjacent, so `if i and nums[i] == nums[i-1]: continue` skips a repeated first element, and the same skip inside the inner loop handles the pair. Doing it with a set of tuples instead works but costs memory and hides the reasoning.\n\nWatch the loop bound too: `range(len(nums) - 2)` leaves room for the two pointers. Off-by-one there produces a solution that is right on every test with more than three elements — exactly the kind of bug the smallest input catches.',
  },
  'py-trapping-rain': {
    why: 'A hard classic that rewards the prefix/suffix-max idea (or two pointers): water above each bar is set by the tallest walls on either side. Big payoff for the pattern.',
    constraints: ['1 ≤ len(height) ≤ 2·10⁴', '0 ≤ height[i] ≤ 10⁵'],
    examples: [
      'trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])  ->  6',
      'trap([4, 2, 0, 3, 2, 5])  ->  9',
      'trap([2, 0, 2])  ->  2   # 2 units pool in the dip',
    ],
    insight:
      "Water above a bar is `min(tallest to the left, tallest to the right) - height` — once that formula is stated, the problem is 'how do I get both running maxima cheaply?' Two prefix arrays answer it in O(n) time and O(n) space, and that is a completely respectable solution.\n\nThe two-pointer version is the one worth understanding. At any moment the SMALLER of the two running maxima is the binding constraint, because the water level on that side cannot exceed it no matter what lies in the middle. So that side can be settled immediately and its pointer advanced, and the two arrays collapse into two variables.\n\nThat is the same reasoning as Container With Most Water and as advancing the smallest pointer in Smallest Range: find the bound that is currently limiting the answer, resolve it, and move on.",
  },

  // ── Sliding window ─────────────────────────────────────────────────────
  'py-max-profit': {
    why: 'The gentlest window: track the lowest price seen so far and the best profit against it. A one-pass "remember the best baseline" idea you will reuse a lot.',
    constraints: ['1 ≤ len(prices) ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
    insight:
      "Despite the pattern label, this is not really a window — it is a running minimum. At each price the best sale today is `price - cheapest so far`, so one pass carrying one variable answers it.\n\nThe transferable shape is 'best pair where order matters': whenever you need `max(f(j) - g(i))` with `i < j`, carry the best `g` seen so far rather than looking backwards. Maximum Subarray is the same idea with a running sum, and the stock problems with cooldowns and fees are this with extra state.\n\nThe trap is initialising `best` to something other than 0. The problem allows making no trade at all, so a strictly-decreasing price list must return 0, not a negative number — and that is the case a test will always include.",
  },
  'py-longest-substring-norepeat': {
    why: 'The canonical variable-size window: expand right, and when a character repeats, shrink from the left past its last position. The template for every "longest valid substring".',
    constraints: [
      '0 ≤ len(s) ≤ 5·10⁴',
      's consists of English letters, digits, symbols and spaces',
    ],
    insight:
      'Keep a window that always holds distinct characters. Store each char\'s last index; when you hit a repeat inside the window, jump the left edge to just past it. Every element enters and leaves the window at most once, so it is O(n) despite looking nested. This expand-then-shrink skeleton solves the whole sliding-window family — only the "is the window valid?" test changes.',
  },
  'py-char-replacement': {
    why: 'Window validity gets subtler: a window is legal when (length − count of its most common char) ≤ k. Learning to define that predicate is the real skill.',
    constraints: ['1 ≤ len(s) ≤ 10⁵', 's is uppercase English', '0 ≤ k ≤ len(s)'],
    insight:
      'The window is valid when `(window length) - (count of the most common letter) <= k`, because every other letter can be changed. Getting to that single inequality is the whole problem; the loop around it is boilerplate.\n\nThe subtle part is that `maxf` is never decreased when the window shrinks, which looks like a bug and is not. The answer only ever grows, so a stale `maxf` can only make the window fail its test and shrink — it can never let a too-small window be recorded as an answer. Being able to explain that is what separates memorising this solution from understanding it.\n\nThe general template underneath: expand right always, shrink left while the window is invalid, record the answer when it is valid. Almost every variable-size window problem is that skeleton with a different validity test.',
  },
  'py-permutation-in-string': {
    why: 'A fixed-size window plus a frequency match: slide a window the size of the pattern and compare letter counts. Fixed windows are the easier half of the family.',
    constraints: ['1 ≤ len(s1), len(s2) ≤ 10⁴', 's1 and s2 consist of lowercase English letters'],
    insight:
      "A permutation has no order, so 'contains a permutation of s1' means 'some window has the same letter counts as s1' — and once you see that, the sliding window is fixed-width and the whole question is how to compare counts cheaply.\n\nRebuilding a Counter per window is O(26) each time, which is fine; the upgrade is to UPDATE it — add the entering character, remove the leaving one — so each step is O(1). That add-one-remove-one move is the definition of a fixed-size window and it recurs in every rolling-average, rolling-hash and rolling-max problem, including Sliding Window Maximum's deque.\n\nThe refinement worth knowing for interviews is tracking a single `matches` counter instead of comparing whole dicts, which makes the comparison O(1) rather than O(26). Same idea, one level sharper.",
  },
  'py-min-window-substring': {
    why: 'The hard boss of sliding windows: grow until the window is valid, then shrink to make it minimal, tracking a "have/need" count. Master this and the pattern is yours.',
    constraints: ['1 ≤ len(s), len(t) ≤ 10⁵', 's and t consist of English letters'],
    insight:
      'Every sliding-window problem is the same skeleton: expand `hi` until the window is VALID, then shrink `lo` while it stays valid, recording the answer at each step. What changes from problem to problem is only the definition of valid and the O(1) test for it.\n\nThe test is where this one is won. Comparing two count dicts on every step would be O(26) or worse per character; instead `missing` collapses the whole question "does the window contain all of t?" into one integer that is cheap to maintain. Note the sign trick: `need[ch]` is allowed to go negative, so a surplus character is remembered rather than clamped, and the count is exactly right again when the window shrinks past it.\n\nCarry two things forward. First, the skeleton — Longest Repeating Character Replacement and Permutation in String are the same loop with a different validity test. Second, the habit of asking "can I maintain this condition as a single number?" Every O(n) window solution answers yes.',
  },
  'py-sliding-window-max': {
    why: 'Introduces the monotonic deque: keep indices whose values are decreasing so the front is always the window max. A O(n) trick that feels like magic the first time.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴', '1 ≤ k ≤ len(nums)'],
    insight:
      'The deque holds INDICES, in decreasing order of their values, and that ordering is the entire idea: if a bigger number arrives after a smaller one, the smaller can never be the max of any future window, so it is discarded forever. The front is therefore always the answer for the current window.\n\nTwo details are load-bearing. Storing indices rather than values is what lets you tell whether the front has fallen out of the window (`dq[0] <= i - k`) — with values you would have no way to know. And although the loop contains a `while`, every index is appended once and popped once, so the total work is 2n: the amortised argument you need to be able to say out loud.\n\nThe monotonic-deque idea generalises to any "max/min over a moving range" question, and it is the sibling of the monotonic STACK used in Largest Rectangle and Daily Temperatures — same discard rule, different end of the structure.',
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
    constraints: [
      '1 ≤ len(nums) ≤ 5000',
      '-10⁴ ≤ nums[i] ≤ 10⁴',
      'values are unique, array was sorted then rotated',
    ],
    insight:
      'The insight is that cutting a rotated array at the midpoint always leaves at least one half that is properly sorted, and `nums[lo] <= nums[mid]` tells you which. Inside a sorted half a plain range check settles whether the target lives there; if not, it must be in the other half. Either way you discard half the array, so O(log n) survives.\n\nThe error to avoid is deciding which half to keep by comparing the target to `nums[mid]` alone — that is the plain binary-search reflex and it is wrong here, because the array is not globally ordered. You must first establish which side is ordered, and only then test membership.\n\nThe general lesson is that binary search works on any structure where you can cheaply prove the answer cannot be on one side. "Sorted" is the usual proof, but it is not the only one.',
  },
  'py-find-min-rotated': {
    why: 'Find the pivot of a rotated sorted array in O(log n) by comparing mid to the right end. A clean warm-up for the "which half is sorted?" reasoning.',
    constraints: [
      '1 ≤ len(nums) ≤ 5000',
      'values are unique',
      'the array was sorted ascending then rotated',
    ],
    insight:
      'Binary search does not require a sorted array. It requires a predicate that is FALSE up to some point and TRUE from there on, so the loop can always throw away one side. Here the predicate is "nums[mid] is in the right-hand (smaller) run", and comparing against `nums[hi]` decides it in one step.\n\nComparing to `nums[hi]` rather than `nums[lo]` is not arbitrary: with `nums[lo]` a fully sorted array — the rotation-by-zero case — takes the wrong branch, and the answer is off. Test the unrotated input on any rotated-array solution you write.\n\nNote the loop shape too. `while lo < hi` with `hi = mid` (not `mid - 1`) is the converging form, used when you are searching for a POSITION rather than a value: it can never skip past the answer and it ends with `lo == hi` pointing at it. Koko Eating Bananas uses the identical shape.',
  },
  'py-koko-bananas': {
    why: 'The eye-opener: binary-search the *answer* (an eating speed), not an index. Once you see the answer space is monotonic, a search problem hides in a "minimum rate" question.',
    constraints: ['1 ≤ len(piles) ≤ 10⁴', '1 ≤ piles[i] ≤ 10⁹', 'len(piles) ≤ h ≤ 10⁹'],
    insight:
      'The array is not what you search — the ANSWER is. Candidate speeds run from 1 to `max(piles)`, and the function "can she finish at speed k?" is monotonic: if k works, every larger speed works too. That monotonicity is the only thing binary search ever needs, so you can bisect the answer space and evaluate a feasibility check at each step.\n\nRecognising this family is high value, because the problems do not look like search problems. Minimum capacity to ship packages in D days, splitting an array to minimise the largest sum, minimum time to finish tasks — all of them are: define `feasible(x)`, prove it is monotonic, then binary search x. The cost is O(log(range)) checks rather than the whole range.\n\nThe implementation detail: `math.ceil(p / mid)` is right because a partial pile still costs a whole hour. `-(-p // mid)` is the integer-only spelling if floats worry you, and on large inputs they should.',
  },
  'py-search-2d-matrix': {
    why: 'A sorted 2D grid is just one long sorted list if you map an index to (row, col). Treating structure as a flat space is a handy reframing trick.',
    constraints: [
      '1 ≤ rows, cols ≤ 100',
      "each row is sorted, and each row's first > previous row's last",
    ],
    insight:
      'Given those constraints the matrix is already one sorted sequence that has been wrapped into rows, so the right move is to stop treating it as 2-D. Search the flat index `0 .. m·n - 1` and convert on demand with `divmod`: `row = idx // cols`, `col = idx % cols`.\n\nThat conversion pair is worth memorising in both directions — it is how you flatten grids for DP tables, for union-find over a grid, and for encoding a cell as a single dict key.\n\nWorth noticing what the constraints buy: without "each row\'s first exceeds the previous row\'s last" this collapses. The variant where rows and columns are each sorted but the rows do not chain has no O(log(m·n)) answer — it is solved by walking from the top-right corner in O(m + n). Reading which guarantee you actually have is the difference between the two.',
  },

  // ── Stack ──────────────────────────────────────────────────────────────
  'py-valid-parentheses': {
    why: 'The stack "hello world": push openers, pop and match on closers. If it recognises nesting, a stack is almost always the tool.',
    constraints: ['1 ≤ len(s) ≤ 10⁴', 's contains only the characters ()[]{}'],
    insight:
      "A stack is what you reach for whenever the most recent unfinished thing is the one that must be resolved first — nesting, in other words. Brackets are the smallest possible example of a shape you will meet again in expression parsing, in recursion, and in undo history.\n\nThe part people lose points on is the two failure modes, not the matching. A closer with an EMPTY stack is a failure (`)(`), and leftover openers at the end are also a failure (`((`). Checking one and forgetting the other passes most casual tests and fails the interview's example. `return not stack` at the end is doing real work.\n\nMapping closer → opener rather than the other way round is deliberate: you look up by the character you just read, which keeps the check a single dict hit instead of a chain of comparisons.",
  },
  'py-eval-rpn': {
    why: 'Postfix evaluation is a stack in its purest form: push numbers, and on an operator pop two, combine, push back. The mental model behind how calculators actually work.',
    constraints: ['1 ≤ len(tokens) ≤ 10⁴', 'tokens are integers or the operators + - * /'],
    insight:
      'Postfix notation exists precisely so that no parentheses and no precedence rules are needed — the order of the tokens already encodes the tree. Evaluating it is one linear pass with a stack, which is why compilers and calculators convert to it.\n\nThe operand order is the classic bug: the SECOND pop is the left operand. It makes no difference for `+` and `*` and silently reverses every `-` and `/`, so it is exactly the kind of mistake that passes half the tests.\n\nThe division rule is worth internalising beyond this problem: Python\'s `//` floors (rounds toward negative infinity), so `-7 // 2` is `-4`, while most languages and most interview specs truncate toward zero, giving `-3`. `int(a / b)` truncates. Whenever a problem says "integer division", find out which one it means before you write it.',
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
    insight:
      'The move is to store, alongside each element, the answer AS OF that element. `mins[i]` is the minimum of everything at or below depth i, so popping the value and popping the remembered minimum together restores the previous state exactly — no recomputation, no scan.\n\nThat is the general technique behind O(1) queries on a stack: because a stack only ever changes at one end, any function that can be folded incrementally (min, max, sum, count) can be carried in a parallel stack. It is also why the same trick does NOT directly work on a queue, and why the queue version needs two stacks.\n\nThe wider habit: when an operation is asked to be O(1) and the obvious answer is a scan, ask what you could have written down earlier that would make the scan unnecessary. Precomputed state is nearly always the answer.',
  },
  'py-car-fleet': {
    why: 'Sort by position, then a stack of arrival times collapses cars into fleets. Shows how the right ordering turns a messy simulation into a single clean pass.',
    constraints: ['1 ≤ len(position) ≤ 10⁵', '0 ≤ position[i] < 10⁶', '0 < speed[i] ≤ 10⁶'],
    insight:
      'The reframing is the whole problem: a car is not really described by its position and speed but by its ARRIVAL TIME, `(target - pos) / spd`. Once every car is one number, the question "do these merge?" becomes "does the one behind arrive no later than the one ahead?"\n\nProcessing from the car closest to the target backwards is what makes it a stack problem: each new arrival time either exceeds everything ahead of it — a new fleet — or it is swallowed by the fleet in front, because catching up means being blocked. Only the fleet leaders\' times ever stay on the stack, so its final height is the answer.\n\nThe transferable step is the first one. A surprising number of hard-looking problems become easy after you replace each item with the single number that actually decides the outcome — arrival time here, slope in Max Points on a Line, end time in interval scheduling.',
  },
  'py-largest-rectangle': {
    why: 'The monotonic stack at its most powerful: each bar is popped when a shorter bar bounds its rectangle. Hard, but the payoff cements the pattern for good.',
    constraints: ['1 ≤ len(heights) ≤ 10⁵', '0 ≤ heights[i] ≤ 10⁴'],
    insight:
      'Every rectangle is limited by its shortest bar, so the real question for each bar is: how far left and right can I extend before hitting something shorter? A monotonic increasing stack answers both at once — a bar is popped exactly when the first shorter bar to its right appears, and the index it inherited on the way in records how far left it reached.\n\nThat inheritance (`start = idx`) is the subtle line. When a taller bar is popped, the new bar can extend back to where the popped one began, because everything between them was at least as tall. Getting this wrong gives widths that are too small and an answer that is close but never right.\n\nThe sentinel `+ [0]` is a technique in itself: appending a value that forces every remaining item to be flushed removes the duplicate clean-up loop after the main loop. Reach for a sentinel whenever "and then handle the leftovers" would repeat code you have already written.\n\nThis stack answers "nearest smaller element" in general — the same machine solves Daily Temperatures, Next Greater Element and Maximal Rectangle.',
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
    constraints: [
      '0 ≤ nodes in each list ≤ 50',
      '-100 ≤ node value ≤ 100',
      'both lists are sorted ascending',
    ],
    insight:
      'This is the merge half of merge sort, and it is worth being able to write without thinking. Two fingers, always take the smaller, and — the part people forget — drain whatever is left over when one side runs out. That `extend` of the tail is not an edge case bolted on; it is half the algorithm.\n\nWhy refuse `sorted(l1 + l2)`? Not because it is slow in practice, but because the merge is a building block. Merge sort, the merge step in Merge K Sorted Lists, merging intervals and merging two sorted database scans are all this loop. Sorting throws away the ordering you were handed and pays O(n log n) to rebuild it.\n\n`<=` rather than `<` keeps equal elements in their original relative order — that is what makes a sort STABLE, and stability is a real requirement whenever you sort by one key after already sorting by another.',
  },
  'py-reorder-list': {
    why: 'Three techniques in one: find the middle (slow/fast), reverse the second half, then weave the halves together. A great test of pointer fluency.',
    constraints: ['1 ≤ number of nodes ≤ 5·10⁴', '1 ≤ node value ≤ 1000'],
    insight:
      'The pattern to see through the wrapping: alternating between the two ends of a sequence is two indices walking inward with a flag, and it costs no extra space. Reaching for a deque works and reads nicely, but it copies the whole sequence first.\n\n`while lo <= hi` with `<=`, not `<`, is what makes the odd-length case land — the middle element is taken exactly once. Off-by-one at the meeting point is the only bug this problem has, so build it from a 3-element and a 4-element example rather than reasoning in the abstract.\n\nOn a real linked list the same result needs three separate techniques: fast/slow pointers to find the middle, reversing the second half in place, then weaving. Knowing the value-array version first means the pointer version is only about the plumbing.',
  },
  'py-remove-nth-end': {
    why: 'The gap trick: advance one pointer n steps first, then move both until it hits the end — now the other sits just before the target. One clean pass, no length count.',
    constraints: ['1 ≤ number of nodes ≤ 30', '1 ≤ n ≤ number of nodes'],
    insight:
      'On an array the answer is arithmetic — the n-th from the end is index `len - n` — and that IS the two-pass solution, just with the counting already done for you.\n\nThe idea worth taking to real linked lists is the one-pass version: start two pointers, advance the first n steps ahead, then move both together. When the leading one falls off the end, the trailing one is exactly n from the end, and you never learned the length. That fixed-gap pair is the general technique for "k-th from the end" on any structure you can only traverse forwards — a stream, a file, a singly linked list.\n\nThe classic bug in the pointer version is removing the HEAD, which has no predecessor to relink. A dummy node in front of the list removes the special case entirely, the same way the sentinel `0` did in Largest Rectangle.',
  },
  'py-add-two-numbers': {
    why: 'Grade-school addition on lists: walk both, sum digit + digit + carry, and build the result. Handling the trailing carry is the classic edge case.',
    constraints: [
      '1 ≤ nodes in each list ≤ 100',
      '0 ≤ node value ≤ 9',
      'digits are stored in reverse order',
    ],
    insight:
      'The reverse-order storage is a gift, not an obstacle: addition works from the ones digit up, which is precisely the order the list gives you. That is exactly why big-integer libraries store their digits least-significant first.\n\nThe loop condition is the whole trick — `while i < len(a) or i < len(b) or carry`. All three clauses matter: unequal lengths mean one side runs out early, and a final carry means `[9] + [1]` must produce `[0, 1]`, a result LONGER than either input. Dropping that last carry is the standard failure here.\n\n`divmod(s, 10)` gives the digit and the carry in one call. And the refusal to convert to `int` and back is not pedantry: it is the difference between a solution that works on 10,000-digit numbers and one that only works because Python happens to have arbitrary-precision integers.',
  },
  'py-merge-k-lists': {
    why: 'Scale the two-list merge with a heap of the current heads (or pairwise merging). The bridge from linked lists to heaps and divide-and-conquer.',
    constraints: ['0 ≤ k ≤ 10⁴', '0 ≤ nodes per list ≤ 500', 'each list is sorted ascending'],
    insight:
      "Merging k sorted sequences is a heap problem because the only thing you ever need is the smallest of k current heads — and a heap answers that in O(log k) instead of O(k). Total cost O(N log k) beats flattening and sorting at O(N log N) whenever k is much smaller than N.\n\nThe tuple `(value, i, j)` is a detail worth stealing. The heap compares tuples element by element, so if two values tie it goes on to compare the next field; without the index `i` it would try to compare the payloads themselves and can raise TypeError on unorderable objects. Adding a unique tiebreaker to heap entries is standard practice.\n\nThe other route is pairwise merging, halving the number of lists each round — log k rounds over N items, the same O(N log k). Recognising that this is exactly merge sort's structure is the point of the problem.",
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
    insight:
      'Recurse, then combine — and here "combine" is just building the node with its children swapped. Returning a NEW node rather than mutating keeps the function pure, which is why the whole thing fits on one line.\n\nThe general shape is worth naming: a post-order transform. Solve both subtrees, then assemble the answer for this node from theirs. Diameter, Max Path Sum and Balanced Binary Tree are all the same skeleton with a different assembly step, so a problem this small is a good place to make the reflex automatic.\n\nRecursion here is really DFS with the call stack as your stack; the BFS version swaps children while walking a queue, and it is the answer to give if the interviewer says the tree is a million nodes deep and the stack would blow.',
  },
  'py-same-tree': {
    why: 'Compare two trees in lockstep: same value here, and recursively the same on both sides. The base cases (one empty, both empty) are the lesson.',
    constraints: ['0 ≤ number of nodes ≤ 100', '-10⁴ ≤ node value ≤ 10⁴'],
    insight:
      'The recursion reads directly as the definition: two trees are the same when both are empty, or both exist with equal values and their corresponding subtrees are the same. Almost every tree problem has a base case of "empty" and a recursive case that combines the children — get in the habit of writing the base case first.\n\nThe order of the guards is doing real work. `both None` must be tested before `either None`, or two empty trees report unequal. That pair of checks is the tree equivalent of the two failure modes in Valid Parentheses.\n\nStructure has to be compared as well as values: `[1,[2,None,None],None]` and `[1,None,[2,None,None]]` hold the same numbers and are not the same tree. That is precisely why serialisation for tree comparison must include null markers.',
  },
  'py-validate-bst': {
    why: 'The subtle one: a node must be inside a shrinking (low, high) range, not just bigger than its parent. Passing bounds down the recursion is a technique worth owning.',
    constraints: ['1 ≤ number of nodes ≤ 10⁴', '-2³¹ ≤ node value < 2³¹'],
    insight:
      'The reason this problem is famous is that the obvious check is wrong. Verifying each node against only its immediate children passes trees that are not BSTs — a node deep in the left subtree can exceed the ROOT while still being smaller than its own parent. The property is about all ancestors, not the parent.\n\nThe fix is to push the constraint downwards: every node inherits an open interval `(lo, hi)`, and going left tightens `hi` to the current value while going right tightens `lo`. Each node is checked against the range that its whole ancestry implies.\n\nThe other correct answer is that an inorder traversal of a BST comes out strictly increasing, so validating is just checking a sequence is sorted — a fact you will use again in Kth Smallest. Whenever a tree question involves BST ORDER, ask whether inorder makes it a sequence question.\n\nStarting bounds are ±infinity so the root is unconstrained, and `lo < v < hi` is strict because duplicates are not allowed here.',
  },
  'py-tree-diameter': {
    why: 'Compute height and update a global "best path through this node = left height + right height" in one pass. The "return one thing, track another" trick.',
    constraints: ['1 ≤ number of nodes ≤ 10⁴', '-100 ≤ node value ≤ 100'],
    insight:
      'The load-bearing idea is that one recursive call can return one thing while updating another. `depth` returns the height for its parent to use, but on the way out it also folds `l + r` into a running best. Computing height separately at every node re-walks each subtree and turns O(n) into O(n²).\n\nThat split — RETURN what your parent needs, RECORD what the answer needs — is the template for a whole family of tree problems. Max Path Sum is the identical shape with sums instead of counts; House Robber on a tree, Balanced Binary Tree and Longest Univalue Path all reuse it. If a tree problem feels like it needs two passes, ask what single value the parent actually needs and carry the rest in a `nonlocal`.\n\nWatch the units: the diameter counts EDGES, so it is `l + r`, not `l + r + 1`. Half the wrong answers here are off by exactly one.',
  },
  'py-level-order': {
    why: 'The BFS template on a tree: a queue processes one level at a time. Whenever a problem says "by level" or "shortest", this is the shape.',
    constraints: ['0 ≤ number of nodes ≤ 2000', '-1000 ≤ node value ≤ 1000'],
    insight:
      'BFS is the tree\'s answer to "in what order do things happen?" — every node at distance d is visited before any node at distance d + 1. That is also why BFS finds shortest paths on unweighted graphs, and this problem is the tree-shaped rehearsal for that.\n\nThe frontier-at-a-time formulation here is worth stealing: instead of a queue plus a length counter to know where a level ends, hold the whole level in a list and build the next one from it. The level boundary is then structural rather than something you have to track, and the code says what it means.\n\nThe queue version matters too: `deque.popleft()` is O(1) where `list.pop(0)` is O(n), and using a plain list as a queue is a quietly quadratic mistake that shows up in graph problems where the input is big enough to punish it.',
  },
  'py-subtree': {
    why: 'Compose two ideas: "is this the same tree?" checked at every node of the big tree. Reusing a helper as a subroutine is a real design move.',
    constraints: ['1 ≤ nodes in root ≤ 2000', '1 ≤ nodes in subRoot ≤ 1000'],
    insight:
      'Two different recursions, nested — that is the structure to notice. `same` answers "are these two trees identical?" and `walk` asks it at every node of the big tree. Building the harder function out of a smaller, already-correct one is a move worth reaching for whenever a problem contains a problem you have already solved.\n\nThe `None` handling is the trap: `walk(None)` must return whether `sub` is itself empty, not a flat False, or an empty needle is reported missing.\n\nThe O(n + m) upgrade is genuinely clever. Serialise both trees to strings with explicit null markers and delimiters, and "is a subtree" becomes "is a substring". The markers are essential — without them, values run together and unrelated trees match. It is the same lesson as Same Tree: a tree\'s shape is part of its identity, so any encoding must record the empty slots.',
  },
  'py-kth-smallest-bst': {
    why: 'An in-order walk of a BST visits values in sorted order — stop at the k-th. Knowing that BST property turns a "sort" into a partial traversal.',
    constraints: ['1 ≤ k ≤ number of nodes ≤ 10⁴', '0 ≤ node value ≤ 10⁴'],
    insight:
      'Inorder on a BST yields the values in sorted order, so the k-th smallest is the k-th value the traversal emits. The upgrade over "traverse everything, then index" is to STOP once you have counted k — the iterative form makes that possible, which is the real reason to write the traversal by hand instead of recursively.\n\nThe explicit stack is the pattern to learn: run left as far as you can, pushing as you go; pop, visit; then step right and repeat. That loop is a full inorder traversal in O(h) space with no recursion, and it is exactly what a BST iterator is inside.\n\nO(h + k) rather than O(n) matters when k is small and the tree is large. If the query happened many times with the tree changing between calls, the interviewer is looking for a subtree-size count stored on each node, turning each query into O(h) — a good "how would you scale this?" answer to have ready.',
  },
  'py-lca-bst': {
    why: 'The BST shortcut: walk down, and the first node that sits between the two targets is their lowest common ancestor. Uses ordering to skip the general-tree work.',
    constraints: [
      '2 ≤ number of nodes ≤ 10⁵',
      'all node values are unique',
      'both targets exist in the tree',
    ],
    insight:
      'On a general binary tree the lowest common ancestor needs a full search. On a BST the ordering answers it directly: if both targets are smaller than the current node, the answer lies left; if both are larger, right; and the moment they SPLIT — one on each side, or one equals the node — you are standing on it.\n\nThat split point is the whole insight, and it is why the walk is O(h) with no recursion and no extra space: the very first node between the two values is by definition their lowest common ancestor.\n\nThe general lesson is to check what the extra structure buys you before writing the generic algorithm. Reaching for the general LCA on a BST is a correct answer that says you did not notice which tree you were given — and interviewers notice that specifically.',
  },
  'py-max-path-sum': {
    why: 'A hard classic: each node returns its best downward arm, while a global tracks the best "left arm + node + right arm". The return-vs-track split at its trickiest.',
    constraints: ['1 ≤ number of nodes ≤ 3·10⁴', '-1000 ≤ node value ≤ 1000'],
    insight:
      "Two different quantities live at each node, and separating them is the entire problem. What the parent can USE is a single downward arm: `node + max(left, right)`, because a path continuing through the parent cannot fork here. What the ANSWER might be is the full bend: `node + left + right`, a path that turns at this node and goes no higher.\n\nThat is Diameter's return-one-thing-record-another skeleton again, with sums in place of depths — which is why practising the easier one first pays.\n\nThe negative handling is the second half. `max(gain(child), 0)` means a subtree that would only subtract is dropped rather than attached, since a path may always stop early. But `best` must still start at negative infinity, not 0: with every value negative the answer is the least-bad single node, and a zero start would wrongly report 0 for a path that has to contain something.",
  },

  // ── Tries ──────────────────────────────────────────────────────────────
  'py-implement-trie': {
    why: 'Build the prefix tree from scratch — insert, search, startsWith. Once you have written the node-per-character structure, prefix problems become easy.',
    constraints: [
      '1 ≤ word/prefix length ≤ 2000',
      'words consist of lowercase English letters',
      '≤ 3·10⁴ operations',
    ],
    insight:
      'A trie is a tree whose EDGES are characters, so a path from the root spells a prefix. In Python the whole structure is nested dicts, and `node.setdefault(c, {})` inserts-or-descends in one line — no node class needed.\n\nThe `\'#\'` terminal marker is the piece people miss. Without it there is no way to tell "cat is a stored word" from "cat is only a prefix of cathode", which is exactly the difference between `search` and `startsWith`. Any sentinel works as long as it cannot collide with a real character.\n\nWhat the structure buys is that every operation is O(L) in the length of the word and completely independent of how many words are stored — that is why autocomplete and spellcheck use tries rather than scanning a word list. It also shares prefixes, so common beginnings are stored once, and it is the backbone of Word Search II, where a trie lets one grid walk hunt for thousands of words at a time.',
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
    insight:
      'Python\'s `heapq` is a MIN-heap only, and the standard workaround is to push negated values so the smallest negative is the largest magnitude. Negate on the way in, negate on the way out. It is a small piece of idiom you should be able to produce instantly rather than deriving under pressure.\n\nThe reason a heap is right: you repeatedly need the two largest items from a collection that keeps changing. Re-sorting each round is O(n log n) per turn; a heap gives you the max in O(log n) and lets you push the new stone back just as cheaply.\n\nThat is the general test for reaching for a heap. Not "I need things sorted" — if you needed the whole order you would sort once — but "I need the extreme repeatedly, and the collection changes between queries."',
  },
  'py-task-scheduler': {
    why: 'Greedy + counting: schedule the most frequent task first and fill idle gaps. Teaches reasoning about "the busiest item sets the pace".',
    constraints: ['1 ≤ len(tasks) ≤ 10⁴', 'tasks are uppercase letters', '0 ≤ n ≤ 100'],
    insight:
      "The simulation with a heap and a cooldown queue works and is a fine answer. The insight is that you never have to run it: the schedule's length is decided entirely by the MOST frequent task.\n\nPicture that task's copies as fence posts. `max_count - 1` gaps sit between them, each gap holding `n + 1` slots including the task itself, and finally every task tied for the maximum adds one to the last block: `(max_count - 1) * (n + 1) + max_tasks`. If there are enough other tasks to fill all the idle slots, no idling happens at all and the answer is simply `len(tasks)` — hence the `max` of the two.\n\nThat is the greedy/counting move worth carrying: when the answer is determined by a bottleneck, compute the bottleneck instead of simulating the process. Being able to justify the formula out loud is the whole point — quoting it unexplained is worth nothing in an interview.",
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
    insight:
      'Permutations differ from combinations in exactly one way: order matters, so every remaining element is a candidate at every position, not just the ones after your last pick. That is why there is no start index here — the state is the SET of unused elements.\n\nSlicing `remaining[:i] + remaining[i+1:]` is the readable spelling and allocates a new list per branch. The in-place alternative swaps element i to the front, recurses, then swaps back — O(1) extra per level, and the same choose/undo shape you need whenever the path is mutable.\n\nKeep the cost in view: n! results, each of length n, so O(n · n!) is the floor no matter how you write it. That matters practically — a brute force over permutations of 11 items is 39.9 million orderings, which is the difference between a test suite that runs in a minute and one that runs in ten.',
  },
  'py-combination-sum': {
    why: 'Backtracking with reuse: you may pick the same number again, so recurse from the current index, not the next. Pruning when the running sum overshoots is key.',
    constraints: [
      '1 ≤ len(candidates) ≤ 30',
      '2 ≤ candidates[i] ≤ 40',
      'candidates are distinct',
      '1 ≤ target ≤ 40',
    ],
    insight:
      'Two decisions define this one. Passing `i` (not `i + 1`) to the recursive call is what allows a candidate to be reused, and starting each loop at `start` rather than 0 is what stops `[2,3]` and `[3,2]` both appearing — combinations are unordered, so you enforce non-decreasing order and get uniqueness for free.\n\nThat start-index trick is the standard way to enumerate combinations rather than permutations, and it is worth recognising instantly.\n\nSorting buys the second pruning: once `c > remaining`, every later candidate is also too big, so `break` cuts the whole tail instead of `continue`-ing through it. Small change, large effect on the search tree — and it only works because the array is sorted, which is the usual reason to sort before a backtracking search.',
  },
  'py-generate-parens': {
    why: 'Backtracking with a validity rule: only add ")" when it does not exceed the "(" placed so far. Encoding the constraint in the choices is the lesson.',
    constraints: ['1 ≤ n ≤ 8'],
    insight:
      "The lesson is PRUNING. Generating all 2^(2n) strings and filtering is correct and hopeless; instead the two counters make an invalid string impossible to build. You may open while `o < n`, and you may close only while `c < o` — that single condition is what enforces well-formedness, because a closer can never outnumber the openers before it.\n\nThat is the difference between brute force with a filter at the end and real backtracking: kill the branch at the moment it becomes impossible, not after it is finished. Every backtracking problem is this question — what is the earliest point at which I can know this path is dead?\n\nNo explicit undo appears here because strings are immutable, so `s + '('` builds a new one and the old is untouched. When the path is a LIST, you must `pop()` after the recursive call — the source of most backtracking bugs.",
  },
  'py-subsets-ii': {
    why: 'Subsets with duplicates: sort first, then skip a value equal to its predecessor at the same depth. The canonical "avoid duplicate branches" move.',
    constraints: ['1 ≤ len(nums) ≤ 10', '-10 ≤ nums[i] ≤ 10'],
    insight:
      'Deduplication is the whole problem, and the technique is to sort first so equal values sit together, then skip a value that repeats at the SAME decision level: `if j > i and nums[j] == nums[j-1]: continue`. Choosing `[2]` from the first 2 and choosing it from the second 2 produce identical subsets, so the second choice is refused.\n\nThe `j > i` half is what keeps it correct rather than merely deduplicated: it allows a duplicate to be used DEEPER in the same path, so `[2, 2]` is still generated. Drop it and you lose legitimate subsets — the classic wrong fix.\n\nCompare with the alternative of collecting everything and deduping through a set: same answer, but it pays to build the duplicates first. Skipping branches you know are redundant is always better than filtering afterwards, and the sort-then-skip idiom reappears in Combination Sum II and 3Sum.',
  },
  'py-word-search': {
    why: 'Backtracking on a grid: DFS from each cell, marking visited and un-marking on return. Where backtracking meets graph traversal.',
    constraints: [
      '1 ≤ rows·cols ≤ 200',
      'board and word are English letters',
      '1 ≤ len(word) ≤ 15',
    ],
    insight:
      'The technique to take away is marking the board IN PLACE and restoring it on the way out. Overwriting `board[r][c]` with a sentinel makes "already used on this path" a property of the grid rather than a separate visited set, and putting the character back after the call is what keeps it per-path rather than global.\n\nThat restore is the definition of backtracking: undo your choice so a sibling branch sees a clean board. Forget it and the first failed path poisons every subsequent one — a bug that looks like random wrong answers.\n\nNote the bounds check sits at the TOP of `dfs`, not before each of the four calls. Guarding on entry rather than at every call site is the standard grid-DFS shape and removes four duplicated conditions.\n\nOne caveat on the in-place trick: it mutates the caller\'s input. In an interview, say out loud that you restore it — and if the grid must not be touched at all, use a visited set instead.',
  },
  'py-palindrome-partition': {
    why: 'Backtracking that cuts a string: at each position, try every prefix that is a palindrome, then recurse on the rest. Combines a check with the choose/undo loop.',
    constraints: ['1 ≤ len(s) ≤ 16', 's consists of lowercase English letters'],
    insight:
      'Two ideas compose here: enumerate every cut point (the backtracking half) and test each piece (the palindrome half). Seeing a problem as "a search plus a predicate" is what makes it tractable, and it means either half can be optimised on its own.\n\nThe search itself is the standard partition template: for each `end` from `start + 1`, take `s[start:end]` as the next piece and recurse from `end`. `start == len(s)` is the success base case — you reached the end having cut the whole string.\n\nThe optimisation targets the predicate, not the search. `is_pal` costs O(n) per call and gets called repeatedly on the same substrings, so precomputing `pal[i][j]` in O(n²) makes every test O(1). Caching a repeated predicate is a move worth having ready — the same DP table is the answer to Longest Palindromic Substring and Palindromic Substrings.',
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
    insight:
      "Flood fill in its purest form: from an unvisited land cell, walk every connected land cell, and let the recursion RETURN the count so the size comes back with it — `1 + area(up) + area(down) + area(left) + area(right)`. That is the tree post-order pattern applied to a grid.\n\nMarking `seen` on ENTRY, before recursing, is what makes it linear: each cell is entered once, so the whole double loop plus the flooding is O(m·n) despite looking nested. It is the same amortisation argument as Longest Consecutive Sequence — only ever start work at a place you have not already covered.\n\nThe caveat is stack depth. A 200×200 grid of all land recurses 40,000 deep and Python's limit is about 1,000, so the iterative stack version is not merely an alternative — on large grids it is the correct answer.",
  },
  'py-rotting-oranges': {
    why: 'Multi-source BFS: all rotten oranges spread at once, one minute per BFS layer. The model for "shortest time for something to spread".',
    constraints: ['1 ≤ rows, cols ≤ 10', 'cells are 0 (empty), 1 (fresh), or 2 (rotten)'],
    insight:
      'MULTI-SOURCE BFS is the idea: start with every rotten orange already in the queue at time 0 rather than running a separate search from each. All the sources expand together and the frontier at step m is exactly the set of cells whose nearest source is m away — one traversal instead of many.\n\nThat generalises well beyond fruit. Nearest exit, distance to the closest 0, walls and gates, fire spreading through a maze — whenever you need the distance to the CLOSEST of several starting points, seed them all and run BFS once.\n\nThe minute count is BFS depth, which is why the time travels in the queue entry rather than being counted outside the loop. And the `-1` case is the detail that has to be handled deliberately: track how many fresh oranges exist and check the count at the end. An unreachable orange never enters the queue, so nothing in the traversal itself will tell you it was missed.',
  },
  'py-course-schedule': {
    why: 'Cycle detection on a dependency graph — if the prerequisites form a cycle, you can never finish. Your introduction to topological reasoning.',
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ len(prerequisites) ≤ 5000', 'pairs are distinct'],
    insight:
      '"Can I finish every course?" is "does this directed graph have a cycle?", and recognising that reframing is most of the problem. A prerequisite chain that loops back on itself is the only thing that can make it impossible.\n\nThe three-state DFS is the technique. A node is unvisited, IN PROGRESS (on the current recursion path), or finished. Meeting an in-progress node means you have looped back onto your own path — a cycle. Meeting a finished node means it was already cleared and can be skipped, and that memo is what keeps it O(V + E) instead of exponential.\n\nA two-state visited set is the classic wrong version: it cannot distinguish "on my current path" from "explored earlier and fine", so it reports cycles in a plain diamond-shaped DAG.\n\nThe other route is Kahn\'s algorithm — repeatedly remove nodes with in-degree 0; if any remain, they form a cycle. Same answer, iterative, and it produces an ordering for free, which is the next problem.',
  },
  'py-course-schedule-ii': {
    why: "Topological sort: produce an actual valid order (Kahn's algorithm with in-degrees, or DFS post-order). The ordering companion to cycle detection.",
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ len(prerequisites) ≤ numCourses·(numCourses−1)'],
    insight:
      'This is cycle detection\'s other half: not just "is there a valid order?" but "produce one". Any correct answer is a TOPOLOGICAL SORT — a linearisation where every edge points forwards.\n\nTwo standard constructions, both worth knowing. Kahn\'s: repeatedly take a node whose prerequisites are all satisfied (in-degree 0), remove it, and decrement its neighbours; if you emit fewer than n nodes, the leftovers form a cycle, so detection comes free. DFS: run the same three-state search and prepend each node when it FINISHES — the reverse post-order is a valid topological order, because a node is only finished once everything it depends on is.\n\nThe direction of the edges is the bug that catches everybody. `[course, prereq]` means the prereq must come first, so decide once whether your adjacency list points course→prereq or prereq→course, and then whether the result needs reversing. Build a two-course example and check it before writing the loop.\n\nThe pattern is everywhere real systems are: build dependencies, task schedulers, spreadsheet recalculation, module import order.',
  },
  'py-count-components': {
    why: 'Count connected components in a general graph via DFS or union-find. A clean place to meet union-find if you have not yet.',
    constraints: ['1 ≤ n ≤ 2000', '0 ≤ len(edges) ≤ n·(n−1)/2', 'no self-loops or duplicate edges'],
    insight:
      'Counting connected components is the simplest possible use of a full graph traversal: loop over all nodes, and every time you find one not yet visited, that is a NEW component — so start a search there and mark everything it can reach. The count of searches you had to start is the answer.\n\nThe outer loop is essential and easy to forget. A single BFS or DFS only ever explores one component, so a graph question about the whole graph almost always has this shape wrapped around the traversal.\n\nUnion-find is the other classic answer and is worth having ready: union every edge, then count distinct roots. With path compression and union by rank it is effectively O(E·α), it handles edges arriving one at a time (which DFS cannot), and it is the natural fit when the question becomes "are these two nodes connected?" asked repeatedly, or when you need Kruskal\'s minimum spanning tree.',
  },
  'py-pacific-atlantic': {
    why: 'Flip the question: instead of "can this cell reach both oceans?", flood *inward* from each ocean and intersect. Reversing the search direction is a powerful trick.',
    constraints: ['1 ≤ rows, cols ≤ 200', '0 ≤ height ≤ 10⁵'],
    insight:
      'Reversing the direction of the search is the move. Asking "can this cell reach the ocean?" means a search from every cell — O((m·n)²). Asking "which cells can the ocean reach, flowing UPHILL from the coast?" is two floods from the edges, O(m·n), and the answer is their intersection.\n\nThat inversion is the transferable idea: when a question asks which sources reach a target, it is often cheaper to search backwards from the target. The same trick answers "which nodes can reach node X" by walking the reversed graph once.\n\nThe comparison flips with the direction — going backwards you may step to a neighbour that is equal or HIGHER, since downhill in the real flow is uphill in the search. And two separate `seen` sets are essential: they are two independent reachability questions, and the answer is `pac & atl`.',
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
    insight:
      'This is the DP starter kit, and the whole thing is one sentence: at each house you either take it and add the best from two back, or skip it and keep the best from one back — `dp[i] = max(dp[i-1], dp[i-2] + n)`. Write that recurrence down before writing any code; every DP problem is won or lost there.\n\nBecause the recurrence only ever looks two steps back, the table is unnecessary — two variables rolling forward do the same work in O(1) space. That reduction is available whenever a 1-D recurrence has bounded lookback, and it is the standard follow-up an interviewer asks for.\n\nThe tuple assignment `prev, prev2 = max(prev, prev2 + n), prev` is doing something specific: the right-hand side is evaluated fully BEFORE either name is rebound, so the old `prev` reaches `prev2` intact. Written as two statements in the wrong order it silently computes garbage.',
  },
  'py-coin-change': {
    why: 'Unbounded DP: the fewest coins for amount a is 1 + the best over a−coin. Your first "min over choices" table, and a super common interview shape.',
    constraints: ['1 ≤ len(coins) ≤ 12', '1 ≤ coins[i] ≤ 2³¹−1', '0 ≤ amount ≤ 10⁴'],
    insight:
      'This is the unbounded knapsack shape. `best[a]` is the fewest coins making amount `a`, and every coin offers one way to get there: `best[a] = min(best[a], 1 + best[a - coin])`. Building upwards from 0 means each subproblem is already solved when you need it.\n\nThe infinity sentinel is what makes "impossible" compose. An unreachable amount stays `inf`, and `1 + inf` is still `inf`, so unreachability propagates on its own instead of needing a special case at every step — then one check at the end turns it into `-1`. Using a sentinel that arithmetic carries correctly is a trick worth reusing.\n\nAnd note the greedy answer is WRONG here: with coins [1, 3, 4] and amount 6, taking the largest first gives 4+1+1 = 3 coins where 3+3 = 2 is optimal. Greedy only works for special coin systems, and being able to give that counterexample immediately is exactly what the question tests.',
  },
  'py-longest-increasing-subseq': {
    why: 'The O(n²) DP is easy; the O(n log n) patience-sorting version is a classic "can you do better?". Great for seeing two solutions of very different cleverness.',
    constraints: ['1 ≤ len(nums) ≤ 2500', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    insight:
      'The O(n²) version is the honest starting point and the recurrence is worth stating: `dp[i]` is the length of the longest increasing subsequence ENDING at i, which is 1 plus the best `dp[j]` over all earlier j with a smaller value. Defining the state as "ending here" rather than "in the first i elements" is what makes it work — the same choice that makes Kadane\'s algorithm work.\n\nThe answer is then `max(dp)`, not `dp[-1]`, because the best subsequence need not end at the last element. Reaching for `dp[-1]` out of habit is the classic slip.\n\nThe O(n log n) version is worth knowing exists: keep a list of pile tops, and for each value use `bisect_left` to replace the first top that is ≥ it, appending when none is. The list\'s LENGTH is the answer, though its contents are not a real subsequence — a distinction interviewers like to probe. It is the same patience-sorting idea behind Russian Doll Envelopes.',
  },
  'py-unique-paths': {
    why: 'Grid DP: paths to a cell = paths from above + paths from the left. The 2-D table that generalises to edit distance and min-path-sum.',
    constraints: ['1 ≤ m, n ≤ 100', 'the answer fits in a 32-bit integer'],
    insight:
      "Since every move goes right or down, the count for a cell is the count from above plus the count from the left. Rolling ONE row does the job because the row you are updating already holds the previous row's values: `row[c] += row[c-1]` adds the value from the left (already updated this pass) to the value from above (not yet overwritten). Understanding which of those two states each slot is in at the moment you read it is the key to every rolling-array DP.\n\nInitialising the row to all 1s encodes the top edge — there is exactly one way to reach any cell in the first row — which removes the boundary special cases.\n\nWorth naming the closed form too: the answer is C(m+n−2, m−1), because a path is just a choice of which of the m+n−2 moves are downward. Producing that after the DP is a strong finish.",
  },
  'py-longest-common-subseq': {
    why: 'The two-string DP grid: match extends the diagonal, mismatch takes the better neighbour. The skeleton behind edit distance and diff tools.',
    constraints: [
      '1 ≤ len(text1), len(text2) ≤ 1000',
      'strings consist of lowercase English letters',
    ],
    insight:
      'This is the parent of the string-DP family. `dp[i][j]` is the LCS of the first i characters of a and the first j of b, and the recurrence splits cleanly: if the current characters MATCH, the answer extends the diagonal (`1 + dp[i-1][j-1]`); if they do not, drop one character from one string or the other and take the better (`max(dp[i-1][j], dp[i][j-1])`).\n\nThe +1 padding and the extra row/column of zeros are not decoration — they encode "one string is empty, so the LCS is 0", which is what lets the loop run without boundary checks. That offset is why the code says `a[i-1]` while the table says `dp[i]`, and mixing those up is the standard bug.\n\nLearn this table and Edit Distance costs you nothing extra: same shape, same padding, different combination step. A rolling pair of rows drops the space to O(min(m, n)) when asked.',
  },
  'py-house-robber-ii': {
    why: 'House Robber on a circle: the first and last house are now neighbours, so run the line-DP twice (exclude one end each time). Reducing a new problem to a solved one.',
    constraints: ['1 ≤ len(nums) ≤ 100', '0 ≤ nums[i] ≤ 1000'],
    insight:
      'The technique is reduction: rather than invent a circular DP, notice that the first and last houses cannot both be robbed, so the circle is exactly two straight lines — everything except the last house, and everything except the first — and the answer is the better of the two.\n\nRunning an already-solved subroutine twice on two slices is nearly always preferable to writing a new, subtler recurrence. It reuses tested code and it is far easier to justify out loud.\n\nThe single-house case needs its own line because both slices come out empty and would answer 0. That is the recurring hazard of the technique: check what your reduction does to the smallest inputs, because slicing away an element from a one-element list leaves nothing.',
  },
  'py-longest-palindrome-substr': {
    why: 'Expand around every centre (each char and each gap) and keep the longest. A tidy O(n²) idea that beats the naive O(n³).',
    constraints: ['1 ≤ len(s) ≤ 1000', 's consists of digits and English letters'],
    insight:
      "Expanding around centres beats the DP table for this one, and the trick is realising there are 2n − 1 centres, not n: every character is a centre for odd-length palindromes, and every GAP between characters is a centre for even-length ones. Handling only the odd case is the standard bug — it finds `aba` and misses `abba`.\n\nThe expansion itself is two pointers walking outward while the characters match, so each centre costs at most O(n) and the whole thing is O(n²) with O(1) extra space — better memory than the O(n²) DP table and considerably easier to write correctly.\n\nNote the return convention: the loop exits one step past the match, so the real bounds are `l + 1, r - 1`. Off-by-one at that boundary is the only other bug this problem has.\n\n(Manacher's algorithm does it in O(n). Knowing the name and that it exists is enough; nobody expects you to derive it at a whiteboard.)",
  },
  'py-count-palindromic-substrings': {
    why: 'Same expand-around-centre engine as the longest-palindrome problem, but counting instead of maximising. Reusing a technique for a new question.',
    constraints: ['1 ≤ len(s) ≤ 1000', 's consists of lowercase English letters'],
    insight:
      'Same machine as Longest Palindromic Substring, different accumulator — and noticing that is the point. There, expansion recorded the widest span; here each successful expansion step IS one more palindrome, so you count instead of measuring.\n\nWhen two problems share a skeleton, learn the skeleton once and vary what you do at the centre of the loop. That is what turns 150 problems into about 20 techniques.\n\nThe count works out because every palindromic substring has exactly one centre, so summing over all 2n − 1 centres counts each once, with no double counting to correct for. Being able to say why the count cannot double up is the difference between having derived the solution and having remembered it.',
  },
  'py-decode-ways': {
    why: 'A 1-D DP with fiddly rules: a digit can stand alone or pair with the previous one if it is 10–26. All the learning is in the edge cases (zeros!).',
    constraints: ['1 ≤ len(s) ≤ 100', 's consists of digits and may contain leading-zero traps'],
    insight:
      "A Fibonacci-shaped recurrence with validity conditions: the number of ways to decode the first i characters is the ways for i−1 (if this digit alone is a valid letter) plus the ways for i−2 (if the last two digits form 10–26).\n\nZero is the entire difficulty. `'0'` decodes to nothing on its own, so it can only survive as the second digit of 10 or 20 — which means `'06'` is not `'6'`, and a string starting with `'0'` has zero decodings. Every wrong answer to this problem is a mishandled zero, so enumerate them deliberately: leading zero, zero after a 3–9, `'100'`, `'0'` itself.\n\n`prev2 = 1` as the base is worth pausing on. The empty prefix has exactly ONE decoding — the empty one — and that is what makes a valid two-digit opener count once rather than never. Getting an empty-case base to 1 rather than 0 is a recurring DP subtlety.",
  },
  'py-word-break': {
    why: 'DP over string positions: s[:i] is breakable if some word ends at i and s[:start] was breakable. A clean "can I reach here?" table.',
    constraints: [
      '1 ≤ len(s) ≤ 300',
      '1 ≤ len(wordDict) ≤ 1000',
      'words and s are lowercase English',
    ],
    insight:
      'The state is a boolean: `dp[i]` means "the first i characters can be segmented". The transition tries every earlier split point j, asking whether the prefix was segmentable AND the piece `s[j:i]` is a word. `dp[0] = True` is the empty-string base — the same "empty is one valid way" idea as Decode Ways.\n\nTwo details carry weight. Converting the dictionary to a SET makes each lookup O(1) instead of O(len(dict)); with a list this is quietly O(n²·W). And `break` on the first success matters because you only need existence — a fact that changes if the question becomes "return all sentences", which needs backtracking and is a genuinely different problem.\n\nThe general shape — "can this sequence be cut into valid pieces?" — recurs constantly: splitting numbers into valid IPs, parsing without a grammar, segmenting text in languages with no spaces. A trie over the dictionary is the natural upgrade when the word list is huge.',
  },
  'py-can-partition': {
    why: 'The subset-sum trick: can any subset hit total/2? A boolean DP over reachable sums — your gateway to knapsack problems.',
    constraints: ['1 ≤ len(nums) ≤ 200', '1 ≤ nums[i] ≤ 100'],
    insight:
      'First the reduction: splitting into two equal halves means finding a subset summing to `total // 2`, and an odd total is instantly impossible. Turning a partition question into a subset-sum question is the whole opening move.\n\nThen the technique — a REACHABLE SET rather than a table. Start with `{0}` and, for each number, add it to everything currently reachable. Whether the target ever appears is the answer. It is the 0/1 knapsack recurrence with the bookkeeping stripped away, and it is bounded by the target, so the set can never exceed `target + 1` entries — which is what keeps it O(n · target) rather than exponential.\n\nNote that this is PSEUDO-polynomial: it scales with the numeric target, not just the input length. That distinction is a genuinely good thing to say out loud, because it is the difference between this being efficient and merely being fast on small numbers. (A bitset — shifting an integer left by each number and OR-ing — is the same algorithm at machine speed.)',
  },
  'py-min-path-sum': {
    why: 'Grid DP with costs: cheapest way to a cell = its value + min(from above, from left). The weighted cousin of Unique Paths.',
    constraints: ['1 ≤ rows, cols ≤ 200', '0 ≤ grid[i][j] ≤ 200'],
    insight:
      'Grid DP in its plainest form: the cheapest way into a cell is its own cost plus the cheaper of the two ways in, `min(from above, from left)`. Both are already computed when you arrive, which is why a single left-to-right, top-to-bottom sweep suffices — no recursion, no revisiting.\n\nThe rolling row is the same in-place trick as Unique Paths: `dp[c]` still holds the row above until you overwrite it, and `dp[c-1]` already holds this row. The edge cases are the first row (no cell above) and the first column (no cell left), handled by their own branches.\n\nOne caveat worth having ready: this works only because movement is one-directional. Let the path move in all four directions and the problem stops being DP and becomes Dijkstra, since you could arrive at a cell from a direction you have not processed yet. Knowing which assumption is load-bearing is what lets you answer the follow-up.',
  },
  'py-edit-distance': {
    why: 'The heavyweight two-string DP: insert, delete, or replace, taking the cheapest at each cell. Master this grid and most string-DP looks familiar.',
    constraints: ['0 ≤ len(word1), len(word2) ≤ 500', 'words consist of lowercase English letters'],
    insight:
      "The Levenshtein table, and it is Longest Common Subsequence's shape with a different combination step. `dp[i][j]` is the cost to turn the first i characters of a into the first j of b. On a match the cost is the diagonal, unchanged. On a mismatch it is 1 plus the best of three neighbours, and each one names an operation: `dp[i-1][j]` is a delete, `dp[i][j-1]` is an insert, `dp[i-1][j-1]` is a replace.\n\nBeing able to point at each of the three and say which edit it represents is the difference between having understood it and having memorised it — and it is exactly what a follow-up asks.\n\nThe base row and column are non-zero here, unlike LCS: turning a length-i string into the empty string costs i deletions, so `dp[i][0] = i`. Setting them to zero out of habit is the common failure.\n\nThe table also reconstructs the actual edit script by walking backwards from `dp[m][n]` and following whichever neighbour produced each value — the same backtracking-through-a-DP-table technique that recovers the path in Unique Paths or the subsequence in LCS.",
  },
  'py-max-product-subarray': {
    why: 'A twist on Kadane: track both the max and min running product, because a negative can flip the smallest into the largest. Carrying two states is the insight.',
    constraints: [
      '1 ≤ len(nums) ≤ 2·10⁴',
      '-10 ≤ nums[i] ≤ 10',
      'every prefix product fits in 32 bits',
    ],
    insight:
      "The reason the Kadane reflex fails here is the sign flip: a large NEGATIVE product becomes the largest positive the moment it meets another negative. So the state that must be carried is a pair — the best and the worst product ending at this position — because today's minimum is tomorrow's maximum.\n\nThe third candidate, `n` alone, is what lets a run be abandoned and restarted, which is the same escape hatch that makes Kadane's reset work. It also handles a zero correctly without a special case: a zero collapses both running values and the next element starts fresh.\n\nComputing both from the SAME snapshot matters — update `cur_max` first without saving the old value and `cur_min` is computed from the new one, which is wrong. It is the same evaluation-order care as House Robber's tuple swap.\n\nThe general lesson: when a greedy or DP state is not enough, ask what other quantity could become optimal later, and carry that too.",
  },

  // ── Greedy ─────────────────────────────────────────────────────────────
  'py-max-subarray': {
    why: "Kadane's algorithm: reset the running sum whenever it drops below zero. The one-liner that everyone should be able to derive on the spot.",
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    insight:
      'A negative running total can only hurt what comes next, so drop it: keep a current sum, and whenever it goes negative reset it to the next element. Track the best sum seen along the way. That one greedy decision — "would starting fresh here be better?" — is Kadane\'s algorithm, and the same "reset when the prefix stops helping" instinct shows up in stock and gas-station problems.',
  },
  'py-jump-game': {
    why: 'Greedy reachability: sweep left to right tracking the farthest index you can reach; if you ever fall behind it, you are stuck. Simple and beautiful.',
    constraints: ['1 ≤ len(nums) ≤ 10⁴', '0 ≤ nums[i] ≤ 10⁵'],
    insight:
      'You never need to know HOW you got somewhere, only how far you can reach — so one number, the furthest index reachable so far, replaces the whole DP table. If the loop ever stands on an index beyond that reach, everything after it is unreachable too, and you can stop.\n\nThat collapse from "track every state" to "track one running bound" is what greedy means in practice, and it is the reduction to look for whenever a DP solution\'s states all feed into a single maximum.\n\nWhat makes greedy CORRECT here is worth stating: reachability is monotone — if index i is reachable then so is everything before it — so the furthest reach is a complete summary of the past. When that monotonicity fails, greedy fails, which is exactly why the greedy answer to Coin Change is wrong.',
  },
  'py-jump-game-ii': {
    why: 'Greedy BFS-by-levels: each "jump" covers a range, and you extend to the farthest reachable within it. Counting minimum jumps without any DP table.',
    constraints: [
      '1 ≤ len(nums) ≤ 10⁴',
      '0 ≤ nums[i] ≤ 1000',
      'you can always reach the last index',
    ],
    insight:
      'The reframing is that this is BFS in disguise, with the jump count as the level number. All the indices reachable in one jump form level 1, everything reachable from those is level 2, and so on — so the answer is a shortest path on an unweighted graph you never actually build.\n\n`cur_end` is the end of the current level and `farthest` is the frontier being assembled for the next one. Reaching `cur_end` means the current level is exhausted, so the jump count goes up and the frontier becomes the new level. That is a BFS queue compressed into two integers.\n\nThe loop stops at `len(nums) - 1` on purpose: arriving at the last index must not trigger another level increment. Off-by-one there is the standard bug, and it is the kind of thing to verify on a two-element input before submitting.',
  },
  'py-gas-station': {
    why: 'A greedy gem: if total gas ≥ total cost a solution exists, and the start is just after the point where the running tank dips lowest. A lovely "one pass proves it" argument.',
    constraints: ['1 ≤ len(gas) ≤ 10⁵', '0 ≤ gas[i], cost[i] ≤ 10⁴'],
    insight:
      "Two independent facts do all the work. First, if total gas is less than total cost the circuit is impossible — no starting point can help, since the sum around the loop is the same wherever you begin. Second, if the tank goes negative somewhere between i and j, then NO station in that stretch can be a valid start, because every one of them begins with less fuel than i did at that point.\n\nThat second argument is the real content. It is what licenses jumping the start all the way to `i + 1` instead of retrying each candidate, and it is why one pass suffices where the brute force needs n.\n\nThe pattern — a global feasibility check plus a local restart rule — recurs in Kadane's algorithm, which resets on a negative running sum for exactly the same reason. If you can prove a whole prefix is disqualified, discard it in one step rather than one element at a time.",
  },
  'py-hand-of-straights': {
    why: 'Greedy with a count map: always start the next group from the smallest remaining card. Teaches "commit to the forced move" reasoning.',
    constraints: ['1 ≤ len(hand) ≤ 10⁴', '0 ≤ hand[i] ≤ 10⁹', '1 ≤ groupSize ≤ len(hand)'],
    insight:
      'The greedy rule is that the SMALLEST remaining card has no choice: nothing below it exists, so it must begin a run. Once that is settled, the rest of the group is forced, and the decision is never revisited.\n\n"The extreme element has only one possible role, so handle it first and recurse on the rest" is a genuinely reusable way to find a greedy rule — and unlike a guessed heuristic, it comes with its own proof.\n\nThe efficiency detail is that a Counter over distinct values, walked in sorted key order, consumes an entire group of identical cards at once (`counts[x] -= need`) rather than pulling them one at a time. Repeatedly extracting the minimum from a heap gives the same answer and does more work.\n\nThe divisibility check up front is free and rules out the impossible case before any real work happens — always worth doing.',
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
    insight:
      'Nearly every interval problem starts with a sort, and the only real question is what to sort BY. Sorting by start time puts potentially conflicting meetings next to each other, which reduces "does any pair overlap?" from O(n²) comparisons to a single scan of neighbours.\n\nThe argument for why neighbours are enough: after sorting by start, if meeting i overlaps any later meeting, it overlaps the very next one — because that one starts earliest among them. So a conflict anywhere implies a conflict between adjacent pairs.\n\nThe boundary convention matters and should be asked about out loud: `[0,30]` and `[30,60]` do not conflict if intervals are half-open, which is why the test is `start < prev_end` and not `<=`. Getting that backwards changes the answer on exactly the case an interviewer will pick.',
  },
  'py-insert-interval': {
    why: 'Merge a single new interval into a sorted list in one pass: emit everything before it, absorb overlaps, emit the rest. Careful three-phase bookkeeping.',
    constraints: ['0 ≤ len(intervals) ≤ 10⁴', 'intervals are sorted by start and non-overlapping'],
    insight:
      'Because the input is ALREADY sorted and non-overlapping, sorting again is wasted work — the O(n) answer is three phases: copy everything that ends before the new interval starts, absorb everything that touches it while widening the bounds, then copy the rest.\n\nThat structure is the general shape for inserting into sorted data: before, overlapping, after. Naming the three phases before you write them keeps the pointer arithmetic honest.\n\nThe merge condition is `intervals[i][0] <= end`, using the RUNNING end, not the original — each absorbed interval can extend the reach and pull in the next one. And `<=` rather than `<` decides whether touching intervals like [1,3] and [3,5] merge; state your assumption, because both are defensible and the tests will pick one.',
  },
  'py-non-overlapping': {
    why: 'Greedy interval scheduling: sort by *end* and keep the earliest-finishing compatible interval — the classic proof that finishing soonest leaves the most room.',
    constraints: ['1 ≤ len(intervals) ≤ 10⁵', '-5·10⁴ ≤ start < end ≤ 5·10⁴'],
    insight:
      'Here the sort key is the whole insight: sort by END time, not by start. The interval that finishes earliest leaves the most room for everything after it, so keeping it is never worse than keeping any alternative — the classic exchange argument, and the same rule behind activity selection.\n\nThe problem also inverts nicely. "Fewest to remove" is n minus "most you can keep", and the second is easier to reason about greedily. Flipping a minimisation into the matching maximisation is a move worth trying whenever the removal version feels awkward.\n\nSorting by start instead is the wrong answer that looks right: one very long interval starting early would be kept and would block many short ones. Being able to give that counterexample is what shows the choice of key was reasoned rather than guessed.',
  },
  'py-min-meeting-rooms': {
    why: 'Count peak overlap with two sorted timelines (starts and ends) or a min-heap of end times. The "how many resources at once?" pattern.',
    constraints: ['1 ≤ len(intervals) ≤ 10⁴', '0 ≤ start < end ≤ 10⁶'],
    insight:
      "The reframe: forget the intervals and think about EVENTS on a timeline. A start is +1 room, an end is −1, and the answer is the maximum concurrent count. That turns a geometry question into a counting one.\n\nSeparating the starts and ends into two sorted lists is what makes the sweep work — the two are consumed independently, since which meeting a particular ending belongs to never matters. That is the surprising part, and it is what people miss on the first try.\n\nThe alternative is a min-heap of end times: for each meeting in start order, pop every room whose meeting has finished, then push this one; the heap's peak size is the answer. Same complexity, and it generalises better when you must report WHICH room each meeting used.\n\nThe boundary rule appears again — `s < ends[e]` means a room freed exactly at the moment another meeting begins is reusable.",
  },

  // ── Bit manipulation ───────────────────────────────────────────────────
  'py-single-number': {
    why: 'XOR everything: equal pairs cancel to 0 and the lone number survives — O(1) space, no hash set. The definitive "XOR cancels pairs" trick.',
    constraints: [
      '1 ≤ len(nums) ≤ 3·10⁴',
      'every element appears twice except one',
      '-3·10⁴ ≤ nums[i] ≤ 3·10⁴',
    ],
    insight:
      'XOR has two magic properties: x ^ x = 0 and x ^ 0 = x. Fold it across the array and every duplicated value zeroes itself out, leaving the unique one — constant space, one pass. The other bit staples: n & (n−1) clears the lowest set bit (count bits by looping it), n & 1 reads the last bit, and n >> 1 drops it. Those cover most "bit" interview questions.',
  },
  'py-count-bits': {
    why: 'DP meets bits: count[i] = count[i >> 1] + (i & 1). A clever recurrence that reuses answers you already computed.',
    constraints: ['0 ≤ n ≤ 10⁵'],
    insight:
      "The recurrence is the point: `i >> 1` is i with its last bit removed, so `bits(i) = bits(i >> 1) + (i & 1)`. Since `i >> 1 < i`, the answer is always already in the table — one pass, no recomputation, O(n) total instead of O(n log n).\n\nThis is DP on the STRUCTURE of the number rather than on an array index, which is a genuinely different way to spot a subproblem. The other standard recurrence, `bits(i) = bits(i & (i - 1)) + 1`, uses Hamming Weight's clear-lowest-set-bit trick and is equally valid.\n\nThe transferable habit: when a problem is about numbers, ask what the value looks like with one bit removed, or halved, or with its lowest set bit cleared. Any of those can be the recursive step, and each shows up in different bit problems.",
  },
  'py-hamming-weight': {
    why: 'Count set bits by repeatedly clearing the lowest one with n &= n − 1 — it loops only once per set bit. A tidy bit-trick to have in hand.',
    constraints: ['input is a 32-bit integer'],
    insight:
      '`n & (n - 1)` clears the LOWEST set bit, and that single identity is the whole solution — the loop runs once per 1-bit rather than once per position, so a number with three bits set costs three iterations regardless of width.\n\nWhy it works is worth internalising: subtracting 1 flips the lowest 1 to 0 and turns every 0 below it into 1; AND-ing with the original keeps everything above untouched and wipes out that bottom section entirely. Draw it once on `1011000` and you will not forget it.\n\nThe sibling identities belong in the same drawer: `n & -n` ISOLATES the lowest set bit (the basis of Fenwick trees), `n | (n + 1)` sets the lowest zero, and `n & (n - 1) == 0` tests for a power of two. These four turn up constantly in bit problems and in the subset-enumeration trick where a bitmask represents a set.',
  },
  'py-missing-number': {
    why: 'Two O(1)-space tricks in one problem: the sum formula n(n+1)/2 minus the actual sum, or XOR of indices and values. Nice to see both.',
    constraints: ['1 ≤ len(nums) ≤ 10⁴', 'nums holds n distinct values from 0..n with one missing'],
    insight:
      'XOR is its own inverse — `a ^ a == 0` and `a ^ 0 == a` — so XOR-ing every index together with every value cancels each matched pair and leaves precisely the number that has no partner. O(n) time, O(1) space, no set.\n\nThat cancellation property is the reason XOR keeps appearing: Single Number is the same trick with no indices, and finding two missing numbers uses it plus a bit-based split. Whenever a problem says "everything appears twice except one", XOR is the first thing to try.\n\nThe arithmetic answer — `n(n+1)/2 - sum(nums)` — is just as valid and easier to explain, with the caveat that the sum can overflow a fixed-width integer while XOR never can. Offering both, and naming that trade, is a stronger answer than either alone.',
  },
  'py-reverse-bits': {
    why: "Build the result bit by bit: shift the answer left, OR in the input's lowest bit, shift the input right. Pure bit plumbing.",
    constraints: ['input is a 32-bit unsigned integer'],
    insight:
      'Shift the result LEFT to make room, OR in the input\'s lowest bit, then shift the input RIGHT — thirty-two times. The result fills up from its most significant end while the input empties from its least significant end, and the two meet in the middle. Being able to picture that is what makes the three-line loop obvious rather than magic.\n\nThe fixed count of 32 is essential and easy to get wrong in Python, where integers have no width: the loop must run the full 32 times even after `n` becomes 0, because those remaining leading zeros are real bits that have to be shifted into place.\n\nThe follow-up — "what if this is called millions of times?" — has a good answer: cache the reversal of each byte in a 256-entry table and assemble four of them. Precomputing over a small bounded domain is the same idea as bucket sort by frequency.',
  },
  'py-sum-two-integers': {
    why: 'Add without +: XOR gives the sum-without-carry, AND-then-shift gives the carry, repeat until no carry. Shows how hardware actually adds.',
    constraints: ['-1000 ≤ a, b ≤ 1000'],
    insight:
      'Addition without `+` decomposes into two pieces: `a ^ b` is the sum with every carry ignored, and `(a & b) << 1` is exactly where the carries need to go. Feeding the second back in until it is zero performs the addition — which is, quite literally, what a ripple-carry adder does in hardware.\n\nThat is the value of the problem. It is not a trick question; it shows what `+` compiles to, and the same XOR-plus-shifted-AND decomposition is how multiplication and subtraction are built from bit operations too.\n\nIn Python the wrinkle is that integers are arbitrary precision and negatives never terminate the loop, so you mask to 32 bits with `& 0xFFFFFFFF` and then convert back to a signed value at the end. Understanding why the mask is needed — rather than copying it — is what the problem is really testing.',
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
    insight:
      'Four boundaries — top, bottom, left, right — that close in after each pass. Tracking edges rather than a position with a direction vector is what keeps the code short, since "where do I turn?" becomes "what is the current boundary?".\n\nThe two extra `if` checks before the bottom row and the left column are the whole difficulty. In a single-row or single-column remainder the first two passes already consumed everything, and without those guards the same cells are emitted a second time in reverse. Test a 1×n and an n×1 matrix — that is where every implementation of this breaks.\n\nThe alternative worth knowing is elegant: take the first row, then rotate the remaining matrix counter-clockwise and repeat. It is four lines with `zip(*matrix)`, at the cost of copying the matrix each round.',
  },
  'py-happy-number': {
    why: 'Cycle detection outside a linked list: iterate the digit-square-sum and use a seen-set (or slow/fast) to spot a loop. Patterns transfer across shapes.',
    constraints: ['1 ≤ n ≤ 2³¹ − 1'],
    insight:
      'The technique is cycle detection, and the reframing that unlocks it is seeing the digit-square-sum as a FUNCTION being iterated: `n → f(n) → f(f(n))`. Any sequence that must stay in a finite range either reaches 1 or repeats forever, so "unhappy" and "loops" are the same thing.\n\nThe seen-set is the direct answer and is perfectly good. The upgrade is Floyd\'s tortoise and hare — advance one pointer once and the other twice, and they meet inside the cycle — which detects the loop in O(1) space with no memory of the past.\n\nThat is the point of the problem: it is Linked List Cycle wearing different clothes, and it teaches you to look for the hidden "next" function. Any iterated map over a bounded space can be handled this way, whether the successor comes from a pointer, an array index, or arithmetic.\n\nThe range is bounded because the digit-square sum of any number below 1000 stays below 1000 — worth checking, because that is what guarantees termination.',
  },
  'py-plus-one': {
    why: 'Simulate carrying across a digit array from the right — with the all-nines edge case that grows the array. Small, but the edge case teaches care.',
    constraints: [
      '1 ≤ len(digits) ≤ 100',
      '0 ≤ digits[i] ≤ 9',
      'no leading zeros (except the number 0)',
    ],
    insight:
      "The reason not to convert to `int` is not this problem, where Python would cope, but the general one: in a language with 64-bit integers, a 200-digit input overflows and the conversion answer is simply wrong. Working digit by digit is the answer that survives the constraint change.\n\nThe carry walk goes right to left and stops the moment a digit is below 9 — that digit absorbs the increment and everything to its left is untouched, so an early return is correct rather than an optimisation.\n\nThe case worth planning for is all nines, where the loop zeroes everything and falls out the bottom. The result is one digit LONGER than the input, `[1] + digits` — the same growing-result surprise as the final carry in Add Two Numbers. Whenever you write a carry loop, ask what happens when the carry survives to the end.\n\nCopying the input first keeps the function from mutating its caller's list.",
  },
  'py-pow': {
    why: 'Fast exponentiation: square the base and halve the exponent for O(log n) instead of O(n). The divide-and-conquer idea behind many "compute x^n" tasks.',
    constraints: ['-100 < x < 100', '-2³¹ ≤ n ≤ 2³¹ − 1', 'the answer fits in a double'],
    insight:
      "Exponentiation by squaring: x^n is (x²)^(n/2) when n is even, and x·x^(n−1) when it is odd — so halving n each step gives O(log n) multiplications instead of n. The iterative form reads the exponent's BITS, multiplying the running result by the current square whenever the low bit is set.\n\nThat is the same idea as binary representation itself, and it generalises far past numbers: modular exponentiation in cryptography, matrix power for Fibonacci in O(log n), and any associative operation repeated many times. If you can square it, you can do it in log time.\n\nHandling n < 0 by inverting x once at the start is cleaner than threading the sign through the loop. And the classic C-family trap — negating the most negative 32-bit integer overflows — is worth mentioning even though Python is immune, because it is exactly the follow-up an interviewer asks.",
  },
  'py-rotate-array': {
    why: 'Rotate in place with the three-reversal trick: reverse all, then reverse the two parts. A surprising, elegant O(1)-space move.',
    constraints: ['1 ≤ len(nums) ≤ 10⁵', '-2³¹ ≤ nums[i] ≤ 2³¹ − 1', '0 ≤ k ≤ 10⁵'],
    insight:
      'Slicing gives the answer in one line and costs O(n) extra space, which is the honest trade to state. `k %= n` is the line that actually matters: k can exceed the length, and rotating by n is rotating by 0. Forgetting the modulo produces an IndexError or a silently wrong answer, and `k = 0` needs a guard because `nums[-0:]` is the whole list, not an empty one — a genuine Python trap worth remembering.\n\nThe interview version is the O(1)-space one: reverse the whole array, then reverse the first k, then reverse the rest. Three reversals, in place. It is not obvious, and it is worth walking through on a small example until it is — the triple-reversal trick reappears in in-place string and word rotation problems.\n\nThe third answer, cyclic replacement, chases elements around their permutation cycles and needs `gcd(n, k)` starting points to cover them all. Knowing it exists is enough.',
  },

  // ── pandas (data track) ─────────────────────────────────────────────────
  'pd-filter-rows': {
    why: 'Filtering with a boolean mask is pandas’ answer to SQL’s WHERE — the most-used operation in data work. Learn df[df.col > x] before anything else.',
    constraints: ['the DataFrame contains the referenced numeric column', '0 ≤ rows ≤ 10⁴'],
    insight:
      '`df["score"] > threshold` does not return True or False — it returns a boolean SERIES, one value per row, and indexing a DataFrame with it keeps the rows where that Series is True. That is boolean masking, and it is the foundation of every filter you will ever write in pandas.\n\nBecause a mask is just data, masks compose: `df[(df.a > 1) & (df.b == \'x\')]`. Note `&` and `|`, not `and` and `or` — Python\'s keywords try to reduce a whole Series to one truth value and raise "truth value is ambiguous". Note also the parentheses: `&` binds tighter than `>`, so leaving them out is a syntax error rather than a subtle bug, which at least fails loudly.\n\n`reset_index(drop=True)` is here for a real reason. Filtering keeps the ORIGINAL index, so the surviving rows are numbered 0, 3, 7 — which is often fine, but any later comparison or concatenation aligns on the index and will produce surprises. `drop=True` throws the old labels away rather than storing them as a column.',
  },
  'pd-select-columns': {
    why: 'Selecting and reordering columns with df[[...]] is how you shape data for a report or a model. Know the double-bracket list-selection idiom cold.',
    constraints: ['the requested columns exist in the DataFrame'],
    insight:
      '`df[cols]` with a LIST returns a DataFrame; `df[col]` with a single string returns a Series. That distinction is the source of most beginner confusion, and it is why `df[["score"]]` and `df["score"]` look almost identical and behave differently — one is a table with one column, the other is a one-dimensional array with an index.\n\nSelecting by a list also sets the ORDER, so this doubles as the way to reorder columns.\n\nThe fuller vocabulary is worth learning here: `.loc[rows, cols]` selects by LABEL and takes both axes at once, while `.iloc[i, j]` selects by integer POSITION. Once selection and filtering combine — `df.loc[df.score > 80, ["name", "score"]]` — you can express most extraction tasks in a single expression, which is exactly what an interviewer is watching for.',
  },
  'pd-value-counts': {
    why: 'value_counts() answers "how many of each?" in one call — the fastest way to profile a categorical column, and a constant in exploratory analysis.',
    constraints: ['the column exists and its values are hashable'],
    insight:
      '`value_counts()` is `groupby(col).size()` with the result already sorted descending, and it is the fastest way to answer "what is in this column and how often?" — usually the first thing you should run on unfamiliar data.\n\nThe details that matter in practice: it EXCLUDES NaN by default (`dropna=False` counts them, and missing data is often the finding), and `normalize=True` gives proportions instead of counts.\n\nIt returns a Series whose INDEX is the distinct values and whose values are the counts. Recognising that shape is the point — from there, `.to_dict()`, `.head(5)` for the top five, or `.plot.bar()` all follow naturally, and the same index-carries-the-key shape comes back from every groupby you write.',
  },
  'pd-groupby-agg': {
    why: 'groupby → aggregate is the heart of pandas and the direct analogue of SQL GROUP BY. Split-apply-combine is the mental model behind most analytics.',
    constraints: ['the group and value columns exist'],
    insight:
      'Split-apply-combine: split the rows into groups, apply a reduction to each, combine the results into a new frame. Every groupby is that sentence, and naming which part you are choosing keeps the code clear.\n\nTwo options here are worth understanding rather than copying. `as_index=False` keeps the grouping key as a COLUMN instead of promoting it to the index — otherwise you need `.reset_index()` afterwards, which is the same thing done later. And selecting the column before aggregating (`["score"].mean()`) aggregates just that one; `.mean()` on the whole group averages every numeric column.\n\nThe scaling move is `.agg()`: `df.groupby("team").agg(avg=("score", "mean"), n=("score", "count"))` computes several aggregates with the output names supplied inline — which beats aggregating then renaming, and reads as a specification of the result you want.',
  },
  'pd-merge-frames': {
    why: 'Merging DataFrames on a key is SQL JOIN for pandas — essential whenever data spans more than one table. Know inner vs left and the on= argument.',
    constraints: ['both frames share the join-key column'],
    insight:
      '`merge` is SQL\'s JOIN, and `how` picks which one: `inner` (the default — only matching keys survive), `left`, `right`, `outer`. The default silently DROPS rows that do not match, which is the single most common source of quietly wrong analysis. Decide which join you want before you type it.\n\nThe habit to build: check the row count before and after. Growing means the key was not unique on one side and rows multiplied; shrinking means non-matching rows were dropped. Both are usually bugs, and `validate="one_to_many"` makes pandas raise instead of guessing.\n\nWhen the key columns have different names, use `left_on`/`right_on`; when overlapping non-key columns collide, `suffixes` controls the renaming rather than leaving you with `score_x` and `score_y`. And `join` (index-based) versus `merge` (column-based) is the distinction to keep straight — `merge` is nearly always what you want.',
  },
  'pd-top-n': {
    why: 'Sort then head is the "top-N" pattern — leaderboards, biggest customers, worst offenders. sort_values(...).head(n) is worth muscle memory.',
    constraints: ['the sort column exists', '0 ≤ n ≤ number of rows'],
    insight:
      '`sort_values(...).head(n)` is the direct spelling and it is fine, but `nlargest(n, "score")` says the same thing in one call and does not pay to sort the whole frame — worth knowing for large data and for showing you know the difference between "order everything" and "find the top few". It is the same distinction as heap-versus-sort in Top K Frequent.\n\n`ascending=False` is the flag that gets forgotten; sorting ascending and taking `head` returns the WORST rows, and nothing about the output announces the mistake.\n\nSorting is not stable by default with the quicksort engine, so tied rows can come back in either order — pass `kind="mergesort"` when ties must keep their original order. And `sort_values` shuffles the index along with the rows, which is why `reset_index(drop=True)` follows so often.',
  },
  'pd-handle-nan': {
    why: 'Real data has holes; dropna and fillna are how you decide what a missing value means. Cleaning is half of every data job.',
    constraints: ['the DataFrame may contain NaN in any column'],
    insight:
      'The first decision in any cleaning task is per column, not global: DROP the row (the value is required and a row without it is meaningless) or FILL it (a sensible default exists). `subset=["name"]` says the name is required; `fillna(0)` says a missing quantity means none in stock. Applying one blanket policy to a whole frame is what makes cleaning code wrong.\n\n`.copy()` after `dropna` is defensive and worth the habit: modifying a slice of a DataFrame raises `SettingWithCopyWarning` and may or may not touch the original, which is exactly the kind of bug that appears only in production.\n\nThe subtlety to carry: NaN is not equal to itself, so `df[df.x == None]` never matches anything — you need `.isna()`. That is also why `isna().sum()` per column is the standard first look at a new dataset, and why counting missing values is often the answer an interviewer actually wants.',
  },
  'pd-computed-column': {
    why: 'Deriving a new column from existing ones (vectorised, no loops) is the everyday transform — revenue = price × qty, ratios, flags. Think in whole columns.',
    constraints: ['the source columns exist and are numeric'],
    insight:
      'Vectorised arithmetic — `out["price"] * out["qty"]` multiplies the two columns element by element in compiled code, with no Python-level loop. That is the central performance idea in pandas, and it is why `df.apply(lambda row: ..., axis=1)` is a red flag: it runs your function once per row in the interpreter and is typically 10–100× slower.\n\nThe alignment rule underneath is worth knowing: the operation matches rows by INDEX, not by position. Two Series with different indexes produce NaN wherever they fail to line up — which is a feature when combining data from different sources and a trap when you assumed positional order.\n\n`.copy()` at the top keeps the function from mutating its caller\'s frame, the same discipline as copying a list before editing it. For conditional columns, reach for `np.where(cond, a, b)` or `.mask()` rather than a loop — the vectorised habit extends to branching too.',
  },

  // ── SQL (data track) ────────────────────────────────────────────────────
  'sql-select-where': {
    why: 'SELECT columns FROM table WHERE condition is the foundation every other query builds on. Filtering rows precisely is the first SQL skill interviewers check.',
    insight:
      "The clauses are written in one order and EXECUTED in another: FROM, then WHERE, then GROUP BY, then HAVING, then SELECT, then ORDER BY. That single fact explains most of SQL's rules — including why a column alias defined in SELECT cannot be used in WHERE (the alias does not exist yet) but can be used in ORDER BY (by then it does).\n\nWHERE filters ROWS before any grouping happens, which is what distinguishes it from HAVING later on.\n\nTwo habits from the start. Name your columns rather than writing `SELECT *` — the output stays stable when someone adds a column. And remember that comparing to NULL with `=` is never true: `WHERE power = NULL` returns nothing, and `IS NULL` is the only test that works. That three-valued logic is the thing SQL beginners lose the most time to.",
  },
  'sql-order-limit': {
    why: 'ORDER BY … LIMIT answers "the top few" — the most common analytics ask. Getting the sort direction and ties right is where people slip.',
    insight:
      'ORDER BY runs after the rows are chosen and LIMIT truncates last, so the pair means "rank, then take the top few". Without ORDER BY, LIMIT returns an ARBITRARY set of rows — the database is free to return them in any order, and the fact that it looks sorted on small tables is a coincidence you should not rely on.\n\nDESC applies per column, so `ORDER BY amount DESC, name` sorts by amount descending and breaks ties by name ascending. Adding a deterministic tiebreaker is what makes a top-N query reproducible.\n\nNULLs sort differently between engines (Postgres puts them last on ASC, SQLite first), so `NULLS LAST` is worth writing explicitly when it matters. And when the question becomes "top N PER GROUP", LIMIT can no longer do it — that is what window functions are for.',
  },
  'sql-count-group': {
    why: 'COUNT(*) with GROUP BY turns rows into a summary — counts per category, the bread and butter of reporting SQL.',
    insight:
      'GROUP BY collapses many rows into one row per distinct value, and every column in the SELECT must then be either a grouping key or wrapped in an aggregate. Anything else has no single value to show, which is exactly what the "column must appear in the GROUP BY clause" error is telling you.\n\nThe counting variants differ and the difference is tested: `COUNT(*)` counts ROWS, `COUNT(col)` counts non-NULL values in that column, and `COUNT(DISTINCT col)` counts distinct non-NULL values. Reaching for `COUNT(*)` when you meant `COUNT(col)` silently includes rows where the thing you are counting is missing.\n\nAlias your aggregates — `COUNT(*) AS fighters` — because the default column name is engine-specific and unusable downstream. And note that groups with zero rows cannot appear at all: to show a category with no members you need a LEFT JOIN from the category table.',
  },
  'sql-having': {
    why: 'HAVING filters groups after aggregation, which WHERE cannot — the WHERE-vs-HAVING distinction is a classic interview question.',
    insight:
      'HAVING is WHERE for GROUPS. The execution order is the whole explanation: WHERE filters rows before grouping, aggregates are computed, then HAVING filters the resulting groups. That is why an aggregate can never appear in WHERE — at that point the groups do not exist yet.\n\nUse both together deliberately, and prefer WHERE when you can: `WHERE year = 2024 ... HAVING SUM(wins) > 10` discards rows before the grouping work, so it is both clearer and cheaper than filtering afterwards.\n\nThe pattern — aggregate, then filter on the aggregate — is one of the most common real reporting shapes there is: customers with more than N orders, products whose average rating is below 3, days exceeding a threshold. Recognising it means recognising that HAVING, not a subquery, is the tool.',
  },
  'sql-inner-join': {
    why: 'INNER JOIN combines rows across tables on a key — the single most important SQL skill for real schemas. Know the ON clause cold.',
    insight:
      'A join matches rows from two tables on a condition; INNER keeps only pairs that match. Aliasing the tables (`orders o`, `customers c`) and qualifying every column is not just style — once two tables both have an `id`, an unqualified reference is ambiguous and the query fails.\n\nThe failure mode to watch for is row MULTIPLICATION. If the join key is not unique on the right-hand side, one left row pairs with several right rows and the result has more rows than you started with. Any aggregate computed after that join is then silently wrong, and it is the most common cause of inflated numbers in real reports. Check your row counts.\n\nThe ON condition is not restricted to equality — joins on ranges and on inequalities are legitimate — but equality on a key is the overwhelmingly common case, and it is what indexes make fast.',
  },
  'sql-left-join-null': {
    why: 'LEFT JOIN … WHERE right IS NULL finds "rows with no match" — customers who never ordered. The anti-join pattern interviewers love.',
    insight:
      'LEFT JOIN plus IS NULL is the standard anti-join idiom, and it deserves to be recognised on sight. The LEFT JOIN keeps every customer whether or not an order matched; unmatched customers get NULLs in every column from `orders`; filtering on `o.id IS NULL` keeps exactly those. "Find the rows with no match" is the shape.\n\nThe condition has to be on a column that is NEVER null in real matched rows — a primary key is the safe choice. Testing a nullable column instead also selects customers who DO have orders whose value happens to be missing.\n\nWhere you put the condition matters enormously: a filter in the ON clause restricts what is joined, while the same filter in WHERE runs after the join and, on a nullable column, silently turns a LEFT JOIN back into an INNER one. That is one of the highest-value SQL subtleties there is.\n\n`NOT EXISTS` expresses the same thing and is often clearer and faster; `NOT IN` looks equivalent but returns NO rows at all if the subquery yields a single NULL.',
  },
  'sql-subquery': {
    why: 'A subquery lets one query feed another — comparing each row against an aggregate (above-average, latest per group). The gateway to advanced SQL.',
    insight:
      'A scalar subquery returns exactly one value and can then be used anywhere a literal could. `WHERE power > (SELECT AVG(power) FROM fighters)` is the canonical example, and it works because the whole table has to be summarised before any row can be judged — something no single-pass WHERE clause can do.\n\nThis one is UNCORRELATED: it does not reference the outer query, so it is evaluated once. A CORRELATED subquery mentions the outer row ("above the average for their own style") and is conceptually re-evaluated per row, which is why it can be far more expensive and why a window function is usually the better tool.\n\nIndeed the window version, `AVG(power) OVER ()` or `OVER (PARTITION BY style)`, computes the same average alongside every row in one pass. Knowing when a subquery should become a window function — or a CTE, for readability — is most of what separates workable SQL from good SQL.',
  },
  'sql-window-top-per-group': {
    why: 'ROW_NUMBER() OVER (PARTITION BY … ORDER BY …) picks the top row per group with no self-join — the most-asked hard SQL pattern in data-science interviews.',
    insight:
      'Top-N-per-group is the query that GROUP BY cannot express, and the reason is worth stating: GROUP BY collapses each group to one row, so it can give you the maximum salary per role but not the NAME of the person who earns it. Window functions rank rows while keeping every row intact — that is exactly the gap they fill.\n\n`ROW_NUMBER() OVER (PARTITION BY role ORDER BY salary DESC)` numbers the rows within each role, best first. PARTITION BY is "group by, without collapsing"; ORDER BY inside OVER decides the ranking. The numbering cannot be filtered in WHERE — window functions are computed after WHERE — so the ranking must be wrapped in a subquery or CTE and filtered outside. That is not a workaround; it follows from the execution order.\n\nPick the ranking function deliberately: ROW_NUMBER breaks ties arbitrarily and gives exactly one row per group, RANK gives ties the same number and skips the next, DENSE_RANK ties without skipping. "One winner" versus "everyone tied for first" is a question worth asking out loud.\n\nThe same OVER machinery gives running totals (`SUM(...) OVER (ORDER BY date)`) and previous-row comparisons (`LAG`), which is why this is the highest-leverage thing to learn in the whole SQL track.',
  },
  // ── batch 6: the hard tier ────────────────────────────────────────────────
  'py-alien-order': {
    why: 'Topological sort disguised. The skill being tested is not the algorithm — it is noticing that a sorted list of words IS a graph, and that each adjacent pair contributes exactly one edge.',
    constraints: ['1 ≤ len(words) ≤ 100', '1 ≤ len(word) ≤ 100', 'lowercase letters only'],
    insight:
      'Two traps sink most attempts. The first: comparing every pair of words instead of adjacent ones — non-adjacent pairs add no information a chain of adjacent ones does not already give you, and they cost O(n²). The second: only the FIRST differing letter is evidence. In ["wrt", "wrf"] the w and r tell you nothing, t before f is the fact, and everything after it is unconstrained.\n\nThe invalid case is worth memorising because it is silent: ["abc", "ab"] cannot be sorted under any alphabet, since a prefix always sorts first. Miss it and you return a plausible, wrong answer. A cycle is the other failure, and Kahn’s algorithm hands it to you free — if you could not place every letter, the constraints contradict.',
  },
  'py-longest-valid-parens': {
    why: 'The problem that teaches you to put INDICES on the stack rather than characters. Balance-counting proves a string is valid; it cannot tell you where the longest valid run starts, and that gap is the whole lesson.',
    constraints: ['0 ≤ len(s) ≤ 3·10⁴', 's contains only "(" and ")"'],
    insight:
      'The reason a plain counter fails: a stray ")" splits the string, and after it you have to start measuring again — from where? The stack answers that. Its bottom entry is always the index of the last position that broke a run, seeded with -1 so the very first run has something to measure back from.\n\nThe O(1)-space version is worth understanding even though the stack is what you would write in an interview. Sweeping left to right, a surplus of ")" means the run is dead and you reset. But a surplus of "(" is undetectable that way — "(((" never resets and never scores — so the identical sweep runs backwards with the comparison flipped. Two passes, two counters, and the same answer.',
  },
  'py-n-queens': {
    why: 'The canonical constraint search. Every backtracking problem is choose → recurse → undo, and this is the one where the undo is impossible to skip and the pruning is impossible to fake.',
    constraints: ['1 ≤ n ≤ 9'],
    insight:
      'The insight that turns this from painful to routine is that both diagonals are arithmetic. Every square on a ↘ diagonal has the same row - col; every square on a ↙ diagonal has the same row + col. Three sets — columns, row - col, row + col — reduce "is this square attacked?" from a scan of the board to three hash lookups.\n\nGoing row by row is the other half: it makes a row conflict structurally impossible, so the search space is which column per row, not which square. n! in the worst case, but the pruning bites early — a bad choice in row 2 is abandoned before rows 3 through n are ever considered, which is exactly what generating all permutations first cannot do.',
  },
  'py-median-two-sorted': {
    why: 'The problem that teaches you to binary search something other than an array. There is no value to search for here — you search for the position of a cut, and the answer falls out of it.',
    constraints: ['0 ≤ m, n ≤ 1000', 'm + n ≥ 1', 'both lists are already sorted'],
    insight:
      'A median is a partition: it is the point where half the values are below and half above. So instead of hunting for a number, decide how many of the shorter list belong on the left. That single choice fixes how many of the longer list must join them, because the left half has a known size.\n\nThe cut is correct when each side’s largest left value is no bigger than the other side’s smallest right value. If a_left > b_right you took too many from a, so move left; otherwise move right. Searching the shorter list is what makes it O(log(min(m, n))) rather than O(log(m + n)).\n\nThe ±infinity sentinels do real work: they make "the cut is at the very start" and "the cut is at the very end" behave like every other case, which is how the empty-list inputs pass without a single special branch.',
  },
  'py-word-search-ii': {
    why: 'Where two patterns compose. Backtracking alone re-walks the board once per word; a trie collapses every shared prefix into one path, and the combination is the standard answer to "find many patterns in one structure".',
    constraints: ['1 ≤ rows, cols ≤ 12', '1 ≤ len(words) ≤ 3·10⁴', 'lowercase letters only'],
    insight:
      'The cost of the naive version is not the DFS, it is repetition: a thousand words starting "pre" trace that prefix a thousand times. Walking the board once while descending a trie shares that work — and the pruning is what actually saves you, because a letter with no child in the trie ends the branch after one dict lookup rather than after a full-depth walk.\n\nTwo details separate a working solution from a fast one. Popping the stored word off its terminal node as you find it keeps duplicates out without a set, and it also shrinks the trie as you go. And marking the square (board[r][c] = "#") before recursing is the "no reusing a square" rule — restoring it afterwards is the same undo as every other backtracking problem.',
  },
  'py-employee-free-time': {
    why: 'The interval problem that teaches you to throw information away. The per-person structure looks essential and is pure noise — the moment you flatten it, this becomes Merge Intervals with two extra lines.',
    constraints: [
      '1 ≤ len(schedules) ≤ 100',
      '1 ≤ intervals per person ≤ 100',
      'each person’s intervals are sorted and disjoint',
    ],
    insight:
      'The question "when is everyone free?" is the complement of "when is anyone busy?", and the second is far easier because it does not care whose interval it is. Flattening is not a shortcut here — it is the insight.\n\nThe part worth rehearsing is reading gaps off a merged list. After merging you have disjoint blocks in order, so free time is exactly `[block[i].end, block[i+1].start]` for consecutive pairs. Nothing before the first block or after the last one counts, and that falls out for free because those pairs do not exist.\n\nIn an interview, mention the k-way merge with a heap as the alternative: it avoids sorting all n intervals when the schedules are long and there are few people.',
  },
  'py-smallest-range-k-lists': {
    why: 'The k-pointer heap pattern in its purest form — the same machinery as merging k sorted lists, but the answer is a property of ALL the pointers at once rather than the stream they produce.',
    constraints: ['1 ≤ len(lists) ≤ 3500', '1 ≤ len(list) ≤ 50', 'each list is sorted ascending'],
    insight:
      'The move that unlocks it is proving which pointer to advance. The range must reach from the smallest pointed-at value to the largest. Advancing the largest leaves the low end where it is and can only raise the high end. Advancing a middle one does nothing to either bound. So only advancing the smallest can possibly shrink the range — which means there is never a choice to make, and no search.\n\nThe implementation detail that bites: a min-heap gives you the minimum cheaply and the maximum not at all, so the running high has to be maintained by hand as you push. Forget that and you get a plausible answer that is wrong on the cases where the new value is the biggest so far.\n\nStopping is the other half. The instant one list is exhausted, no further range can contain a value from every list, so the best seen is final.',
  },
  'py-word-ladder': {
    why: 'BFS on a graph that is never built. The lesson is that "graph problem" does not mean "construct a graph" — it means there are states and moves, and generating the moves on demand is usually cheaper than materialising the edges.',
    constraints: [
      '1 ≤ len(word) ≤ 10',
      '1 ≤ len(word_list) ≤ 5000',
      'all words have the same length, lowercase',
    ],
    insight:
      'Equal-cost steps means BFS, and the level you reach the target on IS the answer — no DP, no Dijkstra.\n\nThe expensive mistake is finding the edges by comparing every pair of words: O(N²·L) before the search begins. Generating a word’s neighbours instead — substitute each of 26 letters into each of L positions and keep what is in the set — costs O(26·L) per word regardless of how big the word list is. With 5,000 words that is the difference between 25 million comparisons and a few thousand.\n\nRemove a word from the pool as you ENQUEUE it, not as you dequeue it. Doing it at dequeue lets the same word be queued once per neighbour that reaches it, and the queue blows up on dense word lists.',
  },
  'py-burst-balloons': {
    why: 'The problem where the direction of thinking is the entire difficulty. The code is fifteen lines of ordinary DP; getting to it requires inverting the question, and that inversion is the transferable skill.',
    constraints: ['0 ≤ len(nums) ≤ 300', '0 ≤ nums[i] ≤ 100'],
    insight:
      'Ask which balloon to burst FIRST and the problem does not decompose: popping it makes its two neighbours adjacent, so the left and right sub-problems now influence each other and are not sub-problems at all. Every greedy heuristic dies here too — bursting the biggest first is easy to disprove.\n\nAsk which balloon bursts LAST inside a range and everything falls into place. When it goes, every other balloon in the range is already gone, so its neighbours are exactly the two balloons bounding the range — and those are outside the range, so they are untouched. Now the two sides genuinely are independent:\n\n`dp[i][j] = max over k in (i, j) of dp[i][k] + dp[k][j] + nums[i]·nums[k]·nums[j]`\n\nPadding with 1 at both ends makes the "missing neighbour counts as 1" rule vanish instead of becoming four special cases. Fill by increasing width so every sub-range is ready before it is needed.',
  },
  'py-candy': {
    why: 'The two-sweep greedy. When each element has a constraint on both sides, one pass can only ever satisfy one of them — recognising that is worth more than this specific problem.',
    constraints: ['0 ≤ len(ratings) ≤ 2·10⁴', '0 ≤ ratings[i] ≤ 2·10⁴'],
    insight:
      'Each child is constrained by the neighbour on the left and the neighbour on the right. Sweeping left to right, the right-hand neighbour has not been decided yet, so that rule cannot be enforced — and any attempt to patch it as you go cascades backwards.\n\nSo run the sweep twice with the comparison flipped, and take the `max` at each position. That max is doing real work: it takes whichever rule binds harder for that child, which is both sufficient (each rule is satisfied by one of the passes) and minimal (nothing gets more than the binding rule requires).\n\nEqual ratings are the trap. The rule only fires on strictly higher, so two equal neighbours have no constraint between them at all — [1, 2, 2] is 1 + 2 + 1 = 4, not 6. Any solution that gives equal neighbours equal sweets is over-paying.',
  },
  'py-binary-tree-cameras': {
    why: 'Greedy on a tree, and the clearest example of why bottom-up beats top-down. The moment you try to decide from the root you are guessing; deciding from the leaves you are never wrong.',
    constraints: ['1 ≤ number of nodes ≤ 1000', 'node values are irrelevant to the answer'],
    insight:
      'The reason top-down fails: a camera at the root covers the root, its two children and nothing else, while the leaves — the nodes that are hardest to reach — are left needing their own. Placing from the bottom inverts that. A leaf never gets a camera, because its parent covers it for the same price and covers two more nodes besides.\n\nThe implementation trick is returning a STATE instead of a count. Three are enough — needs covering, covered, holds a camera — and the rule at each node is short: if either child needs covering, buy one now (that child has no later chance); if either child has a camera, you are already covered; otherwise you are uncovered and it becomes your parent’s problem.\n\nThe root is the one node with nobody above it, so it needs the extra check after the walk. Forgetting that is the classic off-by-one-camera bug.',
  },
  'py-basic-calculator': {
    why: 'Parsing without a parser. It teaches the shape of every bracket problem — a stack that saves the context you are about to destroy and restores it when the bracket closes.',
    constraints: [
      '1 ≤ len(s) ≤ 3·10⁵',
      'only digits, "+", "-", "(", ")" and spaces',
      'the expression is always valid',
    ],
    insight:
      'Because there is no `*` or `/`, there is no precedence, and without precedence you do not need an expression grammar — a running total plus a running sign is a complete evaluator.\n\nWhat you push at `(` is the thing people get wrong. You must push BOTH the total so far and the sign sitting in front of the bracket. Push only the total and `2-(5-6)` evaluates as `2+(5-6)`: the answer becomes 1 instead of 3, and it looks right on every test where the bracket is preceded by `+`.\n\nUnary minus needs no special case at all, which surprises people. `-2+1` starts with the total at zero, so the first `-` is applied to zero and the arithmetic is already correct.',
  },
  'py-russian-doll-envelopes': {
    why: 'The problem that teaches you to remove a dimension with a sort. Two-dimensional nesting looks like it needs 2-D DP; the right sort makes it the 1-D problem you already know.',
    constraints: ['1 ≤ len(envelopes) ≤ 10⁵', '1 ≤ width, height ≤ 10⁵'],
    insight:
      'Sorting by width handles one dimension: from then on, any subsequence is already non-decreasing in width, so only the heights need to increase.\n\nExcept that equal widths ruin it. Two envelopes of the same width can never nest, but after a plain width sort their heights sit next to each other and an LIS will happily use both. The fix is to sort by width ascending and height **descending**, so within a width the heights go down and no increasing subsequence can pick two of them. The constraint is enforced by the ordering rather than by a test inside the loop — that is the transferable idea.\n\nAfter that it is patience-sorting LIS. Worth knowing that the `tails` array is not itself a valid chain of envelopes; it only records the smallest possible tail for each achievable length, which is all you need to report the length.',
  },
  'py-first-missing-positive': {
    why: 'The canonical "use the array as the hash table" problem. Constant space is not a detail here — it is the entire question, and the reasoning that unlocks it is a counting argument, not a coding trick.',
    constraints: ['0 ≤ len(nums) ≤ 10⁵', 'values may be negative, zero or duplicated'],
    insight:
      'Start with the counting argument, because everything follows from it: n numbers can block at most n of the values 1..n, so the answer is somewhere in 1..n+1. Anything negative, zero, or larger than n is irrelevant and can be ignored entirely.\n\nThat licenses the array to be storage. Put value v at index v-1, and afterwards the first index disagreeing with its slot names the answer. Two loop details decide whether it works: use `while` rather than `if`, because a swap drops a new value at position i that may itself belong elsewhere; and guard with `nums[nums[i] - 1] != nums[i]`, comparing VALUES not indices, or a duplicated value swaps with its twin forever.\n\nIn an interview, write the set version first and say out loud that it is O(n) space, then improve it. It shows you know what the constraint is actually asking for.',
  },
  'py-max-points-line': {
    why: 'A geometry problem whose difficulty is entirely numerical. The algorithm is a nested loop; getting the right answer depends on refusing to use floating point.',
    constraints: ['1 ≤ len(points) ≤ 300', '-10⁴ ≤ x, y ≤ 10⁴', 'points may repeat'],
    insight:
      'Every line with at least two points passes through some point, so fixing each point and grouping the rest by slope is guaranteed to find the best line. The algorithm is that simple.\n\nThe trap is the slope. `dy / dx` is a float: at large coordinates two genuinely different slopes round to the same value, and a vertical line divides by zero. Store `(dx, dy)` reduced by their gcd instead — exact, and vertical becomes `(0, 1)` with no special case.\n\nTwo finishing touches. Normalise the sign, or `(1, 2)` and `(-1, -2)` are recorded as different directions along the same line and the count splits in half. And handle exact duplicates separately: they lie on every line through the fixed point and have no slope of their own, so they are added to whichever group turns out largest.',
  },
};
