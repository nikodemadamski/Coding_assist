// Pure helpers for the pattern-recognition quiz. Kept out of the component so
// the option-building logic is unit-testable.
import { shuffle } from './progress.js';
import { PATTERN_GUIDE } from '../data/patternGuide.js';
import { categoryKeyOf } from '../data/roadmap.js';

const QUIZ_KEYS = PATTERN_GUIDE.map((p) => p.key);
const NAME_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p.name]));

// A question qualifies if its pattern maps to a category the Patterns page
// actually teaches (so the correct answer is always a real option).
export function isQuizzable(question) {
  return question.track === 'python' && QUIZ_KEYS.includes(categoryKeyOf(question.pattern));
}

// Build one quiz item: the correct pattern plus 3 distractors, shuffled.
export function buildQuizItem(question, seed = (Math.random() * 2 ** 32) >>> 0) {
  const correctKey = categoryKeyOf(question.pattern);
  const distractors = shuffle(
    QUIZ_KEYS.filter((k) => k !== correctKey),
    seed
  ).slice(0, 3);
  const optionKeys = shuffle([correctKey, ...distractors], seed ^ 0x9e3779b9);
  return {
    id: question.id,
    title: question.title,
    prompt: firstSentence(question.description),
    options: optionKeys.map((k) => ({ key: k, name: NAME_BY_KEY[k] })),
    correctKey,
  };
}

// Pick N distinct quizzable questions for a round.
export function buildQuizRound(questions, n = 10, seed = (Math.random() * 2 ** 32) >>> 0) {
  const pool = questions.filter(isQuizzable);
  return shuffle(pool, seed)
    .slice(0, n)
    .map((q, i) => buildQuizItem(q, (seed + i * 2654435761) >>> 0));
}

function firstSentence(text = '') {
  const plain = text.replace(/[`*_#>]/g, '').trim();
  const end = plain.search(/[.!?]\s/);
  const s = end === -1 ? plain : plain.slice(0, end + 1);
  return s.length > 240 ? s.slice(0, 237) + '…' : s;
}
