# ZoroClaude Dojo — project map for AI assistants

Personal, free, browser-only LeetCode-style trainer (Python 3 / pandas / SQL) whose
purpose is passing Google/Anthropic-level coding interviews. No backend, no AI calls
from the app, everything in localStorage. **All problem wording is original — never
copy text from LeetCode/NeetCode.**

## Commands

```bash
npm run dev / build / lint
npm test                     # 16 unit suites, incl. run-seed-tests (runs EVERY solution
                             # and EVERY alternative approach through real engines)
# Browser smoke (~240 checks). CDN is blocked in the dev container:
node tests/setup-local-pyodide.mjs         # once per container
VITE_PYODIDE_BASE=/pyodide/ npm run build
CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/smoke.mjs
```

Full gates (lint + test + build + smoke) before every push, no exceptions.

## Data layer — the merge pipeline (src/data/)

`questions.js` composes SEED_QUESTIONS: RAW (inline python/pandas/sql + neetcode1–5.js)
→ spread `LEARN[id]` (learn.js: why / insight / constraints / examples)
→ set `unordered` from UNORDERED map (deep|outer — order-insensitive grading)
→ set `complexity` from `COMPLEXITY[id]` (complexity.js) if absent
→ set `approaches` from `APPROACHES[id]` (approaches.js) if absent.

- questions: `{id, track, title, difficulty, pattern, description, examples[], starter_code,
  hint, solution, approach?, tests[{args, expected}], function_name | sql_setup+expected_rows}`
- trees encode as nested `[value, left, right]`, `null` = empty; lists as value arrays.
- `roadmap.js` (path order, categoryKeyOf), `roadmapGraph.js` (algorithm map layout),
  `trackGraphs.js` (pandas/SQL trees), `patternGuide.js` (26 templates: 16 algo by category
  key + 5 pandas + 5 SQL with track+patterns fields; guideKeyOf maps question→card),
  `patternHints.js`,
  `warmups.js` + `warmups-pandas.js` + `warmups-sql.js` (typing drills, 3 tracks × 3
  levels × 50; SQL checking folds case, pandas/SQL answers EXECUTE in the warm-up gate),
  `validateQuestion.js` (schema gate, also used by import),
  `lessons.js` + `lessons-chN.js` + `validateLesson.js` (Learn-from-zero curriculum:
  **52 lessons across 9 chapters** — ch1-5 language + arrays/two-pointer/stack, then ch6
  power-tools (recursion, classes, functional, generators, idioms), ch7 search-windows
  (sliding-window, binary-search, heap, intervals, greedy), ch8 structures (linked lists,
  trees, traversals, backtracking, tries), ch9 graphs-dp (graphs, DP 1-D/2-D, bits, math) —
  covering every one of NeetCode's 16 pattern families from zero.
  Lessons `{id, chapter, prereqs, read{text≤120w, example, visual?}, items[]}` with item
  types predict/type/fix/write/watch/visual/arrange; tests/lesson-tests.mjs EXECUTES every
  read example, predict snippet (stdout vs answer via checkAnswer), fix (broken must FAIL,
  solution pass), write/watch through real engines, every visual `verifyCode` (stdout must
  equal claimed output), and every `arrange` puzzle (ordered lines PASS, reversed FAIL —
  order is load-bearing); PY_SNIPPET_HARNESS in pyHarness runs scripts with stdout capture —
  worker kind 'snippet', pyClient.runPythonSnippet).
- `visualWidgets.js` — the Brilliant-style concept-visualization registry + per-widget beat
  validator (used by BOTH the gate and the renderer). 14 widgets: `list-cells` (indexing/
  slicing + `pointer2`/`mid` markers for two-pointer & binary search) | `var-boxes` |
  `loop-tape` | `dict-lookup` | `stack-tower` (also the recursion call stack) | `text-reveal`
  (scrambleText: expression→string; the gate ties the last beat's text to verifyOutput) |
  `branch-flow` (if/elif/else · True/False · try/except) | `call-return` (args→body→return, on a
  timeline) | `pipe-flow` (input row→expression→staggered output row) | `interval-bars`
  (intervals on a number line, merge) | `node-chain` (linked list, .next walk, reversal) |
  `tree-view` (SVG nested [value,left,right], path-keyed; trees/traversals/backtracking/tries) |
  `graph-view` (SVG nodes+edges; BFS/DFS frontier) | `dp-table` (1-D/2-D grid; active cell +
  its deps light up). Each fed tap-through `beats` (pure data). EVERY lesson carries a
  `read.visual` (lesson gate enforces full coverage); a `visual` item renders one beat per tap;
  an `arrange` item is a Parsons drag-to-order (indentation baked in, order-only).

## Engine (src/engine/)

`pyHarness.js` holds PY_PRELUDE (defaultdict, Counter, deque, heapq, `import bisect`,
math, itertools, functools cache/lru_cache, inf, typing…) **injected into exec globals,
never prepended** (keeps user line numbers). PY_HARNESS runs tests; PY_TRACE_HARNESS is
the settrace visualizer with an AST narrator (`_narrate`, `_cond_text`, MAX_STEPS 400).
Both run identically in the Pyodide module worker (5s kill switch) and in Node tests.
Result comparison canonicalizes via `_canon`, honoring `unordered`.

## Animation (src/anim/) — the ONLY place that touches anime.js

**anime.js v4** (bundled npm dep, compiled by Vite → zero runtime external call, offline/PWA
safe). `useAnime.js` is the sole import site: the `useAnime()` hook returns
`animate(targets, params)` (v4 `animate`), honors `prefers-reduced-motion` (snaps to the
final state — `ease:'linear'`, duration 0); it also exports `stagger`, `stopAnim` (utils.remove
— kill in-flight tweens so overlapping animations don't fight) and `useTimeline` (createTimeline,
reduced-motion aware — call-return sequences args-in→body→return on it). `presets.js` is the
shared vocabulary widgets compose with — a single shared `spring()` gives natural settling
physics; presets `slideTo/glideY/pulse/fadeSwap/popIn/shade/popOut/enter/scramble` (enter =
staggered spring group entrance; scramble = scrambleText reveal). v4 note: `ease` not `easing`,
ease names drop the prefix (`outCubic`, `inOutQuad`, `outBack`), transforms use `x`/`y`.
Widgets in `src/components/visual/` (ListCells/VarBoxes/LoopTape/DictLookup/StackTower/
TextReveal/BranchFlow/CallReturn/PipeFlow/IntervalBars/NodeChain/TreeView/GraphView/DpTable +
VisualPlayer tap-through host) speak presets only. SVG widgets (tree/graph) pulse the
circle, not the positioned group, so scale never fights the translate.
Widgets whose text/DOM anime mutates are keyed per beat (`key={beatIndex}`) so React
reconciliation never fights the animation.

## State (src/state/) — pure modules, all unit-tested

- `storage.js` — localStorage keys: `zoro.progress.v1` (solved/drafts/srs/streak/activity/
  warmup/mock/notes/bigo), `zoro.customQuestions.v1`, `zoro.backup.v1`, `zoro.ui.v1`
  (uiPrefs: divider split, editor font), `zoro.theme.v1`, `zoro.onboarded.v1`.
- `progress.js` — SRS (stages [1,3,7,16,30]), recordSolve (keeps mistakes; first-solve
  `firstSolveMs`), belts, weakSpots (≥2 mistakes), reviewForecast, backupStatus, recordBigO.
- `readiness.js` — 0-100 score: coverage .3 / mastery .25 / mocks .25 / pace .2, plus a
  Big-O dimension at 10% once ≥15 answers (others scale ×0.9). Pace targets 15/25/40 min,
  median firstSolveMs, ≥3 samples per difficulty.
- `bigo.js` — bigOBucket maps a complexity string's time part to 6 buckets; product forms
  (O(m·n)), O(h), O(L) return null = reveal-don't-grade.
- `lessonProgress.js` — progress.lessons[id] = {completedAt, runs, missedIdx, srs};
  recordLessonComplete (skill check due +1d), recordLessonReview (pass climbs / fail
  resets — never touches question srs), buildReviewItems (4 quick predict/type,
  missed-first).
- others: activity (daily goal + todayPulse), mockSession (formats incl. data round via
  format.tracks, optimalComplexity = last approach's complexity else question.complexity), practiceSession (skills→review→new queue; skill checks = due lesson reviews, never requeue),
  patternQuiz, celebrate, theme, uiPrefs, vizPointers (▲ markers from subscript scan).

## INVARIANTS — edges that must stay in sync

1. **Grading chain:** the LAST entry of `APPROACHES[id]` is the model; its `complexity`
   string must be byte-identical to `COMPLEXITY[id]` (or replace it deliberately in both).
   `bigOBucket` must parse it. The mock debrief and the after-solve Big-O check-in grade
   against this via `optimalComplexity`.
2. **Every approach code must pass the question's real tests** — run-seed-tests enforces.
3. Result-order-insensitive ids live ONLY in the UNORDERED map (deep vs outer chosen so
   wrong groupings still fail — permutations is `outer`, not `deep`).
4. Smoke selectors are coupled to UI text/classes: changing a label means updating
   tests/smoke.mjs in the same commit (Run/Submit are scoped `.pv-toolbar button`;
   nav goes through `openLibrary(page, label)`).
5. `validateQuestion` gates imports AND seeds; new question fields need a rule there.

## UI shell (src/components/)

App.jsx owns views: home (RoadmapGraph = the map), browse (Picker), track (TrackMap),
problem/practice/drill (ProblemView / PracticeView), warmup, mock, patterns, quiz, stats,
guide, learn (LearnView chapter list) / lesson (LessonView player); modals: Settings,
ImportModal, SearchPalette (⌘K), Onboarding, Celebration. All dialogs use `useFocusTrap`.
Header: Search/Browse/Library▾(Learn·Stats·Patterns·Sensei)/theme/Settings; quiet UI — no
decorative emojis, color carries state. Learn-before-use: lessonLinks.js maps a question →
prerequisite lessons; a dismissible pv-learn-first banner + a Stuck-ladder rung link offer
the lesson first (python track, uncompleted lessons only). Home shows a learn-strip
(Continue + due skill-check count) that self-collapses at 30/30; Mock/Drill hidden at 0
solves.

ProblemView anatomy: pv-toolbar (back/title/Focus/Run/Submit) → pv-tabs (BOTTOM on
<900px, swipe between panes; swipes ignore .cm-editor/.mkeys) → pv-body grid
(draggable divider --pv-split desktop) → editor-bar (lang, reset, A−/A+, Visualize my
code) → `.mkeys` mobile key strip (pointerdown+preventDefault keeps the phone keyboard
open) → Results, solved banner (timed), BigOCheck, StuckLadder, Approaches (tabbed
brute→optimal, each with Visualize), Notes. VisualizerModal: fixed height, hero
narration, element-level diff highlights, pointer overlay, runs on ANY code.

PWA: public/manifest.webmanifest + sw.js (nav network-first, assets cache-first),
registered in prod only; icons in public/icons.

## Assistant workflow (learned, keep using)

- **Query, don't read:** Grep with context / targeted line-range reads; never full-read
  styles.css, questions.js, smoke.mjs (they're huge — use this map + grep).
- **Parallelize:** batch independent tool calls; run build/smoke in background while
  authoring the next unit; content work ships in verified chunks (author → engine-verify
  → gates → push per chunk).
- Screenshot scripts live in the session scratchpad; import playwright via absolute
  node_modules path, `CHROMIUM_PATH=/opt/pw-browsers/chromium`, dismiss `.onboard-skip`.
- Verify UI work with screenshots at 1400×900 AND 390×844 (mobile is first-class).
