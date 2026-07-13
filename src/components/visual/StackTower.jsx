import { useEffect, useRef } from 'react';
import { useAnime } from '../../anim/useAnime.js';
import { presets } from '../../anim/presets.js';

function formatVal(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

// A stack as a tower: push pops a box in on top (anime.js popIn), pop lifts the
// top box off (popOut), peek pulses it — last-in-first-out made physical.
export default function StackTower({ visual, beatIndex }) {
  const animate = useAnime();
  const topRef = useRef(null);

  // Replay the ops from the start up to this beat so the tower is always the
  // correct height for the current beat (beats are re-entrant on Replay).
  const [stack, ops] = buildStack(visual.beats, beatIndex);

  useEffect(() => {
    const op = visual.beats[beatIndex]?.op;
    if (op === 'push' && topRef.current) {
      animate(topRef.current, presets.popIn());
    } else if ((op === 'peek' || op === 'pop') && topRef.current) {
      animate(topRef.current, presets.pulse());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  return (
    <div className="vw vw-stack">
      <div className="vw-stack-tower">
        {stack.length === 0 && <span className="vw-stack-empty">empty</span>}
        {stack.map((v, i) => (
          <div
            key={`${i}-${v}`}
            ref={i === stack.length - 1 ? topRef : null}
            className={`vw-stack-box ${i === stack.length - 1 ? 'top' : ''}`}
          >
            {formatVal(v)}
            {i === stack.length - 1 && <span className="vw-stack-toptag">top</span>}
          </div>
        ))}
      </div>
      <span className="vw-stack-op">{ops}</span>
    </div>
  );
}

// Fold the ops of beats [0..beatIndex] into the stack contents + a label.
function buildStack(beats, beatIndex) {
  const stack = [];
  let label = '';
  for (let i = 0; i <= beatIndex; i++) {
    const b = beats[i];
    if (!b) continue;
    if (b.op === 'push') {
      stack.push(b.value);
      if (i === beatIndex) label = `push(${formatVal(b.value)})`;
    } else if (b.op === 'pop') {
      const v = stack.pop();
      if (i === beatIndex) label = `pop() → ${v === undefined ? '—' : formatVal(v)}`;
    } else if (b.op === 'peek') {
      if (i === beatIndex) label = `top → ${stack.length ? formatVal(stack[stack.length - 1]) : '—'}`;
    }
  }
  return [stack, label];
}
