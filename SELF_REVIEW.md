# SELF_REVIEW — ZoroClaude Dojo

## Redesign update — no-AI, NeetCode-style learning loop

After the first build, the goal was refined: **no live AI in the app**, questions
authored by talking to Claude and imported, and a NeetCode-style loop where you re-clear
learned questions (random order) before new ones unlock, with feedback on whether you
actually understood the code.

What changed, and how it's verified:

- **Removed the live Anthropic API entirely** (the old in-app "Forge"), including the API
  key from Settings. The app makes zero calls to any LLM. Replaced with **＋ Import
  questions**: paste a JSON pack Claude generated for you; each question is schema-checked
  **and** its solution is executed in the real Pyodide/sql.js runner before it's accepted
  — proven in the smoke test (a good pack is added; a solution that fails its own tests is
  rejected).
- **Mastery-gated random practice** (`src/state/practiceSession.js`): a session serves all
  due reviews in random order, and new questions unlock only after every review is
  answered correctly; a failed/skipped question re-queues. Covered by 20 new unit tests
  and an end-to-end smoke check ("new unlocks only after every review is cleared").
- **Confidence rating** (Hard/Good/Easy) after each correct answer tunes the next SRS
  interval; unit-tested (Easy jumps two stages, Hard drops one).
- **Understanding + mistakes**: after a correct answer, practice shows a reflection
  prompt, the reference solution, and an "approach" walkthrough; the Stats page adds a
  mastery breakdown and a "where you slip" list of most-missed problems.
- Added the **Contains Duplicate** seed (the third of your named trio) and approach
  walkthroughs; bank is now 31 questions, all still verified by `npm test`.

All gates re-run green after the redesign: `npm test` (51 logic checks + 31 seed
verifications + sabotage checks), `npm run build`, `npm run lint`, and the Playwright
smoke test (31 checks incl. import + practice + 375px mobile).

---

## Original build notes


## What was tested, and what passed

Everything below was actually executed, not eyeballed.

**`npm test` (all green):**

- **Training-logic unit tests (35 checks)** — the full SRS ladder (first solve → +1
  day, on-time reviews advance through 3/7/16/30, stage caps at 4, failed submit on
  a due problem resets to stage 0, early solves/failures leave the schedule alone),
  streak rules (same-day dedupe, consecutive increment, grace day, reset after a
  missed day), all seven belt thresholds, and an export→import round trip.
- **Seed bank verification (30 questions + shape + sabotage checks)** — every seed
  question's reference solution runs through the *real* runner logic: the identical
  Python harness string executes in Pyodide (with a system-CPython fallback for the
  pandas wheels when the Pyodide CDN is unreachable, as in the build container), and
  SQL runs through the same `sqlCore.js` the browser uses. Sabotage checks prove the
  gate can fail: a wrong solution, a renamed function, a Python syntax error, a wrong
  SQL query, and a SQL syntax error are all rejected.

**`npm run build`** — production build succeeds with no errors (one advisory chunk-size
warning from CodeMirror).

**`npm run lint`** — clean.

**Playwright smoke test against the production build (26 checks, all green)** — real
Chromium driving `vite preview`: app loads, the picker lists all 30 questions, a
problem renders, typing code + Run executes Python in-browser via the Pyodide worker,
a correct Two Sum solution passes 5/5, Submit marks it solved, the streak increments,
and both the solve and the draft survive a page reload. Failure paths exercised for
real: wrong answer (per-test expected-vs-got), renamed function ("keep the starter
name"), syntax error, an infinite loop killed by the 5-second worker watchdog with a
friendly message, correct/wrong/broken SQL (side-by-side visual diff tables; verbatim
SQLite errors), and forging with no API key set. A separate 375px context verified
the tabbed mobile layout and that nothing scrolls horizontally.

The smoke test caught one real bug during development: a reload within the 500 ms
draft-save debounce lost the last edit. Fixed by flushing the draft whenever code is
run or submitted.

**Forge unit checks** — JSON extraction (fenced, raw, garbage), the ≥4-test schema
gate, and duplicate-id rejection were tested in Node. The full forge round trip
(Claude → validate → auto-verify → retry-once) could not be exercised end-to-end here
because it requires the user's own API key in a browser; the retry logic reuses the
verified validator and the verified runner, and every seam around the API call is
tested.

## Known limitations

- **Pyodide comes from the jsDelivr CDN** (~10 MB first load, then browser-cached),
  and pandas wheels likewise on first pandas problem (~15 s). Fully offline use needs
  self-hosting: `node tests/setup-local-pyodide.mjs` + `VITE_PYODIDE_BASE=/pyodide/`
  covers the core runtime (that's how the smoke test runs), but not the pandas wheels.
- **The 5 s timeout restarts the Python runtime** — that's the only way to kill wasm.
  The next run pays a (cached) reload.
- **SQL comparison is positional** — column *values* must match; column names/aliases
  aren't checked (they aren't part of the expected-rows schema).
- **Column order in pandas/python dict results is ignored** (JSON comparison sorts
  keys) — selecting the right columns in the wrong order still passes.
- **Forged-question quality depends on the model**, but nothing unverified can enter
  the bank: generated questions must pass strict schema validation *and* their own
  solution must pass every test in the real runner (one automatic retry with failure
  details, then a clean failure message).
- Markdown in question descriptions is rendered without a sanitizer. Content is
  authored locally (seed bank) or forged into the user's own browser, so exposure is
  minimal for a single-user tool — but don't import question banks from strangers.
- localStorage is the only store. Export/import (Settings) is the backup story;
  there's no cloud sync.

## The three questions

**1. Is it free to run?** Yes. It's a static site (deployable to GitHub Pages /
Netlify Drop / Vercel free tier — steps in the README). Python, pandas, and SQL all
execute inside the visitor's browser via WebAssembly; there is no backend, no
database, and no paid service. The single optional cost is the user's own Anthropic
API key for the Forge, which is pay-per-use on their account and never required for
the core training loop.

**2. Is it comprehensive for a 12-week Python/pandas/SQL plan?** Yes for the
foundations it targets. The 30 seed questions map to the plan's core patterns —
Python: frequency dicts, sets, `.items()`, string manipulation, hashing (two-sum,
anagrams, grouping), two pointers, sliding window, binary search, stack; pandas:
filtering, selection, value counts, groupby+agg, merge, sort/top-N, NaN handling,
computed columns; SQL: WHERE, ORDER/LIMIT, GROUP BY, HAVING, INNER/LEFT JOIN,
subqueries, window functions. Spaced repetition (1/3/7/16/30) drives retention across
the 12 weeks, and the Forge generates unlimited verified problems on any weak topic —
so the bank grows exactly where the user needs depth.

**3. Is it intuitive on mobile?** Yes, verified at 375 px in the smoke test: below
900 px the interface collapses to Problem / Code / Result tabs, running code
auto-switches to the Result tab, the editor is usable, touch targets are buttons, and
there is no horizontal scroll on either the picker or the problem view. The realistic
caveat: writing Python on a phone keyboard is inherently cramped — reading, reviewing
hints, and SQL one-liners work great on mobile; long Python solutions are more
comfortable on a desktop.
