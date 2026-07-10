import { useState } from 'react';
import { BIGO_BUCKETS, bigOBucket } from '../state/bigo.js';
import { optimalComplexity } from '../state/mockSession.js';

// The follow-up every interviewer asks the moment your code passes:
// "what's the complexity?" One tap, instant verdict against the model
// solution. When the model's bound doesn't map cleanly onto a bucket
// (grids, O(h), per-operation costs) it reveals instead of grading.
export default function BigOCheck({ question }) {
  const model = optimalComplexity(question);
  const [pick, setPick] = useState(null);
  if (!model) return null;
  const bucket = bigOBucket(model);
  const verdict =
    pick === null ? null : bucket === null ? 'reveal' : pick === bucket ? 'right' : 'wrong';

  return (
    <div className="bigo">
      <span className="bigo-q">
        ⏱ Interviewer follow-up: what&apos;s the model solution&apos;s time complexity?
      </span>
      {pick === null ? (
        <div className="bigo-options">
          {BIGO_BUCKETS.map((b) => (
            <button key={b} className="chip bigo-chip" onClick={() => setPick(b)}>
              {b}
            </button>
          ))}
        </div>
      ) : (
        <div className={`bigo-answer ${verdict}`} role="status">
          {verdict === 'right' && <strong>✓ Right. </strong>}
          {verdict === 'wrong' && <strong>✗ Not quite — you said {pick}. </strong>}
          Model: <code>{model}</code>
        </div>
      )}
    </div>
  );
}
