import { useEffect, useRef } from 'react';
import { useAnime } from '../anim/useAnime.js';

// The readiness score as a dial instead of a line of text. One number the whole
// app exists to move deserves to be the loudest thing on the page, and an arc
// that sweeps up to its value on arrival says "this moved" in a way "62/100"
// never does.
//
// The arc is drawn with stroke-dasharray/offset (GPU-cheap, no layout) and the
// final offset is also set inline, so the correct value is on screen even if the
// animation never runs. useAnime handles prefers-reduced-motion centrally.
const BAND = [
  { at: 75, tone: 'strong' },
  { at: 45, tone: 'building' },
  { at: 0, tone: 'early' },
];

export function readinessTone(score) {
  return BAND.find((b) => score >= b.at).tone;
}

export default function ReadinessRing({ score, size = 148, label = null, sub = null }) {
  const arcRef = useRef(null);
  const play = useAnime();
  const stroke = size < 90 ? 6 : 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - Math.max(0, Math.min(100, score)) / 100);

  useEffect(() => {
    play(arcRef.current, {
      strokeDashoffset: [circ, target],
      duration: 900,
      ease: 'outCubic',
    });
  }, [play, circ, target]);

  const tone = readinessTone(score);
  return (
    <div className={`ready-ring tone-${tone}`} style={{ '--ring-size': `${size}px` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* rotate so the arc starts at 12 o'clock and sweeps clockwise */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            className="ready-ring-track"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
          />
          <circle
            ref={arcRef}
            className="ready-ring-arc"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ strokeDasharray: circ, strokeDashoffset: target }}
          />
        </g>
      </svg>
      <div className="ready-ring-core">
        <span className="ready-ring-num">{score}</span>
        {label && <span className="ready-ring-label">{label}</span>}
      </div>
      {sub && <span className="ready-ring-sub">{sub}</span>}
    </div>
  );
}
