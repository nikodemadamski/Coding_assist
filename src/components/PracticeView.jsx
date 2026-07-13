import { useState } from 'react';
import ProblemView from './ProblemView.jsx';
import LessonView from './LessonView.jsx';
import {
  createSession,
  createDrillSession,
  currentId,
  currentPhase,
  sessionCounts,
  onPass,
  onRequeue,
} from '../state/practiceSession.js';
import { lessonById } from '../data/lessons.js';
import { buildReviewItems } from '../state/lessonProgress.js';

// Session driver. Hands you one question at a time — all due reviews (random)
// before any new question (random). A question you fail or skip goes to the back
// of its queue and returns; you can't move past it by getting it wrong.
// mode='drill' instead serves only the questions you missed today.
export default function PracticeView({
  questions,
  progress,
  onSolve,
  onFail,
  onRate,
  onLessonReview,
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
  const { reviewLeft, newLeft } = sessionCounts(session);

  // Skill checks open the session: a 90-second lesson review, then the
  // question queues. The check's pass/fail already rescheduled the lesson,
  // so finishing it always advances.
  if (phase === 'skills') {
    // createSession filters the skills queue to real lesson ids, so this
    // lookup cannot miss.
    const lesson = lessonById(id);
    return (
      <LessonView
        key={id}
        lesson={lesson}
        mode="review"
        reviewItems={buildReviewItems(lesson, progress.lessons?.[lesson.id])}
        onReviewResult={onLessonReview}
        onDone={() => setSession((s) => onPass(s))}
        onExit={onExit}
      />
    );
  }

  const question = id ? questions.find((q) => q.id === id) : null;

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

  // A passing submit records the solve immediately (App handler) but does NOT
  // advance — the reflect panel stays up. The confidence rating re-tunes the
  // schedule and advances the queue; a fail/skip re-queues.
  const handleRate = (qid, rating) => {
    onRate(qid, rating);
    setSession((s) => onPass(s));
  };
  const handleNext = () => setSession((s) => onRequeue(s));

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
      practiceInfo={{ phase, reviewsLeft: reviewLeft, newLeft }}
      onNext={handleNext}
      freshStart={phase === 'review' || phase === 'drill'}
    />
  );
}
