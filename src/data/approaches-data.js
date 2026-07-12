// Brute-force → optimal ladders for the pandas and SQL tracks, mirroring the
// python APPROACHES map. Rules are identical: every code passes the question's
// real tests (run-seed-tests executes them through the real engines), and the
// LAST entry is the model — its complexity string is byte-identical to the
// question's inline `complexity`. Questions with no genuinely instructive
// alternative (plain SELECT/WHERE, column selection) carry no ladder.

export const APPROACHES_DATA = {
  // ---- pandas ------------------------------------------------------------
  'pd-filter-rows': [
    {
      name: 'Check row by row',
      complexity: 'O(n) time — a Python-level function call per row',
      note: 'A lambda through `apply` works, but pandas is calling back into Python for every single value — the vectorized comparison below does the same work in C.',
      code: `import pandas as pd

def filter_scores(df, threshold):
    keep = df["score"].apply(lambda s: s > threshold)
    return df[keep].reset_index(drop=True)
`,
    },
    {
      name: 'Boolean mask',
      complexity: 'O(n) time, O(n) space over the rows',
      note: 'The comparison runs on the whole column at once and the mask indexes the frame — no Python loop anywhere.',
      code: `import pandas as pd

def filter_scores(df, threshold):
    return df[df["score"] > threshold].reset_index(drop=True)
`,
    },
  ],
  'pd-value-counts': [
    {
      name: 'Plain dict loop',
      complexity: 'O(n) time — but looping in Python',
      note: 'Exactly what you would write without pandas. It works — and it shows what value_counts is doing for you.',
      code: `import pandas as pd

def count_styles(df):
    counts = {}
    for style in df["style"]:
        counts[style] = counts.get(style, 0) + 1
    return counts
`,
    },
    {
      name: 'value_counts',
      complexity: 'O(n) time, O(k) space — k distinct values',
      note: 'One vectorized pass, then `.to_dict()` for the required plain-dict shape.',
      code: `import pandas as pd

def count_styles(df):
    return df["style"].value_counts().to_dict()
`,
    },
  ],
  'pd-groupby-agg': [
    {
      name: 'Manual accumulation',
      complexity: 'O(n) time — hand-rolled sums and counts',
      note: 'Accumulate (sum, count) per team in a dict, then build the frame. This is literally what groupby-mean does — once you see it, the one-liner stops being magic.',
      code: `import pandas as pd

def team_averages(df):
    sums = {}
    for team, score in zip(df["team"], df["score"]):
        s = sums.setdefault(team, [0, 0])
        s[0] += score
        s[1] += 1
    rows = [{"team": t, "avg_score": s[0] / s[1]} for t, s in sums.items()]
    return pd.DataFrame(rows).sort_values("team").reset_index(drop=True)
`,
    },
    {
      name: 'groupby mean',
      complexity: 'O(n) time, O(g) space — g groups',
      note: '`as_index=False` keeps team as a column so no reset_index dance is needed after the aggregation.',
      code: `import pandas as pd

def team_averages(df):
    out = df.groupby("team", as_index=False)["score"].mean()
    out = out.rename(columns={"score": "avg_score"})
    return out.sort_values("team").reset_index(drop=True)
`,
    },
  ],
  'pd-merge-frames': [
    {
      name: 'Dict lookup + map',
      complexity: 'O(n + m) time — a hash map by hand',
      note: 'Build a {customer_id: name} dict and map it onto the orders. This IS a hash join spelled out — merge does the same thing with better ergonomics for multi-column cases.',
      code: `import pandas as pd

def orders_with_names(orders, customers):
    names = dict(zip(customers["customer_id"], customers["name"]))
    out = orders.copy()
    out["name"] = out["customer_id"].map(names)
    out = out.dropna(subset=["name"])
    out = out[["order_id", "name", "item"]]
    return out.sort_values("order_id").reset_index(drop=True)
`,
    },
    {
      name: 'merge',
      complexity: 'O(n + m) time — hash join, O(n + m) space',
      note: 'The relational spelling: one call joins on the key and keeps only matches (inner is the default).',
      code: `import pandas as pd

def orders_with_names(orders, customers):
    merged = orders.merge(customers, on="customer_id")
    out = merged[["order_id", "name", "item"]]
    return out.sort_values("order_id").reset_index(drop=True)
`,
    },
  ],
  'pd-top-n': [
    {
      name: 'Records out, sort in Python',
      complexity: 'O(n log n) time — leaving pandas to do it',
      note: 'Dump to dicts, sort with a key, slice. Correct, but you pay to leave the vectorized world and the shape breaks down the moment the data grows.',
      code: `import pandas as pd

def top_two(df):
    rows = sorted(df.to_dict("records"), key=lambda r: -r["score"])
    return pd.DataFrame(rows[:2])
`,
    },
    {
      name: 'Sort, then head',
      complexity: 'O(n log n) time — the sort dominates, O(n) space',
      note: 'Stay in pandas: sort descending and take the first two rows. (`nlargest(2, "score")` is the same idea with a nicer name.)',
      code: `import pandas as pd

def top_two(df):
    return df.sort_values("score", ascending=False).head(2).reset_index(drop=True)
`,
    },
  ],
  'pd-handle-nan': [
    {
      name: 'Masks by hand',
      complexity: 'O(n) time — notna mask + loc assignment',
      note: 'Filter with a notna mask, then patch the holes with `.loc`. Works, but you are re-implementing two built-ins.',
      code: `import pandas as pd

def clean_inventory(df):
    out = df[df["name"].notna()].copy()
    out.loc[out["qty"].isna(), "qty"] = 0
    return out.reset_index(drop=True)
`,
    },
    {
      name: 'dropna + fillna',
      complexity: 'O(n) time, O(n) space',
      note: 'The two purpose-built tools, each stating its policy: drop rows missing a name, default missing quantities to 0.',
      code: `import pandas as pd

def clean_inventory(df):
    out = df.dropna(subset=["name"]).copy()
    out["qty"] = out["qty"].fillna(0)
    return out.reset_index(drop=True)
`,
    },
  ],
  'pd-computed-column': [
    {
      name: 'apply across rows',
      complexity: 'O(n) time — one Python call per row',
      note: '`axis=1` hands each row to a Python function. Fine at this size; at a million rows it is 100× slower than the column arithmetic below.',
      code: `import pandas as pd

def add_total(df):
    out = df.copy()
    out["total"] = out.apply(lambda r: r["price"] * r["qty"], axis=1)
    return out
`,
    },
    {
      name: 'Vectorized column math',
      complexity: 'O(n) time, O(n) space',
      note: 'Columns multiply element-wise like numpy arrays — think in whole columns, not rows.',
      code: `import pandas as pd

def add_total(df):
    out = df.copy()
    out["total"] = out["price"] * out["qty"]
    return out
`,
    },
  ],
  'pd-name-prefix': [
    {
      name: 'apply + startswith',
      complexity: 'O(n) time — a Python string call per row',
      note: 'Each name goes through a Python-level `startswith`. The `.str` accessor below is the same test vectorized over the column.',
      code: `import pandas as pd

def name_prefix(df, prefix):
    keep = df["name"].apply(lambda n: n.startswith(prefix))
    return df[keep].reset_index(drop=True)
`,
    },
    {
      name: '.str.startswith mask',
      complexity: 'O(n) time, O(n) space',
      note: 'The `.str` accessor family (startswith / contains / lower…) is the vectorized spelling of every common string test.',
      code: `import pandas as pd

def name_prefix(df, prefix):
    mask = df["name"].str.startswith(prefix)
    return df[mask].reset_index(drop=True)
`,
    },
  ],
  'pd-sort-two-keys': [
    {
      name: 'Two chained stable sorts',
      complexity: 'O(n log n) time — two passes, radix-style',
      note: 'Sort by the SECONDARY key first, then stably by the primary — stability preserves the earlier order inside each dojo. A classic trick worth knowing, but easy to get backwards.',
      code: `import pandas as pd

def rank_roster(df):
    out = df.sort_values("power", ascending=False, kind="stable")
    out = out.sort_values("dojo", kind="stable")
    return out.reset_index(drop=True)
`,
    },
    {
      name: 'One multi-key sort',
      complexity: 'O(n log n) time, O(n) space',
      note: 'Both keys in one call, each with its own direction — states the intent directly and cannot be ordered wrong.',
      code: `import pandas as pd

def rank_roster(df):
    out = df.sort_values(["dojo", "power"], ascending=[True, False])
    return out.reset_index(drop=True)
`,
    },
  ],
  'pd-dojo-report': [
    {
      name: 'agg list + rename',
      complexity: 'O(n) time — aggregate first, rename after',
      note: 'Aggregate with a list, then patch the column names. It works, but the rename step is exactly what named aggregation was invented to remove.',
      code: `import pandas as pd

def dojo_report(df):
    out = df.groupby("dojo")["power"].agg(["count", "max"]).reset_index()
    out = out.rename(columns={"count": "members", "max": "best"})
    return out.sort_values("dojo").reset_index(drop=True)
`,
    },
    {
      name: 'Named aggregation',
      complexity: 'O(n log n) time, O(n) space',
      note: 'Each output column declares its own (source, function) pair and its final name in one place.',
      code: `import pandas as pd

def dojo_report(df):
    out = df.groupby("dojo", as_index=False).agg(
        members=("power", "count"),
        best=("power", "max"),
    )
    return out.sort_values("dojo").reset_index(drop=True)
`,
    },
  ],
  'pd-left-merge-default': [
    {
      name: 'Dict map + fillna',
      complexity: 'O(n + m) time — a hand-rolled left join',
      note: 'Map the lookup dict onto the key column; unmatched keys come back NaN, exactly like a left join, and fillna supplies the default.',
      code: `import pandas as pd

def arm_the_crew(fighters, weapons):
    lookup = dict(zip(weapons["weapon_id"], weapons["weapon"]))
    out = fighters.copy()
    out["weapon"] = out["weapon_id"].map(lookup).fillna("fists")
    out = out[["name", "weapon"]]
    return out.sort_values("name").reset_index(drop=True)
`,
    },
    {
      name: 'Left merge + fillna',
      complexity: 'O(n log n) time, O(n) space',
      note: 'The relational spelling: LEFT keeps every fighter, and the NaNs the join manufactures are patched with the default.',
      code: `import pandas as pd

def arm_the_crew(fighters, weapons):
    out = fighters.merge(weapons, on="weapon_id", how="left")
    out["weapon"] = out["weapon"].fillna("fists")
    out = out[["name", "weapon"]]
    return out.sort_values("name").reset_index(drop=True)
`,
    },
  ],
  'pd-keep-latest': [
    {
      name: 'groupby idxmax',
      complexity: 'O(n) time — one pass to find each max day',
      note: '`idxmax` returns the row LABEL of each group’s latest day; `.loc` fetches those whole rows. Clean — as long as the recency key has no ties.',
      code: `import pandas as pd

def latest_reading(df):
    idx = df.groupby("name")["day"].idxmax()
    return df.loc[idx].sort_values("name").reset_index(drop=True)
`,
    },
    {
      name: 'Sort + drop_duplicates',
      complexity: 'O(n log n) time, O(n) space',
      note: 'Sort ascending by day so "last" means newest, then keep the last row per name. The idiom generalizes to any tie-break you can encode in the sort.',
      code: `import pandas as pd

def latest_reading(df):
    out = df.sort_values("day").drop_duplicates("name", keep="last")
    return out.sort_values("name").reset_index(drop=True)
`,
    },
  ],
  'pd-group-champion': [
    {
      name: 'Loop over groups',
      complexity: 'O(n log n) time — a sort inside every group',
      note: 'Iterate the groups, sort each, take its first row. Readable, but the Python loop scales badly and the frame rebuild is clumsy.',
      code: `import pandas as pd

def dojo_champions(df):
    rows = []
    for dojo, g in df.groupby("dojo"):
        g = g.sort_values(["power", "name"], ascending=[False, True])
        rows.append(g.iloc[0])
    out = pd.DataFrame(rows)
    return out[["dojo", "name", "power"]].reset_index(drop=True)
`,
    },
    {
      name: 'One sort + drop_duplicates',
      complexity: 'O(n log n) time, O(n) space',
      note: 'Encode the entire ranking (dojo, power desc, name asc) in one sort — the champion is simply the first row of each dojo block.',
      code: `import pandas as pd

def dojo_champions(df):
    ranked = df.sort_values(
        ["dojo", "power", "name"], ascending=[True, False, True]
    )
    out = ranked.drop_duplicates("dojo")
    return out[["dojo", "name", "power"]].reset_index(drop=True)
`,
    },
  ],
  'pd-melt-long': [
    {
      name: 'Stack the columns by hand',
      complexity: 'O(n·k) time — one copy per stat column',
      note: 'Build one small frame per stat column and concatenate. Exactly what melt automates — and what stops scaling the moment "two columns" becomes "forty".',
      code: `import pandas as pd

def to_long(df):
    parts = []
    for stat in ["speed", "strength"]:
        part = df[["name"]].copy()
        part["stat"] = stat
        part["value"] = df[stat]
        parts.append(part)
    out = pd.concat(parts, ignore_index=True)
    return out.sort_values(["name", "stat"]).reset_index(drop=True)
`,
    },
    {
      name: 'melt',
      complexity: 'O(n·k) — n rows unstacked across k stat columns, plus the sort',
      note: 'One call: id columns stay put, every other column becomes (name, value) rows — however many there are.',
      code: `import pandas as pd

def to_long(df):
    out = df.melt(id_vars='name', var_name='stat', value_name='value')
    return out.sort_values(['name', 'stat']).reset_index(drop=True)
`,
    },
  ],
  'pd-rolling-mean': [
    {
      name: 'Slice windows in a loop',
      complexity: 'O(n·k) time — recompute each window sum',
      note: 'For each position, slice the last ≤3 values and average them. Transparent, and a good way to convince yourself what rolling windows actually contain.',
      code: `import pandas as pd

def rolling_gold(df):
    out = df.sort_values("day").reset_index(drop=True)
    golds = out["gold"].tolist()
    avgs = []
    for i in range(len(golds)):
        window = golds[max(0, i - 2) : i + 1]
        avgs.append(sum(window) / len(window))
    out["avg3"] = avgs
    return out
`,
    },
    {
      name: 'rolling window',
      complexity: 'O(n log n) for the sort; the rolling pass is O(n)',
      note: '`min_periods=1` is the answer to "what should incomplete windows do?" — without it the first two rows come back NaN.',
      code: `import pandas as pd

def rolling_gold(df):
    out = df.sort_values('day').reset_index(drop=True)
    out['avg3'] = out['gold'].rolling(3, min_periods=1).mean()
    return out
`,
    },
  ],
  'pd-group-cumsum': [
    {
      name: 'Running dict in a loop',
      complexity: 'O(n) time — but looping in Python',
      note: 'Keep a running total per crew in a dict as you walk the sorted rows. This is the semantics of groupby-cumsum, written out.',
      code: `import pandas as pd

def running_gold(df):
    out = df.sort_values(["crew", "day"]).reset_index(drop=True)
    totals = {}
    so_far = []
    for crew, gold in zip(out["crew"], out["gold"]):
        totals[crew] = totals.get(crew, 0) + gold
        so_far.append(totals[crew])
    out["total_so_far"] = so_far
    return out
`,
    },
    {
      name: 'groupby cumsum',
      complexity: 'O(n log n) for the sort; grouping and cumsum are O(n)',
      note: 'A groupby TRANSFORM: one value per input row, index-aligned, so it assigns straight back as a column. Sort first — cumsum follows row order.',
      code: `import pandas as pd

def running_gold(df):
    out = df.sort_values(['crew', 'day']).reset_index(drop=True)
    out['total_so_far'] = out.groupby('crew')['gold'].cumsum()
    return out
`,
    },
  ],
  'pd-cut-tiers': [
    {
      name: 'apply an if/elif chain',
      complexity: 'O(n) time — one Python call per row',
      note: 'The instinctive version: write the tier function, apply it. Correct — but the boundary logic lives in code you must read, not in data you can see.',
      code: `import pandas as pd

def bounty_tier(df):
    def tier(b):
        if b < 100:
            return "rookie"
        if b < 1000:
            return "veteran"
        return "legend"

    out = df.copy()
    out["tier"] = out["bounty"].apply(tier)
    return out
`,
    },
    {
      name: 'pd.cut',
      complexity: 'O(n) — one vectorized binning pass',
      note: 'Edges and labels as data: one more edge than labels, `right=False` for [low, high) intervals so 100 is veteran and 1000 is legend.',
      code: `import pandas as pd

def bounty_tier(df):
    out = df.copy()
    out['tier'] = pd.cut(
        out['bounty'],
        bins=[0, 100, 1000, float('inf')],
        right=False,
        labels=['rookie', 'veteran', 'legend'],
    ).astype(str)
    return out
`,
    },
  ],
  'pd-pivot-grid': [
    {
      name: 'groupby + unstack',
      complexity: 'O(n log n) time — the same reshape, spelled out',
      note: 'Aggregate to a (month, region) MultiIndex, then unstack region into columns. This is literally what pivot_table does under the hood.',
      code: `import pandas as pd

def gold_grid(df):
    out = (
        df.groupby(["month", "region"])["gold"].sum()
          .unstack(fill_value=0)
          .reset_index()
    )
    out.columns.name = None
    return out.sort_values("month").reset_index(drop=True)
`,
    },
    {
      name: 'pivot_table',
      complexity: 'O(n log n) — group, unstack and sort',
      note: 'Index, columns, values, aggfunc, fill_value — the five decisions of every report grid, in one call.',
      code: `import pandas as pd

def gold_grid(df):
    out = df.pivot_table(
        index='month', columns='region', values='gold',
        aggfunc='sum', fill_value=0,
    ).reset_index()
    out.columns.name = None
    return out.sort_values('month').reset_index(drop=True)
`,
    },
  ],

  // ---- SQL ---------------------------------------------------------------
  'sql-having': [
    {
      name: 'Filter a subquery',
      complexity: 'O(n) — aggregate inner query, filter outside',
      note: 'Aggregate first, then treat the result as a table and use plain WHERE. Always works — HAVING is the shorthand that saves the nesting.',
      code: `SELECT dojo, total
FROM (
  SELECT dojo, SUM(wins) AS total
  FROM results
  GROUP BY dojo
)
WHERE total > 10;`,
    },
    {
      name: 'HAVING',
      complexity: 'O(n) scan, O(g) space',
      note: 'WHERE filters rows before grouping; HAVING filters the finished groups.',
      code: `SELECT dojo, SUM(wins)
FROM results
GROUP BY dojo
HAVING SUM(wins) > 10;`,
    },
  ],
  'sql-inner-join': [
    {
      name: 'Comma join + WHERE',
      complexity: 'O(n·m) as written — a filtered cross product',
      note: 'The pre-1992 spelling you will still meet in legacy code: list both tables, connect them in WHERE. Same result, but the join condition hides among the filters.',
      code: `SELECT c.name, o.item
FROM orders o, customers c
WHERE o.customer_id = c.id;`,
    },
    {
      name: 'Explicit JOIN … ON',
      complexity: 'O(n + m) with a hash/index join; O(n·m) naive',
      note: 'The join condition lives in ON where it belongs, and forgetting it is a syntax error instead of a silent cross product.',
      code: `SELECT c.name, o.item
FROM orders o
JOIN customers c ON o.customer_id = c.id;`,
    },
  ],
  'sql-left-join-null': [
    {
      name: 'NOT IN subquery',
      complexity: 'O(n + m) hashed — but NULL-fragile',
      note: 'Reads nicely — but if the subquery ever returns a NULL, `NOT IN` returns zero rows total. Safe here only because customer_id is never NULL.',
      code: `SELECT name
FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);`,
    },
    {
      name: 'LEFT JOIN + IS NULL',
      complexity: 'O(n + m) with a hash/index join',
      note: 'Keep everyone, then keep only the rows where the join found nothing — the manufactured NULL is the "no match" signal.',
      code: `SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
    },
  ],
  'sql-subquery': [
    {
      name: 'CROSS JOIN the average',
      complexity: 'O(n) — the aggregate becomes a one-row table',
      note: 'Compute the average as a one-row table and join it onto every fighter. Clunky here, but the shape scales to needing SEVERAL aggregates at once.',
      code: `SELECT f.name
FROM fighters f
CROSS JOIN (SELECT AVG(power) AS ap FROM fighters) a
WHERE f.power > a.ap;`,
    },
    {
      name: 'Scalar subquery in WHERE',
      complexity: 'O(n) — the subquery runs once, then one scan',
      note: 'An uncorrelated subquery returning one value can sit anywhere a literal could.',
      code: `SELECT name
FROM fighters
WHERE power > (SELECT AVG(power) FROM fighters);`,
    },
  ],
  'sql-window-top-per-group': [
    {
      name: 'Correlated MAX',
      complexity: 'O(n²) naive — one MAX scan per row',
      note: 'For each row, ask "is my salary my role’s maximum?". Pre-window SQL — fine on small tables, and it silently returns BOTH rows on a tie.',
      code: `SELECT name, role, salary
FROM crew c
WHERE salary = (SELECT MAX(salary) FROM crew WHERE role = c.role);`,
    },
    {
      name: 'ROW_NUMBER window',
      complexity: 'O(n log n) — window sort per partition',
      note: 'Rank inside each role, keep rank 1. The window computes once over the whole table, and swapping the 1 for N answers "top N per group".',
      code: `SELECT name, role, salary
FROM (
  SELECT name, role, salary,
         ROW_NUMBER() OVER (PARTITION BY role ORDER BY salary DESC) AS rn
  FROM crew
)
WHERE rn = 1;`,
    },
  ],
  'sql-self-join-mentor': [
    {
      name: 'Correlated name lookup',
      complexity: 'O(n²) naive — one lookup subquery per student',
      note: 'Fetch each mentor’s name with a scalar subquery per row. Works for one column — but add "mentor’s bounty too" and you need a second subquery; the join scales, this does not.',
      code: `SELECT name AS student,
       (SELECT m.name FROM members m WHERE m.id = s.mentor_id) AS mentor
FROM members s
WHERE mentor_id IS NOT NULL;`,
    },
    {
      name: 'Self-join with two aliases',
      complexity: 'O(n) with a hash/index join; O(n²) naive',
      note: 'Aliases make two independent cursors over the same table — one playing student, one playing mentor.',
      code: `SELECT s.name AS student, m.name AS mentor
FROM members s
JOIN members m ON s.mentor_id = m.id;`,
    },
  ],
  'sql-case-when-pivot': [
    {
      name: 'Boolean sums (SQLite)',
      complexity: 'O(n) scan — comparisons summed directly',
      note: "SQLite evaluates `result = 'win'` to 1 or 0, so you can SUM the comparison itself. Neat — but dialect-dependent; not every database lets booleans add.",
      code: `SELECT dojo,
       SUM(result = 'win') AS wins,
       SUM(result = 'loss') AS losses
FROM duels
GROUP BY dojo;`,
    },
    {
      name: 'CASE WHEN inside SUM',
      complexity: 'O(n) scan, O(g) space — g groups',
      note: 'The portable spelling of conditional aggregation — works in every SQL dialect and reads as exactly what it does.',
      code: `SELECT dojo,
       SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
       SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses
FROM duels
GROUP BY dojo;`,
    },
  ],
  'sql-not-exists-anti': [
    {
      name: 'LEFT JOIN + IS NULL',
      complexity: 'O(n + m) with a hash join — plus duplicate risk',
      note: 'The join spelling of the anti-join. Careful: an island visited twice joins into two rows, so in variants that SELECT more than a filter you may need DISTINCT.',
      code: `SELECT i.name
FROM islands i
LEFT JOIN visits v ON v.island_id = i.id
WHERE v.island_id IS NULL;`,
    },
    {
      name: 'NOT EXISTS',
      complexity: 'O(n + m) with a hash/index; O(n·m) naive',
      note: 'Reads as the question itself, never duplicates, and is NULL-safe where NOT IN is not.',
      code: `SELECT name
FROM islands i
WHERE NOT EXISTS (
  SELECT 1 FROM visits v WHERE v.island_id = i.id
);`,
    },
  ],
  'sql-running-total': [
    {
      name: 'Correlated re-sum',
      complexity: 'O(n²) — re-sums the prefix for every row',
      note: 'For each row, sum every earlier day of the same crew again. Quadratic — each row recomputes the work its predecessor already did.',
      code: `SELECT crew, day, gold,
       (SELECT SUM(h2.gold) FROM haul h2
        WHERE h2.crew = h.crew AND h2.day <= h.day) AS total_so_far
FROM haul h
ORDER BY crew, day;`,
    },
    {
      name: 'SUM OVER a cumulative window',
      complexity: 'O(n log n) — window sort per partition, then one pass',
      note: 'ORDER BY inside the OVER turns SUM from "whole-partition total" into "total up to this row" — one sort, one pass.',
      code: `SELECT crew, day, gold,
       SUM(gold) OVER (PARTITION BY crew ORDER BY day) AS total_so_far
FROM haul
ORDER BY crew, day;`,
    },
  ],
  'sql-distinct-order-limit': [
    {
      name: 'GROUP BY as dedup',
      complexity: 'O(n log n) — grouping doubles as dedup',
      note: 'Grouping by all selected columns deduplicates whole rows too. It works — but it says "aggregate" while meaning "dedupe".',
      code: `SELECT sea, island
FROM sightings
GROUP BY sea, island
ORDER BY sea, island
LIMIT 4;`,
    },
    {
      name: 'DISTINCT',
      complexity: 'O(n log n) — dedup + sort dominate',
      note: 'Says what it means. DISTINCT dedupes first, ORDER BY sorts the survivors, LIMIT cuts last.',
      code: `SELECT DISTINCT sea, island
FROM sightings
ORDER BY sea, island
LIMIT 4;`,
    },
  ],
  'sql-left-join-coalesce': [
    {
      name: 'Correlated scalar + COALESCE',
      complexity: 'O(n·m) naive — one bounty lookup per member',
      note: 'Look each bounty up with a per-row subquery and default the misses. Fine for one column; a join brings the whole row across at once.',
      code: `SELECT name,
       COALESCE((SELECT amount FROM bounties b WHERE b.crew_id = c.id), 0) AS bounty
FROM crew c;`,
    },
    {
      name: 'LEFT JOIN + COALESCE',
      complexity: 'O(n + m) with a hash/index join',
      note: 'LEFT keeps every crew member; COALESCE patches the NULLs the join manufactures for the unmatched.',
      code: `SELECT c.name, COALESCE(b.amount, 0) AS bounty
FROM crew c
LEFT JOIN bounties b ON b.crew_id = c.id;`,
    },
  ],
  'sql-lag-previous': [
    {
      name: 'Self-join on day − 1',
      complexity: 'O(n) with an index — but gap-fragile',
      note: 'Join each row to the same crew’s previous day. Works ONLY because days are consecutive — one missing day and the join finds nothing where LAG would still find the previous row.',
      code: `SELECT h.crew, h.day, h.gold, h.gold - p.gold AS delta
FROM haul h
LEFT JOIN haul p ON p.crew = h.crew AND p.day = h.day - 1
ORDER BY h.crew, h.day;`,
    },
    {
      name: 'LAG window',
      complexity: 'O(n log n) — window sort per partition, then one pass',
      note: 'LAG takes "the previous row that exists" after the partition’s ordering — gaps or no gaps — and returns NULL on each first row.',
      code: `SELECT crew, day, gold,
       gold - LAG(gold) OVER (PARTITION BY crew ORDER BY day) AS delta
FROM haul
ORDER BY crew, day;`,
    },
  ],
  'sql-dense-rank-ties': [
    {
      name: 'Count the distinct amounts above',
      complexity: 'O(n²) — one counting subquery per row',
      note: 'Your dense rank = how many DISTINCT amounts beat yours, plus one. The pre-window spelling — and a great way to understand what DENSE_RANK means.',
      code: `SELECT name, amount,
       (SELECT COUNT(DISTINCT b2.amount) FROM bounties b2
        WHERE b2.amount > b.amount) + 1 AS rnk
FROM bounties b
ORDER BY amount DESC, name;`,
    },
    {
      name: 'DENSE_RANK',
      complexity: 'O(n log n) — one window sort',
      note: 'Ties share a position and nothing is skipped — the definition, computed in one sort.',
      code: `SELECT name, amount,
       DENSE_RANK() OVER (ORDER BY amount DESC) AS rnk
FROM bounties
ORDER BY amount DESC, name;`,
    },
  ],
  'sql-second-per-group': [
    {
      name: 'MAX below the MAX',
      complexity: 'O(n²) — nested per-row aggregate scans',
      note: 'The second-highest is the max of everything below the max. It works — and the nesting shows exactly why windows were added to SQL; "third-highest" this way is unreadable.',
      code: `SELECT sea, name
FROM pirates p
WHERE bounty = (
  SELECT MAX(bounty) FROM pirates p2
  WHERE p2.sea = p.sea
    AND p2.bounty < (SELECT MAX(bounty) FROM pirates p3 WHERE p3.sea = p.sea)
);`,
    },
    {
      name: 'ROW_NUMBER, keep rn = 2',
      complexity: 'O(n log n) — window sort per partition',
      note: 'Number the rows inside each sea, filter in an outer query (window results cannot appear in WHERE directly). Swap the 2 for any N.',
      code: `SELECT sea, name
FROM (
  SELECT sea, name,
         ROW_NUMBER() OVER (PARTITION BY sea ORDER BY bounty DESC) AS rn
  FROM pirates
) ranked
WHERE rn = 2;`,
    },
  ],
  'sql-moving-average': [
    {
      name: 'Self-join the window',
      complexity: 'O(n·k) — every row joins its k neighbours',
      note: 'Join each day to its own 3-day window and aggregate the matches. The BETWEEN spells out the frame the window function gets for free.',
      code: `SELECT s.day, s.gold, AVG(w.gold) AS avg3
FROM sales s
JOIN sales w ON w.day BETWEEN s.day - 2 AND s.day
GROUP BY s.day, s.gold
ORDER BY s.day;`,
    },
    {
      name: 'AVG over a ROWS frame',
      complexity: 'O(n log n) sort, then one windowed pass',
      note: '`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` — the frame clips at the edge, so days 1 and 2 average what exists.',
      code: `SELECT day, gold,
       AVG(gold) OVER (
         ORDER BY day
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS avg3
FROM sales
ORDER BY day;`,
    },
  ],
  'sql-percent-of-total': [
    {
      name: 'Scalar-subquery denominator',
      complexity: 'O(n) — the total computes once',
      note: 'Divide by a scalar subquery. Perfectly fine here — the window spelling wins when you need shares within groups AND overall in the same SELECT.',
      code: `SELECT crew,
       gold * 100.0 / (SELECT SUM(gold) FROM haul) AS pct
FROM haul
ORDER BY pct DESC;`,
    },
    {
      name: 'SUM OVER ()',
      complexity: 'O(n) — one scan with a whole-set window',
      note: 'An empty OVER () is a window covering the entire result set — the grand total lands on every row without collapsing them.',
      code: `SELECT crew,
       gold * 100.0 / SUM(gold) OVER () AS pct
FROM haul
ORDER BY pct DESC;`,
    },
  ],
  'sql-gap-to-leader': [
    {
      name: 'Join to a per-sea MAX',
      complexity: 'O(n) — aggregate once, join back',
      note: 'Aggregate the per-sea peaks into a derived table and join it back. Two passes over the data where the window needs one — but it works everywhere, windows or not.',
      code: `SELECT p.sea, p.name, m.top - p.bounty AS gap
FROM pirates p
JOIN (SELECT sea, MAX(bounty) AS top FROM pirates GROUP BY sea) m
  ON m.sea = p.sea
ORDER BY p.sea, p.bounty DESC;`,
    },
    {
      name: 'MAX OVER the partition',
      complexity: 'O(n log n) — partition sort, then one pass',
      note: 'PARTITION BY with no ORDER BY covers the whole partition, so every row of a sea sees that sea’s maximum — one pass, no join.',
      code: `SELECT sea, name,
       MAX(bounty) OVER (PARTITION BY sea) - bounty AS gap
FROM pirates
ORDER BY sea, bounty DESC;`,
    },
  ],
};
