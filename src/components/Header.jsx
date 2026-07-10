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
      <button className="icon-btn" onClick={onPatterns}>
        Patterns
      </button>
      <button className="icon-btn" onClick={onGuide}>
        Sensei
      </button>
      <button className="icon-btn" onClick={onStats}>
        Stats
      </button>
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
