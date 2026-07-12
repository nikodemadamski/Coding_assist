export const PANDAS_QUESTIONS_4 = [
  {
    id: 'pd-parse-dates',
    track: 'pandas',
    title: 'Real dates out of date strings',
    difficulty: 'easy',
    pattern: 'transform',
    description:
      'The ledger `df` has columns `name` and `joined`, where `joined` is a **string** like `"2020-03-09"`.\n\nReturn the DataFrame with two new integer columns derived from it: `year` and `month`. Keep the original row order and both original columns, so the result has columns `name, joined, year, month` in that order.',
    examples: [
      'parse_dates(df) for joined "2020-03-09"  ->  year 2020, month 3',
    ],
    function_name: 'parse_dates',
    starter_code:
      'import pandas as pd\n\ndef parse_dates(df):\n    # add integer year and month columns from the joined string\n    \n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', joined: '2020-03-09' },
              { name: 'Nami', joined: '2020-11-21' },
            ],
          },
        ],
        expected: [
          { name: 'Zoro', joined: '2020-03-09', year: 2020, month: 3 },
          { name: 'Nami', joined: '2020-11-21', year: 2020, month: 11 },
        ],
      },
      {
        args: [
          {
            __df__: [{ name: 'Robin', joined: '1999-12-31' }],
          },
        ],
        expected: [{ name: 'Robin', joined: '1999-12-31', year: 1999, month: 12 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Franky', joined: '2021-01-01' },
              { name: 'Brook', joined: '2021-06-15' },
              { name: 'Jinbe', joined: '2022-02-02' },
            ],
          },
        ],
        expected: [
          { name: 'Franky', joined: '2021-01-01', year: 2021, month: 1 },
          { name: 'Brook', joined: '2021-06-15', year: 2021, month: 6 },
          { name: 'Jinbe', joined: '2022-02-02', year: 2022, month: 2 },
        ],
      },
    ],
    hint: "Parse once, then pick pieces: `d = pd.to_datetime(df['joined'])`, then `d.dt.year` and `d.dt.month` are integer Series ready to assign as columns.",
    solution:
      "import pandas as pd\n\ndef parse_dates(df):\n    out = df.copy()\n    d = pd.to_datetime(out['joined'])\n    out['year'] = d.dt.year\n    out['month'] = d.dt.month\n    return out\n",
    why: 'Dates arrive as strings — from CSVs, APIs, logs — and every time-based analysis starts by parsing them into real datetimes. The `.dt` accessor is to dates what `.str` is to text: the vectorized gateway to every component (year, month, weekday, quarter) without a Python loop.',
    insight: 'The transferable idea: parse ONCE into a variable, then derive many columns from it — calling `pd.to_datetime` per component re-parses the whole column each time. `to_datetime` is also forgiving by default (it sniffs many formats), which is convenient and slow; passing `format="%Y-%m-%d"` makes it strict AND an order of magnitude faster on big data. Once parsed, comparisons, sorting and arithmetic all become calendar-aware for free.',
    constraints: [
      'joined is always a valid YYYY-MM-DD string',
      'year and month must be integers, not strings',
      'keep the original row order; column order: name, joined, year, month',
    ],
    complexity: 'O(n) — one parse pass, two component reads',
  },
  {
    id: 'pd-filter-daterange',
    track: 'pandas',
    title: 'Hauls inside the window',
    difficulty: 'medium',
    pattern: 'filtering',
    description:
      'The log `df` has columns `day` (a `YYYY-MM-DD` string) and `gold`. You are given `start` and `end`, two date strings.\n\nReturn only the rows whose `day` falls **between `start` and `end` inclusive**, keeping the original row order and both columns, index reset.\n\nCareful: comparing the raw strings happens to work for same-length ISO dates, but your solution should compare **real dates**, so it survives mixed formats.',
    examples: [
      'in_window(df, "2024-02-01", "2024-02-29")  ->  only the February rows',
    ],
    function_name: 'in_window',
    starter_code:
      'import pandas as pd\n\ndef in_window(df, start, end):\n    # rows whose day is between start and end, inclusive\n    \n',
    tests: [
      {
        args: [
          {
            __df__: [
              { day: '2024-01-30', gold: 10 },
              { day: '2024-02-01', gold: 20 },
              { day: '2024-02-15', gold: 30 },
              { day: '2024-02-29', gold: 40 },
              { day: '2024-03-01', gold: 50 },
            ],
          },
          '2024-02-01',
          '2024-02-29',
        ],
        expected: [
          { day: '2024-02-01', gold: 20 },
          { day: '2024-02-15', gold: 30 },
          { day: '2024-02-29', gold: 40 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { day: '2023-06-10', gold: 5 },
              { day: '2023-07-10', gold: 7 },
            ],
          },
          '2023-01-01',
          '2023-12-31',
        ],
        expected: [
          { day: '2023-06-10', gold: 5 },
          { day: '2023-07-10', gold: 7 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { day: '2024-05-01', gold: 9 },
              { day: '2024-05-02', gold: 11 },
            ],
          },
          '2024-06-01',
          '2024-06-30',
        ],
        expected: [],
      },
    ],
    hint: "Parse the column, then mask: `d = pd.to_datetime(df['day'])`, and `(d >= start) & (d <= end)` — pandas parses the comparison strings for you. `d.between(start, end)` says the same thing in one call.",
    solution:
      "import pandas as pd\n\ndef in_window(df, start, end):\n    d = pd.to_datetime(df['day'])\n    mask = (d >= start) & (d <= end)\n    return df[mask].reset_index(drop=True)\n",
    why: '"Just the rows from last quarter" is the opening move of nearly every analysis, and it is where date-as-string bugs live: string comparison sorts "2024-1-5" after "2024-01-31". Filtering on parsed datetimes is the habit that makes the window correct regardless of how the dates were written.',
    insight: 'The go-deeper idea: a parsed datetime Series compares directly against date STRINGS — pandas coerces the scalar side — so the mask reads naturally without wrapping start/end yourself. Note the inclusivity contract: `between` defaults to both ends inclusive, and an explicit `>= / <=` pair says it loudest. The heavy-duty version of this move is a DatetimeIndex, where `df.loc["2024-02"]` selects the whole month by label.',
    constraints: [
      'day strings are valid dates; start ≤ end',
      'both boundary days are included',
      'keep original row order, index reset',
    ],
    complexity: 'O(n) — one parse, one vectorized mask',
  },
  {
    id: 'pd-monthly-agg',
    track: 'pandas',
    title: 'Monthly gold, pandas edition',
    difficulty: 'medium',
    pattern: 'groupby',
    description:
      'The log `df` has columns `day` (a `YYYY-MM-DD` string) and `gold` — many rows per month, unordered.\n\nReturn a DataFrame with columns `month` (a `YYYY-MM` string) and `total` — the total gold per month — sorted by `month` ascending, index reset.\n\n(You built this exact report in SQL. Same shape, other language.)',
    examples: ['monthly_gold(df)  ->  one row per month: {month: "2024-01", total: 150}'],
    function_name: 'monthly_gold',
    starter_code:
      'import pandas as pd\n\ndef monthly_gold(df):\n    # total gold per YYYY-MM month\n    \n',
    tests: [
      {
        args: [
          {
            __df__: [
              { day: '2024-01-05', gold: 100 },
              { day: '2024-02-03', gold: 80 },
              { day: '2024-01-20', gold: 50 },
              { day: '2024-03-01', gold: 10 },
              { day: '2024-02-28', gold: 20 },
            ],
          },
        ],
        expected: [
          { month: '2024-01', total: 150 },
          { month: '2024-02', total: 100 },
          { month: '2024-03', total: 10 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { day: '2023-12-31', gold: 7 },
              { day: '2024-01-01', gold: 3 },
            ],
          },
        ],
        expected: [
          { month: '2023-12', total: 7 },
          { month: '2024-01', total: 3 },
        ],
      },
      {
        args: [
          {
            __df__: [{ day: '2024-06-06', gold: 42 }],
          },
        ],
        expected: [{ month: '2024-06', total: 42 }],
      },
    ],
    hint: "Derive the bucket, then group by it: `df['day'].str[:7]` (or `pd.to_datetime(df['day']).dt.strftime('%Y-%m')`) gives the month key; groupby it with `as_index=False` and sum.",
    solution:
      "import pandas as pd\n\ndef monthly_gold(df):\n    out = df.copy()\n    out['month'] = pd.to_datetime(out['day']).dt.strftime('%Y-%m')\n    g = out.groupby('month', as_index=False)['gold'].sum()\n    g = g.rename(columns={'gold': 'total'})\n    return g.sort_values('month').reset_index(drop=True)\n",
    why: 'Time-bucketed aggregation is the most common production report in both SQL and pandas, and doing it in both languages back-to-back is deliberately instructive: the derive-a-bucket-then-group shape is identical, only the spelling changes. Data interviews love asking for exactly this translation.',
    insight: 'The transferable idea: any groupby key can be DERIVED — you are never limited to existing columns. Three spellings of the same month bucket, in increasing power: a string slice (fast, format-fragile), `dt.strftime` (explicit), and `dt.to_period("M")` (a real period type that sorts, compares and does arithmetic). The industrial-strength version sets a DatetimeIndex and uses `resample("MS")`, which can also EMIT empty months — something groupby, like SQL GROUP BY, cannot do.',
    constraints: [
      'day is always a valid YYYY-MM-DD string',
      'months with no rows do not appear',
      'result sorted by month, index reset; columns: month, total',
    ],
    complexity: 'O(n) to bucket and group; O(g log g) to sort the months',
  },
  {
    id: 'pd-weekday-average',
    track: 'pandas',
    title: 'Which weekday pays best?',
    difficulty: 'hard',
    pattern: 'groupby',
    description:
      'The log `df` has columns `day` (a `YYYY-MM-DD` string) and `gold`.\n\nReturn a DataFrame with columns `weekday` (the English day name, e.g. `Monday`) and `avg_gold` — the average gold across all rows falling on that weekday.\n\nOrder the rows **Monday first through Sunday last** (only weekdays that appear in the data), index reset. Alphabetical order (Friday, Monday, …) is wrong.',
    examples: [
      'weekday_gold(df)  ->  [{weekday: "Monday", avg_gold: 75}, {weekday: "Friday", avg_gold: 30}]',
    ],
    function_name: 'weekday_gold',
    starter_code:
      'import pandas as pd\n\ndef weekday_gold(df):\n    # avg gold per weekday name, Monday-first order\n    \n',
    tests: [
      {
        args: [
          {
            __df__: [
              { day: '2024-01-01', gold: 100 },
              { day: '2024-01-08', gold: 50 },
              { day: '2024-01-05', gold: 30 },
            ],
          },
        ],
        expected: [
          { weekday: 'Monday', avg_gold: 75 },
          { weekday: 'Friday', avg_gold: 30 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { day: '2024-01-07', gold: 10 },
              { day: '2024-01-06', gold: 20 },
              { day: '2024-01-03', gold: 40 },
            ],
          },
        ],
        expected: [
          { weekday: 'Wednesday', avg_gold: 40 },
          { weekday: 'Saturday', avg_gold: 20 },
          { weekday: 'Sunday', avg_gold: 10 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { day: '2024-01-02', gold: 8 },
              { day: '2024-01-09', gold: 12 },
            ],
          },
        ],
        expected: [{ weekday: 'Tuesday', avg_gold: 10 }],
      },
    ],
    hint: "Group by TWO derived keys: the weekday number (`d.dt.dayofweek`, Monday=0) for ordering, and the name (`d.dt.day_name()`) for display. Sort by the number, then keep only the name and the mean.",
    solution:
      "import pandas as pd\n\ndef weekday_gold(df):\n    d = pd.to_datetime(df['day'])\n    out = df.assign(wd=d.dt.dayofweek, weekday=d.dt.day_name())\n    g = out.groupby(['wd', 'weekday'], as_index=False)['gold'].mean()\n    g = g.rename(columns={'gold': 'avg_gold'}).sort_values('wd')\n    return g[['weekday', 'avg_gold']].reset_index(drop=True)\n",
    why: 'Weekday seasonality — do weekends outperform weekdays? — is a staple analytics question, and it smuggles in a subtle problem: weekday NAMES do not sort (Friday < Monday alphabetically). The standard fix, carrying a numeric sort key alongside the display label, is a pattern you will reuse for month names, size labels, and every other ordered category.',
    insight: 'The go-deeper idea: group by BOTH the sort key and the label — they are one-to-one, so the groups are identical, but the number survives into the result for sorting and then quietly drops out of the selection. The categorical alternative (`pd.Categorical(names, categories=[...], ordered=True)`) bakes the order into the dtype itself, which is the cleaner tool when the labels live on long past one query. `dayofweek` counting Monday=0 (ISO) while some systems count Sunday=0 is a real-world off-by-one to keep in your head.',
    constraints: [
      'day is always a valid YYYY-MM-DD string',
      'only weekdays present in the data appear',
      'rows ordered Monday → Sunday; columns: weekday, avg_gold',
    ],
    complexity: 'O(n) to derive and group; the weekday sort is O(7 log 7)',
  },
  {
    id: 'pd-scrub-names',
    track: 'pandas',
    title: 'Scrub the ledger, pandas edition',
    difficulty: 'easy',
    pattern: 'transform',
    description:
      'The ledger `df` has one column `name`, hand-entered: stray surrounding spaces and random capitalisation, like `"  ZORO  "` or `"Nami "`.\n\nReturn the DataFrame with `name` **trimmed and fully lowercased**, keeping the original row order.',
    examples: ['scrub_names(df): "  ZORO  "  ->  "zoro"'],
    function_name: 'scrub_names',
    starter_code:
      'import pandas as pd\n\ndef scrub_names(df):\n    # trim surrounding spaces, lowercase every name\n    \n',
    tests: [
      {
        args: [
          {
            __df__: [{ name: '  ZORO  ' }, { name: 'Nami ' }, { name: ' usopp' }],
          },
        ],
        expected: [{ name: 'zoro' }, { name: 'nami' }, { name: 'usopp' }],
      },
      {
        args: [
          {
            __df__: [{ name: 'SANJI' }],
          },
        ],
        expected: [{ name: 'sanji' }],
      },
      {
        args: [
          {
            __df__: [{ name: '  Tony Tony Chopper ' }, { name: 'ROBIN' }],
          },
        ],
        expected: [{ name: 'tony tony chopper' }, { name: 'robin' }],
      },
    ],
    hint: "Chain the vectorized string methods: `df['name'].str.strip().str.lower()` — each `.str` call returns a new Series ready for the next.",
    solution:
      "import pandas as pd\n\ndef scrub_names(df):\n    out = df.copy()\n    out['name'] = out['name'].str.strip().str.lower()\n    return out\n",
    why: 'This is the pandas mirror of the SQL scrub you just wrote, and the same truth applies: no string comparison, join, or dedup can be trusted before normalization. `.str` chains are how the cleanup stays vectorized — a loop calling `.strip()` per value is the same logic at a hundredth the speed.',
    insight: 'The transferable idea: `.str` methods chain because each returns a Series — strip → lower → replace reads like a pipeline. Only surrounding whitespace goes ("tony tony chopper" keeps its inner spaces); collapsing inner runs needs a regex replace. And the reason both this and the SQL version exist as questions: normalize-on-read is a band-aid — production systems scrub on WRITE, once, and every query downstream stops needing the wrapper.',
    constraints: [
      'names differ only in spacing and case',
      'inner spaces are preserved — only surrounding whitespace is removed',
      'keep the original row order',
    ],
    complexity: 'O(n) — two vectorized string passes',
  },
  {
    id: 'pd-split-column',
    track: 'pandas',
    title: 'Split the chart codes',
    difficulty: 'medium',
    pattern: 'transform',
    description:
      'The chart `df` has one column `code` holding strings like `"east-Drum"` — a sea, a dash, then an island name.\n\nReturn a DataFrame with three columns — the original `code`, plus new `sea` and `island` columns split out of it — keeping the original row order.\n\nIsland names can themselves contain dashes (`"grand-Water-7"` is sea `grand`, island `Water-7`): split on the **first** dash only.',
    examples: [
      'split_codes(df): "east-Drum"  ->  sea "east", island "Drum"',
      '"grand-Water-7"  ->  sea "grand", island "Water-7"',
    ],
    function_name: 'split_codes',
    starter_code:
      'import pandas as pd\n\ndef split_codes(df):\n    # code "sea-Island" -> columns code, sea, island (first dash only)\n    \n',
    tests: [
      {
        args: [
          {
            __df__: [{ code: 'east-Drum' }, { code: 'east-Baratie' }, { code: 'grand-Alabasta' }],
          },
        ],
        expected: [
          { code: 'east-Drum', sea: 'east', island: 'Drum' },
          { code: 'east-Baratie', sea: 'east', island: 'Baratie' },
          { code: 'grand-Alabasta', sea: 'grand', island: 'Alabasta' },
        ],
      },
      {
        args: [
          {
            __df__: [{ code: 'grand-Water-7' }],
          },
        ],
        expected: [{ code: 'grand-Water-7', sea: 'grand', island: 'Water-7' }],
      },
      {
        args: [
          {
            __df__: [{ code: 'west-Zou' }, { code: 'grand-Sabaody-Archipelago' }],
          },
        ],
        expected: [
          { code: 'west-Zou', sea: 'west', island: 'Zou' },
          { code: 'grand-Sabaody-Archipelago', sea: 'grand', island: 'Sabaody-Archipelago' },
        ],
      },
    ],
    hint: "`df['code'].str.split('-', n=1, expand=True)` returns a two-column frame — `n=1` stops after the first dash, `expand=True` turns the lists into columns you can assign: `out[['sea', 'island']] = ...`.",
    solution:
      "import pandas as pd\n\ndef split_codes(df):\n    out = df.copy()\n    out[['sea', 'island']] = out['code'].str.split('-', n=1, expand=True)\n    return out\n",
    why: 'Compound identifiers — "region-product", "2024-Q1", "user:session" — are everywhere, and splitting them into real columns is the step that makes them groupable and joinable. The n=1 detail is the interview signal: naive splitting silently shreds every value whose right side contains the separator.',
    insight: "The transferable idea: `expand=True` is the bridge from a Series of lists (awkward) to real columns (useful), and multi-column assignment `out[['sea', 'island']] = ...` lands both at once. `n=1` encodes a data CONTRACT — the first dash is structural, the rest is content; `rsplit` exists for when the LAST separator is the structural one. For patterns messier than one clean separator, `.str.extract(r'regex with (groups)')` is the same move with capture groups.",
    constraints: [
      'every code contains at least one dash',
      'split on the first dash only — islands may contain dashes',
      'keep original row order; columns: code, sea, island',
    ],
    complexity: 'O(n) — one vectorized split pass',
  },
];
