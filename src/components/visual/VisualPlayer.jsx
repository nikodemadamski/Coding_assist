import { useState } from 'react';
import ListCells from './ListCells.jsx';
import VarBoxes from './VarBoxes.jsx';
import LoopTape from './LoopTape.jsx';
import DictLookup from './DictLookup.jsx';
import StackTower from './StackTower.jsx';
import TextReveal from './TextReveal.jsx';
import BranchFlow from './BranchFlow.jsx';

// Tap-through player for a visual block: renders the widget at the current
// beat, shows the caption, and advances one beat per tap. Widgets register
// here; the schema gate guarantees `visual.widget` is one we know.
const WIDGETS = {
  'list-cells': ListCells,
  'var-boxes': VarBoxes,
  'loop-tape': LoopTape,
  'dict-lookup': DictLookup,
  'stack-tower': StackTower,
  'text-reveal': TextReveal,
  'branch-flow': BranchFlow,
};

export default function VisualPlayer({ visual, onDone = null }) {
  const [beatIndex, setBeatIndex] = useState(0);
  const Widget = WIDGETS[visual.widget];
  const beat = visual.beats[beatIndex];
  const last = beatIndex >= visual.beats.length - 1;

  if (!Widget) return null; // a widget not yet wired for render — nothing to show

  return (
    <div className="vw-player">
      <Widget visual={visual} beatIndex={beatIndex} />
      <p className="vw-caption">{beat.caption}</p>
      <div className="vw-controls">
        <span className="vw-dots" aria-hidden="true">
          {visual.beats.map((_, i) => (
            <span key={i} className={`vw-dot ${i <= beatIndex ? 'on' : ''}`} />
          ))}
        </span>
        {!last ? (
          <button className="btn btn-primary" onClick={() => setBeatIndex((i) => i + 1)}>
            Next →
          </button>
        ) : (
          <>
            <button className="btn" onClick={() => setBeatIndex(0)}>
              Replay
            </button>
            {onDone && (
              <button className="btn btn-primary" onClick={onDone}>
                Got it →
              </button>
            )}
          </>
        )}
      </div>
      {last && visual.why && <p className="vw-why">{visual.why}</p>}
    </div>
  );
}
