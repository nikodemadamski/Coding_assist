// Seed question bank: 14 python + 8 pandas + 8 sql = 30 questions, aligned to
// a 12-week Python/pandas/SQL rebuild. Every reference solution here is
// executed against every test by `npm test` (tests/run-seed-tests.mjs).
//
// Question shape:
//   python/pandas: function_name, starter_code, tests: [{ args, expected }]
//     - pandas: an arg of shape { "__df__": [ {col: val}, ... ] } is converted
//       to a DataFrame before the call; expected DataFrames are records-orient
//       JSON. Series results are compared as lists.
//   sql: sql_setup (CREATE TABLE + INSERTs), expected_rows, order_matters?

const PYTHON_QUESTIONS = [
  {
    id: 'py-char-frequency',
    track: 'python',
    title: 'Character frequency',
    difficulty: 'easy',
    pattern: 'frequency-dict',
    description:
      'Given a string `s`, return a dict mapping each character to how many times it appears.\n\nThis is the bread-and-butter counting pattern — build it by hand with `dict.get` before you ever reach for `collections.Counter`.',
    examples: ['char_frequency("banana")  ->  {"b": 1, "a": 3, "n": 2}', 'char_frequency("")  ->  {}'],
    function_name: 'char_frequency',
    starter_code: 'def char_frequency(s):\n    # return {char: count}\n    ...\n',
    tests: [
      { args: ['banana'], expected: { b: 1, a: 3, n: 2 } },
      { args: [''], expected: {} },
      { args: ['aaa'], expected: { a: 3 } },
      { args: ['abcabc'], expected: { a: 2, b: 2, c: 2 } },
      { args: ['AaA'], expected: { A: 2, a: 1 } },
    ],
    hint: 'Loop over the string; `counts[ch] = counts.get(ch, 0) + 1` handles both the first and repeat sightings.',
    solution:
      'def char_frequency(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    return counts\n',
  },
  {
    id: 'py-common-elements',
    track: 'python',
    title: 'Common elements',
    difficulty: 'easy',
    pattern: 'sets',
    description:
      'Given two lists `a` and `b`, return a **sorted list** of the distinct elements that appear in both.\n\nSets make this a one-liner — know your `&`, `|`, and `-` operators.',
    examples: ['common_elements([1, 2, 3], [2, 3, 4])  ->  [2, 3]', 'common_elements([1, 2], [3, 4])  ->  []'],
    function_name: 'common_elements',
    starter_code: 'def common_elements(a, b):\n    # return sorted list of distinct shared elements\n    ...\n',
    tests: [
      { args: [[1, 2, 3], [2, 3, 4]], expected: [2, 3] },
      { args: [[1, 1, 2], [1, 3]], expected: [1] },
      { args: [[1, 2], [3, 4]], expected: [] },
      { args: [['b', 'a', 'c'], ['c', 'a', 'd']], expected: ['a', 'c'] },
      { args: [[], [1]], expected: [] },
    ],
    hint: 'Convert both lists to sets, intersect with `&`, then `sorted(...)` the result.',
    solution: 'def common_elements(a, b):\n    return sorted(set(a) & set(b))\n',
  },
  {
    id: 'py-invert-dict',
    track: 'python',
    title: 'Invert a dict',
    difficulty: 'easy',
    pattern: 'dict-items',
    description:
      'Given a dict `d` whose values are unique, return a new dict swapping keys and values.\n\nBecause every value is unique, no information is lost in the swap.',
    examples: ['invert_dict({"a": 1, "b": 2})  ->  {1: "a", 2: "b"}'],
    function_name: 'invert_dict',
    starter_code: 'def invert_dict(d):\n    # values are unique — swap keys and values\n    ...\n',
    tests: [
      { args: [{ a: 1, b: 2 }], expected: { 1: 'a', 2: 'b' } },
      { args: [{}], expected: {} },
      { args: [{ x: 'y' }], expected: { y: 'x' } },
      { args: [{ one: 1, two: 2, three: 3 }], expected: { 1: 'one', 2: 'two', 3: 'three' } },
    ],
    hint: 'A dict comprehension over `d.items()`: `{v: k for k, v in d.items()}`.',
    solution: 'def invert_dict(d):\n    return {v: k for k, v in d.items()}\n',
  },
  {
    id: 'py-reverse-string',
    track: 'python',
    title: 'Reverse a string',
    difficulty: 'easy',
    pattern: 'strings',
    description:
      'Return the string `s` reversed.\n\nStrings are immutable in Python — there is no in-place `.reverse()` — so you must build and return a new string.',
    examples: ['reverse_string("dojo")  ->  "ojod"'],
    function_name: 'reverse_string',
    starter_code: 'def reverse_string(s):\n    ...\n',
    tests: [
      { args: ['dojo'], expected: 'ojod' },
      { args: [''], expected: '' },
      { args: ['a'], expected: 'a' },
      { args: ['ab c'], expected: 'c ba' },
      { args: ['racecar'], expected: 'racecar' },
    ],
    hint: 'Slicing with a negative step: `s[::-1]`. Or `"".join(reversed(s))`.',
    solution: 'def reverse_string(s):\n    return s[::-1]\n',
  },
  {
    id: 'py-first-unique-char',
    track: 'python',
    title: 'First unique character',
    difficulty: 'easy',
    pattern: 'frequency-dict',
    description:
      'Given a string `s`, return the **index** of the first character that appears exactly once. Return `-1` if there is none.\n\nTwo passes: count first, then scan in order. This combines the frequency dict with ordered iteration.',
    examples: ['first_unique_char("leetcode")  ->  0', 'first_unique_char("aabb")  ->  -1'],
    function_name: 'first_unique_char',
    starter_code: 'def first_unique_char(s):\n    # index of first char with count 1, else -1\n    ...\n',
    tests: [
      { args: ['leetcode'], expected: 0 },
      { args: ['loveleetcode'], expected: 2 },
      { args: ['aabb'], expected: -1 },
      { args: [''], expected: -1 },
      { args: ['z'], expected: 0 },
    ],
    hint: 'Pass 1: build a count dict. Pass 2: `for i, ch in enumerate(s)` — return the first `i` whose count is 1.',
    solution:
      'def first_unique_char(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    for i, ch in enumerate(s):\n        if counts[ch] == 1:\n            return i\n    return -1\n',
  },
  {
    id: 'py-merge-counts',
    track: 'python',
    title: 'Merge count dicts',
    difficulty: 'easy',
    pattern: 'dict-items',
    description:
      'Given two dicts of counts `a` and `b`, return a merged dict where shared keys have their values **summed**.\n\nDo not mutate the inputs.',
    examples: ['merge_counts({"a": 2}, {"a": 3, "b": 1})  ->  {"a": 5, "b": 1}'],
    function_name: 'merge_counts',
    starter_code: 'def merge_counts(a, b):\n    # sum values on key collisions; do not mutate inputs\n    ...\n',
    tests: [
      { args: [{ a: 2 }, { a: 3, b: 1 }], expected: { a: 5, b: 1 } },
      { args: [{}, {}], expected: {} },
      { args: [{ x: 1 }, {}], expected: { x: 1 } },
      { args: [{ a: 1 }, { b: 2 }], expected: { a: 1, b: 2 } },
      { args: [{ s: 10, t: 1 }, { t: 4, u: 2 }], expected: { s: 10, t: 5, u: 2 } },
    ],
    hint: 'Copy `a` with `dict(a)`, then loop `b.items()` adding with `.get(k, 0)`.',
    solution:
      'def merge_counts(a, b):\n    merged = dict(a)\n    for k, v in b.items():\n        merged[k] = merged.get(k, 0) + v\n    return merged\n',
  },
  {
    id: 'py-fizzbuzz',
    track: 'python',
    title: 'FizzBuzz',
    difficulty: 'easy',
    pattern: 'control-flow',
    description:
      'Return a list of strings for the numbers `1..n`: multiples of 3 become `"Fizz"`, multiples of 5 become `"Buzz"`, multiples of both become `"FizzBuzz"`, everything else is the number as a string.\n\nYes, it still shows up in screens. Order of the checks is the whole game.',
    examples: ['fizzbuzz(5)  ->  ["1", "2", "Fizz", "4", "Buzz"]'],
    function_name: 'fizzbuzz',
    starter_code: 'def fizzbuzz(n):\n    # list of strings for 1..n\n    ...\n',
    tests: [
      { args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
      {
        args: [15],
        expected: [
          '1',
          '2',
          'Fizz',
          '4',
          'Buzz',
          'Fizz',
          '7',
          '8',
          'Fizz',
          'Buzz',
          '11',
          'Fizz',
          '13',
          '14',
          'FizzBuzz',
        ],
      },
      { args: [0], expected: [] },
      { args: [3], expected: ['1', '2', 'Fizz'] },
    ],
    hint: 'Check `% 15` first (or `% 3 == 0 and % 5 == 0`) — otherwise Fizz or Buzz steals the FizzBuzz cases.',
    solution:
      'def fizzbuzz(n):\n    out = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            out.append("FizzBuzz")\n        elif i % 3 == 0:\n            out.append("Fizz")\n        elif i % 5 == 0:\n            out.append("Buzz")\n        else:\n            out.append(str(i))\n    return out\n',
  },
  {
    id: 'py-contains-duplicate',
    track: 'python',
    title: 'Contains Duplicate',
    difficulty: 'easy',
    pattern: 'hashing',
    description:
      'Given a list of integers `nums`, return `True` if any value appears **at least twice**, and `False` if every element is distinct.\n\nThis is the "have I seen this before?" pattern — the foundation for two-sum, anagrams, and most hashing problems.',
    examples: [
      'contains_duplicate([1, 2, 3, 1])  ->  True',
      'contains_duplicate([1, 2, 3, 4])  ->  False',
    ],
    function_name: 'contains_duplicate',
    starter_code: 'def contains_duplicate(nums):\n    # True if any value repeats\n    ...\n',
    tests: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
      { args: [[]], expected: false },
      { args: [[7]], expected: false },
      { args: [[0, 0]], expected: true },
      { args: [[-1, -1, 2]], expected: true },
    ],
    hint: 'A set drops duplicates. If the set is smaller than the list, something repeated.',
    approach:
      "Build a `set` from the list and compare lengths: `len(set(nums)) != len(nums)`. Converting to a set removes duplicates, so if the set is shorter, at least one value appeared more than once. This is O(n) time and O(n) space.\n\nThe manual version — loop with a `seen` set, return `True` the moment you re-encounter a value — is worth writing once too, because that early-exit `seen` set is the exact move behind Two Sum and Valid Anagram.",
    approaches: [
      {
        name: 'Brute force',
        complexity: 'O(n²) time, O(1) space',
        note: 'Compare every pair. Works, but slow — this is the version to move past.',
        code: 'def contains_duplicate(nums):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] == nums[j]:\n                return True\n    return False\n',
      },
      {
        name: 'Sort first',
        complexity: 'O(n log n) time, O(1) extra',
        note: 'After sorting, duplicates are neighbours — one pass finds them.',
        code: 'def contains_duplicate(nums):\n    nums = sorted(nums)\n    for i in range(1, len(nums)):\n        if nums[i] == nums[i - 1]:\n            return True\n    return False\n',
      },
      {
        name: 'Hash set',
        complexity: 'O(n) time, O(n) space',
        note: 'A set drops duplicates; if it ends up shorter than the list, something repeated.',
        code: 'def contains_duplicate(nums):\n    return len(set(nums)) != len(nums)\n',
      },
    ],
    solution: 'def contains_duplicate(nums):\n    return len(set(nums)) != len(nums)\n',
  },
  {
    id: 'py-two-sum',
    track: 'python',
    title: 'Two Sum',
    difficulty: 'easy',
    pattern: 'hashing',
    description:
      'Given a list of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`, as a list `[i, j]` with `i < j`.\n\nExactly one solution exists, and you may not use the same element twice.\n\nAim for a single pass with a dict mapping value → index.',
    examples: ['two_sum([2, 7, 11, 15], 9)  ->  [0, 1]', 'two_sum([3, 2, 4], 6)  ->  [1, 2]'],
    function_name: 'two_sum',
    starter_code:
      'def two_sum(nums, target):\n    # return [i, j] with i < j such that nums[i] + nums[j] == target\n    ...\n',
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-3, 4, 1, 90], -2], expected: [0, 2] },
      { args: [[5, 75, 25], 100], expected: [1, 2] },
    ],
    hint: 'Walk the list once. For each value, check whether `target - value` is already in a dict of seen values; if so you have your pair. Otherwise store `value -> index`.',
    approach:
      'Keep a dict mapping each value you have seen to its index. For each `n`, the number that would complete the pair is `target - n` (its *complement*). If that complement is already in the dict, you have found the answer and return `[seen[complement], i]`. Otherwise record `seen[n] = i` and move on.\n\nOne pass, O(n) time, O(n) space. The naive double loop is O(n²) — the dict trades space to remove the inner loop. Note you check the dict *before* inserting the current value, so an element is never paired with itself.',
    approaches: [
      {
        name: 'Brute force',
        complexity: 'O(n²) time, O(1) space',
        note: 'Check every pair. Correct, and the honest first instinct — but the nested loop is too slow for a big list.',
        code: 'def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n',
      },
      {
        name: 'Hash map',
        complexity: 'O(n) time, O(n) space',
        note: 'Remember each value → index as you go, and look up the complement in one pass.',
        code: 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n',
      },
    ],
    solution:
      'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n',
  },
  {
    id: 'py-valid-anagram',
    track: 'python',
    title: 'Valid anagram',
    difficulty: 'easy',
    pattern: 'hashing',
    description:
      'Given two strings `s` and `t`, return `True` if `t` is an anagram of `s` (same characters, same counts), else `False`.\n\nSolve it twice in your head: once with `sorted()`, once with a count dict. Know the trade-off (`O(n log n)` vs `O(n)`).',
    examples: ['is_anagram("anagram", "nagaram")  ->  True', 'is_anagram("rat", "car")  ->  False'],
    function_name: 'is_anagram',
    starter_code: 'def is_anagram(s, t):\n    ...\n',
    tests: [
      { args: ['anagram', 'nagaram'], expected: true },
      { args: ['rat', 'car'], expected: false },
      { args: ['', ''], expected: true },
      { args: ['ab', 'a'], expected: false },
      { args: ['aacc', 'ccac'], expected: false },
    ],
    hint: 'Shortest: `sorted(s) == sorted(t)`. Interview-grade: compare two frequency dicts.',
    approach:
      'Two strings are anagrams iff they contain the same characters with the same counts. The one-liner `sorted(s) == sorted(t)` sorts both into the same canonical order — O(n log n).\n\nThe O(n) interview answer builds a frequency dict for each string (or one dict, incrementing for `s` and decrementing for `t`) and checks they match. Same counting move as Contains Duplicate and Group Anagrams.',
    approaches: [
      {
        name: 'Sort both',
        complexity: 'O(n log n) time',
        note: 'Anagrams share the same sorted form. Shortest to write.',
        code: 'def is_anagram(s, t):\n    return sorted(s) == sorted(t)\n',
      },
      {
        name: 'Count characters',
        complexity: 'O(n) time, O(1) space (26 letters)',
        note: 'The interview answer: tally one string up, the other down, and check nothing went negative.',
        code: 'def is_anagram(s, t):\n    if len(s) != len(t):\n        return False\n    counts = {}\n    for c in s:\n        counts[c] = counts.get(c, 0) + 1\n    for c in t:\n        if counts.get(c, 0) == 0:\n            return False\n        counts[c] -= 1\n    return True\n',
      },
    ],
    solution: 'def is_anagram(s, t):\n    return sorted(s) == sorted(t)\n',
  },
  {
    id: 'py-group-anagrams',
    track: 'python',
    title: 'Group anagrams',
    difficulty: 'medium',
    pattern: 'hashing',
    description:
      'Given a list of words, group the anagrams together.\n\nReturn a **list of groups** where each group is sorted alphabetically and the groups themselves are sorted by their first word (so the output is deterministic).\n\nThe key insight: anagrams share a canonical form.',
    examples: [
      'group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])\n  ->  [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]',
    ],
    function_name: 'group_anagrams',
    starter_code:
      'def group_anagrams(words):\n    # groups sorted internally and by first word\n    ...\n',
    tests: [
      {
        args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
        expected: [['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']],
      },
      { args: [['']], expected: [['']] },
      { args: [['a']], expected: [['a']] },
      { args: [['ab', 'ba', 'abc']], expected: [['ab', 'ba'], ['abc']] },
      {
        args: [['listen', 'silent', 'enlist', 'google']],
        expected: [['enlist', 'listen', 'silent'], ['google']],
      },
    ],
    hint: 'Use `"".join(sorted(word))` as a dict key; append each word to its bucket, then sort each bucket and sort the buckets.',
    solution:
      'def group_anagrams(words):\n    groups = {}\n    for w in words:\n        key = "".join(sorted(w))\n        groups.setdefault(key, []).append(w)\n    return sorted(sorted(g) for g in groups.values())\n',
  },
  {
    id: 'py-valid-palindrome',
    track: 'python',
    title: 'Valid palindrome',
    difficulty: 'easy',
    pattern: 'two-pointers',
    description:
      'Given a string `s`, return `True` if it reads the same forwards and backwards **considering only alphanumeric characters and ignoring case**.\n\nClassic two-pointer scan — or filter-then-compare if you want the pythonic one-liner.',
    examples: [
      'is_palindrome("A man, a plan, a canal: Panama")  ->  True',
      'is_palindrome("race a car")  ->  False',
    ],
    function_name: 'is_palindrome',
    starter_code: 'def is_palindrome(s):\n    # alphanumeric only, case-insensitive\n    ...\n',
    tests: [
      { args: ['A man, a plan, a canal: Panama'], expected: true },
      { args: ['race a car'], expected: false },
      { args: [''], expected: true },
      { args: ['.,'], expected: true },
      { args: ['0P'], expected: false },
    ],
    hint: 'Build `cleaned = [c.lower() for c in s if c.isalnum()]` and compare with its reverse. For the two-pointer version, skip non-alnum chars from both ends.',
    solution:
      'def is_palindrome(s):\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]\n',
  },
  {
    id: 'py-max-profit',
    track: 'python',
    title: 'Best time to buy and sell',
    difficulty: 'medium',
    pattern: 'sliding-window',
    description:
      'Given a list `prices` where `prices[i]` is the price on day `i`, return the maximum profit from buying on one day and selling on a **later** day. Return `0` if no profit is possible.\n\nOne pass: track the lowest price seen so far and the best profit so far.',
    examples: ['max_profit([7, 1, 5, 3, 6, 4])  ->  5', 'max_profit([7, 6, 4, 3, 1])  ->  0'],
    function_name: 'max_profit',
    starter_code: 'def max_profit(prices):\n    # single buy, single later sell, 0 if never profitable\n    ...\n',
    tests: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
      { args: [[]], expected: 0 },
      { args: [[5]], expected: 0 },
      { args: [[2, 4, 1, 8]], expected: 7 },
    ],
    hint: 'For each price: first update `lowest = min(lowest, price)`, then `best = max(best, price - lowest)`.',
    approaches: [
      {
        name: 'Brute force',
        complexity: 'O(n²) time',
        note: 'Try every buy day against every later sell day. Correct but quadratic.',
        code: 'def max_profit(prices):\n    best = 0\n    for i in range(len(prices)):\n        for j in range(i + 1, len(prices)):\n            best = max(best, prices[j] - prices[i])\n    return best\n',
      },
      {
        name: 'One pass',
        complexity: 'O(n) time, O(1) space',
        note: 'Track the lowest price so far; the best sell is always today minus that minimum.',
        code: 'def max_profit(prices):\n    best = 0\n    lowest = float("inf")\n    for p in prices:\n        lowest = min(lowest, p)\n        best = max(best, p - lowest)\n    return best\n',
      },
    ],
    solution:
      'def max_profit(prices):\n    best = 0\n    lowest = float("inf")\n    for p in prices:\n        lowest = min(lowest, p)\n        best = max(best, p - lowest)\n    return best\n',
  },
  {
    id: 'py-binary-search',
    track: 'python',
    title: 'Binary search',
    difficulty: 'medium',
    pattern: 'binary-search',
    description:
      'Given a **sorted** list `nums` and a `target`, return the index of `target`, or `-1` if it is not present. Your solution must run in `O(log n)` time — no `list.index`, no linear scan.',
    examples: ['binary_search([-1, 0, 3, 5, 9, 12], 9)  ->  4', 'binary_search([-1, 0, 3], 2)  ->  -1'],
    function_name: 'binary_search',
    starter_code: 'def binary_search(nums, target):\n    # O(log n), return index or -1\n    ...\n',
    tests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[], 7], expected: -1 },
      { args: [[5], 5], expected: 0 },
      { args: [[1, 3, 5, 7, 9, 11], 11], expected: 5 },
      { args: [[1, 3], 1], expected: 0 },
    ],
    hint: 'While `lo <= hi`: `mid = (lo + hi) // 2`; equal → return; smaller → `lo = mid + 1`; bigger → `hi = mid - 1`.',
    solution:
      'def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n',
  },
  {
    id: 'py-valid-parentheses',
    track: 'python',
    title: 'Valid parentheses',
    difficulty: 'medium',
    pattern: 'stack',
    description:
      "Given a string `s` containing only `()[]{}`, return `True` if the brackets are balanced and correctly nested.\n\nThe canonical stack problem: push openers, pop and match on closers, and don't forget the two failure modes (wrong closer, leftover openers).",
    examples: ['is_valid("()[]{}")  ->  True', 'is_valid("([)]")  ->  False'],
    function_name: 'is_valid',
    starter_code: 'def is_valid(s):\n    # balanced and correctly nested?\n    ...\n',
    tests: [
      { args: ['()'], expected: true },
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
      { args: ['([)]'], expected: false },
      { args: ['{[]}'], expected: true },
      { args: [''], expected: true },
      { args: ['('], expected: false },
    ],
    hint: 'Map each closer to its opener. On a closer, the stack must be non-empty and its top must match. At the end the stack must be empty.',
    solution:
      'def is_valid(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack\n',
  },
];

const PANDAS_QUESTIONS = [
  {
    id: 'pd-filter-rows',
    track: 'pandas',
    title: 'Filter rows by threshold',
    difficulty: 'easy',
    pattern: 'filtering',
    description:
      'You get a DataFrame `df` with columns `name` and `score`. Return a DataFrame with only the rows where `score` is **strictly greater** than `threshold`, keeping the original column order and row order.\n\nReturn the filtered DataFrame (reset the index).',
    examples: [
      'filter_scores(df, 80) where df has scores [95, 62, 88]  ->  rows for the 95 and 88 entries',
    ],
    function_name: 'filter_scores',
    starter_code:
      'import pandas as pd\n\ndef filter_scores(df, threshold):\n    # return only rows with score > threshold\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', score: 95 },
              { name: 'Usopp', score: 62 },
              { name: 'Nami', score: 88 },
            ],
          },
          80,
        ],
        expected: [
          { name: 'Zoro', score: 95 },
          { name: 'Nami', score: 88 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Luffy', score: 70 },
              { name: 'Sanji', score: 70 },
            ],
          },
          70,
        ],
        expected: [],
      },
      {
        args: [{ __df__: [{ name: 'Robin', score: 100 }] }, 0],
        expected: [{ name: 'Robin', score: 100 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Chopper', score: 55 },
              { name: 'Franky', score: 81 },
              { name: 'Brook', score: 12 },
            ],
          },
          50,
        ],
        expected: [
          { name: 'Chopper', score: 55 },
          { name: 'Franky', score: 81 },
        ],
      },
    ],
    hint: 'Boolean masks: `df[df["score"] > threshold]`. Remember `.reset_index(drop=True)`.',
    solution:
      'import pandas as pd\n\ndef filter_scores(df, threshold):\n    return df[df["score"] > threshold].reset_index(drop=True)\n',
  },
  {
    id: 'pd-select-columns',
    track: 'pandas',
    title: 'Select columns',
    difficulty: 'easy',
    pattern: 'selection',
    description:
      'Given a DataFrame `df` and a list of column names `cols`, return a DataFrame containing **only** those columns.\n\nKnow the difference between `df["a"]` (a Series) and `df[["a"]]` (a DataFrame).',
    examples: ['select_columns(df, ["name", "bounty"])  ->  df with just those two columns'],
    function_name: 'select_columns',
    starter_code: 'import pandas as pd\n\ndef select_columns(df, cols):\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', age: 21, bounty: 320 },
              { name: 'Nami', age: 20, bounty: 66 },
            ],
          },
          ['name', 'bounty'],
        ],
        expected: [
          { name: 'Zoro', bounty: 320 },
          { name: 'Nami', bounty: 66 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', age: 21, bounty: 320 },
              { name: 'Nami', age: 20, bounty: 66 },
            ],
          },
          ['age'],
        ],
        expected: [{ age: 21 }, { age: 20 }],
      },
      {
        args: [{ __df__: [{ a: 1, b: 2, c: 3 }] }, ['c', 'a']],
        expected: [{ c: 3, a: 1 }],
      },
      {
        args: [{ __df__: [{ name: 'Brook', soul: 'king' }] }, ['name']],
        expected: [{ name: 'Brook' }],
      },
    ],
    hint: 'Pass the list straight into the indexer: `df[cols]`.',
    solution: 'import pandas as pd\n\ndef select_columns(df, cols):\n    return df[cols]\n',
  },
  {
    id: 'pd-value-counts',
    track: 'pandas',
    title: 'Count values in a column',
    difficulty: 'easy',
    pattern: 'groupby',
    description:
      'Given a DataFrame `df` with a `style` column, return a **dict** (a plain Python dict, not a Series) mapping each style to how many rows have it.',
    examples: ['count_styles(df with styles [a, b, a])  ->  {"a": 2, "b": 1}'],
    function_name: 'count_styles',
    starter_code: 'import pandas as pd\n\ndef count_styles(df):\n    # return {style: count}\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', style: 'three-sword' },
              { name: 'Tashigi', style: 'one-sword' },
              { name: 'Mihawk', style: 'one-sword' },
              { name: 'Kuina', style: 'one-sword' },
            ],
          },
        ],
        expected: { 'one-sword': 3, 'three-sword': 1 },
      },
      {
        args: [{ __df__: [{ name: 'Solo', style: 'fist' }] }],
        expected: { fist: 1 },
      },
      {
        args: [
          {
            __df__: [
              { name: 'A', style: 'x' },
              { name: 'B', style: 'x' },
            ],
          },
        ],
        expected: { x: 2 },
      },
      {
        args: [
          {
            __df__: [
              { name: 'A', style: 'x' },
              { name: 'B', style: 'y' },
              { name: 'C', style: 'z' },
            ],
          },
        ],
        expected: { x: 1, y: 1, z: 1 },
      },
    ],
    hint: '`df["style"].value_counts().to_dict()` — or `df.groupby("style").size().to_dict()`.',
    solution:
      'import pandas as pd\n\ndef count_styles(df):\n    return df["style"].value_counts().to_dict()\n',
  },
  {
    id: 'pd-groupby-agg',
    track: 'pandas',
    title: 'Group and aggregate',
    difficulty: 'medium',
    pattern: 'groupby',
    description:
      'Given a DataFrame `df` with columns `team` and `score`, return a DataFrame with one row per team and columns `team` and `avg_score` (the mean score), sorted by `team` ascending.\n\nNote the required shape: `team` must be a regular **column** in the result, not the index.',
    examples: [
      'team_averages(df) for red:[80, 90], blue:[90]  ->  [{team: "blue", avg_score: 90}, {team: "red", avg_score: 85}]',
    ],
    function_name: 'team_averages',
    starter_code:
      'import pandas as pd\n\ndef team_averages(df):\n    # columns: team, avg_score — sorted by team\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { team: 'red', score: 80 },
              { team: 'blue', score: 90 },
              { team: 'red', score: 90 },
            ],
          },
        ],
        expected: [
          { team: 'blue', avg_score: 90 },
          { team: 'red', avg_score: 85 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { team: 'z', score: 70 },
              { team: 'z', score: 71 },
            ],
          },
        ],
        expected: [{ team: 'z', avg_score: 70.5 }],
      },
      {
        args: [
          {
            __df__: [
              { team: 'a', score: 50 },
              { team: 'b', score: 60 },
            ],
          },
        ],
        expected: [
          { team: 'a', avg_score: 50 },
          { team: 'b', avg_score: 60 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { team: 'm', score: 1 },
              { team: 'm', score: 2 },
              { team: 'k', score: 10 },
            ],
          },
        ],
        expected: [
          { team: 'k', avg_score: 10 },
          { team: 'm', avg_score: 1.5 },
        ],
      },
    ],
    hint: '`df.groupby("team", as_index=False)["score"].mean()`, rename the column to `avg_score`, then `sort_values("team")` and reset the index.',
    solution:
      'import pandas as pd\n\ndef team_averages(df):\n    out = df.groupby("team", as_index=False)["score"].mean()\n    out = out.rename(columns={"score": "avg_score"})\n    return out.sort_values("team").reset_index(drop=True)\n',
  },
  {
    id: 'pd-merge-frames',
    track: 'pandas',
    title: 'Merge two DataFrames',
    difficulty: 'medium',
    pattern: 'merge',
    description:
      'You get `orders` (columns `order_id`, `customer_id`, `item`) and `customers` (columns `customer_id`, `name`).\n\nReturn a DataFrame with columns `order_id`, `name`, `item` — one row per order that has a matching customer (inner join) — sorted by `order_id` ascending.',
    examples: ['orders_with_names(orders, customers)  ->  order_id | name | item'],
    function_name: 'orders_with_names',
    starter_code:
      'import pandas as pd\n\ndef orders_with_names(orders, customers):\n    # inner merge on customer_id; columns order_id, name, item; sort by order_id\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { order_id: 2, customer_id: 1, item: 'katana' },
              { order_id: 1, customer_id: 2, item: 'map' },
            ],
          },
          {
            __df__: [
              { customer_id: 1, name: 'Zoro' },
              { customer_id: 2, name: 'Nami' },
            ],
          },
        ],
        expected: [
          { order_id: 1, name: 'Nami', item: 'map' },
          { order_id: 2, name: 'Zoro', item: 'katana' },
        ],
      },
      {
        args: [
          {
            __df__: [
              { order_id: 1, customer_id: 9, item: 'ghost' },
              { order_id: 2, customer_id: 1, item: 'meat' },
            ],
          },
          { __df__: [{ customer_id: 1, name: 'Luffy' }] },
        ],
        expected: [{ order_id: 2, name: 'Luffy', item: 'meat' }],
      },
      {
        args: [
          {
            __df__: [
              { order_id: 3, customer_id: 1, item: 'sake' },
              { order_id: 1, customer_id: 1, item: 'rice' },
              { order_id: 2, customer_id: 2, item: 'ink' },
            ],
          },
          {
            __df__: [
              { customer_id: 1, name: 'Zoro' },
              { customer_id: 2, name: 'Robin' },
            ],
          },
        ],
        expected: [
          { order_id: 1, name: 'Zoro', item: 'rice' },
          { order_id: 2, name: 'Robin', item: 'ink' },
          { order_id: 3, name: 'Zoro', item: 'sake' },
        ],
      },
      {
        args: [
          { __df__: [{ order_id: 1, customer_id: 5, item: 'x' }] },
          { __df__: [{ customer_id: 6, name: 'Nobody' }] },
        ],
        expected: [],
      },
    ],
    hint: '`orders.merge(customers, on="customer_id")` does the inner join; then select `[["order_id", "name", "item"]]`, sort, reset index.',
    solution:
      'import pandas as pd\n\ndef orders_with_names(orders, customers):\n    merged = orders.merge(customers, on="customer_id")\n    out = merged[["order_id", "name", "item"]]\n    return out.sort_values("order_id").reset_index(drop=True)\n',
  },
  {
    id: 'pd-top-n',
    track: 'pandas',
    title: 'Top-N by score',
    difficulty: 'easy',
    pattern: 'sorting',
    description:
      'Given a DataFrame `df` with columns `name` and `score`, return the **two** highest-scoring rows, highest first, with the index reset.\n\n`sort_values` + `head` — or look up `nlargest` for style points.',
    examples: ['top_two(df)  ->  the 2 rows with the highest score, descending'],
    function_name: 'top_two',
    starter_code: 'import pandas as pd\n\ndef top_two(df):\n    # two best rows, highest score first\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Usopp', score: 40 },
              { name: 'Zoro', score: 96 },
              { name: 'Nami', score: 88 },
              { name: 'Chopper', score: 72 },
            ],
          },
        ],
        expected: [
          { name: 'Zoro', score: 96 },
          { name: 'Nami', score: 88 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'A', score: 1 },
              { name: 'B', score: 2 },
            ],
          },
        ],
        expected: [
          { name: 'B', score: 2 },
          { name: 'A', score: 1 },
        ],
      },
      {
        args: [{ __df__: [{ name: 'Solo', score: 50 }] }],
        expected: [{ name: 'Solo', score: 50 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'C', score: 30 },
              { name: 'D', score: 10 },
              { name: 'E', score: 20 },
            ],
          },
        ],
        expected: [
          { name: 'C', score: 30 },
          { name: 'E', score: 20 },
        ],
      },
    ],
    hint: '`df.sort_values("score", ascending=False).head(2).reset_index(drop=True)`.',
    solution:
      'import pandas as pd\n\ndef top_two(df):\n    return df.sort_values("score", ascending=False).head(2).reset_index(drop=True)\n',
  },
  {
    id: 'pd-handle-nan',
    track: 'pandas',
    title: 'Handle missing values',
    difficulty: 'medium',
    pattern: 'missing-data',
    description:
      'Given an inventory DataFrame `df` with columns `name` and `qty`:\n\n1. **Drop** rows where `name` is missing.\n2. **Fill** missing `qty` with `0`.\n\nReturn the cleaned DataFrame with the index reset. (In the test data, missing values arrive as `null`/`None`.)',
    examples: ['clean_inventory(df)  ->  rows with a name, qty never NaN'],
    function_name: 'clean_inventory',
    starter_code:
      'import pandas as pd\n\ndef clean_inventory(df):\n    # drop rows with missing name, fill missing qty with 0\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'katana', qty: 3 },
              { name: null, qty: 5 },
              { name: 'map', qty: null },
            ],
          },
        ],
        expected: [
          { name: 'katana', qty: 3 },
          { name: 'map', qty: 0 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'sake', qty: 2 },
              { name: 'rice', qty: 1 },
            ],
          },
        ],
        expected: [
          { name: 'sake', qty: 2 },
          { name: 'rice', qty: 1 },
        ],
      },
      {
        args: [{ __df__: [{ name: null, qty: 1 }] }],
        expected: [],
      },
      {
        args: [
          {
            __df__: [
              { name: 'a', qty: null },
              { name: 'b', qty: null },
            ],
          },
        ],
        expected: [
          { name: 'a', qty: 0 },
          { name: 'b', qty: 0 },
        ],
      },
    ],
    hint: '`df.dropna(subset=["name"])` then assign `df["qty"] = df["qty"].fillna(0)`. Copy first to avoid the SettingWithCopy warning.',
    solution:
      'import pandas as pd\n\ndef clean_inventory(df):\n    out = df.dropna(subset=["name"]).copy()\n    out["qty"] = out["qty"].fillna(0)\n    return out.reset_index(drop=True)\n',
  },
  {
    id: 'pd-computed-column',
    track: 'pandas',
    title: 'Add a computed column',
    difficulty: 'easy',
    pattern: 'transform',
    description:
      'Given a DataFrame `df` with columns `item`, `price`, and `qty`, return the DataFrame with an added column `total` equal to `price * qty`.\n\nVectorized arithmetic — no loops, no `.apply`.',
    examples: ['add_total(df)  ->  same rows plus a total column'],
    function_name: 'add_total',
    starter_code:
      'import pandas as pd\n\ndef add_total(df):\n    # add total = price * qty\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { item: 'onigiri', price: 2.5, qty: 4 },
              { item: 'sake', price: 10, qty: 2 },
            ],
          },
        ],
        expected: [
          { item: 'onigiri', price: 2.5, qty: 4, total: 10 },
          { item: 'sake', price: 10, qty: 2, total: 20 },
        ],
      },
      {
        args: [{ __df__: [{ item: 'tea', price: 1.5, qty: 3 }] }],
        expected: [{ item: 'tea', price: 1.5, qty: 3, total: 4.5 }],
      },
      {
        args: [{ __df__: [{ item: 'water', price: 0, qty: 9 }] }],
        expected: [{ item: 'water', price: 0, qty: 9, total: 0 }],
      },
      {
        args: [{ __df__: [{ item: 'refund', price: 3, qty: -1 }] }],
        expected: [{ item: 'refund', price: 3, qty: -1, total: -3 }],
      },
    ],
    hint: '`df["total"] = df["price"] * df["qty"]` — pandas multiplies the whole columns element-wise.',
    solution:
      'import pandas as pd\n\ndef add_total(df):\n    out = df.copy()\n    out["total"] = out["price"] * out["qty"]\n    return out\n',
  },
];

const SQL_QUESTIONS = [
  {
    id: 'sql-select-where',
    track: 'sql',
    title: 'Strong swordsmen',
    difficulty: 'easy',
    pattern: 'select-where',
    description:
      'The table `fighters(name, style, power)` lists dojo members. Select the `name` and `power` of every fighter with `power` of at least 80, strongest first.',
    examples: ['Result columns: name, power — ordered by power descending.'],
    function_name: '',
    starter_code: '-- fighters(name TEXT, style TEXT, power INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE fighters (name TEXT, style TEXT, power INTEGER);\nINSERT INTO fighters VALUES\n ('Zoro', 'three-sword', 96),\n ('Tashigi', 'one-sword', 74),\n ('Mihawk', 'one-sword', 99),\n ('Johnny', 'two-sword', 41),\n ('Kuina', 'one-sword', 80);",
    expected_rows: [
      ['Mihawk', 99],
      ['Zoro', 96],
      ['Kuina', 80],
    ],
    order_matters: true,
    tests: [],
    hint: '`WHERE power >= 80` then `ORDER BY power DESC`.',
    solution: 'SELECT name, power\nFROM fighters\nWHERE power >= 80\nORDER BY power DESC;',
  },
  {
    id: 'sql-order-limit',
    track: 'sql',
    title: 'Three biggest bounties',
    difficulty: 'easy',
    pattern: 'order-limit',
    description:
      'The table `bounties(name, amount)` holds bounties in millions. Return the `name` and `amount` of the **three largest** bounties, largest first.',
    examples: ['Exactly 3 rows, ordered by amount descending.'],
    function_name: '',
    starter_code: '-- bounties(name TEXT, amount INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE bounties (name TEXT, amount INTEGER);\nINSERT INTO bounties VALUES\n ('Luffy', 3000),\n ('Law', 500),\n ('Kid', 470),\n ('Buggy', 3189),\n ('Zoro', 1111);",
    expected_rows: [
      ['Buggy', 3189],
      ['Luffy', 3000],
      ['Zoro', 1111],
    ],
    order_matters: true,
    tests: [],
    hint: '`ORDER BY amount DESC LIMIT 3`.',
    solution: 'SELECT name, amount\nFROM bounties\nORDER BY amount DESC\nLIMIT 3;',
  },
  {
    id: 'sql-count-group',
    track: 'sql',
    title: 'Fighters per style',
    difficulty: 'easy',
    pattern: 'group-by',
    description:
      'The table `fighters(name, style)` lists dojo members and their sword style. Return each `style` with the **count** of fighters using it. Row order does not matter.',
    examples: ['Result columns: style, count.'],
    function_name: '',
    starter_code: '-- fighters(name TEXT, style TEXT)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE fighters (name TEXT, style TEXT);\nINSERT INTO fighters VALUES\n ('Zoro', 'three-sword'),\n ('Kuina', 'one-sword'),\n ('Tashigi', 'one-sword'),\n ('Mihawk', 'one-sword'),\n ('Kaku', 'four-sword'),\n ('Hyori', 'three-sword');",
    expected_rows: [
      ['one-sword', 3],
      ['three-sword', 2],
      ['four-sword', 1],
    ],
    order_matters: false,
    tests: [],
    hint: '`GROUP BY style` with `COUNT(*)`.',
    solution: 'SELECT style, COUNT(*)\nFROM fighters\nGROUP BY style;',
  },
  {
    id: 'sql-having',
    track: 'sql',
    title: 'Dojos with double-digit wins',
    difficulty: 'medium',
    pattern: 'having',
    description:
      'The table `results(dojo, wins)` records tournament results (a dojo can appear multiple times). Return each `dojo` and its **total** wins, but only dojos with a total of **more than 10** wins. Row order does not matter.\n\nRemember: `WHERE` filters rows, `HAVING` filters groups.',
    examples: ['Result columns: dojo, total_wins — only totals > 10.'],
    function_name: '',
    starter_code: '-- results(dojo TEXT, wins INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE results (dojo TEXT, wins INTEGER);\nINSERT INTO results VALUES\n ('shimotsuki', 7),\n ('frost', 4),\n ('shimotsuki', 6),\n ('wave', 11),\n ('frost', 2);",
    expected_rows: [
      ['shimotsuki', 13],
      ['wave', 11],
    ],
    order_matters: false,
    tests: [],
    hint: '`GROUP BY dojo HAVING SUM(wins) > 10` — the aggregate goes in HAVING, not WHERE.',
    solution: 'SELECT dojo, SUM(wins)\nFROM results\nGROUP BY dojo\nHAVING SUM(wins) > 10;',
  },
  {
    id: 'sql-inner-join',
    track: 'sql',
    title: 'Orders with customer names',
    difficulty: 'medium',
    pattern: 'join',
    description:
      'Tables: `customers(id, name)` and `orders(id, customer_id, item)`.\n\nReturn the customer `name` and `item` for every order **that has a matching customer**. Row order does not matter.',
    examples: ['Result columns: name, item.'],
    function_name: '',
    starter_code:
      '-- customers(id INTEGER, name TEXT)\n-- orders(id INTEGER, customer_id INTEGER, item TEXT)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE customers (id INTEGER, name TEXT);\nINSERT INTO customers VALUES (1, 'Zoro'), (2, 'Nami'), (3, 'Usopp');\nCREATE TABLE orders (id INTEGER, customer_id INTEGER, item TEXT);\nINSERT INTO orders VALUES\n (1, 1, 'katana'),\n (2, 2, 'map'),\n (3, 1, 'whetstone'),\n (4, 9, 'ghost order');",
    expected_rows: [
      ['Zoro', 'katana'],
      ['Nami', 'map'],
      ['Zoro', 'whetstone'],
    ],
    order_matters: false,
    tests: [],
    hint: '`JOIN customers c ON o.customer_id = c.id` — the unmatched order disappears on an inner join.',
    solution:
      'SELECT c.name, o.item\nFROM orders o\nJOIN customers c ON o.customer_id = c.id;',
  },
  {
    id: 'sql-left-join-null',
    track: 'sql',
    title: 'Customers who never ordered',
    difficulty: 'medium',
    pattern: 'join',
    description:
      'Tables: `customers(id, name)` and `orders(id, customer_id, item)`.\n\nReturn the `name` of every customer with **no orders at all**. Row order does not matter.\n\nThis is the classic LEFT JOIN + IS NULL pattern (an anti-join).',
    examples: ['Result column: name — only customers without orders.'],
    function_name: '',
    starter_code:
      '-- customers(id INTEGER, name TEXT)\n-- orders(id INTEGER, customer_id INTEGER, item TEXT)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE customers (id INTEGER, name TEXT);\nINSERT INTO customers VALUES (1, 'Zoro'), (2, 'Nami'), (3, 'Usopp'), (4, 'Chopper');\nCREATE TABLE orders (id INTEGER, customer_id INTEGER, item TEXT);\nINSERT INTO orders VALUES\n (1, 1, 'katana'),\n (2, 2, 'map');",
    expected_rows: [['Usopp'], ['Chopper']],
    order_matters: false,
    tests: [],
    hint: 'LEFT JOIN keeps all customers; the ones without orders get NULLs on the orders side — filter with `WHERE o.id IS NULL`.',
    solution:
      'SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;',
  },
  {
    id: 'sql-subquery',
    track: 'sql',
    title: 'Above-average power',
    difficulty: 'medium',
    pattern: 'subquery',
    description:
      'The table `fighters(name, power)` lists dojo members. Return the `name` of every fighter whose `power` is **strictly above the average** power of all fighters. Row order does not matter.',
    examples: ['Result column: name.'],
    function_name: '',
    starter_code: '-- fighters(name TEXT, power INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE fighters (name TEXT, power INTEGER);\nINSERT INTO fighters VALUES\n ('Zoro', 96),\n ('Johnny', 40),\n ('Yosaku', 42),\n ('Mihawk', 99),\n ('Tashigi', 73);",
    expected_rows: [['Zoro'], ['Mihawk'], ['Tashigi']],
    order_matters: false,
    tests: [],
    hint: 'Put the aggregate in a scalar subquery: `WHERE power > (SELECT AVG(power) FROM fighters)`.',
    solution: 'SELECT name\nFROM fighters\nWHERE power > (SELECT AVG(power) FROM fighters);',
  },
  {
    id: 'sql-window-top-per-group',
    track: 'sql',
    title: 'Best-paid crew member per role',
    difficulty: 'hard',
    pattern: 'window-functions',
    description:
      'The table `crew(name, role, salary)` lists crew members. Return `name`, `role`, and `salary` of the **highest-paid member of each role**. Row order does not matter (salaries within a role are unique).\n\nSolve it with a window function — this is the single most-asked hard SQL pattern in DS interviews.',
    examples: ['Result columns: name, role, salary — one row per role.'],
    function_name: '',
    starter_code: '-- crew(name TEXT, role TEXT, salary INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE crew (name TEXT, role TEXT, salary INTEGER);\nINSERT INTO crew VALUES\n ('Sanji', 'kitchen', 90),\n ('Patty', 'kitchen', 60),\n ('Nami', 'navigation', 95),\n ('Zoro', 'deck', 85),\n ('Usopp', 'deck', 70),\n ('Brook', 'deck', 80);",
    expected_rows: [
      ['Sanji', 'kitchen', 90],
      ['Nami', 'navigation', 95],
      ['Zoro', 'deck', 85],
    ],
    order_matters: false,
    tests: [],
    hint: 'Rank inside each role: `ROW_NUMBER() OVER (PARTITION BY role ORDER BY salary DESC) AS rn` in a subquery, then keep `rn = 1` outside.',
    solution:
      'SELECT name, role, salary\nFROM (\n  SELECT name, role, salary,\n         ROW_NUMBER() OVER (PARTITION BY role ORDER BY salary DESC) AS rn\n  FROM crew\n)\nWHERE rn = 1;',
  },
];

import { NEETCODE_1 } from './neetcode1.js';
import { NEETCODE_2 } from './neetcode2.js';
import { NEETCODE_3 } from './neetcode3.js';
import { NEETCODE_4 } from './neetcode4.js';
import { NEETCODE_5 } from './neetcode5.js';
import { LEARN } from './learn.js';
import { COMPLEXITY } from './complexity.js';
import { APPROACHES } from './approaches.js';
import { SQL_QUESTIONS_2 } from './sql2.js';
import { SQL_QUESTIONS_3 } from './sql3.js';
import { PANDAS_QUESTIONS_2 } from './pandas2.js';
import { PANDAS_QUESTIONS_3 } from './pandas3.js';

const RAW_QUESTIONS = [
  ...PYTHON_QUESTIONS,
  ...PANDAS_QUESTIONS,
  ...PANDAS_QUESTIONS_2,
  ...PANDAS_QUESTIONS_3,
  ...SQL_QUESTIONS,
  ...SQL_QUESTIONS_2,
  ...SQL_QUESTIONS_3,
  ...NEETCODE_1,
  ...NEETCODE_2,
  ...NEETCODE_3,
  ...NEETCODE_4,
  ...NEETCODE_5,
];

// Questions whose result order is not significant, so a correct answer in a
// different order still passes:
//   "deep"  = order is irrelevant at every level (groups, subsets, triplets)
//   "outer" = a set of items, but each item keeps its own order (permutations,
//             coordinate pairs, generated strings, "any order" answers)
const UNORDERED = {
  'py-group-anagrams': 'deep',
  'py-three-sum': 'deep',
  'py-subsets': 'deep',
  'py-subsets-ii': 'deep',
  'py-combination-sum': 'deep',
  'py-permutations': 'outer',
  'py-palindrome-partition': 'outer',
  'py-generate-parens': 'outer',
  'py-pacific-atlantic': 'outer',
  'py-top-k-frequent': 'outer',
};

// Merge the premium learning layer (why / constraints / insight), the
// order-sensitivity flag, and the model complexity onto each question by id.
// Starter code should be a clean slate, not a `...` placeholder the user has
// to delete every time. Drop lines that are ONLY the Ellipsis (keeping their
// indentation as the empty line the cursor lands on).
function cleanStarter(code = '') {
  return code
    .split('\n')
    .map((line) => {
      if (/^\s*\.\.\.\s*$/.test(line)) return line.replace(/\.\.\.\s*$/, ''); // keep the indent
      return line.replace(/[ \t]+\.\.\.[ \t]*$/, ''); // 'SELECT ...' -> 'SELECT'
    })
    .join('\n');
}

export const SEED_QUESTIONS = RAW_QUESTIONS.map((q) => {
  let out = LEARN[q.id] ? { ...q, ...LEARN[q.id] } : q;
  if (UNORDERED[q.id]) out = { ...out, unordered: UNORDERED[q.id] };
  if (COMPLEXITY[q.id] && !out.complexity) out = { ...out, complexity: COMPLEXITY[q.id] };
  if (APPROACHES[q.id] && !out.approaches) out = { ...out, approaches: APPROACHES[q.id] };
  if (out.starter_code?.includes('...')) out = { ...out, starter_code: cleanStarter(out.starter_code) };
  return out;
});
