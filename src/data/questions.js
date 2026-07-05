// Seed question bank. Phase 4 fills this to 30 questions across the three tracks.
//
// Question shape (see README / spec):
//   python/pandas: function_name, starter_code, tests: [{ args, expected }]
//     - pandas: an arg of shape { "__df__": [ {col: val}, ... ] } is converted to a
//       DataFrame before the call; expected DataFrames are records-orient JSON.
//   sql: sql_setup (CREATE TABLE + INSERTs), expected_rows, order_matters?

export const SEED_QUESTIONS = [
  {
    id: 'py-two-sum',
    track: 'python',
    title: 'Two Sum',
    difficulty: 'easy',
    pattern: 'hashing',
    description:
      'Given a list of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`, as a list `[i, j]` with `i < j`.\n\nExactly one solution exists, and you may not use the same element twice.\n\nAim for a single pass with a dict mapping value → index.',
    examples: [
      'two_sum([2, 7, 11, 15], 9)  ->  [0, 1]',
      'two_sum([3, 2, 4], 6)       ->  [1, 2]',
    ],
    function_name: 'two_sum',
    starter_code:
      'def two_sum(nums, target):\n    # return [i, j] with i < j such that nums[i] + nums[j] == target\n    ...\n',
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-3, 4, 1, 90], -2], expected: [0, 2] },
      { args: [[5, 75, 25], 100], expected: [1, 2] },
    ],
    hint: 'Walk the list once. For each value, check whether `target - value` is already in a dict of seen values; if so you have your pair. Otherwise store `value -> index`.',
    solution:
      'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n',
  },
  {
    id: 'pd-filter-rows',
    track: 'pandas',
    title: 'Filter rows by threshold',
    difficulty: 'easy',
    pattern: 'filtering',
    description:
      'You get a DataFrame `df` with columns `name` and `score`. Return a DataFrame with only the rows where `score` is **strictly greater** than `threshold`, keeping the original column order and row order.\n\nReturn the filtered DataFrame (reset the index).',
    examples: [
      "filter_scores(df, 80) where df has scores [95, 62, 88]  ->  rows for the 95 and 88 entries",
    ],
    function_name: 'filter_scores',
    starter_code:
      'import pandas as pd\n\ndef filter_scores(df, threshold):\n    # return only rows with score > threshold\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', score: 95 },
              { name: 'Usopp', score: 62 },
              { name: 'Nami', score: 88 },
            ],
          },
          80,
        ],
        expected: [
          { name: 'Zoro', score: 95 },
          { name: 'Nami', score: 88 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Luffy', score: 70 },
              { name: 'Sanji', score: 70 },
            ],
          },
          70,
        ],
        expected: [],
      },
      {
        args: [{ __df__: [{ name: 'Robin', score: 100 }] }, 0],
        expected: [{ name: 'Robin', score: 100 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Chopper', score: 55 },
              { name: 'Franky', score: 81 },
              { name: 'Brook', score: 12 },
            ],
          },
          50,
        ],
        expected: [
          { name: 'Chopper', score: 55 },
          { name: 'Franky', score: 81 },
        ],
      },
    ],
    hint: 'Boolean masks: `df[df["score"] > threshold]`. Remember `.reset_index(drop=True)`.',
    solution:
      'import pandas as pd\n\ndef filter_scores(df, threshold):\n    return df[df["score"] > threshold].reset_index(drop=True)\n',
  },
  {
    id: 'sql-select-where',
    track: 'sql',
    title: 'Strong swordsmen',
    difficulty: 'easy',
    pattern: 'select-where',
    description:
      'The table `fighters(name, style, power)` lists dojo members. Select the `name` and `power` of every fighter with `power` of at least 80, strongest first.',
    examples: ['Result columns: name, power — ordered by power descending.'],
    function_name: '',
    starter_code: '-- fighters(name TEXT, style TEXT, power INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE fighters (name TEXT, style TEXT, power INTEGER);\nINSERT INTO fighters VALUES\n ('Zoro', 'three-sword', 96),\n ('Tashigi', 'one-sword', 74),\n ('Mihawk', 'one-sword', 99),\n ('Johnny', 'two-sword', 41),\n ('Kuina', 'one-sword', 80);",
    expected_rows: [
      ['Mihawk', 99],
      ['Zoro', 96],
      ['Kuina', 80],
    ],
    order_matters: true,
    tests: [],
    hint: '`WHERE power >= 80` then `ORDER BY power DESC`.',
    solution: 'SELECT name, power\nFROM fighters\nWHERE power >= 80\nORDER BY power DESC;',
  },
];
