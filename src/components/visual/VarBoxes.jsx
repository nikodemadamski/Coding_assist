import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// Variables as labeled boxes. Each beat is a snapshot of the variables; a box
// whose value changed fades the new value in (anime.js) — so assignment,
// reassignment and swaps become visible instead of abstract.
export default function VarBoxes({ visual, beatIndex }) {
  const animate = useAnime();
  const rootRef = useRef(null);
  const valRefs = useRef({});
  const beat = visual.beats[beatIndex] ?? {};
  const prev = beatIndex > 0 ? visual.beats[beatIndex - 1].vars ?? {} : {};
  const vars = beat.vars ?? {};
  const names = Object.keys(vars);

  // The boxes spring in one after another when the widget first appears.
  useEffect(() => {
    const boxes = rootRef.current?.querySelectorAll('.vw-var');
    if (boxes?.length) animate(boxes, presets.enter());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    for (const name of names) {
      if (prev[name] !== vars[name] && valRefs.current[name]) {
        animate(valRefs.current[name], presets.fadeSwap());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-varboxes" ref={rootRef}>
      <div className="vw-vars">
        {names.map((name) => (
          <div key={name} className="vw-var">
            <span className="vw-var-name">{name}</span>
            <span className="vw-var-box">
              <span ref={(el) => (valRefs.current[name] = el)} className="vw-var-val">
                {formatVal(vars[name])}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
