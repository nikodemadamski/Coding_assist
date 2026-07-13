// The "Learn Python from zero" curriculum: chapters + lesson composition +
// pure helpers. Content lives in per-chapter files (lessons-ch1.js …); every
// lesson passes validateLesson and every code artifact (read examples,
// predict snippets, fix/write/watch code) is EXECUTED by tests/lesson-tests.mjs
// through the real engine — a lesson can never lie about what code does.
//
// Design: read ≤120 words, then do. Item types: predict (say what it prints,
// THEN run it), type (muscle memory), fix (repair real code), write (tiny
// function vs real tests), watch (step through it in the visualizer).
import { LESSONS_CH1 } from './lessons-ch1.js';
import { LESSONS_CH2 } from './lessons-ch2.js';
import { LESSONS_CH3 } from './lessons-ch3.js';
import { LESSONS_CH4 } from './lessons-ch4.js';
import { LESSONS_CH5 } from './lessons-ch5.js';
import { LESSONS_CH6 } from './lessons-ch6.js';
import { LESSONS_CH7 } from './lessons-ch7.js';

export const LESSON_CHAPTERS = [
  {
    key: 'speaking-python',
    label: 'Speaking Python',
    blurb: 'Values, variables, strings, numbers — say anything at all.',
  },
  {
    key: 'decisions-loops',
    label: 'Decisions & repetition',
    blurb: 'if/else, while, for — make the computer choose and repeat.',
  },
  {
    key: 'collections',
    label: 'Collections',
    blurb: 'Lists, slices, tuples, dicts, sets — where real data lives.',
  },
  {
    key: 'real-code',
    label: 'Writing real code',
    blurb: 'Functions, comprehensions, sorting — from lines to programs.',
  },
  {
    key: 'interview-kit',
    label: 'The interview toolkit',
    blurb: 'Counter, deque, idioms, and the thoughts-first habit.',
  },
  {
    key: 'power-tools',
    label: 'Python power tools',
    blurb: 'Recursion, classes, lambdas — turn any idea into code.',
  },
  {
    key: 'search-windows',
    label: 'Search & windows',
    blurb: 'Slide, halve, and pick — the workhorse search patterns.',
  },
];

// Path order — prereqs always point backwards into this list.
export const LESSONS = [
  ...LESSONS_CH1,
  ...LESSONS_CH2,
  ...LESSONS_CH3,
  ...LESSONS_CH4,
  ...LESSONS_CH5,
  ...LESSONS_CH6,
  ...LESSONS_CH7,
];

const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export function lessonById(id) {
  return BY_ID[id] ?? null;
}

export function isLessonComplete(progress, lessonId) {
  return !!progress.lessons?.[lessonId]?.completedAt;
}

// Soft gate: prereqs dim a card, never lock it.
export function prereqsMet(lesson, progress) {
  return (lesson.prereqs ?? []).every((id) => isLessonComplete(progress, id));
}

// The next lesson to take: first incomplete lesson (path order) whose prereqs
// are met; falls back to the first incomplete one at all.
export function nextLesson(progress) {
  const incomplete = LESSONS.filter((l) => !isLessonComplete(progress, l.id));
  return incomplete.find((l) => prereqsMet(l, progress)) ?? incomplete[0] ?? null;
}

export function chapterStats(progress) {
  const stats = {};
  for (const ch of LESSON_CHAPTERS) stats[ch.key] = { done: 0, total: 0 };
  for (const l of LESSONS) {
    stats[l.chapter].total++;
    if (isLessonComplete(progress, l.id)) stats[l.chapter].done++;
  }
  return stats;
}

export function lessonCounts(progress) {
  const total = LESSONS.length;
  const done = LESSONS.filter((l) => isLessonComplete(progress, l.id)).length;
  return { done, total };
}

// Adapter: fix/write/watch items become minimal question objects so the
// existing machinery (runQuestion, runPy in the gate, VisualizerModal) works
// on them unchanged.
export function itemAsQuestion(lesson, item, idx) {
  return {
    id: `${lesson.id}-i${idx}`,
    track: 'python',
    title: lesson.title,
    function_name: item.function_name,
    tests: item.tests,
  };
}
