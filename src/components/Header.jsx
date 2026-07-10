import { useEffect, useRef, useState } from 'react';
import { beltFor, currentStreak, isSolved } from '../state/progress.js';

export default function Header({
  progress,
  onHome,
  onSearch,
  onBrowse,
  onPatterns,
  onStats,
  onGuide,
  onSettings,
  theme,
  onToggleTheme,
  backupNudge = false,
}) {
  const solvedCount = Object.values(progress.solved).filter(isSolved).length;
  const belt = beltFor(solvedCount);
  const streak = currentStreak(progress.streak);

  // Library menu: Stats / Patterns / Sensei live behind one header item.
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

  const go = (fn) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className="header">
      <button className="header-logo" onClick={onHome} aria-label="ZoroClaude Dojo — home">
        <span className="blade" aria-hidden="true">
          ⚔
        </span>
        ZoroClaude Dojo
      </button>
      <div className="header-spacer" />
      <span className="streak" title="Current streak (days with at least one solve)">
        {streak} day{streak === 1 ? '' : 's'}
      </span>
      <span
        className="belt-chip"
        title={
          belt.next
            ? `${belt.name} belt — ${belt.next.threshold - solvedCount} solve(s) to ${belt.next.name}`
            : 'Black belt — mastery'
        }
      >
        {belt.name} belt
        {belt.next && (
          <span className="belt-count">
            {solvedCount}/{belt.next.threshold}
          </span>
        )}
        <span className="belt-strip" role="img" aria-label={`Belt progress toward next rank`}>
          <span
            className="belt-strip-fill"
            style={{ width: `${belt.progress * 100}%`, background: belt.color }}
          />
        </span>
      </span>
      <button className="icon-btn btn-search" onClick={onSearch} title="Search questions (Ctrl+K or /)">
        Search <kbd className="kbd-hint">⌘K</kbd>
      </button>
      <button className="icon-btn" onClick={onBrowse}>
        Browse
      </button>
      <div className="hdr-menu" ref={menuRef}>
        <button
          className="icon-btn hdr-menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          Library <span className="hdr-caret" aria-hidden="true">▾</span>
        </button>
        {menuOpen && (
          <div className="hdr-menu-pop" role="menu">
            <button role="menuitem" onClick={go(onStats)}>
              Stats <span className="hdr-menu-note">readiness &amp; record</span>
            </button>
            <button role="menuitem" onClick={go(onPatterns)}>
              Patterns <span className="hdr-menu-note">the templates</span>
            </button>
            <button role="menuitem" onClick={go(onGuide)}>
              Sensei <span className="hdr-menu-note">how to train</span>
            </button>
          </div>
        )}
      </div>
      <button
        className="icon-btn"
        onClick={onToggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <button
        className="icon-btn"
        onClick={onSettings}
        aria-label="Settings"
        title={backupNudge ? 'Your progress has not been backed up in a while' : undefined}
      >
        Settings
        {backupNudge && <span className="backup-dot" aria-hidden="true" />}
      </button>
    </header>
  );
}
