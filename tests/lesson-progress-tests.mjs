// Lesson progress + skill-check scheduling: completion schedules tomorrow,
// pass climbs the ladder, fail restarts it, review items are quick and
// missed-first — and question SRS is never touched.
import {
  recordLessonComplete,
  recordLessonReview,
  dueLessonIds,
  buildReviewItems,
  REVIEW_ITEM_COUNT,
} from '../src/state/lessonProgress.js';
import { addDays, todayStr, SRS_INTERVALS } from '../src/state/progress.js';
import { EMPTY_PROGRESS } from '../src/state/storage.js';
import { LESSONS, lessonById, nextLesson, prereqsMet, lessonCounts } from '../src/data/lessons.js';

let failures = 0;
const check = (cond, label, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

console.log('Lesson progress tests\n');

const today = todayStr();
const fresh = () => structuredClone(EMPTY_PROGRESS);
const first = LESSONS[0];

// ---- completion ----
{
  let p = recordLessonComplete(fresh(), first.id, { missedIdx: [2] });
  const e = p.lessons[first.id];
  check(!!e.completedAt, 'completion is stamped');
  check(e.runs === 1, 'run counted');
  check(e.missedIdx.length === 1 && e.missedIdx[0] === 2, 'missed items remembered');
  check(e.srs.stage === 0 && e.srs.nextDue === addDays(today, SRS_INTERVALS[0]), 'first skill check lands tomorrow');
  check(Object.keys(p.srs).length === 0, 'question SRS untouched');

  const again = recordLessonComplete(p, first.id, { missedIdx: [] });
  check(again.lessons[first.id].runs === 2, 're-take counts a run');
  check(again.lessons[first.id].srs.nextDue === e.srs.nextDue, 're-take keeps the review schedule');
  check(again.lessons[first.id].completedAt === e.completedAt, 'first completion date sticks');
}

// ---- reviews ----
{
  let p = recordLessonComplete(fresh(), first.id, {});
  // force due today
  p.lessons[first.id].srs.nextDue = today;
  const valid = new Set(LESSONS.map((l) => l.id));
  check(dueLessonIds(p, valid).includes(first.id), 'a due lesson shows up for review');

  const passed = recordLessonReview(p, first.id, true);
  check(passed.lessons[first.id].srs.stage === 1, 'pass climbs a stage');
  check(passed.lessons[first.id].srs.nextDue === addDays(today, SRS_INTERVALS[1]), 'pass reschedules further out');
  check(dueLessonIds(passed, valid).length === 0, 'passed review leaves nothing due');

  let high = structuredClone(p);
  high.lessons[first.id].srs = { stage: 4, nextDue: today };
  const capped = recordLessonReview(high, first.id, true);
  check(capped.lessons[first.id].srs.stage === 4, 'stage caps at the top of the ladder');

  const failed = recordLessonReview(passed, first.id, false);
  check(failed.lessons[first.id].srs.stage === 0, 'a failed check restarts the ladder');
}

// ---- review items ----
{
  const entry = { missedIdx: [0] };
  const items = buildReviewItems(first, entry, 7);
  check(items.length === Math.min(REVIEW_ITEM_COUNT, first.items.length), `review is ${REVIEW_ITEM_COUNT} quick items`);
  check(items[0].idx === 0, 'missed items come first');
  check(
    items.every(({ item }) => item.type === 'predict' || item.type === 'type'),
    'reviews use only quick item types'
  );
}

// ---- path helpers ----
{
  const p = fresh();
  check(nextLesson(p)?.id === first.id, 'next lesson starts at the beginning');
  check(prereqsMet(first, p), 'the first lesson has no unmet prereqs');
  const done = recordLessonComplete(p, first.id, {});
  check(nextLesson(done)?.id === LESSONS[1].id, 'completing advances the next-lesson pointer');
  check(lessonById('nope') === null, 'unknown lesson id returns null');
  const counts = lessonCounts(done);
  check(counts.done === 1 && counts.total === LESSONS.length, 'lesson counts add up');
}

console.log(failures === 0 ? '\nAll lesson-progress tests green.' : `\n${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
