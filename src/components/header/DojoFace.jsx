import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { beacon, watchBeacon, typingHeat } from '../../anim/mascotBeacon.js';
import { expressionFor } from '../../state/mascotMood.js';

// The wordmark, in three dimensions: d · o · j · o — where the two o's are eyes,
// the j's tittle is the nose, and a stroke under them is the smile.
//
// Every letter is built from primitives (torus, capsule, sphere), never from
// loaded 3D type. That's deliberate: a font would cost a network round trip and
// hundreds of kilobytes to say four letters, and the low-poly read is the point
// — this should look drawn, not extruded.
//
// The whole module is behind React.lazy in DojoLogo.jsx, so three.js lands in
// its own chunk and the app shell never pays for it on first paint.

const REST_Y = 0.12;
const EYE_L = -0.62;
const NOSE_X = 0.34;
const EYE_R = 1.28;

// One eye: a ring with a pupil that tracks the pointer and blinks on its own.
// The lids are two flat discs that close over it, which reads far better at
// 34px than squashing the whole eye.
function Eye({ x, accent, pointer, hovered, blink, typing, face }) {
  const ring = useRef(null);
  const pupil = useRef(null);
  const lid = useRef(null);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 9);
    if (pupil.current) {
      // The pupil leans toward the cursor but never leaves the iris. While
      // you're typing it drops instead, as if watching the keys.
      const heat = typing.current;
      const tx = pointer.current.x * 0.11 * (1 - heat);
      const ty = pointer.current.y * 0.11 * (1 - heat) - heat * 0.11;
      pupil.current.position.x += (tx - pupil.current.position.x) * k;
      pupil.current.position.y += (ty - pupil.current.position.y) * k;
      pupil.current.position.z = 0.16;
    }
    if (lid.current) {
      // The lid does double duty: a full close for a blink, and a half-close
      // for the squint the expression asks for — concentration while you work,
      // and nothing at all when he's delighted.
      const target = Math.max(blink.current, Math.max(0, face.current.squint));
      lid.current.scale.y += (target - lid.current.scale.y) * Math.min(1, dt * 26);
      lid.current.visible = lid.current.scale.y > 0.02;
    }
    if (ring.current) {
      // A negative squint is the other direction: eyes widening. Growing the
      // ring says "delighted" far more cheaply than a second mesh would.
      const open = 1 + Math.max(0, -face.current.squint) * 0.16;
      const s = ring.current.scale.x + (open - ring.current.scale.x) * Math.min(1, dt * 14);
      ring.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh ref={ring}>
        <torusGeometry args={[0.3, 0.085, 12, 32]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={hovered ? 0.85 : 0.35}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      {/* Local to the eye group, which is ALREADY at x — offsetting by x again
          put both pupils outside the face as two stray dots. */}
      <mesh ref={pupil} position={[0, 0, 0.16]}>
        <sphereGeometry args={[0.105, 16, 16]} />
        <meshStandardMaterial color="#12141d" roughness={0.2} />
      </mesh>
      <mesh ref={lid} position={[0, 0.16, 0.24]} scale={[1, 0, 1]}>
        <planeGeometry args={[0.78, 0.42]} />
        <meshBasicMaterial color={accent} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// The leading `d`: a stem and a bowl. Not a face part — it just has to read.
function LetterD({ ink }) {
  return (
    <group position={[-1.72, 0, 0]}>
      <mesh position={[0.28, 0.06, 0]}>
        <capsuleGeometry args={[0.055, 0.86, 4, 8]} />
        <meshStandardMaterial color={ink} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.13, 0]}>
        <torusGeometry args={[0.28, 0.075, 10, 26]} />
        <meshStandardMaterial color={ink} roughness={0.5} />
      </mesh>
    </group>
  );
}

// The `j`: its dot is the nose, so it sits between the eyes and gets the accent.
function LetterJ({ ink, accent }) {
  return (
    <group position={[NOSE_X, 0, 0]}>
      <mesh position={[0.1, -0.12, 0]}>
        <capsuleGeometry args={[0.055, 0.42, 4, 8]} />
        <meshStandardMaterial color={ink} roughness={0.5} />
      </mesh>
      <mesh position={[-0.02, -0.46, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.13, 0.055, 8, 18, Math.PI]} />
        <meshStandardMaterial color={ink} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 0.3, 0.06]}>
        <sphereGeometry args={[0.085, 14, 14]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// The mouth: a half-torus under o-j-o.
//
// One mesh covers the whole emotional range because scaling its arc is enough.
// scale.y 1 is the resting smile, 1.6 a grin, 0 the flat line of someone
// concentrating — and **negative flips the arc into a frown**, which is the
// whole reason the mouth is a curve rather than a drawn shape.
const MOUTH_Y = -0.66;
const MOUTH_R = 0.62;
function Smile({ accent, hovered, face }) {
  const ref = useRef(null);
  const sy = useRef(1);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const k = Math.min(1, dt * 8);
    const wide = hovered ? 1.16 : 1;
    ref.current.scale.x += (wide - ref.current.scale.x) * k;
    // A frown swings a long way for the same number, so the downward half of
    // the range is compressed — otherwise the arc climbs into the letters.
    // Both ends of the range are compressed, for the same reason: at full
    // value the arc leaves the canvas. A grin that gets clipped reads as a
    // rendering bug, not as joy.
    const m = face.current.mouth;
    const target = m < 0 ? m * 0.55 : m <= 1 ? m : 1 + (m - 1) * 0.45;
    sy.current += (target - sy.current) * k;
    ref.current.scale.y = sy.current * wide;
    // When it flips, drop it by its own arc height so the frown's apex lands
    // exactly on the line the smile used to sit on. Without this the mouth
    // climbs through the `j`'s descender.
    const flipped = Math.max(0, -ref.current.scale.y);
    ref.current.position.y = MOUTH_Y - flipped * MOUTH_R;
  });
  return (
    <mesh ref={ref} position={[NOSE_X, MOUTH_Y, 0]} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[MOUTH_R, 0.05, 8, 26, Math.PI]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  );
}

// The brows. They do most of the emotional work — knitted and low is the
// lecturer watching you type, raised is delight — so they have to be *seen*.
//
// At rest they tuck against the underside of the belt band, where they read as
// part of it. Knitting drops them onto the top of the eye ring — the accent
// behind them is what makes them legible at 34px, which a bar floating in the
// 0.08 gap between ring and band never was. Raising them sends them back up
// into the band, so delight is brows gone and eyes wide.
const BROW_Y = 0.42;
function Brows({ ink, face }) {
  const left = useRef(null);
  const right = useRef(null);
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 12);
    const b = face.current.brow;
    // -1 knits: inner ends drop toward the nose. +1 arches them up and out.
    const tilt = -b * 0.42;
    const y = BROW_Y + b * 0.15;
    // side = which way is "outer" in x, so one expression mirrors correctly.
    for (const [ref, side] of [
      [left, -1],
      [right, 1],
    ]) {
      if (!ref.current) continue;
      ref.current.rotation.z += (side * tilt - ref.current.rotation.z) * k;
      ref.current.position.y += (y - ref.current.position.y) * k;
    }
  });
  return (
    <>
      {[
        [EYE_L, left],
        [EYE_R, right],
      ].map(([x, ref]) => (
        <mesh key={x} ref={ref} position={[x, BROW_Y, 0.34]}>
          <boxGeometry args={[0.46, 0.085, 0.07]} />
          <meshStandardMaterial color={ink} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

// ── the wardrobe ───────────────────────────────────────────────────────────
// One costume per room (src/state/mascot.js decides which). Each is a few
// primitives sitting over the face, and each drops in with a bounce when you
// change rooms — the whole point is that you notice you have arrived somewhere.
const FACE_X = (EYE_L + EYE_R) / 2; // between the eyes: where a hat belongs

function Cap({ accent, ink }) {
  return (
    <group position={[FACE_X, 0.92, 0]}>
      {/* the skull cap, then the board on top, tipped back a little */}
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={ink} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[0.16, 0.28, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.95]} />
        <meshStandardMaterial color={ink} roughness={0.55} />
      </mesh>
      {/* the tassel — a cord and its knot, hanging off the right corner */}
      <mesh position={[0.4, 0.02, 0.28]}>
        <capsuleGeometry args={[0.018, 0.24, 3, 6]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[0.4, -0.14, 0.28]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// The hachimaki. The belt already IS the band, so this ties it: a knot at the
// side and two tails streaming behind, which is what turns a band into
// something someone put on this morning.
function Headband({ accent }) {
  const mat = <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} roughness={0.5} />;
  const tails = useRef(null);
  useFrame((state) => {
    if (tails.current) tails.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.9) * 0.09;
  });
  return (
    <group position={[FACE_X - 1.36, BAND_Y, 0.06]}>
      <mesh>
        <boxGeometry args={[0.26, 0.3, 0.5]} />
        {mat}
      </mesh>
      <group ref={tails}>
        <mesh position={[-0.28, -0.12, 0]} rotation={[0, 0, 0.42]}>
          <boxGeometry args={[0.56, 0.1, 0.2]} />
          {mat}
        </mesh>
        <mesh position={[-0.3, -0.38, 0]} rotation={[0, 0, 0.88]}>
          <boxGeometry args={[0.46, 0.09, 0.2]} />
          {mat}
        </mesh>
      </group>
    </group>
  );
}

// Terry cloth and two speed marks, because the warm-up is a sprint.
function Sweatband({ accent, ink }) {
  return (
    <group position={[FACE_X, 0.82, 0.05]}>
      <mesh>
        <boxGeometry args={[2.4, 0.22, 0.44]} />
        <meshStandardMaterial color={ink} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.23]}>
        <boxGeometry args={[2.42, 0.08, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </mesh>
      {[-1.5, -1.72].map((x, i) => (
        <mesh key={i} position={[x, -0.34 - i * 0.22, 0]}>
          <boxGeometry args={[0.4 - i * 0.12, 0.06, 0.06]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Interview clothes: a bow tie under the chin.
function BowTie({ accent, ink }) {
  return (
    <group position={[NOSE_X, -1.56, 0.1]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.24, 0, 0]} rotation={[0, 0, side * 0.34]}>
          <boxGeometry args={[0.36, 0.3, 0.1]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} roughness={0.5} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={ink} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Reading glasses: a rim around each eye and a bridge between them.
function Glasses({ ink }) {
  const mat = <meshStandardMaterial color={ink} metalness={0.5} roughness={0.3} />;
  return (
    <group position={[0, 0, 0.26]}>
      {[EYE_L, EYE_R].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <torusGeometry args={[0.42, 0.032, 8, 26]} />
          {mat}
        </mesh>
      ))}
      <mesh position={[FACE_X, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.026, 1.08, 3, 6]} />
        {mat}
      </mesh>
      {/* one temple arm, folding back past the right eye */}
      <mesh position={[EYE_R + 0.44, 0.1, -0.12]} rotation={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.024, 0.4, 3, 6]} />
        {mat}
      </mesh>
    </group>
  );
}

// A monocle over one eye, with the chain it never quite needs.
function Monocle({ accent, ink }) {
  return (
    <group position={[EYE_R, 0, 0.26]}>
      <mesh>
        <torusGeometry args={[0.44, 0.04, 8, 28]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} metalness={0.6} roughness={0.25} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.34 + i * 0.13, -0.36 - i * 0.16, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color={ink} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// The sensei's topknot: a small bun, tied.
function Topknot({ accent, ink }) {
  return (
    <group position={[FACE_X, 0.78, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.07, 0.16, 3, 8]} />
        <meshStandardMaterial color={ink} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial color={ink} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.028, 6, 14]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// The belt, worn as a headband.
//
// Not a costume — a costume is where you are, a belt is what you've earned, so
// it is always on and no room can take it off you. It sits on the brow rather
// than under the chin for two reasons: the smile's arc reaches down past the
// letters, so a sash there crossed the mouth; and a band across the forehead is
// the thing every hat in the shop can sit on top of.
const BAND_Y = 0.56;
function Belt({ color }) {
  return (
    <group position={[FACE_X, BAND_Y, 0.04]}>
      <mesh>
        <boxGeometry args={[2.72, 0.19, 0.44]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* A lit rim, so a Black belt still reads against a dark page — the
          darkest rank must not be the one you can't see. */}
      <mesh position={[0, -0.04, 0.23]}>
        <boxGeometry args={[2.72, 0.05, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── the shop's own items ───────────────────────────────────────────────────
// A conical straw hat. The wandering-swordsman look.
function Kasa({ ink, accent }) {
  return (
    <group position={[FACE_X, 1.0, 0]}>
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[1.15, 0.5, 18]} />
        <meshStandardMaterial color="#c9a86a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.04, 6, 16]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={ink} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Crown({ accent }) {
  const gold = '#e8b04b';
  return (
    <group position={[FACE_X, 0.98, 0]}>
      <mesh>
        <boxGeometry args={[1.15, 0.18, 0.4]} />
        <meshStandardMaterial color={gold} metalness={0.75} roughness={0.25} emissive={gold} emissiveIntensity={0.28} />
      </mesh>
      {[-0.42, 0, 0.42].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0]}>
          <coneGeometry args={[0.13, 0.34, 4]} />
          <meshStandardMaterial color={gold} metalness={0.75} roughness={0.25} emissive={gold} emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// Wraparound shades: one bar across both eyes, with a highlight.
function Shades({ ink }) {
  return (
    <group position={[FACE_X, 0.02, 0.3]}>
      <mesh>
        <boxGeometry args={[2.46, 0.34, 0.1]} />
        <meshStandardMaterial color="#14161f" roughness={0.15} metalness={0.4} />
      </mesh>
      <mesh position={[-0.5, 0.07, 0.06]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.62, 0.05, 0.02]} />
        <meshStandardMaterial color={ink} emissive={ink} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[1.4, 0.1, -0.1]} rotation={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.03, 0.36, 3, 6]} />
        <meshStandardMaterial color="#14161f" roughness={0.3} />
      </mesh>
    </group>
  );
}

// A scarf that trails, and drifts on its own.
function Scarf({ accent }) {
  const tail = useRef(null);
  useFrame((state) => {
    if (tail.current) tail.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.7) * 0.16;
  });
  return (
    <group position={[NOSE_X, -1.52, 0.06]}>
      {/* the wrap */}
      <mesh>
        <boxGeometry args={[1.5, 0.22, 0.4]} />
        <meshStandardMaterial color={accent} roughness={0.8} />
      </mesh>
      {/* the loose end, drifting */}
      <group ref={tail} position={[-0.72, -0.05, 0.06]}>
        <mesh position={[-0.3, -0.16, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.66, 0.17, 0.14]} />
          <meshStandardMaterial color={accent} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ── auras ──────────────────────────────────────────────────────────────────
// One particle system, three moods. Embers rise, petals fall, flame licks —
// same buffer, different velocity field, so a third aura costs no more than
// the first.
const AURA_N = 26;
function Aura({ kind, accent }) {
  const points = useRef(null);
  const material = useRef(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: AURA_N }, () => ({
        x: (Math.random() - 0.5) * 4.2,
        phase: Math.random() * 10,
        speed: 0.35 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.6,
      })),
    []
  );
  const positions = useMemo(() => new Float32Array(AURA_N * 3), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const geom = points.current?.geometry;
    if (!geom) return;
    for (let i = 0; i < AURA_N; i++) {
      const s = seeds[i];
      // 0..1 through the particle's own loop
      const life = ((t * s.speed + s.phase) % 3) / 3;
      const rise = kind === 'petals' ? 1 - life : life; // petals come down
      positions[i * 3] = s.x + Math.sin((t + s.phase) * 1.4) * s.drift;
      positions[i * 3 + 1] = -1.6 + rise * 3.4;
      positions[i * 3 + 2] = -0.4;
    }
    geom.attributes.position.needsUpdate = true;
    if (material.current) {
      material.current.opacity = kind === 'flame' ? 0.75 : 0.6;
    }
  });

  const color = kind === 'flame' ? '#5bc8ff' : kind === 'petals' ? '#f7b8d0' : accent;
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={AURA_N} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        color={color}
        size={kind === 'petals' ? 0.13 : 0.1}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

const OUTFITS = {
  cap: Cap,
  headband: Headband,
  sweatband: Sweatband,
  bowtie: BowTie,
  glasses: Glasses,
  monocle: Monocle,
  topknot: Topknot,
  kasa: Kasa,
  crown: Crown,
  shades: Shades,
  scarf: Scarf,
  sparks: (p) => <Aura kind="sparks" {...p} />,
  petals: (p) => <Aura kind="petals" {...p} />,
  flame: (p) => <Aura kind="flame" {...p} />,
};

// One worn item. It drops in from above and settles with an overshoot, so
// putting something on is a small event rather than a swap you never see.
// Auras don't drop — they're already ambient — so they skip the entrance.
function Worn({ kind, accent, ink }) {
  const group = useRef(null);
  const age = useRef(0);
  const Outfit = OUTFITS[kind];
  const drops = kind !== 'sparks' && kind !== 'petals' && kind !== 'flame';

  useEffect(() => {
    age.current = 0;
  }, [kind]);

  useFrame((_, dt) => {
    if (!group.current || !drops) return;
    age.current = Math.min(1, age.current + dt * 2.6);
    const t = age.current;
    // A decaying bounce: overshoots once, then settles at rest.
    const settle = 1 - Math.cos(t * Math.PI * 1.4) * Math.exp(-t * 3.4);
    group.current.position.y = (1 - Math.min(1, settle)) * 0.9;
    group.current.scale.setScalar(0.55 + 0.45 * Math.min(1, settle * 1.05));
  });

  if (!Outfit) return null;
  return (
    <group ref={group} key={kind}>
      <Outfit accent={accent} ink={ink} />
    </group>
  );
}

// The whole kit: one item per slot, in a fixed draw order so an aura never
// lands in front of a face.
function Outfit({ outfit, accent, ink }) {
  return (
    <>
      {['aura', 'neck', 'hat', 'face'].map((slot) =>
        outfit?.[slot] ? (
          <Worn key={`${slot}-${outfit[slot]}`} kind={outfit[slot]} accent={accent} ink={ink} />
        ) : null
      )}
    </>
  );
}

// A click scatters a ring of sparks outward and fades them. One buffer,
// re-seeded per burst — no allocation while it plays.
const SPARKS = 22;
function Sparks({ accent, burst }) {
  const points = useRef(null);
  const life = useRef(0);
  const dirs = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        const a = (i / SPARKS) * Math.PI * 2;
        const speed = 1.5 + (i % 5) * 0.28;
        return [Math.cos(a) * speed, Math.sin(a) * speed * 0.7];
      }),
    []
  );
  const positions = useMemo(() => new Float32Array(SPARKS * 3), []);
  const material = useRef(null);

  useFrame((_, dt) => {
    if (burst.current > 0) {
      life.current = 1;
      burst.current = 0;
    }
    if (life.current <= 0) {
      if (points.current) points.current.visible = false;
      return;
    }
    life.current = Math.max(0, life.current - dt * 1.6);
    const t = 1 - life.current;
    const geom = points.current?.geometry;
    if (!geom) return;
    points.current.visible = true;
    for (let i = 0; i < SPARKS; i++) {
      positions[i * 3] = NOSE_X + dirs[i][0] * t;
      positions[i * 3 + 1] = dirs[i][1] * t;
      positions[i * 3 + 2] = 0.3;
    }
    geom.attributes.position.needsUpdate = true;
    if (material.current) material.current.opacity = life.current * 0.9;
  });

  return (
    <points ref={points} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={SPARKS} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={material} color={accent} size={0.11} transparent opacity={0} sizeAttenuation />
    </points>
  );
}

// The whole mark: idle float, a spring-ish lean toward the pointer, and the
// blink timer. All the per-frame work happens here so the leaf meshes stay
// cheap.
function Mark({ accent, ink, hovered, burst, outfit, beltColor, fit, view }) {
  const group = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const typing = useRef(0);
  // What the face is feeling this frame — recomputed from the room and the last
  // event, then read by the brows, the eyes and the mouth. A ref, not state:
  // an expression must not cost a React render sixty times a second.
  const face = useRef({ brow: 0, squint: 0, mouth: 1, bounce: 0, shake: 0 });
  // Lean and float are eased toward a target; the impulses are added on top
  // afterwards, so a hop never poisons the value the easing is converging on.
  const leanY = useRef(0);
  const floatY = useRef(REST_Y);
  const blink = useRef(0);
  const nextBlink = useRef(2 + Math.random() * 3);
  const lastKey = useRef(0);
  const bob = useRef(0);
  const { viewport, gl } = useThree();

  // Fit both axes. Width leaves headroom for the lean — at full rotation the
  // `d` swings toward the left edge, and a clipped letter reads as a bug
  // rather than as depth. Height has to clear the belt, which hangs below the
  // letters. `fit` divides it: 1 is snug, a stage passes more.
  //
  // This is read inside useFrame rather than set as a `scale` prop, because
  // the hover pulse writes group.scale every frame and would overwrite a prop.
  const scale = Math.min(1.05, viewport.width / 4.6, viewport.height / 2.95) / fit;

  // One shared window listener, ref-counted in the beacon module.
  useEffect(() => watchBeacon(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // ── where to look ────────────────────────────────────────────────────
    // Not R3F's canvas-local pointer: the mascot watches the cursor anywhere
    // on screen. It measures the direction from its own centre to the cursor
    // in client pixels and normalises by a comfortable arm's length, so the
    // gaze saturates well before the far corner of a wide monitor.
    const rect = gl.domElement.getBoundingClientRect();
    if (beacon.seen && rect.width) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const REACH = 520;
      pointer.current.x = Math.max(-1, Math.min(1, (beacon.x - cx) / REACH));
      pointer.current.y = Math.max(-1, Math.min(1, -(beacon.y - cy) / REACH));
    }

    // ── whether you're mid-sentence ──────────────────────────────────────
    const heat = typingHeat();
    typing.current += (heat - typing.current) * Math.min(1, dt * 12);
    // One small nod per keystroke, so it taps along with you.
    if (beacon.keyCount !== lastKey.current) {
      lastKey.current = beacon.keyCount;
      bob.current = 1;
    }
    bob.current = Math.max(0, bob.current - dt * 7);

    // ── how he feels about it ────────────────────────────────────────────
    // The room sets the resting face; whatever last happened to you overrides
    // it and then fades back. Everything below just renders the five numbers.
    face.current = expressionFor({
      pulse: beacon.mood,
      pulseAt: beacon.moodAt,
      view,
      typing: typing.current,
      now: performance.now(),
    });

    if (group.current) {
      // Idle: a slow figure-of-eight so it is never quite still.
      // REST_Y lifts the whole mark, because the belt hangs below the letters
      // and the face still has to look optically centred in its box.
      const restY = REST_Y + Math.sin(t * 0.9) * 0.045 - bob.current * 0.05;
      const idleRotY = Math.sin(t * 0.55) * 0.14;
      const idleRotX = Math.cos(t * 0.75) * 0.06;
      // Lean toward the cursor, harder while hovered — and dip toward the
      // keyboard while typing, which is where its attention actually is.
      const reach = hovered ? 0.42 : 0.2;
      const targetY = idleRotY + pointer.current.x * reach;
      const targetX =
        idleRotX - pointer.current.y * reach * 0.6 + typing.current * 0.2 + bob.current * 0.05;
      const k = Math.min(1, dt * (hovered ? 7 : 3.5));
      leanY.current += (targetY - leanY.current) * k;
      group.current.rotation.x += (targetX - group.current.rotation.x) * k;
      floatY.current += (restY - floatY.current) * Math.min(1, dt * 8);
      // The two impulses ride on top of the settled values, at their own
      // frequencies — a hop you can count, and a head-shake that says no.
      // Small on purpose: the mark is fitted to its box with almost no
      // headroom, so a big hop just clips the hat off.
      const hop = face.current.bounce * 0.11 * Math.abs(Math.sin(t * 12));
      group.current.position.y = floatY.current + hop;
      group.current.rotation.y = leanY.current + Math.sin(t * 21) * face.current.shake * 0.4;
      // The pulse multiplies the fitted scale rather than replacing it.
      const s = scale * (hovered ? 1.07 : 1);
      group.current.scale.x += (s - group.current.scale.x) * Math.min(1, dt * 9);
      group.current.scale.y = group.current.scale.x;
      group.current.scale.z = group.current.scale.x;
    }

    // Blink: a quick close/open, then wait a random beat.
    nextBlink.current -= dt;
    if (nextBlink.current <= 0) {
      blink.current = 1;
      if (nextBlink.current < -0.09) {
        blink.current = 0;
        nextBlink.current = 2.6 + Math.random() * 3.4;
      }
    }
  });

  // Fit the mark to whatever width the canvas got.
  return (
    <group ref={group} scale={scale}>
      <LetterD ink={ink} />
      <Eye x={EYE_L} accent={accent} pointer={pointer} hovered={hovered} blink={blink} typing={typing} face={face} />
      <LetterJ ink={ink} accent={accent} />
      <Eye x={EYE_R} accent={accent} pointer={pointer} hovered={hovered} blink={blink} typing={typing} face={face} />
      <Smile accent={accent} hovered={hovered} face={face} />
      <Brows ink={ink} face={face} />
      <Belt color={beltColor} />
      <Outfit outfit={outfit} accent={accent} ink={ink} />
      <Sparks accent={accent} burst={burst} />
    </group>
  );
}

// `hovered` and `burst` come from the wrapper, because the real control is the
// <button> around this canvas — that's what owns the label, the focus ring and
// the click. The canvas sits inside it, so pointer events still bubble up and
// nothing has to be re-implemented here.
export default function DojoFace({
  accent = '#e5484d',
  ink = '#e9e7de',
  hovered = false,
  burst,
  outfit = null,
  beltColor = '#e9e7de',
  // Divides the fitted scale. 1 is snug (the header bar); a stage passes more
  // to leave the whole character comfortably inside its frame.
  fit = 1,
  // Which room he's in. It sets the resting face — serious where you work,
  // easy everywhere else — which events then interrupt.
  view = 'home',
}) {
  const localBurst = useRef(0);
  return (
    <Canvas
      className="dojo-face-canvas"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.35], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.4} />
      <pointLight position={[-2, -1, 2]} intensity={18} color={accent} distance={7} decay={2} />
      <Mark
        accent={accent}
        ink={ink}
        hovered={hovered}
        burst={burst ?? localBurst}
        outfit={outfit}
        beltColor={beltColor}
        fit={fit}
        view={view}
      />
    </Canvas>
  );
}
