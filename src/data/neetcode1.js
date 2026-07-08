// NeetCode-150 expansion, part 1: arrays & hashing, two pointers,
// sliding window, stack. Every solution is verified by `npm test`.

export const NEETCODE_1 = [
  // ── arrays & hashing ──────────────────────────────────────────────
  {
    id: 'py-top-k-frequent',
    track: 'python',
    title: 'Top K Frequent Elements',
    difficulty: 'medium',
    pattern: 'arrays-hashing',
    description:
      'Given a list of integers `nums` and an integer `k`, return the `k` most frequent values.\n\nTo make the answer deterministic: sort by **frequency descending**, breaking ties by **smaller value first**.',
    examples: ['top_k_frequent([1,1,1,2,2,3], 2)  ->  [1, 2]'],
    function_name: 'top_k_frequent',
    starter_code:
      'def top_k_frequent(nums, k):\n    # k values, most frequent first (ties: smaller value first)\n    ...\n',
    tests: [
      { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { args: [[4, 4, 4, 6, 6, 7, 7, 7, 7], 2], expected: [7, 4] },
      { args: [[5], 1], expected: [5] },
      { args: [[-1, -1, -2], 1], expected: [-1] },
      { args: [[3, 3, 2, 2], 2], expected: [2, 3] },
    ],
    hint: 'Count with a dict, then sort the keys with `key=lambda n: (-counts[n], n)`.',
    approach:
      'Count frequencies in one pass with a dict, then sort the distinct values by `(-count, value)` and slice the first `k`. Counting is O(n); the sort is O(u log u) over the distinct values.\n\nThe interview upgrade is **bucket sort**: an array of buckets indexed by count (a value appearing `c` times goes in bucket `c`), read from the highest bucket down — O(n) total, no sort. Mention it even if you write the sorted() version first.',
    approaches: [
      {
        name: 'Count + sort',
        complexity: 'O(u log u) time',
        note: 'Tally frequencies, then sort the distinct values by (-count, value). Clear and correct.',
        code: 'def top_k_frequent(nums, k):\n    counts = {}\n    for n in nums:\n        counts[n] = counts.get(n, 0) + 1\n    ordered = sorted(counts, key=lambda n: (-counts[n], n))\n    return ordered[:k]\n',
      },
      {
        name: 'Bucket sort',
        complexity: 'O(n) time',
        note: 'Index buckets by frequency and read from the top down — no comparison sort needed.',
        code: 'def top_k_frequent(nums, k):\n    counts = {}\n    for n in nums:\n        counts[n] = counts.get(n, 0) + 1\n    buckets = [[] for _ in range(len(nums) + 1)]\n    for val, c in counts.items():\n        buckets[c].append(val)\n    res = []\n    for c in range(len(buckets) - 1, 0, -1):\n        for val in sorted(buckets[c]):\n            res.append(val)\n            if len(res) == k:\n                return res\n    return res\n',
      },
    ],
    solution:
      'def top_k_frequent(nums, k):\n    counts = {}\n    for n in nums:\n        counts[n] = counts.get(n, 0) + 1\n    ordered = sorted(counts, key=lambda n: (-counts[n], n))\n    return ordered[:k]\n',
  },
  {
    id: 'py-product-except-self',
    track: 'python',
    title: 'Product of Array Except Self',
    difficulty: 'medium',
    pattern: 'arrays-hashing',
    description:
      'Given a list `nums`, return a list `answer` where `answer[i]` is the product of **every element except** `nums[i]`.\n\nDo it in O(n) **without using division** (division breaks on zeros, and interviewers ban it anyway).',
    examples: ['product_except_self([1,2,3,4])  ->  [24, 12, 8, 6]'],
    function_name: 'product_except_self',
    starter_code:
      'def product_except_self(nums):\n    # O(n), no division\n    ...\n',
    tests: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { args: [[2, 3]], expected: [3, 2] },
      { args: [[0, 0]], expected: [0, 0] },
      { args: [[5, 1, 1]], expected: [1, 5, 5] },
    ],
    hint: 'answer[i] = (product of everything left of i) × (product of everything right of i). Two sweeps.',
    approach:
      'Sweep left-to-right writing the running **prefix product** into the answer (each slot gets the product of everything before it), then sweep right-to-left multiplying in the running **suffix product**. Each element ends up with left-product × right-product — everything except itself.\n\nO(n) time, O(1) extra space beyond the output. Zeros fall out naturally, which is exactly why the division "shortcut" is a trap.',
    approaches: [
      {
        name: 'Brute force',
        complexity: 'O(n²) time',
        note: 'For each index, multiply all the others. No division, but quadratic.',
        code: 'def product_except_self(nums):\n    n = len(nums)\n    res = []\n    for i in range(n):\n        p = 1\n        for j in range(n):\n            if j != i:\n                p *= nums[j]\n        res.append(p)\n    return res\n',
      },
      {
        name: 'Prefix × suffix',
        complexity: 'O(n) time, O(1) extra',
        note: 'Two sweeps: bake in the product of everything to the left, then everything to the right.',
        code: 'def product_except_self(nums):\n    n = len(nums)\n    res = [1] * n\n    prefix = 1\n    for i in range(n):\n        res[i] = prefix\n        prefix *= nums[i]\n    suffix = 1\n    for i in range(n - 1, -1, -1):\n        res[i] *= suffix\n        suffix *= nums[i]\n    return res\n',
      },
    ],
    solution:
      'def product_except_self(nums):\n    n = len(nums)\n    res = [1] * n\n    prefix = 1\n    for i in range(n):\n        res[i] = prefix\n        prefix *= nums[i]\n    suffix = 1\n    for i in range(n - 1, -1, -1):\n        res[i] *= suffix\n        suffix *= nums[i]\n    return res\n',
  },
  {
    id: 'py-longest-consecutive',
    track: 'python',
    title: 'Longest Consecutive Sequence',
    difficulty: 'medium',
    pattern: 'arrays-hashing',
    description:
      'Given an unsorted list of integers, return the length of the **longest run of consecutive values** (e.g. 1,2,3,4). The values do not need to be adjacent in the list.\n\nTarget O(n) — sorting is the easy O(n log n) fallback, the set trick is the real answer.',
    examples: ['longest_consecutive([100,4,200,1,3,2])  ->  4   # 1,2,3,4'],
    function_name: 'longest_consecutive',
    starter_code: 'def longest_consecutive(nums):\n    # O(n) with a set\n    ...\n',
    tests: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[1, 2, 0, 1]], expected: 3 },
      { args: [[9]], expected: 1 },
    ],
    hint: 'Put everything in a set. A number starts a run only if `n - 1` is NOT in the set — then walk forward.',
    approach:
      'Dump the values into a set. For each value, only bother counting if it is the **start** of a run (`n-1` not in the set) — then walk `n+1, n+2, …` while they exist. Every element is visited at most twice, so the whole thing is O(n) despite the nested-looking loop.\n\nThe "only start at run beginnings" guard is the entire trick; without it you re-walk runs and degrade to O(n²).',
    solution:
      'def longest_consecutive(nums):\n    values = set(nums)\n    best = 0\n    for n in values:\n        if n - 1 not in values:\n            length = 1\n            while n + length in values:\n                length += 1\n            best = max(best, length)\n    return best\n',
  },

  // ── two pointers ──────────────────────────────────────────────────
  {
    id: 'py-two-sum-sorted',
    track: 'python',
    title: 'Two Sum II (sorted input)',
    difficulty: 'medium',
    pattern: 'two-pointers',
    description:
      'Given a list `numbers` sorted in ascending order and a `target`, return the **1-indexed** positions `[i, j]` (`i < j`) of the two values that add to `target`. Exactly one solution exists.\n\nUse the sortedness: two pointers, O(1) extra space — no dict this time.',
    examples: ['two_sum_sorted([2,7,11,15], 9)  ->  [1, 2]'],
    function_name: 'two_sum_sorted',
    starter_code:
      'def two_sum_sorted(numbers, target):\n    # 1-indexed [i, j], two pointers\n    ...\n',
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [1, 2] },
      { args: [[2, 3, 4], 6], expected: [1, 3] },
      { args: [[-1, 0], -1], expected: [1, 2] },
      { args: [[1, 2, 3, 4, 4], 8], expected: [4, 5] },
    ],
    hint: 'Pointers at both ends. Sum too small → move the left one right; too big → move the right one left.',
    approach:
      'Start pointers at both ends. The current sum tells you which pointer is "wrong": too small means the left value must grow (move left pointer right); too big means the right value must shrink. Because the array is sorted, each move permanently rules out a batch of pairs, so you converge in O(n) with O(1) space.\n\nCompare with plain Two Sum: unsorted → dict; sorted → two pointers. Knowing *why* each fits is a classic interview follow-up.',
    solution:
      'def two_sum_sorted(numbers, target):\n    lo, hi = 0, len(numbers) - 1\n    while lo < hi:\n        s = numbers[lo] + numbers[hi]\n        if s == target:\n            return [lo + 1, hi + 1]\n        if s < target:\n            lo += 1\n        else:\n            hi -= 1\n',
  },
  {
    id: 'py-three-sum',
    track: 'python',
    title: '3Sum',
    difficulty: 'medium',
    pattern: 'two-pointers',
    description:
      'Given a list of integers, return **all unique triplets** `[a, b, c]` with `a + b + c == 0`.\n\nReturn each triplet sorted ascending, and the list of triplets sorted — that makes the answer deterministic. No duplicate triplets.',
    examples: ['three_sum([-1,0,1,2,-1,-4])  ->  [[-1,-1,2], [-1,0,1]]'],
    function_name: 'three_sum',
    starter_code:
      'def three_sum(nums):\n    # unique triplets summing to 0, each sorted, list sorted\n    ...\n',
    tests: [
      { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { args: [[0, 1, 1]], expected: [] },
      { args: [[0, 0, 0]], expected: [[0, 0, 0]] },
      { args: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]] },
    ],
    hint: 'Sort first. Fix the smallest element with a loop, then run the Two Sum II two-pointer scan on the rest. Skip duplicates at every level.',
    approach:
      'Sort the array, then for each index `i` treat `nums[i]` as the fixed smallest element and run the sorted two-pointer scan on the remainder looking for `-nums[i]`. Skip a fixed element equal to the previous one, and after recording a hit keep advancing the left pointer past duplicates — that is what makes triplets unique without a set.\n\nO(n²) time after the O(n log n) sort. 3Sum is Two Sum II wearing a for-loop.',
    approaches: [
      {
        name: 'Brute force',
        complexity: 'O(n³) time',
        note: 'Every triple, deduped via a set of sorted tuples. Slow, but proves the answer shape.',
        code: 'def three_sum(nums):\n    n = len(nums)\n    found = set()\n    for i in range(n):\n        for j in range(i + 1, n):\n            for k in range(j + 1, n):\n                if nums[i] + nums[j] + nums[k] == 0:\n                    found.add(tuple(sorted((nums[i], nums[j], nums[k]))))\n    return sorted([list(t) for t in found])\n',
      },
      {
        name: 'Sort + two pointers',
        complexity: 'O(n²) time',
        note: 'Fix the smallest element, then run the two-pointer Two-Sum scan on the rest. Skip duplicates.',
        code: 'def three_sum(nums):\n    nums = sorted(nums)\n    res = []\n    for i in range(len(nums) - 2):\n        if i and nums[i] == nums[i - 1]:\n            continue\n        lo, hi = i + 1, len(nums) - 1\n        while lo < hi:\n            s = nums[i] + nums[lo] + nums[hi]\n            if s < 0:\n                lo += 1\n            elif s > 0:\n                hi -= 1\n            else:\n                res.append([nums[i], nums[lo], nums[hi]])\n                lo += 1\n                while lo < hi and nums[lo] == nums[lo - 1]:\n                    lo += 1\n    return res\n',
      },
    ],
    solution:
      'def three_sum(nums):\n    nums = sorted(nums)\n    res = []\n    for i in range(len(nums) - 2):\n        if i and nums[i] == nums[i - 1]:\n            continue\n        lo, hi = i + 1, len(nums) - 1\n        while lo < hi:\n            s = nums[i] + nums[lo] + nums[hi]\n            if s < 0:\n                lo += 1\n            elif s > 0:\n                hi -= 1\n            else:\n                res.append([nums[i], nums[lo], nums[hi]])\n                lo += 1\n                while lo < hi and nums[lo] == nums[lo - 1]:\n                    lo += 1\n    return res\n',
  },
  {
    id: 'py-container-water',
    track: 'python',
    title: 'Container With Most Water',
    difficulty: 'medium',
    pattern: 'two-pointers',
    description:
      'Given a list `heights` where each value is a vertical line at that x-position, find two lines that together with the x-axis hold the most water. Return that maximum area (`width × min(height1, height2)`).',
    examples: ['max_area([1,8,6,2,5,4,8,3,7])  ->  49'],
    function_name: 'max_area',
    starter_code: 'def max_area(heights):\n    # widest-first two pointers\n    ...\n',
    tests: [
      { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { args: [[1, 1]], expected: 1 },
      { args: [[4, 3, 2, 1, 4]], expected: 16 },
      { args: [[1, 2, 1]], expected: 2 },
    ],
    hint: 'Start with the widest container (both ends). Only moving the shorter wall inward can possibly help.',
    approach:
      'Start at maximum width with pointers at both ends. The area is limited by the **shorter** wall — moving the taller one inward can only shrink or keep the area (width drops, height still capped by the same short wall). So always move the shorter pointer inward, tracking the best area seen. O(n).\n\nThe interview skill here is the *argument*: be ready to explain why discarding the shorter wall never throws away the optimum.',
    approaches: [
      {
        name: 'Brute force',
        complexity: 'O(n²) time',
        note: 'Try every pair of walls. Correct, and a fine way to confirm your area formula before optimizing.',
        code: 'def max_area(heights):\n    best = 0\n    for i in range(len(heights)):\n        for j in range(i + 1, len(heights)):\n            best = max(best, (j - i) * min(heights[i], heights[j]))\n    return best\n',
      },
      {
        name: 'Two pointers',
        complexity: 'O(n) time, O(1) space',
        note: 'Start widest; always move the shorter wall inward — moving the taller one can never help.',
        code: 'def max_area(heights):\n    lo, hi = 0, len(heights) - 1\n    best = 0\n    while lo < hi:\n        best = max(best, (hi - lo) * min(heights[lo], heights[hi]))\n        if heights[lo] < heights[hi]:\n            lo += 1\n        else:\n            hi -= 1\n    return best\n',
      },
    ],
    solution:
      'def max_area(heights):\n    lo, hi = 0, len(heights) - 1\n    best = 0\n    while lo < hi:\n        best = max(best, (hi - lo) * min(heights[lo], heights[hi]))\n        if heights[lo] < heights[hi]:\n            lo += 1\n        else:\n            hi -= 1\n    return best\n',
  },

  // ── sliding window ────────────────────────────────────────────────
  {
    id: 'py-longest-substring-norepeat',
    track: 'python',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    pattern: 'sliding-window',
    description:
      'Given a string `s`, return the length of the longest substring with **no repeated characters**.',
    examples: ['length_of_longest_substring("abcabcbb")  ->  3   # "abc"'],
    function_name: 'length_of_longest_substring',
    starter_code:
      'def length_of_longest_substring(s):\n    # sliding window + last-seen positions\n    ...\n',
    tests: [
      { args: ['abcabcbb'], expected: 3 },
      { args: ['bbbbb'], expected: 1 },
      { args: ['pwwkew'], expected: 3 },
      { args: [''], expected: 0 },
      { args: ['dvdf'], expected: 3 },
    ],
    hint: 'Keep a dict of each char → last index seen. When you re-see a char inside the window, jump the window start past its previous position.',
    approach:
      'Slide a window `[start, i]` that always contains unique characters. Track each character\'s last-seen index in a dict; when the current character was already seen **at or after** `start`, move `start` to just past that occurrence. Record the window length at every step.\n\nO(n) — each index enters and leaves the window once. The `seen[ch] >= start` check (not just `ch in seen`) is the classic off-by-one that "dvdf" catches.',
    approaches: [
      {
        name: 'Check every substring',
        complexity: 'O(n²) time',
        note: 'From each start, extend until a repeat. Correct and easy to reason about.',
        code: 'def length_of_longest_substring(s):\n    best = 0\n    for i in range(len(s)):\n        seen = set()\n        for j in range(i, len(s)):\n            if s[j] in seen:\n                break\n            seen.add(s[j])\n            best = max(best, j - i + 1)\n    return best\n',
      },
      {
        name: 'Sliding window',
        complexity: 'O(n) time',
        note: 'Remember each char\'s last index; when you re-see one inside the window, jump the start past it.',
        code: 'def length_of_longest_substring(s):\n    seen = {}\n    start = 0\n    best = 0\n    for i, ch in enumerate(s):\n        if ch in seen and seen[ch] >= start:\n            start = seen[ch] + 1\n        seen[ch] = i\n        best = max(best, i - start + 1)\n    return best\n',
      },
    ],
    solution:
      'def length_of_longest_substring(s):\n    seen = {}\n    start = 0\n    best = 0\n    for i, ch in enumerate(s):\n        if ch in seen and seen[ch] >= start:\n            start = seen[ch] + 1\n        seen[ch] = i\n        best = max(best, i - start + 1)\n    return best\n',
  },
  {
    id: 'py-char-replacement',
    track: 'python',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'medium',
    pattern: 'sliding-window',
    description:
      'Given a string `s` of uppercase letters and an integer `k`, you may change at most `k` characters. Return the length of the longest substring you can make consist of **one repeated letter**.',
    examples: ['character_replacement("AABABBA", 1)  ->  4   # "ABBA" -> "BBBB" or "AABA" -> "AAAA"'],
    function_name: 'character_replacement',
    starter_code:
      'def character_replacement(s, k):\n    # window is valid while (size - max_count) <= k\n    ...\n',
    tests: [
      { args: ['ABAB', 2], expected: 4 },
      { args: ['AABABBA', 1], expected: 4 },
      { args: ['AAAA', 0], expected: 4 },
      { args: ['ABCDE', 1], expected: 2 },
    ],
    hint: 'A window is fixable when (window length − count of its most frequent letter) ≤ k. Grow right; shrink left when that breaks.',
    approach:
      'Slide a window and keep letter counts. A window can be made uniform when `window_size - max_frequency <= k` (everything that isn\'t the majority letter gets replaced). Expand right each step; if the invariant breaks, move the left edge in by one.\n\nSubtle interview point: `max_frequency` can be a stale maximum without breaking correctness — the window only ever grows when a *new* genuine maximum appears, so the answer (max window size seen) stays right. O(n).',
    solution:
      'def character_replacement(s, k):\n    counts = {}\n    start = 0\n    best = 0\n    maxf = 0\n    for i, ch in enumerate(s):\n        counts[ch] = counts.get(ch, 0) + 1\n        maxf = max(maxf, counts[ch])\n        while (i - start + 1) - maxf > k:\n            counts[s[start]] -= 1\n            start += 1\n        best = max(best, i - start + 1)\n    return best\n',
  },
  {
    id: 'py-permutation-in-string',
    track: 'python',
    title: 'Permutation in String',
    difficulty: 'medium',
    pattern: 'sliding-window',
    description:
      'Given strings `s1` and `s2`, return `True` if `s2` contains any **permutation of `s1`** as a substring (i.e. some window of `s2` has exactly the same letter counts as `s1`).',
    examples: ['check_inclusion("ab", "eidbaooo")  ->  True   # "ba"'],
    function_name: 'check_inclusion',
    starter_code:
      'def check_inclusion(s1, s2):\n    # fixed-size window, compare letter counts\n    ...\n',
    tests: [
      { args: ['ab', 'eidbaooo'], expected: true },
      { args: ['ab', 'eidboaoo'], expected: false },
      { args: ['a', 'a'], expected: true },
      { args: ['abc', 'ab'], expected: false },
      { args: ['adc', 'dcda'], expected: true },
    ],
    hint: 'Slide a window of length len(s1) across s2, maintaining its letter counts incrementally — add the entering char, remove the leaving one.',
    approach:
      'A permutation of `s1` is any window of length `len(s1)` whose letter counts equal `s1`\'s counts. Build the counts for the first window, then slide: each step adds one character and removes one, an O(1) update, then compares counters.\n\nWith `collections.Counter` the comparison is a dict equality over ≤26 keys, so the whole scan is O(n). This "fixed-size window with incremental counts" template also solves *Find All Anagrams in a String*.',
    solution:
      'def check_inclusion(s1, s2):\n    from collections import Counter\n    if len(s1) > len(s2):\n        return False\n    need = Counter(s1)\n    window = Counter(s2[: len(s1)])\n    if window == need:\n        return True\n    for i in range(len(s1), len(s2)):\n        window[s2[i]] += 1\n        left = s2[i - len(s1)]\n        window[left] -= 1\n        if window[left] == 0:\n            del window[left]\n        if window == need:\n            return True\n    return False\n',
  },
  {
    id: 'py-min-window-substring',
    track: 'python',
    title: 'Minimum Window Substring',
    difficulty: 'hard',
    pattern: 'sliding-window',
    description:
      'Given strings `s` and `t`, return the **smallest substring of `s`** that contains every character of `t` (with multiplicity). Return `""` if none exists.\n\nThis is the boss fight of sliding windows — expand to become valid, shrink to become minimal.',
    examples: ['min_window("ADOBECODEBANC", "ABC")  ->  "BANC"'],
    function_name: 'min_window',
    starter_code:
      'def min_window(s, t):\n    # expand right until valid, shrink left while valid\n    ...\n',
    tests: [
      { args: ['ADOBECODEBANC', 'ABC'], expected: 'BANC' },
      { args: ['a', 'a'], expected: 'a' },
      { args: ['a', 'aa'], expected: '' },
      { args: ['ab', 'b'], expected: 'b' },
    ],
    hint: 'Track how many required characters are still `missing`. Expand right until missing hits 0, then shrink from the left while it stays 0, recording the best window.',
    approach:
      'Keep a `need` counter (from `t`) and a single `missing` total. Expand the right edge: when the entering character is still needed (`need[ch] > 0`), decrement `missing`; always decrement `need[ch]` (it may go negative — that means surplus). Whenever `missing == 0` the window is valid: record it if smallest so far, then shrink from the left, restoring `need` as characters leave, until the window is invalid again.\n\nEach pointer only moves forward, so O(|s| + |t|). The negative-counts-mean-surplus idea is what makes the single `missing` counter work.',
    solution:
      'def min_window(s, t):\n    from collections import Counter\n    if not t or not s:\n        return ""\n    need = Counter(t)\n    missing = len(t)\n    best = ""\n    lo = 0\n    for hi, ch in enumerate(s):\n        if need[ch] > 0:\n            missing -= 1\n        need[ch] -= 1\n        while missing == 0:\n            if not best or hi - lo + 1 < len(best):\n                best = s[lo : hi + 1]\n            need[s[lo]] += 1\n            if need[s[lo]] > 0:\n                missing += 1\n            lo += 1\n    return best\n',
  },

  // ── stack ─────────────────────────────────────────────────────────
  {
    id: 'py-eval-rpn',
    track: 'python',
    title: 'Evaluate Reverse Polish Notation',
    difficulty: 'medium',
    pattern: 'stack',
    description:
      'Evaluate an expression given in Reverse Polish (postfix) notation as a list of tokens: numbers and the operators `+ - * /`.\n\nDivision **truncates toward zero** (like `int(a / b)`, not `a // b` — they differ on negatives!). The input is always valid.',
    examples: ['eval_rpn(["2","1","+","3","*"])  ->  9   # (2+1)*3'],
    function_name: 'eval_rpn',
    starter_code:
      'def eval_rpn(tokens):\n    # push numbers; operators pop two, push one\n    ...\n',
    tests: [
      { args: [['2', '1', '+', '3', '*']], expected: 9 },
      { args: [['4', '13', '5', '/', '+']], expected: 6 },
      {
        args: [['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']],
        expected: 22,
      },
      { args: [['18']], expected: 18 },
    ],
    hint: 'Stack of numbers. On an operator, pop b then a (order matters for - and /), apply, push the result.',
    approach:
      'Postfix means "operands first, operator after" — a stack evaluates it directly: push numbers; on an operator pop the top two (the **second** pop is the left operand), apply, push the result. One value remains at the end.\n\nTwo classic traps: operand order for `-` and `/`, and Python division — `a // b` floors (toward −∞) while the problem wants truncation toward zero, so use `int(a / b)`. O(n).',
    solution:
      'def eval_rpn(tokens):\n    stack = []\n    for tok in tokens:\n        if tok in ("+", "-", "*", "/"):\n            b = stack.pop()\n            a = stack.pop()\n            if tok == "+":\n                stack.append(a + b)\n            elif tok == "-":\n                stack.append(a - b)\n            elif tok == "*":\n                stack.append(a * b)\n            else:\n                stack.append(int(a / b))\n        else:\n            stack.append(int(tok))\n    return stack[0]\n',
  },
  {
    id: 'py-daily-temperatures',
    track: 'python',
    title: 'Daily Temperatures',
    difficulty: 'medium',
    pattern: 'stack',
    description:
      'Given a list of daily temperatures, return a list where `answer[i]` is the number of days you must wait after day `i` for a **warmer** temperature (0 if it never comes).\n\nThis is the canonical **monotonic stack** problem.',
    examples: ['daily_temperatures([73,74,75,71,69,72,76,73])  ->  [1,1,4,2,1,1,0,0]'],
    function_name: 'daily_temperatures',
    starter_code:
      'def daily_temperatures(temps):\n    # monotonic (decreasing) stack of indices\n    ...\n',
    tests: [
      { args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
      { args: [[30, 60, 90]], expected: [1, 1, 0] },
      { args: [[55]], expected: [0] },
      { args: [[80, 70, 60]], expected: [0, 0, 0] },
    ],
    hint: 'Keep a stack of indices whose answer is unknown (temperatures decreasing). Each new day pops every colder index and answers it.',
    approach:
      'Walk the days keeping a stack of **indices still waiting** for a warmer day; their temperatures are decreasing from bottom to top. When a new temperature arrives, it answers every stack index colder than it: pop, set `answer[popped] = today − popped`. Then push today.\n\nEvery index is pushed and popped at most once → O(n). "Next greater element" problems (spans, histograms, car fleet) are all this same monotonic-stack move.',
    solution:
      'def daily_temperatures(temps):\n    res = [0] * len(temps)\n    stack = []\n    for i, t in enumerate(temps):\n        while stack and temps[stack[-1]] < t:\n            j = stack.pop()\n            res[j] = i - j\n        stack.append(i)\n    return res\n',
  },
  {
    id: 'py-min-stack',
    track: 'python',
    title: 'Min Stack (operation log)',
    difficulty: 'medium',
    pattern: 'stack',
    description:
      'Simulate a stack that can report its **minimum in O(1)**. You get a list of operations:\n\n- `["push", x]` — push x\n- `["pop"]` — pop the top\n- `["top"]` — record the top value\n- `["getMin"]` — record the current minimum\n\nReturn the list of values recorded by `top` and `getMin`, in order. All operations are valid. `getMin` must not scan the stack.',
    examples: [
      'min_stack([["push",-2],["push",0],["push",-3],["getMin"],["pop"],["top"],["getMin"]])\n  ->  [-3, 0, -2]',
    ],
    function_name: 'min_stack',
    starter_code:
      'def min_stack(ops):\n    # second stack tracks the min alongside\n    ...\n',
    tests: [
      {
        args: [[['push', -2], ['push', 0], ['push', -3], ['getMin'], ['pop'], ['top'], ['getMin']]],
        expected: [-3, 0, -2],
      },
      {
        args: [[['push', 5], ['getMin'], ['push', 3], ['getMin'], ['pop'], ['getMin']]],
        expected: [5, 3, 5],
      },
      { args: [[['push', 1], ['top']]], expected: [1] },
      {
        args: [[['push', 2], ['push', 2], ['getMin'], ['pop'], ['getMin']]],
        expected: [2, 2],
      },
    ],
    hint: 'Keep a parallel `mins` stack: on every push, also push min(new value, current min). Pop both together.',
    approach:
      'Keep a second stack `mins` that moves in lockstep: pushing `v` also pushes `min(v, mins[-1])`, popping pops both. `mins[-1]` is then always the minimum of the *current* contents, because every historical state got its own snapshot.\n\nAll four operations are O(1). The insight to say out loud in an interview: you cannot maintain a single min variable, because popping the minimum would leave you not knowing the runner-up — the stack of snapshots *is* the undo history.',
    solution:
      'def min_stack(ops):\n    stack, mins, out = [], [], []\n    for op in ops:\n        name = op[0]\n        if name == "push":\n            v = op[1]\n            stack.append(v)\n            mins.append(v if not mins else min(v, mins[-1]))\n        elif name == "pop":\n            stack.pop()\n            mins.pop()\n        elif name == "top":\n            out.append(stack[-1])\n        else:\n            out.append(mins[-1])\n    return out\n',
  },
];
