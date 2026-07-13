import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// A list drawn as indexed cells. On each beat a ▲ pointer glides to the active
// index (anime.js), the cell pulses, and a slice range shades in — so indexing,
// negative indexes and slicing become something you watch, not memorize.
export default function ListCells({ visual, beatIndex }) {
  const animate = useAnime();
  const cellRefs = useRef([]);
  const pointerRef = useRef(null);
  const len = visual.list.length;
  const beat = visual.beats[beatIndex] ?? {};
  const resolve = (p) => (p < 0 ? len + p : p);
  const activeIdx = beat.pointer !== undefined ? resolve(beat.pointer) : null;
  const slice = beat.slice ?? null;

  useEffect(() => {
    if (activeIdx != null) {
      const cell = cellRefs.current[activeIdx];
      if (cell && pointerRef.current) {
        const x = cell.offsetLeft + cell.offsetWidth / 2 - pointerRef.current.offsetWidth / 2;
        animate(pointerRef.current, presets.slideTo(x));
        animate(cell, presets.pulse());
      }
    }
    if (slice) {
      const shaded = [];
      for (let i = slice[0]; i < slice[1]; i++) {
        if (cellRefs.current[i]) shaded.push(cellRefs.current[i]);
      }
      if (shaded.length) animate(shaded, presets.shade());
    }
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-listcells">
      <div className="vw-cells">
        {visual.list.map((v, i) => {
          const inSlice = slice && i >= slice[0] && i < slice[1];
          return (
            <div
              key={i}
              ref={(el) => (cellRefs.current[i] = el)}
              className={`vw-cell ${inSlice ? 'shaded' : ''} ${activeIdx === i ? 'active' : ''}`}
            >
              <span className="vw-cell-val">{formatVal(v)}</span>
              <span className="vw-cell-idx">{i}</span>
            </div>
          );
        })}
        {activeIdx != null && (
          <span className="vw-pointer" ref={pointerRef} aria-hidden="true">
            ▲
          </span>
        )}
      </div>
    </div>
  );
}
