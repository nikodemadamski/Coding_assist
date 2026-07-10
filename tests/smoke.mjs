// End-to-end smoke test with Playwright + Chromium against the production
// build (vite preview). Covers the Phase 7 gates: app loads, first question
// renders, Run shows results, Submit marks solved and persists across reload,
// plus the failure paths (wrong answer, renamed function, syntax error,
// infinite-loop timeout, SQL visual diff, forging without an API key) and a
// 375px mobile pass.
//
// Prereqs:  node tests/setup-local-pyodide.mjs
//           VITE_PYODIDE_BASE=/pyodide/ npm run build
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { WARMUP_SETS } from '../src/data/warmups.js';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

// ---- start vite preview ----
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: false,
});
const killServer = () => {
  try {
    server.kill();
  } catch {
    /* already dead */
  }
};
process.on('exit', killServer);

for (let i = 0; i < 50; i++) {
  try {
    const res = await fetch(BASE);
    if (res.ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 200));
}

// CHROMIUM_PATH lets CI images point at a pre-installed browser.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);

async function setEditor(page, code) {
  await page.click('.cm-content');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  // insertText behaves like a paste: no autoindent/autoclose interference.
  await page.keyboard.insertText(code);
}

const resultText = (page) => page.locator('.pane-result').innerText();

// Stats / Patterns / Sensei live in the header's Library menu.
async function openLibrary(page, label) {
  await page.locator('.hdr-menu-btn').click();
  await page.locator('.hdr-menu-pop button', { hasText: label }).click();
}

try {
  // ================= desktop =================
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(BASE);

  // ---- first-run onboarding: shown once, then remembered ----
  await page.locator('.onboard').waitFor({ timeout: 5000 });
  check((await page.locator('.onboard-dot').count()) >= 3, 'first run shows a multi-step onboarding');
  await page.locator('.onboard .btn-primary').click(); // Next
  await page.locator('.onboard-skip').click(); // skip the rest
  check((await page.locator('.onboard').count()) === 0, 'onboarding can be dismissed');
  await page.reload();
  check((await page.locator('.onboard').count()) === 0, 'onboarding does not reappear after dismissal');

  check(await page.locator('.header-logo').isVisible(), 'app loads with header');

  // ---- light / dark theme toggle (persists across reload) ----
  check(
    (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark',
    'starts in the dark theme'
  );
  await page.locator('.icon-btn[aria-label="Switch to light theme"]').click();
  check(
    (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light',
    'toggle switches to the light theme'
  );
  await page.reload();
  check(
    (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light',
    'the theme choice survives a reload'
  );
  await page.locator('.icon-btn[aria-label="Switch to dark theme"]').click(); // back to dark for the rest

  // ---- the home page IS the roadmap now ----
  check((await page.locator('.graph-node').count()) >= 15, 'home page shows the roadmap graph');
  check(await page.locator('.welcome-card').isVisible(), 'first visit shows the welcome/purpose card');
  check(
    await page.locator('.map-strip button', { hasText: 'Begin the path' }).isVisible(),
    'daily practice strip lives on the map home'
  );
  const fitsViewport = await page.evaluate(
    () => document.querySelector('.graph-canvas').getBoundingClientRect().width <= window.innerWidth
  );
  check(fitsViewport, 'the whole map fits the viewport width (scaled, no scroll box)');

  // pandas & SQL are OFF the algorithm map — separate data tracks below it
  check(
    (await page.locator('.graph-node', { hasText: 'pandas' }).count()) === 0 &&
      (await page.locator('.graph-node', { hasText: 'SQL' }).count()) === 0,
    'pandas and SQL are not nodes on the algorithm map'
  );
  check(
    (await page.locator('.data-track-card').count()) >= 2,
    'pandas and SQL appear as separate data-track cards'
  );

  // a data-track card opens its own dedicated map tree
  await page.locator('.data-track-card', { hasText: 'pandas' }).click();
  check(
    (await page.locator('.track-map-head h1').innerText()).toLowerCase().includes('pandas'),
    'the pandas card opens a dedicated pandas track map'
  );
  check((await page.locator('.graph-node').count()) >= 4, 'the pandas track map shows its sub-topics');
  await page.locator('.graph-node').first().click();
  await page.locator('.cat-modal').waitFor({ timeout: 5000 });
  check((await page.locator('.cat-q').count()) >= 1, 'a track-map node opens its questions');
  await page.locator('.cat-modal .icon-btn[aria-label="Close"]').click();
  await page.locator('.track-map-head .btn', { hasText: 'Back to the map' }).click();
  check((await page.locator('.graph-node').count()) >= 15, 'back returns to the algorithm map');

  // guided next step: what's next AND why it's worth doing
  check(await page.locator('.next-step-card').isVisible(), 'a guided "your next step" card is shown');
  check(
    (await page.locator('.next-step-why').innerText()).length > 20,
    'the next-step card explains why the question matters'
  );

  // clicking a topic opens its question list as a popup
  await page.locator('.graph-node', { hasText: 'Arrays & Hashing' }).click();
  await page.locator('.cat-modal').waitFor({ timeout: 5000 });
  check((await page.locator('.cat-q').count()) >= 5, 'topic popup lists its questions');
  await page.locator('.cat-q', { hasText: 'Two Sum' }).click();
  check(
    (await page.locator('.pv-title').innerText()).includes('Two Sum'),
    'clicking a question in the popup opens it'
  );

  // ---- premium learning layer on the problem ----
  check((await page.locator('.example-block').count()) >= 2, 'problem shows multiple worked examples');
  const exampleHeight = await page.locator('.example-block').first().evaluate((el) => el.clientHeight);
  check(exampleHeight >= 24, `examples are not squished/clipped (${exampleHeight}px tall)`);
  check(await page.locator('.why-card').isVisible(), 'problem shows a guided "why this one" card');
  check(
    (await page.locator('.constraints li').count()) >= 2,
    'problem shows a proper Constraints list'
  );
  check(
    (await page.locator('.go-deeper').count()) === 1,
    'an unlockable "go deeper" insight is offered'
  );
  await page.locator('.go-deeper > summary').click();
  check(
    (await page.locator('.go-deeper-body').innerText()).toLowerCase().includes('hash'),
    'go-deeper reveals the transferable insight'
  );
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();
  check((await page.locator('.graph-node').count()) >= 15, 'Back returns to the map it came from');

  // ---- global search palette (Ctrl+K) ----
  await page.keyboard.press('Control+k');
  await page.locator('.palette').waitFor({ timeout: 5000 });
  check(true, 'Ctrl+K opens the search palette');
  await page.locator('.palette-input').fill('anagram');
  check(
    (await page.locator('.palette-row').first().innerText()).toLowerCase().includes('anagram'),
    'palette fuzzy-matches question titles'
  );
  await page.keyboard.press('Enter');
  check(
    (await page.locator('.pv-title').innerText()).toLowerCase().includes('anagram'),
    'Enter in the palette opens the top match'
  );
  await page.keyboard.press('Escape'); // palette already closed; no-op safety
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();
  // "/" also opens it, and Escape closes it
  await page.keyboard.press('/');
  await page.locator('.palette').waitFor({ timeout: 5000 });
  await page.keyboard.press('Escape');
  check((await page.locator('.palette').count()) === 0, 'Escape closes the palette');

  // ---- the old home is now the Browse tab ----
  await page.locator('.icon-btn', { hasText: 'Browse' }).click();
  check((await page.locator('.q-card').count()) >= 123, 'Browse tab lists the full seed bank (123+)');
  check(
    (await page.locator('.q-card.q-next .q-title').innerText()).includes('Reverse a string'),
    'step 1 is marked "you are here" for a new user'
  );
  check(
    (await page.locator('.next-up').innerText()).includes('Step 1'),
    'today card names the next step on the path'
  );

  // ---- open first question, problem renders ----
  await page.locator('.q-card', { hasText: 'Character frequency' }).first().click();
  check(
    (await page.locator('.pane-problem').innerText()).includes('dict mapping each character'),
    'problem description renders'
  );
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();

  await page.locator('.q-card', { hasText: 'Two Sum' }).first().click();
  check(
    (await page.locator('.lang-badge').innerText()).includes('Python 3'),
    'editor shows the language/runtime badge'
  );

  // ---- focus mode: hide the problem, widen the editor (desktop) ----
  check(await page.locator('.pane-problem').isVisible(), 'problem pane visible by default');
  await page.locator('.pv-focus-toggle').click();
  check(!(await page.locator('.pane-problem').isVisible()), 'Focus hides the problem pane');
  await page.locator('.pv-focus-toggle').click();
  check(await page.locator('.pane-problem').isVisible(), 'toggling Focus brings the problem back');

  // ---- draggable divider + editor font preference (desktop) ----
  check(await page.locator('.pv-divider').isVisible(), 'a drag divider sits between problem and code');
  const widthBefore = (await page.locator('.pane-problem').boundingBox()).width;
  {
    const d = await page.locator('.pv-divider').boundingBox();
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2);
    await page.mouse.down();
    await page.mouse.move(d.x + 150, d.y + d.height / 2, { steps: 5 });
    await page.mouse.up();
  }
  const widthAfter = (await page.locator('.pane-problem').boundingBox()).width;
  check(widthAfter > widthBefore + 80, `dragging the divider widens the problem pane (${Math.round(widthBefore)} → ${Math.round(widthAfter)}px)`);
  const savedSplit = await page.evaluate(() => JSON.parse(localStorage.getItem('zoro.ui.v1')).split);
  check(savedSplit > 42, `the split persists to localStorage (${savedSplit}%)`);
  await page.locator('.pv-divider').dblclick();
  check(
    (await page.evaluate(() => JSON.parse(localStorage.getItem('zoro.ui.v1')).split)) === 42,
    'double-click resets the split to the default'
  );
  const fontBefore = await page.locator('.cm-editor').evaluate((el) => getComputedStyle(el).fontSize);
  await page.locator('button[aria-label="Larger editor font"]').click();
  await page.locator('button[aria-label="Larger editor font"]').click();
  const fontAfter = await page.locator('.cm-editor').evaluate((el) => getComputedStyle(el).fontSize);
  check(
    fontBefore === '14px' && fontAfter === '16px',
    `A+ grows the editor font and it applies live (${fontBefore} → ${fontAfter})`
  );
  check(
    (await page.evaluate(() => JSON.parse(localStorage.getItem('zoro.ui.v1')).fontSize)) === 16,
    'the font size persists to localStorage'
  );
  await page.locator('button[aria-label="Smaller editor font"]').click();
  await page.locator('button[aria-label="Smaller editor font"]').click();

  // ---- the "stuck ladder": climb rung by rung, code is the last rung ----
  check(await page.locator('.stuck').isVisible(), 'a stuck-when-you-need-it ladder is shown');
  check(
    (await page.locator('.stuck-next').count()) === 1,
    'only the next rung is offered — you climb one at a time'
  );
  // Rung 1: pattern. Reveal it and check it names a technique, not the answer.
  await page.locator('.stuck-next', { hasText: 'Which pattern is this?' }).click();
  check(
    (await page.locator('.stuck-rung.open').first().innerText()).includes('Reach for'),
    'rung 1 tells you the pattern to reach for'
  );
  // Climb to the code rung (the last one) and confirm the approaches appear.
  for (let i = 0; i < 4; i++) {
    const next = page.locator('.stuck-next');
    if ((await next.count()) === 0) break;
    await next.first().click();
  }
  check(
    await page.locator('.approach-tab', { hasText: 'Brute force' }).isVisible(),
    'the final rung reveals the code — brute force → optimal'
  );
  check(
    await page.locator('.approach-tab', { hasText: 'Hash map' }).isVisible(),
    'and the optimal hash-map approach'
  );
  await page.locator('.approach-tab', { hasText: 'Hash map' }).click();
  check(
    (await page.locator('.approaches .solution-pre').innerText()).includes('seen'),
    'switching approach tab swaps the shown code'
  );
  check(
    await page.locator('.stuck-youtube').isVisible(),
    'a YouTube escape hatch waits at the bottom of the ladder'
  );

  // ---- failure path: wrong answer, run via the Ctrl+Enter shortcut ----
  await setEditor(page, 'def two_sum(nums, target):\n    return [0, 0]');
  await page.keyboard.press('Control+Enter'); // Run without touching the button
  await page.locator('.result-summary').waitFor({ timeout: 120000 }); // first run loads Pyodide
  check((await resultText(page)).includes('tests passed'), 'Ctrl+Enter runs Python from the editor');
  check(/✗ \d\/5 tests passed/.test(await resultText(page)), 'wrong answer shows failed tests');
  const failText = await resultText(page);
  check(
    failText.includes('Expected') && failText.includes('Your output'),
    'failed test shows Expected vs Your output'
  );
  check(failText.includes('two_sum('), 'failed test shows the exact call as Input');

  // ---- failure path: renamed function ----
  await setEditor(page, 'def wrong_name(nums, target):\n    return [0, 1]');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.error-box').waitFor({ timeout: 30000 });
  check(
    (await resultText(page)).includes('keep the starter'),
    'renamed function gets a friendly error'
  );

  // ---- failure path: syntax error ----
  await setEditor(page, 'def two_sum(nums target):\n    pass');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.error-box').waitFor({ timeout: 30000 });
  check((await resultText(page)).includes('Syntax error'), 'syntax error surfaced');

  // ---- correct solution: Run then Submit ----
  const solution =
    'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i';
  await setEditor(page, solution);
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.result-summary.pass').waitFor({ timeout: 60000 });
  check((await resultText(page)).includes('5/5 tests passed'), 'correct solution passes all tests');

  await page.locator('.pv-toolbar button', { hasText: 'Submit' }).click();
  await page.locator('.solved-banner').waitFor({ timeout: 60000 });
  check(true, 'Submit marks the problem solved');
  check(
    /Solved in \d/.test(await page.locator('.solved-banner').innerText()),
    'the banner reports how long the first solve took'
  );

  // ---- Big-O check-in: the interviewer follow-up, on every solve ----
  check(await page.locator('.bigo').isVisible(), 'solving raises the what-was-your-Big-O check');
  check((await page.locator('.bigo-chip').count()) === 6, 'six complexity buckets to pick from');
  await page.locator('.bigo-chip', { hasText: 'O(n log n)' }).click();
  check(
    (await page.locator('.bigo-answer').innerText()).includes('Not quite'),
    'a wrong pick is called out against the model'
  );
  check(
    (await page.locator('.bigo-answer').innerText()).includes('O(n) time'),
    'the model complexity is revealed either way'
  );
  check(
    (await page.evaluate(() => JSON.parse(localStorage.getItem('zoro.progress.v1')).bigo)).wrong === 1,
    'the check-in result is recorded for the accuracy stat'
  );
  check((await page.locator('.streak').innerText()).includes('1 day'), 'streak increments');

  // ---- solve → next: the flow never dead-ends ----
  check(
    (await page.locator('.next-q-btn').innerText()).includes('Reverse a string'),
    'the solved banner offers the next unsolved path step'
  );
  await page.locator('.next-q-btn').click();
  check(
    (await page.locator('.pv-title').innerText()).includes('Reverse a string'),
    'clicking Next jumps straight into the next question'
  );

  // ---- personal notes: saved, and they survive a reload ----
  await page.locator('.notes > summary').click();
  await page.fill('.notes-input', 'slice trick: s[::-1] — remember negative step');
  await page.waitForTimeout(700); // let the debounce save
  await page.reload();
  await page.locator('.icon-btn', { hasText: 'Browse' }).click();
  await page.locator('.q-card', { hasText: 'Reverse a string' }).first().click();
  check(
    (await page.locator('.notes-input').inputValue()).includes('slice trick'),
    'a personal note persists across reload'
  );

  // ---- persistence across reload ----
  await page.reload();
  await page.locator('.icon-btn', { hasText: 'Browse' }).click();
  const twoSumCard = page.locator('.q-card', { hasText: 'Two Sum' }).first();
  check(
    (await twoSumCard.locator('.pill').innerText()).trim() === 'learning',
    'solve persists after reload (mastery pill turns "learning")'
  );
  const storedDraft = await page.evaluate(
    () => JSON.parse(localStorage.getItem('zoro.progress.v1') || '{}')?.drafts?.['py-two-sum'] || ''
  );
  check(storedDraft.includes('seen[n] = i'), 'draft code saved to localStorage');
  await twoSumCard.click();
  const editorShowsDraft = await page
    .waitForFunction(
      () => document.querySelector('.cm-content')?.innerText.includes('seen[n] = i'),
      null,
      { timeout: 10000 }
    )
    .then(() => true)
    .catch(() => false);
  check(editorShowsDraft, 'draft code persists after reload');

  // ---- failure path: infinite loop killed by the 5s watchdog ----
  await setEditor(page, 'def two_sum(nums, target):\n    while True:\n        pass');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.error-box').waitFor({ timeout: 120000 });
  check(
    (await resultText(page)).includes('Time limit exceeded'),
    'infinite loop killed with friendly timeout message'
  );

  // ---- SQL: correct, wrong (visual diff), and syntax error ----
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();
  await page.locator('.q-card', { hasText: 'Strong swordsmen' }).first().click();
  // every question — pandas & SQL included — carries the premium learning UI
  check(
    (await page.locator('.pane-problem .why-card').innerText()).includes('SELECT'),
    'SQL questions also show the guided "why this one" card'
  );
  await setEditor(page, 'SELECT name, power FROM fighters WHERE power >= 80 ORDER BY power DESC;');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.result-summary').first().waitFor({ timeout: 60000 });
  check((await resultText(page)).includes('Correct result'), 'correct SQL passes');

  await setEditor(page, 'SELECT name, power FROM fighters ORDER BY power;');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.sql-diff').waitFor({ timeout: 30000 });
  const sqlText = await resultText(page);
  check(
    sqlText.includes('Your result') && sqlText.includes('Expected'),
    'wrong SQL shows side-by-side visual diff tables'
  );

  await setEditor(page, 'SELEC name FROM fighters;');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.error-box').waitFor({ timeout: 30000 });
  check((await resultText(page)).includes('syntax error'), 'SQLite error shown verbatim');

  // ---- offline import: paste a question, verify in the runner, add it ----
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();
  await page.locator('button', { hasText: '＋ Import questions' }).click();
  const goodPack = JSON.stringify({
    questions: [
      {
        id: 'smoke-import-echo',
        track: 'python',
        title: 'Smoke Double',
        difficulty: 'easy',
        pattern: 'smoke',
        description: 'Return n doubled.',
        examples: ['double(2) -> 4'],
        function_name: 'double',
        starter_code: 'def double(n):\n    ...',
        hint: 'multiply by two',
        solution: 'def double(n):\n    return n * 2',
        tests: [
          { args: [2], expected: 4 },
          { args: [0], expected: 0 },
          { args: [-3], expected: -6 },
          { args: [10], expected: 20 },
        ],
      },
    ],
  });
  await page.fill('#import-json', goodPack);
  await page.locator('.modal button', { hasText: 'Import & verify' }).click();
  await page.locator('.import-result').waitFor({ timeout: 60000 });
  check(
    (await page.locator('.import-result').innerText()).includes('Added 1'),
    'imported question is verified in the runner and added (no AI, offline)'
  );
  // a solution that fails its own tests must be rejected
  await page.fill(
    '#import-json',
    JSON.stringify({ ...JSON.parse(goodPack).questions[0], id: 'smoke-bad', solution: 'def double(n):\n    return n * 3' })
  );
  await page.locator('.modal button', { hasText: 'Import & verify' }).click();
  await page.locator('.reject-list').waitFor({ timeout: 60000 });
  check(
    (await page.locator('.import-result').innerText()).includes('Rejected 1'),
    'import rejects a question whose solution fails its own tests'
  );
  await page.locator('.modal').getByRole('button', { name: /^(Close|Done)$/ }).click();

  // ---- practice session: reviews-before-new gating + confidence rating ----
  await page.evaluate(() => {
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const solved = { firstSolvedAt: today, attempts: 1, solves: 1, lastSolvedAt: today };
    localStorage.setItem(
      'zoro.progress.v1',
      JSON.stringify({
        solved: { 'py-contains-duplicate': { ...solved }, 'py-two-sum': { ...solved } },
        drafts: {},
        srs: {
          'py-contains-duplicate': { stage: 0, nextDue: today },
          'py-two-sum': { stage: 0, nextDue: today },
        },
        streak: { count: 1, lastActiveDate: today },
        notes: {
          'py-contains-duplicate': 'set() beats sorting here — one pass',
          'py-two-sum': 'store value -> index, look up the complement',
        },
      })
    );
  });
  await page.reload();
  check(
    (await page.locator('.map-strip').innerText()).includes('2 review'),
    'map home strip shows 2 reviews due'
  );
  await page.locator('.icon-btn', { hasText: 'Browse' }).click();
  check((await page.locator('.today-line').innerText()).includes('2 review'), 'today card shows 2 reviews due');

  await page.locator('button', { hasText: 'Start review' }).click();
  check((await page.locator('.phase-pill').innerText()).includes('Review'), 'session opens in the review phase');

  const SOLUTIONS = {
    'Contains Duplicate': 'def contains_duplicate(nums):\n    return len(set(nums)) != len(nums)',
    'Two Sum':
      'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i',
  };
  for (let r = 0; r < 2; r++) {
    const heading = (await page.locator('.pv-title').innerText()).trim();
    const title = Object.keys(SOLUTIONS).find((t) => heading.includes(t));
    await setEditor(page, SOLUTIONS[title]);
    await page.locator('.pv-toolbar button', { hasText: 'Submit' }).click();
    await page.locator('.reflect').waitFor({ timeout: 60000 });
    check(await page.locator('.rating-btn.rating-good').isVisible(), `review ${r + 1}: reflect + rating shown`);
    if (r === 0) {
      check(
        await page.locator('.past-note').isVisible(),
        'your past note resurfaces when the review comes back'
      );
    }
    await page.locator('.rating-btn.rating-good').click();
  }
  check(
    (await page.locator('.phase-pill').innerText()).includes('New'),
    'new questions unlock only after every review is cleared'
  );
  check(
    (await page.locator('.pv-title').innerText()).includes('Reverse a string'),
    'after reviews, the path continues at the lowest unsolved step (step 1)'
  );
  await page.locator('.icon-btn[aria-label="End practice session"]').click();
  check(await page.locator('.today-card').isVisible(), 'End session returns to the dojo');

  // ---- drill today's misses ----
  await page.evaluate(() => {
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    localStorage.setItem(
      'zoro.progress.v1',
      JSON.stringify({
        solved: {
          'py-contains-duplicate': { firstSolvedAt: today, attempts: 2, solves: 1, mistakes: 1, lastSolvedAt: today },
        },
        drafts: {},
        srs: { 'py-contains-duplicate': { stage: 0, nextDue: '2999-01-01' } },
        streak: { count: 1, lastActiveDate: today },
        activity: {
          [today]: { visited: true, solves: 1, fails: 1, missed: ['py-contains-duplicate'], goalMet: false },
        },
      })
    );
  });
  await page.reload();
  check(
    (await page.locator('.btn-drill').first().innerText()).includes('1'),
    "drill button shows today's miss count"
  );
  await page.locator('.btn-drill').click();
  check((await page.locator('.phase-pill').innerText()).includes('Drill'), 'drill session shows the drill phase');
  await setEditor(page, 'def contains_duplicate(nums):\n    return len(set(nums)) != len(nums)');
  await page.locator('.pv-toolbar button', { hasText: 'Submit' }).click();
  await page.locator('.reflect').waitFor({ timeout: 60000 });
  await page.locator('.rating-btn.rating-good').click();
  await page.locator('.session-done').waitFor({ timeout: 30000 });
  check(true, 'drill completes after re-clearing the miss');
  await page.locator('.session-done button', { hasText: 'Back to the dojo' }).click();

  // ---- Patterns reference (templates you must know) ----
  await openLibrary(page, 'Patterns');
  check((await page.locator('.pattern-card').count()) >= 12, 'Patterns page lists the core patterns');
  await page.locator('.pattern-card-head', { hasText: 'Hashing' }).click();
  check(
    (await page.locator('.pattern-template').first().innerText()).includes('seen'),
    'expanding a pattern shows its code template'
  );
  check(
    (await page.locator('.pattern-complexity').first().innerText()).includes('O('),
    'the template shows its complexity'
  );
  check(
    (await page.locator('.pattern-cue').count()) >= 2,
    'the pattern shows recognition cues'
  );
  await page.locator('.pattern-drill-q', { hasText: 'Two Sum' }).first().click();
  check(
    (await page.locator('.pv-title').innerText()).includes('Two Sum'),
    'a drill link opens the problem'
  );
  // the stuck ladder links back to the pattern template (still on the problem)
  await page.locator('.stuck-next', { hasText: 'Which pattern' }).click();
  await page.locator('.rung-link').click();
  check(
    (await page.locator('.pattern-card.open').count()) >= 1,
    'the stuck ladder jumps straight to this problem\'s pattern template'
  );

  // ---- pattern-recognition quiz ----
  await page.locator('.patterns-quiz-btn').click();
  await page.locator('.quiz-options').waitFor({ timeout: 5000 });
  check((await page.locator('.quiz-option').count()) === 4, 'quiz offers four pattern options');
  check((await page.locator('.quiz-count').innerText()).includes('/ 10'), 'quiz runs a 10-question round');
  await page.locator('.quiz-option').first().click();
  check(
    (await page.locator('.quiz-option.correct').count()) === 1,
    'answering reveals the correct pattern'
  );
  check(await page.locator('.quiz-feedback').isVisible(), 'quiz explains when to reach for the pattern');
  await page.locator('.quiz-next').click();
  check(
    (await page.locator('.quiz-count').innerText()).includes('2 / 10'),
    'Next advances the quiz'
  );
  await page.locator('.quiz-bar .icon-btn[aria-label="Quit quiz"]').click();
  check(await page.locator('.patterns-quiz-btn').isVisible(), 'quitting returns to Patterns');
  await page.locator('.header-logo').click();

  // ---- Sensei guide + attendance calendar ----
  await page.locator('.hdr-menu-btn').click();
  check((await page.locator('.hdr-menu-pop button').count()) === 3, 'Library menu holds Stats / Patterns / Sensei');
  await page.keyboard.press('Escape');
  check((await page.locator('.hdr-menu-pop').count()) === 0, 'Esc closes the Library menu');
  await openLibrary(page, 'Sensei');
  check(await page.locator('.guide-page h1').isVisible(), 'Sensei guide page renders');
  check((await page.locator('.hdr-menu-pop').count()) === 0, 'picking an item closes the menu');
  await openLibrary(page, 'Stats');
  check(await page.locator('.calendar-block').isVisible(), 'Stats page shows the attendance calendar');

  // ---- review forecast + backup nudge (seeded: 8 solves, reviews spread out) ----
  await page.evaluate(() => {
    const today = new Date();
    const day = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    const p = JSON.parse(localStorage.getItem('zoro.progress.v1'));
    const ids = ['py-reverse-string', 'py-fizzbuzz', 'py-common-elements', 'py-two-sum', 'py-valid-anagram', 'py-contains-duplicate', 'py-valid-palindrome', 'py-binary-search'];
    const iso = new Date().toISOString();
    for (const id of ids) p.solved[id] = { firstSolvedAt: iso, attempts: 1, solves: 1, lastSolvedAt: iso };
    // three timed easy solves -> the readiness pace dimension unlocks
    p.solved['py-reverse-string'].firstSolveMs = 5 * 60000;
    p.solved['py-fizzbuzz'].firstSolveMs = 8 * 60000;
    p.solved['py-two-sum'].firstSolveMs = 12 * 60000;
    p.srs = {
      'py-reverse-string': { stage: 0, nextDue: day(-1) }, // overdue -> today
      'py-fizzbuzz': { stage: 0, nextDue: day(0) },
      'py-two-sum': { stage: 1, nextDue: day(2) },
      'py-valid-anagram': { stage: 1, nextDue: day(2) },
      'py-binary-search': { stage: 2, nextDue: day(5) },
    };
    localStorage.setItem('zoro.progress.v1', JSON.stringify(p));
    localStorage.removeItem('zoro.backup.v1');
  });
  await page.reload();
  await openLibrary(page, 'Stats');
  // readiness card: score, four dimensions, pace vs target, advice
  check(await page.locator('.ready-card').isVisible(), 'Stats leads with the interview-readiness card');
  const readyScore = Number(await page.locator('.ready-num').innerText());
  check(readyScore > 0 && readyScore < 100, `readiness score is a real 0-100 number (${readyScore})`);
  check((await page.locator('.ready-part').count()) === 4, 'readiness breaks into 4 scored dimensions');
  check(
    (await page.locator('.ready-pace-row').innerText()).includes('vs'),
    'pace chip compares your median to the target time'
  );
  check((await page.locator('.ready-advice').innerText()).includes('Biggest gap'), 'the card says what to fix first');

  check((await page.locator('.fc-day').count()) === 7, 'review forecast shows the next 7 days');
  const fcToday = await page.locator('.fc-day').first().innerText();
  check(fcToday.includes('2') && fcToday.includes('today'), `overdue+due reviews land on today (${fcToday.replace(/\s+/g, ' ')})`);
  check((await page.locator('.fc-bar.due-now').count()) === 1, "today's bar is highlighted");
  check(await page.locator('.backup-nudge').isVisible(), '8+ unbacked-up solves raise the backup nudge');
  check(await page.locator('.header .backup-dot').isVisible(), 'the Settings button carries a nudge dot');
  await page.locator('.backup-nudge .btn').click();
  check((await page.locator('.backup-nudge').count()) === 0, 'Back up now clears the nudge');
  check(
    (await page.evaluate(() => localStorage.getItem('zoro.backup.v1'))) === new Date().toISOString().slice(0, 10),
    'the backup date is recorded'
  );
  // Settings shows the recorded date
  await page.locator('.icon-btn[aria-label="Settings"]').click();
  check((await page.locator('.last-backup').innerText()).includes('Last backup:'), 'Settings shows the last-backup date');
  await page.locator('.modal .btn-primary', { hasText: 'Done' }).click();

  // ---- weak-spot chips on the home map ----
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('zoro.progress.v1'));
    p.solved['py-two-sum'] = { ...p.solved['py-two-sum'], mistakes: 4 };
    p.solved['py-valid-anagram'] = { ...p.solved['py-valid-anagram'], mistakes: 2 };
    localStorage.setItem('zoro.progress.v1', JSON.stringify(p));
  });
  await page.reload();
  // today pulse: real solves happened earlier in this run, so it shows live counts
  check(await page.locator('.today-strip').isVisible(), 'home shows a Today pulse strip');
  const pulseText = await page.locator('.today-strip').innerText();
  check(/[1-9]\d* solved/.test(pulseText), `pulse counts today's solves (${pulseText.match(/\d+ solved/)?.[0]})`);
  check(/Readiness \d+\/100/.test(pulseText.replace(/\s+/g, ' ')), 'pulse carries the readiness score');
  await page.locator('.today-ready').click();
  check(await page.locator('.ready-card').isVisible(), 'the readiness chip jumps to the Stats breakdown');
  await page.locator('.header-logo').click();
  check((await page.locator('.weak-chip').count()) === 2, 'repeat-miss questions surface as chips on home');
  const firstChip = await page.locator('.weak-chip').first().innerText();
  check(firstChip.includes('Two Sum') && firstChip.includes('✗4'), `worst offender leads (${firstChip.replace(/\s+/g, ' ')})`);
  await page.locator('.weak-chip').first().click();
  await page.locator('.editor-bar').waitFor({ timeout: 10000 });
  check(
    (await page.locator('.problem-view').innerText()).includes('Two Sum'),
    'a weak-spot chip reopens the problem'
  );
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();

  // ---- roadmap home after real progress ----
  check(
    (await page.locator('.graph-edges path[marker-end]').count()) >= 10,
    'roadmap draws "learn this first" arrows between topics'
  );

  // ---- algorithm visualizer: replays a real traced execution ----
  await page.locator('.graph-node', { hasText: 'Arrays & Hashing' }).click();
  await page.locator('.cat-q', { hasText: 'Two Sum' }).click();
  // climb the stuck ladder to the code rung, then Visualize
  for (let i = 0; i < 4; i++) {
    const next = page.locator('.stuck-next');
    if ((await next.count()) === 0) break;
    await next.first().click();
  }
  await page.locator('.btn-viz').first().click();
  await page.locator('.viz-modal').waitFor({ timeout: 60000 });
  check(await page.locator('.viz-plan > summary').isVisible(), "the approach's idea chip is in the modal");
  await page.locator('.viz-line.active').waitFor({ timeout: 120000 });
  check(true, 'visualizer traces the solution and highlights the current line');
  // the hero is the single reading spot: narration + the source line
  check(await page.locator('.viz-hero-why').isVisible(), 'a plain-English hero sentence leads each step');
  check(
    (await page.locator('.viz-hero .viz-src').innerText()).includes('line'),
    'the hero shows the source line inline (no separate caption to scan)'
  );
  // nothing outside the panes should require page scrolling
  const noModalScroll = await page.evaluate(() => {
    const m = document.querySelector('.viz-modal');
    return m.scrollHeight <= m.clientHeight + 1;
  });
  check(noModalScroll, 'the modal fits without page scrolling (panes scroll internally)');
  const stepBefore = await page.locator('.viz-step-count').innerText();
  check(/Step 1 \/ \d+/.test(stepBefore), `visualizer starts at step 1 of N (${stepBefore.trim()})`);
  await page.locator('button[aria-label="Next step"]').click();
  check(
    (await page.locator('.viz-step-count').innerText()) !== stepBefore,
    'stepping forward advances the trace'
  );
  check((await page.locator('.viz-var').count()) >= 2, 'variable panel shows the local variables');
  // step through: a variable lights up, the hero carries live values, and a
  // "just happened" effect line summarizes the change in place
  let sawWhy = false;
  let sawChanged = false;
  let sawEffect = false;
  for (;;) {
    if (!sawChanged && (await page.locator('.viz-var.changed').count()) > 0) sawChanged = true;
    if (!sawEffect && (await page.locator('.viz-effect').count()) > 0) sawEffect = true;
    if (
      !sawWhy &&
      (await page.locator('.viz-hero-why').count()) > 0 &&
      /\(= .*\)/.test(await page.locator('.viz-hero-why').innerText())
    ) {
      sawWhy = true;
    }
    if (sawWhy && sawChanged && sawEffect) break;
    if (await page.locator('button[aria-label="Next step"]').isDisabled()) break;
    await page.locator('button[aria-label="Next step"]').click();
  }
  check(sawWhy, 'each step narrates WHY it runs, with live values plugged in');
  check(sawChanged, 'the variable that just changed is highlighted');
  check(sawEffect, 'a "just happened" line summarizes the change (w: \'nat\' → \'bat\')');
  await page.locator('.icon-btn[aria-label="Close visualizer"]').click();
  check((await page.locator('.viz-modal').count()) === 0, 'visualizer closes');

  // ---- visualize MY code: the tracer runs whatever is in the editor ----
  await setEditor(
    page,
    'def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]'
  );
  await page.locator('button', { hasText: 'Visualize my code' }).click();
  await page.locator('.viz-modal').waitFor({ timeout: 60000 });
  check(
    (await page.locator('.viz-label').innerText()).includes('Your code'),
    'Visualize my code opens the tracer on the editor contents'
  );
  await page.locator('.viz-line.active').waitFor({ timeout: 60000 });
  check(
    (await page.locator('.viz-code').innerText()).includes('for j in range'),
    "the traced source is the user's own code"
  );
  // pointer overlay: i/j get ▲ markers under the exact cells they index, and
  // the window between them is shaded
  let sawPtr = false;
  let sawSpan = false;
  for (let s = 0; s < 40; s++) {
    if (!sawPtr && (await page.locator('.viz-ptr').count()) > 0) {
      const labels = await page.locator('.viz-ptr').allInnerTexts();
      sawPtr = labels.some((t) => t.includes('i')) || labels.some((t) => t.includes('j'));
    }
    if (!sawSpan && (await page.locator('.viz-cell.in-span').count()) > 0) sawSpan = true;
    if (sawPtr && sawSpan) break;
    if (await page.locator('button[aria-label="Next step"]').isDisabled()) break;
    await page.locator('button[aria-label="Next step"]').click();
  }
  check(sawPtr, 'pointer markers (▲ i / ▲ j) appear under the cells they index');
  check(sawSpan, 'the window between two pointers is shaded');
  await page.locator('.icon-btn[aria-label="Close visualizer"]').click();
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();

  // ---- warm-up mode: rapid-fire typing drills ----
  await page.locator('.btn-warmup').click();
  check((await page.locator('.wu-level-card').count()) === 3, 'warm-up offers 3 difficulty levels');
  await page.locator('.wu-level-card', { hasText: 'Beginner' }).click();
  await page.locator('.wu-prompt').waitFor({ timeout: 10000 });
  check(await page.locator('.wu-timerbar').isVisible(), 'warm-up run shows the countdown timer');
  for (let i = 0; i < 3; i++) {
    const prompt = (await page.locator('.wu-prompt').innerText()).trim();
    const wuItem = WARMUP_SETS.beginner.find((it) => it.prompt === prompt);
    check(!!wuItem, `warm-up question ${i + 1} comes from the beginner bank`);
    await page.fill('.wu-input', wuItem.answer);
    await page.keyboard.press('Enter');
  }
  check(
    (await page.locator('.wu-run-streak').innerText()).includes('3'),
    'three correct answers build the streak'
  );
  await page.fill('.wu-input', 'definitely_wrong()');
  await page.keyboard.press('Enter');
  await page.locator('.wu-miss').waitFor({ timeout: 5000 });
  const wuSummary = await page.locator('.warmup').innerText();
  check(wuSummary.includes('3/50'), 'summary reports 3/50 answered');
  check(wuSummary.includes('definitely_wrong()'), 'summary shows what you typed');
  check(
    await page.locator('.wu-miss .wu-good').isVisible(),
    'summary shows the correct answer to learn from'
  );
  await page.locator('button', { hasText: 'Change level' }).click();
  check(
    (await page.locator('.wu-level-card', { hasText: 'Beginner' }).innerText()).includes('best 3/50'),
    'best streak persists on the level card'
  );
  await page.locator('button', { hasText: '← Back to the dojo' }).click();

  // ---- mock interview: timed, hints locked, debrief ----
  await page.locator('.btn-mock').click();
  check((await page.locator('.mock-format-card').count()) >= 3, 'mock offers multiple interview rounds');
  await page.locator('.mock-format-card', { hasText: 'Warm-up round' }).click();
  await page.locator('.mock-timer').waitFor({ timeout: 10000 });
  check(await page.locator('.mock-timer').isVisible(), 'mock coding view shows a live countdown');
  check(await page.locator('.mock-reminder').isVisible(), 'mock shows the think-out-loud checklist');
  check(
    (await page.locator('.pane-problem .hint').count()) === 0,
    'hints and solution are locked during the interview'
  );
  // End the interview → debrief
  await page.locator('.icon-btn[aria-label="End interview"]').click();
  await page.locator('.mock-verdict').waitFor({ timeout: 5000 });
  check(await page.locator('.mock-rubric').isVisible(), 'debrief asks the interviewer-graded rubric');
  await page.locator('.mock-q', { hasText: 'clarify' }).locator('.seg-btn', { hasText: 'yes' }).click();
  await page.fill('.mock-input', 'O(n) time, O(n) space');
  check(
    await page.locator('.mock-actual').isVisible(),
    'stating your Big-O prompts a comparison against the model'
  );
  await page.locator('.mock-q', { hasText: 'talk through' }).locator('.seg-btn', { hasText: 'Clear' }).click();
  await page.locator('button', { hasText: 'Reveal the model solution' }).click();
  check(await page.locator('.mock-solution .solution-pre').first().isVisible(), 'model solution revealed in the debrief');
  await page.locator('button', { hasText: 'Record & finish' }).click();
  check((await page.locator('.graph-node').count()) >= 15, 'finishing a mock returns to the dojo');
  // the mock is logged on the Stats page
  await openLibrary(page, 'Stats');
  check(
    (await page.locator('.mock-log-row').count()) >= 1,
    'the completed interview is recorded on the Stats page'
  );
  await page.locator('.header-logo').click();

  // ---- celebration: crossing a belt threshold pops a milestone ----
  await page.evaluate(() => {
    const today = new Date().toISOString().slice(0, 10);
    const s = { firstSolvedAt: today, attempts: 1, solves: 1, lastSolvedAt: today };
    // 3 solved => White belt, one solve away from Yellow (threshold 4)
    localStorage.setItem(
      'zoro.progress.v1',
      JSON.stringify({
        solved: { 'py-reverse-string': { ...s }, 'py-fizzbuzz': { ...s }, 'py-common-elements': { ...s } },
        drafts: {},
        srs: {},
        streak: { count: 1, lastActiveDate: today },
      })
    );
  });
  await page.reload();
  await page.locator('.icon-btn', { hasText: 'Browse' }).click();
  await page.locator('.q-card', { hasText: 'Two Sum' }).first().click();
  await setEditor(
    page,
    'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i'
  );
  await page.locator('.pv-toolbar button', { hasText: 'Submit' }).click();
  await page.locator('.celebration').waitFor({ timeout: 60000 });
  check(
    (await page.locator('.celebration').innerText()).includes('Yellow'),
    'crossing to the 4th solve pops a Yellow-belt celebration'
  );
  check(await page.locator('.confetti').isVisible(), 'the celebration has a confetti burst');
  await page.locator('.celebration button', { hasText: 'Keep going' }).click();
  check((await page.locator('.celebration').count()) === 0, 'celebration dismisses');

  check(pageErrors.length === 0, `no uncaught page errors${pageErrors.length ? `: ${pageErrors[0]}` : ''}`);
  await page.close();

  // ================= mobile (375px) =================
  const mobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await mobile.goto(BASE);
  // dismiss the first-run onboarding (fresh context => it shows again)
  const mobileSkip = mobile.locator('.onboard-skip');
  if (await mobileSkip.isVisible().catch(() => false)) await mobileSkip.click();
  const noHScrollMap = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  check(noHScrollMap, 'mobile: the map home scales down with no horizontal scroll');
  check(
    (await mobile.locator('.graph-node').count()) >= 15,
    'mobile: the whole roadmap is visible on a phone'
  );

  await mobile.locator('.icon-btn', { hasText: 'Browse' }).click();
  const noHScroll = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  check(noHScroll, 'mobile: no horizontal scroll on picker');

  await mobile.locator('.q-card', { hasText: 'FizzBuzz' }).first().click();
  check(await mobile.locator('.pv-tabs').isVisible(), 'mobile: tabbed panes appear under 900px');
  check(
    await mobile.locator('.pane-problem').isVisible(),
    'mobile: Problem tab shown by default'
  );
  await mobile.locator('.pv-tab', { hasText: 'Code' }).click();
  check(await mobile.locator('.cm-content').isVisible(), 'mobile: Code tab shows the editor');

  // ---- mobile coding keys: the strip phone keyboards are missing ----
  check(await mobile.locator('.mkeys').isVisible(), 'mobile: a coding key strip sits above the editor');
  check((await mobile.locator('.mkey').count()) >= 18, 'mobile: symbols, indent and Run/Submit are one tap away');
  check(!(await mobile.locator('.pv-toolbar .kbd-hint').first().isVisible()), 'mobile: desktop shortcut hints are hidden');
  check(!(await mobile.locator('.header .belt-chip').isVisible()), 'mobile: header sheds status chrome on phones');
  await mobile.click('.cm-content');
  await mobile.keyboard.press('ControlOrMeta+a');
  await mobile.keyboard.press('Delete');
  await mobile.locator('.mkey', { hasText: '#' }).click();
  await mobile.locator('.mkey', { hasText: ':' }).click();
  await mobile.locator('.mkey', { hasText: '⇥' }).click();
  const mline = await mobile.locator('.cm-line').first().innerText();
  check(mline.includes('#:'), 'mobile: tapping strip keys types into the editor');
  check(/^\s{4}/.test(mline.replace(/\u00a0/g, ' ')), 'mobile: the indent key indents the line');
  await mobile.locator('.mkey', { hasText: '⇤' }).click();
  const mline2 = await mobile.locator('.cm-line').first().innerText();
  check(!/^\s/.test(mline2.replace(/\u00a0/g, ' ')), 'mobile: the dedent key walks it back');
  await mobile.locator('.pv-tab', { hasText: 'Result' }).click();
  check(await mobile.locator('.pane-result').isVisible(), 'mobile: Result tab works');
  const noHScroll2 = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  check(noHScroll2, 'mobile: no horizontal scroll in problem view');
  await mobile.close();

  // ================= PWA: installable + works offline =================
  const pwa = await browser.newPage();
  await pwa.goto(BASE);
  check(
    (await pwa.locator('link[rel="manifest"]').count()) === 1,
    'PWA: the page links a web app manifest'
  );
  const manifest = await pwa.evaluate(async () => {
    const res = await fetch('manifest.webmanifest');
    return res.ok ? res.json() : null;
  });
  check(
    manifest?.name === 'ZoroClaude Dojo' && manifest.icons?.length >= 2,
    'PWA: manifest resolves with name and icons'
  );
  const iconOk = await pwa.evaluate(async () => (await fetch('icons/icon-192.png')).ok);
  check(iconOk, 'PWA: the home-screen icon is served');
  // production build registers the SW; wait for it to take control
  await pwa.evaluate(() => navigator.serviceWorker.ready);
  await pwa.reload(); // now the shell + assets are fetched under SW control
  await pwa.locator('.header-logo').waitFor();
  await pwa.context().setOffline(true);
  await pwa.reload();
  await pwa.locator('.header-logo').waitFor({ timeout: 10000 });
  check(
    (await pwa.locator('.graph-node').count()) >= 15,
    'PWA: with the network cut, the app still opens (offline shell)'
  );
  await pwa.context().setOffline(false);
  await pwa.close();
} finally {
  await browser.close();
  killServer();
}

console.log(failures === 0 ? '\nSmoke test green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
