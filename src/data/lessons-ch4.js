// Chapter 4 — Writing real code: def/return for real, arguments & scope,
// errors & try/except, comprehensions, sorting with key=, and a capstone.

export const LESSONS_CH4 = [
  {
    id: 'ch4-functions',
    chapter: 'real-code',
    title: 'def & return',
    minutes: 6,
    prereqs: ['ch3-iteration-tools'],
    read: {
      text:
        'You have been reading `def` for two chapters — now own it. `def` names a recipe; the names in parentheses are its inputs; `return` sends a value BACK to whoever called.\n\nThe classic confusion: `print` only SHOWS a value, `return` hands it over. A function that never returns gives back `None`.',
      example: { code: 'def double(n):\n    return n * 2\n\nprint(double(5))', expectedOutput: '10' },
    },
    items: [
      {
        type: 'predict',
        code: "def greet():\n    return 'hi'\n\nprint(greet())",
        answer: 'hi',
        why: 'greet() hands back the string; print shows it.',
      },
      {
        type: 'predict',
        code: 'def f(n):\n    return n + 1\n\nx = f(2)\nprint(x)',
        answer: '3',
        why: 'The returned value lands in x — functions feed variables.',
      },
      {
        type: 'type',
        prompt: 'The first line of a function named area that takes width and height.',
        answer: 'def area(width, height):',
        why: 'def, the name, the inputs in parentheses, a colon.',
      },
      {
        type: 'predict',
        code: "def shout(word):\n    print(word)\n\nx = shout('go')\nprint(x)",
        answer: 'go None',
        accept: ['go\nNone'],
        why: 'shout PRINTS but never RETURNS — so x is None. Printing is not returning.',
      },
      {
        type: 'write',
        brief: 'square(n): return n multiplied by itself.',
        function_name: 'square',
        starter_code: 'def square(n):\n    \n',
        tests: [
          { args: [3], expected: 9 },
          { args: [0], expected: 0 },
          { args: [-2], expected: 4 },
        ],
        solution: 'def square(n):\n    return n * n\n',
        hint: 'One line: return n * n.',
      },
      {
        type: 'predict',
        code: "def check(n):\n    if n > 10:\n        return 'big'\n    return 'small'\n\nprint(check(20))",
        answer: 'big',
        why: 'return EXITS the function immediately — the second return never runs for 20.',
      },
      {
        type: 'type',
        prompt: 'Send the value total back to the caller.',
        answer: 'return total',
        why: 'return + the value. The function ends right here.',
      },
      {
        type: 'fix',
        brief: 'add(a, b) shows the sum on screen but hands back nothing. Make it RETURN the sum.',
        code: 'def add(a, b):\n    print(a + b)\n',
        function_name: 'add',
        tests: [
          { args: [2, 3], expected: 5 },
          { args: [0, 0], expected: 0 },
        ],
        solution: 'def add(a, b):\n    return a + b\n',
        hint: 'print shows; return delivers. The tests need the value delivered.',
      },
    ],
  },
  {
    id: 'ch4-arguments',
    chapter: 'real-code',
    title: 'Arguments, defaults & scope',
    minutes: 6,
    prereqs: ['ch4-functions'],
    read: {
      text:
        'Arguments match **by position**, or **by name** (`area(width=3, height=4)`). A default makes one optional: `def f(a, b=2)`.\n\nAnd scope: a variable born INSIDE a function lives only there — same name outside is a different variable. That isolation is why functions are safe to reuse.',
      example: {
        code: "def power_up(name, boost=10):\n    return name + ' +' + str(boost)\n\nprint(power_up('zoro'))",
        expectedOutput: 'zoro +10',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'def f(a, b=2):\n    return a * b\n\nprint(f(3))',
        answer: '6',
        why: 'b was not given, so its default 2 steps in.',
      },
      {
        type: 'predict',
        code: 'def f(a, b=2):\n    return a * b\n\nprint(f(3, 5))',
        answer: '15',
        why: 'A supplied value beats the default.',
      },
      {
        type: 'type',
        prompt: 'Define greet taking a name, and a greeting that defaults to hello.',
        answer: "def greet(name, greeting='hello'):",
        why: 'Defaults go after required arguments.',
      },
      {
        type: 'predict',
        code: 'def sub(a, b):\n    return a - b\n\nprint(sub(b=1, a=5))',
        answer: '4',
        why: 'Named arguments can arrive in any order — the names do the matching.',
      },
      {
        type: 'predict',
        code: 'def f():\n    x = 5\n    return x\n\nx = 1\nf()\nprint(x)',
        answer: '1',
        why: 'The x inside f is a DIFFERENT x — it is born and dies inside the call.',
      },
      {
        type: 'write',
        brief: 'clamp(n, lo=0, hi=10): push n inside the range [lo, hi] — too small becomes lo, too big becomes hi.',
        function_name: 'clamp',
        starter_code: 'def clamp(n, lo=0, hi=10):\n    \n',
        tests: [
          { args: [15], expected: 10 },
          { args: [-3], expected: 0 },
          { args: [5], expected: 5 },
          { args: [15, 0, 20], expected: 15 },
        ],
        solution: 'def clamp(n, lo=0, hi=10):\n    return min(max(n, lo), hi)\n',
        hint: 'max(n, lo) fixes the floor; min of that and hi fixes the ceiling.',
      },
      {
        type: 'type',
        prompt: 'Call area with width 3 and height 4, matching BY NAME.',
        answer: 'area(width=3, height=4)',
        why: 'Named calls read like documentation — no guessing which number is which.',
      },
    ],
  },
  {
    id: 'ch4-errors',
    chapter: 'real-code',
    title: 'Errors & try/except',
    minutes: 6,
    prereqs: ['ch4-functions'],
    read: {
      text:
        'Errors are messages, not punishments. Read the LAST line first: the **type** says what went wrong (`IndexError` — position too big, `KeyError` — missing dict key, `TypeError` — wrong kind of value, `ValueError` — right kind, bad content).\n\n`try`/`except` runs risky code and catches ONE named failure instead of crashing.',
      example: {
        code: "try:\n    print([1, 2][5])\nexcept IndexError:\n    print('index too big')",
        expectedOutput: 'index too big',
      },
      visual: {
        widget: 'branch-flow',
        caption: 'try runs risky code; if it raises, the matching except path takes over.',
        beats: [
          {
            value: '[1, 2][5]',
            branches: [
              { test: 'try succeeds', taken: false, label: 'use the value' },
              { test: 'except IndexError', taken: true, label: "print('index too big')" },
            ],
            caption: 'Position 5 does not exist → IndexError → the except path runs instead of crashing.',
          },
          {
            value: "int('abc')",
            branches: [
              { test: 'try succeeds', taken: false, label: 'use the number' },
              { test: 'except ValueError', taken: true, label: "print('not a number')" },
            ],
            caption: "'abc' is the right TYPE but bad CONTENT → ValueError, caught by except.",
          },
        ],
        why: 'try/except catches ONE named failure and keeps the program alive.',
        verifyCode: "try:\n    print([1, 2][5])\nexcept IndexError:\n    print('index too big')",
        verifyOutput: 'index too big',
      },
    },
    items: [
      {
        type: 'predict',
        code: "try:\n    int('abc')\nexcept ValueError:\n    print('not a number')",
        answer: 'not a number',
        why: "int received the right TYPE (a string) with bad CONTENT — that's ValueError.",
      },
      {
        type: 'predict',
        code: "d = {}\ntry:\n    d['x']\nexcept KeyError:\n    print('missing')",
        answer: 'missing',
        why: 'Reading a missing key raises KeyError — exactly what .get(key, default) avoids.',
      },
      {
        type: 'type',
        prompt: 'The line that starts the block which might fail.',
        answer: 'try:',
        why: 'try guards; except catches.',
      },
      {
        type: 'type',
        prompt: 'Catch a KeyError.',
        answer: 'except KeyError:',
        why: 'Name the error you expect — a bare except hides bugs you WANT to see.',
      },
      {
        type: 'predict',
        code: "try:\n    print(1 + 1)\nexcept TypeError:\n    print('bad')",
        answer: '2',
        why: 'Nothing failed, so except never runs — it is a net, not a step.',
      },
      {
        type: 'predict',
        code: "try:\n    len(5)\nexcept TypeError:\n    print('TypeError')",
        answer: 'TypeError',
        why: 'len needs something with a length — a number is the wrong TYPE.',
      },
      {
        type: 'write',
        brief: 'safe_div(a, b): a divided by b — but return 0 instead of crashing when b is 0.',
        function_name: 'safe_div',
        starter_code: 'def safe_div(a, b):\n    \n',
        tests: [
          { args: [6, 3], expected: 2 },
          { args: [1, 0], expected: 0 },
          { args: [7, 2], expected: 3.5 },
        ],
        solution:
          'def safe_div(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return 0\n',
        hint: 'try the division; except ZeroDivisionError: return 0.',
      },
    ],
  },
  {
    id: 'ch4-comprehensions',
    chapter: 'real-code',
    title: 'Comprehensions',
    minutes: 6,
    prereqs: ['ch4-arguments'],
    read: {
      text:
        'A **comprehension** is a build-a-list loop in one line: `[n * 2 for n in nums]` — the append is implied. Add a filter at the end: `[n for n in nums if n % 2 == 0]`.\n\nRead it as English: "n doubled, for each n in nums". When the line stops reading like English, use a normal loop.',
      example: { code: 'print([n * 2 for n in [1, 2, 3]])', expectedOutput: '[2, 4, 6]' },
    },
    items: [
      {
        type: 'predict',
        code: 'print([n + 1 for n in [1, 2]])',
        answer: '[2, 3]',
        why: 'Each n comes out transformed — a new list, same length.',
      },
      {
        type: 'predict',
        code: 'print([n for n in [1, 2, 3, 4] if n % 2 == 0])',
        answer: '[2, 4]',
        why: 'The if FILTERS — only passing items make it in.',
      },
      {
        type: 'type',
        prompt: 'The squares of every n in nums, in one line.',
        answer: '[n * n for n in nums]',
        accept: ['[n ** 2 for n in nums]'],
        why: 'Transform shape: [expression for item in sequence].',
      },
      {
        type: 'predict',
        code: "print([ch.upper() for ch in 'ab'])",
        answer: "['A', 'B']",
        why: 'Comprehensions walk strings too — one item per character.',
      },
      {
        type: 'type',
        prompt: 'Only the names longer than 3 characters.',
        answer: '[name for name in names if len(name) > 3]',
        why: 'Filter shape: keep the item unchanged, test at the end.',
      },
      {
        type: 'write',
        brief: 'evens_doubled(nums): double only the even numbers (transform + filter in one line).',
        function_name: 'evens_doubled',
        starter_code: 'def evens_doubled(nums):\n    \n',
        tests: [
          { args: [[1, 2, 3, 4]], expected: [4, 8] },
          { args: [[1]], expected: [] },
        ],
        solution: 'def evens_doubled(nums):\n    return [n * 2 for n in nums if n % 2 == 0]\n',
        hint: 'Expression n * 2, filter n % 2 == 0 — both in one comprehension.',
      },
      {
        type: 'predict',
        code: 'print(sum(n * n for n in [1, 2, 3]))',
        answer: '14',
        why: 'sum can eat a comprehension directly (no brackets needed): 1 + 4 + 9.',
      },
    ],
  },
  {
    id: 'ch4-sorting',
    chapter: 'real-code',
    title: 'Sorting & key=',
    minutes: 6,
    prereqs: ['ch4-comprehensions'],
    read: {
      text:
        '`sorted(x)` returns a NEW sorted list; `x.sort()` sorts the list in place (and returns None — a classic trap). `reverse=True` flips the order.\n\nThe power move is `key=`: tell Python what to compare — `key=len`, `key=str.lower`, or a lambda like `key=lambda p: p[1]` for "sort by the second element".',
      example: { code: 'print(sorted([3, 1, 2]))', expectedOutput: '[1, 2, 3]' },
    },
    items: [
      {
        type: 'predict',
        code: 'print(sorted([3, 1, 2], reverse=True))',
        answer: '[3, 2, 1]',
        why: 'Same sort, flipped.',
      },
      {
        type: 'predict',
        code: "print(sorted(['bb', 'a'], key=len))",
        answer: "['a', 'bb']",
        why: 'key=len sorts by LENGTH, not alphabet.',
      },
      {
        type: 'type',
        prompt: 'Sort words by their length.',
        answer: 'sorted(words, key=len)',
        why: 'Pass the FUNCTION itself — no parentheses after len.',
      },
      {
        type: 'predict',
        code: "print(sorted([(2, 'b'), (1, 'a')]))",
        answer: "[(1, 'a'), (2, 'b')]",
        why: 'Tuples compare element by element — first by the number, ties by the letter.',
      },
      {
        type: 'type',
        prompt: 'Sort pairs by their SECOND element, using a lambda.',
        answer: 'sorted(pairs, key=lambda p: p[1])',
        why: 'A lambda is a tiny unnamed function: given p, compare by p[1].',
      },
      {
        type: 'predict',
        code: 'nums = [3, 1]\nnums.sort()\nprint(nums)',
        answer: '[1, 3]',
        why: '.sort() changed nums itself. (print(nums.sort()) would have shown None!)',
      },
      {
        type: 'write',
        brief: 'top_scorer(pairs): each pair is [name, score] — return the NAME with the highest score (scores are unique).',
        function_name: 'top_scorer',
        starter_code: 'def top_scorer(pairs):\n    \n',
        tests: [
          { args: [[['zoro', 90], ['nami', 95]]], expected: 'nami' },
          { args: [[['luffy', 100]]], expected: 'luffy' },
        ],
        solution: 'def top_scorer(pairs):\n    return max(pairs, key=lambda p: p[1])[0]\n',
        hint: 'max also takes key= — find the winning pair, then take its [0].',
      },
      {
        type: 'predict',
        code: "print(sorted('cab'))",
        answer: "['a', 'b', 'c']",
        why: 'sorted on a string gives a LIST of its characters, in order.',
      },
    ],
  },
  {
    id: 'ch4-capstone',
    chapter: 'real-code',
    title: 'Capstone: the everyday trio',
    minutes: 7,
    prereqs: ['ch4-sorting', 'ch4-errors'],
    read: {
      text:
        'Functions + comprehensions + sorting is the trio you will use in almost every real task. Same drill as chapter 2: one-sentence plan first, then code.\n\nAfter this capstone the Warm-up Intermediate level is your speed test — and the path questions start feeling like puzzles instead of walls.',
      example: {
        code: "names = ['zoro', 'nami']\nprint(sorted(n.upper() for n in names))",
        expectedOutput: "['NAMI', 'ZORO']",
      },
    },
    transfer: { warmup: 'intermediate', question: 'py-valid-anagram' },
    items: [
      {
        type: 'predict',
        code: "print([len(w) for w in ['go', 'gomu']])",
        answer: '[2, 4]',
        why: 'Transform each word into its length.',
      },
      {
        type: 'write',
        brief: 'initials(names): the uppercased first letter of each name.',
        function_name: 'initials',
        starter_code: 'def initials(names):\n    \n',
        tests: [
          { args: [['zoro', 'nami']], expected: ['Z', 'N'] },
          { args: [[]], expected: [] },
        ],
        solution: 'def initials(names):\n    return [n[0].upper() for n in names]\n',
        hint: 'n[0] slices the first character; .upper() shouts it.',
      },
      {
        type: 'write',
        brief: 'longest_word(words): the longest word (lengths are unique).',
        function_name: 'longest_word',
        starter_code: 'def longest_word(words):\n    \n',
        tests: [
          { args: [['go', 'gomu']], expected: 'gomu' },
          { args: [['a']], expected: 'a' },
        ],
        solution: 'def longest_word(words):\n    return max(words, key=len)\n',
        hint: 'max with key=len — the sorting lesson, one word at a time.',
      },
      {
        type: 'write',
        brief: 'sort_by_bounty(pairs): pairs of [name, bounty] sorted by bounty, HIGHEST first.',
        function_name: 'sort_by_bounty',
        starter_code: 'def sort_by_bounty(pairs):\n    \n',
        tests: [
          { args: [[['z', 10], ['n', 30]]], expected: [['n', 30], ['z', 10]] },
          { args: [[]], expected: [] },
        ],
        solution:
          'def sort_by_bounty(pairs):\n    return sorted(pairs, key=lambda p: p[1], reverse=True)\n',
        hint: 'key picks the bounty, reverse=True puts the biggest first.',
      },
      {
        type: 'watch',
        caption: 'The loop version of a comprehension — watch the list grow item by item.',
        code: 'def keep_evens(nums):\n    out = []\n    for n in nums:\n        if n % 2 == 0:\n            out.append(n)\n    return out\n',
        function_name: 'keep_evens',
        tests: [{ args: [[1, 2, 4]], expected: [2, 4] }],
      },
    ],
  },
];
