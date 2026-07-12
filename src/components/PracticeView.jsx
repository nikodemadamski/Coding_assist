import { useState } from 'react';
import ProblemView from './ProblemView.jsx';
import {
  createSession,
  createDrillSession,
  currentId,
  currentPhase,
  sessionCounts,
  onPass,
  onRequeue,
} from '../state/practiceSession.js';

// Session driver. Hands you one question at a time — all due reviews (random)
// before any new question (random). A question you fail or skip goes to the back
// of its queue and returns; you can't move past it by getting it wrong.
// mode='drill' instead serves only the questions you missed today.
export default function PracticeView({
  questions,
  progress,
  onSolve,
  onFail,
  onDraft,
  onNote,
  onBigO,
  onExit,
  mode = 'practice',
}) {
  // The queue is fixed when the session starts (so newly-scheduled reviews from
  // this very session don't pile back in). Passing/failing advances it.
  const [session, setSession] = useState(() =>
    mode === 'drill' ? createDrillSession(progress, questions) : createSession(progress, questions)
  );

  const id = currentId(session);
  const phase = mode === 'drill' ? 'drill' : currentPhase(session);
  const question = id ? questions.find((q) => q.id === id) : null;
  const { reviewLeft, newLeft } = sessionCounts(session);

  if (!question) {
    return (
      <div className="picker">
        <div className="session-done">
          <h2>{mode === 'drill' ? 'Drill complete' : 'Session complete'}</h2>
          <p>
            {mode === 'drill'
              ? 'You re-cleared every question you missed today. That is how a mistake becomes a skill.'
              : 'You cleared every review that was due and every new question in the queue. Come back tomorrow — spaced repetition will resurface these at the right time.'}
          </p>
          <button className="btn btn-primary" onClick={onExit}>
            Back to the dojo
          </button>
        </div>
      </div>
    );
  }

  // Wrap the solve/fail handlers so a pass advances the queue and a fail/skip
  // re-queues. Progress (SRS/streak/mistakes) is recorded by the App handlers.
  const handleSolve = (qid, opts) => {
    onSolve(qid, opts);
    setSession((s) => onPass(s));
  };
  const handleNext = () => setSession((s) => onRequeue(s));

  return (
    <ProblemView
      key={id}
      question={question}
      progress={progress}
      onSolve={handleSolve}
      onFail={onFail}
      onDraft={onDraft}
      onNote={onNote}
      onBigO={onBigO}
      onBack={onExit}
      practiceMode
      practiceInfo={{ phase, reviewsLeft: reviewLeft, newLeft }}
      onNext={handleNext}
      freshStart={phase === 'review' || phase === 'drill'}
    />
  );
}
