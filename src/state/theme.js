import { useEffect, useState } from 'react';

// Light / dark theme, persisted. The choice is stamped as data-theme on the
// document root so the CSS variables in styles.css switch every component at
// once; a custom event lets non-CSS bits (the CodeMirror editor) react too.
const KEY = 'zoro.theme.v1';

export function getInitialTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* ignore */
  }
  return 'dark'; // the dojo is dark by default
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('zoro-theme', { detail: theme }));
}

// Reactive read of the current theme (updates when applyTheme fires).
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  useEffect(() => {
    const onChange = (e) => setTheme(e.detail);
    window.addEventListener('zoro-theme', onChange);
    return () => window.removeEventListener('zoro-theme', onChange);
  }, []);
  return theme;
}
