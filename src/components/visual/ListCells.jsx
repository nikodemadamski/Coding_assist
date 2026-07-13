import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// A list drawn as indexed cells. On each beat a ▲ pointer glides to the active
// index (anime.js), the cell pulses, and a slice range shades in — so indexing,
// negative indexes and slicing become something you watch, not memorize. A
// second pointer (beat.pointer2, with optional labels) draws the two-ends /
// two-speed walk behind a whole family of array problems.
export default function ListCells({ visual, beatIndex }) {
  const animate = useAnime();
  const cellRefs = useRef([]);
  const pointerRef = useRef(null);
  const pointer2Ref = useRef(null);
  const midRef = useRef(null);
  const len = visual.list.length;
  const beat = visual.beats[beatIndex] ?? {};
  const resolve = (p) => (p < 0 ? len + p : p);
  const activeIdx = beat.pointer !== undefined ? resolve(beat.pointer) : null;
  const activeIdx2 = beat.pointer2 !== undefined ? resolve(beat.pointer2) : null;
  const activeMid = beat.mid !== undefined ? resolve(beat.mid) : null;
  const slice = beat.slice ?? null;

  // The cells spring in one after another the first time the widget appears.
  useEffect(() => {
    const cells = cellRefs.current.filter(Boolean);
    if (cells.length) animate(cells, presets.enter());
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const glide = (idx, ref) => {
      if (idx == null) return;
      const cell = cellRefs.current[idx];
      if (cell && ref.current) {
        const x = cell.offsetLeft + cell.offsetWidth / 2 - ref.current.offsetWidth / 2;
        animate(ref.current, presets.slideTo(x));
        animate(cell, presets.pulse());
      }
    };
    glide(activeIdx, pointerRef);
    glide(activeIdx2, pointer2Ref);
    glide(activeMid, midRef);
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
          const active = activeIdx === i || activeIdx2 === i || activeMid === i;
          return (
            <div
              key={i}
              ref={(el) => (cellRefs.current[i] = el)}
              className={`vw-cell ${inSlice ? 'shaded' : ''} ${active ? 'active' : ''}`}
            >
              <span className="vw-cell-val">{formatVal(v)}</span>
              <span className="vw-cell-idx">{i}</span>
            </div>
          );
        })}
        {activeIdx != null && (
          <span className="vw-pointer" ref={pointerRef} aria-hidden="true">
            ▲{beat.pointerLabel ? <span className="vw-ptr-label">{beat.pointerLabel}</span> : null}
          </span>
        )}
        {activeIdx2 != null && (
          <span className="vw-pointer vw-pointer2" ref={pointer2Ref} aria-hidden="true">
            ▲{beat.pointer2Label ? <span className="vw-ptr-label">{beat.pointer2Label}</span> : null}
          </span>
        )}
        {activeMid != null && (
          <span className="vw-pointer vw-pointer-mid" ref={midRef} aria-hidden="true">
            ▲{beat.midLabel ? <span className="vw-ptr-label">{beat.midLabel}</span> : null}
          </span>
        )}
      </div>
    </div>
  );
}
