export const SQL_QUESTIONS_2 = [
  {
    id: 'sql-self-join-mentor',
    track: 'sql',
    title: 'Every student and their mentor',
    difficulty: 'medium',
    pattern: 'join',
    description:
      'The table `members(id, name, mentor_id)` lists everyone in the dojo; `mentor_id` points at another row in the **same table** (the head instructor has `mentor_id` NULL).\n\nReturn each student’s `name` alongside their mentor’s `name` — one row per member **who has a mentor**. Row order does not matter.',
    examples: ['Result columns: student, mentor — one row per member with a mentor.'],
    function_name: '',
    starter_code:
      '-- members(id INTEGER, name TEXT, mentor_id INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE members (id INTEGER, name TEXT, mentor_id INTEGER);\nINSERT INTO members VALUES\n (1, 'Koushirou', NULL),\n (2, 'Zoro', 1),\n (3, 'Kuina', 1),\n (4, 'Johnny', 2),\n (5, 'Yosaku', 2);",
    expected_rows: [
      ['Zoro', 'Koushirou'],
      ['Kuina', 'Koushirou'],
      ['Johnny', 'Zoro'],
      ['Yosaku', 'Zoro'],
    ],
    order_matters: false,
    tests: [],
    hint: 'Alias the table twice: `FROM members s JOIN members m ON s.mentor_id = m.id`. The NULL mentor_id never matches, so the head instructor drops out on the inner join.',
    solution:
      'SELECT s.name AS student, m.name AS mentor\nFROM members s\nJOIN members m ON s.mentor_id = m.id;',
    why: 'A self-join treats one table as two — the only way to relate rows to *other rows of the same table* (employee→manager, event→previous event). Interviewers use it to check you truly understand that JOIN operates on row sets, not on "tables" as fixed things.',
    insight: 'The transferable idea: aliases create independent cursors over the same data, so any hierarchy stored as a parent pointer becomes queryable with the ordinary join toolkit. Also note the NULL edge — `NULL = anything` is never true, so the root of the hierarchy silently vanishes on an inner self-join; switch to LEFT JOIN when the root must stay.',
    constraints: [
      'mentor_id is either NULL or a valid id in the same table',
      'names are unique',
      'Row order does not matter',
    ],
    complexity: 'O(n) with a hash/index join; O(n²) naive',
  },
  {
    id: 'sql-case-when-pivot',
    track: 'sql',
    title: 'Win–loss ledger per dojo',
    difficulty: 'medium',
    pattern: 'group-by',
    description:
      'The table `duels(dojo, result)` records one row per duel, where `result` is either `win` or `loss`.\n\nFor each `dojo` return three columns: the dojo, its number of **wins**, and its number of **losses** — both counts on the **same row**. Row order does not matter.',
    examples: ['Result columns: dojo, wins, losses — one row per dojo.'],
    function_name: '',
    starter_code: '-- duels(dojo TEXT, result TEXT)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE duels (dojo TEXT, result TEXT);\nINSERT INTO duels VALUES\n ('shimotsuki', 'win'),\n ('shimotsuki', 'loss'),\n ('shimotsuki', 'win'),\n ('wave', 'loss'),\n ('wave', 'loss'),\n ('frost', 'win');",
    expected_rows: [
      ['shimotsuki', 2, 1],
      ['wave', 0, 2],
      ['frost', 1, 0],
    ],
    order_matters: false,
    tests: [],
    hint: "Count conditionally: `SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)` — each matching row contributes 1, everything else 0. Repeat for losses.",
    solution:
      "SELECT dojo,\n       SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,\n       SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses\nFROM duels\nGROUP BY dojo;",
    why: 'Conditional aggregation — CASE WHEN inside SUM or COUNT — turns categories into columns in a single scan. It is *the* workhorse of reporting queries and a near-guaranteed interview follow-up once you have shown plain GROUP BY.',
    insight: 'The go-deeper idea is that this is a manual pivot: rows become columns without a second query or a self-join. The same shape computes rates too — `AVG(CASE WHEN … THEN 1.0 ELSE 0 END)` is a conversion rate in one line. Note the 0-cases: wave has zero wins yet still shows a 0, which the two-rows-per-dojo version would have silently omitted.',
    constraints: [
      "result is always exactly 'win' or 'loss'",
      'every dojo appears at least once',
      'Row order does not matter',
    ],
    complexity: 'O(n) scan, O(g) space — g groups',
  },
  {
    id: 'sql-not-exists-anti',
    track: 'sql',
    title: 'Islands no ship has reached',
    difficulty: 'medium',
    pattern: 'subquery',
    description:
      'Tables: `islands(id, name)` and `visits(island_id, ship)` — one visit row per landing.\n\nReturn the `name` of every island that has **never been visited**. Row order does not matter.\n\nYou solved this shape once with LEFT JOIN + IS NULL; this time write it as a **correlated subquery** with `NOT EXISTS` (or `NOT IN`) — interviewers often ask for both spellings.',
    examples: ['Result column: name — only islands with zero visits.'],
    function_name: '',
    starter_code:
      '-- islands(id INTEGER, name TEXT)\n-- visits(island_id INTEGER, ship TEXT)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE islands (id INTEGER, name TEXT);\nINSERT INTO islands VALUES (1, 'Drum'), (2, 'Alabasta'), (3, 'Skypiea'), (4, 'Jaya');\nCREATE TABLE visits (island_id INTEGER, ship TEXT);\nINSERT INTO visits VALUES\n (1, 'Merry'),\n (2, 'Merry'),\n (2, 'Sunny');",
    expected_rows: [['Skypiea'], ['Jaya']],
    order_matters: false,
    tests: [],
    hint: 'For each island ask "does any visit point at me?": `WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.island_id = i.id)`.',
    solution:
      'SELECT name\nFROM islands i\nWHERE NOT EXISTS (\n  SELECT 1 FROM visits v WHERE v.island_id = i.id\n);',
    why: 'The anti-join — "rows in A with no match in B" — has three standard spellings: LEFT JOIN + IS NULL, NOT EXISTS, and NOT IN. Interviewers ask for NOT EXISTS specifically because it reads as the question itself and because it exposes whether you know the NOT IN trap.',
    insight: 'The transferable idea: NOT EXISTS is NULL-safe and short-circuits per row, while `NOT IN (subquery)` returns **zero rows** if the subquery yields even one NULL — `x NOT IN (1, NULL)` is unknown, never true. Here `visits.island_id` has no NULLs so both work, but in production data NOT EXISTS is the spelling that never betrays you. Modern optimizers compile all three to the same anti-join plan.',
    constraints: [
      'island ids are unique',
      'visits.island_id always references a real island',
      'Row order does not matter',
    ],
    complexity: 'O(n + m) with a hash/index; O(n·m) naive',
  },
  {
    id: 'sql-running-total',
    track: 'sql',
    title: 'Gold hauled so far, per crew',
    difficulty: 'hard',
    pattern: 'window-functions',
    description:
      'The table `haul(crew, day, gold)` logs how much gold each crew hauled on each day.\n\nReturn `crew`, `day`, `gold`, and `total_so_far` — the **running total** of that crew’s gold from day 1 up to and including that day. Each crew’s tally starts fresh at its own day 1.\n\nOrder the result by `crew` ascending, then `day` ascending.',
    examples: [
      'Result columns: crew, day, gold, total_so_far — ordered by crew, then day.',
    ],
    function_name: '',
    starter_code: '-- haul(crew TEXT, day INTEGER, gold INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE haul (crew TEXT, day INTEGER, gold INTEGER);\nINSERT INTO haul VALUES\n ('strawhat', 1, 100),\n ('strawhat', 2, 50),\n ('strawhat', 3, 200),\n ('heart', 1, 80),\n ('heart', 2, 120);",
    expected_rows: [
      ['heart', 1, 80, 80],
      ['heart', 2, 120, 200],
      ['strawhat', 1, 100, 100],
      ['strawhat', 2, 50, 150],
      ['strawhat', 3, 200, 350],
    ],
    order_matters: true,
    tests: [],
    hint: '`SUM(gold) OVER (PARTITION BY crew ORDER BY day)` — the ORDER BY inside the OVER makes the frame cumulative. Then a separate outer `ORDER BY crew, day` fixes the row order of the result.',
    solution:
      'SELECT crew, day, gold,\n       SUM(gold) OVER (PARTITION BY crew ORDER BY day) AS total_so_far\nFROM haul\nORDER BY crew, day;',
    why: 'Running totals are the second-most-asked window question after top-per-group: cumulative revenue, balance after each transaction, points through a season. It tests whether you know that ORDER BY *inside* OVER changes the window frame — without it SUM gives every row the partition’s grand total.',
    insight: 'The go-deeper idea is the window **frame**: `SUM(x) OVER (ORDER BY d)` implicitly means `ROWS/RANGE UNBOUNDED PRECEDING TO CURRENT ROW`, and the default RANGE frame lumps ties in the ORDER BY key together — two rows on the same day would show the same cumulative value. When the sort key can tie, either add a tie-breaking column to the window’s ORDER BY or state the frame explicitly with `ROWS`. Also notice the two ORDER BYs do different jobs: the one inside OVER defines the math, the outer one only defines display order.',
    constraints: [
      '(crew, day) pairs are unique',
      'days per crew start at 1 with no gaps',
      'gold ≥ 0',
      'Result must be ordered by crew, then day',
    ],
    complexity: 'O(n log n) — window sort per partition, then one pass',
  },
  {
    id: 'sql-distinct-order-limit',
    track: 'sql',
    title: 'First four charted islands',
    difficulty: 'easy',
    pattern: 'order-limit',
    description:
      'The table `sightings(sea, island)` logs raw lookout reports — the same island can be reported many times.\n\nNami wants a clean chart: return the **distinct** `(sea, island)` pairs, ordered by `sea` ascending and then `island` ascending, and keep only the **first 4** rows.',
    examples: ['Exactly 4 rows: sea, island — deduplicated, sorted by sea then island.'],
    function_name: '',
    starter_code: '-- sightings(sea TEXT, island TEXT)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE sightings (sea TEXT, island TEXT);\nINSERT INTO sightings VALUES\n ('east', 'Shells Town'),\n ('east', 'Orange Town'),\n ('east', 'Shells Town'),\n ('grand', 'Drum'),\n ('east', 'Baratie'),\n ('grand', 'Alabasta'),\n ('grand', 'Drum');",
    expected_rows: [
      ['east', 'Baratie'],
      ['east', 'Orange Town'],
      ['east', 'Shells Town'],
      ['grand', 'Alabasta'],
    ],
    order_matters: true,
    tests: [],
    hint: '`SELECT DISTINCT sea, island` dedupes whole rows; then `ORDER BY sea, island LIMIT 4`. DISTINCT applies before LIMIT, so duplicates never eat into your 4.',
    solution:
      'SELECT DISTINCT sea, island\nFROM sightings\nORDER BY sea, island\nLIMIT 4;',
    why: 'DISTINCT, multi-key ORDER BY, and LIMIT are three small clauses interviewers love to combine, because the pitfall is order of operations: DISTINCT dedupes first, ORDER BY sorts the deduped set, LIMIT cuts last. Get that sequence wrong in your head and the "top N unique" answer comes out short.',
    insight: 'The transferable idea: `SELECT DISTINCT a, b` dedupes the **whole row tuple**, not each column separately — (east, Drum) and (grand, Drum) would both survive. And a multi-key ORDER BY is lexicographic, exactly like sorting Python tuples: all `east` rows before any `grand` row, islands alphabetical within each sea. Deterministic ordering before LIMIT is what makes the query reproducible.',
    constraints: [
      'sea and island are never NULL',
      'at least 4 distinct (sea, island) pairs exist',
      'Result must be ordered by sea, then island',
    ],
    complexity: 'O(n log n) — dedup + sort dominate',
  },
  {
    id: 'sql-left-join-coalesce',
    track: 'sql',
    title: 'Bounty board with zero-filled rookies',
    difficulty: 'easy',
    pattern: 'join',
    description:
      'Tables: `crew(id, name)` and `bounties(crew_id, amount)` — not every crew member has a posted bounty yet.\n\nReturn **every** crew member’s `name` and their bounty `amount`, showing `0` instead of NULL for members with no bounty. Row order does not matter.',
    examples: ['Result columns: name, bounty — one row per crew member, 0 when unposted.'],
    function_name: '',
    starter_code:
      '-- crew(id INTEGER, name TEXT)\n-- bounties(crew_id INTEGER, amount INTEGER)\nSELECT ...\n',
    sql_setup:
      "CREATE TABLE crew (id INTEGER, name TEXT);\nINSERT INTO crew VALUES (1, 'Luffy'), (2, 'Zoro'), (3, 'Chopper'), (4, 'Nami');\nCREATE TABLE bounties (crew_id INTEGER, amount INTEGER);\nINSERT INTO bounties VALUES\n (1, 3000),\n (2, 1111);",
    expected_rows: [
      ['Luffy', 3000],
      ['Zoro', 1111],
      ['Chopper', 0],
      ['Nami', 0],
    ],
    order_matters: false,
    tests: [],
    hint: 'LEFT JOIN from crew so nobody drops out, then wrap the nullable side: `COALESCE(b.amount, 0)`.',
    solution:
      'SELECT c.name, COALESCE(b.amount, 0) AS bounty\nFROM crew c\nLEFT JOIN bounties b ON b.crew_id = c.id;',
    why: 'LEFT JOIN + COALESCE is how real reports say "everyone, with a sensible default" — users with 0 orders, days with 0 sales. It checks two things at once: you know which table must be the left side, and you know the NULLs a LEFT JOIN manufactures must be handled explicitly.',
    insight: 'The go-deeper idea: the NULLs in an unmatched LEFT JOIN row are *created by the join*, not stored in any table, so no WHERE filter on the base data can fix them — you patch them at SELECT time with COALESCE (which returns its first non-NULL argument). The same pairing scales up: `COALESCE(SUM(b.amount), 0)` after a LEFT JOIN + GROUP BY is the standard "count/sum with zero-filled groups" move.',
    constraints: [
      'each crew member has at most one bounty row',
      'bounties.crew_id always references a real crew member',
      'Row order does not matter',
    ],
    complexity: 'O(n + m) with a hash/index join',
  },
];
