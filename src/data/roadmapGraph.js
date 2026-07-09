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
