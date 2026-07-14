import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

// A graph as positioned nodes + edges (inline SVG). Each beat marks the node
// being visited (gold), the ones already done (jade), and the frontier waiting in
// the queue/stack (outlined) — so BFS spreading in rings and DFS diving deep both
// become a sequence you tap through.
export default function GraphView({ visual, beatIndex }) {
  const animate = useAnime();
  const activeRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const pos = Object.fromEntries(visual.nodes.map((n) => [n.id, n]));
  const visited = new Set(beat.visited ?? []);
  const frontier = new Set(beat.frontier ?? []);

  useEffect(() => {
    if (activeRef.current) animate(activeRef.current, presets.popIn());
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-graph">
      <svg className="vw-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img">
        {visual.edges.map(([a, b]) => (
          <line key={`${a}-${b}`} className="vw-graph-edge" x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
        ))}
        {visual.nodes.map((n) => {
          const active = beat.active === n.id;
          const cls = `vw-graph-node ${active ? 'active' : ''} ${visited.has(n.id) ? 'visited' : ''} ${
            frontier.has(n.id) ? 'frontier' : ''
          }`;
          return (
            <g key={n.id} className={cls} transform={`translate(${n.x} ${n.y})`}>
              <circle r="8" ref={active ? activeRef : null} />
              <text textAnchor="middle" dominantBaseline="central">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
