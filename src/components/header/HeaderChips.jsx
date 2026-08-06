import { motion, useReducedMotion } from 'framer-motion';
import { Flame, Award } from 'lucide-react';

// The two status chips in the bar. They carry the same numbers as before — a
// streak and a belt — but as objects you can read at a glance and interrogate
// on hover, rather than two runs of text competing with the nav.

// One shared spring. Every tactile response in the header uses it, so a chip
// and a nav button feel like the same material. Under reduced motion Framer's
// hook returns true and we hand back a no-op transition instead.
export const TACTILE = { type: 'spring', stiffness: 420, damping: 26, mass: 0.6 };

export function useTactile() {
  const reduced = useReducedMotion();
  return reduced
    ? { transition: { duration: 0 }, whileHover: undefined, whileTap: undefined }
    : {
        transition: TACTILE,
        whileHover: { y: -2, scale: 1.03 },
        whileTap: { scale: 0.96, y: 0 },
      };
}

// A tooltip that is just a label — no portal, no positioning library. It hangs
// off the chip and only exists while you're pointing at it.
function Tip({ children }) {
  return (
    <span className="hdr-tip" role="tooltip">
      {children}
    </span>
  );
}

export function StreakChip({ streak }) {
  const t = useTactile();
  const alive = streak > 0;
  return (
    <motion.span
      className={`hdr-chip streak-chip ${alive ? 'is-alive' : ''}`}
      tabIndex={0}
      transition={t.transition}
      whileHover={t.whileHover}
      whileFocus={t.whileHover}
    >
      <Flame className="hdr-chip-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
      <span className="hdr-chip-n">{streak}</span>
      <span className="hdr-chip-l">day{streak === 1 ? '' : 's'}</span>
      <Tip>
        {alive
          ? `${streak}-day streak — solve one today to keep it`
          : 'No streak yet — one solve today starts it'}
      </Tip>
    </motion.span>
  );
}

export function BeltChip({ belt, solvedCount }) {
  const t = useTactile();
  const toNext = belt.next ? belt.next.threshold - solvedCount : 0;
  return (
    <motion.span
      className="hdr-chip belt-chip"
      tabIndex={0}
      style={{ '--belt': belt.color }}
      transition={t.transition}
      whileHover={t.whileHover}
      whileFocus={t.whileHover}
    >
      <Award className="hdr-chip-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
      <span className="hdr-chip-l belt-chip-name">{belt.name}</span>
      {belt.next && (
        <span className="hdr-chip-n belt-count">
          {solvedCount}
          <span className="belt-count-of">/{belt.next.threshold}</span>
        </span>
      )}
      {/* The fill glows in the belt's own colour and animates to its new width
          whenever a solve lands, so a promotion is something you watch. */}
      <span className="belt-strip" role="img" aria-label="Belt progress toward the next rank">
        <motion.span
          className="belt-strip-fill"
          initial={false}
          animate={{ scaleX: belt.progress }}
          transition={t.transition}
        />
      </span>
      <Tip>
        {belt.next
          ? `${belt.name} belt — ${toNext} more solve${toNext === 1 ? '' : 's'} to ${belt.next.name}`
          : 'Black belt — the whole path'}
      </Tip>
    </motion.span>
  );
}
