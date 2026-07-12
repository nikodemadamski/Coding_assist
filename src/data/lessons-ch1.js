// Chapter 1 — Speaking Python. Absolute zero: values, variables, numbers,
// strings, booleans, calling built-in functions. Items are predict/type only
// (def, loops and editors arrive in later chapters). Every snippet's output
// is machine-verified — see tests/lesson-tests.mjs.

export const LESSONS_CH1 = [
  {
    id: 'ch1-values',
    chapter: 'speaking-python',
    title: 'Values & print',
    minutes: 4,
    prereqs: [],
    read: {
      text:
        'Python programs are built from **values**: numbers like `3`, and text like `\'zoro\'` — quotes are how you mark text. `print(...)` shows a value on the screen.\n\nTwo things beginners meet immediately: text prints **without** its quotes, and printing several things separated by commas puts **spaces** between them. Each `print` ends its own line.',
      example: { code: "print('welcome to the dojo')", expectedOutput: 'welcome to the dojo' },
    },
    items: [
      {
        type: 'predict',
        code: 'print(3)',
        answer: '3',
        why: 'A number prints as itself — no quotes needed, none shown.',
      },
      {
        type: 'predict',
        code: "print('zoro')",
        answer: 'zoro',
        why: 'Quotes MARK text; they are not part of the value, so they never print.',
      },
      {
        type: 'type',
        prompt: 'Show the number 42 on the screen.',
        answer: 'print(42)',
        why: 'print is a function: the parentheses hold what you want shown.',
      },
      {
        type: 'predict',
        code: "print('luffy', 'zoro')",
        answer: 'luffy zoro',
        why: 'Commas inside print show each value with a single space between them.',
      },
      {
        type: 'type',
        prompt: 'Show the text hello on the screen.',
        answer: "print('hello')",
        why: 'Text needs quotes — without them Python would look for a VARIABLE named hello.',
      },
      {
        type: 'predict',
        code: 'print(2, 4, 6)',
        answer: '2 4 6',
        why: 'Any number of comma-separated values works — spaces appear between each pair.',
      },
      {
        type: 'predict',
        code: "print('sanji')\nprint('cook')",
        answer: 'sanji cook',
        accept: ['sanji\ncook'],
        why: 'Each print ends its line — two prints means two lines: sanji, then cook.',
      },
      {
        type: 'type',
        prompt: 'Print the two words rubber and pirate with ONE print, comma-separated.',
        answer: "print('rubber', 'pirate')",
        why: 'One print, two values — the comma adds the space for you.',
      },
    ],
  },
  {
    id: 'ch1-variables',
    chapter: 'speaking-python',
    title: 'Variables — naming a value',
    minutes: 4,
    prereqs: ['ch1-values'],
    read: {
      text:
        'A **variable** is a name for a value: `power = 90` stores 90 under the name `power`. From then on you can use the name anywhere you would use the value.\n\nThe name always goes LEFT of `=`, the value RIGHT. Assigning again **replaces** what the name points to — variables remember only their latest value.',
      example: { code: 'power = 90\nprint(power)', expectedOutput: '90' },
    },
    items: [
      {
        type: 'type',
        prompt: 'Store 90 in a variable named power.',
        answer: 'power = 90',
        why: 'name = value. The single = means "store", not "compare".',
      },
      {
        type: 'predict',
        code: 'x = 5\nprint(x)',
        answer: '5',
        why: 'Printing a variable prints the VALUE it names.',
      },
      {
        type: 'predict',
        code: 'x = 5\nx = 7\nprint(x)',
        answer: '7',
        why: 'The second assignment replaces the first — x now names 7, and 5 is gone.',
      },
      {
        type: 'predict',
        code: 'a = 3\nb = a\na = 10\nprint(b)',
        answer: '3',
        why: 'b = a copied the VALUE 3 into b. Re-pointing a later does not touch b.',
      },
      {
        type: 'type',
        prompt: 'Store the text zoro in a variable called name.',
        answer: "name = 'zoro'",
        why: 'Same shape as numbers — only the value needs quotes because it is text.',
      },
      {
        type: 'predict',
        code: 'x = 4\nprint(x + x)',
        answer: '8',
        why: 'A variable can be used inside any expression — x + x is 4 + 4.',
      },
      {
        type: 'predict',
        code: "word = 'go'\nprint(word, word)",
        answer: 'go go',
        why: 'Text variables work everywhere text works — printed twice with a space between.',
      },
      {
        type: 'type',
        prompt: 'Print the variable bounty.',
        answer: 'print(bounty)',
        why: 'No quotes: quotes would print the WORD bounty instead of its value.',
      },
    ],
  },
  {
    id: 'ch1-numbers',
    chapter: 'speaking-python',
    title: 'Numbers & math',
    minutes: 5,
    prereqs: ['ch1-variables'],
    read: {
      text:
        'Math works as expected: `+ - *`, parentheses to group, and `**` for powers. Order follows school math.\n\nDivision is the surprise: `/` ALWAYS gives a decimal (`10 / 2` is `5.0`). For whole-number work you get two friends you will use constantly in interviews: `//` (divide and drop the remainder) and `%` (the remainder itself).',
      example: { code: 'print(7 // 2, 7 % 2)', expectedOutput: '3 1' },
    },
    items: [
      {
        type: 'predict',
        code: 'print(2 + 3 * 4)',
        answer: '14',
        why: 'Multiplication first, like school math: 2 + 12.',
      },
      {
        type: 'predict',
        code: 'print((2 + 3) * 4)',
        answer: '20',
        why: 'Parentheses group first: 5 * 4.',
      },
      {
        type: 'predict',
        code: 'print(10 / 2)',
        answer: '5.0',
        why: 'The / operator ALWAYS produces a decimal — even when it divides evenly.',
      },
      {
        type: 'predict',
        code: 'print(10 // 3)',
        answer: '3',
        why: '// divides and drops the remainder: 10 ÷ 3 is 3 remainder 1, keep the 3.',
      },
      {
        type: 'predict',
        code: 'print(10 % 3)',
        answer: '1',
        why: '% is the remainder: the 1 left over after fitting three 3s into 10.',
      },
      {
        type: 'type',
        prompt: 'The expression for 2 to the power of 8.',
        answer: '2 ** 8',
        why: '** is the power operator (not ^, which does something else entirely).',
      },
      {
        type: 'predict',
        code: 'print(2 ** 3)',
        answer: '8',
        why: '2 ** 3 is 2 × 2 × 2.',
      },
      {
        type: 'type',
        prompt: 'The expression for the remainder when n is divided by 10 (the last digit).',
        answer: 'n % 10',
        why: 'n % 10 peels off the last digit — an interview classic you will meet again.',
      },
    ],
  },
  {
    id: 'ch1-strings',
    chapter: 'speaking-python',
    title: 'Strings — working with text',
    minutes: 5,
    prereqs: ['ch1-variables'],
    read: {
      text:
        'Text values are called **strings**. Glue them with `+`, repeat with `*`, count characters with `len(s)`, and change case with `s.upper()` / `s.lower()`.\n\nThe everyday superpower is the **f-string**: put an `f` before the quotes and anything inside `{}` gets its value filled in — `f\'hello, {name}\'` builds text from variables.',
      example: { code: "name = 'zoro'\nprint(f'hello, {name}')", expectedOutput: 'hello, zoro' },
    },
    items: [
      {
        type: 'predict',
        code: "print('go' + 'mu')",
        answer: 'gomu',
        why: '+ glues strings together, no space added — you control every character.',
      },
      {
        type: 'predict',
        code: "print('na' * 2)",
        answer: 'nana',
        why: '* repeats a string that many times.',
      },
      {
        type: 'predict',
        code: "print(len('luffy'))",
        answer: '5',
        why: 'len counts the characters.',
      },
      {
        type: 'predict',
        code: "print('DOJO'.lower())",
        answer: 'dojo',
        why: '.lower() returns a lowercased COPY — strings never change in place.',
      },
      {
        type: 'type',
        prompt: 'Uppercase the string s.',
        answer: 's.upper()',
        why: 'Methods hang off the value with a dot: s.upper(), s.lower(), s.strip()…',
      },
      {
        type: 'predict',
        code: "power = 100\nprint(f'power: {power}')",
        answer: 'power: 100',
        why: 'Inside an f-string, {power} is replaced by the value of power.',
      },
      {
        type: 'type',
        prompt: 'Build the text level 5 with an f-string, using the variable level.',
        answer: "f'level {level}'",
        why: 'The f prefix turns {level} from literal braces into a fill-in slot.',
      },
      {
        type: 'predict',
        code: "print('ha' + 'ha' * 2)",
        answer: 'hahaha',
        why: "* runs before +, like math: 'ha' + 'haha'.",
      },
    ],
  },
  {
    id: 'ch1-booleans',
    chapter: 'speaking-python',
    title: 'True, False & comparisons',
    minutes: 5,
    prereqs: ['ch1-numbers'],
    read: {
      text:
        'Python has exactly two truth values: `True` and `False` — capital first letter.\n\nComparisons produce them: `==` equal, `!=` not equal, `< > <= >=`. The classic trap: a single `=` STORES, a double `==` COMPARES.\n\nCombine truths with `and`, `or`, `not` — plain English words, and the backbone of every `if` you will ever write.',
      example: { code: 'print(3 > 2)', expectedOutput: 'True' },
    },
    items: [
      {
        type: 'predict',
        code: 'print(5 == 5)',
        answer: 'True',
        why: '== asks "are these equal?" — here the answer is True (capital T).',
      },
      {
        type: 'predict',
        code: 'print(5 != 5)',
        answer: 'False',
        why: '!= asks "are these different?" — 5 is not different from 5.',
      },
      {
        type: 'predict',
        code: 'print(2 > 3)',
        answer: 'False',
        why: 'Comparisons are questions; the printed value is the answer.',
      },
      {
        type: 'type',
        prompt: 'The comparison asking: is x equal to 10?',
        answer: 'x == 10',
        why: 'Double equals compares. Single equals would try to STORE 10 in x.',
      },
      {
        type: 'predict',
        code: 'print(True and False)',
        answer: 'False',
        why: 'and needs BOTH sides true.',
      },
      {
        type: 'predict',
        code: 'print(True or False)',
        answer: 'True',
        why: 'or is satisfied by EITHER side.',
      },
      {
        type: 'predict',
        code: 'print(not True)',
        answer: 'False',
        why: 'not flips a truth value.',
      },
      {
        type: 'predict',
        code: 'print(3 < 4 and 4 < 5)',
        answer: 'True',
        why: 'Each comparison resolves first, then and combines them: True and True.',
      },
      {
        type: 'type',
        prompt: 'The expression for the opposite of the variable done.',
        answer: 'not done',
        why: 'not works on any truth value, including one stored in a variable.',
      },
    ],
  },
  {
    id: 'ch1-calling',
    chapter: 'speaking-python',
    title: 'Calling functions',
    minutes: 5,
    prereqs: ['ch1-strings', 'ch1-booleans'],
    read: {
      text:
        'A **function** is a named recipe you call with parentheses: you already use `print(...)` and `len(...)`. Python ships more: `max`, `min`, `abs`, `round`, and converters like `int(\'7\')` which turns text into a number.\n\nThe key idea: functions **give a value back**. You can print it, store it in a variable, or feed it straight into another function.',
      example: { code: 'biggest = max(3, 9, 4)\nprint(biggest)', expectedOutput: '9' },
    },
    items: [
      {
        type: 'predict',
        code: 'print(max(2, 7, 5))',
        answer: '7',
        why: 'max returns the largest of its inputs; print shows what came back.',
      },
      {
        type: 'predict',
        code: 'print(min(2, 7, 5))',
        answer: '2',
        why: 'min is the mirror of max.',
      },
      {
        type: 'predict',
        code: 'print(abs(-4))',
        answer: '4',
        why: 'abs strips the sign — distance from zero.',
      },
      {
        type: 'predict',
        code: 'print(round(3.7))',
        answer: '4',
        why: 'round returns the nearest whole number.',
      },
      {
        type: 'type',
        prompt: 'The number of characters in the variable word.',
        answer: 'len(word)',
        why: 'len works on any string (and, soon, on lists too).',
      },
      {
        type: 'predict',
        code: "print(int('7') + 1)",
        answer: '8',
        why: "int('7') converts the TEXT '7' into the NUMBER 7 — then math works.",
      },
      {
        type: 'predict',
        code: "print(len('one piece'))",
        answer: '9',
        why: 'The space is a character too: 8 letters + 1 space.',
      },
      {
        type: 'type',
        prompt: 'Convert the text in the variable s to a whole number.',
        answer: 'int(s)',
        why: 'The converter family: int(...), float(...), str(...) — you will use them constantly.',
      },
    ],
  },
];
