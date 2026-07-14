// Chapter 8 — Recursion & structures: the shapes recursion was made for. Linked
// lists (Node/.next), binary trees (nested [value, left, right], null = empty),
// the three DFS orders + BFS, backtracking's choose/explore/un-choose, and the
// trie. Linked lists use plain value arrays and trees use nested lists — the same
// conventions as the practice questions, so every write item runs on real inputs.

export const LESSONS_CH8 = [
  {
    id: 'ch8-linked-list',
    chapter: 'structures',
    title: 'Linked lists',
    minutes: 7,
    prereqs: ['ch7-greedy'],
    read: {
      text:
        'A **linked list** is a chain of nodes; each holds a value and a `.next` pointer to the following node. The last points to `None`. You cannot index it — you WALK it: `curr = curr.next` until `None`.\n\nReversing is the classic drill: carry a `prev`, point each node back at it, then advance — the three-pointer shuffle.',
      example: {
        code:
          'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\na = Node(1)\na.next = Node(2)\nprint(a.val, a.next.val)',
        expectedOutput: '1 2',
      },
      visual: {
        widget: 'node-chain',
        nodes: [1, 2, 3],
        caption: 'Follow .next from node to node until None — then reversal flips every arrow.',
        beats: [
          { pointer: 0, pointerLabel: 'curr', caption: 'Start at the head — curr points to the first node.' },
          { pointer: 1, pointerLabel: 'curr', caption: 'curr = curr.next steps to the second node.' },
          { pointer: 2, pointerLabel: 'curr', caption: 'Step again; the next after this is None, so stop.' },
          { reversed: true, caption: 'Reversal flips every .next — the old tail becomes the head.' },
        ],
        why: 'No indexing: you follow .next to the end, and reversal re-points every link.',
        verifyCode:
          'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\na = Node(1)\na.next = Node(2)\nprint(a.val, a.next.val)',
        verifyOutput: '1 2',
      },
    },
    items: [
      {
        type: 'predict',
        code:
          'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\na = Node(1)\na.next = Node(2)\na.next.next = Node(3)\nprint(a.next.next.val)',
        answer: '3',
        why: 'a.next.next hops two links along the chain to the third node.',
      },
      {
        type: 'predict',
        code:
          'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nhead = Node(5)\nhead.next = Node(9)\ntotal = 0\ncurr = head\nwhile curr is not None:\n    total = total + curr.val\n    curr = curr.next\nprint(total)',
        answer: '14',
        why: 'Walk with curr = curr.next, adding each val, until curr is None: 5 + 9.',
      },
      {
        type: 'type',
        prompt: 'Advance the pointer curr to the next node.',
        answer: 'curr = curr.next',
        why: 'Following .next is how you move through a linked list — there is no index.',
      },
      {
        type: 'write',
        brief: 'list_length(vals): build a linked list of Nodes from vals, then count them by walking .next.',
        function_name: 'list_length',
        starter_code:
          'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\ndef list_length(vals):\n    head = None\n    for v in reversed(vals):\n        node = Node(v)\n        node.next = head\n        head = node\n    \n',
        tests: [
          { args: [[1, 2, 3]], expected: 3 },
          { args: [[]], expected: 0 },
          { args: [[5]], expected: 1 },
        ],
        solution:
          'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\ndef list_length(vals):\n    head = None\n    for v in reversed(vals):\n        node = Node(v)\n        node.next = head\n        head = node\n    count = 0\n    curr = head\n    while curr is not None:\n        count = count + 1\n        curr = curr.next\n    return count\n',
        hint: 'Walk from head with curr = curr.next, adding 1 each step until None.',
      },
      {
        type: 'write',
        brief: 'reverse_values(vals): return the values in reverse order (the linked-list reversal, adapted to a list).',
        function_name: 'reverse_values',
        starter_code: 'def reverse_values(vals):\n    prev = []\n    \n',
        tests: [
          { args: [[1, 2, 3, 4]], expected: [4, 3, 2, 1] },
          { args: [[]], expected: [] },
          { args: [[1]], expected: [1] },
        ],
        solution: 'def reverse_values(vals):\n    prev = []\n    for v in vals:\n        prev = [v] + prev\n    return prev\n',
        hint: 'Build the answer by putting each value in FRONT — that is the reversal move.',
      },
    ],
  },
  {
    id: 'ch8-trees',
    chapter: 'structures',
    title: 'Binary trees & DFS',
    minutes: 7,
    prereqs: ['ch8-linked-list'],
    read: {
      text:
        'A **binary tree** node has a value and up to two children, `left` and `right`. We write one as a nested list `[value, left, right]`, with `None` for an empty spot.\n\n**DFS** (depth-first) dives down one branch before the next — recursion mirrors the shape perfectly: handle the node, then recurse left and right. An empty node (`None`) is the base case.',
      example: {
        code:
          'tree = [1, [2, None, None], [3, None, None]]\n\ndef total(node):\n    if node is None:\n        return 0\n    return node[0] + total(node[1]) + total(node[2])\n\nprint(total(tree))',
        expectedOutput: '6',
      },
      visual: {
        widget: 'tree-view',
        tree: [1, [2, null, null], [3, null, null]],
        caption: 'DFS dives down each branch fully before backing up.',
        beats: [
          { active: '', caption: 'Start at the root (1), then dive into the left child first.' },
          { active: 'L', visited: [''], caption: 'Visit the left child (2). No children, so back up.' },
          { active: 'R', visited: ['', 'L'], caption: 'Then the right child (3). That is depth-first order.' },
        ],
        why: 'Handle the node, recurse left, recurse right; None stops the recursion.',
        verifyCode:
          'tree = [1, [2, None, None], [3, None, None]]\n\ndef total(node):\n    if node is None:\n        return 0\n    return node[0] + total(node[1]) + total(node[2])\n\nprint(total(tree))',
        verifyOutput: '6',
      },
    },
    items: [
      {
        type: 'predict',
        code: 'tree = [1, [2, None, None], [3, None, None]]\nprint(tree[0], tree[1][0], tree[2][0])',
        answer: '1 2 3',
        why: 'tree[0] is the value, tree[1] the left child, tree[2] the right — index into them.',
      },
      {
        type: 'predict',
        code:
          'def depth(node):\n    if node is None:\n        return 0\n    return 1 + max(depth(node[1]), depth(node[2]))\n\nprint(depth([1, [2, None, None], None]))',
        answer: '2',
        why: 'One level for the root plus the deeper child (the left branch, depth 1).',
      },
      {
        type: 'type',
        prompt: 'The base case: return 0 when the node is empty (None).',
        answer: 'if node is None:',
        why: 'Every tree recursion stops at an empty child — the None base case.',
      },
      {
        type: 'write',
        brief: 'tree_sum(tree): add up every value in the tree (nested [value, left, right], None = empty).',
        function_name: 'tree_sum',
        starter_code: 'def tree_sum(tree):\n    if tree is None:\n        return 0\n    \n',
        tests: [
          { args: [[1, [2, null, null], [3, null, null]]], expected: 6 },
          { args: [null], expected: 0 },
          { args: [[5, null, null]], expected: 5 },
        ],
        solution:
          'def tree_sum(tree):\n    if tree is None:\n        return 0\n    return tree[0] + tree_sum(tree[1]) + tree_sum(tree[2])\n',
        hint: 'Value plus tree_sum of the left child plus tree_sum of the right child.',
      },
    ],
  },
  {
    id: 'ch8-traversals',
    chapter: 'structures',
    title: 'Tree traversals',
    minutes: 6,
    prereqs: ['ch8-trees'],
    read: {
      text:
        'The three DFS orders differ only in WHEN you record the node. **Preorder**: node, left, right. **Inorder**: left, node, right — on a binary search tree this comes out SORTED. **Postorder**: left, right, node (children before parent).\n\n**Level-order** (BFS) reads row by row using a queue instead of recursion.',
      example: {
        code:
          'tree = [2, [1, None, None], [3, None, None]]\n\ndef inorder(node):\n    if node is None:\n        return []\n    return inorder(node[1]) + [node[0]] + inorder(node[2])\n\nprint(inorder(tree))',
        expectedOutput: '[1, 2, 3]',
      },
      visual: {
        widget: 'tree-view',
        tree: [2, [1, null, null], [3, null, null]],
        caption: 'Inorder records LEFT, then the node, then RIGHT — sorted on a BST.',
        beats: [
          { active: 'L', caption: 'Inorder goes left first — record 1.' },
          { active: '', visited: ['L'], caption: 'Then the node itself — 2.' },
          { active: 'R', visited: ['L', ''], caption: 'Then right — 3. Output: 1, 2, 3, in order.' },
        ],
        why: 'Only the position of "record the node" changes between the three orders.',
        verifyCode:
          'tree = [2, [1, None, None], [3, None, None]]\n\ndef inorder(node):\n    if node is None:\n        return []\n    return inorder(node[1]) + [node[0]] + inorder(node[2])\n\nprint(inorder(tree))',
        verifyOutput: '[1, 2, 3]',
      },
    },
    items: [
      {
        type: 'predict',
        code:
          'def preorder(node):\n    if node is None:\n        return []\n    return [node[0]] + preorder(node[1]) + preorder(node[2])\n\nprint(preorder([1, [2, None, None], [3, None, None]]))',
        answer: '[1, 2, 3]',
        why: 'Preorder records the node FIRST: 1, then the left (2), then the right (3).',
      },
      {
        type: 'predict',
        code:
          'def postorder(node):\n    if node is None:\n        return []\n    return postorder(node[1]) + postorder(node[2]) + [node[0]]\n\nprint(postorder([1, [2, None, None], [3, None, None]]))',
        answer: '[2, 3, 1]',
        why: 'Postorder records children before the parent: left (2), right (3), then 1.',
      },
      {
        type: 'type',
        prompt: 'The inorder body: left subtree, then this node, then right subtree.',
        answer: 'inorder(node[1]) + [node[0]] + inorder(node[2])',
        why: 'Left, node, right — put [node[0]] in the middle.',
      },
      {
        type: 'write',
        brief: 'preorder(tree): the values in preorder (node, then left, then right).',
        function_name: 'preorder',
        starter_code: 'def preorder(tree):\n    if tree is None:\n        return []\n    \n',
        tests: [
          { args: [[1, [2, null, null], [3, null, null]]], expected: [1, 2, 3] },
          { args: [null], expected: [] },
          { args: [[5, null, [6, null, null]]], expected: [5, 6] },
        ],
        solution:
          'def preorder(tree):\n    if tree is None:\n        return []\n    return [tree[0]] + preorder(tree[1]) + preorder(tree[2])\n',
        hint: 'Node value first, then preorder of the left, then preorder of the right.',
      },
    ],
  },
  {
    id: 'ch8-backtracking',
    chapter: 'structures',
    title: 'Backtracking',
    minutes: 8,
    prereqs: ['ch8-traversals'],
    read: {
      text:
        '**Backtracking** explores a tree of choices. At each step: CHOOSE an option, recurse to EXPLORE what follows, then UN-CHOOSE (undo) and try the next. It is DFS over decisions — the engine behind subsets, permutations and combinations.\n\nThe undo (`path.pop()`) is what lets one `path` list be reused down every branch.',
      example: {
        code:
          'def subsets(nums):\n    res = []\n    def go(i, path):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        go(i + 1, path)\n        path.append(nums[i])\n        go(i + 1, path)\n        path.pop()\n    go(0, [])\n    return res\n\nprint(subsets([1, 2]))',
        expectedOutput: '[[], [2], [1], [1, 2]]',
      },
      visual: {
        widget: 'tree-view',
        tree: ['·', ['skip 1', ['{}', null, null], ['{2}', null, null]], ['+1', ['{1}', null, null], ['{1,2}', null, null]]],
        caption: 'Each level decides one item: skip (left) or take (right). Every leaf is a subset.',
        beats: [
          { active: '', caption: 'At each item you branch: skip it (left) or take it (right).' },
          { active: 'LL', visited: [''], caption: 'Skip 1, skip 2 → the empty set {}.' },
          { active: 'LR', visited: ['', 'LL'], caption: 'Skip 1, take 2 → {2}.' },
          { active: 'RL', visited: ['', 'LL', 'LR'], caption: 'Take 1, skip 2 → {1}.' },
          { active: 'RR', visited: ['', 'LL', 'LR', 'RL'], caption: 'Take 1, take 2 → {1,2}. Every root-to-leaf path is one answer.' },
        ],
        why: 'Choose → explore → un-choose walks the whole decision tree, depth-first.',
        verifyCode:
          'def subsets(nums):\n    res = []\n    def go(i, path):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        go(i + 1, path)\n        path.append(nums[i])\n        go(i + 1, path)\n        path.pop()\n    go(0, [])\n    return res\n\nprint(subsets([1, 2]))',
        verifyOutput: '[[], [2], [1], [1, 2]]',
      },
    },
    items: [
      {
        type: 'predict',
        code:
          'def subsets(nums):\n    res = []\n    def go(i, path):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        go(i + 1, path)\n        path.append(nums[i])\n        go(i + 1, path)\n        path.pop()\n    go(0, [])\n    return res\n\nprint(subsets([1]))',
        answer: '[[], [1]]',
        why: 'One item, two choices: skip it → [], or take it → [1].',
      },
      {
        type: 'predict',
        code: "path = [1, 2]\npath.append(3)\nsnapshot = path[:]\npath.pop()\nprint(snapshot, path)",
        answer: '[1, 2, 3] [1, 2]',
        why: 'path[:] snapshots a COPY before the undo; path.pop() then removes the 3.',
      },
      {
        type: 'type',
        prompt: 'Undo the last choice after exploring it.',
        answer: 'path.pop()',
        why: 'Removing the item you added lets the same path list try the next branch.',
      },
      {
        type: 'write',
        brief: 'subsets(nums): every subset (skip-then-take order, snapshot with path[:]).',
        function_name: 'subsets',
        starter_code: 'def subsets(nums):\n    res = []\n    def go(i, path):\n        \n    go(0, [])\n    return res\n',
        tests: [
          { args: [[1, 2]], expected: [[], [2], [1], [1, 2]] },
          { args: [[]], expected: [[]] },
          { args: [[1]], expected: [[], [1]] },
        ],
        solution:
          'def subsets(nums):\n    res = []\n    def go(i, path):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        go(i + 1, path)\n        path.append(nums[i])\n        go(i + 1, path)\n        path.pop()\n    go(0, [])\n    return res\n',
        hint: 'Base case appends path[:]; then recurse skipping, then choose/recurse/un-choose.',
      },
    ],
  },
  {
    id: 'ch8-tries',
    chapter: 'structures',
    title: 'Tries — prefix trees',
    minutes: 6,
    prereqs: ['ch8-backtracking'],
    read: {
      text:
        'A **trie** (prefix tree) stores words letter by letter down shared branches. Each node is a dict mapping the next letter to a child node, plus an end marker. Insert walks the letters, creating children as needed (`setdefault`); search walks them and checks the end marker; `startsWith` just needs the path to exist.\n\nShared prefixes are stored once — fast prefix queries.',
      example: {
        code:
          "def make_trie(words):\n    root = {}\n    for w in words:\n        node = root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node['end'] = True\n    return root\n\nt = make_trie(['cat'])\nprint('c' in t and 'a' in t['c'])",
        expectedOutput: 'True',
      },
      visual: {
        widget: 'tree-view',
        tree: ['·', ['c', ['a', ['t', null, null], ['r', null, null]], null], null],
        caption: 'Letters branch down; words that share a prefix share the path.',
        beats: [
          { active: 'L', caption: "Insert 'cat': the first letter c branches off the root." },
          { active: 'LL', visited: ['L'], caption: 'Then a — the shared prefix "ca".' },
          { active: 'LLL', visited: ['L', 'LL'], caption: 'Then t → "cat" is stored as a path.' },
          { active: 'LLR', visited: ['L', 'LL', 'LLL'], caption: "'car' reuses c-a, then branches to r — prefixes shared." },
        ],
        why: 'Each letter is a child dict; shared prefixes reuse the same nodes.',
        verifyCode:
          "def make_trie(words):\n    root = {}\n    for w in words:\n        node = root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node['end'] = True\n    return root\n\nt = make_trie(['cat'])\nprint('c' in t and 'a' in t['c'])",
        verifyOutput: 'True',
      },
    },
    items: [
      {
        type: 'predict',
        code: "d = {}\nnode = d.setdefault('c', {})\nnode['end'] = True\nprint(d)",
        answer: "{'c': {'end': True}}",
        why: 'setdefault created the child dict for c, and we marked it as a word end.',
      },
      {
        type: 'predict',
        code: "root = {'c': {'a': {'end': True}}}\nprint('a' in root['c'])",
        answer: 'True',
        why: "root['c'] is the node after c; 'a' is a child there, so the prefix ca exists.",
      },
      {
        type: 'type',
        prompt: 'Move into (creating if needed) the child node for letter ch.',
        answer: 'node = node.setdefault(ch, {})',
        why: 'setdefault returns the existing child or makes a fresh empty one — the insert step.',
      },
      {
        type: 'write',
        brief: 'word_in_trie(words, target): build a trie from words; return True only if target is a stored WORD.',
        function_name: 'word_in_trie',
        starter_code:
          "def word_in_trie(words, target):\n    root = {}\n    for w in words:\n        node = root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node['end'] = True\n    \n",
        tests: [
          { args: [['cat', 'car'], 'cat'], expected: true },
          { args: [['cat'], 'ca'], expected: false },
          { args: [['cat'], 'dog'], expected: false },
        ],
        solution:
          "def word_in_trie(words, target):\n    root = {}\n    for w in words:\n        node = root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node['end'] = True\n    node = root\n    for ch in target:\n        if ch not in node:\n            return False\n        node = node[ch]\n    return node.get('end', False)\n",
        hint: 'Walk target letter by letter; if any letter is missing return False; finally check the end flag.',
      },
    ],
  },
];
