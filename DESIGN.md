---
name: ZoroClaude Dojo
type:
  scale: [11, 12, 13, 15, 17, 20, 26, 34]
  baseSize: 15
spacing:
  base: 4
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
radius:
  scale: [8, 12, 16, 999]
---

# ZoroClaude Dojo — design system

A focused, dark-first study room. The learner is here for hours at a time, so the
interface stays quiet and lets **one thing per screen** be loud: the next action.

## Principles

1. **One loud thing.** Each screen has exactly one primary action. Everything else
   is a surface, a label, or a quiet link. If two things shout, neither is heard.
2. **Colour carries state, never decoration.** A colour on screen means something
   happened or something is due. Nothing is tinted to look lively.
3. **Edge or elevation, never both.** Cards get a hairline border. Shadow is
   reserved for things that genuinely float above the page (modals, popovers).
4. **Prose is set for reading.** Body copy is capped at ~68 characters per line.
5. **Motion explains, it does not perform.** Transitions move opacity and
   transform only, on decelerating easing. No bounce, no springy overshoot in UI
   chrome (the lesson *concept* widgets are the one place physics is the point).

## Colour

Semantic tokens only — components never hard-code a hex.

| Role | Token | Meaning |
| --- | --- | --- |
| Canvas | `--ink` | the page |
| Surface | `--panel` | a card sitting on the page |
| Raised / inset | `--panel-2` | inputs, code blocks, nested surfaces |
| Hairline | `--line` | the edge of a surface |
| Body text | `--text` | primary reading colour |
| Secondary text | `--text-dim` | supporting copy, metadata |
| Progress / success | `--jade` | solved, correct, completed |
| Current / attention | `--gold` | where you are now, due, needs a look |
| Primary action | `--crimson` | the one CTA per screen |
| Reference / neutral accent | `--sky` | links and non-state highlights |

**Contrast:** every text/background pair meets WCAG AA (4.5:1 body, 3:1 large).
`--crimson` is the *filled-button* red and is tuned to pass with white text; the
brighter `--crimson-bright` is for marks and icons only, never behind text.

## Type

Display serif (`--font-display`) is for page titles and lesson/problem headings
only — it gives the app its editorial character. Everything else, including small
labels and chapter headers, is the sans face. Small serif labels read as an
accident, not a decision.

Functional text never goes below **11px**. Micro-labels are 11–12px sans with
mild letterspacing, sentence case — never long runs of uppercase.

## Surfaces

- Card: `--panel`, 1px `--line`, radius 12–16, padding 16–24.
- No coloured left-edge tabs. State is shown by the element's own border colour,
  a small dot, or a label — not by a 3px stripe down one side.
- Overlays (modal, popover, menu) may use shadow; page cards may not.

## Layout

Full-page views open with a **page head**: one title at hero scale and a single line
of lede. Same shape everywhere — that repetition is what makes separate screens read
as one product.

**No eyebrow kickers.** A tiny tracked-caps label sitting as its own block above a
heading is the most recognisable generated-UI tell there is, and the heading always
carried the meaning on its own. If the label says something real, work it into the
heading ("The path — 17 topics, in order") or put it below as a plain sentence.

Grids are **deliberately asymmetric**. An equal-width row of three or four cards is
the default every generator reaches for, and it flattens hierarchy: everything looks
equally important, so nothing is. Stats is a 12-column bento whose bands run
7/5 · 5/7 · 5/7 · 12 · 7/5; Patterns is a two-up grid where the card you open claims
the whole row. Below ~1000px the asymmetry collapses to a single column — it's a
desktop luxury, not a phone one.

Radius varies by depth: containers take the soft end of the scale (16), elements
nested inside them take the tight end (8). Uniform radius on everything is the same
tell as uniform column widths.

## Motion

Content **arrives**; it does not appear. Every page-level view cascades its blocks
in on mount (opacity + an 18px rise, decelerating, staggered) via `useReveal` — the
step shrinks as the group grows so a long list still finishes in about 620ms. The
editor is the exception: nothing about a code surface may move under the cursor.

The animation runs in a layout effect so the opening frame lands before paint, and
the CSS baseline is always the *finished* state — a cascade that never runs leaves a
correct page, never a blank one.

Primary actions nest their arrow in its own disc (`.cue-orb`) and move only that
disc on hover. One small, precise thing moving beats the whole card sliding.

## The stage

Surfaces that ask for one thing at a time — a lesson exercise, a warm-up prompt — use
the **stage**: a full-height shell with a header, one centred thing to do, and a
persistent action bar pinned to the bottom.

Three rules make it work:

1. **The primary action never moves.** It lives in the bottom bar for every step, in
   every phase. A learner should never hunt for the button, and should never re-learn
   where it is between a read step and a drill.
2. **The bar carries the verdict.** Correct tints it jade, revealed tints it amber. The
   feedback arrives where the eye already is, instead of in a box somewhere above.
3. **Short content centres, long content grows.** `margin: auto` on the inner block, in
   a flex column — a one-line question sits in the middle of the screen instead of
   clinging to the top of a mostly-empty page.

Progress is a bar of segments, one per step, not a row of dots. Dots have to be counted
before they say anything.

## The home screen

The front door has one job: get Nick into the next problem. So it is built around a
single hero — a greeting by name, one live status line, and the next unsolved question
set at display scale with the only red button on the page under it. Everything else is
smaller than that on purpose: the quick-action row is chips, and the Python curriculum
is a lane, not a headline. If you have forgotten some Python you can go study it; the
point is to go solve.

Motion here is load-bearing, not decoration:

- The solved count **counts up**, so progress reads as something that moved.
- The dependency map **draws itself**: arrows animate their stroke from source to
  target and the topics cascade in behind them, so the path is laid out for you rather
  than presented as a finished diagram.
- The topic you are standing in keeps a slow halo, so "you are here" is findable
  without reading a label.
- A live dot pulses next to waiting reviews — and only when something is actually
  waiting.

Every one of those collapses to its finished state under `prefers-reduced-motion`, and
the smoke test asserts the finished state rather than the movement: a map left
half-drawn or a number that lands on a lie is the only failure that matters.

## Ambient motion

Entrance animations play once and then the page is a photograph. A surface that is
supposed to feel alive needs the other half: motion that is still there when you are
just sitting looking at it.

Three rules keep that from becoming noise:

1. **A loop is either information or invisible.** The current running down the map to
   the topic you are on is information — it points at you. The aurora drift, the bar
   sweep and the CTA's halo are deliberately below the threshold where you would notice
   them twice: 19-24 second cycles, 1.5% scale, one sweep every few seconds.
2. **The more often it plays, the smaller it is.** A chip you press daily gets 120ms and
   a 14% nudge on its number. An arrival you see once gets 600ms of full choreography.
3. **Pointer response goes through CSS variables, not JS animation.** The hook writes
   `--px/--py/--rx/--ry`; a CSS transition does the smoothing. That is interruption-safe
   for free, costs one transform per frame, and never re-renders React.

Everything above animates `transform`, `opacity` or `filter` only — never a layout
property — and every one of them is switched off wholesale under
`prefers-reduced-motion`, where the finished state is what the rules resolve to anyway.
