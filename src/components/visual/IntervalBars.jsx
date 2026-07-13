import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

// Intervals drawn as horizontal bars on a shared number line, so overlaps are
// something you SEE. Each beat is a set of [start, end] bars; a 'merged' beat
// shows the collapsed result — teaching sort-by-start then merge-overlaps.
export default function IntervalBars({ visual, beatIndex }) {
  const animate = useAnime();
  const rootRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const bars = beat.bars ?? [];
  const scale = visual.scale || 10;

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.vw-ib-bar');
    if (els?.length) animate(els, presets.enter());
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-intervals" ref={rootRef} key={beatIndex}>
      <div className="vw-ib-rows">
        {bars.map(([start, end], i) => (
          <div className="vw-ib-track" key={i}>
            <span
              className={`vw-ib-bar ${beat.tone === 'merged' ? 'merged' : ''}`}
              style={{ left: `${(start / scale) * 100}%`, width: `${((end - start) / scale) * 100}%` }}
            >
              {start}–{end}
            </span>
          </div>
        ))}
      </div>
      <div className="vw-ib-axis" aria-hidden="true">
        {Array.from({ length: scale + 1 }, (_, n) => (
          <span key={n} className="vw-ib-tick">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
