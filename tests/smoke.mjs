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

try {
  // ================= desktop =================
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(BASE);
  check(await page.locator('.header-logo').isVisible(), 'app loads with header');
  check((await page.locator('.q-card').count()) >= 123, 'picker lists the full seed bank (123+)');
  check(await page.locator('.welcome-card').isVisible(), 'first visit shows the welcome/purpose card');
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

  // ---- multi-approach solution viewer (brute force → optimal) ----
  await page.locator('.pane-problem details.hint summary', { hasText: 'Show solution' }).click();
  check(
    await page.locator('.approach-tab', { hasText: 'Brute force' }).isVisible(),
    'solution shows a Brute force approach tab'
  );
  check(
    await page.locator('.approach-tab', { hasText: 'Hash map' }).isVisible(),
    'solution shows the optimal Hash map approach tab'
  );
  check(
    (await page.locator('.approach-complexity').first().innerText()).includes('O(n'),
    'approach shows its complexity'
  );
  await page.locator('.approach-tab', { hasText: 'Hash map' }).click();
  check(
    (await page.locator('.approaches .solution-pre').innerText()).includes('seen'),
    'switching approach tab swaps the shown code'
  );
  await page.locator('.pane-problem details.hint summary', { hasText: 'Show solution' }).click();

  // ---- failure path: wrong answer ----
  await setEditor(page, 'def two_sum(nums, target):\n    return [0, 0]');
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.result-summary').waitFor({ timeout: 120000 }); // first run loads Pyodide
  check((await resultText(page)).includes('tests passed'), 'Run executes Python in the browser');
  check(/✗ \d\/5 tests passed/.test(await resultText(page)), 'wrong answer shows failed tests');
  const failText = await resultText(page);
  check(
    failText.includes('Expected') && failText.includes('Your output'),
    'failed test shows Expected vs Your output'
  );
  check(failText.includes('two_sum('), 'failed test shows the exact call as Input');

  // ---- failure path: renamed function ----
  await setEditor(page, 'def wrong_name(nums, target):\n    return [0, 1]');
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.error-box').waitFor({ timeout: 30000 });
  check(
    (await resultText(page)).includes('keep the starter'),
    'renamed function gets a friendly error'
  );

  // ---- failure path: syntax error ----
  await setEditor(page, 'def two_sum(nums target):\n    pass');
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.error-box').waitFor({ timeout: 30000 });
  check((await resultText(page)).includes('Syntax error'), 'syntax error surfaced');

  // ---- correct solution: Run then Submit ----
  const solution =
    'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i';
  await setEditor(page, solution);
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.result-summary.pass').waitFor({ timeout: 60000 });
  check((await resultText(page)).includes('5/5 tests passed'), 'correct solution passes all tests');

  await page.locator('button', { hasText: 'Submit' }).click();
  await page.locator('.solved-banner').waitFor({ timeout: 60000 });
  check(true, 'Submit marks the problem solved');
  check((await page.locator('.streak').innerText()).includes('1 day'), 'streak increments');

  // ---- persistence across reload ----
  await page.reload();
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
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.error-box').waitFor({ timeout: 120000 });
  check(
    (await resultText(page)).includes('Time limit exceeded'),
    'infinite loop killed with friendly timeout message'
  );

  // ---- SQL: correct, wrong (visual diff), and syntax error ----
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();
  await page.locator('.q-card', { hasText: 'Strong swordsmen' }).first().click();
  await setEditor(page, 'SELECT name, power FROM fighters WHERE power >= 80 ORDER BY power DESC;');
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.result-summary').first().waitFor({ timeout: 60000 });
  check((await resultText(page)).includes('Correct result'), 'correct SQL passes');

  await setEditor(page, 'SELECT name, power FROM fighters ORDER BY power;');
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.sql-diff').waitFor({ timeout: 30000 });
  const sqlText = await resultText(page);
  check(
    sqlText.includes('Your result') && sqlText.includes('Expected'),
    'wrong SQL shows side-by-side visual diff tables'
  );

  await setEditor(page, 'SELEC name FROM fighters;');
  await page.locator('button', { hasText: '▶ Run' }).click();
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
      })
    );
  });
  await page.reload();
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
    await page.locator('button', { hasText: 'Submit' }).click();
    await page.locator('.reflect').waitFor({ timeout: 60000 });
    check(await page.locator('.rating-btn.rating-good').isVisible(), `review ${r + 1}: reflect + rating shown`);
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
  check((await page.locator('.btn-drill').innerText()).includes('1'), "drill button shows today's miss count");
  await page.locator('.btn-drill').click();
  check((await page.locator('.phase-pill').innerText()).includes('Drill'), 'drill session shows the drill phase');
  await setEditor(page, 'def contains_duplicate(nums):\n    return len(set(nums)) != len(nums)');
  await page.locator('button', { hasText: 'Submit' }).click();
  await page.locator('.reflect').waitFor({ timeout: 60000 });
  await page.locator('.rating-btn.rating-good').click();
  await page.locator('.session-done').waitFor({ timeout: 30000 });
  check(true, 'drill completes after re-clearing the miss');
  await page.locator('.session-done button', { hasText: 'Back to the dojo' }).click();

  // ---- Sensei guide + attendance calendar ----
  await page.locator('.icon-btn', { hasText: 'Sensei' }).click();
  check(await page.locator('.guide-page h1').isVisible(), 'Sensei guide page renders');
  await page.locator('.icon-btn', { hasText: 'Stats' }).click();
  check(await page.locator('.calendar-block').isVisible(), 'Stats page shows the attendance calendar');
  await page.locator('.header-logo').click();

  check(pageErrors.length === 0, `no uncaught page errors${pageErrors.length ? `: ${pageErrors[0]}` : ''}`);
  await page.close();

  // ================= mobile (375px) =================
  const mobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await mobile.goto(BASE);
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
  await mobile.locator('.pv-tab', { hasText: 'Result' }).click();
  check(await mobile.locator('.pane-result').isVisible(), 'mobile: Result tab works');
  const noHScroll2 = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  check(noHScroll2, 'mobile: no horizontal scroll in problem view');
  await mobile.close();
} finally {
  await browser.close();
  killServer();
}

console.log(failures === 0 ? '\nSmoke test green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
