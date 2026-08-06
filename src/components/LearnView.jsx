import { LESSONS, LESSON_CHAPTERS, nextLesson, prereqsMet, isLessonComplete, lessonCounts } from '../data/lessons.js';
import { dueLessonIds } from '../state/lessonProgress.js';

// "Learn Python from zero" — the curriculum home. A quiet chapter list, not a
// second graph: done lessons get a check, the next one an arrow, and lessons
// whose prereqs aren't met dim (but never lock — your pace, your call).
export default function LearnView({ progress, onOpenLesson, onStartReview, onBack }) {
  const { done, total } = lessonCounts(progress);
  const next = nextLesson(progress);
  const due = dueLessonIds(progress, new Set(LESSONS.map((l) => l.id)));

  const prereqTitles = (lesson) =>
    (lesson.prereqs ?? [])
      .filter((id) => !isLessonComplete(progress, id))
      .map((id) => LESSONS.find((l) => l.id === id)?.title)
      .filter(Boolean)
      .join(', ');

  return (
    <div className="stats learn">
      <h1>Learn Python — from zero</h1>
      <p className="learn-intro">
        Read a little, do a lot. Each lesson is a few minutes: one idea, then real exercises
        the engine checks. Finished lessons come back as quick skill checks, spaced out so
        they stick — then the path is your playground.
      </p>

      <div className="learn-status">
        <span className="learn-count">
          {done}/{total} lessons
        </span>
        {due.length > 0 && onStartReview && (
          <button className="btn btn-primary" onClick={() => onStartReview(due[0])}>
            Skill check due ({due.length})
          </button>
        )}
        {next && (
          <button className="btn btn-jade" onClick={() => onOpenLesson(next.id)}>
            {done === 0 ? 'Start: ' : 'Continue: '}
            {next.title} →
          </button>
        )}
      </div>

      {LESSON_CHAPTERS.map((ch, chIdx) => {
        const lessons = LESSONS.filter((l) => l.chapter === ch.key);
        if (lessons.length === 0) {
          return (
            <section className="learn-chapter" key={ch.key}>
              <h2 className="learn-chapter-head">
                {chIdx + 1} · {ch.label}
              </h2>
              <p className="learn-chapter-soon">{ch.blurb} — coming next.</p>
            </section>
          );
        }
        return (
          <section className="learn-chapter" key={ch.key}>
            <h2 className="learn-chapter-head">
              <span className="learn-chapter-n">{chIdx + 1}</span>
              {ch.label}
              <span className="learn-chapter-count">
                {lessons.filter((l) => isLessonComplete(progress, l.id)).length}/{lessons.length}
              </span>
            </h2>
            <p className="learn-chapter-blurb">{ch.blurb}</p>
            <div className="learn-lessons">
              {lessons.map((l) => {
                const complete = isLessonComplete(progress, l.id);
                const isNext = next?.id === l.id;
                const ready = prereqsMet(l, progress);
                const missing = ready ? '' : prereqTitles(l);
                return (
                  <button
                    key={l.id}
                    className={`learn-lesson ${complete ? 'done' : ''} ${isNext ? 'next' : ''} ${
                      !ready && !complete ? 'dimmed' : ''
                    }`}
                    onClick={() => onOpenLesson(l.id)}
                    title={missing ? `Builds on: ${missing}` : undefined}
                  >
                    <span className="learn-lesson-mark">{complete ? '✓' : isNext ? '→' : ''}</span>
                    <span className="learn-lesson-title">{l.title}</span>
                    {/* Prereqs live in the tooltip and in the dimmed state — repeating
                        "builds on …" down every row shouted louder than the titles. */}
                    <span className="learn-lesson-min">{l.minutes} min</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <button className="btn learn-back" onClick={onBack}>
        ← Back to the dojo
      </button>
    </div>
  );
}
