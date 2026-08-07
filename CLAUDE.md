# ZoroClaude Dojo — project map for AI assistants

Personal, free, browser-only LeetCode-style trainer (Python 3 / pandas / SQL) whose
purpose is passing Google/Anthropic-level coding interviews. No backend, no AI calls
from the app, everything in localStorage. **All problem wording is original — never
copy text from LeetCode/NeetCode.**

## Commands

```bash
npm run dev / build / lint
npm test                     # 24 unit suites, incl. run-seed-tests (runs EVERY solution
                             # and EVERY alternative approach through real engines)
# Browser smoke (~358 checks). CDN is blocked in the dev container:
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
  `signature.js` (reads a question's parameter names out of its starter code — powers the
  test console's named arguments; tests/signature-tests.mjs checks all 133 code questions
  expose a readable signature whose arity matches every test case),
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
physics; presets `slideTo/glideY/pulse/fadeSwap/popIn/shade/popOut/enter/reveal/scramble` (enter =
staggered spring group entrance; scramble = scrambleText reveal). v4 note: `ease` not `easing`,
ease names drop the prefix (`outCubic`, `inOutQuad`, `outBack`), transforms use `x`/`y`.
Widgets in `src/components/visual/` (ListCells/VarBoxes/LoopTape/DictLookup/StackTower/
TextReveal/BranchFlow/CallReturn/PipeFlow/IntervalBars/NodeChain/TreeView/GraphView/DpTable +
VisualPlayer tap-through host) speak presets only. SVG widgets (tree/graph) pulse the
circle, not the positioned group, so scale never fights the translate.
Widgets whose text/DOM anime mutates are keyed per beat (`key={beatIndex}`) so React
reconciliation never fights the animation.

`usePointerField.js` is the *ambient* half — the surface that keeps responding once the
entrance is over. It writes `--px/--py` (pointer position, %), `--rx/--ry` (a tilt in
degrees) and `--pin` on an element and lets CSS smooth them, so per-frame cost is one
transform, it's interruption-safe by construction, and React never re-renders. Updates
coalesce into one rAF. Under reduced motion it attaches **no listeners at all**. Home uses
it twice: the hero (aurora lean) and `.hero-next` (4° tilt + a spotlight that tracks the
cursor).

`useReveal.js` is the app-level entrance choreography: a view calls `useReveal(key)` for a ref
on its root, tags its blocks `data-reveal`, and every tagged block cascades in (opacity+rise,
`presets.reveal`). It runs in a **layout** effect so anime sets opacity 0 before paint (no
flash) and the CSS baseline stays the finished state (never blank if the effect can't run);
the stagger step shrinks with group size so long lists finish inside ~620ms. Used by home
(RoadmapGraph), Stats, Patterns, Learn and Browse — NOT ProblemView (the editor must not
move). Smoke's `checkRevealSettled` asserts nothing is left transparent.

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
- `shop.js` — the dojo economy. **The balance is derived, never accumulated**: coins are
  recomputed from the training record each time (solves/review stages/lessons/mocks/warm-up
  runs/streak days/belts × `RATES`) minus `progress.shop.spent`, so there is no counter to
  double-count, no migration when a rate changes, and export/import carries the wallet for
  free. **Belts gate, coins cost** — `ITEMS` name a `belt` index into BELTS and a price, and
  `itemState()` is the single source for owned/locked/affordable/buyable so the button, the
  tag and the lock note can't disagree. `outfitFor(progress, roomCostume)` resolves what the
  mascot wears: the room's costume takes its slot, your equipped kit fills the rest.
- `patternQuiz.js` — the recognition drill, both halves. Round building
  (`buildQuizRound`, distractors from the question's OWN track or elimination gives it away)
  **and the record**: `recordQuizRound` folds a round into `progress.quiz`
  `{rounds, right, wrong, bestPct, lastAt, byPattern}`, `patternAccuracy` reports a single
  pattern only past `MIN_SEEN` (3 — a percentage off one answer is a coin toss shown as a
  fact, so one round of ten scores nothing per-card and smoke asserts that), `overallAccuracy`
  needs no threshold, `weakPatterns` is worst-first with ties broken by miss count,
  `roundSummary`/`verdictFor` grade one round (a slow perfect round is told to speed up; a
  round lost to run-outs is diagnosed as the clock, not as ignorance).
- others: activity (daily goal + todayPulse), mockSession (formats incl. data round via
  format.tracks, optimalComplexity = last approach's complexity else question.complexity), practiceSession (skills→review→new queue; skill checks = due lesson reviews, never requeue),
  celebrate, theme, uiPrefs, vizPointers (▲ markers from subscript scan).

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

## Design system (DESIGN.md + the token block at the top of styles.css)

`DESIGN.md` is the source of truth and is read by `impeccable` as project context.
Principles: **one loud thing per screen** · colour carries state, never decoration ·
**edge OR elevation, never both** (cards get a hairline; only modals/popovers get
`--shadow-modal`) · prose capped at `--measure` · motion moves opacity/transform on
`--ease`, never width/height.

Tokens (never hard-code a value): type `--t-micro…--t-3xl` (11px floor for functional
text — no exceptions), spacing `--s-1…--s-8` (4px base), radius `--r-xs/sm/md/lg/full`,
`--shadow-pop/-modal`, `--ease` + `--dur-1/2`. Colour is semantic: `--ink/--panel/
--panel-2/--line/--text/--text-dim`, state accents `--jade` (progress/done), `--gold`
(current/attention), `--crimson` (the one CTA — AA-tuned; `--crimson-bright` is for
marks only, never behind text), `--sky` + `--track-python/pandas/sql` (theme-aware —
both themes must pass AA). Display serif is **h1/h2 only**; h3/h4 are sans.

Bars/meters animate `transform: scaleX/scaleY(var(--fill))` with the JSX passing
`style={{ '--fill': 0..1 }}` — never an animated width.

Shared page furniture: `.page-head` (one loud title + a one-line lede — **never** a
tracked-caps eyebrow above a heading; impeccable bans that shape outright, so a label that
matters goes INTO the heading or down into a plain `.bento-sub` sentence); `.cue-orb` nests
a primary action's arrow in its own disc (the one thing that moves on hover);
`ReadinessRing.jsx` draws the readiness score as a dial (arc sweeps on mount, final offset
also inline so it's right without JS); `CountUp.jsx` races a number to its value by
animating a plain object (no per-frame React render) and always lands on the truth.

**Home** (`RoadmapGraph.jsx`) opens on `.hero`: `state/greeting.js` greets you by name
(`uiPrefs.name`, default Nick, editable in Settings — solves-today > streak ≥3 > clock),
a live status line, the mission bar, then `.hero-next` — the next unsolved question at
display scale with the page's one red CTA — and `.hero-actions` (reviews / warm-up / mock
/ drill / readiness ring). `.learn-lane` is the Python curriculum, deliberately quieter
than `.hero-next` (smoke asserts the size ratio). The map draws itself in on mount: every
`path[data-edge]` animates `stroke-dashoffset` to 0 on a stagger and the nodes cascade
behind them; the current topic keeps a slow halo.

**Ambient motion** — the page stays alive at rest, and every loop is either information or
below the notice threshold: the aurora (two `.hero::before/::after` fields drifting on 19s
/ 24s keyframes, leaning with the pointer), `bar-sweep` on the mission bar, `orb-breathe`
on the one CTA, and `edge-current` — a travelling dash down the map edges returned by
`liveRouteFor(GRAPH_EDGES, currentKey)` (roadmapGraph.js, unit-tested: always exactly one
connected walk, and never empty — at the top of the map it lights the way *out*). Note
`currentKey` follows the next unsolved question **that lives on the map**, not `nextUp` —
the path interleaves pandas/SQL, and the algorithm map must never lose its "you are here".
The mount draw-in clears its inline dash values on `.live` edges in `onComplete` so the CSS
loop can take over. `.map-head/.graph-fit/.data-tracks` use `animation-timeline: view()`
(scroll-driven, no JS) and therefore carry **no** `data-reveal` — one owner per element.
Smoke asserts the settled page keeps ≥4 infinite animations running, that the card leans
under the pointer, and that a `reducedMotion:'reduce'` context has **zero** loops, no
pointer vars and nothing left invisible.

**The pattern drill** (`PatternQuiz.jsx`) runs on the stage: a 20s countdown per question
(`QUIZ_SECONDS` — recognition you have to *derive* is not recognition, so running out grades
as wrong, via `settle('')` where `''` can never equal a correct key), 1–4 to answer and Enter
to advance, `.stage-prog` segments carrying a third `miss` state so the shape of the round is
readable, feedback that shows the card's **cues** rather than restating the answer, and a
debrief whose heaviest block is the list of patterns you couldn't name — each a button into
its template card. The round is filed once, on completion, so quitting halfway doesn't record
a two-question round. Patterns then reads that record back: an accuracy line with your weakest
pattern in the head, and a per-card `%` once a pattern clears `MIN_SEEN`.

**The data-track maps** (`TrackMap.jsx`) get the algorithm map's whole treatment: `page-head`,
the track's own colour on the total (`--track-pandas` / `--track-sql` via a `--track` var),
`liveRouteFor(graph.edges, currentKey)` lighting the route to the first topic with anything
unsolved, `.graph-node.current`'s halo, a solved count on every node, and the same
stroke-dashoffset draw-in. The fitted tree is **centred by a measured inset**, not a CSS
max-width — a max-width driven by the scale feeds back into the width the scale is computed
from.

**The stage** is the shared full-height shell for one-thing-at-a-time surfaces (lesson
player, warm-up run): `.stage` (h100%, flex col) → `.stage-top` (exit · `.stage-kicker` +
h1 · `.stage-prog` segments) → `.stage-body` → `.stage-step` (flex col; `.ln-item` is the
lesson's alias) → `.stage-scroll` (the only scroller) + `.stage-inner` (max 760px,
`margin:auto` so a short step centres and a long one just grows) → `.stage-foot` (the
persistent action bar; `.good` tints jade, `.shown` tints gold). Every primary action for
a step lives in the foot — never inline — so the button never moves between steps. Stats lays out on `.bento`
— a 12-col grid whose cells run 7/5 · 5/7 · 5/7 · 12 · 7/5 and collapse to full width
under 1000px; Patterns is a two-up grid whose open card spans the row. Deliberately
asymmetric: smoke asserts the bento cells do NOT all share one width.

**Gate:** `CI=1 npx impeccable@3.5.0 detect src/` and `… detect http://localhost:4200
[--viewport 390x844]` must both come back empty (it prints nothing when clean). It
catches the generated-UI tells — coloured side-tabs, thin-border+wide-shadow, bounce
easing, layout-animating transitions, sub-11px text, contrast failures, long lines.

## UI shell (src/components/)

**The top bar** (`Header.jsx` + `components/header/`) is frosted glass: sticky, translucent
`--panel`, `backdrop-filter: blur(18px) saturate(150%)`, no border — a gradient hairline
`::after` instead (blur on a *sticky* element is the one place it's free; never on scrolling
content). The brand is **dojo**: `DojoLogo.jsx` renders `DojoFace.jsx`, an @react-three/fiber
scene where the two `o`s are eye rings whose pupils track the pointer and blink on a random
timer, the `j`'s tittle is the nose, and a half-torus is the smile — every letter built from
primitives, never loaded 3D type. It is a **mascot**, not a logo: it watches your cursor
anywhere on the page (`anim/mascotBeacon.js` — one ref-counted window listener writing to a
module ref, rAF-coalesced, zero renders; the mark measures the direction from its own
`getBoundingClientRect()` centre, so the gaze works across a whole monitor), squints and
flattens its smile and nods once per keystroke while you type (any keystroke, anywhere —
CodeMirror included), and **dresses for the room**: `state/mascot.js` maps view → costume
(cap in the lessons, headband while solving, sweatband at the warm-up, bow tie for the mock,
glasses on Stats, monocle on Patterns, topknot for Sensei; lobbies dress down), each one a
few primitives that drop in with a bounce on arrival. `mascotLabel(view)` puts the costume
in the button's aria-label so it isn't information only sighted users get, and the flat SVG
fallback carries the same wardrobe. App passes `view.name` → Header → DojoLogo. It also
idles, leans toward the cursor, and scatters sparks on click. **It is behind `React.lazy`** so three.js (222KB gz) lands in its own chunk and never
blocks first paint; reduced motion, no WebGL, and a failed chunk (an error boundary) all fall
back to the same inline `FlatMark` SVG, so the brand is never missing. three.js can't parse
`var(--…)`, so `useThemeColors` resolves the tokens to real values, keyed on `theme`.

**It reacts to what happens to you.** `state/mascotMood.js` is the pure brain (tested by
`mascot-mood-tests.mjs`): `expressionFor({pulse, pulseAt, view, typing, now})` returns five
channels — `brow` / `squint` / `mouth` / `bounce` / `shake` — by blending an **ambient** face
(the room: `WORKING_VIEWS` → the severe `focus` lecturer face, deepened by typing; everywhere
else `idle`) with a **pulse** (`pass` | `proud` | `fail` | `oops` | `cheer`), which owns the
face for its first third of `PULSE_MS` then melts back — a reaction that never ends is a mask.
`bounce`/`shake` are impulses and spend themselves by halfway, so the movement stops while
the feeling lasts. Events go in through `setMood(kind)` on the beacon (module-level, zero
renders — the canvas reads `beacon.mood` in `useFrame`): ProblemView Run green → `pass`,
Submit recorded → `proud`, tests failed → `fail`, code that won't run → `oops`; LessonView
routes every exercise resolution through one wrapped `setState`; the warm-up reacts only at
the *ends* of a run (50 hops would be noise); App's celebration → `cheer`. `subscribeMood`
drives a two-render-per-event `useMoodPulse()` in DojoLogo so `moodLabel()` reaches the
aria-label. Rendering notes: `Brows` rest tucked under the belt band at `BROW_Y` 0.42 and
knit down onto the eye ring (the 0.08 sliver between ring top 0.385 and band bottom 0.465
made them invisible); the mouth is **one** half-torus whose `scale.y` goes negative to flip
into a frown, dropped by its own arc height so the apex lands on the old smile line, with
both ends of the range compressed or the arc leaves the canvas; the hop is small for the
same reason (the mark is fitted with almost no headroom).

The mascot **wears your belt as a headband** — a band in `beltFor().color` across the brow
at `BAND_Y`, always on; it is rank, not costume, so no room can take it off. It sits on the
brow rather than under the chin because the smile's arc reaches down past the letters (a
sash there crossed the mouth) and because a band is what every hat can stack on: all hats
sit above `BAND_Y`, and the `headband` item is now the knot-and-tails that *tie* that band.
Neck items clear the smile at y ≈ -1.5. Shop items add four slots
(hat/face/neck/aura, `Worn` drops each in with a bounce, auras are one particle system with
three velocity fields). `ShopView.jsx` reuses the same canvas at `fit={1.9}` as a live
preview. **`fit` divides the fitted scale** — note the hover pulse writes `group.scale`
every frame, so a `scale` prop would be overwritten; the fit is read inside `useFrame`.
`HeaderChips.jsx` holds the streak/belt/coin chips (CSS-only tooltips, glowing `--belt` fill) and
exports `useTactile` — the one framer-motion spring every header control presses with.
`NavButton.jsx` wraps its children in `.hdr-btn-label`, which phones hide (visually, never
`display:none` — it's the accessible name); a button whose icon IS its content passes it as
`glyph` so it survives that. Lucide supplies the icons. `eslint.config.js` disables
`react/no-unknown-property` for DojoFace.jsx only — R3F's JSX intrinsics aren't DOM.

**Browse** is the question bank, not a list: `state/questionFilter.js` (pure, unit-tested)
does the text match (title/pattern/track/difficulty, case- and punctuation-insensitive) and
the status axis (`all|todo|due|weak|solved`) derived from your own record; `statusCounts`
computes each chip's count *under the other live filters*, so a chip never promises rows a
click can't show — smoke asserts chip count === rows returned. Rows carry a tick, not a
colour dot, and the mastery pill only appears for `reviewing`/`mastered` (`new` is what the
missing tick already says; `learning` is the default one solve later).

`Guide.jsx` derives its contents rail from its own `## ` headings and stamps matching ids on
the rendered `h2`s (marked emits none), so the rail can't drift from the prose;
IntersectionObserver drives the scroll-spy. On phones the rail becomes a horizontal strip.

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

ProblemView anatomy: pv-toolbar (back/stepper/title/tags/SolveTimer/Focus/Run/Submit) →
pv-tabs (BOTTOM on <900px, swipe between panes; swipes ignore .cm-editor/.mkeys) →
pv-body grid — desktop is `problem | ‖ | code / ═ / console`, with BOTH dividers
draggable and persisted (`--pv-split` cols, `--pv-vsplit` rows) → editor-bar (lang chip +
fn name left, quiet `.bar-btn` tools right: Visualize, A−/A+, Reset) → `.mkeys` mobile key
strip (pointerdown+preventDefault keeps the phone keyboard open) → **TestConsole**.
StuckLadder / Approaches (tabbed brute→optimal, each with Visualize) / Notes live in the
problem column. VisualizerModal: fixed height, hero narration, element-level diff
highlights, pointer overlay, runs on ANY code.

**TestConsole** (src/components/TestConsole.jsx) owns the bottom pane — two tabs:
- *Testcase* — one `.case-chip` per `question.tests` entry (+ a dashed **Custom** chip),
  each carrying its own verdict class (`pass`/`fail`) after a run, so which case broke is
  readable without opening anything. The selected case shows its args **by name**, read
  out of the starter signature by `src/data/signature.js` (`paramNames` parses
  `def fn(...)`, stripping annotations/defaults; `argToText` renders spaced JSON;
  `parseArgs` validates the Custom boxes and names the offending one).
  The Custom case runs the real engine via `runQuestion({...question, tests:[{args,
  expected:null}]})` — ungraded by construction, records nothing, only reports the return
  value + stdout.
- *Result* — `<Results/>` unchanged, with a `.console-tab-badge` scoring the last run.
SQL gets no Testcase tab (`hasCases`) — it grades a result set, not calls. Banners
(solved / BigOCheck / practice reflect) are passed in as `children` above the tabs, so the
tabs never disappear behind them.

`SolveTimer.jsx` ticks elapsed vs `PACE_TARGETS_MS[difficulty]` (15/25/40 min — the same
targets readiness grades), freezes on solve, compacts to digits-only under 620px.

Editor autocomplete is `src/engine/pyCompletions.js`, not CM6's: prelude names (marked
"no import needed"), interview builtins, keywords, curated `.` members, plus every
identifier in the buffer. SQL keeps CodeMirror's dialect completion.

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
