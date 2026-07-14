import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// A linked list drawn as value boxes joined by → arrows, ending in None. A
// pointer glides along it (curr / prev), and a 'reversed' beat flips the arrows
// — so .next traversal and the three-pointer reversal become something you watch.
export default function NodeChain({ visual, beatIndex }) {
  const animate = useAnime();
  const nodeRefs = useRef([]);
  const pointerRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const nodes = visual.nodes ?? [];
  const reversed = !!beat.reversed;
  const activeIdx = beat.pointer !== undefined && beat.pointer !== null ? beat.pointer : null;

  useEffect(() => {
    if (activeIdx != null) {
      const cell = nodeRefs.current[activeIdx];
      if (cell && pointerRef.current) {
        const x = cell.offsetLeft + cell.offsetWidth / 2 - pointerRef.current.offsetWidth / 2;
        animate(pointerRef.current, presets.slideTo(x));
        animate(cell, presets.pulse());
      }
    }
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  const order = reversed ? [...nodes.keys()].reverse() : [...nodes.keys()];

  return (
    <div className="vw vw-chain">
      <div className="vw-chain-row">
        {order.map((idx, pos) => (
          <div className="vw-chain-node-wrap" key={idx}>
            <div ref={(el) => (nodeRefs.current[idx] = el)} className={`vw-chain-node ${activeIdx === idx ? 'active' : ''}`}>
              {formatVal(nodes[idx])}
            </div>
            <span className="vw-chain-arrow" aria-hidden="true">
              →
            </span>
            {pos === order.length - 1 && <span className="vw-chain-none">None</span>}
          </div>
        ))}
        {activeIdx != null && (
          <span className="vw-chain-ptr" ref={pointerRef} aria-hidden="true">
            ▲{beat.pointerLabel ? <span className="vw-ptr-label">{beat.pointerLabel}</span> : null}
          </span>
        )}
      </div>
    </div>
  );
}
