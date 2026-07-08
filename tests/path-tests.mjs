// The learning path must stay in lockstep with the question bank: every seed
// question exactly once, new-question practice served in path order.
import { SEED_QUESTIONS } from '../src/data/questions.js';
import { PATH, ROADMAP, pathStep, byPathOrder, nextOnPath } from '../src/data/roadmap.js';
import { GRAPH_NODES, GRAPH_EDGES, GRAPH_W, GRAPH_H, NODE_W, NODE_H } from '../src/data/roadmapGraph.js';
import { createSession } from '../src/state/practiceSession.js';
import { EMPTY_PROGRESS } from '../src/state/storage.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Learning-path tests\n');

// ---- the path covers the bank exactly ----
{
  const bankIds = new Set(SEED_QUESTIONS.map((q) => q.id));
  const pathIds = new Set(PATH);
  const missingFromPath = [...bankIds].filter((id) => !pathIds.has(id));
  const unknownOnPath = PATH.filter((id) => !bankIds.has(id));
  check(missingFromPath.length === 0, 'every seed question is on the path', missingFromPath.join(', '));
  check(unknownOnPath.length === 0, 'the path references only real questions', unknownOnPath.join(', '));
  check(pathIds.size === PATH.length, 'no duplicate steps on the path');
  check(PATH.length === SEED_QUESTIONS.length, `path length matches bank (${PATH.length})`);
  check(pathStep(PATH[0]) === 1 && pathStep(PATH[PATH.length - 1]) === PATH.length, 'steps are 1-based and dense');
  check(pathStep('not-a-question') === null, 'off-path ids have no step');
}

// ---- teaching order sanity: foundations before bosses ----
{
  const before = (a, b) => pathStep(a) < pathStep(b);
  check(before('py-reverse-string', 'py-two-sum'), 'warm-ups come before hashing');
  check(before('py-two-sum', 'py-three-sum'), 'Two Sum before 3Sum');
  check(before('py-contains-duplicate', 'py-valid-anagram'), 'Contains Duplicate before Valid Anagram');
  check(before('py-valid-anagram', 'py-group-anagrams'), 'Valid Anagram before Group Anagrams');
  check(before('py-binary-search', 'py-search-rotated'), 'plain binary search before rotated');
  check(before('py-max-depth-tree', 'py-validate-bst'), 'tree basics before validate-BST');
  check(before('py-climbing-stairs', 'py-coin-change'), 'climbing stairs before coin change');
  check(before('sql-select-where', 'sql-window-top-per-group'), 'SELECT before window functions');
}

// ---- practice serves new questions in path order ----
{
  const session = createSession(structuredClone(EMPTY_PROGRESS), SEED_QUESTIONS, { seed: 42 });
  check(session.review.length === 0, 'fresh progress has no reviews');
  check(session.fresh.length === SEED_QUESTIONS.length, 'all questions queued as new');
  check(
    JSON.stringify(session.fresh) === JSON.stringify(PATH),
    'new-question queue IS the path, in order'
  );

  // With the first two steps solved, the session continues at step 3.
  const p = structuredClone(EMPTY_PROGRESS);
  p.solved = {
    [PATH[0]]: { solves: 1, attempts: 1 },
    [PATH[1]]: { solves: 1, attempts: 1 },
  };
  p.srs = {
    [PATH[0]]: { stage: 0, nextDue: '2999-01-01' },
    [PATH[1]]: { stage: 0, nextDue: '2999-01-01' },
  };
  const resumed = createSession(p, SEED_QUESTIONS, { seed: 7 });
  check(resumed.fresh[0] === PATH[2], 'practice resumes exactly where you left off (step 3)');

  const next = nextOnPath(SEED_QUESTIONS, (id) => !!p.solved[id]);
  check(next?.id === PATH[2], 'nextOnPath agrees with the session queue');
}

// ---- byPathOrder puts imported (off-path) questions last ----
{
  const mixed = [
    { id: 'imported-zzz' },
    { id: PATH[5] },
    { id: 'imported-aaa' },
    { id: PATH[0] },
  ].sort(byPathOrder);
  check(
    mixed[0].id === PATH[0] && mixed[1].id === PATH[5],
    'path questions sort by step',
    mixed.map((q) => q.id).join(',')
  );
  check(
    mixed[2].id === 'imported-zzz' && mixed[3].id === 'imported-aaa',
    'imported questions keep their order after the path'
  );
}

// ---- the visual roadmap graph stays in lockstep with the categories ----
{
  const catKeys = new Set(ROADMAP.map((c) => c.key));
  const nodeKeys = new Set(GRAPH_NODES.map((n) => n.key));
  check(
    GRAPH_NODES.length === ROADMAP.length && [...catKeys].every((k) => nodeKeys.has(k)),
    `graph has a node for every roadmap category (${GRAPH_NODES.length}/${ROADMAP.length})`
  );
  check(nodeKeys.size === GRAPH_NODES.length, 'no duplicate graph nodes');
  const badEdges = GRAPH_EDGES.filter(([a, b]) => !nodeKeys.has(a) || !nodeKeys.has(b));
  check(badEdges.length === 0, 'every edge connects real nodes', JSON.stringify(badEdges));
  check(
    GRAPH_NODES.every((n) => n.x >= 0 && n.y >= 0 && n.x + NODE_W <= GRAPH_W && n.y + NODE_H <= GRAPH_H),
    'every node fits inside the canvas'
  );
  const overlap = GRAPH_NODES.some((a, i) =>
    GRAPH_NODES.slice(i + 1).some(
      (b) => Math.abs(a.x - b.x) < NODE_W && Math.abs(a.y - b.y) < NODE_H
    )
  );
  check(!overlap, 'no two nodes overlap');
}

console.log(failures === 0 ? '\nAll path tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
