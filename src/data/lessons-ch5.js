// Chapter 5 — The interview toolkit: nested data, Counter & defaultdict,
// stack & deque idioms, string<->list pipelines, two-variable walks, and the
// "thoughts first: problem -> tests -> code" habit that ties it all together.

export const LESSONS_CH5 = [
  {
    id: 'ch5-nested',
    chapter: 'interview-kit',
    title: 'Nested data',
    minutes: 6,
    prereqs: ['ch4-capstone'],
    read: {
      text:
        'Real data nests: a list of lists (a grid), a dict of lists, a list of dicts. Reach in with chained access — `grid[1][0]` is row 1, column 0; `people[0]["name"]` is the first person\'s name.\n\nLoop the outer layer, then the inner. A list of dicts is exactly what a spreadsheet row looks like in code.',
      example: { code: 'grid = [[1, 2], [3, 4]]\nprint(grid[1][0])', expectedOutput: '3' },
    },
    items: [
      {
        type: 'predict',
        code: 'grid = [[1, 2], [3, 4]]\nprint(grid[0][1])',
        answer: '2',
        why: 'grid[0] is [1, 2]; [1] of that is 2. Read left to right, outer to inner.',
      },
      {
        type: 'predict',
        code: "people = [{'name': 'zoro'}]\nprint(people[0]['name'])",
        answer: 'zoro',
        why: 'First the list position, then the dict key.',
      },
      {
        type: 'type',
        prompt: 'Read column 2 of row 0 from the grid named board.',
        answer: 'board[0][2]',
        why: 'Row first, then column — the order you say it.',
      },
      {
        type: 'predict',
        code: 'total = 0\nfor row in [[1, 2], [3, 4]]:\n    for n in row:\n        total = total + n\nprint(total)',
        answer: '10',
        why: 'Nested loop: outer picks a row, inner adds its numbers. 1+2+3+4.',
      },
      {
        type: 'write',
        brief: 'grid_sum(grid): add up every number in a list of lists.',
        function_name: 'grid_sum',
        starter_code: 'def grid_sum(grid):\n    total = 0\n    \n',
        tests: [
          { args: [[[1, 2], [3, 4]]], expected: 10 },
          { args: [[[5]]], expected: 5 },
          { args: [[]], expected: 0 },
        ],
        solution:
          'def grid_sum(grid):\n    total = 0\n    for row in grid:\n        for n in row:\n            total = total + n\n    return total\n',
        hint: 'Loop rows, then loop each row. Accumulate as you go.',
      },
      {
        type: 'write',
        brief: 'names_of(people): each person is a dict with a "name" — return the list of names.',
        function_name: 'names_of',
        starter_code: 'def names_of(people):\n    \n',
        tests: [
          { args: [[{ name: 'zoro' }, { name: 'nami' }]], expected: ['zoro', 'nami'] },
          { args: [[]], expected: [] },
        ],
        solution: "def names_of(people):\n    return [p['name'] for p in people]\n",
        hint: 'A comprehension over the list, pulling p["name"] from each dict.',
      },
    ],
  },
  {
    id: 'ch5-counter',
    chapter: 'interview-kit',
    title: 'Counter & defaultdict',
    minutes: 6,
    prereqs: ['ch3-dicts'],
    read: {
      text:
        'Two shortcuts from `collections`. `Counter(items)` counts everything in one line — no `.get()` loop. `defaultdict(list)` gives any new key an empty list automatically, so you can `.append` without checking first.\n\nIn this dojo both are always available — but real scripts need `from collections import Counter, defaultdict`.',
      example: { code: "from collections import Counter\nprint(Counter('aba')['a'])", expectedOutput: '2' },
    },
    items: [
      {
        type: 'predict',
        code: "from collections import Counter\nprint(Counter('banana')['a'])",
        answer: '3',
        why: 'Counter did the whole counting loop for you — three a\'s.',
      },
      {
        type: 'predict',
        code: 'from collections import Counter\nc = Counter([1, 1, 2])\nprint(c[9])',
        answer: '0',
        why: 'A missing key in a Counter is 0, never a crash — like .get(k, 0) built in.',
      },
      {
        type: 'type',
        prompt: 'Import Counter and defaultdict from collections.',
        answer: 'from collections import Counter, defaultdict',
        why: 'The real-world import line — this dojo pre-loads them, scripts do not.',
      },
      {
        type: 'predict',
        code: "from collections import defaultdict\nd = defaultdict(list)\nd['a'].append(1)\nprint(d['a'])",
        answer: '[1]',
        why: 'The key "a" was never set, yet .append worked — defaultdict(list) made an empty list on demand.',
      },
      {
        type: 'write',
        brief: 'most_common_char(word): the character that appears most (a clear winner is guaranteed). Counter has a .most_common(1) helper.',
        function_name: 'most_common_char',
        starter_code: 'from collections import Counter\n\ndef most_common_char(word):\n    \n',
        tests: [
          { args: ['banana'], expected: 'a' },
          { args: ['zzy'], expected: 'z' },
        ],
        solution:
          'from collections import Counter\n\ndef most_common_char(word):\n    return Counter(word).most_common(1)[0][0]\n',
        hint: 'Counter(word).most_common(1) gives [(char, count)]; dig out the char with [0][0].',
      },
      {
        type: 'predict',
        code: "from collections import Counter\nprint(Counter('aabb') == Counter('bbaa'))",
        answer: 'True',
        why: 'Two Counters are equal if the tallies match — this IS the anagram check.',
      },
    ],
  },
  {
    id: 'ch5-stack-queue',
    chapter: 'interview-kit',
    title: 'Stacks & queues',
    minutes: 6,
    prereqs: ['ch3-lists'],
    read: {
      text:
        'A **stack** is a list used at one end: `.append()` to push, `.pop()` to take the LAST one back (last in, first out) — matching brackets, undo, "most recent". \n\nA **queue** serves the FIRST in first. `deque` from collections does that fast: `.append()` to add, `.popleft()` to serve — the workhorse of breadth-first search.',
      example: { code: 'stack = [1, 2, 3]\nprint(stack.pop())', expectedOutput: '3' },
    },
    items: [
      {
        type: 'predict',
        code: 'stack = [1, 2]\nstack.append(3)\nprint(stack.pop())',
        answer: '3',
        why: 'pop takes the LAST item — the one just pushed. Last in, first out.',
      },
      {
        type: 'predict',
        code: 'stack = [1, 2, 3]\nstack.pop()\nprint(stack)',
        answer: '[1, 2]',
        why: 'pop also SHRINKS the list — 3 is gone.',
      },
      {
        type: 'type',
        prompt: 'Push x onto the stack (a list).',
        answer: 'stack.append(x)',
        why: 'Same append you know — "stack" is just how you USE the list.',
      },
      {
        type: 'predict',
        code: 'from collections import deque\nq = deque([1, 2, 3])\nprint(q.popleft())',
        answer: '1',
        why: 'popleft serves the FRONT — first in, first out. A queue, not a stack.',
      },
      {
        type: 'type',
        prompt: 'Make a deque called q starting from the list nums.',
        answer: 'q = deque(nums)',
        why: 'deque is your fast queue — popleft is O(1), list.pop(0) is slow.',
      },
      {
        type: 'write',
        brief: 'balanced(s): s has only ( and ). Return True if every ( has a matching ). Use a stack.',
        function_name: 'balanced',
        starter_code: 'def balanced(s):\n    stack = []\n    \n',
        tests: [
          { args: ['(())'], expected: true },
          { args: ['(()'], expected: false },
          { args: ['())'], expected: false },
          { args: [''], expected: true },
        ],
        solution:
          "def balanced(s):\n    stack = []\n    for ch in s:\n        if ch == '(':\n            stack.append(ch)\n        else:\n            if not stack:\n                return False\n            stack.pop()\n    return not stack\n",
        hint: 'Push on (. On ), if the stack is empty it is unbalanced, else pop. At the end the stack must be empty.',
      },
    ],
  },
  {
    id: 'ch5-string-list',
    chapter: 'interview-kit',
    title: 'String ↔ list pipelines',
    minutes: 6,
    prereqs: ['ch3-slicing'],
    read: {
      text:
        'Text problems flow one way: `split()` breaks a string into a list of words, you process the list, then `\' \'.join(list)` glues it back into a string.\n\n`.strip()` trims edges, `.replace(a, b)` swaps text. The split-process-join pipeline solves a huge share of string questions.',
      example: { code: "print('a b c'.split())", expectedOutput: "['a', 'b', 'c']" },
    },
    items: [
      {
        type: 'predict',
        code: "print('one two'.split())",
        answer: "['one', 'two']",
        why: 'split() with no argument breaks on whitespace into a list.',
      },
      {
        type: 'predict',
        code: "print('-'.join(['a', 'b', 'c']))",
        answer: 'a-b-c',
        why: "join glues a list with the string you called it on — here a dash.",
      },
      {
        type: 'type',
        prompt: "Join the list words with single spaces.",
        answer: "' '.join(words)",
        why: 'The separator is the string; join is its method. The reverse of split.',
      },
      {
        type: 'predict',
        code: "print('a,b,c'.split(','))",
        answer: "['a', 'b', 'c']",
        why: 'Give split a separator and it breaks on that instead of whitespace.',
      },
      {
        type: 'predict',
        code: "print('  hi  '.strip())",
        answer: 'hi',
        why: 'strip removes the edge whitespace, keeps the inside.',
      },
      {
        type: 'write',
        brief: 'reverse_words(s): reverse the ORDER of words, not the letters. "hello there" -> "there hello".',
        function_name: 'reverse_words',
        starter_code: 'def reverse_words(s):\n    \n',
        tests: [
          { args: ['hello there'], expected: 'there hello' },
          { args: ['one'], expected: 'one' },
        ],
        solution: "def reverse_words(s):\n    return ' '.join(s.split()[::-1])\n",
        hint: 'split into words, reverse the list with [::-1], join back with a space.',
      },
      {
        type: 'write',
        brief: 'count_words(s): how many words are in s (words are whitespace-separated).',
        function_name: 'count_words',
        starter_code: 'def count_words(s):\n    \n',
        tests: [
          { args: ['a b c'], expected: 3 },
          { args: ['solo'], expected: 1 },
        ],
        solution: 'def count_words(s):\n    return len(s.split())\n',
        hint: 'split gives the list; len counts it.',
      },
    ],
  },
  {
    id: 'ch5-two-pointers',
    chapter: 'interview-kit',
    title: 'Two-variable walks',
    minutes: 6,
    prereqs: ['ch3-iteration-tools'],
    read: {
      text:
        'Many array problems keep TWO positions instead of one. **Two ends**: `left` at the start, `right` at the end, walking inward — palindromes, pair-sums on sorted data. **Two speeds**: a slow and a fast index.\n\nThe skill is a `while left < right` loop that moves the right variable each pass. This is the shape behind a whole family of interview questions.',
      example: {
        code: 'left, right = 0, 4\nwhile left < right:\n    left = left + 1\n    right = right - 1\nprint(left, right)',
        expectedOutput: '2 2',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'left, right = 0, 3\nwhile left < right:\n    left += 1\n    right -= 1\nprint(left, right)',
        answer: '2 1',
        why: 'They cross: 0/3 -> 1/2 -> 2/1, and now left < right is false.',
      },
      {
        type: 'type',
        prompt: 'Set left to 0 and right to the last index of nums, in one line.',
        answer: 'left, right = 0, len(nums) - 1',
        why: 'Tuple unpacking sets up both ends at once.',
      },
      {
        type: 'type',
        prompt: 'The loop header that runs while left is before right.',
        answer: 'while left < right:',
        why: 'The two-ends engine — it stops when they meet.',
      },
      {
        type: 'write',
        brief: 'is_palindrome(s): does s read the same forwards and backwards? Walk from both ends.',
        function_name: 'is_palindrome',
        starter_code: 'def is_palindrome(s):\n    left, right = 0, len(s) - 1\n    \n',
        tests: [
          { args: ['racecar'], expected: true },
          { args: ['hello'], expected: false },
          { args: ['a'], expected: true },
          { args: [''], expected: true },
        ],
        solution:
          'def is_palindrome(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        if s[left] != s[right]:\n            return False\n        left += 1\n        right -= 1\n    return True\n',
        hint: 'Compare s[left] and s[right]; mismatch -> False. Move both inward. Survive the loop -> True.',
      },
      {
        type: 'predict',
        code: "s = 'abcba'\nprint(s[0] == s[-1])",
        answer: 'True',
        why: 'The first and last characters match — the first check a palindrome walk makes.',
      },
    ],
  },
  {
    id: 'ch5-thoughts-first',
    chapter: 'interview-kit',
    title: 'Thoughts first: problem → tests → code',
    minutes: 8,
    prereqs: ['ch5-counter', 'ch5-two-pointers'],
    read: {
      text:
        "The habit that separates panic from progress: before typing, write the plan in plain words, then invent 2-3 tiny examples (including an empty one), THEN code toward those examples. \n\nThat is exactly the flow here — a brief, real tests, your code. You now have the toolkit: loops, dicts, sets, functions, Counter, stacks, two-pointer walks. The path questions are just these pieces, combined.",
      example: {
        code: "# plan: count each, compare tallies\nfrom collections import Counter\nprint(Counter('listen') == Counter('silent'))",
        expectedOutput: 'True',
      },
    },
    transfer: { warmup: 'hard', question: 'py-two-sum' },
    items: [
      {
        type: 'predict',
        code: "from collections import Counter\nprint(Counter('abc') == Counter('cba'))",
        answer: 'True',
        why: 'Same letters, same counts — anagrams. The plan was one line.',
      },
      {
        type: 'write',
        brief:
          'is_anagram(a, b): True if a and b use the same letters. Plan: compare letter tallies. (This is a real path question — you can solve it now.)',
        function_name: 'is_anagram',
        starter_code: 'from collections import Counter\n\ndef is_anagram(a, b):\n    \n',
        tests: [
          { args: ['listen', 'silent'], expected: true },
          { args: ['abc', 'abd'], expected: false },
          { args: ['', ''], expected: true },
        ],
        solution: 'from collections import Counter\n\ndef is_anagram(a, b):\n    return Counter(a) == Counter(b)\n',
        hint: 'Two Counters are equal exactly when the letters and counts match.',
      },
      {
        type: 'write',
        brief:
          'two_sum(nums, target): return the two INDEXES whose values add to target (exactly one answer). Plan: for each number, remember where you saw it; check if target - n was already seen.',
        function_name: 'two_sum',
        starter_code: 'def two_sum(nums, target):\n    seen = {}\n    \n',
        tests: [
          { args: [[2, 7, 11], 9], expected: [0, 1] },
          { args: [[3, 2, 4], 6], expected: [1, 2] },
        ],
        solution:
          'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []\n',
        hint: 'enumerate for the index; a dict maps value -> index; ask "have I seen what I need?" before storing.',
      },
      {
        type: 'watch',
        caption: 'Watch the seen-dict fill until the complement appears — the whole Two Sum idea in motion.',
        code: 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []\n',
        function_name: 'two_sum',
        tests: [{ args: [[2, 7, 11], 9], expected: [0, 1] }],
      },
    ],
  },
];
