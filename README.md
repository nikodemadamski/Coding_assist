# ⚔️ ZoroClaude Dojo

A **personal LeetCode-style training platform** for rebuilding Python, pandas, and SQL
foundations — built for a 12-week data-science / FDE interview prep plan.

Read a problem → write code in the browser → run tests → submit → track progress with
spaced repetition, streaks, and belt ranks. Generate brand-new practice problems on
demand with the Anthropic API ("Forge").

**Everything runs in your browser. There is no backend and nothing to pay for.**

- **Python & pandas** execute via [Pyodide](https://pyodide.org) (CPython compiled to
  WebAssembly, loaded from the jsDelivr CDN). pandas is lazy-loaded only when you open a
  pandas problem.
- **SQL** executes via [sql.js](https://sql.js.org) (SQLite compiled to WebAssembly).
- **Progress, drafts, forged questions, and your review schedule** live in
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

## Adding your Anthropic API key (for the Forge)

The "✦ Forge new question" feature asks Claude to write a brand-new, auto-verified
practice problem. It needs your own API key:

1. Create a key at <https://console.anthropic.com/settings/keys>.
2. In the app, open **Settings** (gear icon in the header).
3. Paste the key into the **Anthropic API key** field.

Your key is stored only in your browser's `localStorage` and is sent only to
`api.anthropic.com` — it never touches any other server. Solving problems works fully
offline-of-Anthropic; the key is needed only for forging new questions.

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
- Dark "dojo" theme: Zilla Slab display, IBM Plex Sans body, IBM Plex Mono code.
  Mobile-first — under 900 px the Problem / Code / Result panes become tabs.
