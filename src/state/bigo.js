// Big-O bucket classifier for the after-solve complexity check-in.
// Maps a model complexity string's TIME part onto the buckets the user picks
// from — but only when the mapping is honest. Grid/product forms like O(m·n)
// or O(amount · coins) are linear in the input yet quadratic in one dimension,
// so judging a tap against them would be misleading: those return null and the
// UI just reveals the model answer instead of grading.

export const BIGO_BUCKETS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)+'];

// The time part is everything up to "time"; if the string never says "time",
// the whole string is treated as the time bound (SQL-style entries).
export function timePart(complexity) {
  if (!complexity) return '';
  const m = complexity.match(/^(.*?)\btime\b/);
  return (m ? m[1] : complexity).trim();
}

export function bigOBucket(complexity) {
  const t = timePart(complexity)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·*]/g, '.');
  if (!t) return null;

  // exponential family first — anything with 2ⁿ/4ⁿ/n! or ^ growth
  if (/2\^|4\^|2ⁿ|4ⁿ|n!|\bfactorial\b/.test(t)) return 'O(2ⁿ)+';
  // constant: O(1), O(26), O(32)≈O(1), O(k)-set-bits style stays null (k varies)
  if (/^o\(1\)/.test(t) || /≈o\(1\)/.test(t) || /^o\(\d+\)/.test(t)) return 'O(1)';
  // n log n (incl. n log k / n log m — same shape the user would answer)
  if (/o\(n\.?logn?[a-z]?\)|o\(nlog/.test(t)) return 'O(n log n)';
  if (/o\(n²\)|o\(n\.n\)|o\(n\^2\)/.test(t)) return 'O(n²)';
  // logarithmic — O(log n), O(log(m·n))
  if (/o\(log/.test(t)) return 'O(log n)';
  // linear — O(n), O(n + m), O(V + E), O(max(n, m))
  if (/^o\(n\)/.test(t) || /o\(n\+m\)/.test(t) || /o\(v\+e\)/.test(t) || /o\(max\(n,m\)\)/.test(t)) {
    return 'O(n)';
  }
  return null; // product forms, O(h), O(L), per-step bounds… reveal, don't grade
}
