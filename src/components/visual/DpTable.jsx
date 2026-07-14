import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

// A dynamic-programming table (1-D row or 2-D grid). Each beat lights the cell
// just computed (gold) and the earlier cells it was built from (jade) — so
// "dp[i] comes from dp[i-1] + dp[i-2]" becomes something you watch fill in.
export default function DpTable({ visual, beatIndex }) {
  const animate = useAnime();
  const activeRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const grid = visual.grid ?? [];
  const active = beat.active ?? null;
  const deps = new Set((beat.deps ?? []).map(([r, c]) => `${r},${c}`));

  useEffect(() => {
    if (activeRef.current) animate(activeRef.current, presets.popIn());
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-dp">
      <table className="vw-dp-grid">
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {visual.rowLabels && <th className="vw-dp-label">{visual.rowLabels[r]}</th>}
              {row.map((val, c) => {
                const isActive = active && active[0] === r && active[1] === c;
                const isDep = deps.has(`${r},${c}`);
                return (
                  <td
                    key={c}
                    ref={isActive ? activeRef : null}
                    className={`vw-dp-cell ${isActive ? 'active' : ''} ${isDep ? 'dep' : ''}`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
