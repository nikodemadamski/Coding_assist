// The warm-up bank: rapid-fire "type the Python" questions, like stretching
// before the workout. Each item is a one-liner the user must type from a
// prompt. `answer` is the canonical form shown in feedback; `accept` lists
// other correct ways to write it. Answers are compared after normalizing
// whitespace (outside string literals) and quote style, so `x=[]`, `x = []`
// and "double quotes" all count.

import { WARMUP_SQL_SETS } from './warmups-sql.js';
import { WARMUP_PD_SETS } from './warmups-pandas.js';

export const WARMUP_LEVELS = [
  {
    key: 'beginner',
    track: 'python',
    label: 'Beginner',
    blurb: 'The absolute basics — lists, dicts, loops, ifs. Start here if Python is new.',
    seconds: 20,
  },
  {
    key: 'intermediate',
    track: 'python',
    label: 'Intermediate',
    blurb: 'Comprehensions, slices, enumerate/zip, dict tricks — the everyday toolbox.',
    seconds: 15,
  },
  {
    key: 'hard',
    track: 'python',
    label: 'Hard',
    blurb: 'Interview idioms — heaps, deques, lambdas as keys, unpacking, walrus.',
    seconds: 10,
  },
  {
    key: 'pd-beginner',
    track: 'pandas',
    label: 'Beginner',
    blurb: 'Select, filter, sort, describe — reading a DataFrame without thinking.',
    seconds: 25,
  },
  {
    key: 'pd-intermediate',
    track: 'pandas',
    label: 'Intermediate',
    blurb: 'groupby, merge, str methods, boolean masks — the everyday analysis kit.',
    seconds: 20,
  },
  {
    key: 'pd-hard',
    track: 'pandas',
    label: 'Hard',
    blurb: 'pivot_table, melt, rolling, transform, pd.cut — interview pandas.',
    seconds: 15,
  },
  {
    key: 'sql-beginner',
    track: 'sql',
    label: 'Beginner',
    blurb: 'SELECT, WHERE, ORDER BY, LIMIT — reading tables without thinking.',
    seconds: 25,
  },
  {
    key: 'sql-intermediate',
    track: 'sql',
    label: 'Intermediate',
    blurb: 'Aggregates, GROUP BY/HAVING, joins, CASE WHEN — the everyday query kit.',
    seconds: 20,
  },
  {
    key: 'sql-hard',
    track: 'sql',
    label: 'Hard',
    blurb: 'Window functions, CTEs, anti-joins, correlated subqueries — interview SQL.',
    seconds: 15,
  },
];

// Collapse a typed answer to a canonical form: drop all whitespace OUTSIDE
// string literals (spaces inside quotes are meaningful — ' '.join!), and
// normalize both quote styles to single quotes.
export function normalizeAnswer(text, { foldCase = false } = {}) {
  let out = '';
  let quote = null;
  for (const ch of String(text)) {
    if (quote) {
      if (ch === quote) {
        out += "'";
        quote = null;
      } else {
        out += ch; // inside quotes: case and spaces are meaningful
      }
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += "'";
    } else if (!/\s/.test(ch)) {
      out += foldCase ? ch.toLowerCase() : ch;
    }
  }
  return out;
}

// SQL keywords are case-insensitive outside string literals; Python is not.
export function checkAnswer(item, input, { foldCase = false } = {}) {
  const opts = { foldCase };
  const typed = normalizeAnswer(input, opts);
  if (!typed) return false;
  return [item.answer, ...(item.accept ?? [])].some((a) => normalizeAnswer(a, opts) === typed);
}

const q = (prompt, answer, ...accept) => ({ prompt, answer, accept });

export const WARMUP_SETS = {
  beginner: [
    q('Create an empty list called nums', 'nums = []', 'nums = list()'),
    q('Create an empty dictionary called ages', 'ages = {}', 'ages = dict()'),
    q('Create an empty set called seen', 'seen = set()'),
    q('Create a variable x holding the number 5', 'x = 5'),
    q("Create a variable name holding the string 'zoro'", "name = 'zoro'"),
    q('Add the number 3 to the end of the list nums', 'nums.append(3)'),
    q('Get how many items are in the list nums', 'len(nums)'),
    q('Get the first element of nums', 'nums[0]'),
    q('Get the last element of nums', 'nums[-1]', 'nums[len(nums) - 1]'),
    q('Set the first element of nums to 9', 'nums[0] = 9'),
    q('Add a and b, storing the result in total', 'total = a + b', 'total = b + a'),
    q('Divide 7 by 2, keeping only the whole part', '7 // 2'),
    q('Get the remainder when 7 is divided by 2', '7 % 2'),
    q('Raise 2 to the power of 10', '2 ** 10'),
    q('Check whether x is equal to 5', 'x == 5'),
    q('Check whether x is NOT equal to 5', 'x != 5'),
    q('Set flag to the boolean for "yes"', 'flag = True'),
    q("Set result to Python's \"no value\"", 'result = None'),
    q('First line of an if statement: x greater than 0', 'if x > 0:'),
    q('First line of a for loop over nums, calling each item n', 'for n in nums:'),
    q('The numbers 0 through 4, using range', 'range(5)', 'range(0, 5)'),
    q('First line of a while loop that runs while x is less than 10', 'while x < 10:'),
    q('First line of a function named greet that takes no parameters', 'def greet():'),
    q('Return the value x from inside a function', 'return x'),
    q("Print the string 'hello'", "print('hello')"),
    q('Convert the string s to an integer', 'int(s)'),
    q('Convert the number n to a string', 'str(n)'),
    q('Create a list called nums holding 1, 2 and 3', 'nums = [1, 2, 3]'),
    q('Check whether 3 is in the list nums', '3 in nums'),
    q('Check whether 3 is NOT in the list nums', '3 not in nums'),
    q('Check that a and b are both true', 'a and b'),
    q('Check that at least one of a or b is true', 'a or b'),
    q("Get the value stored under the key 'age' in the dict person", "person['age']"),
    q("Store 21 under the key 'age' in the dict person", "person['age'] = 21"),
    q('Write a comment that says hi', '# hi'),
    q('Import the math module', 'import math'),
    q('Get a new sorted copy of nums', 'sorted(nums)'),
    q('Add up all the numbers in nums', 'sum(nums)'),
    q('Get the largest number in nums', 'max(nums)'),
    q('Get the smallest number in nums', 'min(nums)'),
    q('Uppercase the string s', 's.upper()'),
    q('Lowercase the string s', 's.lower()'),
    q('Strip whitespace from both ends of s', 's.strip()'),
    q('Split the string s into a list of words', 's.split()'),
    q('Get the length of the string s', 'len(s)'),
    q('Get the first three characters of s with a slice', 's[:3]', 's[0:3]'),
    q('Count how many times 2 appears in nums', 'nums.count(2)'),
    q('Remove and return the last element of nums', 'nums.pop()', 'nums.pop(-1)'),
    q('Join the list words into one string, separated by single spaces', "' '.join(words)"),
    q('An f-string containing hi, a space, then the value of the variable name', "f'hi {name}'"),
  ],
  intermediate: [
    q('List comprehension: the square of every n in nums', '[n ** 2 for n in nums]', '[n * n for n in nums]'),
    q('List comprehension: only the even numbers in nums', '[n for n in nums if n % 2 == 0]'),
    q('Loop over nums with the index i and the value n', 'for i, n in enumerate(nums):'),
    q('Loop over names and ages in parallel, as name and age', 'for name, age in zip(names, ages):'),
    q('A lambda that takes x and returns x doubled', 'lambda x: x * 2', 'lambda x: 2 * x', 'lambda x: x + x'),
    q('Sort words by their length (new list)', 'sorted(words, key=len)'),
    q('A reversed copy of nums, using a slice', 'nums[::-1]'),
    q('Sort nums from largest to smallest (new list)', 'sorted(nums, reverse=True)'),
    q("Get 'age' from the dict person, defaulting to 0 if missing", "person.get('age', 0)"),
    q('Loop over the dict person as key k and value v', 'for k, v in person.items():'),
    q('Swap the values of a and b in one line', 'a, b = b, a'),
    q("One-line conditional: y is 'yes' if x > 0, otherwise 'no'", "y = 'yes' if x > 0 else 'no'"),
    q('Every second element of nums (a step-2 slice)', 'nums[::2]'),
    q('Check that every n in nums is positive, using all', 'all(n > 0 for n in nums)'),
    q('Check whether any n in nums is negative, using any', 'any(n < 0 for n in nums)'),
    q('Import Counter from collections', 'from collections import Counter'),
    q('Import defaultdict from collections', 'from collections import defaultdict'),
    q('First line of a try block', 'try:'),
    q('Catch a ValueError, naming it e', 'except ValueError as e:'),
    q("Open data.txt for reading with a context manager, as f", "with open('data.txt') as f:"),
    q('Check whether x is an int', 'isinstance(x, int)', 'type(x) == int', 'type(x) is int'),
    q('Join words with a comma and a space', "', '.join(words)"),
    q('Reverse the string s', 's[::-1]'),
    q('Find the index of the value 7 in nums', 'nums.index(7)'),
    q('Append every item of the list more onto nums', 'nums.extend(more)', 'nums += more'),
    q('Insert 5 at the front (position 0) of nums', 'nums.insert(0, 5)'),
    q('Remove the first occurrence of 3 from nums', 'nums.remove(3)'),
    q("Delete the key 'age' from the dict person", "del person['age']", "person.pop('age')"),
    q('Get all keys of person as a list', 'list(person.keys())', 'list(person)'),
    q('Merge dicts d1 and d2 into one new dict', '{**d1, **d2}', 'd1 | d2'),
    q('The numbers 10 down to 1, using range', 'range(10, 0, -1)'),
    q('Function header: add takes a, and b defaulting to 0', 'def add(a, b=0):'),
    q('Function header: f accepts any number of positional arguments', 'def f(*args):'),
    q('Round x to 2 decimal places', 'round(x, 2)'),
    q('Absolute value of x', 'abs(x)'),
    q("Check whether s starts with 'py'", "s.startswith('py')"),
    q("Replace every 'a' in s with 'o'", "s.replace('a', 'o')"),
    q("Remove duplicates from nums (order doesn't matter)", 'set(nums)', 'list(set(nums))'),
    q('Elements in both sets a and b (intersection)', 'a & b', 'a.intersection(b)'),
    q('Elements in either set a or b (union)', 'a | b', 'a.union(b)'),
    q('Convert every string in strs to an int, as a list', '[int(s) for s in strs]', 'list(map(int, strs))'),
    q('Count occurrences of each item in nums with Counter', 'Counter(nums)'),
    q('Dict comprehension: map each n in nums to its square', '{n: n ** 2 for n in nums}', '{n: n * n for n in nums}'),
    q('Sum of the squares of nums, with a generator expression', 'sum(n ** 2 for n in nums)', 'sum(n * n for n in nums)'),
    q('Loop over just the last three items of nums', 'for n in nums[-3:]:'),
    q('The number in nums with the largest absolute value', 'max(nums, key=abs)'),
    q('Read the whole file f into one string', 'f.read()'),
    q('An f-string showing price with exactly 2 decimals', "f'{price:.2f}'"),
    q('Check 0 < x < 10 in one chained comparison', '0 < x < 10'),
    q('The binary string of the number n', 'bin(n)'),
  ],
  hard: [
    q('Transpose matrix (a list of rows), using zip', 'list(zip(*matrix))'),
    q("Sort the list pairs by each pair's second item", 'sorted(pairs, key=lambda p: p[1])'),
    q('Invert the dict d: values become keys', '{v: k for k, v in d.items()}'),
    q('Import deque from collections', 'from collections import deque'),
    q('Pop from the LEFT end of the deque dq', 'dq.popleft()'),
    q('Import heapq', 'import heapq'),
    q('Push 5 onto the min-heap h', 'heapq.heappush(h, 5)'),
    q('Pop the smallest item off the heap h', 'heapq.heappop(h)'),
    q('Leftmost insertion index for x in the sorted list nums', 'bisect.bisect_left(nums, x)'),
    q('The single most common element in the Counter c', 'c.most_common(1)[0][0]'),
    q('A defaultdict whose missing values start as empty lists', 'defaultdict(list)'),
    q("Walrus in an if: assign len(nums) to n and check it's > 3", 'if (n := len(nums)) > 3:'),
    q('Yield the value x from a generator', 'yield x'),
    q('Unpack nums: first element into first, everything else into rest', 'first, *rest = nums'),
    q('An r-by-c grid of zeros with independent rows', '[[0] * c for _ in range(r)]', '[[0] * c for i in range(r)]'),
    q('A list of n zeros', '[0] * n'),
    q('Midpoint of indices l and r, rounded down', '(l + r) // 2', 'l + (r - l) // 2'),
    q('a to the power b, modulo m, in one built-in call', 'pow(a, b, m)'),
    q('Quotient and remainder of a divided by b, in one call', 'divmod(a, b)'),
    q("The character code of 'a'", "ord('a')"),
    q('The character with code 97', 'chr(97)'),
    q('Split s on whitespace and convert each piece to int, as a list', 'list(map(int, s.split()))', '[int(x) for x in s.split()]'),
    q('Class header for a class named Node', 'class Node:'),
    q('Constructor header taking self and val', 'def __init__(self, val):'),
    q('Apply lru_cache as a decorator (the line above a function)', '@lru_cache', '@lru_cache()', '@lru_cache(maxsize=None)'),
    q('Import lru_cache from functools', 'from functools import lru_cache'),
    q('List comprehension: n if n is positive, else 0, for each n in nums', '[n if n > 0 else 0 for n in nums]'),
    q('Set comprehension of the first letter of every word in words', '{w[0] for w in words}'),
    q('Sort the items of dict d by value', 'sorted(d.items(), key=lambda kv: kv[1])', 'sorted(d.items(), key=lambda x: x[1])'),
    q('Enumerate nums starting the index at 1', 'for i, n in enumerate(nums, 1):', 'for i, n in enumerate(nums, start=1):'),
    q('Flatten matrix into one flat list, with a comprehension', '[x for row in matrix for x in row]'),
    q('Next value from the iterator it, or None when exhausted', 'next(it, None)'),
    q('Grab one arbitrary element from the set s', 'next(iter(s))'),
    q('Loop over nums backwards without copying it', 'for n in reversed(nums):'),
    q('Sort nums in place, from largest to smallest', 'nums.sort(reverse=True)'),
    q('A tuple containing just the number 5', '(5,)', 'tuple([5])'),
    q('Elements common to lists a and b, using sets', 'set(a) & set(b)', 'set(a).intersection(b)', 'set(a).intersection(set(b))'),
    q('Replace the first two elements of nums with 0, 0 via slice assignment', 'nums[:2] = [0, 0]'),
    q("The string 'ab' repeated three times", "'ab' * 3", "3 * 'ab'"),
    q('Pad the string s with leading zeros to width 5', 's.zfill(5)'),
    q('An f-string showing n with thousands separators (commas)', "f'{n:,}'"),
    q('Import permutations from itertools', 'from itertools import permutations'),
    q('All 2-element combinations of nums', 'combinations(nums, 2)', 'list(combinations(nums, 2))'),
    q('Count into a plain dict: increment d[k], treating a missing key as 0', 'd[k] = d.get(k, 0) + 1'),
    q('Remove duplicates from nums KEEPING order, via dict', 'list(dict.fromkeys(nums))'),
    q('A list of 3 independent empty lists', '[[] for _ in range(3)]', '[[] for i in range(3)]'),
    q('Declare that count inside a function refers to the module-level variable', 'global count'),
    q("Raise a ValueError with the message 'bad'", "raise ValueError('bad')"),
    q('Sort words alphabetically, ignoring case', 'sorted(words, key=str.lower)'),
    q('First line of a while loop that runs while the deque dq is non-empty', 'while dq:', 'while len(dq) > 0:', 'while len(dq):'),
  ],
  ...WARMUP_PD_SETS,
  ...WARMUP_SQL_SETS,
};
