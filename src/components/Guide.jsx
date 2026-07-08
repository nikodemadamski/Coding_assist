import Markdown from './Markdown.jsx';

const GUIDE = `# The Sensei's path to a Google / Anthropic offer

You are not "a mere monkey." You are someone who hasn't yet built the reps. Interviews at
these firms don't test raw IQ — they test **pattern recognition under mild pressure, out
loud, without bugs.** That is a *trainable* skill, and this dojo is built to train exactly it.

## How to learn (the method that actually sticks)

1. **Show up daily — small is fine.** 45 focused minutes every day beats a 6-hour cram on
   Sunday. The attendance calendar on the Stats page exists to make the chain visible; your
   only rule is *don't break the chain*. Start each session with a **⚡ Warm-up** run — two
   minutes of rapid-fire syntax drills gets the brain juices flowing before the real reps,
   exactly like stretching before the gym.
2. **Reviews before new — always.** Open the app, hit **Start review**, and clear what's due
   in random order *before* you touch anything new. This is spaced repetition: a problem you
   solved a week ago is resurfaced right as you're about to forget it. Re-deriving *two-sum*
   for the fifth time feels boring — that boredom is the pattern becoming automatic.
3. **Rate yourself honestly.** After each solve, pick Hard / Good / Easy. Lying ("Easy" when
   you peeked) only cheats future-you. Hard brings it back soon; Easy waits longer.
4. **Drill your misses the same day.** Anything you get wrong lands in **🔥 Drill today's
   misses**. Do that drill before you close the app. A mistake you re-clear the same day
   becomes a lesson; a mistake you ignore becomes a habit.
5. **Understand, don't memorize.** When you pass, read the *approach* walkthrough and the
   reference solution. Ask yourself the reflection prompt: *what does my code do, and what
   would break it?* If you can't explain it in one sentence, you don't own it yet — rate it
   Hard so it comes back. And when a solution still feels like magic, hit **▶ Visualize** on
   it — watching it run a real test case line by line, variable by variable, is how "I read
   the code" becomes "I see why it works."
6. **Say it out loud.** In the real interview you must narrate. Practice here the same way:
   before you type, say the approach and the complexity. "I'll use a hash map for O(n)
   lookups, O(n) space." Muscle memory for *talking while coding* is half the battle.

## What to learn, in order

The browse list is laid out as a syllabus — work down it, roughly one category at a time,
and don't rush ahead until a category feels automatic. The **🗺 Roadmap** page in the header
shows the same order as a dependency tree with your progress per topic:

**Arrays & Hashing → Two Pointers → Sliding Window → Stack → Binary Search → Linked List →
Trees → Heap → Backtracking → Graphs → Dynamic Programming → Greedy → Intervals → Bits.**

- The first four categories are ~60% of what you'll actually be asked. Over-learn them.
- **Trees and Graphs** are the heart of a Google onsite — DFS, BFS, and "is there a cycle."
- **Dynamic Programming** is the scariest but most learnable: every DP is "define the state,
  write the recurrence." Do enough and the fear disappears.
- The **pandas** and **SQL** tracks matter for data-science / FDE-flavored loops (Anthropic
  included) — keep them warm even while you grind algorithms.

## What "on pace" looks like (a 10–12 week arc)

- **Weeks 1–2:** Arrays & Hashing + Two Pointers until *every* review is a reflex.
- **Weeks 3–4:** Sliding Window, Stack, Binary Search (including binary-search-on-the-answer).
- **Weeks 5–6:** Linked List + Trees. Get comfortable writing recursion without hesitating.
- **Weeks 7–8:** Heap, Backtracking, Graphs. This is the difficulty jump — expect to drill.
- **Weeks 9–10:** Dynamic Programming + Greedy + Intervals. Slow and steady.
- **Weeks 11–12:** Mixed random review only. No new patterns — just prove retention under
  time pressure, and start doing **timed mock interviews** with a friend or out loud to a rubber duck.

If your review queue is empty and you've solved everything, **ask Claude to forge you more**
(＋ Import questions) targeting your weakest category — check the "Where you slip" list on
the Stats page to find it.

## Interview-day skills the dojo can't fully simulate — practice them anyway

- **Clarify before coding.** Restate the problem, ask about input size, edge cases, and
  whether the input is sorted. Interviewers score this.
- **State complexity unprompted.** Every solution here lists its time/space in the approach.
  Learn to say it before they ask.
- **Test your own code.** After you write it, walk one example through by hand — the empty
  input, the single element, the duplicate. The seed questions deliberately include those
  edge cases so you build the instinct.
- **Recover gracefully.** You *will* get stuck in a real interview. The drill loop trains the
  most important reflex: a wrong answer isn't failure, it's the next rep.

## Does this platform have what it takes?

Honestly: **yes, if you use it daily.** It gives you a real code runner (no "looks right" —
it either passes or it doesn't), a verified question bank across every pattern these firms
test, spaced repetition so you retain instead of re-forgetting, a same-day drill for your
mistakes, and an attendance chain to keep you honest. What it can't give you is the reps —
that part is on you. Show up, clear your reviews, drill your misses, explain your code.

Now close this page and go clear today's reviews. 🥋`;

export default function Guide() {
  return (
    <div className="stats guide-page">
      <Markdown text={GUIDE} />
    </div>
  );
}
