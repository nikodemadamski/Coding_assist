// Chapter 2 — Decisions & repetition: if/elif/else, while, for, the three
// loop shapes, break/continue, and a small capstone. First hands-on code
// items appear here (fix/write/watch) — def wraps them, with briefs framing
// it as "the recipe line" until chapter 4 teaches it properly.

export const LESSONS_CH2 = [
  {
    id: 'ch2-if',
    chapter: 'decisions-loops',
    title: 'if, elif, else',
    minutes: 5,
    prereqs: ['ch1-booleans'],
    read: {
      text:
        '`if` runs its indented block only when the condition is true. The **indentation IS the block** — that is how Python knows what belongs to the if.\n\nChain choices with `elif` (another test) and `else` (everything left over). In a chain, only the FIRST true branch runs — the rest are skipped.',
      example: {
        code: "power = 95\nif power > 90:\n    print('strong')\nelse:\n    print('training')",
        expectedOutput: 'strong',
      },
    },
    items: [
      {
        type: 'predict',
        code: "x = 5\nif x > 3:\n    print('big')",
        answer: 'big',
        why: 'x > 3 is True, so the indented block runs.',
      },
      {
        type: 'predict',
        code: "x = 2\nif x > 3:\n    print('big')\nelse:\n    print('small')",
        answer: 'small',
        why: 'The if failed, so else takes over.',
      },
      {
        type: 'type',
        prompt: 'The first line of an if checking that hp equals 0.',
        answer: 'if hp == 0:',
        why: 'Condition, then a colon — and remember == compares, = stores.',
      },
      {
        type: 'predict',
        code: "score = 75\nif score >= 90:\n    print('A')\nelif score >= 70:\n    print('B')\nelse:\n    print('C')",
        answer: 'B',
        why: 'The chain stops at the first true test — 75 is not ≥ 90, but is ≥ 70.',
      },
      {
        type: 'predict',
        code: "x = 10\nif x > 5:\n    print('a')\nif x > 8:\n    print('b')",
        answer: 'a b',
        accept: ['a\nb'],
        why: 'Two SEPARATE ifs both run. An elif would have skipped the second.',
      },
      {
        type: 'type',
        prompt: 'The line that catches everything the if and elif missed.',
        answer: 'else:',
        why: 'else has no condition — it is the "otherwise".',
      },
      {
        type: 'fix',
        brief:
          'This recipe should return the LARGER of two numbers, but it returns the smaller one. (The def line just wraps it — chapter 4 explains it. The bug is in the comparison.)',
        code: 'def bigger(a, b):\n    if a < b:\n        return a\n    return b\n',
        function_name: 'bigger',
        tests: [
          { args: [2, 7], expected: 7 },
          { args: [9, 3], expected: 9 },
          { args: [4, 4], expected: 4 },
        ],
        solution: 'def bigger(a, b):\n    if a > b:\n        return a\n    return b\n',
        hint: 'Read the if out loud: "if a is SMALLER than b, give back a". Is that the plan?',
      },
      {
        type: 'predict',
        code: "age = 20\nif age >= 18 and age < 25:\n    print('young adult')",
        answer: 'young adult',
        why: 'and joins two tests — both hold for 20.',
      },
    ],
  },
  {
    id: 'ch2-while',
    chapter: 'decisions-loops',
    title: 'while — repeat until',
    minutes: 6,
    prereqs: ['ch2-if'],
    read: {
      text:
        '`while` repeats its block as long as the condition stays true. Something INSIDE the loop must move the condition toward false — otherwise it never ends (this dojo kills runaway code after 5 seconds; real programs just hang).\n\nThe rhythm: set up before the loop, test at the top, change inside.',
      example: { code: 'n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1', expectedOutput: '3\n2\n1' },
      visual: {
        widget: 'var-boxes',
        caption: 'A while loop runs until its condition turns false. Watch n drive it.',
        beats: [
          { vars: { n: 3 }, caption: 'n is 3. while n > 0 is True — enter the loop.' },
          { vars: { n: 2 }, caption: 'n = n - 1 → 2. Still > 0, so loop again.' },
          { vars: { n: 1 }, caption: 'n → 1. Still > 0.' },
          { vars: { n: 0 }, caption: 'n → 0. Now n > 0 is False — the loop STOPS.' },
        ],
        why: 'Something inside must move n toward the exit, or the loop never ends.',
        verifyCode: 'n = 3\nwhile n > 0:\n    n = n - 1\nprint(n)',
        verifyOutput: '0',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'n = 2\nwhile n > 0:\n    print(n)\n    n = n - 1',
        answer: '2 1',
        accept: ['2\n1'],
        why: 'Two passes: prints 2, shrinks; prints 1, shrinks; 0 > 0 fails, done.',
      },
      {
        type: 'predict',
        code: 'total = 0\nn = 3\nwhile n > 0:\n    total = total + n\n    n = n - 1\nprint(total)',
        answer: '6',
        why: 'total collects 3 + 2 + 1 — printed once, AFTER the loop (see the indentation).',
      },
      {
        type: 'type',
        prompt: 'The first line of a loop that runs while lives is greater than 0.',
        answer: 'while lives > 0:',
        why: 'Same shape as if: condition, colon, indented block below.',
      },
      {
        type: 'predict',
        code: 'x = 1\nwhile x < 10:\n    x = x * 2\nprint(x)',
        answer: '16',
        why: 'x doubles: 1→2→4→8→16. At 16 the test fails — the last double happens INSIDE the loop.',
      },
      {
        type: 'fix',
        brief:
          'countdown(n) should return the list [n, …, 2, 1] — but 1 never makes it in. Fix the condition.',
        code: 'def countdown(n):\n    out = []\n    while n > 1:\n        out.append(n)\n        n = n - 1\n    return out\n',
        function_name: 'countdown',
        tests: [
          { args: [3], expected: [3, 2, 1] },
          { args: [1], expected: [1] },
        ],
        solution: 'def countdown(n):\n    out = []\n    while n > 0:\n        out.append(n)\n        n = n - 1\n    return out\n',
        hint: 'When n is 1, does `n > 1` let the loop run one more time?',
      },
      {
        type: 'type',
        prompt: 'Shrink n by one — the line that moves a countdown loop forward.',
        answer: 'n = n - 1',
        accept: ['n -= 1'],
        why: 'Without a line like this, the while condition never changes.',
      },
      {
        type: 'watch',
        caption: 'Watch total grow while n shrinks — two variables trading places.',
        code: 'def total_down(n):\n    total = 0\n    while n > 0:\n        total = total + n\n        n = n - 1\n    return total\n',
        function_name: 'total_down',
        tests: [{ args: [3], expected: 6 }],
      },
      {
        type: 'predict',
        code: "n = 0\nwhile n > 0:\n    print('hi')\nprint('done')",
        answer: 'done',
        why: 'The test is checked BEFORE the first pass — false at the start means the body never runs.',
      },
    ],
  },
  {
    id: 'ch2-for',
    chapter: 'decisions-loops',
    title: 'for & range',
    minutes: 5,
    prereqs: ['ch2-while'],
    read: {
      text:
        '`for` visits each item of a sequence, putting it in the loop variable one at a time. `range(n)` counts `0` up to (but **not including**) `n`; `range(a, b)` starts at `a`, stops before `b`.\n\nStrings are sequences too — a for loop walks them character by character.',
      example: { code: 'for i in range(3):\n    print(i)', expectedOutput: '0\n1\n2' },
      visual: {
        widget: 'loop-tape',
        items: [10, 20, 5],
        accLabel: 'total',
        caption: 'A for loop visits each item in turn. Watch total add them up.',
        beats: [
          { at: 0, acc: 10, caption: 'First pass: n is 10. total becomes 10.' },
          { at: 1, acc: 30, caption: 'n is 20. total climbs to 30.' },
          { at: 2, acc: 35, caption: 'n is 5. total ends at 35.' },
        ],
        why: 'The loop variable takes each value once; the accumulator carries the running total.',
        verifyCode: 'total = 0\nfor n in [10, 20, 5]:\n    total = total + n\nprint(total)',
        verifyOutput: '35',
      },
    },
    items: [
      {
        type: 'predict',
        code: "for i in range(2):\n    print('hi')",
        answer: 'hi hi',
        accept: ['hi\nhi'],
        why: 'range(2) gives 0 and 1 — two passes, whether or not you use i.',
      },
      {
        type: 'predict',
        code: 'for i in range(1, 4):\n    print(i)',
        answer: '1 2 3',
        accept: ['1\n2\n3'],
        why: 'Start included, stop excluded: 1, 2, 3 — never 4.',
      },
      {
        type: 'type',
        prompt: 'The first line of a loop over each name in the list names.',
        answer: 'for name in names:',
        why: 'for <variable> in <sequence>: — the variable is born right there.',
      },
      {
        type: 'predict',
        code: "for ch in 'abc':\n    print(ch)",
        answer: 'a b c',
        accept: ['a\nb\nc'],
        why: 'Strings are sequences of characters — for walks them one by one.',
      },
      {
        type: 'type',
        prompt: 'The first line of a loop counting from 0 up to (not including) n.',
        answer: 'for i in range(n):',
        why: 'The n-times loop — the most typed line in Python.',
      },
      {
        type: 'predict',
        code: 'total = 0\nfor i in range(4):\n    total = total + i\nprint(total)',
        answer: '6',
        why: '0 + 1 + 2 + 3 — remember range(4) never reaches 4.',
      },
      {
        type: 'fix',
        brief: 'repeat_word(word, n) should glue word n times — one copy goes missing. Fix the range.',
        code: "def repeat_word(word, n):\n    out = ''\n    for i in range(n - 1):\n        out = out + word\n    return out\n",
        function_name: 'repeat_word',
        tests: [
          { args: ['ha', 3], expected: 'hahaha' },
          { args: ['x', 1], expected: 'x' },
        ],
        solution: "def repeat_word(word, n):\n    out = ''\n    for i in range(n):\n        out = out + word\n    return out\n",
        hint: 'How many passes does range(n - 1) make? Count them for n = 1.',
      },
      {
        type: 'watch',
        caption: 'Watch ch take each letter in turn while the list grows.',
        code: 'def letters(word):\n    out = []\n    for ch in word:\n        out.append(ch)\n    return out\n',
        function_name: 'letters',
        tests: [{ args: ['abc'], expected: ['a', 'b', 'c'] }],
      },
    ],
  },
  {
    id: 'ch2-loop-patterns',
    chapter: 'decisions-loops',
    title: 'The three loop shapes',
    minutes: 6,
    prereqs: ['ch2-for'],
    read: {
      text:
        'Most loops are one of three shapes. **Accumulate**: start at 0, add each item. **Count**: start at 0, add 1 when a test passes. **Track the best**: keep the winner so far, replace it when something beats it.\n\nBefore writing any loop, say which shape it is — that sentence is half the code.',
      example: {
        code: 'count = 0\nfor n in [1, 2, 3, 4]:\n    if n % 2 == 0:\n        count = count + 1\nprint(count)',
        expectedOutput: '2',
      },
      visual: {
        widget: 'loop-tape',
        items: [1, 2, 3, 4],
        accLabel: 'count',
        caption: 'The COUNT shape: add 1 only when a test passes. Watch it tick.',
        beats: [
          { at: 0, acc: 0, caption: '1 is odd — the test fails, count stays 0.' },
          { at: 1, acc: 1, caption: '2 is even — count ticks up to 1.' },
          { at: 2, acc: 1, caption: '3 is odd — count stays 1.' },
          { at: 3, acc: 2, caption: '4 is even — count ends at 2.' },
        ],
        why: 'Count only moves on the passes where the condition holds.',
        verifyCode: 'count = 0\nfor n in [1, 2, 3, 4]:\n    if n % 2 == 0:\n        count = count + 1\nprint(count)',
        verifyOutput: '2',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'total = 0\nfor p in [10, 20, 5]:\n    total = total + p\nprint(total)',
        answer: '35',
        why: 'Accumulate: total sweeps up every pile.',
      },
      {
        type: 'write',
        brief: 'Count how many numbers in nums are even (n % 2 == 0). Shape: COUNT.',
        function_name: 'count_evens',
        starter_code: 'def count_evens(nums):\n    count = 0\n    \n',
        tests: [
          { args: [[1, 2, 3, 4]], expected: 2 },
          { args: [[1, 3]], expected: 0 },
          { args: [[]], expected: 0 },
        ],
        solution:
          'def count_evens(nums):\n    count = 0\n    for n in nums:\n        if n % 2 == 0:\n            count = count + 1\n    return count\n',
        hint: 'Loop over nums; when n % 2 == 0, add one to count; return count at the end (outside the loop).',
      },
      {
        type: 'predict',
        code: 'best = 0\nfor n in [3, 9, 4]:\n    if n > best:\n        best = n\nprint(best)',
        answer: '9',
        why: 'Track the best: best only moves when something beats it.',
      },
      {
        type: 'write',
        brief: 'Add up every pile of gold with a loop (no sum() yet — build the habit). Shape: ACCUMULATE.',
        function_name: 'total_gold',
        starter_code: 'def total_gold(piles):\n    total = 0\n    \n',
        tests: [
          { args: [[10, 20, 5]], expected: 35 },
          { args: [[]], expected: 0 },
          { args: [[7]], expected: 7 },
        ],
        solution: 'def total_gold(piles):\n    total = 0\n    for p in piles:\n        total = total + p\n    return total\n',
        hint: 'Start total at 0, add each p inside the loop, return total after it.',
      },
      {
        type: 'write',
        brief: 'Return the biggest number in nums (all numbers are positive). Shape: TRACK THE BEST.',
        function_name: 'biggest',
        starter_code: 'def biggest(nums):\n    best = 0\n    \n',
        tests: [
          { args: [[3, 9, 4]], expected: 9 },
          { args: [[5]], expected: 5 },
          { args: [[2, 2]], expected: 2 },
        ],
        solution: 'def biggest(nums):\n    best = 0\n    for n in nums:\n        if n > best:\n            best = n\n    return best\n',
        hint: 'Compare each n against best; replace best when n wins.',
      },
      {
        type: 'predict',
        code: "count = 0\nfor ch in 'banana':\n    if ch == 'a':\n        count = count + 1\nprint(count)",
        answer: '3',
        why: 'Count over a string — same shape, characters instead of numbers.',
      },
    ],
  },
  {
    id: 'ch2-break-continue',
    chapter: 'decisions-loops',
    title: 'break & continue',
    minutes: 5,
    prereqs: ['ch2-loop-patterns'],
    read: {
      text:
        '`break` leaves the loop immediately — the classic "found it, stop looking". `continue` skips the REST of this pass and moves to the next item.\n\nBoth live inside an `if`; on their own they would fire on the first pass every time.',
      example: {
        code: 'for n in [4, 12, 9]:\n    if n > 10:\n        print(n)\n        break',
        expectedOutput: '12',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'for i in range(5):\n    if i == 3:\n        break\n    print(i)',
        answer: '0 1 2',
        accept: ['0\n1\n2'],
        why: 'At i == 3 the break fires BEFORE the print — 3 never shows.',
      },
      {
        type: 'predict',
        code: 'for i in range(4):\n    if i == 1:\n        continue\n    print(i)',
        answer: '0 2 3',
        accept: ['0\n2\n3'],
        why: 'continue skips only the pass where i is 1; the loop itself goes on.',
      },
      {
        type: 'type',
        prompt: 'Leave the loop right now.',
        answer: 'break',
        why: 'One word, out of the loop entirely.',
      },
      {
        type: 'type',
        prompt: 'Skip the rest of this pass and move to the next item.',
        answer: 'continue',
        why: 'The pass ends; the loop continues with the next item.',
      },
      {
        type: 'predict',
        code: 'for n in [4, 12, 9, 20]:\n    if n > 10:\n        print(n)\n        break',
        answer: '12',
        why: 'Find-first: 12 triggers the break, so 20 is never reached.',
      },
      {
        type: 'fix',
        brief:
          'first_over(nums, limit) should return the FIRST number over the limit — it currently returns the LAST one. Stop the loop at the right moment.',
        code: 'def first_over(nums, limit):\n    found = 0\n    for n in nums:\n        if n > limit:\n            found = n\n    return found\n',
        function_name: 'first_over',
        tests: [
          { args: [[4, 12, 9, 20], 10], expected: 12 },
          { args: [[1, 2], 5], expected: 0 },
        ],
        solution:
          'def first_over(nums, limit):\n    for n in nums:\n        if n > limit:\n            return n\n    return 0\n',
        hint: 'Once you have found it, why keep looping? break — or return right there.',
      },
      {
        type: 'predict',
        code: 'n = 0\nwhile True:\n    n = n + 1\n    if n == 3:\n        break\nprint(n)',
        answer: '3',
        why: '`while True` + break is the "loop until" idiom — the break IS the exit.',
      },
    ],
  },
  {
    id: 'ch2-capstone',
    chapter: 'decisions-loops',
    title: 'Capstone: choose, repeat, stop',
    minutes: 7,
    prereqs: ['ch2-break-continue'],
    read: {
      text:
        'You can now choose (`if`), repeat (`for`/`while`), accumulate, and stop early (`break`). That is enough for real little programs.\n\nThe habit to build here: say the plan in ONE sentence before coding ("count shape, test is n % 2"). One heads-up: `out.append(x)` adds to a list — chapter 3 goes deep on lists.',
      example: {
        code: "for i in range(1, 6):\n    if i % 2 == 0:\n        print('even')\n    else:\n        print(i)",
        expectedOutput: '1\neven\n3\neven\n5',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'total = 0\nfor n in [3, 8, 2]:\n    if n % 2 == 0:\n        total = total + n\nprint(total)',
        answer: '10',
        why: 'Accumulate with a filter: only 8 and 2 get added.',
      },
      {
        type: 'write',
        brief:
          "fizz(n): return a list for 1..n where multiples of 3 become 'fizz' and everything else stays a number. Plan first: loop 1..n, choose per item, append.",
        function_name: 'fizz',
        starter_code: 'def fizz(n):\n    out = []\n    \n',
        tests: [
          { args: [5], expected: [1, 2, 'fizz', 4, 5] },
          { args: [3], expected: [1, 2, 'fizz'] },
        ],
        solution:
          "def fizz(n):\n    out = []\n    for i in range(1, n + 1):\n        if i % 3 == 0:\n            out.append('fizz')\n        else:\n            out.append(i)\n    return out\n",
        hint: 'range(1, n + 1) covers 1..n. Inside: if i % 3 == 0 append the word, else append i.',
      },
      {
        type: 'write',
        brief: 'sum_to(n): the sum 1 + 2 + … + n, with a loop.',
        function_name: 'sum_to',
        starter_code: 'def sum_to(n):\n    total = 0\n    \n',
        tests: [
          { args: [3], expected: 6 },
          { args: [1], expected: 1 },
          { args: [10], expected: 55 },
        ],
        solution: 'def sum_to(n):\n    total = 0\n    for i in range(1, n + 1):\n        total = total + i\n    return total\n',
        hint: 'Accumulate shape over range(1, n + 1).',
      },
      {
        type: 'write',
        brief: 'has_over(nums, limit): True if ANY number is over the limit, else False. Stop as soon as you know.',
        function_name: 'has_over',
        starter_code: 'def has_over(nums, limit):\n    \n',
        tests: [
          { args: [[1, 9], 5], expected: true },
          { args: [[1, 2], 5], expected: false },
          { args: [[], 1], expected: false },
        ],
        solution:
          'def has_over(nums, limit):\n    for n in nums:\n        if n > limit:\n            return True\n    return False\n',
        hint: 'Return True the moment you find one; if the loop finishes empty-handed, return False.',
      },
      {
        type: 'watch',
        caption: 'The full shape in motion: filter, accumulate, return.',
        code: 'def sum_evens(nums):\n    total = 0\n    for n in nums:\n        if n % 2 == 0:\n            total = total + n\n    return total\n',
        function_name: 'sum_evens',
        tests: [{ args: [[3, 8, 2]], expected: 10 }],
      },
    ],
  },
];
