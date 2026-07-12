export const SQL_QUESTIONS_4 = [
  {
    id: 'sql-month-of-sailing',
    track: 'sql',
    title: 'Stamp each voyage with its month',
    difficulty: 'easy',
    pattern: 'select-where',
    description:
      'The table `voyages(id, sailed)` stores each departure date as text in `YYYY-MM-DD` form.\n\nReturn `id` and `ym` — the year and month of each departure as a `YYYY-MM` string (e.g. `2024-03`).\n\nOrder the result by `id` ascending.',
    examples: ["Result columns: id, ym — '2024-03-05' becomes '2024-03'."],
    function_name: '',
    starter_code: '-- voyages(id INTEGER, sailed TEXT)  -- YYYY-MM-DD\nSELECT\n',
    sql_setup:
      "CREATE TABLE voyages (id INTEGER, sailed TEXT);\nINSERT INTO voyages VALUES\n (1, '2024-03-05'),\n (2, '2024-11-21'),\n (3, '2025-01-09');",
    expected_rows: [
      [1, '2024-03'],
      [2, '2024-11'],
      [3, '2025-01'],
    ],
    order_matters: true,
    tests: [],
    hint: "`strftime('%Y-%m', sailed)` formats a date value with the same % codes as C/Python. (`substr(sailed, 1, 7)` also works here — but only strftime keeps working when the column becomes a real timestamp.)",
    solution:
      "SELECT id, strftime('%Y-%m', sailed) AS ym\nFROM voyages\nORDER BY id;",
    why: 'Reporting almost never wants raw timestamps — it wants them truncated to a month, a year, a week. Date formatting is the very first thing you do in any time-based SQL question, and interviewers use it as the on-ramp before grouping by it.',
    insight: 'The transferable idea: SQLite stores dates as plain text/numbers and gives you functions (strftime, date, julianday) that INTERPRET them — there is no separate date type. The `%Y-%m` string this produces is deliberately sortable-as-text, which is why year-month strings order correctly with a plain ORDER BY; that property quietly powers the next question, grouping by month.',
    constraints: [
      'sailed is always a valid YYYY-MM-DD string',
      'Result must be ordered by id',
    ],
    complexity: 'O(n) — one scan, one format per row',
  },
  {
    id: 'sql-days-at-sea',
    track: 'sql',
    title: 'Days at sea',
    difficulty: 'medium',
    pattern: 'select-where',
    description:
      'The table `trips(ship, set_out, returned)` stores two dates per trip as `YYYY-MM-DD` text.\n\nReturn `ship` and `days` — the **whole number of days** between setting out and returning (a same-day return is `0`).\n\nOrder the result by `ship` ascending.',
    examples: ['Result columns: ship, days — 2024-01-10 to 2024-01-25 is 15.'],
    function_name: '',
    starter_code:
      '-- trips(ship TEXT, set_out TEXT, returned TEXT)  -- YYYY-MM-DD\nSELECT\n',
    sql_setup:
      "CREATE TABLE trips (ship TEXT, set_out TEXT, returned TEXT);\nINSERT INTO trips VALUES\n ('Merry', '2024-01-10', '2024-01-25'),\n ('Sunny', '2024-02-01', '2024-03-01'),\n ('Tang', '2024-05-05', '2024-05-05');",
    expected_rows: [
      ['Merry', 15],
      ['Sunny', 29],
      ['Tang', 0],
    ],
    order_matters: true,
    tests: [],
    hint: 'Subtracting date STRINGS is meaningless — convert both to day numbers first: `julianday(returned) - julianday(set_out)`, then `CAST(... AS INTEGER)` to shed the .0.',
    solution:
      'SELECT ship,\n       CAST(julianday(returned) - julianday(set_out) AS INTEGER) AS days\nFROM trips\nORDER BY ship;',
    why: 'Date arithmetic — age in days, time between order and delivery, subscription length — is a guaranteed real-world query, and it catches everyone who tries `returned - set_out` on text and gets garbage. The question tests whether you know dates must become numbers before they can subtract.',
    insight: "The go-deeper idea: `julianday` maps any date to a continuous day count (days since 4714 BC), turning calendar arithmetic into plain subtraction — leap years, month lengths and all. It returns a REAL, so whole-day differences come back as 15.0 until you CAST. February 2024 has 29 days (leap year) — the Sunny row is a quiet check that you computed, not counted on your fingers. For calendar-aware jumps ('+1 month') you'd reach for `date(d, '+1 month')` modifiers instead.",
    constraints: [
      'returned is never earlier than set_out',
      'days must be an integer, not 15.0',
      'Result must be ordered by ship',
    ],
    complexity: 'O(n) — one scan, two conversions per row',
  },
  {
    id: 'sql-monthly-gold',
    track: 'sql',
    title: 'Gold per month',
    difficulty: 'medium',
    pattern: 'group-by',
    description:
      'The table `hauls(day, gold)` logs one row per haul with its date as `YYYY-MM-DD` text.\n\nReturn `month` (a `YYYY-MM` string) and `total` — the total gold hauled in that month.\n\nOrder the result by `month` ascending.',
    examples: ['Result columns: month, total — one row per month that has hauls.'],
    function_name: '',
    starter_code: '-- hauls(day TEXT, gold INTEGER)  -- YYYY-MM-DD\nSELECT\n',
    sql_setup:
      "CREATE TABLE hauls (day TEXT, gold INTEGER);\nINSERT INTO hauls VALUES\n ('2024-01-05', 100),\n ('2024-01-20', 50),\n ('2024-02-03', 80),\n ('2024-02-28', 20),\n ('2024-03-01', 10);",
    expected_rows: [
      ['2024-01', 150],
      ['2024-02', 100],
      ['2024-03', 10],
    ],
    order_matters: true,
    tests: [],
    hint: "GROUP BY accepts an expression, not just a column: `GROUP BY strftime('%Y-%m', day)` — and the alias you SELECT it under can be reused in ORDER BY.",
    solution:
      "SELECT strftime('%Y-%m', day) AS month, SUM(gold) AS total\nFROM hauls\nGROUP BY month\nORDER BY month;",
    why: 'Time-bucketed aggregation — revenue per month, signups per week — is arguably the single most common production query in existence. The lesson is that GROUP BY can group on a COMPUTED value: you derive the bucket, then aggregate into it, in one statement.',
    insight: "The transferable idea: derive-then-group works for any bucketing (by month, by first letter, by price band) — the group key doesn't have to exist as a column. Note what this query does NOT do: months with no hauls simply don't appear, because GROUP BY can only group rows that exist; producing zero-filled months requires generating a calendar (a recursive CTE) and LEFT JOINing the data onto it — a classic follow-up. Swapping '%Y-%m' for '%Y-%W' gives weekly buckets for free.",
    constraints: [
      'day is always a valid YYYY-MM-DD string',
      'months with no hauls do not appear',
      'Result must be ordered by month',
    ],
    complexity: 'O(n) scan, O(g) space — g months',
  },
  {
    id: 'sql-scrub-names',
    track: 'sql',
    title: 'Scrub the recruitment ledger',
    difficulty: 'easy',
    pattern: 'select-where',
    description:
      "The table `recruits(name)` was filled in by hand: names arrive with stray spaces and random capitalisation, like `'  zoro  '` or `'NAMI '`.\n\nReturn one column `name` with each name **trimmed of surrounding whitespace and fully lowercased**.\n\nOrder the result by the cleaned name, ascending.",
    examples: ["Result column: name — '  ZORO  ' comes back as 'zoro'."],
    function_name: '',
    starter_code: '-- recruits(name TEXT)  -- messy: spaces, mixed case\nSELECT\n',
    sql_setup:
      "CREATE TABLE recruits (name TEXT);\nINSERT INTO recruits VALUES\n ('  zoro  '),\n ('NAMI '),\n (' Usopp');",
    expected_rows: [['nami'], ['usopp'], ['zoro']],
    order_matters: true,
    tests: [],
    hint: 'Compose the string functions: `LOWER(TRIM(name))`. Give it an alias and ORDER BY the alias — the sort must see the CLEANED value, or the stray spaces decide the order.',
    solution: 'SELECT LOWER(TRIM(name)) AS name\nFROM recruits\nORDER BY name;',
    why: "Hand-entered text is never clean, and TRIM/LOWER/UPPER are the sanitation crew of SQL — the step before any comparison, join or dedup on strings can be trusted. The subtle test here is the ORDER BY: sort the RAW column and ' Usopp' leads because a space sorts before every letter.",
    insight: "The go-deeper idea: an alias defined in SELECT is visible to ORDER BY (it runs last), so `ORDER BY name` sorts the cleaned value — one of the few places SQL lets you reference a computed name. Cleanup at query time is also a band-aid worth recognizing as one: real systems normalize on WRITE, or the same LOWER(TRIM(...)) wrapper has to appear in every WHERE and JOIN that touches the column, killing index use as it goes.",
    constraints: [
      'names differ only in spacing and case, never in spelling',
      'Result must be ordered by the cleaned name',
    ],
    complexity: 'O(n log n) — clean each row, then sort',
  },
  {
    id: 'sql-badge-labels',
    track: 'sql',
    title: 'Print the tournament badges',
    difficulty: 'medium',
    pattern: 'select-where',
    description:
      "The table `fighters(name, dojo)` stores lowercase names.\n\nEach badge shows the fighter's **uppercased first initial**, a dot and space, then their dojo: `zoro` of `shimotsuki` gets the badge `Z. shimotsuki`.\n\nReturn `name` and `badge`, ordered by `name` ascending.",
    examples: ["Result columns: name, badge — ('zoro', 'shimotsuki') -> 'Z. shimotsuki'."],
    function_name: '',
    starter_code: '-- fighters(name TEXT, dojo TEXT)  -- names are lowercase\nSELECT\n',
    sql_setup:
      "CREATE TABLE fighters (name TEXT, dojo TEXT);\nINSERT INTO fighters VALUES\n ('zoro', 'shimotsuki'),\n ('nami', 'wave'),\n ('sanji', 'baratie');",
    expected_rows: [
      ['nami', 'N. wave'],
      ['sanji', 'S. baratie'],
      ['zoro', 'Z. shimotsuki'],
    ],
    order_matters: true,
    tests: [],
    hint: "Slice, transform, glue: `UPPER(SUBSTR(name, 1, 1))` takes the capitalised initial, and `||` concatenates the pieces — `... || '. ' || dojo`.",
    solution:
      "SELECT name,\n       UPPER(SUBSTR(name, 1, 1)) || '. ' || dojo AS badge\nFROM fighters\nORDER BY name;",
    why: 'Building display strings in the query — initials, codes, "LAST, First" — is everyday reporting work, and it bundles the three core string tools in one line: SUBSTR to slice, UPPER/LOWER to transform, || to concatenate. Interviewers like it because the pieces are trivial but composing them cleanly is not.',
    insight: "The transferable idea: SQL string functions compose inside-out like any expression language — slice first, transform the slice, then glue. Two portability notes worth owning: `||` is the SQL-standard concatenation operator (SQL Server uses `+`, MySQL needs CONCAT()), and SUBSTR counts from 1, not 0 — `SUBSTR(name, 1, 1)` is the FIRST character; an off-by-one here silently produces the second letter, and no error will tell you.",
    constraints: [
      'names are lowercase and at least 1 character long',
      'the badge format is exactly: initial, dot, space, dojo',
      'Result must be ordered by name',
    ],
    complexity: 'O(n) — constant string work per row',
  },
  {
    id: 'sql-dojo-roster',
    track: 'sql',
    title: 'One roster line per dojo',
    difficulty: 'hard',
    pattern: 'group-by',
    description:
      "The table `members(dojo, name)` lists students, one per row.\n\nReturn `dojo` and `roster` — every member's name on **one line**, joined by `', '` (comma space), with the names in **alphabetical order** inside each roster.\n\nOrder the result by `dojo` ascending.",
    examples: ["Result columns: dojo, roster — e.g. ('shimotsuki', 'johnny, kuina, zoro')."],
    function_name: '',
    starter_code: '-- members(dojo TEXT, name TEXT)\nSELECT\n',
    sql_setup:
      "CREATE TABLE members (dojo TEXT, name TEXT);\nINSERT INTO members VALUES\n ('shimotsuki', 'zoro'),\n ('shimotsuki', 'kuina'),\n ('wave', 'nami'),\n ('shimotsuki', 'johnny');",
    expected_rows: [
      ['shimotsuki', 'johnny, kuina, zoro'],
      ['wave', 'nami'],
    ],
    order_matters: true,
    tests: [],
    hint: "GROUP_CONCAT(name, ', ') collapses a group into one string — but its order follows the rows it receives. Feed it from an ordered subquery: `FROM (SELECT * FROM members ORDER BY dojo, name)`.",
    solution:
      "SELECT dojo, GROUP_CONCAT(name, ', ') AS roster\nFROM (SELECT * FROM members ORDER BY dojo, name)\nGROUP BY dojo\nORDER BY dojo;",
    why: 'Rows-to-string aggregation ("all tags on one line", "the emails of every attendee") is the report-formatting move that regular aggregates cannot do — SUM and COUNT return numbers, this returns the group itself, flattened. The hard part everyone misses: making the order inside the string deterministic.',
    insight: "The go-deeper idea: string aggregation exists everywhere under different names — GROUP_CONCAT (SQLite/MySQL), STRING_AGG (Postgres/SQL Server), LISTAGG (Oracle) — and the ordering story is the portability trap. Standard SQL puts it inline (`STRING_AGG(name, ', ' ORDER BY name)`); SQLite's GROUP_CONCAT accepts no ORDER BY, so you pre-sort the rows in a subquery and rely on the group seeing them in that order. When a value might repeat inside a group, DISTINCT inside the aggregate dedupes before joining.",
    constraints: [
      '(dojo, name) pairs are unique',
      "names inside a roster are alphabetical, joined by ', '",
      'Result must be ordered by dojo',
    ],
    complexity: 'O(n log n) — sort, then one concatenating pass',
  },
];
