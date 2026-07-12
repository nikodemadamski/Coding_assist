export const SQL_QUESTIONS_3 = [
  {
    id: 'sql-lag-previous',
    track: 'sql',
    title: 'Gold compared to yesterday',
    difficulty: 'medium',
    pattern: 'window-functions',
    description:
      'The table `haul(crew, day, gold)` logs how much gold each crew hauled on each day.\n\nReturn `crew`, `day`, `gold`, and `delta` — how much **more (or less)** the crew hauled than on its **previous day**. Each crew’s first day has no previous day, so its `delta` is NULL.\n\nOrder the result by `crew` ascending, then `day` ascending.',
    examples: [
      'Result columns: crew, day, gold, delta — first day per crew shows NULL.',
    ],
    function_name: '',
    starter_code: '-- haul(crew TEXT, day INTEGER, gold INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE haul (crew TEXT, day INTEGER, gold INTEGER);\nINSERT INTO haul VALUES\n ('strawhat', 1, 100),\n ('strawhat', 2, 150),\n ('strawhat', 3, 130),\n ('heart', 1, 80),\n ('heart', 2, 60);",
    expected_rows: [
      ['heart', 1, 80, null],
      ['heart', 2, 60, -20],
      ['strawhat', 1, 100, null],
      ['strawhat', 2, 150, 50],
      ['strawhat', 3, 130, -20],
    ],
    order_matters: true,
    tests: [],
    hint: 'Subtract the lagged value: `gold - LAG(gold) OVER (PARTITION BY crew ORDER BY day)`. LAG returns NULL when there is no previous row, and NULL arithmetic stays NULL — exactly the first-day behaviour you want.',
    solution:
      'SELECT crew, day, gold,\n       gold - LAG(gold) OVER (PARTITION BY crew ORDER BY day) AS delta\nFROM haul\nORDER BY crew, day;',
    why: 'Day-over-day change is the classic LAG interview question (LeetCode-style "warmer than yesterday", revenue deltas, session gaps). It tests whether you reach for a window offset function instead of a clumsy self-join on `day - 1` — and whether you know PARTITION BY resets the lookback at each crew boundary.',
    insight: 'The transferable idea: LAG/LEAD give a row access to its neighbours *after* the partition’s ordering, in one scan — the self-join spelling (`ON a.day = b.day + 1`) breaks the moment days have gaps, while LAG just takes "the previous row that exists". The NULL on each first row is a feature: `NULL` propagates through the subtraction, cleanly marking "no baseline" without a CASE. Reach for `LAG(gold, 1, 0)` only when a zero baseline is genuinely correct.',
    constraints: [
      '(crew, day) pairs are unique',
      'days per crew start at 1 with no gaps',
      'first day per crew must show delta = NULL',
      'Result must be ordered by crew, then day',
    ],
    complexity: 'O(n log n) — window sort per partition, then one pass',
  },
  {
    id: 'sql-dense-rank-ties',
    track: 'sql',
    title: 'Bounty leaderboard with fair ties',
    difficulty: 'medium',
    pattern: 'window-functions',
    description:
      'The table `bounties(name, amount)` holds current bounty postings; several pirates can share the **same amount**.\n\nReturn `name`, `amount`, and `rnk` — the leaderboard position by `amount` descending, where **equal amounts share a position and no positions are skipped** (two pirates tied at the top are both 1, and the next amount is 2, not 3).\n\nOrder the result by `amount` descending, then `name` ascending.',
    examples: [
      'Result columns: name, amount, rnk — ties share a rank, next rank is not skipped.',
    ],
    function_name: '',
    starter_code: '-- bounties(name TEXT, amount INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE bounties (name TEXT, amount INTEGER);\nINSERT INTO bounties VALUES\n ('Luffy', 3000),\n ('Law', 3000),\n ('Zoro', 1111),\n ('Sanji', 1032),\n ('Jinbe', 1032);",
    expected_rows: [
      ['Law', 3000, 1],
      ['Luffy', 3000, 1],
      ['Zoro', 1111, 2],
      ['Jinbe', 1032, 3],
      ['Sanji', 1032, 3],
    ],
    order_matters: true,
    tests: [],
    hint: '`DENSE_RANK() OVER (ORDER BY amount DESC)` — RANK() would jump from the two 1s straight to 3. Remember the outer ORDER BY still needs `amount DESC, name` to pin the display order.',
    solution:
      'SELECT name, amount,\n       DENSE_RANK() OVER (ORDER BY amount DESC) AS rnk\nFROM bounties\nORDER BY amount DESC, name;',
    why: 'RANK vs DENSE_RANK vs ROW_NUMBER is a guaranteed follow-up the moment ranking appears in an interview. The three differ only on ties: ROW_NUMBER invents an arbitrary order to break them, RANK shares the position but skips ahead by the tie count, DENSE_RANK shares and never skips. Picking the wrong one silently corrupts "second highest" questions.',
    insight: 'The go-deeper idea: choose by asking "what should the row AFTER a tie say?" — Olympic medals skip (RANK: two golds, then bronze at 3), "the 2nd distinct salary" must not (DENSE_RANK), and pagination needs uniqueness above all (ROW_NUMBER). All three share one window sort, so there is no performance reason to prefer one; it is purely a semantics decision. Also note ties in the display ORDER BY need a tiebreaker column (`name` here) or the row order itself becomes nondeterministic.',
    constraints: [
      'names are unique; amounts are not',
      'equal amounts must share a rank with no gaps after them',
      'Result must be ordered by amount descending, then name ascending',
    ],
    complexity: 'O(n log n) — one window sort',
  },
  {
    id: 'sql-second-per-group',
    track: 'sql',
    title: 'Second strongest in every sea',
    difficulty: 'hard',
    pattern: 'window-functions',
    description:
      'The table `pirates(sea, name, bounty)` lists pirates and the sea they sail; bounties are unique **within** a sea.\n\nReturn the `sea` and the `name` of the pirate with the **second-highest** bounty in that sea. A sea with only one pirate produces **no row**. Row order does not matter.',
    examples: ['Result columns: sea, name — one row per sea that has at least 2 pirates.'],
    function_name: '',
    starter_code:
      '-- pirates(sea TEXT, name TEXT, bounty INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE pirates (sea TEXT, name TEXT, bounty INTEGER);\nINSERT INTO pirates VALUES\n ('east', 'Luffy', 30),\n ('east', 'Kuro', 16),\n ('east', 'Buggy', 15),\n ('west', 'Law', 500),\n ('west', 'Kid', 470),\n ('south', 'Bege', 300);",
    expected_rows: [
      ['east', 'Kuro'],
      ['west', 'Kid'],
    ],
    order_matters: false,
    tests: [],
    hint: 'Window functions cannot appear in WHERE — compute `ROW_NUMBER() OVER (PARTITION BY sea ORDER BY bounty DESC)` in a subquery (or CTE), then filter `WHERE rn = 2` outside it.',
    solution:
      'SELECT sea, name\nFROM (\n  SELECT sea, name,\n         ROW_NUMBER() OVER (PARTITION BY sea ORDER BY bounty DESC) AS rn\n  FROM pirates\n) ranked\nWHERE rn = 2;',
    why: '"Nth per group" is the single most-asked hard SQL interview question (second-highest salary per department). It bundles three checks: you know ROW_NUMBER, you know window results must be wrapped in a subquery before you can filter on them, and you notice the edge case — groups too small to have an Nth row simply disappear.',
    insight: 'The transferable idea is the two-layer shape: **window in the inner query, filter in the outer** — WHERE runs before windows are computed, so `WHERE rn = 2` directly beside the OVER clause is a syntax error, not a style choice. Swap the 2 for any N, or `<= N` for "top N per group". One subtlety: with tied bounties ROW_NUMBER picks an arbitrary #2 — if ties should share, this is where DENSE_RANK replaces ROW_NUMBER, and "the second distinct value" becomes the answer.',
    constraints: [
      'bounties are unique within each sea',
      'a sea with fewer than 2 pirates contributes no row',
      'Row order does not matter',
    ],
    complexity: 'O(n log n) — window sort per partition',
  },
  {
    id: 'sql-moving-average',
    track: 'sql',
    title: 'Three-day rolling gold',
    difficulty: 'hard',
    pattern: 'window-functions',
    description:
      'The table `sales(day, gold)` logs one row per day.\n\nReturn `day`, `gold`, and `avg3` — the average of that day and the **two days before it**. Days 1 and 2 average whatever exists so far (day 1 averages just itself).\n\nOrder the result by `day` ascending.',
    examples: [
      'Result columns: day, gold, avg3 — avg3 covers at most 3 rows ending at that day.',
    ],
    function_name: '',
    starter_code: '-- sales(day INTEGER, gold INTEGER)\nSELECT ...\n',
    sql_setup:
      'CREATE TABLE sales (day INTEGER, gold INTEGER);\nINSERT INTO sales VALUES\n (1, 90),\n (2, 30),\n (3, 60),\n (4, 120),\n (5, 30);',
    expected_rows: [
      [1, 90, 90],
      [2, 30, 60],
      [3, 60, 60],
      [4, 120, 70],
      [5, 30, 70],
    ],
    order_matters: true,
    tests: [],
    hint: '`AVG(gold) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` — the frame clips at the partition edge, so day 1 averages one row and day 2 averages two. No CASE needed.',
    solution:
      'SELECT day, gold,\n       AVG(gold) OVER (\n         ORDER BY day\n         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n       ) AS avg3\nFROM sales\nORDER BY day;',
    why: 'Moving averages are the canonical explicit-frame question (7-day active users, rolling revenue). The running total taught you the *implicit* frame; this one checks you can override it — and that you know frames clip gracefully at the edges instead of erroring or emitting NULL.',
    insight: 'The go-deeper idea is `ROWS` vs `RANGE`: ROWS counts physical rows back, RANGE extends by the ORDER BY *value* — with one row per day they agree, but with duplicate days RANGE would swallow all ties while ROWS takes exactly two rows. Real dashboards usually want "2 preceding calendar days", which with gaps in the data is RANGE (or a calendar join) territory. Also notice the frame quietly redefines the aggregate: same AVG, different window of rows — the frame is *part of the function’s meaning*, not an optimization.',
    constraints: [
      'days start at 1 with no gaps or duplicates',
      'days 1 and 2 average only the rows that exist',
      'Result must be ordered by day',
    ],
    complexity: 'O(n log n) sort, then one windowed pass',
  },
  {
    id: 'sql-percent-of-total',
    track: 'sql',
    title: 'Every crew’s share of the haul',
    difficulty: 'medium',
    pattern: 'window-functions',
    description:
      'The table `haul(crew, gold)` holds each crew’s total gold — one row per crew.\n\nReturn `crew` and `pct` — that crew’s gold as a **percentage of all gold in the table** (e.g. 200 out of 400 total → `50.0`).\n\nOrder the result by `pct` descending — and produce it in a **single query over the table**, without hard-coding the total.',
    examples: ['Result columns: crew, pct — percentages across all rows sum to 100.'],
    function_name: '',
    starter_code: '-- haul(crew TEXT, gold INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE haul (crew TEXT, gold INTEGER);\nINSERT INTO haul VALUES\n ('strawhat', 200),\n ('heart', 100),\n ('kid', 60),\n ('buggy', 40);",
    expected_rows: [
      ['strawhat', 50],
      ['heart', 25],
      ['kid', 15],
      ['buggy', 10],
    ],
    order_matters: true,
    tests: [],
    hint: 'Divide by the windowed grand total: `gold * 100.0 / SUM(gold) OVER ()`. The `100.0` matters — `gold * 100 / SUM(...)` in integer contexts can truncate.',
    solution:
      'SELECT crew,\n       gold * 100.0 / SUM(gold) OVER () AS pct\nFROM haul\nORDER BY pct DESC;',
    why: 'Percent-of-total is the question that separates "knows GROUP BY" from "knows windows": the naive route needs a subquery or a CROSS JOIN against the total, while `SUM(...) OVER ()` puts the denominator on every row in one scan. Market share, traffic share, budget share — the shape is everywhere.',
    insight: 'The transferable idea: an empty OVER () is a legal, useful window — no PARTITION, no ORDER, so the frame is the entire result set and every row sees the same aggregate. It composes too: `SUM(gold) OVER (PARTITION BY sea)` beside `SUM(gold) OVER ()` gives share-within-sea and share-overall in the same SELECT, something GROUP BY alone cannot express without joining two aggregation levels. And the `* 100.0` is the classic integer-division guard — put the float on the numerator before the divide.',
    constraints: [
      'one row per crew; gold > 0',
      'percentages are exact for this data — no rounding needed',
      'Result must be ordered by pct descending',
    ],
    complexity: 'O(n) — one scan with a whole-set window',
  },
  {
    id: 'sql-gap-to-leader',
    track: 'sql',
    title: 'Distance to the top of each sea',
    difficulty: 'hard',
    pattern: 'window-functions',
    description:
      'The table `pirates(sea, name, bounty)` lists pirates by sea.\n\nReturn `sea`, `name`, and `gap` — how far each pirate’s bounty is **below the highest bounty in their own sea** (the leader shows `0`).\n\nOrder the result by `sea` ascending, then `bounty` descending.',
    examples: ['Result columns: sea, name, gap — the leader of each sea has gap 0.'],
    function_name: '',
    starter_code:
      '-- pirates(sea TEXT, name TEXT, bounty INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE pirates (sea TEXT, name TEXT, bounty INTEGER);\nINSERT INTO pirates VALUES\n ('east', 'Luffy', 30),\n ('east', 'Kuro', 16),\n ('east', 'Buggy', 15),\n ('north', 'Law', 500),\n ('north', 'Kid', 470);",
    expected_rows: [
      ['east', 'Luffy', 0],
      ['east', 'Kuro', 14],
      ['east', 'Buggy', 15],
      ['north', 'Law', 0],
      ['north', 'Kid', 30],
    ],
    order_matters: true,
    tests: [],
    hint: '`MAX(bounty) OVER (PARTITION BY sea) - bounty` — a window with PARTITION BY but no ORDER BY covers the whole partition, so every row of a sea sees that sea’s maximum.',
    solution:
      'SELECT sea, name,\n       MAX(bounty) OVER (PARTITION BY sea) - bounty AS gap\nFROM pirates\nORDER BY sea, bounty DESC;',
    why: 'Comparing each row to its group’s best (gap to top salary, seconds behind the race leader) is the question that checks you know a partition-wide aggregate needs **no ORDER BY in the window** — add one and the frame silently becomes cumulative, turning "the sea’s max" into "the max so far", a classic wrong-answer generator.',
    insight: 'The go-deeper idea: window ORDER BY does not just sort — it *changes the default frame* from "whole partition" to "start through current row". `MAX(bounty) OVER (PARTITION BY sea)` is the whole sea; `MAX(bounty) OVER (PARTITION BY sea ORDER BY bounty DESC)` happens to work here only because the max arrives first — with FIRST_VALUE the ordered window is doing real work instead. The GROUP BY alternative (aggregate to per-sea max, join back) gives identical results in two passes; the window spelling is the one-pass, keep-every-row version.',
    constraints: [
      'every sea has at least one pirate; bounties unique within a sea',
      'the top pirate of each sea must show gap = 0',
      'Result must be ordered by sea, then bounty descending',
    ],
    complexity: 'O(n log n) — partition sort, then one pass',
  },
];
