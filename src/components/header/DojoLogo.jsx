import { Component, Suspense, lazy, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../anim/useAnime.js';

// The brand: a 3D `dojo` where o-j-o is a face.
//
// three.js is ~150KB gzipped, which is a lot to spend on four letters in an
// offline-first PWA whose entire shell is smaller than that. So the canvas is
// behind React.lazy: it lands in its own chunk, the header paints the flat
// wordmark first, and the 3D swaps in when it arrives. Three cases never load
// it at all — reduced motion, no WebGL, and a chunk that fails to fetch — and
// all three land on the same static mark, so the brand is never missing.
const DojoFace = lazy(() => import('./DojoFace.jsx'));

// The flat mark. Same letterforms, same face: the two o's have pupils, the j's
// tittle is the nose, the stroke underneath is the smile. It has to be able to
// stand on its own, because sometimes it's all there is.
function FlatMark({ accent, ink }) {
  return (
    <svg className="dojo-flat" viewBox="0 0 92 34" aria-hidden="true" focusable="false">
      {/* d */}
      <circle cx="11" cy="21" r="6.5" fill="none" stroke={ink} strokeWidth="3" />
      <line x1="18.5" y1="5" x2="18.5" y2="27.5" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {/* o — eye */}
      <circle cx="34" cy="21" r="6.5" fill="none" stroke={accent} strokeWidth="3" />
      <circle cx="34" cy="21" r="2.2" fill={ink} />
      {/* j — nose */}
      <line x1="52" y1="16" x2="52" y2="25" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M52 25 a4 4 0 0 1 -7 2.6" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx="52" cy="8.5" r="2.4" fill={accent} />
      {/* o — eye */}
      <circle cx="70" cy="21" r="6.5" fill="none" stroke={accent} strokeWidth="3" />
      <circle cx="70" cy="21" r="2.2" fill={ink} />
      {/* the smile */}
      <path d="M28 29.5 q24 7 48 0" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// A failed WebGL context or a missing chunk must cost the brand, not the app.
class MarkBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// three.js parses colours itself and has never heard of a CSS custom property:
// handing it `var(--crimson-bright)` silently yields white. So the tokens get
// resolved to real values here, re-read whenever the theme flips.
function useThemeColors(theme) {
  return useMemo(() => {
    if (typeof window === 'undefined') return { accent: '#e5484d', ink: '#e9e7de' };
    const cs = getComputedStyle(document.documentElement);
    const read = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
    return {
      accent: read('--crimson-bright', '#e5484d'),
      ink: read('--text', '#e9e7de'),
    };
    // `theme` is the dependency on purpose: it is what changes the values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

export default function DojoLogo({ onClick, theme }) {
  const { accent, ink } = useThemeColors(theme);
  const [hovered, setHovered] = useState(false);
  const burst = useRef(0);
  // Read once on mount: the preference does not change mid-session in practice,
  // and re-reading it per render would be a matchMedia call per paint.
  const [flat] = useState(() => prefersReducedMotion() || !hasWebGL());

  const fallback = <FlatMark accent={accent} ink={ink} />;

  return (
    <button
      className={`header-logo dojo-logo ${hovered ? 'is-hot' : ''}`}
      onClick={() => {
        burst.current = 1;
        onClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label="dojo — home"
    >
      <span className="dojo-mark">
        {flat ? (
          fallback
        ) : (
          <MarkBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <DojoFace accent={accent} ink={ink} hovered={hovered} burst={burst} />
            </Suspense>
          </MarkBoundary>
        )}
      </span>
      {/* The word is real text for screen readers and for the moment before the
          canvas arrives; the mark above is what you actually look at. */}
      <span className="dojo-word">dojo</span>
    </button>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
