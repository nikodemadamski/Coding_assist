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
