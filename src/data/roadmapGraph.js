// Layout data for the visual roadmap tree (NeetCode-style). Node positions are
// hand-placed on a fixed canvas; edges express "learn this before that".
// Keys must match ROADMAP category keys in roadmap.js.

export const GRAPH_W = 840;
export const GRAPH_H = 950;
export const NODE_W = 168;
export const NODE_H = 56;

// x,y are the node's top-left corner.
export const GRAPH_NODES = [
  { key: 'warmups', x: 336, y: 20 },
  { key: 'pandas', x: 60, y: 130 },
  { key: 'sql', x: 40, y: 240 },
  { key: 'arrays-hashing', x: 336, y: 130 },
  { key: 'two-pointers', x: 216, y: 240 },
  { key: 'stack', x: 476, y: 240 },
  { key: 'linked-list', x: 60, y: 350 },
  { key: 'sliding-window', x: 296, y: 350 },
  { key: 'binary-search', x: 532, y: 350 },
  { key: 'trees', x: 336, y: 460 },
  { key: 'tries', x: 100, y: 570 },
  { key: 'heap', x: 336, y: 570 },
  { key: 'backtracking', x: 572, y: 570 },
  { key: 'greedy', x: 100, y: 680 },
  { key: 'intervals', x: 300, y: 680 },
  { key: 'graphs', x: 500, y: 680 },
  { key: 'dp', x: 672, y: 680 },
  { key: 'math-geometry', x: 400, y: 790 },
  { key: 'bits', x: 630, y: 790 },
  // Catch-all for imported questions with unknown patterns; the graph hides
  // it while it's empty.
  { key: 'other', x: 100, y: 874 },
];

export const GRAPH_EDGES = [
  ['warmups', 'arrays-hashing'],
  ['warmups', 'pandas'],
  ['pandas', 'sql'],
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
