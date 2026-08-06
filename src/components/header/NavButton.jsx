import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useTactile } from './HeaderChips.jsx';

// Every action in the bar, so they all press the same way.
//
// The `icon-btn` class stays on purpose: the rest of the app (and the smoke
// suite) reaches for header actions by it, and a redesign of how a button
// looks is no reason to change what it is.
// `glyph` is for a button whose icon IS its content (the theme toggle, whose
// glyph swaps). It renders outside the label wrapper, so hiding labels on a
// phone can never hide the only thing the button draws.
const NavButton = forwardRef(function NavButton(
  { icon: Icon, glyph, children, className = '', ...rest },
  ref
) {
  const t = useTactile();
  return (
    <motion.button
      ref={ref}
      className={`icon-btn hdr-btn ${className}`}
      transition={t.transition}
      whileHover={t.whileHover}
      whileTap={t.whileTap}
      {...rest}
    >
      {Icon && <Icon className="hdr-btn-icon" size={16} strokeWidth={2} aria-hidden="true" />}
      {glyph}
      {/* The label is wrapped so a phone can hide it and leave the icon. It is
          hidden visually, never removed: it is still the button's accessible
          name, and a screen reader must not be handed a nameless glyph. */}
      <span className="hdr-btn-label">{children}</span>
    </motion.button>
  );
});

export default NavButton;
