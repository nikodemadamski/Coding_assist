// Pure helpers for the pattern-recognition quiz. Kept out of the component so
// the option-building logic is unit-testable.
import { shuffle } from './progress.js';
import { PATTERN_GUIDE, guideKeyOf } from '../data/patternGuide.js';

const NAME_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p.name]));
// Algorithm cards carry no track field; data cards say 'pandas' | 'sql'.
const TRACK_BY_KEY = Object.fromEntries(PATTERN_GUIDE.map((p) => [p.key, p.track ?? 'python']));

// A question qualifies if some guide card actually teaches its pattern (so
// the correct answer is always a real option). All three tracks play.
export function isQuizzable(question) {
  return guideKeyOf(question) !== null;
}

// Build one quiz item: the correct pattern plus 3 distractors from the SAME
// track (an SQL question with algorithm distractors would answer itself).
export function buildQuizItem(question, seed = (Math.random() * 2 ** 32) >>> 0) {
  const correctKey = guideKeyOf(question);
  const sameTrack = PATTERN_GUIDE.map((p) => p.key).filter(
    (k) => k !== correctKey && TRACK_BY_KEY[k] === TRACK_BY_KEY[correctKey]
  );
  const distractors = shuffle(sameTrack, seed).slice(0, 3);
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
