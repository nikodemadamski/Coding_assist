// Chapter 3 — Collections: lists, slicing, tuples & unpacking, dicts (and
// .get()!), sets, and the iteration toolkit (enumerate/zip/.items()). This is
// the chapter that unlocks most of the question bank.

export const LESSONS_CH3 = [
  {
    id: 'ch3-lists',
    chapter: 'collections',
    title: 'Lists',
    minutes: 5,
    prereqs: ['ch2-capstone'],
    read: {
      text:
        'A **list** holds values in order: `nums = [3, 1, 4]`. Read by position with `nums[0]` (counting starts at 0!), and `nums[-1]` is the LAST element — negative counts from the end.\n\nGrow with `nums.append(x)`, measure with `len(nums)`, test membership with `in`.',
      example: { code: 'nums = [3, 1, 4]\nprint(nums[0], nums[-1])', expectedOutput: '3 4' },
      visual: {
        widget: 'list-cells',
        list: [3, 1, 4],
        caption: 'A list is boxes in a row. Each box has a position — its index.',
        beats: [
          { caption: 'Positions start at 0. nums[0] is the FIRST box.', pointer: 0 },
          { caption: 'nums[1] is the next one along.', pointer: 1 },
          { caption: 'nums[-1] counts from the END — the last box, whatever the length.', pointer: -1 },
        ],
        why: 'The pointer is the index. 0 is the first box, and negatives walk in from the end.',
        verifyCode: 'nums = [3, 1, 4]\nprint(nums[0], nums[1], nums[-1])',
        verifyOutput: '3 1 4',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'nums = [3, 1, 4]\nprint(nums[0])',
        answer: '3',
        why: 'Position 0 is the FIRST element — off-by-one bug #1 in all of programming.',
      },
      {
        type: 'predict',
        code: 'nums = [3, 1, 4]\nprint(nums[-1])',
        answer: '4',
        why: '-1 counts from the end: the last element, however long the list is.',
      },
      {
        type: 'type',
        prompt: 'Add 5 to the end of nums.',
        answer: 'nums.append(5)',
        why: 'append grows the list in place — no new list is made.',
      },
      {
        type: 'predict',
        code: 'nums = [1, 2]\nnums.append(7)\nprint(len(nums))',
        answer: '3',
        why: 'append really changed nums — len sees the new size.',
      },
      {
        type: 'predict',
        code: 'print([1, 2] + [3])',
        answer: '[1, 2, 3]',
        why: '+ glues lists like it glues strings — a new, combined list.',
      },
      {
        type: 'type',
        prompt: 'An empty list called seen.',
        answer: 'seen = []',
        accept: ['seen = list()'],
        why: 'Square brackets make lists; empty ones start most accumulate loops.',
      },
      {
        type: 'fix',
        brief: 'last_of(nums) should return the LAST element — it returns the first. One character to change.',
        code: 'def last_of(nums):\n    return nums[0]\n',
        function_name: 'last_of',
        tests: [
          { args: [[3, 1, 4]], expected: 4 },
          { args: [[7]], expected: 7 },
        ],
        solution: 'def last_of(nums):\n    return nums[-1]\n',
        hint: 'Negative positions count from the end.',
      },
      {
        type: 'predict',
        code: 'print(3 in [1, 2, 3])',
        answer: 'True',
        why: '`in` asks "is this value anywhere in the list?" — a boolean back.',
      },
    ],
  },
  {
    id: 'ch3-slicing',
    chapter: 'collections',
    title: 'Slicing',
    minutes: 6,
    prereqs: ['ch3-lists'],
    read: {
      text:
        'A **slice** cuts a piece: `nums[1:3]` takes positions 1 and 2 — **start included, end excluded**. Leave an end open: `nums[:2]` is the first two, `nums[2:]` the rest.\n\nA third number is the step, and a step of `-1` walks backwards — `s[::-1]` is THE reverse idiom. Slices work on strings too.',
      example: { code: 'nums = [10, 20, 30, 40]\nprint(nums[1:3])', expectedOutput: '[20, 30]' },
      visual: {
        widget: 'list-cells',
        list: [10, 20, 30, 40],
        caption: 'A slice grabs a RANGE of boxes — watch which ones it includes.',
        beats: [
          { caption: 'nums[1:3] — start 1 included…', pointer: 1 },
          { caption: '…end 3 EXCLUDED. So the shaded range is positions 1 and 2.', slice: [1, 3] },
          { caption: 'nums[:2] — open start means "from the beginning": the first two.', slice: [0, 2] },
          { caption: 'nums[2:] — open end means "to the end": the rest.', slice: [2, 4] },
        ],
        why: 'Start included, end excluded — the shaded band is exactly what the slice returns.',
        verifyCode: 'nums = [10, 20, 30, 40]\nprint(nums[1:3], nums[:2], nums[2:])',
        verifyOutput: '[20, 30] [10, 20] [30, 40]',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'nums = [10, 20, 30, 40]\nprint(nums[:2])',
        answer: '[10, 20]',
        why: 'Open start means "from the beginning" — two elements, positions 0 and 1.',
      },
      {
        type: 'predict',
        code: 'nums = [10, 20, 30, 40]\nprint(nums[2:])',
        answer: '[30, 40]',
        why: 'Open end means "to the end".',
      },
      {
        type: 'type',
        prompt: 'The first three elements of nums.',
        answer: 'nums[:3]',
        accept: ['nums[0:3]'],
        why: 'End position 3 is EXCLUDED — you get 0, 1, 2. Three elements, as asked.',
      },
      {
        type: 'predict',
        code: "print('python'[1:4])",
        answer: 'yth',
        why: 'Strings slice exactly like lists: positions 1, 2, 3.',
      },
      {
        type: 'predict',
        code: 'print([1, 2, 3][::-1])',
        answer: '[3, 2, 1]',
        why: 'Step -1 walks the whole thing backwards — the reverse idiom.',
      },
      {
        type: 'type',
        prompt: 'A reversed copy of the string s.',
        answer: 's[::-1]',
        why: 'The famous one-liner — now you know WHY it works: empty start/end, step -1.',
      },
      {
        type: 'write',
        brief: 'first_half(nums): the first half of the list (for odd lengths, the smaller half).',
        function_name: 'first_half',
        starter_code: 'def first_half(nums):\n    \n',
        tests: [
          { args: [[1, 2, 3, 4]], expected: [1, 2] },
          { args: [[1, 2, 3]], expected: [1] },
          { args: [[]], expected: [] },
        ],
        solution: 'def first_half(nums):\n    return nums[: len(nums) // 2]\n',
        hint: 'Slice up to len(nums) // 2 — floor division from chapter 1 earns its keep.',
      },
      {
        type: 'predict',
        code: 'nums = [1, 2, 3]\nprint(nums[1:])',
        answer: '[2, 3]',
        why: '"Everything but the first" — a slice you will type a thousand times.',
      },
    ],
  },
  {
    id: 'ch3-tuples',
    chapter: 'collections',
    title: 'Tuples & unpacking',
    minutes: 5,
    prereqs: ['ch3-lists'],
    read: {
      text:
        'A **tuple** is a list that cannot change: `point = (3, 4)`. Use it for small fixed bundles — a pair of coordinates, a (name, score).\n\nThe superpower is **unpacking**: `x, y = point` pulls it apart into variables. That is also how Python swaps: `a, b = b, a` — no temp variable.',
      example: { code: 'point = (3, 4)\nx, y = point\nprint(x, y)', expectedOutput: '3 4' },
    },
    items: [
      {
        type: 'predict',
        code: 'point = (3, 4)\nprint(point[0])',
        answer: '3',
        why: 'Tuples index just like lists — they simply refuse to change afterwards.',
      },
      {
        type: 'predict',
        code: 'x, y = (3, 4)\nprint(y)',
        answer: '4',
        why: 'Unpacking assigns left-to-right: x gets 3, y gets 4.',
      },
      {
        type: 'type',
        prompt: 'Swap a and b in one line, no temp variable.',
        answer: 'a, b = b, a',
        why: 'The right side is bundled BEFORE the assignment — that is why nothing is lost.',
      },
      {
        type: 'predict',
        code: 'a = 1\nb = 2\na, b = b, a\nprint(a, b)',
        answer: '2 1',
        why: 'The swap in action.',
      },
      {
        type: 'predict',
        code: 'print(len((1, 2, 3)))',
        answer: '3',
        why: 'len, indexing, in, slicing — the sequence toolkit works on tuples too.',
      },
      {
        type: 'type',
        prompt: 'A tuple holding just the number 5.',
        answer: '(5,)',
        why: 'The COMMA makes the tuple — (5) is just the number 5 in parentheses.',
      },
      {
        type: 'write',
        brief: 'min_max(nums): return the pair (smallest, largest) as a tuple.',
        function_name: 'min_max',
        starter_code: 'def min_max(nums):\n    \n',
        tests: [
          { args: [[3, 1, 4]], expected: [1, 4] },
          { args: [[7]], expected: [7, 7] },
        ],
        solution: 'def min_max(nums):\n    return (min(nums), max(nums))\n',
        hint: 'min and max from chapter 1, bundled into one tuple.',
      },
    ],
  },
  {
    id: 'ch3-dicts',
    chapter: 'collections',
    title: 'Dicts — and .get()',
    minutes: 7,
    prereqs: ['ch3-tuples'],
    read: {
      text:
        "A **dict** maps keys to values: `bounties = {'zoro': 1111}`. Read with `bounties['zoro']` — but a missing key CRASHES. `bounties.get(key, 0)` reads safely, giving you the default instead.\n\nWrite with `d[key] = value`. `key in d` tests keys. `.get` powers the single most useful beginner pattern: counting things.",
      example: { code: "bounties = {'zoro': 1111}\nprint(bounties.get('nami', 0))", expectedOutput: '0' },
    },
    items: [
      {
        type: 'predict',
        code: "ages = {'zoro': 21}\nprint(ages['zoro'])",
        answer: '21',
        why: 'Square brackets with a KEY, not a position — dicts have no order you should rely on.',
      },
      {
        type: 'predict',
        code: "d = {'a': 1}\nprint(d.get('b', 0))",
        answer: '0',
        why: ".get never crashes: missing key → your default. d['b'] would have been a KeyError.",
      },
      {
        type: 'type',
        prompt: "Read name's value from ages — or 0 if name is not there.",
        answer: 'ages.get(name, 0)',
        why: 'The safe read. The second argument is what you get when the key is missing.',
      },
      {
        type: 'predict',
        code: "d = {}\nd['x'] = 5\nprint(d['x'])",
        answer: '5',
        why: 'Assigning to a key creates it — dicts grow on write.',
      },
      {
        type: 'type',
        prompt: 'Store 3000 under the key zoro in bounties.',
        answer: "bounties['zoro'] = 3000",
        why: 'Write syntax is read syntax plus =.',
      },
      {
        type: 'predict',
        code: "counts = {}\nfor ch in 'aba':\n    counts[ch] = counts.get(ch, 0) + 1\nprint(counts['a'])",
        answer: '2',
        why: 'THE counting pattern: .get supplies 0 the first time a key appears, then it climbs.',
      },
      {
        type: 'write',
        brief: 'count_letters(word): a dict of how many times each character appears. (A real interview warm-up.)',
        function_name: 'count_letters',
        starter_code: 'def count_letters(word):\n    counts = {}\n    \n',
        tests: [
          { args: ['aba'], expected: { a: 2, b: 1 } },
          { args: [''], expected: {} },
        ],
        solution:
          'def count_letters(word):\n    counts = {}\n    for ch in word:\n        counts[ch] = counts.get(ch, 0) + 1\n    return counts\n',
        hint: 'The pattern from the previous exercise, wrapped up and returned.',
      },
      {
        type: 'predict',
        code: "print('zoro' in {'zoro': 1111})",
        answer: 'True',
        why: '`in` on a dict checks KEYS — values need `in d.values()`.',
      },
    ],
  },
  {
    id: 'ch3-sets',
    chapter: 'collections',
    title: 'Sets',
    minutes: 5,
    prereqs: ['ch3-dicts'],
    read: {
      text:
        'A **set** holds each value at most once and answers `in` FAST — that pair of facts solves a whole family of problems (seen it before? any duplicates?).\n\nMake one with `{1, 2, 3}` or `set()` — careful: `{}` makes an empty DICT. Grow with `.add(x)`.',
      example: { code: 'print(len({1, 2, 2, 3}))', expectedOutput: '3' },
    },
    items: [
      {
        type: 'predict',
        code: 'seen = set()\nseen.add(2)\nseen.add(2)\nprint(len(seen))',
        answer: '1',
        why: 'Adding the same value twice changes nothing — sets keep one of each.',
      },
      {
        type: 'type',
        prompt: 'An empty set called seen.',
        answer: 'seen = set()',
        why: '{} would be an empty dict — the one place the braces betray you.',
      },
      {
        type: 'type',
        prompt: 'Add n to the set seen.',
        answer: 'seen.add(n)',
        why: 'add for sets, append for lists.',
      },
      {
        type: 'predict',
        code: 'print(3 in {1, 2, 3})',
        answer: 'True',
        why: 'Fast membership is the whole point of a set.',
      },
      {
        type: 'write',
        brief:
          'has_duplicate(nums): True if any value appears twice. (This IS the interview question "Contains Duplicate" — remember the shape.)',
        function_name: 'has_duplicate',
        starter_code: 'def has_duplicate(nums):\n    seen = set()\n    \n',
        tests: [
          { args: [[1, 2, 2]], expected: true },
          { args: [[1, 2]], expected: false },
          { args: [[]], expected: false },
        ],
        solution:
          'def has_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return True\n        seen.add(n)\n    return False\n',
        hint: 'For each n: seen before? → True. Otherwise remember it. Survive the loop → False.',
      },
      {
        type: 'predict',
        code: "print(len(set('banana')))",
        answer: '3',
        why: "set('banana') keeps the distinct characters: b, a, n.",
      },
    ],
  },
  {
    id: 'ch3-iteration-tools',
    chapter: 'collections',
    title: 'enumerate, zip & .items()',
    minutes: 6,
    prereqs: ['ch3-sets'],
    read: {
      text:
        'Three loops you will type forever. `enumerate(nums)` gives position AND value. `zip(a, b)` walks two sequences in step. `d.items()` gives each key AND value of a dict.\n\nAll three use tuple unpacking right in the for line — that is why chapter 3 taught tuples first.',
      example: { code: "for i, ch in enumerate('ab'):\n    print(i, ch)", expectedOutput: '0 a\n1 b' },
    },
    items: [
      {
        type: 'predict',
        code: "for i, ch in enumerate('ab'):\n    print(i, ch)",
        answer: '0 a 1 b',
        accept: ['0 a\n1 b'],
        why: 'enumerate hands you (position, value) pairs — no manual counter.',
      },
      {
        type: 'type',
        prompt: 'Loop over nums with both the position i and the value n.',
        answer: 'for i, n in enumerate(nums):',
        why: 'Unpacking in the for line — the pythonic replacement for range(len(nums)).',
      },
      {
        type: 'predict',
        code: 'for a, b in zip([1, 2], [3, 4]):\n    print(a + b)',
        answer: '4 6',
        accept: ['4\n6'],
        why: 'zip pairs the sequences up: (1,3) then (2,4).',
      },
      {
        type: 'type',
        prompt: 'Pair each name with its bounty as you loop (two lists: names, bounties).',
        answer: 'for name, bounty in zip(names, bounties):',
        why: 'Walking two lists in step without indexes.',
      },
      {
        type: 'predict',
        code: "d = {'a': 1, 'b': 2}\nfor k, v in d.items():\n    print(k, v)",
        answer: 'a 1 b 2',
        accept: ['a 1\nb 2'],
        why: '.items() yields (key, value) pairs — the dict loop you will use constantly.',
      },
      {
        type: 'type',
        prompt: 'Loop over the dict d getting each key AND value.',
        answer: 'for k, v in d.items():',
        why: 'Without .items() you get keys only.',
      },
      {
        type: 'write',
        brief: 'index_of(nums, target): the position of target in nums, or -1 if absent. Use enumerate.',
        function_name: 'index_of',
        starter_code: 'def index_of(nums, target):\n    \n',
        tests: [
          { args: [[4, 7], 7], expected: 1 },
          { args: [[4], 9], expected: -1 },
          { args: [[5, 5], 5], expected: 0 },
        ],
        solution:
          'def index_of(nums, target):\n    for i, n in enumerate(nums):\n        if n == target:\n            return i\n    return -1\n',
        hint: 'enumerate gives you i; return it the moment n equals target.',
      },
      {
        type: 'predict',
        code: 'print(list(range(3)))',
        answer: '[0, 1, 2]',
        why: 'range is lazy — list(...) makes it show its contents.',
      },
    ],
  },
];
