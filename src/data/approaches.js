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
