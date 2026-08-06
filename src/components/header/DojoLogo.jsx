import { Component, Suspense, lazy, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../anim/useAnime.js';
import { costumeForView, mascotLabel } from '../../state/mascot.js';
import { outfitFor } from '../../state/shop.js';

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
// The costume, in two dimensions. Whatever the reason the canvas isn't there —
// reduced motion, no WebGL, a chunk still in flight — the mascot still dresses
// for the room. A fallback that drops the character isn't a fallback.
function FlatCostume({ kind, accent, ink }) {
  switch (kind) {
    case 'cap':
      return (
        <g>
          <path d="M34 5 L52 0 L70 5 L52 10 Z" fill={ink} />
          <path d="M44 8 v2.5 a8 4 0 0 0 16 0 V8" fill="none" stroke={ink} strokeWidth="2" />
          <line x1="70" y1="5" x2="72" y2="12" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="72" cy="13" r="1.8" fill={accent} />
        </g>
      );
    case 'headband':
      return (
        <g fill={accent}>
          <rect x="21.5" y="6.6" width="5" height="6" rx="1.6" />
          <rect x="14" y="10" width="9" height="2.6" rx="1.2" transform="rotate(26 18 11)" />
          <rect x="13" y="14" width="7.5" height="2.4" rx="1.2" transform="rotate(50 16 15)" />
        </g>
      );
    case 'sweatband':
      return (
        <g>
          <rect x="27" y="1.5" width="50" height="4.6" rx="2" fill={ink} />
          <rect x="27" y="3.4" width="50" height="1.4" fill={accent} />
          <rect x="12" y="16" width="9" height="1.8" rx="0.9" fill={accent} />
          <rect x="14" y="21" width="6" height="1.8" rx="0.9" fill={accent} />
        </g>
      );
    case 'bowtie':
      return (
        <g>
          <path d="M52 38 L45 35 L45 41 Z" fill={accent} />
          <path d="M52 38 L59 35 L59 41 Z" fill={accent} />
          <circle cx="52" cy="38" r="1.8" fill={ink} />
        </g>
      );
    case 'glasses':
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <circle cx="34" cy="21" r="9" />
          <circle cx="70" cy="21" r="9" />
          <line x1="43" y1="20" x2="61" y2="20" />
          <line x1="79" y1="20" x2="86" y2="17" />
        </g>
      );
    case 'monocle':
      return (
        <g fill="none">
          <circle cx="70" cy="21" r="9.5" stroke={accent} strokeWidth="1.8" />
          <path d="M77 27 q4 4 5 7" stroke={ink} strokeWidth="1.2" strokeDasharray="1.6 2" />
        </g>
      );
    case 'topknot':
      return (
        <g>
          <rect x="50.8" y="1.5" width="2.4" height="5" rx="1.2" fill={ink} />
          <circle cx="52" cy="1" r="3.2" fill={ink} />
          <rect x="49.6" y="3.6" width="4.8" height="1.6" rx="0.8" fill={accent} />
        </g>
      );
    default:
      return null;
  }
}

function FlatMark({ accent, ink, costume = 'none', beltColor = '#e9e7de' }) {
  return (
    <svg className="dojo-flat" viewBox="0 0 92 44" aria-hidden="true" focusable="false">
      {/* the belt, worn on the brow — rank, so it is on in every fallback too */}
      <rect x="24" y="7.5" width="56" height="4.2" rx="1.6" fill={beltColor} />
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
      <FlatCostume kind={costume} accent={accent} ink={ink} />
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

export default function DojoLogo({ onClick, theme, view = 'home', progress = {}, belt = null }) {
  const { accent, ink } = useThemeColors(theme);
  const [hovered, setHovered] = useState(false);
  const burst = useRef(0);
  // Read once on mount: the preference does not change mid-session in practice,
  // and re-reading it per render would be a matchMedia call per paint.
  const [flat] = useState(() => prefersReducedMotion() || !hasWebGL());
  const costume = costumeForView(view);
  // The room's costume takes its slot; whatever you bought fills the rest.
  const outfit = useMemo(() => outfitFor(progress, costume), [progress, costume]);
  const beltColor = belt?.color ?? ink;

  const fallback = <FlatMark accent={accent} ink={ink} costume={costume} beltColor={beltColor} />;

  return (
    <button
      className={`header-logo dojo-logo ${hovered ? 'is-hot' : ''} ${flat ? 'is-flat' : ''}`}
      onClick={() => {
        burst.current = 1;
        onClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={belt ? `${mascotLabel(view)} · ${belt.name} belt` : mascotLabel(view)}
    >
      <span className="dojo-mark">
        {flat ? (
          fallback
        ) : (
          <MarkBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <DojoFace
                accent={accent}
                ink={ink}
                hovered={hovered}
                burst={burst}
                outfit={outfit}
                beltColor={beltColor}
              />
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
