import { useEffect, useRef, useState } from 'react';

// Per-question notebook: "what tripped me, what's the key idea". Auto-saves
// with a debounce (like drafts). The payoff is at REVIEW time — the note you
// wrote when you first fought a problem greets you when SRS brings it back.
export default function Notes({ questionId, note, onSave, heading }) {
  const [text, setText] = useState(note ?? '');
  const timer = useRef(null);

  // Question changed → show that question's note.
  useEffect(() => {
    setText(note ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = (v) => {
    setText(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(questionId, v), 500);
  };
  const flush = () => {
    clearTimeout(timer.current);
    onSave(questionId, text);
  };

  return (
    <details className="notes" open={note ? true : undefined}>
      <summary>
        📝 {heading || 'My notes on this one'}
        {note && <span className="notes-has"> · saved</span>}
      </summary>
      <textarea
        className="notes-input"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={flush}
        rows={3}
        placeholder="What tripped you up? What's the one idea to remember? Future-you reads this at the next review."
        aria-label="Personal notes for this question"
      />
    </details>
  );
}
