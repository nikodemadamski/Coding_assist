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
