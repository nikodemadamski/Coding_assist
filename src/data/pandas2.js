export const PANDAS_QUESTIONS_2 = [
  {
    id: 'pd-name-prefix',
    track: 'pandas',
    title: 'Filter by name prefix',
    difficulty: 'easy',
    pattern: 'filtering',
    description:
      'The dojo ledger `df` has columns `name` and `bounty`. Return only the rows where `name` **starts with** the string `prefix` (case-sensitive), keeping the original row order and both columns.\n\nReturn the filtered DataFrame with the index reset. An empty `prefix` matches every row.',
    examples: [
      'name_prefix(df, "Sa") for names [Sanji, Nami, Sabo]  ->  the Sanji and Sabo rows',
      'name_prefix(df, "")  ->  every row, untouched',
    ],
    function_name: 'name_prefix',
    starter_code:
      'import pandas as pd\n\ndef name_prefix(df, prefix):\n    # rows where name starts with prefix, original order\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Sanji', bounty: 330 },
              { name: 'Nami', bounty: 66 },
              { name: 'Sabo', bounty: 602 },
            ],
          },
          'Sa',
        ],
        expected: [
          { name: 'Sanji', bounty: 330 },
          { name: 'Sabo', bounty: 602 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', bounty: 320 },
              { name: 'zeff', bounty: 0 },
            ],
          },
          'Z',
        ],
        expected: [{ name: 'Zoro', bounty: 320 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Luffy', bounty: 1500 },
              { name: 'Chopper', bounty: 1 },
            ],
          },
          'X',
        ],
        expected: [],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Robin', bounty: 130 },
              { name: 'Franky', bounty: 94 },
            ],
          },
          '',
        ],
        expected: [
          { name: 'Robin', bounty: 130 },
          { name: 'Franky', bounty: 94 },
        ],
      },
      {
        args: [{ __df__: [{ name: 'Brook', bounty: 83 }] }, 'Bro'],
        expected: [{ name: 'Brook', bounty: 83 }],
      },
    ],
    hint: 'The `.str` accessor lifts string methods onto a whole column: `df["name"].str.startswith(prefix)` gives a boolean mask. Finish with `.reset_index(drop=True)`.',
    solution:
      'import pandas as pd\n\ndef name_prefix(df, prefix):\n    mask = df["name"].str.startswith(prefix)\n    return df[mask].reset_index(drop=True)\n',
    why: 'Text filtering — pulling out one product line, one log level, one name pattern — is the everyday cleanup move, and pandas can do it across a whole column without a single loop.',
    insight:
      'The `.str` accessor is the bridge between Python string methods and vectorised pandas: anything you would call on one string, `.str` calls on the whole column and hands back a boolean mask you can index with. The reflex to build is "condition on a column → mask → `df[mask]`" — the same shape works for `.str.contains`, numeric comparisons, and `.isin`.',
    constraints: [
      'name is always a string (never missing)',
      'prefix may be the empty string, which matches everything',
      'matching is case-sensitive',
    ],
    complexity: 'O(n) time, O(n) space',
  },
  {
    id: 'pd-sort-two-keys',
    track: 'pandas',
    title: 'Sort by two columns',
    difficulty: 'easy',
    pattern: 'sorting',
    description:
      'The roster `df` has columns `name`, `dojo`, and `power`. Return it sorted by `dojo` **ascending**, and within each dojo by `power` **descending** — the strongest students listed first under each school.\n\nKeep all three columns and reset the index.',
    examples: [
      'rank_roster(df)  ->  dojos in alphabetical order, each dojo strongest-first',
    ],
    function_name: 'rank_roster',
    starter_code:
      'import pandas as pd\n\ndef rank_roster(df):\n    # sort: dojo ascending, then power descending\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', dojo: 'east', power: 96 },
              { name: 'Kuina', dojo: 'west', power: 80 },
              { name: 'Tashigi', dojo: 'east', power: 74 },
              { name: 'Johnny', dojo: 'east', power: 41 },
            ],
          },
        ],
        expected: [
          { name: 'Zoro', dojo: 'east', power: 96 },
          { name: 'Tashigi', dojo: 'east', power: 74 },
          { name: 'Johnny', dojo: 'east', power: 41 },
          { name: 'Kuina', dojo: 'west', power: 80 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'A', dojo: 'd', power: 10 },
              { name: 'B', dojo: 'd', power: 30 },
              { name: 'C', dojo: 'd', power: 20 },
            ],
          },
        ],
        expected: [
          { name: 'B', dojo: 'd', power: 30 },
          { name: 'C', dojo: 'd', power: 20 },
          { name: 'A', dojo: 'd', power: 10 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Nami', dojo: 'sea', power: 66 },
              { name: 'Robin', dojo: 'hana', power: 88 },
            ],
          },
        ],
        expected: [
          { name: 'Robin', dojo: 'hana', power: 88 },
          { name: 'Nami', dojo: 'sea', power: 66 },
        ],
      },
      {
        args: [{ __df__: [{ name: 'Solo', dojo: 'k', power: 50 }] }],
        expected: [{ name: 'Solo', dojo: 'k', power: 50 }],
      },
    ],
    hint: '`sort_values` takes lists: `df.sort_values(["dojo", "power"], ascending=[True, False])` — one direction per key. Then reset the index.',
    solution:
      'import pandas as pd\n\ndef rank_roster(df):\n    out = df.sort_values(["dojo", "power"], ascending=[True, False])\n    return out.reset_index(drop=True)\n',
    why: 'Real sorts are almost never single-key: "by region, then by revenue descending" is the standard report shape. Knowing that `by` and `ascending` both accept lists saves you from clumsy multi-pass sorting.',
    insight:
      'One `sort_values` call with parallel lists replaces what would be a chained, order-fragile pair of sorts. The keys are read left to right — the first column forms the big groups, each later column breaks ties inside them — exactly like `ORDER BY dojo ASC, power DESC` in SQL. Mixed directions live in the `ascending` list, one boolean per key.',
    constraints: [
      'every (dojo, power) pair is unique, so the order is fully determined',
      'power is an integer',
    ],
    complexity: 'O(n log n) time, O(n) space',
  },
  {
    id: 'pd-dojo-report',
    track: 'pandas',
    title: 'Named multi-aggregation',
    difficulty: 'medium',
    pattern: 'groupby',
    description:
      'The roster `df` has columns `name`, `dojo`, and `power`. Build the sensei\'s report: one row per dojo with columns `dojo`, `members` (how many students), and `best` (the highest power), sorted by `dojo` ascending.\n\nUse **named aggregation** — `agg(new_col=("source_col", "func"))` — so the output columns are born with the right names.',
    examples: [
      'dojo_report(df) for east powers [96, 74, 41], west [80]  ->  [{dojo: "east", members: 3, best: 96}, {dojo: "west", members: 1, best: 80}]',
    ],
    function_name: 'dojo_report',
    starter_code:
      'import pandas as pd\n\ndef dojo_report(df):\n    # columns: dojo, members, best — sorted by dojo\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', dojo: 'east', power: 96 },
              { name: 'Tashigi', dojo: 'east', power: 74 },
              { name: 'Kuina', dojo: 'west', power: 80 },
              { name: 'Johnny', dojo: 'east', power: 41 },
            ],
          },
        ],
        expected: [
          { dojo: 'east', members: 3, best: 96 },
          { dojo: 'west', members: 1, best: 80 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'A', dojo: 'k', power: 5 },
              { name: 'B', dojo: 'k', power: 9 },
            ],
          },
        ],
        expected: [{ dojo: 'k', members: 2, best: 9 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'X', dojo: 'a', power: 7 },
              { name: 'Y', dojo: 'c', power: 3 },
              { name: 'Z', dojo: 'b', power: 11 },
            ],
          },
        ],
        expected: [
          { dojo: 'a', members: 1, best: 7 },
          { dojo: 'b', members: 1, best: 11 },
          { dojo: 'c', members: 1, best: 3 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'P', dojo: 'red', power: 50 },
              { name: 'Q', dojo: 'blue', power: 70 },
              { name: 'R', dojo: 'red', power: 60 },
              { name: 'S', dojo: 'red', power: 55 },
            ],
          },
        ],
        expected: [
          { dojo: 'blue', members: 1, best: 70 },
          { dojo: 'red', members: 3, best: 60 },
        ],
      },
    ],
    hint: '`df.groupby("dojo", as_index=False).agg(members=("power", "count"), best=("power", "max"))` builds both columns in one call. Sort by `dojo`, reset the index.',
    solution:
      'import pandas as pd\n\ndef dojo_report(df):\n    out = df.groupby("dojo", as_index=False).agg(\n        members=("power", "count"),\n        best=("power", "max"),\n    )\n    return out.sort_values("dojo").reset_index(drop=True)\n',
    why: 'One aggregate per group is a warm-up; real reports want several at once — count, max, mean — each with a readable column name. Named aggregation is the modern, rename-free way to get there and a very common interview follow-up.',
    insight:
      'The `agg(alias=(column, func))` form does three jobs in one call: it picks the source column, applies the function, and names the result — no MultiIndex columns, no `rename` cleanup afterwards. Each keyword becomes exactly one output column, so the shape of the call *is* the shape of the report. Counting and taking a max are both O(1) per row streamed through the groups.',
    constraints: [
      'every dojo has at least one row',
      'power is an integer with no missing values',
    ],
    complexity: 'O(n log n) time, O(n) space',
  },
  {
    id: 'pd-left-merge-default',
    track: 'pandas',
    title: 'Left merge with a default',
    difficulty: 'medium',
    pattern: 'merge',
    description:
      'You get `fighters` (columns `name`, `weapon_id`) and `weapons` (columns `weapon_id`, `weapon`). Every fighter must appear in the result even if their `weapon_id` matches nothing in the armory — those unarmed fighters get the weapon `"fists"`.\n\nReturn a DataFrame with columns `name` and `weapon`, sorted by `name` ascending, index reset. This is a **left** merge followed by a fill.',
    examples: [
      'arm_the_crew(fighters, weapons)  ->  every fighter with a weapon, "fists" when the armory has no match',
    ],
    function_name: 'arm_the_crew',
    starter_code:
      'import pandas as pd\n\ndef arm_the_crew(fighters, weapons):\n    # left merge on weapon_id, fill missing weapon with "fists"\n    # columns: name, weapon — sorted by name\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', weapon_id: 1 },
              { name: 'Luffy', weapon_id: 9 },
              { name: 'Nami', weapon_id: 2 },
            ],
          },
          {
            __df__: [
              { weapon_id: 1, weapon: 'katana' },
              { weapon_id: 2, weapon: 'staff' },
            ],
          },
        ],
        expected: [
          { name: 'Luffy', weapon: 'fists' },
          { name: 'Nami', weapon: 'staff' },
          { name: 'Zoro', weapon: 'katana' },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Sanji', weapon_id: 4 },
              { name: 'Brook', weapon_id: 3 },
            ],
          },
          {
            __df__: [
              { weapon_id: 3, weapon: 'cane sword' },
              { weapon_id: 4, weapon: 'kicks' },
            ],
          },
        ],
        expected: [
          { name: 'Brook', weapon: 'cane sword' },
          { name: 'Sanji', weapon: 'kicks' },
        ],
      },
      {
        args: [
          { __df__: [{ name: 'Usopp', weapon_id: 7 }] },
          { __df__: [{ weapon_id: 1, weapon: 'katana' }] },
        ],
        expected: [{ name: 'Usopp', weapon: 'fists' }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Robin', weapon_id: 5 },
              { name: 'Franky', weapon_id: 6 },
            ],
          },
          {
            __df__: [
              { weapon_id: 5, weapon: 'hands' },
              { weapon_id: 6, weapon: 'cola cannon' },
              { weapon_id: 8, weapon: 'anchor' },
            ],
          },
        ],
        expected: [
          { name: 'Franky', weapon: 'cola cannon' },
          { name: 'Robin', weapon: 'hands' },
        ],
      },
    ],
    hint: '`fighters.merge(weapons, on="weapon_id", how="left")` keeps every fighter; unmatched rows get NaN in `weapon`, which `.fillna("fists")` repairs. Then select, sort, reset.',
    solution:
      'import pandas as pd\n\ndef arm_the_crew(fighters, weapons):\n    out = fighters.merge(weapons, on="weapon_id", how="left")\n    out["weapon"] = out["weapon"].fillna("fists")\n    out = out[["name", "weapon"]]\n    return out.sort_values("name").reset_index(drop=True)\n',
    why: 'Left join + fill-with-default is the canonical "enrich but never lose rows" recipe — customers without orders, events without labels. Interviewers use it to check you know that an unmatched left row survives as NaN, not that it disappears.',
    insight:
      'The join type decides who survives: `how="left"` guarantees one output row per left row, and the price is NaN in every right-side column that found no partner. That NaN is not dirt — it is *information* ("no match"), and the follow-up move is a deliberate policy: `fillna(default)` here, or `dropna` when unmatched rows should be excluded. Inner join then fill can never recover the lost rows; the order left-then-fill is the whole trick.',
    constraints: [
      'weapon_id values are unique within weapons (no fan-out)',
      'fighter names are unique',
      'weapons may contain ids no fighter uses',
    ],
    complexity: 'O(n log n) time, O(n) space',
  },
  {
    id: 'pd-keep-latest',
    track: 'pandas',
    title: 'Keep the latest reading',
    difficulty: 'medium',
    pattern: 'filtering',
    description:
      'The training log `df` has columns `name`, `day`, and `power` — one row per power reading, and a student may have been measured on several days. Keep only each student\'s **most recent** reading (the row with their highest `day`).\n\nReturn columns `name`, `day`, `power`, sorted by `name` ascending, index reset.',
    examples: [
      'latest_reading(df) with Zoro measured on days 1, 2, 3  ->  only Zoro\'s day-3 row survives',
    ],
    function_name: 'latest_reading',
    starter_code:
      'import pandas as pd\n\ndef latest_reading(df):\n    # one row per name: the reading with the highest day\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', day: 1, power: 90 },
              { name: 'Zoro', day: 3, power: 96 },
              { name: 'Nami', day: 2, power: 66 },
              { name: 'Zoro', day: 2, power: 93 },
              { name: 'Nami', day: 1, power: 60 },
            ],
          },
        ],
        expected: [
          { name: 'Nami', day: 2, power: 66 },
          { name: 'Zoro', day: 3, power: 96 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Luffy', day: 5, power: 88 },
              { name: 'Chopper', day: 4, power: 50 },
            ],
          },
        ],
        expected: [
          { name: 'Chopper', day: 4, power: 50 },
          { name: 'Luffy', day: 5, power: 88 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Usopp', day: 1, power: 10 },
              { name: 'Usopp', day: 4, power: 40 },
              { name: 'Usopp', day: 2, power: 20 },
            ],
          },
        ],
        expected: [{ name: 'Usopp', day: 4, power: 40 }],
      },
      {
        args: [{ __df__: [{ name: 'Brook', day: 7, power: 83 }] }],
        expected: [{ name: 'Brook', day: 7, power: 83 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'A', day: 2, power: 5 },
              { name: 'B', day: 1, power: 7 },
              { name: 'A', day: 1, power: 3 },
            ],
          },
        ],
        expected: [
          { name: 'A', day: 2, power: 5 },
          { name: 'B', day: 1, power: 7 },
        ],
      },
    ],
    hint: 'Sort by `day` ascending so the latest reading is the *last* occurrence of each name, then `drop_duplicates("name", keep="last")`. Finish with a sort by `name` and a reset.',
    solution:
      'import pandas as pd\n\ndef latest_reading(df):\n    out = df.sort_values("day").drop_duplicates("name", keep="last")\n    return out.sort_values("name").reset_index(drop=True)\n',
    why: 'Collapsing an event log into a snapshot — latest status per ticket, last login per user, current price per product — is a daily-driver operation, and getting it right hinges on controlling row order before you deduplicate.',
    insight:
      'The insight is that `drop_duplicates` is order-sensitive: `keep="last"` means last *in the current row order*, so the sort is not decoration — it is what gives "last" its meaning. Sort ascending by the recency key, dedupe keeping the last, and every survivor is the newest row for its key. The same two-step also answers "first purchase per customer" (`keep="first"`) and pairs with a multi-key sort for tie-breaking.',
    constraints: [
      'each name has at most one reading per day (no day ties within a name)',
      'day and power are integers',
      'every name appears at least once',
    ],
    complexity: 'O(n log n) time, O(n) space',
  },
  {
    id: 'pd-group-champion',
    track: 'pandas',
    title: 'Champion of each dojo',
    difficulty: 'hard',
    pattern: 'groupby',
    description:
      'The tournament sheet `df` has columns `name`, `dojo`, and `power`. Crown exactly **one champion per dojo**: the fighter with the highest `power`. If two fighters in the same dojo tie on `power`, the one whose `name` comes first alphabetically takes the title.\n\nReturn a DataFrame with columns `dojo`, `name`, `power` (in that order), one row per dojo, sorted by `dojo` ascending, index reset.\n\nNo loops over groups — solve it with a ranking sort plus a per-group cut.',
    examples: [
      'dojo_champions(df)  ->  one row per dojo: its strongest (tie -> alphabetically first) fighter',
    ],
    function_name: 'dojo_champions',
    starter_code:
      'import pandas as pd\n\ndef dojo_champions(df):\n    # best fighter per dojo; ties broken by name; columns dojo, name, power\n    ...\n',
    tests: [
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', dojo: 'east', power: 96 },
              { name: 'Tashigi', dojo: 'east', power: 74 },
              { name: 'Kuina', dojo: 'west', power: 80 },
              { name: 'Mihawk', dojo: 'west', power: 99 },
            ],
          },
        ],
        expected: [
          { dojo: 'east', name: 'Zoro', power: 96 },
          { dojo: 'west', name: 'Mihawk', power: 99 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Zoro', dojo: 'shimotsuki', power: 80 },
              { name: 'Kuina', dojo: 'shimotsuki', power: 80 },
            ],
          },
        ],
        expected: [{ dojo: 'shimotsuki', name: 'Kuina', power: 80 }],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Nami', dojo: 'c', power: 66 },
              { name: 'Robin', dojo: 'a', power: 88 },
            ],
          },
        ],
        expected: [
          { dojo: 'a', name: 'Robin', power: 88 },
          { dojo: 'c', name: 'Nami', power: 66 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Johnny', dojo: 'b', power: 41 },
              { name: 'Yosaku', dojo: 'b', power: 43 },
              { name: 'Koushirou', dojo: 'a', power: 70 },
              { name: 'Brook', dojo: 'c', power: 83 },
              { name: 'Sanji', dojo: 'c', power: 90 },
            ],
          },
        ],
        expected: [
          { dojo: 'a', name: 'Koushirou', power: 70 },
          { dojo: 'b', name: 'Yosaku', power: 43 },
          { dojo: 'c', name: 'Sanji', power: 90 },
        ],
      },
      {
        args: [
          {
            __df__: [
              { name: 'Beta', dojo: 'x', power: 50 },
              { name: 'Alfa', dojo: 'x', power: 50 },
              { name: 'Gama', dojo: 'y', power: 20 },
            ],
          },
        ],
        expected: [
          { dojo: 'x', name: 'Alfa', power: 50 },
          { dojo: 'y', name: 'Gama', power: 20 },
        ],
      },
    ],
    hint: 'Sort so each dojo\'s champion sits first in its block: `sort_values(["dojo", "power", "name"], ascending=[True, False, True])`. Then `drop_duplicates("dojo")` keeps only that first row per dojo.',
    solution:
      'import pandas as pd\n\ndef dojo_champions(df):\n    ranked = df.sort_values(\n        ["dojo", "power", "name"], ascending=[True, False, True]\n    )\n    out = ranked.drop_duplicates("dojo")\n    return out[["dojo", "name", "power"]].reset_index(drop=True)\n',
    why: '"Best row per group" is the hardest of the classic pandas interview shapes because a plain `groupby(...).max()` mixes columns from different rows — you need the *whole winning row*, tie-break included. The sort-then-cut idiom solves it without ever looping over groups.',
    insight:
      'A plain `groupby("dojo")["power"].max()` returns the top number but severs it from its row — you cannot tell *who* scored it, and taking max of `name` too would happily weld one fighter\'s power onto another\'s name. The fix is to encode the entire ranking (group key, score descending, tie-breaker) into one `sort_values`, so the champion is simply the first row of each dojo block; `drop_duplicates("dojo", keep="first")` then slices exactly one row per group while keeping the columns glued together. Because the dojo key leads the sort, the output is already in dojo order. The same idiom (or its cousin `groupby(...).head(1)` on the ranked frame) answers "top order per customer" and "latest event per session".',
    constraints: [
      'every dojo has at least one fighter',
      'no two fighters in the same dojo share both power and name',
      'power is an integer',
    ],
    complexity: 'O(n log n) time, O(n) space',
  },
];
