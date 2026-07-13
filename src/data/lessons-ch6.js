// Chapter 6 — Python power tools: the language features that turn thoughts into
// code and unlock the harder patterns. Recursion (a function calling itself),
// classes (bundling data + behavior), lambdas & the functional trio, generators
// (lazy values), and the everyday idioms. Every snippet is executed by the gate.

export const LESSONS_CH6 = [
  {
    id: 'ch6-recursion',
    chapter: 'power-tools',
    title: 'Recursion — a function that calls itself',
    minutes: 7,
    prereqs: ['ch5-thoughts-first'],
    read: {
      text:
        'A **recursive** function solves a big problem by calling itself on a smaller one. Two parts, always: the **base case** (when to STOP) and the **recursive case** (call yourself on less).\n\nEach call waits on a stack for the one below it to finish, then they unwind. Miss the base case and it never stops — a `RecursionError`.',
      example: {
        code: 'def fact(n):\n    if n == 0:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(4))',
        expectedOutput: '24',
      },
      visual: {
        widget: 'stack-tower',
        caption: 'Each call stacks a frame and waits; the base case starts the unwind.',
        beats: [
          { op: 'push', value: 'fact(3)', caption: 'fact(3) needs fact(2) first — it waits, stacking a frame.' },
          { op: 'push', value: 'fact(2)', caption: 'fact(2) needs fact(1) — another frame piles on.' },
          { op: 'push', value: 'fact(1)', caption: 'fact(1) needs fact(0) — one more.' },
          { op: 'push', value: 'fact(0)=1', caption: 'fact(0) hits the BASE CASE: return 1. No more calls.' },
          { op: 'pop', caption: 'Now they unwind: fact(1) = 1 × 1 = 1.' },
          { op: 'pop', caption: 'fact(2) = 2 × 1 = 2.' },
          { op: 'pop', caption: 'fact(3) = 3 × 2 = 6 — the tower empties.' },
        ],
        why: 'Calls stack until the base case, then multiply back down as they return.',
        verifyCode: 'def fact(n):\n    if n == 0:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(3))',
        verifyOutput: '6',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'def down(n):\n    if n == 0:\n        return\n    print(n)\n    down(n - 1)\n\ndown(3)',
        answer: '3 2 1',
        accept: ['3\n2\n1'],
        why: 'Print, then recurse on n-1, until n hits 0 and the base case returns.',
      },
      {
        type: 'predict',
        code: 'def s(n):\n    if n == 0:\n        return 0\n    return n + s(n - 1)\n\nprint(s(4))',
        answer: '10',
        why: '4 + 3 + 2 + 1 + 0 — each call adds n to the sum of everything below it.',
      },
      {
        type: 'predict',
        code: 'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(6))',
        answer: '8',
        why: 'Two base cases (0, 1); each other value is the sum of the two before it.',
      },
      {
        type: 'type',
        prompt: 'The base case line that returns 1 when n reaches 0.',
        answer: 'if n == 0:',
        accept: ['if n==0:'],
        why: 'Every recursion needs a condition that stops it — the base case.',
      },
      {
        type: 'write',
        brief: 'sum_to(n): the sum 0 + 1 + ... + n, using recursion (no loop).',
        function_name: 'sum_to',
        starter_code: 'def sum_to(n):\n    if n == 0:\n        return 0\n    \n',
        tests: [
          { args: [3], expected: 6 },
          { args: [0], expected: 0 },
          { args: [5], expected: 15 },
        ],
        solution: 'def sum_to(n):\n    if n == 0:\n        return 0\n    return n + sum_to(n - 1)\n',
        hint: 'Base case: n == 0 returns 0. Recursive case: n plus sum_to(n - 1).',
      },
      {
        type: 'fix',
        brief: 'This factorial never stops — it is missing its base case.',
        function_name: 'fact',
        code: 'def fact(n):\n    return n * fact(n - 1)\n',
        tests: [
          { args: [4], expected: 24 },
          { args: [0], expected: 1 },
        ],
        solution: 'def fact(n):\n    if n == 0:\n        return 1\n    return n * fact(n - 1)\n',
        hint: 'Add a base case: when n is 0, return 1 instead of recursing.',
      },
      {
        type: 'arrange',
        brief: 'Assemble a recursive countdown-sum: n down to 0, added up.',
        function_name: 'total',
        lines: ['def total(n):', '    if n == 0:', '        return 0', '    return n + total(n - 1)'],
        tests: [
          { args: [3], expected: 6 },
          { args: [0], expected: 0 },
        ],
        hint: 'Signature, then the base case, then the recursive return.',
      },
    ],
  },
  {
    id: 'ch6-classes',
    chapter: 'power-tools',
    title: 'Classes — bundling data & behavior',
    minutes: 7,
    prereqs: ['ch6-recursion'],
    read: {
      text:
        'A **class** is a blueprint for objects that bundle **data** (attributes) with **behavior** (methods). `__init__` runs when you build one and sets it up; `self` is the object itself.\n\n`d = Dog("Chopper")` makes an object; `d.hp` reads an attribute; `d.take_hit()` calls a method that can change the object’s own data.',
      example: {
        code:
          "class Dog:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n    def take_hit(self):\n        self.hp = self.hp - 10\n\nd = Dog('Chopper')\nd.take_hit()\nprint(d.hp)",
        expectedOutput: '90',
      },
      visual: {
        widget: 'var-boxes',
        caption: 'An object is a labelled bundle of attributes. Watch a method change one.',
        beats: [
          { vars: { name: 'Chopper', hp: 100 }, caption: 'Dog("Chopper") runs __init__, storing name and hp ON the object.' },
          { vars: { name: 'Chopper', hp: 90 }, caption: 'take_hit() changes the object’s OWN hp — self.hp drops to 90.' },
        ],
        why: 'Attributes live on the object (self); methods read and change them.',
        verifyCode:
          "class Dog:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n    def take_hit(self):\n        self.hp = self.hp - 10\n\nd = Dog('Chopper')\nd.take_hit()\nprint(d.hp)",
        verifyOutput: '90',
      },
    },
    items: [
      {
        type: 'predict',
        code: "class Cat:\n    def __init__(self, name):\n        self.name = name\n\nc = Cat('Nami')\nprint(c.name)",
        answer: 'Nami',
        why: '__init__ stored name on the object; c.name reads it back.',
      },
      {
        type: 'predict',
        code:
          'class Counter:\n    def __init__(self):\n        self.n = 0\n    def bump(self):\n        self.n = self.n + 1\n\nc = Counter()\nc.bump()\nc.bump()\nprint(c.n)',
        answer: '2',
        why: 'Each bump() adds 1 to the object’s own n — state that persists between calls.',
      },
      {
        type: 'type',
        prompt: 'Inside __init__, store the parameter name onto the object.',
        answer: 'self.name = name',
        why: 'Attributes must be stored on self, or they vanish when __init__ ends.',
      },
      {
        type: 'write',
        brief: 'boxed(value): put value into a Box object, then return box.value.',
        function_name: 'boxed',
        starter_code:
          'class Box:\n    def __init__(self, value):\n        self.value = value\n\ndef boxed(value):\n    \n',
        tests: [
          { args: [5], expected: 5 },
          { args: ['hi'], expected: 'hi' },
        ],
        solution:
          'class Box:\n    def __init__(self, value):\n        self.value = value\n\ndef boxed(value):\n    b = Box(value)\n    return b.value\n',
        hint: 'Build a Box(value), then read its .value attribute back.',
      },
      {
        type: 'fix',
        brief: 'This counter forgets its count — an attribute is not stored on self.',
        function_name: 'make',
        code:
          'class Counter:\n    def __init__(self, start):\n        count = start\n    def value(self):\n        return self.count\n\ndef make(start):\n    return Counter(start).value()\n',
        tests: [
          { args: [5], expected: 5 },
          { args: [0], expected: 0 },
        ],
        solution:
          'class Counter:\n    def __init__(self, start):\n        self.count = start\n    def value(self):\n        return self.count\n\ndef make(start):\n    return Counter(start).value()\n',
        hint: 'count = start makes a local that vanishes. Store it as self.count.',
      },
    ],
  },
  {
    id: 'ch6-functional',
    chapter: 'power-tools',
    title: 'Lambdas, map & filter',
    minutes: 6,
    prereqs: ['ch6-classes'],
    read: {
      text:
        'A **lambda** is a tiny unnamed function: `lambda x: x * 2`. It shines as an argument. `map(fn, xs)` runs a function over everything; `filter(fn, xs)` keeps the items where it is True.\n\nThe reducers `sum`, `max`, `min`, `any`, `all` finish the toolkit — and `max(xs, key=len)` compares by whatever the key returns.',
      example: {
        code: 'nums = [1, 2, 3, 4]\nprint(list(filter(lambda n: n % 2 == 0, nums)))',
        expectedOutput: '[2, 4]',
      },
      visual: {
        widget: 'pipe-flow',
        caption: 'map runs a function over every item; filter keeps only the matches.',
        beats: [
          {
            label: 'map(lambda n: n * 2, nums)',
            input: ['1', '2', '3'],
            output: ['2', '4', '6'],
            caption: 'map applies the lambda to every item — same length, transformed.',
          },
          {
            label: 'filter(lambda n: n % 2 == 0, nums)',
            input: ['1', '2', '3', '4'],
            output: ['2', '4'],
            caption: 'filter keeps only the items where the lambda returns True.',
          },
        ],
        why: 'Lambdas let map/filter/max take the behaviour inline — no def needed.',
        verifyCode: 'print(list(map(lambda n: n * 2, [1, 2, 3])))',
        verifyOutput: '[2, 4, 6]',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'print(list(map(lambda x: x + 1, [10, 20])))',
        answer: '[11, 21]',
        why: 'map runs the lambda on each item and list() collects the results.',
      },
      {
        type: 'predict',
        code: "print(max(['a', 'ccc', 'bb'], key=len))",
        answer: 'ccc',
        why: 'key=len compares by LENGTH, so the longest string wins.',
      },
      {
        type: 'predict',
        code: 'print(any(n > 5 for n in [1, 2, 6]))',
        answer: 'True',
        why: 'any is True as soon as one item passes — 6 > 5.',
      },
      {
        type: 'type',
        prompt: 'A lambda that returns x squared.',
        answer: 'lambda x: x * x',
        accept: ['lambda x: x ** 2', 'lambda x: x**2'],
        why: 'lambda params: expression — the value of the expression is returned.',
      },
      {
        type: 'write',
        brief: 'evens(nums): just the even numbers, in order.',
        function_name: 'evens',
        starter_code: 'def evens(nums):\n    \n',
        tests: [
          { args: [[1, 2, 3, 4]], expected: [2, 4] },
          { args: [[1, 3, 5]], expected: [] },
        ],
        solution: 'def evens(nums):\n    return [n for n in nums if n % 2 == 0]\n',
        hint: 'A comprehension with an if, or list(filter(lambda n: n % 2 == 0, nums)).',
      },
      {
        type: 'fix',
        brief: 'This sort passes len() instead of len — the key should be the function itself.',
        function_name: 'by_length',
        code: 'def by_length(words):\n    return sorted(words, key=len())\n',
        tests: [
          { args: [['bb', 'a', 'ccc']], expected: ['a', 'bb', 'ccc'] },
          { args: [['xx', 'y']], expected: ['y', 'xx'] },
        ],
        solution: 'def by_length(words):\n    return sorted(words, key=len)\n',
        hint: 'Pass the function itself: key=len. Writing len() calls it with no argument.',
      },
    ],
  },
  {
    id: 'ch6-generators',
    chapter: 'power-tools',
    title: 'Generators — values on demand',
    minutes: 6,
    prereqs: ['ch6-functional'],
    read: {
      text:
        'A **generator** produces values one at a time instead of building a whole list — lazy and memory-light. A function with `yield` is a generator; so is a **generator expression** `(n * n for n in nums)`.\n\nWrap it in `sum(...)`, `max(...)`, `list(...)` or a `for` loop to pull the values out as you need them.',
      example: {
        code: 'def squares(n):\n    for i in range(n):\n        yield i * i\n\nprint(list(squares(4)))',
        expectedOutput: '[0, 1, 4, 9]',
      },
      visual: {
        widget: 'pipe-flow',
        caption: 'Values are produced one at a time, only when something asks for them.',
        beats: [
          {
            label: 'i * i for i in range(4)',
            input: ['0', '1', '2', '3'],
            output: ['0', '1', '4', '9'],
            caption: 'Each square is produced on demand — never a whole list at once.',
          },
          {
            label: 'sum(n for n in range(4))',
            input: ['0', '1', '2', '3'],
            output: ['6'],
            caption: 'A generator expression feeds straight into sum — 0 + 1 + 2 + 3.',
          },
        ],
        why: 'yield / genexprs stream values, so sum and max never build a throwaway list.',
        verifyCode: 'print(sum(n * n for n in range(4)))',
        verifyOutput: '14',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'def firsts(n):\n    for i in range(n):\n        yield i\n\nprint(list(firsts(3)))',
        answer: '[0, 1, 2]',
        why: 'yield hands back one value per loop; list() pulls them all into a list.',
      },
      {
        type: 'predict',
        code: 'print(sum(n * 2 for n in [1, 2, 3]))',
        answer: '12',
        why: 'The generator yields 2, 4, 6 straight into sum — no list is built.',
      },
      {
        type: 'predict',
        code: "print(max((len(w) for w in ['a', 'ccc', 'bb'])))",
        answer: '3',
        why: 'The genexpr yields 1, 3, 2; max keeps the largest.',
      },
      {
        type: 'type',
        prompt: 'The total number of characters across all words in words, using sum and a generator.',
        answer: 'sum(len(w) for w in words)',
        why: 'A generator expression inside sum — no list of lengths ever exists.',
      },
      {
        type: 'write',
        brief: 'total_len(words): the total number of characters across all the words.',
        function_name: 'total_len',
        starter_code: 'def total_len(words):\n    \n',
        tests: [
          { args: [['ab', 'c']], expected: 3 },
          { args: [[]], expected: 0 },
        ],
        solution: 'def total_len(words):\n    return sum(len(w) for w in words)\n',
        hint: 'sum(len(w) for w in words) — a generator feeding sum.',
      },
      {
        type: 'fix',
        brief: 'This counts vowels but calls sum on a bare generator with a stray bracket.',
        function_name: 'count_evens',
        code: 'def count_evens(nums):\n    return sum(1 for n in nums if n % 2 == 0]\n',
        tests: [
          { args: [[1, 2, 3, 4]], expected: 2 },
          { args: [[1, 3]], expected: 0 },
        ],
        solution: 'def count_evens(nums):\n    return sum(1 for n in nums if n % 2 == 0)\n',
        hint: 'A generator expression is wrapped in ( ), not a ] — match the parentheses.',
      },
    ],
  },
  {
    id: 'ch6-idioms',
    chapter: 'power-tools',
    title: 'Everyday idioms',
    minutes: 6,
    prereqs: ['ch6-generators'],
    read: {
      text:
        'Three shortcuts you will read everywhere. The **ternary**: `a if condition else b` picks a value inline. **Truthiness**: empty list/string, `0`, and `None` are all *falsy*, so `if not items:` means "empty".\n\nThe **trap**: never give a function a mutable default like `def f(x, acc=[])` — that list is shared across every call.',
      example: { code: "n = 7\nprint('odd' if n % 2 else 'even')", expectedOutput: 'odd' },
      visual: {
        widget: 'branch-flow',
        caption: 'A ternary picks one value inline; truthiness decides which side runs.',
        beats: [
          {
            value: 'n = 7',
            branches: [
              { test: 'n % 2  (odd)', taken: true, label: "'odd'" },
              { test: 'else', taken: false, label: "'even'" },
            ],
            caption: '7 % 2 is 1 (truthy) → the ternary takes the "odd" side.',
          },
          {
            value: 'items = []',
            branches: [
              { test: 'if items  (truthy)', taken: false, label: 'has items' },
              { test: 'else  (empty)', taken: true, label: 'nothing here' },
            ],
            caption: 'An empty list is FALSY, so `if not items` is True — the else runs.',
          },
        ],
        why: 'Ternary chooses a value inline; empty/0/None are falsy.',
        verifyCode: "n = 7\nprint('odd' if n % 2 else 'even')",
        verifyOutput: 'odd',
      },
    },
    items: [
      {
        type: 'predict',
        code: "x = 3\nprint('small' if x < 5 else 'big')",
        answer: 'small',
        why: 'The condition x < 5 is True, so the ternary returns the value before else.',
      },
      {
        type: 'predict',
        code: 'def add(x, bucket=[]):\n    bucket.append(x)\n    return bucket\n\nprint(add(1))\nprint(add(2))',
        answer: '[1] [1, 2]',
        accept: ['[1]\n[1, 2]'],
        why: 'The default list is created ONCE and shared — the second call still sees the first 1.',
      },
      {
        type: 'predict',
        code: "print(not [])",
        answer: 'True',
        why: 'An empty list is falsy, so `not []` is True — the idiom for "is it empty?".',
      },
      {
        type: 'type',
        prompt: 'Return "yes" if flag is truthy, otherwise "no" — in one line.',
        answer: "'yes' if flag else 'no'",
        why: 'value_if_true if condition else value_if_false.',
      },
      {
        type: 'write',
        brief: 'sign(n): return "pos" if n > 0, "neg" if n < 0, else "zero".',
        function_name: 'sign',
        starter_code: 'def sign(n):\n    \n',
        tests: [
          { args: [5], expected: 'pos' },
          { args: [-2], expected: 'neg' },
          { args: [0], expected: 'zero' },
        ],
        solution: "def sign(n):\n    if n > 0:\n        return 'pos'\n    if n < 0:\n        return 'neg'\n    return 'zero'\n",
        hint: 'Two ifs and a fall-through return handle the three cases cleanly.',
      },
      {
        type: 'fix',
        brief: 'This ternary is missing its else half.',
        function_name: 'bigger',
        code: 'def bigger(a, b):\n    return a if a > b\n',
        tests: [
          { args: [3, 5], expected: 5 },
          { args: [9, 2], expected: 9 },
        ],
        solution: 'def bigger(a, b):\n    return a if a > b else b\n',
        hint: 'A ternary always needs an else: a if a > b else b.',
      },
    ],
  },
  {
    id: 'ch6-capstone',
    chapter: 'power-tools',
    title: 'Capstone: a class, walked by recursion',
    minutes: 8,
    prereqs: ['ch6-idioms'],
    read: {
      text:
        'Bring it together: a small **class** to hold data, **recursion** to walk it, a **generator expression** to total it up. This is exactly the shape behind trees, which the next chapters build on.\n\nSay the plan in one sentence first — "each node’s value plus the total of its children" — then let the code mirror the words.',
      example: {
        code:
          'class Node:\n    def __init__(self, value):\n        self.value = value\n        self.kids = []\n\ndef total(node):\n    return node.value + sum(total(k) for k in node.kids)\n\nroot = Node(1)\nroot.kids = [Node(2), Node(3)]\nprint(total(root))',
        expectedOutput: '6',
      },
      visual: {
        widget: 'call-return',
        caption: 'total sums a node plus each child’s total — a class walked by recursion.',
        beats: [
          {
            call: 'total(leaf)',
            func: 'total',
            args: ['Node(2)'],
            body: 'value + sum(... no kids)',
            returns: '2',
            caption: 'A leaf has no kids, so its total is just its own value: 2.',
          },
          {
            call: 'total(root)',
            func: 'total',
            args: ['Node(1)'],
            body: '1 + total(2) + total(3)',
            returns: '6',
            caption: 'The root adds itself to each child’s total: 1 + 2 + 3 = 6.',
          },
        ],
        why: 'A class holds the data; recursion walks it; a genexpr sums the children.',
        verifyCode:
          'class Node:\n    def __init__(self, value):\n        self.value = value\n        self.kids = []\n\ndef total(node):\n    return node.value + sum(total(k) for k in node.kids)\n\nroot = Node(1)\nroot.kids = [Node(2), Node(3)]\nprint(total(root))',
        verifyOutput: '6',
      },
    },
    items: [
      {
        type: 'predict',
        code:
          'class Node:\n    def __init__(self, v):\n        self.v = v\n        self.kids = []\n\nr = Node(10)\nr.kids = [Node(1), Node(2)]\nprint(r.v + sum(k.v for k in r.kids))',
        answer: '13',
        why: '10 (the root) plus 1 + 2 (its children) — the same value + children shape.',
      },
      {
        type: 'predict',
        code:
          'class Node:\n    def __init__(self, v):\n        self.v = v\n        self.kids = []\n\ndef count(node):\n    return 1 + sum(count(k) for k in node.kids)\n\nr = Node(0)\nr.kids = [Node(0), Node(0)]\nprint(count(r))',
        answer: '3',
        why: 'count returns 1 for itself plus the counts of its kids — 3 nodes total.',
      },
      {
        type: 'type',
        prompt: 'The recursive line: this node’s value plus the sum of total(k) for each kid.',
        answer: 'return node.value + sum(total(k) for k in node.kids)',
        why: 'Base-free recursion: a leaf’s empty kids make sum(...) 0, stopping it naturally.',
      },
      {
        type: 'write',
        brief: 'count_positive(nums): use a Tally class with a bump() method; bump once per positive number; return the count.',
        function_name: 'count_positive',
        starter_code:
          'class Tally:\n    def __init__(self):\n        self.n = 0\n    def bump(self):\n        self.n = self.n + 1\n\ndef count_positive(nums):\n    t = Tally()\n    \n',
        tests: [
          { args: [[1, -2, 3]], expected: 2 },
          { args: [[]], expected: 0 },
          { args: [[-1, -2]], expected: 0 },
        ],
        solution:
          'class Tally:\n    def __init__(self):\n        self.n = 0\n    def bump(self):\n        self.n = self.n + 1\n\ndef count_positive(nums):\n    t = Tally()\n    for n in nums:\n        if n > 0:\n            t.bump()\n    return t.n\n',
        hint: 'Loop the numbers; call t.bump() when n > 0; return t.n at the end.',
      },
    ],
  },
];
