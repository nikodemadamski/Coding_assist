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
import { LESSONS } from '../src/data/lessons.js';

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

// Every view that opts into the entrance cascade tags its blocks with
// `data-reveal` and animates them from opacity 0. If a cascade ever failed to
// run (or ran against a detached node), the page would render *blank* — the one
// failure mode this motion system can cause. So: after any view settles, no
// tagged block may still be transparent.
async function checkRevealSettled(page, where) {
  await page.waitForTimeout(1200);
  const bad = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal]')].filter(
      (el) => Number(getComputedStyle(el).opacity) < 0.99
    ).length
  );
  const n = await page.locator('[data-reveal]').count();
  check(n > 0 && bad === 0, `${where}: all ${n} entrance blocks settle fully visible (${bad} stuck)`);
}

async function setEditor(page, code) {
  await page.click('.cm-content');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  // insertText behaves like a paste: no autoindent/autoclose interference.
  await page.keyboard.insertText(code);
}

const resultText = (page) => page.locator('.pane-result').innerText();

// The home map breathes at rest and pauses the moment the pointer is on it, so
// its topic nodes are only a stable click target once hovered. Hover first
// (force skips the very stability check we are about to satisfy), then click.
async function clickTopic(page, name) {
  const node = page.locator('.graph-node', { hasText: name });
  await node.hover({ force: true });
  // The pointer arriving also starts the lean, and a node a few degrees into a
  // 520ms tilt is a target that moves out from under the cursor. Let it land.
  await page.waitForTimeout(700);
  await node.click();
}

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

  // ---- the top bar ------------------------------------------------------
  check(
    /^dojo — home/.test(await page.locator('.header-logo').getAttribute('aria-label')),
    'the brand is "dojo"'
  );
  // The 3D mark is lazy so three.js never blocks first paint; until it lands
  // (or forever, without WebGL) the flat mark stands in, so the brand is
  // never missing.
  await page
    .locator('.dojo-mark canvas')
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  const markShapes = await page.locator('.dojo-mark canvas, .dojo-flat').count();
  check(markShapes === 1, 'the logo renders exactly one mark — 3D, or the flat fallback');
  check(
    await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.header'));
      return cs.position === 'sticky' && /blur/.test(cs.backdropFilter || cs.webkitBackdropFilter || '');
    }),
    'the bar is sticky frosted glass'
  );
  const chipText = (await page.locator('.hdr-chip').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
  check((await page.locator('.hdr-chip').count()) === 3, 'streak, belt and coins are chips');
  check(/day/.test(chipText) && /belt|White|Yellow/i.test(chipText), `the chips carry the streak and the belt (${chipText.slice(0, 40)})`);
  // tooltips are labels inside the chip, revealed on hover — no JS positioning
  const tipHidden = await page.evaluate(
    () => Number(getComputedStyle(document.querySelector('.belt-chip .hdr-tip')).opacity)
  );
  await page.locator('.belt-chip').hover();
  await page.waitForTimeout(280);
  const tipShown = await page.evaluate(
    () => Number(getComputedStyle(document.querySelector('.belt-chip .hdr-tip')).opacity)
  );
  check(tipHidden === 0 && tipShown > 0.9, 'a chip explains itself on hover');
  check(
    (await page.locator('.hdr-btn-icon').count()) >= 4,
    'the nav actions carry icons'
  );
  check((await page.locator('.coin-chip').count()) === 1, 'the bar carries your coin balance');
  check(
    /belt/.test(await page.locator('.header-logo').getAttribute('aria-label')),
    'and the mascot announces the belt it is wearing'
  );

  // ---- the mascot ------------------------------------------------------
  // It watches the cursor anywhere on the page, not just over its own 104px
  // canvas, so moving the mouse to opposite corners must change what it draws.
  const markPixels = async () => {
    const el = await page.locator('.dojo-mark').boundingBox();
    return (await page.screenshot({ clip: el })).toString('base64');
  };
  await page.mouse.move(1200, 700);
  await page.waitForTimeout(900);
  const lookRight = await markPixels();
  await page.mouse.move(30, 700);
  await page.waitForTimeout(900);
  const lookLeft = await markPixels();
  check(lookRight !== lookLeft, 'the mascot follows the cursor across the whole page');
  // and it reacts to typing, wherever the keystrokes land
  await page.keyboard.press('Escape');
  const idleFace = await markPixels();
  await page.locator('body').press('a');
  await page.waitForTimeout(260);
  const busyFace = await markPixels();
  check(idleFace !== busyFace, 'the mascot reacts when you type');

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
  // The hero: it greets you by name and names the next problem, loudly.
  const heroTitle = await page.locator('.hero-title').innerText();
  check(/Nick/.test(heroTitle), `the home greets you by name (${heroTitle})`);
  const heroSize = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.hero-title')).fontSize)
  );
  check(heroSize >= 36, `the greeting is set at hero scale (${Math.round(heroSize)}px)`);
  check(
    (await page.locator('.hero-next-title').innerText()).length > 3,
    'the hero names the next problem'
  );
  check(
    (await page.locator('.hero-next-cue .cue-orb').count()) === 1,
    'the hero has exactly one call to action, with its arrow in a disc'
  );
  // solving is the point; Python study is a lane, not a headline
  const heroNextSize = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.hero-next-title')).fontSize)
  );
  const laneSize = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.learn-lane-label')).fontSize)
  );
  check(
    heroNextSize > laneSize * 1.8,
    `the next problem outweighs the Python lane (${Math.round(heroNextSize)}px vs ${Math.round(laneSize)}px)`
  );
  check(
    (await page.locator('.learn-lane').innerText()).includes('Python'),
    'the home still offers the Python curriculum, quietly'
  );
  check(
    (await page.locator('.hero-act', { hasText: 'mock interview' }).count()) === 0,
    'Mock interview is hidden until the first solve'
  );
  const fitsViewport = await page.evaluate(
    () => document.querySelector('.graph-canvas').getBoundingClientRect().width <= window.innerWidth
  );
  check(fitsViewport, 'the whole map fits the viewport width (scaled, no scroll box)');

  // The map draws itself in: every edge animates its stroke-dashoffset to zero
  // and the nodes fade up behind them. The failure mode is a map left
  // half-drawn or invisible, so assert it settles rather than that it moved.
  await page.waitForTimeout(1400);
  const edgeState = await page.evaluate(() => {
    const paths = [...document.querySelectorAll('.graph-edges path[data-edge]')];
    return {
      n: paths.length,
      unfinished: paths.filter((p) => Math.abs(parseFloat(p.style.strokeDashoffset || '0')) > 0.5).length,
    };
  });
  check(edgeState.n >= 15, `the map draws its ${edgeState.n} dependency arrows`);
  check(edgeState.unfinished === 0, `every arrow finishes drawing (${edgeState.unfinished} stuck)`);
  const dimNodes = await page.evaluate(
    () => [...document.querySelectorAll('.graph-node')].filter((n) => Number(getComputedStyle(n).opacity) < 0.99).length
  );
  check(dimNodes === 0, `every topic node settles fully visible (${dimNodes} stuck)`);
  check(
    (await page.locator('.graph-node.current').count()) === 1,
    'exactly one topic is marked as where you are'
  );

  // ---- the home page has to still be alive once it has settled ----------
  // Entrance choreography is over by now. Anything still running is ambient:
  // the aurora drifting, the mission bar's sweep, the CTA breathing, and the
  // current flowing down the map to the topic you're on. The regression this
  // guards is the page quietly going back to being a photograph.
  const ambient = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming?.().iterations === Infinity)
      .map((a) => a.animationName || a.effect?.target?.className || '?')
  );
  check(ambient.length >= 4, `the settled home page keeps ${ambient.length} ambient animations running`);
  for (const name of ['aurora-a', 'edge-current', 'bar-sweep', 'orb-breathe']) {
    check(ambient.includes(name), `  ↳ ${name} is still running at rest`);
  }
  // the flowing current must be exactly one connected route, never a diagram
  const liveEdges = await page.locator('.graph-edges path.live').count();
  check(liveEdges >= 1, `the map lights a route to where you are (${liveEdges} edges)`);

  // the hero card leans toward the pointer, and lets go when it leaves
  const heroBox = await page.locator('.hero-next').boundingBox();
  const cardTransform = () => page.evaluate(() => getComputedStyle(document.querySelector('.hero-next')).transform);
  await page.mouse.move(heroBox.x + heroBox.width * 0.12, heroBox.y + heroBox.height * 0.15);
  await page.waitForTimeout(500);
  const leanA = await cardTransform();
  await page.mouse.move(heroBox.x + heroBox.width * 0.88, heroBox.y + heroBox.height * 0.85);
  await page.waitForTimeout(500);
  const leanB = await cardTransform();
  check(leanA !== leanB, 'the hero card leans toward the pointer');
  check(
    (await page.evaluate(() => document.querySelector('.hero-next').style.getPropertyValue('--pin'))) === '1',
    'the pointer spotlight is lit while the cursor is over the card'
  );
  await page.mouse.move(2, 2);

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
    (await page.locator('.track-head h1').innerText()).toLowerCase().includes('pandas'),
    'the pandas card opens a dedicated pandas track map'
  );
  check((await page.locator('.graph-node').count()) >= 4, 'the pandas track map shows its sub-topics');
  // A track map is a map, not a diagram: it says how far in you are, which
  // topic you are standing on, and lights the route down to it.
  check(
    /\d+\/\d+/.test(await page.locator('.track-count-n').innerText()),
    'the track says how many of its questions you have solved'
  );
  check(
    (await page.locator('.graph-node.current').count()) === 1,
    'exactly one topic is marked as where you are on the track'
  );
  check(
    (await page.locator('.track-map .graph-edges path.live').count()) >= 1,
    'and the route to it carries the live current'
  );
  check(
    (await page.locator('.graph-node-count').count()) >= 4,
    'every topic carries its own solved count'
  );
  // The tree is narrower than the page, so it must be centred in it rather
  // than left in a lake of empty space.
  const treeBox = await page.locator('.track-map .graph-canvas').boundingBox();
  const fitBox = await page.locator('.track-map .graph-fit').boundingBox();
  const leftGap = treeBox.x - fitBox.x;
  const rightGap = fitBox.x + fitBox.width - (treeBox.x + treeBox.width);
  check(
    Math.abs(leftGap - rightGap) < 4,
    `the fitted tree is centred in its column (${Math.round(leftGap)} vs ${Math.round(rightGap)})`
  );
  await page.locator('.graph-node').first().click();
  await page.locator('.cat-modal').waitFor({ timeout: 5000 });
  check((await page.locator('.cat-q').count()) >= 1, 'a track-map node opens its questions');
  await page.locator('.cat-modal .icon-btn[aria-label="Close"]').click();
  await page.locator('.track-back').click();
  check((await page.locator('.graph-node').count()) >= 15, 'back returns to the algorithm map');

  await checkRevealSettled(page, 'Home');

  // guided next step: what's next AND why it's worth doing
  check(await page.locator('.hero-next').isVisible(), 'the hero card names what to do next');
  check(
    (await page.locator('.hero-next-why').innerText()).length > 20,
    'the hero explains why the question matters'
  );

  // clicking a topic opens its question list as a popup
  await clickTopic(page, 'Arrays & Hashing');
  await page.locator('.cat-modal').waitFor({ timeout: 5000 });
  check((await page.locator('.cat-q').count()) >= 5, 'topic popup lists its questions');
  await page.locator('.cat-q', { hasText: 'Two Sum' }).click();
  check(
    (await page.locator('.pv-title').innerText()).includes('Two Sum'),
    'clicking a question in the popup opens it'
  );

  // ---- learn-before-use: the pre-question lesson banner ----
  check(
    await page.locator('.pv-learn-first').isVisible(),
    'a question with an unlearned basic shows the learn-it-first banner'
  );
  check(
    (await page.locator('.pv-learn-first').innerText()).includes('Learn it'),
    'the banner offers the lesson'
  );
  await page.locator('.pv-learn-first .btn-plain', { hasText: 'I know it' }).click();
  check(
    (await page.locator('.pv-learn-first').count()) === 0,
    '"I know it — continue" dismisses the banner'
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
  // ---- path stepper: move on without solving, and step back ----
  {
    const startTitle = await page.locator('.pv-title').innerText();
    await page.locator('.pv-step-btn[aria-label="Next question on the path"]').click();
    await page.waitForFunction(
      (t) => document.querySelector('.pv-title')?.innerText !== t,
      startTitle,
      { timeout: 10000 }
    );
    check(true, 'the Next stepper moves to another question without solving');
    await page.locator('.pv-step-btn[aria-label="Previous question on the path"]').click();
    await page.waitForFunction(
      (t) => document.querySelector('.pv-title')?.innerText === t,
      startTitle,
      { timeout: 10000 }
    );
    check(true, 'the Prev stepper returns to the previous question');
  }

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

  // ---- the mascot reacts to what happens to you ------------------------
  // The room sets a resting face; the outcome of a run overrides it. All of it
  // reaches the accessible name too, so the reaction is not sighted-only.
  const feeling = () => page.locator('.header-logo').getAttribute('aria-label');
  check(
    /watching you work/.test(await feeling()),
    `opening a problem puts the mascot in its working face (${await feeling()})`
  );

  // ---- the test console: the cases, named, before you have run anything ----
  check(
    (await page.locator('.console-tab').allInnerTexts()).some((t) => t.startsWith('Testcase')),
    'the console opens on the test cases, not on a blank pane'
  );
  check((await page.locator('.case-chip').count()) === 6, 'every graded case gets a chip, plus Custom');
  const caseOne = (await page.locator('.case-detail').innerText()).replace(/\s+/g, ' ');
  check(
    caseOne.includes('nums') && caseOne.includes('target'),
    `a case shows its arguments by their real names (${caseOne.slice(0, 44)})`
  );
  check(caseOne.includes('expected'), 'a case shows what the grader expects back');
  check(
    await page.locator('.pv-vdivider').isVisible(),
    'the editor and console are separated by a draggable divider'
  );
  // the clock: pace is scored, so it has to be visible while you solve
  check(/^\d+:\d\d/.test(await page.locator('.solve-timer').innerText()), 'a solve clock runs in the toolbar');
  check(
    (await page.locator('.solve-timer').innerText()).includes('15:00'),
    'the clock names the target pace for this difficulty'
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
  check(
    (await page.locator('.console-tab-badge').innerText()).includes('/5 passed'),
    'the Result tab carries the score without being opened'
  );

  // back on Testcase, each chip now carries its own verdict — which case broke
  // is answerable without reading a line of output
  await page.locator('.console-tab', { hasText: 'Testcase' }).click();
  // this answer is wrong on every case, so every chip must say so
  check(
    (await page.locator('.case-chip.fail').count()) === 5 &&
      (await page.locator('.case-chip.pass').count()) === 0,
    'each case chip carries that case\'s own verdict'
  );
  await page.locator('.case-chip.fail').first().click();
  const failCase = (await page.locator('.case-detail').innerText()).replace(/\s+/g, ' ');
  check(failCase.includes('your output'), 'opening a failed case shows what your code returned');

  // ---- the custom case: your own input, run for real, graded not at all ----
  await page.locator('.case-chip-custom').click();
  await page.locator('.case-arg-input').nth(0).fill('[5, 1, 9, 4]');
  await page.locator('.case-arg-input').nth(1).fill('13');
  await page.locator('.case-actions .btn-primary').click();
  await page.locator('.case-custom-out').waitFor({ timeout: 60000 });
  check(
    (await page.locator('.case-custom-out').innerText()).includes('[0, 0]'),
    'a custom case runs your code on your input and reports what came back'
  );
  check(
    (await page.evaluate(() => JSON.parse(localStorage.getItem('zoro.progress.v1')).solved['py-two-sum'])) ===
      undefined,
    'a custom run records nothing — only Submit does'
  );
  // a malformed value is named, not swallowed
  await page.locator('.case-arg-input').nth(0).fill('[5, 1');
  await page.locator('.case-actions .btn-primary').click();
  check(
    (await page.locator('.case-error').innerText()).includes('nums'),
    'a malformed custom value names the box it came from'
  );
  await page.locator('.console-tab', { hasText: 'Result' }).click();

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
  check(
    /sympathetic/.test(await feeling()),
    `code that will not run gets sympathy, not a scolding (${await feeling()})`
  );

  // ---- a wrong answer: it runs, it is simply not right ----
  await setEditor(page, 'def two_sum(nums, target):\n    return [9, 9]');
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.result-summary').waitFor({ timeout: 60000 });
  check(/wincing/.test(await feeling()), `a failed run makes the mascot wince (${await feeling()})`);

  // ---- correct solution: Run then Submit ----
  const solution =
    'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i';
  await setEditor(page, solution);
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.result-summary.pass').waitFor({ timeout: 60000 });
  check((await resultText(page)).includes('5/5 tests passed'), 'correct solution passes all tests');
  check(/delighted/.test(await feeling()), `green tests delight it (${await feeling()})`);
  await page.locator('.console-tab', { hasText: 'Testcase' }).click();
  check(
    (await page.locator('.case-chip.pass').count()) === 5 &&
      (await page.locator('.case-chip.fail').count()) === 0,
    'a correct answer turns every case chip green'
  );
  await page.locator('.console-tab', { hasText: 'Result' }).click();

  await page.locator('.pv-toolbar button', { hasText: 'Submit' }).click();
  await page.locator('.solved-panel').waitFor({ timeout: 60000 });
  check(true, 'Submit marks the problem solved');
  check(/proud of you/.test(await feeling()), `and a submit makes it proud (${await feeling()})`);

  // ---- the cleared panel: the most rewarding moment, drawn like one ----
  const cleared = (await page.locator('.solved-panel').innerText()).replace(/\s+/g, ' ');
  check(/Cleared/.test(await page.locator('.solved-title').innerText()), 'a first solve reads "Cleared"');
  check(
    (await page.locator('.solved-fact').count()) === 3,
    `it reports time, next review and lifetime clears (${cleared.slice(0, 90)})`
  );
  check(/\d+:\d\d/.test(cleared) && /target/.test(cleared), 'your time is shown against the pace target');
  check(/back tomorrow/.test(cleared), 'and it says out loud when spaced repetition brings it back');
  check(
    await page.locator('.solved-pace').isVisible(),
    'a pace verdict judges the time rather than just printing it'
  );
  // The panel must be the loudest thing on the pane — bigger than the results
  // heading it sits above, or it is just another banner.
  const titleSize = await page
    .locator('.solved-title')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const resultSize = await page
    .locator('.result-summary')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  check(titleSize > resultSize, `the headline outweighs the result line (${titleSize} vs ${resultSize})`);

  // ---- the keyboard layer ------------------------------------------------
  // A trainer you use daily should be drivable without the mouse, and a
  // shortcut nobody knows about is a shortcut nobody has — so `?` teaches them.
  await page.locator('.pv-body').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('?');
  await page.locator('.shortcut-sheet').waitFor({ timeout: 5000 });
  check(
    (await page.locator('.shortcut-group li').count()) >= 8,
    'the ? sheet documents the whole solve loop'
  );
  await page.keyboard.press('Escape');
  await page.locator('.shortcut-sheet').waitFor({ state: 'detached', timeout: 5000 });
  check(true, 'and Escape closes it');

  // The guard that matters: a single letter must never fire while you type.
  const focused = () => page.locator('.problem-view.focus-code').count();
  // Click line 1 rather than the content box: a completion popup left open by
  // the previous edit hangs below the caret and would swallow the click.
  await page.locator('.cm-line').first().click();
  await page.keyboard.press('End');
  await page.keyboard.type('  # f v t');
  check((await focused()) === 0, 'typing f/v/t in the editor does NOT move the furniture');
  for (let i = 0; i < 9; i++) await page.keyboard.press('Backspace');

  // Escape must genuinely leave the editor — that is the rule the sheet
  // teaches, and CodeMirror swallows Escape and keeps focus by default.
  await page.keyboard.press('Escape'); // dismisses any completion popup
  await page.keyboard.press('Escape'); // and this one blurs
  check(
    await page.evaluate(() => !document.activeElement?.closest?.('.cm-editor')),
    'Escape actually leaves the editor, as the shortcut sheet promises'
  );
  await page.keyboard.press('f');
  check((await focused()) === 1, 'f outside the editor enters focus mode');
  await page.keyboard.press('f');
  check((await focused()) === 0, 'and leaves it again');

  await page.keyboard.press('t');
  check(
    (await page.locator('.console-tab.active').innerText()).toLowerCase().includes('testcase'),
    't switches the console pane'
  );
  await page.keyboard.press('t');

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
  const streakChip = (await page.locator('.streak-chip').innerText()).replace(/\s+/g, ' ');
  check(/^1 day\b/.test(streakChip), `the streak chip counts the day (${streakChip.slice(0, 24)})`);
  check(
    (await page.locator('.streak-chip.is-alive').count()) === 1,
    'a live streak lights its chip'
  );

  // ---- solve → next: the flow never dead-ends ----
  check(
    (await page.locator('.solved-next').innerText()).includes('Reverse a string'),
    'the cleared panel offers the next unsolved path step'
  );
  await page.locator('.solved-next').click();
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
    (await twoSumCard.locator('.q-mark.done').count()) === 1,
    'solve persists after reload (the row is ticked)'
  );
  check(
    await twoSumCard.evaluate((el) => el.classList.contains('is-solved')),
    'and the row reads as solved without opening it'
  );

  // ---- the bank: find one question in a hundred and fifty-nine -----------
  const rows = () => page.locator('.q-card').count();
  const allRows = await rows();
  check(allRows > 100, `the bank lists the whole path (${allRows} rows)`);
  // every chip promises a count, and clicking it must deliver exactly that
  const chip = (label) => page.locator('.chip', { hasText: label }).first();
  const chipCount = async (label) => Number((await chip(label).locator('.chip-n').innerText()).trim());
  const promisedTodo = await chipCount(/^not solved/);
  await chip(/^not solved/).click();
  await page.waitForTimeout(220);
  check(
    (await rows()) === promisedTodo,
    `the "not solved" chip shows exactly what it promised (${promisedTodo})`
  );
  check((await page.locator('.q-card.is-solved').count()) === 0, 'and no solved row leaks into it');
  const promisedSolved = await chipCount(/^solved/);
  await chip(/^solved/).click();
  await page.waitForTimeout(220);
  check((await rows()) === promisedSolved, `so does "solved" (${promisedSolved})`);
  check(promisedTodo + promisedSolved === allRows, 'solved and not-solved account for the whole bank');

  // text search, over more than the title
  await chip(/^all/).click();
  await page.fill('.bank-search-input', 'two sum');
  await page.waitForTimeout(260);
  check((await rows()) < allRows && (await rows()) >= 1, 'typing a title narrows the bank');
  check(
    (await page.locator('.q-card').first().innerText()).includes('Two Sum'),
    'and finds the question you typed'
  );
  await page.fill('.bank-search-input', 'TWO-SUM');
  await page.waitForTimeout(260);
  check((await rows()) >= 1, 'case and punctuation do not matter');
  // filters compose rather than replacing each other
  await page.fill('.bank-search-input', '');
  await chip(/^sql/).click();
  await chip(/^not solved/).click();
  await page.waitForTimeout(260);
  const composed = await rows();
  check(
    composed > 0 && composed < promisedTodo,
    `track and status compose instead of overriding (${composed} rows)`
  );
  // a dead end says so, and offers the way out
  await page.fill('.bank-search-input', 'zzzznothing');
  await page.waitForTimeout(260);
  check((await page.locator('.bank-empty').count()) === 1, 'a search with no answer says so');
  await page.locator('.bank-empty .btn').click();
  await page.waitForTimeout(260);
  check((await rows()) === allRows, 'and clearing the filters brings the whole bank back');
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
  // …and the editor must NOT stay locked: fixing the code and running again
  // has to work, even though the timeout terminated the Python worker.
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll('.pv-toolbar button')].find((x) => /^Run/.test(x.innerText));
      return b && !b.disabled;
    },
    null,
    { timeout: 30000 }
  );
  await setEditor(
    page,
    'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i'
  );
  await page.locator('.pv-toolbar button', { hasText: /^Run/ }).click();
  await page.locator('.result-summary').first().waitFor({ timeout: 120000 });
  check(
    (await resultText(page)).includes('passed'),
    'a corrected solution runs again after a timeout (the runtime recovers)'
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
    (await page.locator('.hero-act-loud').innerText()).includes('2'),
    'the hero action row shows 2 reviews waiting'
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
    (await page.locator('.hero-act-bad').first().innerText()).includes('1'),
    "the drill action shows today's miss count"
  );
  await page.locator('.hero-act-bad').click();
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

  // the reference is a two-up grid, and the card you open claims the whole row
  // so its template never has to wrap into half a gutter
  const [closedW, openW] = await page.evaluate(() => {
    const open = document.querySelector('.pattern-card.open');
    const closed = document.querySelector('.pattern-card:not(.open)');
    return [closed?.getBoundingClientRect().width ?? 0, open?.getBoundingClientRect().width ?? 0];
  });
  check(openW > closedW * 1.5, `the open pattern card spans the full row (${Math.round(closedW)} → ${Math.round(openW)}px)`);

  // data-track template sections: pandas and SQL cards live alongside algorithms
  check(
    (await page.locator('.pattern-section-head').allInnerTexts()).join(' ').includes('SQL'),
    'the guide has a SQL section'
  );
  await checkRevealSettled(page, 'Patterns');
  await page.locator('.pattern-card-head', { hasText: 'Window functions' }).click();
  check(
    (await page.locator('.pattern-card.open .pattern-template').innerText()).includes('OVER'),
    'the SQL window card shows an OVER template'
  );
  check(
    (await page.locator('.pattern-card.open .pattern-drill-q').count()) >= 2,
    'the window card links its drill problems'
  );
  await page.locator('.pattern-card-head', { hasText: 'Group & aggregate' }).click();
  check(
    (await page.locator('.pattern-card.open .pattern-template').innerText()).includes('groupby'),
    'the pandas groupby card shows a groupby template'
  );

  await page.locator('.pattern-card-head', { hasText: 'Hashing' }).click();
  await page.locator('.pattern-drill-q', { hasText: 'Two Sum' }).first().click();
  check(
    (await page.locator('.pv-title').innerText()).includes('Two Sum'),
    'a drill link opens the problem'
  );
  // the stuck ladder links back to the pattern template (still on the problem)
  await page.locator('.stuck-next', { hasText: 'Which pattern' }).click();
  await page.locator('.rung-link', { hasText: 'pattern template' }).click();
  check(
    (await page.locator('.pattern-card.open').count()) >= 1,
    'the stuck ladder jumps straight to this problem\'s pattern template'
  );

  // ---- the pattern drill: recognition, against a clock ----
  await page.locator('.patterns-quiz-btn').click();
  await page.locator('.quiz-options').waitFor({ timeout: 5000 });
  check((await page.locator('.quiz-option').count()) === 4, 'the drill offers four pattern options');
  check(
    (await page.locator('.quiz-count').innerText()).includes('of 10'),
    'a round is ten questions'
  );
  check(
    (await page.locator('.stage-prog-seg').count()) === 10,
    'the run shows a segment per question, so the shape of the round is visible'
  );
  // The clock is the point: recognition you have to work out is not recognition.
  const firstClock = await page.locator('.quiz-clock').innerText();
  check(/^\d+s$/.test(firstClock), `each question runs against a countdown (${firstClock})`);
  await page.waitForTimeout(1200);
  check(
    (await page.locator('.quiz-clock').innerText()) !== firstClock,
    'and the countdown actually counts down'
  );

  // 1-4 answers it from the keyboard — a recognition drill lives or dies on
  // how fast you can get through it.
  await page.keyboard.press('1');
  check(
    (await page.locator('.quiz-option.correct').count()) === 1,
    'answering reveals which option was right'
  );
  check(await page.locator('.quiz-why').isVisible(), 'the drill explains when to reach for the pattern');
  check(
    (await page.locator('.quiz-cue').count()) > 0,
    'and shows the cues to memorise, not just the answer'
  );
  check(
    (await page.locator('.quiz-clock').innerText()) === '—',
    'the clock stops once the question is settled'
  );
  await page.keyboard.press('Enter');
  check(
    (await page.locator('.quiz-count').innerText()).includes('2 of 10'),
    'Enter advances to the next question'
  );

  // Run the round out and check the debrief is actionable, not just a score.
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press(String((i % 4) + 1));
    await page.waitForTimeout(90);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(90);
  }
  await page.locator('.quiz-done').waitFor({ timeout: 8000 });
  check(/You named/.test(await page.locator('.quiz-done h1').innerText()), 'the round ends in a debrief');
  check((await page.locator('.quiz-stat').count()) === 3, 'the debrief scores accuracy, speed and run-outs');
  const missed = await page.locator('.quiz-missed-row').count();
  check(missed > 0, `the patterns you could not name are listed (${missed})`);
  // The record is what makes the drill a training instrument rather than a toy.
  const quizRec = await page.evaluate(
    () => JSON.parse(localStorage.getItem('zoro.progress.v1')).quiz
  );
  check(quizRec?.rounds === 1, 'the round is filed against your recognition record');
  check(
    Object.keys(quizRec.byPattern || {}).length > 0,
    'and tallied per pattern, so the app can name your weak spots'
  );

  // A missed pattern routes straight to the template that teaches it.
  await page.locator('.quiz-missed-row').first().click();
  await page.locator('.pattern-card.open').waitFor({ timeout: 5000 });
  check(true, 'a missed pattern opens its own template card');
  check(
    await page.locator('.patterns-record').isVisible(),
    'and the templates page now reports how reliably you name them'
  );
  // Per-card rates deliberately stay silent until a pattern has been asked
  // three times (patternAccuracy's MIN_SEEN) — one round of ten spreads over
  // roughly eight patterns, so nothing has earned a number yet. That threshold
  // is pinned in quiz-tests; here we only assert the page does not invent one.
  check(
    (await page.locator('.pattern-card-recog').count()) === 0,
    'a single round is not enough evidence to score an individual pattern'
  );
  await page.locator('.header-logo').click();

  // ---- Sensei guide + attendance calendar ----
  await page.locator('.hdr-menu-btn').click();
  check(
    (await page.locator('.hdr-menu-pop button').count()) === 5,
    'Library holds Learn / Stats / Patterns / Sensei / Dojo shop'
  );
  await page.keyboard.press('Escape');
  await page.locator('.hdr-menu-pop').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  check((await page.locator('.hdr-menu-pop').count()) === 0, 'Esc closes the Library menu');
  await openLibrary(page, 'Sensei');
  check(await page.locator('.guide-page h1').isVisible(), 'Sensei guide page renders');
  await page.locator('.hdr-menu-pop').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  check((await page.locator('.hdr-menu-pop').count()) === 0, 'picking an item closes the menu');

  // ---- the wardrobe: a costume per room, announced as well as drawn ------
  const dressedAs = () => page.locator('.header-logo').getAttribute('aria-label');
  const worn = {};
  for (const [item, key] of [
    ['Learn', 'learn'],
    ['Stats', 'stats'],
    ['Patterns', 'patterns'],
    ['Sensei', 'guide'],
  ]) {
    await openLibrary(page, item);
    await page.waitForTimeout(300);
    worn[key] = await dressedAs();
  }
  await page.locator('.header-logo').click();
  await page.waitForTimeout(300);
  worn.home = await dressedAs();
  check(/graduation cap/.test(worn.learn), `the lessons put a cap on it (${worn.learn})`);
  check(/glasses/.test(worn.stats), 'your record gets reading glasses');
  check(/monocle/.test(worn.patterns), 'the reference gets a monocle');
  check(/topknot/.test(worn.guide), 'Sensei gets the topknot');
  check(/^dojo — home/.test(worn.home), 'the home map is a lobby — no costume');
  check(new Set(Object.values(worn)).size === 5, 'every room dresses it differently');

  // ---- the dojo shop -----------------------------------------------------
  await openLibrary(page, 'Dojo shop');
  await page.locator('.shop-grid').first().waitFor({ timeout: 10000 });
  // The balance races up from zero on arrival, so let it land before reading.
  const coins = async () => {
    await page.waitForTimeout(1300);
    return Number((await page.locator('.shop-balance-n').innerText()).trim());
  };
  const startCoins = await coins();
  check(startCoins > 0, `training has earned you coins (${startCoins})`);
  check(
    (await page.locator('.shop-item').count()) >= 12,
    'the shop has a real wardrobe to spend them on'
  );
  // the shop shows its working, so a balance is never an arbitrary number
  await page.locator('.shop-earn summary').click();
  await page.waitForTimeout(200);
  const earnTotal = Number((await page.locator('.shop-earn-total .shop-earn-sum').innerText()).trim());
  check(earnTotal >= startCoins, `it shows where every coin came from (${earnTotal} earned)`);

  // an item you cannot afford says exactly how short you are, and refuses
  const glasses = page.locator('.shop-item', { hasText: 'Reading glasses' });
  if (await glasses.locator('button').isDisabled()) {
    check(
      /short/.test(await glasses.locator('button').innerText()),
      'an item you cannot afford says how many coins short you are'
    );
    const before = await coins();
    await glasses.locator('button').click({ force: true });
    await page.waitForTimeout(250);
    check((await coins()) === before, 'and forcing the click charges nothing');
  } else {
    check(true, 'glasses already affordable — the short path is covered by unit tests');
  }

  // a belt you have not earned locks the item at any price
  const crown = page.locator('.shop-item', { hasText: 'Crown' });
  check(
    await crown.evaluate((el) => el.classList.contains('is-locked')),
    'a rank you have not reached locks its item'
  );
  check(
    /belt/.test(await crown.locator('button').innerText()),
    'and the button names the belt that unlocks it, not the price'
  );

  // the free starter item proves the whole buy -> own -> wear path
  const band = page.locator('.shop-item', { hasText: 'Dojo headband' });
  const beforeBuy = await coins();
  await band.locator('button').click();
  await page.waitForTimeout(350);
  check((await band.locator('.shop-item-tag.owned').count()) === 1, 'buying makes the item yours');
  check(
    await band.evaluate((el) => el.classList.contains('is-worn')),
    'and it goes straight on — nobody buys a hat for the box'
  );
  check((await coins()) === beforeBuy, 'the free item is free');
  await band.locator('button').click();
  await page.waitForTimeout(300);
  check(
    !(await band.evaluate((el) => el.classList.contains('is-worn'))),
    'taking an item off is one click, and reversible'
  );
  await page.locator('.header-logo').click();
  await page.waitForTimeout(300);
  await openLibrary(page, 'Stats');
  check(await page.locator('.calendar-block').isVisible(), 'Stats page shows the attendance calendar');

  // ---- per-track fitness: three bars, weakest called out ----
  check((await page.locator('.track-fit .ready-part').count()) === 3, 'fitness by track shows all three tracks');
  check(
    (await page.locator('.track-fit').innerText()).includes('SQL'),
    'the track fitness strip names SQL'
  );
  check(
    (await page.locator('.track-fit .ready-part.weakest').count()) === 1,
    'the thinnest track is highlighted'
  );

  // ---- Learn Python from zero: the lesson player, end to end ----
  await openLibrary(page, 'Learn');
  check((await page.locator('.learn h1').innerText()).includes('Learn Python'), 'the Learn page opens');
  check((await page.locator('.learn-lesson').count()) >= 6, 'chapter 1 lists its lessons');
  await page.locator('.learn-lesson.next').click();
  await page.locator('.ln-read').waitFor({ timeout: 10000 });
  // This lesson opens on a text-reveal visual (scrambleText); confirm it renders.
  check(await page.locator('.vw-textreveal .vw-tr-text').isVisible(), 'a text-reveal visual renders its text');
  // Lessons with a visual open on the "See it" tab; switch to the runnable code.
  const readCodeTab = page.locator('.ln-read-tab', { hasText: 'Read the code' });
  if (await readCodeTab.count()) await readCodeTab.click();
  await page.locator('.ln-run-row .btn', { hasText: 'Run it' }).click();
  await page.locator('.ln-stdout').waitFor({ timeout: 120000 });
  check(
    (await page.locator('.ln-stdout').innerText()).includes('welcome to the dojo'),
    'the read example runs through the real engine'
  );
  // the stage: one action bar, always in the same place, plus a progress bar
  // that means something (one segment per exercise, not eight dots to count)
  check(
    (await page.locator('.stage-foot .btn', { hasText: 'Start the drills' }).count()) === 1,
    'the read step\'s action lives in the stage action bar'
  );
  await page.locator('button', { hasText: 'Start the drills' }).click();
  await page.locator('.ln-item').waitFor({ timeout: 5000 });

  const lesson1 = LESSONS[0];
  check(
    (await page.locator('.stage-prog-seg').count()) === lesson1.items.length,
    `progress shows one segment per exercise (${lesson1.items.length})`
  );
  check((await page.locator('.stage-prog-seg.now').count()) === 1, 'exactly one segment marks where you are');
  check(
    (await page.locator('.stage-kicker').innerText()).length > 0,
    'the header says which chapter you are in'
  );
  // Item 1: answer correctly.
  await page.fill('.ln-item .wu-input', lesson1.items[0].answer);
  await page.locator('.ln-item .btn', { hasText: 'Check' }).click();
  check((await page.locator('.ln-outcome').innerText()).includes('✓'), 'a correct answer is accepted with its why');
  check(
    (await page.locator('.stage-foot.good').count()) === 1,
    'the action bar turns green on a correct answer'
  );
  // Enter carries on, so a whole lesson can be done without the mouse
  await page.locator('.stage-top').click();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  check(
    (await page.locator('.stage-prog-seg.done').count()) === 1,
    'Enter advances to the next exercise'
  );
  // Item 2: miss twice — nudge, then reveal.
  await page.fill('.ln-item .wu-input', 'definitely wrong');
  await page.locator('.ln-item .btn', { hasText: 'Check' }).click();
  check(await page.locator('.ln-nudge').isVisible(), 'the first miss asks for a second look');
  await page.fill('.ln-item .wu-input', 'wrong again');
  await page.locator('.ln-item .btn', { hasText: 'Check' }).click();
  check(
    (await page.locator('.ln-outcome').innerText()).includes(lesson1.items[1].answer),
    'the second miss reveals the answer'
  );
  check(
    (await page.locator('.stage-foot.shown').count()) === 1,
    'a revealed answer tints the action bar amber, not green'
  );
  await page.locator('.ln-next').click();
  // Items 3..N: answer correctly from the bank; the missed item returns once.
  for (let i = 2; i < lesson1.items.length + 1; i++) {
    const answered =
      i < lesson1.items.length ? lesson1.items[i].answer : lesson1.items[1].answer;
    await page.fill('.ln-item .wu-input', answered);
    await page.locator('.ln-item .btn', { hasText: 'Check' }).click();
    await page.locator('.ln-next').click();
  }
  await page.locator('.ln-done').waitFor({ timeout: 5000 });
  check(
    (await page.locator('.ln-done').innerText()).includes(
      `${lesson1.items.length - 1}/${lesson1.items.length} first try`
    ),
    'the completion screen counts first-try answers'
  );
  check(
    (await page.locator('.stage-foot').innerText()).includes('Next lesson'),
    'completion offers the next lesson from the action bar'
  );
  await page.locator('.stage-foot .btn', { hasText: 'Back to Learn' }).click();
  check(
    (await page.locator('.learn-lesson.done').count()) === 1,
    'the finished lesson is checked off on the Learn page'
  );
  check(
    (await page.locator('.learn-status').innerText()).includes('1/'),
    'the lesson counter moved'
  );

  // ---- Brilliant-style visual: the "See it" widget taps through beats ----
  await page.locator('.learn-lesson-title', { hasText: 'Slicing' }).first().click();
  await page.locator('.ln-read').waitFor({ timeout: 10000 });
  check(await page.locator('.vw-player').isVisible(), 'a lesson with a visual opens on "See it"');
  check((await page.locator('.vw-cell').count()) >= 4, 'the list widget renders its cells');
  const beat0 = (await page.locator('.vw-caption').innerText()).trim();
  await page.locator('.vw-controls .btn', { hasText: 'Next' }).click();
  const beat1 = (await page.locator('.vw-caption').innerText()).trim();
  check(beat1 !== beat0 && beat1.length > 0, 'tapping Next advances the visual to the next beat');
  check((await page.locator('.vw-dot.on').count()) >= 2, 'progress dots track the beat');
  // the "Read the code" tab still offers the runnable example
  await page.locator('.ln-read-tab', { hasText: 'Read the code' }).click();
  check(await page.locator('.ln-run-row .btn', { hasText: 'Run it' }).isVisible(), 'Read-the-code tab keeps the runnable example');
  await page.locator('.icon-btn', { hasText: '←' }).first().click();

  // ---- a later-chapter widget renders (tree-view SVG for the trees lesson) ----
  await page.locator('.learn-lesson-title', { hasText: 'Binary trees' }).first().click();
  await page.locator('.ln-read').waitFor({ timeout: 10000 });
  await page.locator('.vw-tree-svg').waitFor({ timeout: 10000 });
  check((await page.locator('.vw-tree-node').count()) >= 3, 'the trees lesson draws a tree-view widget');
  await page.locator('.icon-btn', { hasText: '←' }).first().click();

  // ---- arrange (Parsons): drag shuffled lines into order, checked by the real engine ----
  const arrLesson = LESSONS.find((l) => l.items.some((it) => it.type === 'arrange'));
  const arrItem = arrLesson.items.find((it) => it.type === 'arrange');
  await page.locator('.learn-lesson-title', { hasText: arrLesson.title }).first().click();
  await page.locator('.ln-read').waitFor({ timeout: 10000 });
  await page.locator('.btn', { hasText: 'Start the drills' }).click();
  await page.locator('.ln-item').waitFor({ timeout: 10000 });
  // Resolve each item in order (correct first try, so nothing requeues) until the puzzle.
  for (const it of arrLesson.items) {
    if (it.type === 'arrange') break;
    if (it.type === 'predict' || it.type === 'type') {
      await page.fill('.ln-item .wu-input', it.answer);
      await page.locator('.ln-item .btn', { hasText: 'Check' }).click();
    } else if (it.type === 'write' || it.type === 'fix') {
      await page.locator('.ln-item .cm-content').click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.insertText(it.solution);
      await page.locator('.ln-item .btn', { hasText: 'Run' }).click();
      await page.locator('.ln-outcome.good').waitFor({ timeout: 120000 });
    }
    await page.locator('.ln-next').click();
  }
  await page.locator('.ln-arrange').waitFor({ timeout: 10000 });
  check(
    (await page.locator('.ln-arrange-row').count()) === arrItem.lines.length,
    'arrange puzzle renders one row per solution line'
  );
  const startOrder = (await page.locator('.ln-arrange-code').allInnerTexts()).map((t) => t.trim());
  check(
    startOrder.join('\n') !== arrItem.lines.map((l) => l.trim()).join('\n'),
    'arrange rows start shuffled, not already solved'
  );
  // Selection-sort the rows into the correct order with the ↑ buttons.
  const target = arrItem.lines.map((l) => l.trim());
  for (let pos = 0; pos < target.length; pos++) {
    const codes = (await page.locator('.ln-arrange-code').allInnerTexts()).map((t) => t.trim());
    let j = codes.findIndex((c, k) => k >= pos && c === target[pos]);
    while (j > pos) {
      await page.locator('.ln-arrange-row').nth(j).locator('button[aria-label="Move up"]').click();
      j--;
    }
  }
  await page.locator('.ln-run-row .btn', { hasText: 'Check' }).click();
  await page.locator('.ln-outcome.good').waitFor({ timeout: 120000 });
  check(
    (await page.locator('.ln-outcome').innerText()).includes('Assembled'),
    'arrange: lines dragged into order assemble and pass through the real engine'
  );
  await page.locator('.icon-btn', { hasText: '✕' }).first().click();

  await page.locator('.learn-back').click();

  // ---- the review button serves coding questions, and ONLY those ----
  // A due skill check used to open the daily session, which meant the one
  // button whose promise is "go do questions" could hand you a Python lesson.
  // With a check due AND a question due, the session must still open on the
  // question — and the check must still be scheduled, over on Learn.
  await page.evaluate(() => {
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const p = JSON.parse(localStorage.getItem('zoro.progress.v1'));
    p.lessons['ch1-values'].srs.nextDue = today; // a skill check is due
    // and so is a question you have already solved
    const iso = new Date().toISOString();
    p.solved['py-reverse-string'] = { firstSolvedAt: iso, attempts: 1, solves: 1, lastSolvedAt: iso };
    p.srs['py-reverse-string'] = { stage: 0, nextDue: today };
    localStorage.setItem('zoro.progress.v1', JSON.stringify(p));
  });
  await page.reload();
  await page.locator('.hero-act-loud').waitFor({ timeout: 10000 });
  check(
    /question/i.test(await page.locator('.hero-act-loud').innerText()),
    `the review button says it is about questions (${(await page.locator('.hero-act-loud').innerText()).replace(/\s+/g, ' ')})`
  );
  await page.locator('.hero-act-loud').click();
  await page.locator('.pv-toolbar').waitFor({ timeout: 15000 });
  check(
    await page.locator('.pv-toolbar').isVisible(),
    'a due skill check does NOT hijack the session — it opens on a coding question'
  );
  check(
    (await page.locator('.ln-item').count()) === 0,
    'no lesson exercise is served inside a practice session'
  );
  check(
    (await page.locator('.pv-title').innerText()).includes('Reverse'),
    'and the question served is the one that was actually due'
  );
  await page.locator('.icon-btn[aria-label="End practice session"]').click();
  await page.locator('.q-list').first().waitFor({ timeout: 5000 }); // sessions exit to Browse
  await page.locator('.header-logo').click();
  await page.locator('.graph-node').first().waitFor({ timeout: 5000 });

  // The skill check is still due — it just lives where you go to learn.
  await openLibrary(page, 'Learn');
  check(
    await page.locator('.btn', { hasText: /Skill check due \(1\)/ }).isVisible(),
    'the skill check is still scheduled — Learn is where it surfaces'
  );
  await page.locator('.learn-back').click();
  await page.locator('.graph-node').first().waitFor({ timeout: 5000 });

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
  const readyScore = Number(await page.locator('.ready-card .ready-ring-num').innerText());
  check(readyScore > 0 && readyScore < 100, `readiness score is a real 0-100 number (${readyScore})`);
  check((await page.locator('.ready-part').count()) >= 4, 'readiness breaks into its scored dimensions');
  check(
    (await page.locator('.ready-pace-row').innerText()).includes('vs'),
    'pace chip compares your median to the target time'
  );
  check((await page.locator('.ready-card .ready-advice').innerText()).includes('Biggest gap'), 'the card says what to fix first');
  check(
    (await page.locator('.ready-card .ready-ring-arc').count()) === 1,
    'the readiness score is drawn as a dial, not a line of text'
  );
  // the bento is deliberately asymmetric: cells must NOT all be the same width
  const bentoWidths = await page.evaluate(() =>
    [...document.querySelectorAll('.bento > .bento-cell')].map((el) =>
      Math.round(el.getBoundingClientRect().width)
    )
  );
  check(bentoWidths.length >= 8, `Stats lays out as a bento of cells (${bentoWidths.length})`);
  check(
    new Set(bentoWidths).size >= 3,
    `bento cells carry different weights rather than a uniform grid (${new Set(bentoWidths).size} widths)`
  );
  await checkRevealSettled(page, 'Stats');

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
  // a11y: the dialog traps Tab and closes on Esc
  check(
    await page.evaluate(() => document.querySelector('.modal').contains(document.activeElement)),
    'opening a dialog moves focus inside it'
  );
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  check(
    await page.evaluate(() => document.querySelector('.modal').contains(document.activeElement)),
    'Tab cycles inside the dialog — focus never escapes behind it'
  );
  await page.keyboard.press('Escape');
  check((await page.locator('.modal').count()) === 0, 'Esc closes the dialog');
  check(
    await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Settings'),
    'closing returns focus to the button that opened it'
  );

  // ---- weak-spot chips on the home map ----
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('zoro.progress.v1'));
    p.solved['py-two-sum'] = { ...p.solved['py-two-sum'], mistakes: 4 };
    p.solved['py-valid-anagram'] = { ...p.solved['py-valid-anagram'], mistakes: 2 };
    localStorage.setItem('zoro.progress.v1', JSON.stringify(p));
  });
  await page.reload();
  // real solves happened earlier in this run, so the greeting reflects them
  const greet = await page.locator('.hero-title').innerText();
  check(/\d+ down today/.test(greet), `the greeting leads with what you did today (${greet})`);
  const heroLine = (await page.locator('.hero-line').innerText()).replace(/\s+/g, ' ');
  check(
    /\d+ solved · \d+ to go · \d+\/100 ready/.test(heroLine),
    `the hero states solved, remaining and readiness (${heroLine})`
  );
  // The solved count animates up from zero. Whatever it does on the way, it
  // must land on the truth — a number that races and then lies is worse than
  // no animation at all.
  const realSolved = await page.evaluate(
    () => Object.values(JSON.parse(localStorage.getItem('zoro.progress.v1')).solved).filter((e) => e.solves > 0).length
  );
  let heroSolved = null;
  for (let i = 0; i < 30; i++) {
    heroSolved = Number((await page.locator('.hero-line strong').first().innerText()).trim());
    if (heroSolved === realSolved) break;
    await page.waitForTimeout(100);
  }
  check(
    heroSolved === realSolved,
    `the counting number settles on the real total (${heroSolved} vs ${realSolved})`
  );
  await page.locator('.hero-act-ring').click();
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
  await clickTopic(page, 'Arrays & Hashing');
  await page.locator('.cat-q', { hasText: 'Two Sum' }).click();
  // Two Sum is solved by now, so the hint ladder is folded away and the model
  // approaches take its place — after the fact, a ladder of hints is the wrong
  // thing to have sitting open. It is still one click from where it was.
  check(
    (await page.locator('.stuck-after').count()) === 1,
    'a solved question folds the hint ladder behind a disclosure'
  );
  // Inside a closed <details> the rungs are still in the DOM but not on screen,
  // which is the point — hidden, not deleted.
  check(
    (await page.locator('.stuck-next').first().isVisible().catch(() => false)) === false,
    'so no hint rung is showing on a question you already cleared'
  );
  check(
    await page.locator('.pv-extras .approaches').isVisible(),
    'and the model approaches sit where the ladder was'
  );
  await page.locator('.stuck-after > summary').click();
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
  await page.locator('.editor-bar-tools .bar-btn', { hasText: 'Visualize' }).click();
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
  await page.locator('.hero-act', { hasText: 'warm-up' }).click();
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
    /3\s*best of 50/.test(
      (await page.locator('.wu-level-card', { hasText: 'Beginner' }).innerText()).replace(/\s+/g, ' ')
    ),
    'best streak persists on the level card'
  );

  // ---- SQL warm-up track ----
  await page.locator('.wu-tracks button', { hasText: 'sql' }).click();
  check((await page.locator('.wu-level-card').count()) === 3, 'sql track offers 3 levels');
  check(
    (await page.locator('.wu-level-card').first().innerText()).includes('50 questions'),
    'sql levels carry a full 50-question bank'
  );
  await page.locator('.wu-level-card', { hasText: 'Beginner' }).click();
  await page.locator('.wu-prompt').waitFor({ timeout: 10000 });
  {
    // SQL warm-up answers EXECUTE against sql.js (async). The very first grade in
    // a long run can outlast the per-question countdown while the wasm engine
    // warms up, ending the run at a summary. Each question is an equivalent
    // case-fold test, so on a miss we re-enter the level and answer a fresh one.
    let streakOk = false;
    let bankHit = false;
    for (let attempt = 0; attempt < 3 && !streakOk; attempt++) {
      await page.locator('.wu-prompt').waitFor({ timeout: 10000 });
      const prompt = (await page.locator('.wu-prompt').innerText()).trim();
      const wuItem = WARMUP_SETS['sql-beginner'].find((it) => it.prompt === prompt);
      bankHit = bankHit || !!wuItem;
      await page.locator('.wu-input').click();
      await page.fill('.wu-input', wuItem.answer.toUpperCase()); // uppercase: SQL folds case outside quotes
      await page.keyboard.press('Enter');
      try {
        await page.locator('.wu-run-streak', { hasText: '1' }).waitFor({ timeout: 20000 });
        streakOk = true;
      } catch {
        const changeBtn = page.locator('button', { hasText: 'Change level' });
        if (await changeBtn.count()) {
          await changeBtn.click();
          await page.locator('.wu-level-card', { hasText: 'Beginner' }).click();
        }
      }
    }
    check(bankHit, 'sql warm-up question comes from the sql bank');
    check(streakOk, 'an UPPERCASE answer is accepted — SQL checking folds case');
  }
  await page.fill('.wu-input', 'select definitely wrong');
  await page.keyboard.press('Enter');
  await page.locator('.wu-miss').waitFor({ timeout: 5000 });
  await page.locator('button', { hasText: 'Change level' }).click();

  // ---- pandas warm-up track ----
  await page.locator('.wu-tracks button', { hasText: 'pandas' }).click();
  check((await page.locator('.wu-level-card').count()) === 3, 'pandas track offers 3 levels');
  check(
    (await page.locator('.wu-level-card').first().innerText()).includes('50 questions'),
    'pandas levels carry a full 50-question bank'
  );
  await page.locator('.wu-level-card', { hasText: 'Intermediate' }).click();
  await page.locator('.wu-prompt').waitFor({ timeout: 10000 });
  {
    const prompt = (await page.locator('.wu-prompt').innerText()).trim();
    const wuItem = WARMUP_SETS['pd-intermediate'].find((it) => it.prompt === prompt);
    check(!!wuItem, 'pandas warm-up question comes from the pandas bank');
    await page.fill('.wu-input', wuItem.answer);
    await page.keyboard.press('Enter');
    check(
      (await page.locator('.wu-run-streak').innerText()).includes('1'),
      'a correct pandas answer advances the streak'
    );
  }
  await page.fill('.wu-input', 'df.definitely_wrong()');
  await page.keyboard.press('Enter');
  await page.locator('.wu-miss').waitFor({ timeout: 5000 });
  await page.locator('button', { hasText: 'Change level' }).click();
  await page.locator('button', { hasText: '← Back to the dojo' }).click();

  // ---- mock interview: timed, hints locked, debrief ----
  await page.locator('.hero-act', { hasText: 'mock interview' }).click();
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

  // ---- mock data round: a timed pandas/SQL screen ----
  await page.locator('.hero-act', { hasText: 'mock interview' }).click();
  const dataCard = page.locator('.mock-format-card', { hasText: 'Data round' });
  check(
    (await dataCard.innerText()).includes('pandas · sql'),
    'the mock brief offers a pandas/SQL data round'
  );
  await dataCard.click();
  await page.locator('.mock-timer').waitFor({ timeout: 10000 });
  check(await page.locator('.mock-timer').isVisible(), 'the data round runs on the clock');
  check(
    (await page.locator('.pane-problem .hint').count()) === 0,
    'hints stay locked in the data round'
  );
  await page.locator('.icon-btn[aria-label="End interview"]').click();
  await page.locator('.mock-verdict').waitFor({ timeout: 5000 });
  check(
    await page.locator('.mock-rubric').isVisible(),
    'the data round debrief asks the same interviewer rubric'
  );
  await page.locator('.mock-q', { hasText: 'clarify' }).locator('.seg-btn', { hasText: 'partly' }).click();
  await page.locator('.mock-q', { hasText: 'talk through' }).locator('.seg-btn', { hasText: 'Okay' }).click();
  await page.locator('button', { hasText: 'Record & finish' }).click();
  await page.locator('.graph-node').first().waitFor({ timeout: 5000 });

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
  {
    const tabsBox = await mobile.locator('.pv-tabs').boundingBox();
    const bodyBox = await mobile.locator('.pv-body').boundingBox();
    check(tabsBox.y > bodyBox.y + bodyBox.height - 2, 'mobile: the tab bar sits at the bottom, thumb height');
  }
  // swipe left on the problem pane -> Code tab
  await mobile.evaluate(() => {
    const el = document.querySelector('.pane-problem');
    const mk = (type, x, key) => {
      const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
      el.dispatchEvent(new TouchEvent(type, { [key]: [touch], bubbles: true, cancelable: true }));
    };
    mk('touchstart', 320, 'touches');
    mk('touchend', 60, 'changedTouches');
  });
  check(
    (await mobile.locator('.pv-tab.active').innerText()) === 'Code',
    'mobile: swiping left flips to the Code tab'
  );
  await mobile.evaluate(() => {
    const el = document.querySelector('.pane-code');
    const mk = (type, x, key) => {
      const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
      el.dispatchEvent(new TouchEvent(type, { [key]: [touch], bubbles: true, cancelable: true }));
    };
    mk('touchstart', 60, 'touches');
    mk('touchend', 320, 'changedTouches');
  });
  check(
    (await mobile.locator('.pv-tab.active').innerText()) === 'Problem',
    'mobile: swiping right goes back to the Problem tab'
  );
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
  // the bar goes icon-only rather than wrapping — and keeps its names
  await mobile.locator('.header-logo').click();
  await mobile.waitForTimeout(400);
  const labelHidden = await mobile.evaluate(() => {
    const el = document.querySelector('.hdr-btn-label');
    return el ? el.getBoundingClientRect().width <= 2 : false;
  });
  check(labelHidden, 'mobile: nav buttons show their icon only');
  check(
    (await mobile.locator('.icon-btn[aria-label="Settings"]').count()) === 1 &&
      (await mobile.locator('.hdr-btn-label', { hasText: 'Browse' }).count()) === 1,
    'mobile: the hidden labels still name the buttons'
  );
  await mobile.close();

  // ================= reduced motion: the whole thing goes still ===========
  // Every ambient loop and every pointer response above is exactly what this
  // preference exists to stop. The finished state has to survive it, so this
  // asserts both halves: nothing loops, and nothing is left invisible.
  const calm = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
  await calm.goto(BASE);
  try {
    await calm.locator('.onboard-skip').click({ timeout: 4000 });
  } catch {
    /* already dismissed */
  }
  await calm.locator('.hero').waitFor({ timeout: 10000 });
  await calm.waitForTimeout(1600);
  const looping = await calm.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running' && a.effect?.getTiming?.().iterations === Infinity).length
  );
  check(looping === 0, `reduced motion: nothing loops (${looping} running)`);
  const calmBox = await calm.locator('.hero-next').boundingBox();
  await calm.mouse.move(calmBox.x + 20, calmBox.y + 20);
  await calm.waitForTimeout(300);
  check(
    (await calm.evaluate(() => document.querySelector('.hero-next').style.getPropertyValue('--rx'))) === '',
    'reduced motion: the pointer field never even attaches'
  );
  const calmHidden = await calm.evaluate(
    () => [...document.querySelectorAll('[data-reveal]')].filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length
  );
  check(calmHidden === 0, `reduced motion: every block is still fully visible (${calmHidden} hidden)`);
  check(
    (await calm.locator('.hero-next-title').innerText()).length > 3,
    'reduced motion: the page still says what to do next'
  );
  await calm.close();

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
