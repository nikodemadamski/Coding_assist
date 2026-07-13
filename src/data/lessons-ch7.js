// Chapter 7 — Search & windows: the workhorse patterns that extend what you
// already know. Slide a window instead of re-scanning, halve a sorted range,
// keep the smallest ready with a heap, merge intervals, and take the greedy
// local best. Every snippet is executed by the lesson gate.

export const LESSONS_CH7 = [
  {
    id: 'ch7-sliding-window',
    chapter: 'search-windows',
    title: 'Sliding window',
    minutes: 7,
    prereqs: ['ch6-capstone'],
    read: {
      text:
        'A **sliding window** is a range over a list that you GROW and SHRINK instead of re-scanning from scratch. Keep a running total as the window moves — drop the item leaving, add the item entering. That turns O(n²) into O(n).\n\nFixed size: slide by one each step. Variable size: grow the right edge, shrink the left while a rule is broken.',
      example: {
        code:
          'nums = [1, 2, 3, 4]\nbest = nums[0] + nums[1]\nfor i in range(1, len(nums) - 1):\n    s = nums[i] + nums[i + 1]\n    best = max(best, s)\nprint(best)',
        expectedOutput: '7',
      },
      visual: {
        widget: 'list-cells',
        list: [1, 2, 3, 4],
        caption: 'The shaded window slides one step at a time — never a full re-scan.',
        beats: [
          { slice: [0, 2], caption: 'The window covers the first two: 1 + 2 = 3.' },
          { slice: [1, 3], caption: 'Slide right: drop 1, add 3 → 2 + 3 = 5.' },
          { slice: [2, 4], caption: 'Slide again: 3 + 4 = 7 — the best window.' },
        ],
        why: 'Move the window by one and adjust the total — no re-summing.',
        verifyCode:
          'nums = [1, 2, 3, 4]\nbest = nums[0] + nums[1]\nfor i in range(1, len(nums) - 1):\n    s = nums[i] + nums[i + 1]\n    best = max(best, s)\nprint(best)',
        verifyOutput: '7',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'nums = [4, 2, 1, 6]\nprint(nums[0] + nums[1], nums[1] + nums[2], nums[2] + nums[3])',
        answer: '6 3 7',
        why: 'The three windows of size 2: 4+2, 2+1, 1+6.',
      },
      {
        type: 'predict',
        code: 'nums = [1, 1, 1]\nwindow = 0\nfor n in nums:\n    window = window + n\nprint(window)',
        answer: '3',
        why: 'A running total accumulates as the window covers everything.',
      },
      {
        type: 'type',
        prompt: 'The sum of the window of size k starting at index i, using a slice.',
        answer: 'sum(nums[i:i + k])',
        accept: ['sum(nums[i:i+k])'],
        why: 'nums[i:i+k] is the window; sum totals it.',
      },
      {
        type: 'write',
        brief: 'max_window_sum(nums, k): the largest sum of any k adjacent numbers.',
        function_name: 'max_window_sum',
        starter_code: 'def max_window_sum(nums, k):\n    best = sum(nums[:k])\n    \n',
        tests: [
          { args: [[1, 2, 3, 4], 2], expected: 7 },
          { args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 },
          { args: [[4], 1], expected: 4 },
        ],
        solution:
          'def max_window_sum(nums, k):\n    best = sum(nums[:k])\n    s = best\n    for i in range(k, len(nums)):\n        s = s + nums[i] - nums[i - k]\n        best = max(best, s)\n    return best\n',
        hint: 'Start with the first window, then slide: add nums[i], drop nums[i - k].',
      },
      {
        type: 'fix',
        brief: 'This window sum re-adds the whole slice every step and goes one index too far.',
        function_name: 'first_window',
        code: 'def first_window(nums, k):\n    return sum(nums[0:k + 1])\n',
        tests: [
          { args: [[1, 2, 3], 2], expected: 3 },
          { args: [[5, 1, 4], 1], expected: 5 },
        ],
        solution: 'def first_window(nums, k):\n    return sum(nums[0:k])\n',
        hint: 'A window of size k is nums[0:k], not nums[0:k + 1].',
      },
    ],
  },
  {
    id: 'ch7-binary-search',
    chapter: 'search-windows',
    title: 'Binary search',
    minutes: 7,
    prereqs: ['ch7-sliding-window'],
    read: {
      text:
        'On a **sorted** list, binary search halves the search space each step — O(log n). Keep `lo` and `hi`; look at the `mid`. If the middle is too small, the answer is to the RIGHT (`lo = mid + 1`); too big, the LEFT (`hi = mid - 1`); equal, found.\n\nThe one rule: the list must be sorted, and `mid` uses `//` for a whole-number index.',
      example: {
        code:
          'nums = [1, 3, 5, 7, 9]\nlo, hi = 0, 4\nfound = -1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if nums[mid] == 7:\n        found = mid\n        break\n    if nums[mid] < 7:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nprint(found)',
        expectedOutput: '3',
      },
      visual: {
        widget: 'list-cells',
        list: [1, 3, 5, 7, 9],
        caption: 'lo and hi bound the search; mid is checked, then half is thrown away.',
        beats: [
          {
            pointer: 0,
            pointerLabel: 'lo',
            pointer2: 4,
            pointer2Label: 'hi',
            mid: 2,
            midLabel: 'mid',
            caption: 'mid = 2 → nums[2] = 5, too small. Throw away the left half: lo = mid + 1.',
          },
          {
            pointer: 3,
            pointerLabel: 'lo',
            pointer2: 4,
            pointer2Label: 'hi',
            mid: 3,
            midLabel: 'mid',
            caption: 'mid = 3 → nums[3] = 7. Found it — in two steps, not five.',
          },
        ],
        why: 'Each step halves what is left: log(n) checks, not n.',
        verifyCode:
          'nums = [1, 3, 5, 7, 9]\nlo, hi = 0, 4\nfound = -1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if nums[mid] == 7:\n        found = mid\n        break\n    if nums[mid] < 7:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nprint(found)',
        verifyOutput: '3',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'lo, hi = 0, 6\nprint((lo + hi) // 2)',
        answer: '3',
        why: 'The midpoint of 0 and 6 is 3 — integer division keeps it a valid index.',
      },
      {
        type: 'predict',
        code:
          'nums = [2, 4, 6, 8]\nlo, hi = 0, 3\nmid = (lo + hi) // 2\nprint(nums[mid])',
        answer: '4',
        why: 'mid = 1, so nums[1] = 4 — the first middle checked.',
      },
      {
        type: 'type',
        prompt: 'The midpoint index of lo and hi (whole number).',
        answer: '(lo + hi) // 2',
        why: '// gives an integer index; / would make a float and crash the lookup.',
      },
      {
        type: 'write',
        brief: 'binary_search(nums, target): the index of target in the sorted list, or -1.',
        function_name: 'binary_search',
        starter_code: 'def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    \n',
        tests: [
          { args: [[1, 3, 5, 7, 9], 7], expected: 3 },
          { args: [[1, 3, 5, 7, 9], 4], expected: -1 },
          { args: [[], 1], expected: -1 },
          { args: [[2], 2], expected: 0 },
        ],
        solution:
          'def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n',
        hint: 'while lo <= hi: check mid; move lo up or hi down; return -1 if never found.',
      },
      {
        type: 'fix',
        brief: 'This binary search uses / for the midpoint, making a float index.',
        function_name: 'find',
        code:
          'def find(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) / 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n',
        tests: [
          { args: [[1, 3, 5], 3], expected: 1 },
          { args: [[1, 3, 5], 9], expected: -1 },
        ],
        solution:
          'def find(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n',
        hint: 'List indexes must be whole numbers — use // not /.',
      },
    ],
  },
  {
    id: 'ch7-heap',
    chapter: 'search-windows',
    title: 'Heaps & heapq',
    minutes: 6,
    prereqs: ['ch7-binary-search'],
    read: {
      text:
        'A **heap** keeps the smallest item ready to pop in O(log n). Python’s `heapq` treats a plain list as a min-heap: `heappush(h, x)` adds, `heappop(h)` removes and returns the SMALLEST.\n\nFor "top / bottom k" you rarely sort the whole list — `heapq.nsmallest(k, xs)` and `nlargest(k, xs)` do it directly.',
      example: {
        code: 'import heapq\nh = []\nfor x in [5, 1, 3]:\n    heapq.heappush(h, x)\nprint(heapq.heappop(h))',
        expectedOutput: '1',
      },
      visual: {
        widget: 'pipe-flow',
        caption: 'A heap streams items out smallest-first, and picks the top k directly.',
        beats: [
          {
            label: 'heappush 5, 1, 3 → pop, pop, pop',
            input: ['5', '1', '3'],
            output: ['1', '3', '5'],
            caption: 'However they went in, heappop always returns the smallest next.',
          },
          {
            label: 'nlargest(2, [5, 1, 3, 8])',
            input: ['5', '1', '3', '8'],
            output: ['8', '5'],
            caption: 'nlargest hands back the two biggest without sorting everything.',
          },
        ],
        why: 'The min is always ready to pop; nsmallest / nlargest skip a full sort.',
        verifyCode: 'import heapq\nh = []\nfor x in [5, 1, 3]:\n    heapq.heappush(h, x)\nprint(heapq.heappop(h))',
        verifyOutput: '1',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'import heapq\nh = [4, 2, 8]\nheapq.heapify(h)\nprint(heapq.heappop(h))',
        answer: '2',
        why: 'heapify arranges the list; heappop returns the smallest, 2.',
      },
      {
        type: 'predict',
        code: 'import heapq\nprint(heapq.nsmallest(2, [5, 1, 3, 2]))',
        answer: '[1, 2]',
        why: 'nsmallest(2, ...) returns the two smallest, already in order.',
      },
      {
        type: 'type',
        prompt: 'Pop and return the smallest item from the heap h.',
        answer: 'heapq.heappop(h)',
        why: 'heappop always removes the minimum from a heapq heap.',
      },
      {
        type: 'write',
        brief: 'k_smallest(nums, k): the k smallest numbers, in ascending order.',
        function_name: 'k_smallest',
        starter_code: 'import heapq\n\ndef k_smallest(nums, k):\n    \n',
        tests: [
          { args: [[5, 1, 3, 2], 2], expected: [1, 2] },
          { args: [[4], 1], expected: [4] },
          { args: [[9, 7, 8], 3], expected: [7, 8, 9] },
        ],
        solution: 'import heapq\n\ndef k_smallest(nums, k):\n    return heapq.nsmallest(k, nums)\n',
        hint: 'heapq.nsmallest(k, nums) does exactly this — smallest k, sorted.',
      },
    ],
  },
  {
    id: 'ch7-intervals',
    chapter: 'search-windows',
    title: 'Intervals — sort & merge',
    minutes: 6,
    prereqs: ['ch7-heap'],
    read: {
      text:
        'Interval problems almost always start the same way: **sort by start**. Then walk the list — if the next interval starts before the current one ends, they OVERLAP, so merge by extending the end. Otherwise the current interval is done; keep it and move on.\n\nOne comparison, `start <= last_end`, decides overlap.',
      example: {
        code:
          'intervals = [[1, 3], [2, 5], [7, 9]]\nintervals.sort()\nmerged = [intervals[0]]\nfor s, e in intervals[1:]:\n    if s <= merged[-1][1]:\n        merged[-1][1] = max(merged[-1][1], e)\n    else:\n        merged.append([s, e])\nprint(merged)',
        expectedOutput: '[[1, 5], [7, 9]]',
      },
      visual: {
        widget: 'interval-bars',
        scale: 10,
        caption: 'On one number line, overlaps are obvious — then they merge.',
        beats: [
          { bars: [[1, 3], [2, 5], [7, 9]], tone: 'input', caption: 'Sorted by start. [1,3] and [2,5] overlap: 2 ≤ 3.' },
          { bars: [[1, 5], [7, 9]], tone: 'merged', caption: 'Merge into [1,5]; [7,9] starts after 5, so it stays separate.' },
        ],
        why: 'Sort by start, then merge any interval that begins before the last one ends.',
        verifyCode:
          'intervals = [[1, 3], [2, 5], [7, 9]]\nintervals.sort()\nmerged = [intervals[0]]\nfor s, e in intervals[1:]:\n    if s <= merged[-1][1]:\n        merged[-1][1] = max(merged[-1][1], e)\n    else:\n        merged.append([s, e])\nprint(merged)',
        verifyOutput: '[[1, 5], [7, 9]]',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'print([1, 3] if 2 <= 3 else [2, 5])',
        answer: '[1, 3]',
        why: '2 <= 3 is True (they overlap), so the ternary keeps the first interval.',
      },
      {
        type: 'predict',
        code: 'a = [1, 4]\na[1] = max(a[1], 6)\nprint(a)',
        answer: '[1, 6]',
        why: 'Merging extends the end to the larger of the two — the core merge move.',
      },
      {
        type: 'type',
        prompt: 'The overlap test: interval start s begins before merged[-1] ends.',
        answer: 's <= merged[-1][1]',
        why: 'merged[-1] is the last kept interval; [1] is its end.',
      },
      {
        type: 'write',
        brief: 'merge(intervals): merge all overlapping intervals (already valid pairs).',
        function_name: 'merge',
        starter_code: 'def merge(intervals):\n    intervals.sort()\n    merged = [intervals[0]]\n    \n',
        tests: [
          { args: [[[1, 3], [2, 5], [7, 9]]], expected: [[1, 5], [7, 9]] },
          { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
          { args: [[[1, 2]]], expected: [[1, 2]] },
        ],
        solution:
          'def merge(intervals):\n    intervals.sort()\n    merged = [intervals[0]]\n    for s, e in intervals[1:]:\n        if s <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], e)\n        else:\n            merged.append([s, e])\n    return merged\n',
        hint: 'Sort, seed merged with the first, then extend-or-append for each rest.',
      },
    ],
  },
  {
    id: 'ch7-greedy',
    chapter: 'search-windows',
    title: 'Greedy — the local best',
    minutes: 6,
    prereqs: ['ch7-intervals'],
    read: {
      text:
        'A **greedy** algorithm takes the locally best choice at each step and never looks back — and for the right problems, that yields the global best. The trick is spotting when "best now" is safe.\n\nClassic shape: to see if you can reach the end of a jump array, walk left to right tracking the FARTHEST index still reachable.',
      example: {
        code:
          'nums = [2, 3, 1, 1, 4]\nreach = 0\nfor i in range(len(nums)):\n    if i > reach:\n        break\n    reach = max(reach, i + nums[i])\nprint(reach >= len(nums) - 1)',
        expectedOutput: 'True',
      },
      visual: {
        widget: 'loop-tape',
        items: [2, 3, 1, 1, 4],
        accLabel: 'farthest reach',
        caption: 'Track only the farthest index reachable so far — one pass, no backtracking.',
        beats: [
          { at: 0, acc: 2, caption: 'From index 0 you can jump to 0 + 2 = 2. reach = 2.' },
          { at: 1, acc: 4, caption: 'Index 1 is within reach; 1 + 3 = 4 pushes reach to 4.' },
          { at: 4, acc: 8, caption: 'reach (4) already covers the last index — you can make it.' },
        ],
        why: 'Keep just the best reachable position; never revisit earlier choices.',
        verifyCode:
          'nums = [2, 3, 1, 1, 4]\nreach = 0\nfor i in range(len(nums)):\n    if i > reach:\n        break\n    reach = max(reach, i + nums[i])\nprint(reach >= len(nums) - 1)',
        verifyOutput: 'True',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'coins = [1, 2, 5]\namount = 11\nc = 0\nfor coin in [5, 2, 1]:\n    while amount >= coin:\n        amount = amount - coin\n        c = c + 1\nprint(c)',
        answer: '3',
        why: 'Greedily take the biggest coin that fits: 5 + 5 + 1 = 11, three coins.',
      },
      {
        type: 'predict',
        code:
          'nums = [3, 2, 1, 0, 4]\nreach = 0\nok = True\nfor i in range(len(nums)):\n    if i > reach:\n        ok = False\n        break\n    reach = max(reach, i + nums[i])\nprint(ok)',
        answer: 'False',
        why: 'reach stalls at index 3 (0 jump) and can never pass it — the end is stranded.',
      },
      {
        type: 'type',
        prompt: 'Update reach to the farthest index reachable from position i.',
        answer: 'reach = max(reach, i + nums[i])',
        why: 'From i you can land anywhere up to i + nums[i]; keep the farthest.',
      },
      {
        type: 'write',
        brief: 'can_reach_end(nums): True if you can reach the last index by jumping.',
        function_name: 'can_reach_end',
        starter_code: 'def can_reach_end(nums):\n    reach = 0\n    \n',
        tests: [
          { args: [[2, 3, 1, 1, 4]], expected: true },
          { args: [[3, 2, 1, 0, 4]], expected: false },
          { args: [[0]], expected: true },
        ],
        solution:
          'def can_reach_end(nums):\n    reach = 0\n    for i in range(len(nums)):\n        if i > reach:\n            return False\n        reach = max(reach, i + nums[i])\n    return True\n',
        hint: 'If i ever passes reach, you are stuck. Otherwise extend reach as you go.',
      },
    ],
  },
];
