import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// A dict as key→value rows. Each beat looks up a key: a present key pulses its
// row; a MISSING key lights up the fallback path — the exact reason .get(k, 0)
// exists, made visible.
export default function DictLookup({ visual, beatIndex }) {
  const animate = useAnime();
  const rowRefs = useRef({});
  const fallbackRef = useRef(null);
  const beat = visual.beats[beatIndex] ?? {};
  const keys = Object.keys(visual.pairs);
  const present = beat.key in visual.pairs;

  useEffect(() => {
    if (present && rowRefs.current[beat.key]) {
      animate(rowRefs.current[beat.key], presets.pulse());
    } else if (!present && fallbackRef.current) {
      animate(fallbackRef.current, presets.shade());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-dict">
      <div className="vw-dict-rows">
        {keys.map((k) => (
          <div
            key={k}
            ref={(el) => (rowRefs.current[k] = el)}
            className={`vw-dict-row ${present && beat.key === k ? 'active' : ''}`}
          >
            <span className="vw-dict-key">{formatVal(k)}</span>
            <span className="vw-dict-arrow">→</span>
            <span className="vw-dict-val">{formatVal(visual.pairs[k])}</span>
          </div>
        ))}
      </div>
      <div className="vw-dict-query">
        <code>
          d.get({formatVal(beat.key)}
          {beat.fallback !== undefined ? `, ${formatVal(beat.fallback)}` : ''})
        </code>
        <span className="vw-dict-result">
          →{' '}
          {present ? (
            <strong>{formatVal(visual.pairs[beat.key])}</strong>
          ) : (
            <strong ref={fallbackRef} className="vw-dict-fallback">
              {beat.fallback !== undefined ? formatVal(beat.fallback) : 'None'}
            </strong>
          )}
        </span>
      </div>
    </div>
  );
}
