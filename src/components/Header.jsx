import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  LibraryBig,
  Compass,
  Settings as SettingsIcon,
  Sun,
  Moon,
  GraduationCap,
  BarChart3,
  Shapes,
  ScrollText,
  ChevronDown,
} from 'lucide-react';
import { beltFor, currentStreak, isSolved } from '../state/progress.js';
import DojoLogo from './header/DojoLogo.jsx';
import NavButton from './header/NavButton.jsx';
import { StreakChip, BeltChip, useTactile } from './header/HeaderChips.jsx';

const LIBRARY = [
  { key: 'learn', label: 'Learn', note: 'python from zero', icon: GraduationCap },
  { key: 'stats', label: 'Stats', note: 'readiness & record', icon: BarChart3 },
  { key: 'patterns', label: 'Patterns', note: 'the templates', icon: Shapes },
  { key: 'guide', label: 'Sensei', note: 'how to train', icon: ScrollText },
];

export default function Header({
  progress,
  onHome,
  onSearch,
  onBrowse,
  onPatterns,
  onStats,
  onGuide,
  onLearn,
  onSettings,
  theme,
  onToggleTheme,
  backupNudge = false,
}) {
  const solvedCount = Object.values(progress.solved).filter(isSolved).length;
  const belt = beltFor(solvedCount);
  const streak = currentStreak(progress.streak);
  const reduced = useReducedMotion();
  const tactile = useTactile();

  // Library menu: Learn / Stats / Patterns / Sensei live behind one header item.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handlers = { learn: onLearn, stats: onStats, patterns: onPatterns, guide: onGuide };
  const go = (fn) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className="header">
      <DojoLogo onClick={onHome} theme={theme} />

      <div className="header-spacer" />

      <StreakChip streak={streak} />
      <BeltChip belt={belt} solvedCount={solvedCount} />

      <NavButton
        icon={Search}
        className="btn-search"
        onClick={onSearch}
        title="Search questions (Ctrl+K or /)"
      >
        Search <kbd className="kbd-hint">⌘K</kbd>
      </NavButton>

      <NavButton icon={Compass} onClick={onBrowse}>
        Browse
      </NavButton>

      <div className="hdr-menu" ref={menuRef}>
        <NavButton
          icon={LibraryBig}
          className={`hdr-menu-btn ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          Library
          <motion.span
            className="hdr-caret"
            aria-hidden="true"
            animate={{ rotate: menuOpen ? 180 : 0 }}
            transition={tactile.transition}
          >
            <ChevronDown size={13} strokeWidth={2.4} />
          </motion.span>
        </NavButton>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="hdr-menu-pop"
              role="menu"
              initial={reduced ? false : { opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34 }}
            >
              {LIBRARY.map(({ key, label, note, icon: Icon }) => (
                <button key={key} role="menuitem" onClick={go(handlers[key])}>
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                  {label} <span className="hdr-menu-note">{note}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NavButton
        className="hdr-icon-only"
        onClick={onToggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        /* The two glyphs spin past each other, so the switch reads as one
           control changing rather than two icons swapping. It goes through
           `glyph` because it is the button's whole content — a phone hides
           labels, and this must survive that. */
        glyph={
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              className="hdr-theme-glyph"
              initial={reduced ? false : { rotate: -70, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { rotate: 70, opacity: 0, scale: 0.7 }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 28 }}
            >
              {theme === 'light' ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
            </motion.span>
          </AnimatePresence>
        }
      />

      <NavButton
        icon={SettingsIcon}
        onClick={onSettings}
        aria-label="Settings"
        title={backupNudge ? 'Your progress has not been backed up in a while' : undefined}
      >
        Settings
        {backupNudge && <span className="backup-dot" aria-hidden="true" />}
      </NavButton>
    </header>
  );
}
