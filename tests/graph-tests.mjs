// Pure tests for the map's "route to where you are" highlight.
import { GRAPH_EDGES, GRAPH_NODES, pathEdgesTo, liveRouteFor } from '../src/data/roadmapGraph.js';

let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
  if (!cond) failures++;
};

console.log('Graph tests');

const rootChain = pathEdgesTo(GRAPH_EDGES, 'arrays-hashing');
check(rootChain.size === 1 && rootChain.has('warmups>arrays-hashing'), 'one hop from the top lights one edge');

check(pathEdgesTo(GRAPH_EDGES, 'warmups').size === 0, 'the top of the map has no route into it');
check(pathEdgesTo(GRAPH_EDGES, null).size === 0, 'no current topic lights nothing');
check(pathEdgesTo(GRAPH_EDGES, 'nonexistent').size === 0, 'an unknown topic lights nothing');

const deep = pathEdgesTo(GRAPH_EDGES, 'dp');
check(
  deep.has('warmups>arrays-hashing') &&
    deep.has('arrays-hashing>two-pointers') &&
    deep.has('trees>backtracking') &&
    deep.has('backtracking>dp'),
  'a deep topic lights the whole chain back to the top'
);

// trees has two parents; exactly one route may light, or it reads as a diagram
const trees = pathEdgesTo(GRAPH_EDGES, 'trees');
const treeParents = [...trees].filter((e) => e.endsWith('>trees'));
check(treeParents.length === 1, `a topic with two parents lights one route, not both (${treeParents.length})`);

// the lit chain must be a real, connected walk from a root
const chainIsWalk = (key) => {
  const lit = [...pathEdgesTo(GRAPH_EDGES, key)].map((e) => e.split('>'));
  if (!lit.length) return true;
  const tos = new Set(lit.map(([, to]) => to));
  const froms = lit.map(([from]) => from);
  // every edge except the first starts where another one ended
  const starts = froms.filter((f) => !tos.has(f));
  return starts.length === 1 && tos.has(key);
};
check(
  GRAPH_NODES.every((n) => chainIsWalk(n.key)),
  'every topic on the map lights one connected walk that ends at it'
);

// a cycle must terminate rather than spin
check(
  pathEdgesTo([['a', 'b'], ['b', 'a']], 'b').size === 0,
  'a graph with no root terminates instead of looping'
);
check(
  pathEdgesTo([['a', 'b'], ['b', 'c'], ['c', 'b']], 'c').size === 2,
  'a cycle below the root still resolves a finite route'
);

// What the home page actually lights: never nothing, wherever you're standing.
check(
  liveRouteFor(GRAPH_EDGES, 'dp').size === pathEdgesTo(GRAPH_EDGES, 'dp').size,
  'below the top, the live route is just the route in'
);
const atTop = liveRouteFor(GRAPH_EDGES, 'warmups');
check(
  atTop.size === 1 && atTop.has('warmups>arrays-hashing'),
  'at the top of the map it lights the way onward instead of nothing'
);
check(liveRouteFor(GRAPH_EDGES, null).size === 0, 'no current topic still lights nothing');
check(
  GRAPH_NODES.every((n) => liveRouteFor(GRAPH_EDGES, n.key).size > 0),
  'every topic on the map lights something — the map is never dead'
);

console.log(failures === 0 ? 'All graph tests green.' : `${failures} graph test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
