import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// Lay a nested [value, left, right] tree out by in-order column (x) and depth
// (y), keyed by path from the root ('' | 'L' | 'RL' | ...).
function layout(tree) {
  const nodes = [];
  const edges = [];
  let col = 0;
  let maxDepth = 0;
  const walk = (node, path, depth) => {
    if (!node) return;
    walk(node[1], `${path}L`, depth + 1);
    const c = col++;
    nodes.push({ path, value: node[0], depth, col: c });
    maxDepth = Math.max(maxDepth, depth);
    if (node[1]) edges.push([path, `${path}L`]);
    if (node[2]) edges.push([path, `${path}R`]);
    walk(node[2], `${path}R`, depth + 1);
  };
  walk(tree, '', 0);
  return { nodes, edges, cols: col, maxDepth };
}

// A binary tree drawn as positioned nodes and edges (inline SVG). Each beat lights
// up the node being visited, so DFS/BFS orders, backtracking's decision tree, and
// a trie's letter path become a sequence you tap through and watch.
export default function TreeView({ visual, beatIndex }) {
  const animate = useAnime();
  const activeRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const { nodes, edges, cols, maxDepth } = layout(visual.tree);
  const pos = Object.fromEntries(
    nodes.map((n) => [n.path, { x: ((n.col + 0.5) / cols) * 100, y: ((n.depth + 0.5) / (maxDepth + 1)) * 100 }])
  );
  const visited = new Set(beat.visited ?? []);

  useEffect(() => {
    if (activeRef.current) animate(activeRef.current, presets.popIn());
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-tree">
      <svg className="vw-tree-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img">
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            className="vw-tree-edge"
            x1={pos[a].x}
            y1={pos[a].y}
            x2={pos[b].x}
            y2={pos[b].y}
          />
        ))}
        {nodes.map((n) => {
          const active = beat.active === n.path;
          const cls = `vw-tree-node ${active ? 'active' : ''} ${visited.has(n.path) ? 'visited' : ''}`;
          return (
            <g key={n.path} className={cls} transform={`translate(${pos[n.path].x} ${pos[n.path].y})`}>
              {/* ref the circle (centred at its own origin) so a scale pulse never
                  fights the group's positioning translate. */}
              <circle r="7" ref={active ? activeRef : null} />
              <text textAnchor="middle" dominantBaseline="central">
                {formatVal(n.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
