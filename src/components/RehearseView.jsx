import ProblemView from './ProblemView.jsx';
import {
  currentRehearsalId,
  passRehearsal,
  requeueRehearsal,
  rehearsalStatus,
} from '../state/rehearsal.js';

// Rehearsal: every question you have already solved, shuffled, on a loop.
//
// Unlike a practice session this holds NO local queue state — the bag lives in
// the record (state/rehearsal.js) precisely so that closing the tab mid-round
// and coming back tomorrow resumes where you were. Anything cached here would
// re-introduce the reset this mode exists to avoid.
export default function RehearseView({
  questions,
  progress,
  onSolve,
  onFail,
  onRate,
  onDraft,
  onNote,
  onBigO,
  onAdvance, // (nextProgress) => void — the caller commits the moved bag
  onExit,
}) {
  const id = currentRehearsalId(progress, questions);
  const status = rehearsalStatus(progress, questions);
  const question = id ? questions.find((q) => q.id === id) : null;

  if (!question) {
    return (
      <div className="picker">
        <div className="session-done">
          <h2>Nothing to rehearse yet</h2>
          <p>
            Rehearsal replays the questions you have already solved. Solve one and it joins the
            rotation.
          </p>
          <button className="btn btn-primary" onClick={onExit}>
            Back to the dojo
          </button>
        </div>
      </div>
    );
  }

  // A passing submit records the solve immediately; the confidence rating is
  // what advances the bag, exactly as in a practice session. Failing or
  // skipping sends the question to the back — you cannot finish a round by
  // failing your way through it.
  const handleRate = (qid, rating) => {
    onRate(qid, rating);
    onAdvance(passRehearsal(progress, questions));
  };
  const handleNext = () => onAdvance(requeueRehearsal(progress, questions));

  return (
    <ProblemView
      key={id}
      question={question}
      progress={progress}
      onSolve={onSolve}
      onRate={handleRate}
      onFail={onFail}
      onDraft={onDraft}
      onNote={onNote}
      onBigO={onBigO}
      onBack={onExit}
      practiceMode
      practiceInfo={{
        phase: 'rehearse',
        round: status.round,
        done: status.done + 1,
        size: status.size,
        reviewsLeft: status.left,
        newLeft: 0,
      }}
      onNext={handleNext}
      freshStart
    />
  );
}
