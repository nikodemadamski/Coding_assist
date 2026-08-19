import { motion, useReducedMotion } from 'framer-motion';
import { Flame, Award, Coins } from 'lucide-react';

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

// `rest` is the restStatus for the current run — see progress.restStatus. The
// tooltip states how much rest is left rather than leaving you to work out
// whether today off costs you the run; that uncertainty is the thing that makes
// a streak stressful instead of motivating.
export function StreakChip({ streak, rest = null }) {
  const t = useTactile();
  const alive = streak > 0;
  const resting = alive && rest?.used > 0;
  const tip = () => {
    if (!alive) return 'No streak yet — one solve today starts it';
    if (rest && rest.left > 0) {
      return `${streak}-day streak — solve one today, or rest ${rest.left} more day${
        rest.left === 1 ? '' : 's'
      } and it still holds`;
    }
    return `${streak}-day streak — rest days used up, solve one today to keep it`;
  };
  return (
    <motion.span
      className={`hdr-chip streak-chip ${alive ? 'is-alive' : ''} ${resting ? 'is-resting' : ''}`}
      tabIndex={0}
      transition={t.transition}
      whileHover={t.whileHover}
      whileFocus={t.whileHover}
    >
      <Flame className="hdr-chip-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
      <span className="hdr-chip-n">{streak}</span>
      <span className="hdr-chip-l">day{streak === 1 ? '' : 's'}</span>
      <Tip>{tip()}</Tip>
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

// The wallet. It's a button, not a label — the whole point of a balance is the
// thing you can spend it on, and that should be one click away.
export function CoinChip({ coins, onClick }) {
  const t = useTactile();
  return (
    <motion.button
      className="hdr-chip coin-chip"
      onClick={onClick}
      transition={t.transition}
      whileHover={t.whileHover}
      whileTap={t.whileTap}
      aria-label={`${coins} coins — open the dojo shop`}
    >
      <Coins className="hdr-chip-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
      <span className="hdr-chip-n">{coins}</span>
      <Tip>{coins} coins — spend them in the dojo shop</Tip>
    </motion.button>
  );
}
