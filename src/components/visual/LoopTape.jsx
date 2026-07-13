import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// A loop as a tape: the loop variable steps item-by-item (a ▲ marker glides,
// anime.js) while an accumulator box climbs — the accumulate / count / best
// shapes made watchable.
export default function LoopTape({ visual, beatIndex }) {
  const animate = useAnime();
  const cellRefs = useRef([]);
  const markerRef = useRef(null);
  const accRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const at = beat.at; // index into items, or -1/undefined = before/after
  const prevAcc = beatIndex > 0 ? visual.beats[beatIndex - 1].acc : undefined;

  useEffect(() => {
    if (at != null && at >= 0 && cellRefs.current[at] && markerRef.current) {
      const cell = cellRefs.current[at];
      const x = cell.offsetLeft + cell.offsetWidth / 2 - markerRef.current.offsetWidth / 2;
      animate(markerRef.current, presets.slideTo(x));
      animate(cell, presets.pulse());
    }
    if (beat.acc !== undefined && beat.acc !== prevAcc && accRef.current) {
      animate(accRef.current, presets.pulse());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-looptape">
      <div className="vw-cells">
        {visual.items.map((v, i) => (
          <div
            key={i}
            ref={(el) => (cellRefs.current[i] = el)}
            className={`vw-cell ${at === i ? 'active' : ''}`}
          >
            <span className="vw-cell-val">{formatVal(v)}</span>
          </div>
        ))}
        {at != null && at >= 0 && (
          <span className="vw-pointer" ref={markerRef} aria-hidden="true">
            ▲
          </span>
        )}
      </div>
      {beat.acc !== undefined && (
        <div className="vw-acc">
          <span className="vw-acc-label">{visual.accLabel ?? 'so far'}</span>
          <span className="vw-acc-box" ref={accRef}>
            {formatVal(beat.acc)}
          </span>
        </div>
      )}
    </div>
  );
}
