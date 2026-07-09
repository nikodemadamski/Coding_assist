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
};
