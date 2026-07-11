export const PANDAS_QUESTIONS_3 = [
  {
    id: 'pd-rename-cast',
    track: 'pandas',
    title: 'Clean up a messy ledger',
    difficulty: 'easy',
    pattern: 'selection',
    description:
      'A ledger arrived from another dojo with ugly column names and text where numbers should be: `df` has columns `Name` (string) and `Bounty` (a **string** like `"3000"`).\n\nReturn a cleaned DataFrame with columns renamed to lowercase `name` and `bounty`, the `bounty` column **cast to integers**, and only those two columns, in that order. Keep the original row order.',
    examples: [
      "clean_ledger(df) for columns Name/Bounty with Bounty '3000'  ->  name/bounty with bounty 3000 (int)",
    ],
    function_name: 'clean_ledger',
    starter_code:
      'import pandas as pd\n\ndef clean_ledger(df):\n    # rename Name->name, Bounty->bounty; cast bounty to int\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { Name: 'Luffy', Bounty: '3000' },
              { Name: 'Zoro', Bounty: '1111' },
            ],
          },
        ],
        expected: [
          { name: 'Luffy', bounty: 3000 },
          { name: 'Zoro', bounty: 1111 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { Name: 'Chopper', Bounty: '1' },
            ],
          },
        ],
        expected: [{ name: 'Chopper', bounty: 1 }],
      },
      {
        args: [
          {
            __df__: [
              { Name: 'Nami', Bounty: '366' },
              { Name: 'Robin', Bounty: '930' },
              { Name: 'Franky', Bounty: '394' },
            ],
          },
        ],
        expected: [
          { name: 'Nami', bounty: 366 },
          { name: 'Robin', bounty: 930 },
          { name: 'Franky', bounty: 394 },
        ],
      },
    ],
    hint: "Chain the three cleanups: `df.rename(columns={'Name': 'name', 'Bounty': 'bounty'})`, then `.astype({'bounty': int})` (or assign `out['bounty'] = out['bounty'].astype(int)`), then select `[['name', 'bounty']]`.",
    solution:
      "import pandas as pd\n\ndef clean_ledger(df):\n    out = df.rename(columns={'Name': 'name', 'Bounty': 'bounty'})\n    out = out.astype({'bounty': int})\n    return out[['name', 'bounty']]\n",
    why: 'Real data never arrives clean — the rename/cast/select trio is the first thing you type in almost every pandas task, and interviewers use it to check you know dtypes are a property you must manage, not something pandas guesses right. A "numeric" column that is secretly strings breaks sorting, math and joins in silent, maddening ways.',
    insight: 'The transferable idea: `astype` is the explicit dtype contract — `astype({"bounty": int})` documents exactly which column changes, and raises immediately on a value like `"3,000"` instead of producing garbage downstream (for forgiving parsing you would reach for `pd.to_numeric(..., errors="coerce")` and then decide what to do with the NaNs). Note the double brackets in `out[["name", "bounty"]]`: a list selects a DataFrame and fixes column order; single brackets would give a Series.',
    constraints: [
      'Bounty strings are always clean digit strings',
      'keep the original row order',
      'return exactly the columns name, bounty in that order',
    ],
    complexity: 'O(n) — one cast pass over the column',
  },
  {
    id: 'pd-melt-long',
    track: 'pandas',
    title: 'Stat sheet to long format',
    difficulty: 'medium',
    pattern: 'transform',
    description:
      'The stat sheet `df` is **wide**: one row per fighter with columns `name`, `strength`, `speed`.\n\nReshape it to **long** format: one row per (fighter, stat) pair, with columns `name`, `stat`, `value`.\n\nSort the result by `name` ascending, then `stat` ascending, and reset the index.\n\nWide→long is `melt`: the id column stays put, every other column becomes a (column-name, cell-value) row pair.',
    examples: [
      'to_long(df) for 2 fighters × 2 stats  ->  4 rows: name, stat, value',
    ],
    function_name: 'to_long',
    starter_code:
      'import pandas as pd\n\ndef to_long(df):\n    # wide (name, strength, speed) -> long (name, stat, value)\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', strength: 90, speed: 70 },
              { name: 'Sanji', strength: 75, speed: 88 },
            ],
          },
        ],
        expected: [
          { name: 'Sanji', stat: 'speed', value: 88 },
          { name: 'Sanji', stat: 'strength', value: 75 },
          { name: 'Zoro', stat: 'speed', value: 70 },
          { name: 'Zoro', stat: 'strength', value: 90 },
        ],
      },
      {
        args: [
          {
            __df__: [{ name: 'Luffy', strength: 95, speed: 92 }],
          },
        ],
        expected: [
          { name: 'Luffy', stat: 'speed', value: 92 },
          { name: 'Luffy', stat: 'strength', value: 95 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Usopp', strength: 30, speed: 55 },
              { name: 'Brook', strength: 60, speed: 85 },
              { name: 'Jinbe', strength: 88, speed: 40 },
            ],
          },
        ],
        expected: [
          { name: 'Brook', stat: 'speed', value: 85 },
          { name: 'Brook', stat: 'strength', value: 60 },
          { name: 'Jinbe', stat: 'speed', value: 40 },
          { name: 'Jinbe', stat: 'strength', value: 88 },
          { name: 'Usopp', stat: 'speed', value: 55 },
          { name: 'Usopp', stat: 'strength', value: 30 },
        ],
      },
    ],
    hint: "`df.melt(id_vars='name', var_name='stat', value_name='value')` does the reshape; then `.sort_values(['name', 'stat']).reset_index(drop=True)` pins the required order.",
    solution:
      "import pandas as pd\n\ndef to_long(df):\n    out = df.melt(id_vars='name', var_name='stat', value_name='value')\n    return out.sort_values(['name', 'stat']).reset_index(drop=True)\n",
    why: 'Melt is half of the reshaping vocabulary (pivot is the other half), and the long format it produces is what groupby, plotting libraries and databases all want. Interviewers use it to check you think of column names as *data that is trapped in the schema* — melt frees it into rows.',
    insight: 'The go-deeper idea: wide and long are the same information in two shapes, and the pair melt ⇄ pivot converts between them losslessly (as long as the id/index columns identify rows uniquely). Everything not listed in `id_vars` gets stacked — with many stat columns you would melt them all in one call, or pass `value_vars` to pick a subset. The naming matters more than it looks: downstream `groupby("stat")["value"].mean()` reads like English precisely because you chose var_name/value_name well.',
    constraints: [
      'exactly the columns name, strength, speed appear in the input',
      'result sorted by name, then stat, index reset',
      'stat values are the former column names as strings',
    ],
    complexity: 'O(n·k) — n rows unstacked across k stat columns, plus the sort',
  },
  {
    id: 'pd-rolling-mean',
    track: 'pandas',
    title: 'Three-day rolling gold, pandas edition',
    difficulty: 'medium',
    pattern: 'transform',
    description:
      'The log `df` has columns `day` and `gold`, one row per day (rows may arrive **out of day order**).\n\nReturn the DataFrame sorted by `day` with a new column `avg3`: the average of that day and the two days before it. The first two days average whatever exists so far — day 1 averages just itself, never NaN.\n\nReset the index. `rolling(3)` gives the window; the trap is what it does to the first two rows.',
    examples: [
      'rolling_gold(df) for gold 90,30,60 by day  ->  avg3 90,60,60',
    ],
    function_name: 'rolling_gold',
    starter_code:
      'import pandas as pd\n\ndef rolling_gold(df):\n    # sort by day, add avg3 = mean of this day and the 2 before\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { day: 1, gold: 90 },
              { day: 2, gold: 30 },
              { day: 3, gold: 60 },
              { day: 4, gold: 120 },
              { day: 5, gold: 30 },
            ],
          },
        ],
        expected: [
          { day: 1, gold: 90, avg3: 90 },
          { day: 2, gold: 30, avg3: 60 },
          { day: 3, gold: 60, avg3: 60 },
          { day: 4, gold: 120, avg3: 70 },
          { day: 5, gold: 30, avg3: 70 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { day: 2, gold: 40 },
              { day: 1, gold: 80 },
            ],
          },
        ],
        expected: [
          { day: 1, gold: 80, avg3: 80 },
          { day: 2, gold: 40, avg3: 60 },
        ],
      },
      {
        args: [
          {
            __df__: [{ day: 1, gold: 55 }],
          },
        ],
        expected: [{ day: 1, gold: 55, avg3: 55 }],
      },
    ],
    hint: "Sort first — rolling windows follow row order, not the day column. Then `out['avg3'] = out['gold'].rolling(3, min_periods=1).mean()`; without `min_periods=1` the first two rows are NaN.",
    solution:
      "import pandas as pd\n\ndef rolling_gold(df):\n    out = df.sort_values('day').reset_index(drop=True)\n    out['avg3'] = out['gold'].rolling(3, min_periods=1).mean()\n    return out\n",
    why: 'Rolling windows are the pandas mirror of SQL’s frame clause, and this question carries the two classic traps in one line: rolling follows **physical row order** (unsorted input silently averages the wrong neighbours), and the default `min_periods` equals the window size, so the first rows come back NaN unless you say otherwise.',
    insight: 'The transferable idea: `.rolling(k)` is a whole family — swap `.mean()` for `.sum()`, `.max()` or `.std()` and the window logic stays identical, and `min_periods` is the explicit answer to "what should incomplete windows do?" (SQL frames clip automatically; pandas makes you choose between NaN and partial averages). For time-indexed data there is a stronger form, `rolling("3D")` on a DatetimeIndex, which windows by *calendar span* and handles gaps that row-count windows cannot.',
    constraints: [
      'days are unique but may arrive unsorted',
      'the first two rows average only the rows that exist — never NaN',
      'result sorted by day, index reset',
    ],
    complexity: 'O(n log n) for the sort; the rolling pass is O(n)',
  },
  {
    id: 'pd-group-cumsum',
    track: 'pandas',
    title: 'Running gold per crew',
    difficulty: 'medium',
    pattern: 'groupby',
    description:
      'The log `df` has columns `crew`, `day`, `gold` — one row per crew per day, possibly unsorted.\n\nReturn the DataFrame sorted by `crew` then `day`, with a new column `total_so_far`: the **running total** of that crew’s gold up to and including that day. Each crew’s tally starts fresh.\n\nReset the index. This is the pandas spelling of the SQL running total you wrote with `SUM(...) OVER (PARTITION BY ...)` — here the partition is a `groupby` and the frame is `cumsum`.',
    examples: [
      'running_gold(df): strawhat 100,50  ->  total_so_far 100,150',
    ],
    function_name: 'running_gold',
    starter_code:
      'import pandas as pd\n\ndef running_gold(df):\n    # sort by crew+day, add per-crew cumulative gold\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { crew: 'strawhat', day: 1, gold: 100 },
              { crew: 'strawhat', day: 2, gold: 50 },
              { crew: 'strawhat', day: 3, gold: 200 },
              { crew: 'heart', day: 1, gold: 80 },
              { crew: 'heart', day: 2, gold: 120 },
            ],
          },
        ],
        expected: [
          { crew: 'heart', day: 1, gold: 80, total_so_far: 80 },
          { crew: 'heart', day: 2, gold: 120, total_so_far: 200 },
          { crew: 'strawhat', day: 1, gold: 100, total_so_far: 100 },
          { crew: 'strawhat', day: 2, gold: 50, total_so_far: 150 },
          { crew: 'strawhat', day: 3, gold: 200, total_so_far: 350 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { crew: 'kid', day: 2, gold: 30 },
              { crew: 'kid', day: 1, gold: 70 },
            ],
          },
        ],
        expected: [
          { crew: 'kid', day: 1, gold: 70, total_so_far: 70 },
          { crew: 'kid', day: 2, gold: 30, total_so_far: 100 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { crew: 'buggy', day: 1, gold: 5 },
              { crew: 'alvida', day: 1, gold: 9 },
            ],
          },
        ],
        expected: [
          { crew: 'alvida', day: 1, gold: 9, total_so_far: 9 },
          { crew: 'buggy', day: 1, gold: 5, total_so_far: 5 },
        ],
      },
    ],
    hint: "Sort by ['crew', 'day'] and reset the index FIRST — cumsum runs in row order. Then `out['total_so_far'] = out.groupby('crew')['gold'].cumsum()`.",
    solution:
      "import pandas as pd\n\ndef running_gold(df):\n    out = df.sort_values(['crew', 'day']).reset_index(drop=True)\n    out['total_so_far'] = out.groupby('crew')['gold'].cumsum()\n    return out\n",
    why: 'Groupby-cumsum is the workhorse of "balance after each transaction / points through the season" tasks, and it introduces the second face of groupby: **transforms** that return one value per input row instead of collapsing to one row per group. Interviewers love it because the aggregate mindset (`.sum()`) produces the wrong shape entirely.',
    insight: 'The go-deeper idea: groupby operations come in two shapes — *aggregations* (`.sum()`, one row per group) and *transforms* (`.cumsum()`, `.transform("sum")`, same length as the input, index-aligned so you can assign it straight back as a column). This is exactly SQL’s GROUP BY vs window-function split. The order trap is real: cumsum accumulates in current row order and no argument can fix it, so the sort must happen first — and because groupby result alignment works by index, the `reset_index(drop=True)` after sorting keeps the assignment honest.',
    constraints: [
      '(crew, day) pairs are unique; rows may arrive unsorted',
      'each crew’s running total starts fresh',
      'result sorted by crew then day, index reset',
    ],
    complexity: 'O(n log n) for the sort; grouping and cumsum are O(n)',
  },
  {
    id: 'pd-cut-tiers',
    track: 'pandas',
    title: 'Bounty tiers with pd.cut',
    difficulty: 'hard',
    pattern: 'transform',
    description:
      'The ledger `df` has columns `name` and `bounty`.\n\nAdd a column `tier` that bins each bounty: below 100 is `rookie`, from 100 up to (but not including) 1000 is `veteran`, and 1000 or more is `legend`. Return the DataFrame with the new column as **plain strings**, keeping the original row order.\n\nYou could chain conditions by hand — but `pd.cut` is the vectorized tool built exactly for "number → labeled bucket", and it is what this question wants.',
    examples: [
      'bounty_tier(df) for bounties 30, 500, 3000  ->  tiers rookie, veteran, legend',
    ],
    function_name: 'bounty_tier',
    starter_code:
      'import pandas as pd\n\ndef bounty_tier(df):\n    # tier: <100 rookie, 100-999 veteran, >=1000 legend\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Coby', bounty: 30 },
              { name: 'Nami', bounty: 500 },
              { name: 'Luffy', bounty: 3000 },
            ],
          },
        ],
        expected: [
          { name: 'Coby', bounty: 30, tier: 'rookie' },
          { name: 'Nami', bounty: 500, tier: 'veteran' },
          { name: 'Luffy', bounty: 3000, tier: 'legend' },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', bounty: 100 },
              { name: 'Usopp', bounty: 99 },
              { name: 'Law', bounty: 1000 },
            ],
          },
        ],
        expected: [
          { name: 'Zoro', bounty: 100, tier: 'veteran' },
          { name: 'Usopp', bounty: 99, tier: 'rookie' },
          { name: 'Law', bounty: 1000, tier: 'legend' },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Chopper', bounty: 0 },
              { name: 'Buggy', bounty: 999 },
            ],
          },
        ],
        expected: [
          { name: 'Chopper', bounty: 0, tier: 'rookie' },
          { name: 'Buggy', bounty: 999, tier: 'veteran' },
        ],
      },
    ],
    hint: "`pd.cut(out['bounty'], bins=[0, 100, 1000, float('inf')], right=False, labels=['rookie', 'veteran', 'legend'])` — `right=False` makes bins [low, high), so 100 lands in veteran and 1000 in legend. Cast the result with `.astype(str)`.",
    solution:
      "import pandas as pd\n\ndef bounty_tier(df):\n    out = df.copy()\n    out['tier'] = pd.cut(\n        out['bounty'],\n        bins=[0, 100, 1000, float('inf')],\n        right=False,\n        labels=['rookie', 'veteran', 'legend'],\n    ).astype(str)\n    return out\n",
    why: 'Binning continuous values into named buckets (age groups, price bands, score grades) is everywhere in analytics, and `pd.cut` is its vectorized spelling — no loops, no nested np.where. The interview signal is boundary discipline: whether 100 falls in rookie or veteran is decided by one flag, and sloppy boundary handling is how off-by-one bugs ship to dashboards.',
    insight: 'The transferable idea: bins are **edges, one more edge than labels**, and `right=` picks which side is closed — the default `right=True` means (low, high] intervals, which would drop bounty 0 out of every bin entirely (NaN!); `right=False` gives the [low, high) intervals this spec needs. `pd.cut` returns a Categorical, memory-cheap and order-aware (it knows rookie < veteran < legend, so sorting by tier just works) — the `.astype(str)` here is only for a plain-string contract. Cousin worth knowing: `pd.qcut` bins by *quantiles* (equal row counts) instead of fixed edges.',
    constraints: [
      'bounty ≥ 0',
      'boundary values: 100 is veteran, 1000 is legend, 0 is rookie',
      'tier must be plain strings, original row order kept',
    ],
    complexity: 'O(n) — one vectorized binning pass',
  },
  {
    id: 'pd-pivot-grid',
    track: 'pandas',
    title: 'Monthly gold grid',
    difficulty: 'hard',
    pattern: 'groupby',
    description:
      'The log `df` has columns `month`, `region`, `gold` — possibly **several rows** per (month, region) pair, and some pairs missing entirely.\n\nBuild the report grid: one row per `month`, one column per region (`east` and `west`, alphabetical), each cell holding that pair’s **total** gold, with `0` where a pair has no rows.\n\nReturn columns `month`, `east`, `west`, sorted by `month`, index reset. This is long→wide: `pivot_table` with an aggregator and a fill value.',
    examples: [
      'gold_grid(df)  ->  one row per month with east and west totals, 0-filled',
    ],
    function_name: 'gold_grid',
    starter_code:
      'import pandas as pd\n\ndef gold_grid(df):\n    # long (month, region, gold) -> wide (month, east, west), summed, 0-filled\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { month: 1, region: 'east', gold: 60 },
              { month: 1, region: 'east', gold: 40 },
              { month: 1, region: 'west', gold: 80 },
              { month: 2, region: 'west', gold: 50 },
            ],
          },
        ],
        expected: [
          { month: 1, east: 100, west: 80 },
          { month: 2, east: 0, west: 50 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { month: 3, region: 'west', gold: 10 },
              { month: 2, region: 'east', gold: 70 },
              { month: 2, region: 'west', gold: 20 },
              { month: 3, region: 'east', gold: 90 },
            ],
          },
        ],
        expected: [
          { month: 2, east: 70, west: 20 },
          { month: 3, east: 90, west: 10 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { month: 1, region: 'east', gold: 5 },
              { month: 1, region: 'west', gold: 7 },
            ],
          },
        ],
        expected: [{ month: 1, east: 5, west: 7 }],
      },
    ],
    hint: "`df.pivot_table(index='month', columns='region', values='gold', aggfunc='sum', fill_value=0)` builds the grid; then `.reset_index()` turns month back into a column, and setting `out.columns.name = None` drops the leftover 'region' axis label.",
    solution:
      "import pandas as pd\n\ndef gold_grid(df):\n    out = df.pivot_table(\n        index='month', columns='region', values='gold',\n        aggfunc='sum', fill_value=0,\n    ).reset_index()\n    out.columns.name = None\n    return out.sort_values('month').reset_index(drop=True)\n",
    why: 'pivot_table is the report-builder: it is melt run backwards *plus* a groupby, in one call. Interviewers reach for it because it packs three decisions — what identifies a row (index), what fans out into columns, and how duplicates aggregate — and because plain `.pivot()` throws on duplicate pairs, revealing who knows the difference.',
    insight: 'The go-deeper idea: `pivot` is a pure reshape that demands unique (index, columns) pairs; `pivot_table` tolerates duplicates *because* an aggfunc resolves them — it is literally `groupby(index+columns).agg().unstack()`. `fill_value=0` patches the holes the cross-product creates (month 2 east has no rows, yet the grid must show something). The output’s quirks are worth knowing: the former column values become real columns (alphabetical), the columns axis keeps a `name` ("region") that shows up in display until you clear it, and `reset_index()` demotes the index back to an ordinary column — the standard exit move from any pivot.',
    constraints: [
      'every test has both regions present somewhere in the data',
      'missing (month, region) pairs must show 0, not NaN',
      'result columns exactly month, east, west; sorted by month; index reset',
    ],
    complexity: 'O(n log n) — group, unstack and sort',
  },
];
