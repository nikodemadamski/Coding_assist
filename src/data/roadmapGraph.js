// Layout data for the visual roadmap tree (NeetCode-style). Node positions are
// hand-placed on a fixed canvas; edges express "learn this before that".
// Keys must match ROADMAP category keys in roadmap.js.

export const GRAPH_W = 840;
export const GRAPH_H = 800;
export const NODE_W = 168;
export const NODE_H = 56;

// The map is the ALGORITHM path only — pandas and SQL are separate data tracks
// (surfaced beside the map, not woven into it). x,y are the node's top-left.
export const GRAPH_NODES = [
  { key: 'warmups', x: 336, y: 20 },
  { key: 'arrays-hashing', x: 336, y: 120 },
  { key: 'two-pointers', x: 180, y: 220 },
  { key: 'stack', x: 500, y: 220 },
  { key: 'linked-list', x: 40, y: 320 },
  { key: 'sliding-window', x: 300, y: 320 },
  { key: 'binary-search', x: 560, y: 320 },
  { key: 'trees', x: 336, y: 420 },
  { key: 'tries', x: 80, y: 520 },
  { key: 'heap', x: 336, y: 520 },
  { key: 'backtracking', x: 592, y: 520 },
  { key: 'greedy', x: 40, y: 620 },
  { key: 'intervals', x: 250, y: 620 },
  { key: 'graphs', x: 460, y: 620 },
  { key: 'dp', x: 668, y: 620 },
  { key: 'math-geometry', x: 380, y: 720 },
  { key: 'bits', x: 620, y: 720 },
];

export const GRAPH_EDGES = [
  ['warmups', 'arrays-hashing'],
  ['arrays-hashing', 'two-pointers'],
  ['arrays-hashing', 'stack'],
  ['two-pointers', 'linked-list'],
  ['two-pointers', 'sliding-window'],
  ['two-pointers', 'binary-search'],
  ['linked-list', 'trees'],
  ['binary-search', 'trees'],
  ['trees', 'tries'],
  ['trees', 'heap'],
  ['trees', 'backtracking'],
  ['heap', 'greedy'],
  ['heap', 'intervals'],
  ['backtracking', 'graphs'],
  ['backtracking', 'dp'],
  ['graphs', 'math-geometry'],
  ['dp', 'bits'],
];

// Categories that live OFF the algorithm map — the data tracks and the
// imported-questions catch-all. Used to keep the graph/roadmap tests honest.
export const OFF_MAP_CATEGORIES = ['pandas', 'sql', 'other'];

// The chain of edges from the top of the map down to `key` — the route you
// actually took to arrive where you are. The home page animates a travelling
// current along exactly these edges, so "you are here" is legible from the
// shape of the map before you read a single label.
//
// Shortest route wins when a topic has two parents (trees is reachable via both
// linked-list and binary-search): one lit path reads as a route, two read as a
// diagram. Returns a Set of "from>to" keys — cheap to test an edge against
// while rendering. Unknown keys and cycles both yield an empty set.
export function pathEdgesTo(edges, key) {
  const live = new Set();
  if (!key) return live;
  const parents = new Map(); // node -> the edge that first reached it
  const roots = new Set(edges.map(([from]) => from));
  for (const [, to] of edges) roots.delete(to);
  if (!roots.size) return live;

  // BFS down from the roots, so the first edge to reach a node is on a
  // shortest route to it.
  const queue = [...roots];
  const seen = new Set(queue);
  while (queue.length) {
    const node = queue.shift();
    if (node === key) break;
    for (const [from, to] of edges) {
      if (from !== node || seen.has(to)) continue;
      seen.add(to);
      parents.set(to, [from, to]);
      queue.push(to);
    }
  }
  if (!seen.has(key)) return live;

  for (let at = key; parents.has(at); ) {
    const [from, to] = parents.get(at);
    live.add(`${from}>${to}`);
    at = from;
  }
  return live;
}

// What the home map should actually light up for the topic you're on.
//
// Normally that's the route down to you. But at the very top of the map there
// IS no route in — a brand-new learner standing on warm-ups would see a dead
// map, which is exactly the person who most needs it to point somewhere. So in
// that one case it lights the way OUT instead: where this topic leads next.
export function liveRouteFor(edges, key) {
  const toHere = pathEdgesTo(edges, key);
  if (toHere.size || !key) return toHere;
  const onward = new Set();
  for (const [from, to] of edges) {
    if (from === key) onward.add(`${from}>${to}`);
  }
  return onward;
}
