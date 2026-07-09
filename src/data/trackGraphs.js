// Dedicated map trees for the data tracks. The algorithm map lives in
// roadmapGraph.js; these are the pandas and SQL journeys, keyed by each
// question's `pattern` (not the roadmap category), so a node maps to one
// sub-topic. Node size reuses the algorithm map's NODE_W / NODE_H.

export const TRACK_GRAPHS = {
  pandas: {
    label: 'pandas',
    icon: '🐼',
    W: 560,
    H: 520,
    nodes: [
      { key: 'selection', label: 'Select columns', x: 196, y: 20 },
      { key: 'filtering', label: 'Filter rows', x: 196, y: 110 },
      { key: 'transform', label: 'Computed columns', x: 30, y: 200 },
      { key: 'sorting', label: 'Sort & Top-N', x: 362, y: 200 },
      { key: 'groupby', label: 'Group & aggregate', x: 196, y: 300 },
      { key: 'merge', label: 'Merge / join', x: 30, y: 400 },
      { key: 'missing-data', label: 'Missing data', x: 362, y: 400 },
    ],
    edges: [
      ['selection', 'filtering'],
      ['filtering', 'transform'],
      ['filtering', 'sorting'],
      ['transform', 'groupby'],
      ['sorting', 'groupby'],
      ['groupby', 'merge'],
      ['groupby', 'missing-data'],
    ],
  },
  sql: {
    label: 'SQL',
    icon: '🗄',
    W: 560,
    H: 610,
    nodes: [
      { key: 'select-where', label: 'SELECT · WHERE', x: 196, y: 20 },
      { key: 'order-limit', label: 'ORDER BY · LIMIT', x: 196, y: 110 },
      { key: 'group-by', label: 'GROUP BY', x: 196, y: 200 },
      { key: 'having', label: 'HAVING', x: 196, y: 290 },
      { key: 'join', label: 'JOIN', x: 196, y: 390 },
      { key: 'subquery', label: 'Subqueries', x: 30, y: 490 },
      { key: 'window-functions', label: 'Window functions', x: 362, y: 490 },
    ],
    edges: [
      ['select-where', 'order-limit'],
      ['order-limit', 'group-by'],
      ['group-by', 'having'],
      ['having', 'join'],
      ['join', 'subquery'],
      ['join', 'window-functions'],
    ],
  },
};
