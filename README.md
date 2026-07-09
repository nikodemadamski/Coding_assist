# ⚔️ ZoroClaude Dojo

A **personal, NeetCode-style training platform** for rebuilding Python 3, pandas, and
SQL foundations — LeetCode-style problems with instructions, examples, hints, solution
walkthroughs, and a real in-browser code runner.

Read a problem → write code in the browser → run tests → submit → get it graded → track
mastery with spaced repetition. The learning loop is built around how you actually learn:

- **A 123-step ordered path** covering essentially all of NeetCode-150 that fits an
  in-browser runner. Every question has a step number, laid out in true teaching order:
  Python warm-ups → hashing → two pointers → windows → stack → binary search → pandas →
  SQL → linked lists → trees → tries → heaps → backtracking → graphs → DP → greedy →
  intervals → math & geometry → bits. "Where do I begin?" is never a question — the home
  screen names your exact next step.
- **Clear your reviews first, then continue the path.** Each practice session serves
  every question that's due for review — in **random order** (retrieval practice) — and
  then new questions continue the path **in order**, exactly where you left off
  yesterday. Miss one and it comes back around; you can't move on by failing.
- **Rate your confidence** after each solve (Hard / Good / Easy) — that tunes when the
  question comes back, Anki-style.
- **Check your understanding**, not just your output: after each correct answer you
  compare against the reference solution and an approach walkthrough, and the Stats page
  shows exactly which problems you get wrong most.

**The app never connects to any AI service.** New questions come from *you*: you ask
Claude (in a Claude Project or chat) for a batch using the built-in prompt, paste the
JSON it returns into **＋ Import questions**, and the dojo verifies every solution in the
real runner before accepting it.

**Everything runs in your browser. There is no backend and nothing to pay for.**

- **Python & pandas** execute via [Pyodide](https://pyodide.org) (CPython compiled to
  WebAssembly, loaded from the jsDelivr CDN). pandas is lazy-loaded only when you open a
  pandas problem.
- **SQL** executes via [sql.js](https://sql.js.org) (SQLite compiled to WebAssembly).
- **Progress, drafts, imported questions, and your review schedule** live in
  `localStorage`, with one-click JSON export/import so you never lose data.

## Quick start

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). The first Python run downloads
Pyodide (~10 MB) from the CDN; after that it's cached by your browser.

Other scripts:

```bash
npm test         # run every seed question's reference solution through the real runners
npm run build    # production build into dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint
```

## How you get new questions (no AI in the app)

The app is deliberately offline of any LLM. You are the bridge:

1. In the app, click **＋ Import questions** on the home screen and hit **Copy prompt**.
2. Paste that prompt into a **Claude Project or chat**, and tell it what you want at the
   end — e.g. *"3 easy python on hashing: contains-duplicate, valid-palindrome,
   group-anagrams"* or *"5 SQL window-function problems, medium"*. Do this daily.
3. Claude replies with a JSON pack. Paste it back into the **Import questions** box and
   click **Import & verify**.
4. The dojo runs each generated solution through the real Python/SQL runner and only adds
   the ones that actually pass their own tests — a bad question can never enter your bank.

Because *you* run the model in your own Claude session, there's no API key to manage and
the website itself makes zero calls to any AI service. The exact JSON schema is shown
inside the Import dialog.

### The daily loop

Open the app → **Today's practice** shows how many reviews are due and how many new
questions are ready → **Start review**. Clear the reviews (random order), rate each one,
then new questions unlock. Anything you get wrong lands in **🔥 Drill today's misses** —
do that before you close the app. Import a fresh pack from Claude whenever you want more.

### Staying on pace for a Google / Anthropic loop

- **120+ verified questions** across the full NeetCode-150 roadmap: arrays & hashing, two
  pointers, sliding window, stack, binary search, linked list, trees, tries, heap,
  backtracking, graphs, dynamic programming, greedy, intervals, math & geometry, and bit
  manipulation — plus pandas and SQL. The Browse list is ordered as a **syllabus**,
  foundations first.
- **🎤 Mock interview** (home screen): the closest this app gets to the real thing, and the
  feature that turns practice into preparation. Pick a round — Warm-up (easy, 20 min),
  Standard (medium, 35), Onsite (hard, 45) or Surprise — and get one problem, a live
  countdown, and **no hints or solution** until you're done. When you submit or the clock
  stops, a debrief grades the things a real interviewer grades: did you clarify the problem,
  can you state your solution's time/space complexity (typed and compared against the
  model), and how clearly did you talk through it — *before* the model solution is revealed.
  Every round is logged; the Stats page tracks your pass rate and **clean-pass** count
  (solved *and* in time). A mock pass counts toward your streak and spaced-repetition
  schedule like any solve.
- **⚡ Warm-up** (home screen): like stretching before the gym — rapid-fire "type the
  Python" one-liners (*create an empty list called nums* → `nums = []`) against a
  per-question countdown. 50 questions each at Beginner, Intermediate and Hard; the run
  ends on the first mistake, a timeout, or a perfect 50, then a quick summary shows what
  you nailed, what you typed vs. the right answer, and your slowest answers to drill.
  Answer checking is forgiving about spacing and quote style, and every answer in the bank
  is machine-verified to compile as real Python. Best streaks are saved per level.
- **Guided, premium problem pages**: every foundational problem carries a **🎯 Why this one**
  card (what you learn and why it matters), a proper **Constraints** list, and an unlockable
  **💎 Go deeper** insight — the transferable idea, why interviewers use it, and where else it
  shows up — so you understand *why* a technique works, not just that it does. The home screen
  leads with a guided **"Your next step"** card that names the next question and why it's worth
  doing. (All wording is original — no problem text is copied from LeetCode/NeetCode.)
- **🗺 Visual roadmap — the home page**: a NeetCode-style dependency tree of the **algorithm**
  path (pandas and SQL are separate **data tracks**, surfaced beside the map rather than woven
  into it). Every topic node has a progress bar — arrows mean "learn this pattern before that
  one". The map
  scales to fit any screen, phone included. Clicking a topic pops up its question list;
  click any question to open it. The daily loop (reviews due, Continue the path, Warm-up,
  Drill) sits right on top. The classic list view lives in the **📋 Browse** tab.
- **🧩 Patterns reference** (header): the "templates you must know" cheat-sheet. One card per
  algorithm pattern — how to *recognise* it, the recognition cues, the reusable code skeleton,
  its complexity, and links to the problems in your bank that drill it. Every template is
  machine-checked to be valid Python syntax. The Stuck ladder's "which pattern is this?" rung
  links straight here.
- **☀️ / 🌙 Light &amp; dark themes** (header): a warm, paper-like day mode alongside the dark
  dojo, switchable in one click and remembered across sessions. Every screen — including the
  code editor and the roadmap graph — adapts, with accents darkened for contrast on light.
- **First-run onboarding**: a brand-new user gets a short, skippable four-card orientation —
  this is the map, follow "Your next step", here's what to do when stuck, and the tools for
  when you're ready to be tested — then it gets out of the way (shown once).
- **🧗 Stuck ladder** (on every problem): the answer to "I'm stuck, do I go to YouTube?" —
  no. Climb one rung at a time instead: *which pattern is this?* (recognise the technique and
  what to reach for) → *a nudge* → *the plan in plain English* → *the code* (brute force →
  optimal). Each rung reveals only when you ask, so you get exactly as much help as you need
  and no more. A YouTube search link waits at the very bottom for when you truly want to hear
  someone explain it.
- **▶ Visualize** (on any solution): a step-by-step execution player, built to be *followed*.
  It traces the actual solution — brute force or optimal — on a real test case, and every
  step leads with one plain-English **hero sentence** with the live values plugged in
  (*"Is target - n (= 7) in seen (= {2: 0})? No → skip it."*). The variable that just
  **changed** is highlighted and shown as *before → after*, so there's one thing to watch per
  step instead of a wall of state. Play/pause/scrub, step with ← →, and the approach's core
  idea sits up top.
- **Attendance calendar + daily goal** (Stats page): a GitHub-style grid of every day you
  showed up, and whether you met the goal (clear your reviews + solve ≥1). Don't break the
  chain.
- **Drill today's misses**: a targeted session of exactly what you got wrong today,
  repeat-until-pass — so a mistake becomes a skill instead of a habit.
- **🥋 Sensei guide** (header): a written method — how to learn, what to learn in what
  order, a 10–12 week arc, and the interview-day habits (clarify, state complexity, test
  your own code, recover from a stall).

## Free deployment

The app is a static site — any free static host works.

### GitHub Pages

```bash
npm run build
# push the dist/ folder to a gh-pages branch:
git checkout --orphan gh-pages
git --work-tree dist add --all
git --work-tree dist commit -m "deploy"
git push origin HEAD:gh-pages --force
git checkout -
```

Then enable Pages for the `gh-pages` branch in the repo settings. (The Vite config uses
`base: './'`, so it works from a subpath out of the box.)

### Netlify Drop (no account CLI needed)

```bash
npm run build
```

Then drag the `dist/` folder onto <https://app.netlify.com/drop>. Done.

### Vercel (free tier)

```bash
npm run build
npx vercel deploy dist --prod
```

## Tech notes

- Vite + React (JSX), CodeMirror 6 editor with Python/SQL syntax highlighting.
- Python code runs inside a **Web Worker**, so an infinite loop can be killed after 5
  seconds without freezing the page.
- Spaced repetition intervals: 1 / 3 / 7 / 16 / 30 days. A confidence rating nudges the
  next interval; a failed review resets it.
- The review-gating and re-queue-on-fail logic lives in `src/state/practiceSession.js`
  and is covered by unit tests (`npm test`).
- Dark "dojo" theme: Zilla Slab display, IBM Plex Sans body, IBM Plex Mono code.
  Mobile-first — under 900 px the Problem / Code / Result panes become tabs.
