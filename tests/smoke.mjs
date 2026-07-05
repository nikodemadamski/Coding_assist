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
  check((await page.locator('.q-card').count()) >= 30, 'picker lists all 30 seed questions');

  // ---- open first question, problem renders ----
  await page.locator('.q-card', { hasText: 'Character frequency' }).first().click();
  check(
    (await page.locator('.pane-problem').innerText()).includes('dict mapping each character'),
    'problem description renders'
  );
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();

  await page.locator('.q-card', { hasText: 'Two Sum' }).first().click();

  // ---- failure path: wrong answer ----
  await setEditor(page, 'def two_sum(nums, target):\n    return [0, 0]');
  await page.locator('button', { hasText: '▶ Run' }).click();
  await page.locator('.result-summary').waitFor({ timeout: 120000 }); // first run loads Pyodide
  check((await resultText(page)).includes('tests passed'), 'Run executes Python in the browser');
  check(/✗ \d\/5 tests passed/.test(await resultText(page)), 'wrong answer shows failed tests');
  check((await resultText(page)).includes('expected'), 'failed test shows expected vs got');

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
    (await twoSumCard.locator('.solved-mark').innerText()).trim() === '✓',
    'solve persists after reload'
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

  // ---- forge without an API key ----
  await page.locator('.icon-btn[aria-label="Back to problem list"]').click();
  await page.locator('button', { hasText: '✦ Forge new question' }).click();
  await page.locator('.chip', { hasText: 'sets' }).first().click();
  await page.locator('.modal button', { hasText: '✦ Forge' }).click();
  await page.locator('.modal [role="alert"]').waitFor({ timeout: 15000 });
  check(
    (await page.locator('.modal [role="alert"]').innerText()).includes('No API key'),
    'forging without an API key explains itself'
  );
  await page.locator('.modal button', { hasText: 'Cancel' }).click();

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
