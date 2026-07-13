import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

// Decisions made visible. Each beat is a set of ordered branches (an if/elif/else
// chain, a True/False split, or a try/except); a marker drops down the rail to
// the ONE branch that runs, that rung lights up, and the skipped rungs dim — so
// "the first true branch wins, the rest are skipped" becomes something you watch.
export default function BranchFlow({ visual, beatIndex }) {
  const animate = useAnime();
  const markerRef = useRef(null);
  const rungRefs = useRef([]);
  const beat = visual.beats[beatIndex] ?? {};
  const branches = beat.branches ?? [];
  const takenIdx = branches.findIndex((b) => b.taken);

  useEffect(() => {
    const target = takenIdx >= 0 ? rungRefs.current[takenIdx] : null;
    if (target && markerRef.current) {
      const y = target.offsetTop + target.offsetHeight / 2 - markerRef.current.offsetHeight / 2;
      animate(markerRef.current, presets.glideY(y));
      animate(target, presets.pulse());
    }
    // Re-run only when the beat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-branch">
      {beat.value && (
        <div className="vw-br-value">
          <code>{beat.value}</code>
        </div>
      )}
      <div className="vw-br-body">
        <span className="vw-br-rail" aria-hidden="true">
          {takenIdx >= 0 && (
            <span className="vw-br-marker" ref={markerRef}>
              ▶
            </span>
          )}
        </span>
        <ol className="vw-br-rungs">
          {branches.map((b, i) => (
            <li
              key={i}
              ref={(el) => (rungRefs.current[i] = el)}
              className={`vw-br-rung ${b.taken ? 'taken' : 'skipped'}`}
            >
              <code className="vw-br-test">{b.test}</code>
              <span className="vw-br-arrow" aria-hidden="true">
                →
              </span>
              <code className="vw-br-label">{b.label}</code>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
