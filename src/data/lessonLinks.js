// Learn-before-use: which Learn lessons teach the micro-skill a question
// leans on. Surfaced as a "learn it first" nudge on the problem page and in
// the Stuck ladder — so you meet `.get()` in a lesson before a question
// expects you to already know it. Python track only; every id here is checked
// against the real bank + curriculum by tests/lesson-tests.mjs.
import { categoryKeyOf } from './roadmap.js';
import { isLessonComplete } from './lessons.js';

// Hand-curated, only where a SPECIFIC basic is the likely blocker.
export const QUESTION_LESSONS = {
  'py-char-frequency': ['ch3-dicts'],
  'py-common-elements': ['ch3-sets'],
  'py-invert-dict': ['ch3-iteration-tools'],
  'py-reverse-string': ['ch3-slicing'],
  'py-first-unique-char': ['ch3-dicts', 'ch3-iteration-tools'],
  'py-merge-counts': ['ch3-dicts'],
  'py-fizzbuzz': ['ch2-if', 'ch1-numbers'],
  'py-contains-duplicate': ['ch3-sets'],
  'py-two-sum': ['ch3-dicts', 'ch3-iteration-tools'],
  'py-valid-anagram': ['ch5-counter'],
  'py-group-anagrams': ['ch5-counter'],
  'py-valid-palindrome': ['ch5-two-pointers'],
  'py-two-sum-sorted': ['ch5-two-pointers'],
  'py-three-sum': ['ch5-two-pointers'],
  'py-container-water': ['ch5-two-pointers'],
  'py-valid-parentheses': ['ch5-stack-queue'],
  'py-eval-rpn': ['ch5-stack-queue'],
  'py-min-stack': ['ch5-stack-queue'],
  'py-top-k-frequent': ['ch5-counter'],
  'py-binary-search': ['ch2-while'],
};

// Fallback by roadmap category, used when a question has no specific entry.
// Only categories with a genuine beginner lesson appear here.
export const CATEGORY_LESSONS = {
  'arrays-hashing': ['ch3-dicts'],
  'two-pointers': ['ch5-two-pointers'],
  stack: ['ch5-stack-queue'],
  'sliding-window': ['ch2-for'],
  'binary-search': ['ch2-while'],
};

// Lessons (id + title/minutes via the caller) a question leans on that the
// learner has NOT completed yet. Empty for non-python and for the fully
// prepared. Returns just the ids; the UI resolves titles.
export function lessonsForQuestion(question, progress) {
  if (!question || question.track !== 'python') return [];
  const ids = QUESTION_LESSONS[question.id] ?? CATEGORY_LESSONS[categoryKeyOf(question.pattern)] ?? [];
  return ids.filter((id) => !isLessonComplete(progress, id));
}
