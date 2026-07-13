import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return String(v);
}

// A transform as a pipeline: an input row flows through an expression and an
// output row builds beneath it, each result cell springing in one after another
// (anime.js stagger). Covers comprehensions, sorting, enumerate/zip/.items and
// the split → process → join string pipeline — "motion of a list" made literal.
export default function PipeFlow({ visual, beatIndex }) {
  const animate = useAnime();
  const outRefs = useRef([]);
  const beat = visual.beats[beatIndex] ?? {};
  const input = beat.input ?? [];
  const output = beat.output ?? [];

  useEffect(() => {
    const cells = outRefs.current.filter(Boolean);
    if (cells.length) animate(cells, presets.enter());
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-pipe" key={beatIndex}>
      <div className="vw-pipe-row">
        {input.map((v, i) => (
          <span key={i} className="vw-pipe-cell">
            {formatVal(v)}
          </span>
        ))}
      </div>
      <div className="vw-pipe-mid">
        {beat.label && <code className="vw-pipe-label">{beat.label}</code>}
        <span className="vw-pipe-arrow" aria-hidden="true">
          ↓
        </span>
      </div>
      <div className="vw-pipe-row vw-pipe-out">
        {output.map((v, i) => (
          <span key={i} ref={(el) => (outRefs.current[i] = el)} className="vw-pipe-cell out">
            {formatVal(v)}
          </span>
        ))}
      </div>
    </div>
  );
}
