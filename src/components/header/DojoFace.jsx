import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { beacon, watchBeacon, typingHeat } from '../../anim/mascotBeacon.js';

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

const EYE_L = -0.62;
const NOSE_X = 0.34;
const EYE_R = 1.28;

// One eye: a ring with a pupil that tracks the pointer and blinks on its own.
// The lids are two flat discs that close over it, which reads far better at
// 34px than squashing the whole eye.
function Eye({ x, accent, pointer, hovered, blink, typing }) {
  const pupil = useRef(null);
  const lid = useRef(null);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 9);
    if (pupil.current) {
      // The pupil leans toward the cursor but never leaves the iris. While
      // you're typing it drops instead, as if watching the keys.
      const heat = typing.current;
      const tx = x + pointer.current.x * 0.11 * (1 - heat);
      const ty = pointer.current.y * 0.11 * (1 - heat) - heat * 0.11;
      pupil.current.position.x += (tx - pupil.current.position.x) * k;
      pupil.current.position.y += (ty - pupil.current.position.y) * k;
      pupil.current.position.z = 0.16;
    }
    if (lid.current) {
      // The lid does double duty: a full close for a blink, and a half-close
      // for the squint of concentration while you're mid-sentence.
      const target = Math.max(blink.current, typing.current * 0.34);
      lid.current.scale.y += (target - lid.current.scale.y) * Math.min(1, dt * 26);
      lid.current.visible = lid.current.scale.y > 0.02;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.3, 0.085, 12, 32]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={hovered ? 0.85 : 0.35}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh ref={pupil} position={[x, 0, 0.16]}>
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

// The smile: a half-torus under o-j-o. It deepens when you hover.
function Smile({ accent, hovered, typing }) {
  const ref = useRef(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const k = Math.min(1, dt * 8);
    const target = hovered ? 1.16 : 1;
    ref.current.scale.x += (target - ref.current.scale.x) * k;
    // Flattening the arc turns the grin into the small straight line of
    // someone concentrating. It springs back the moment you stop.
    const flat = 1 - typing.current * 0.78;
    ref.current.scale.y += (target * flat - ref.current.scale.y) * k;
  });
  return (
    <mesh ref={ref} position={[NOSE_X, -0.66, 0]} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[0.62, 0.05, 8, 26, Math.PI]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  );
}

// ── the wardrobe ───────────────────────────────────────────────────────────
// One costume per room (src/state/mascot.js decides which). Each is a few
// primitives sitting over the face, and each drops in with a bounce when you
// change rooms — the whole point is that you notice you have arrived somewhere.
const FACE_X = (EYE_L + EYE_R) / 2; // between the eyes: where a hat belongs

function Cap({ accent, ink }) {
  return (
    <group position={[FACE_X, 0.62, 0]}>
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

// The hachimaki: a band across the brow with two tails streaming behind.
function Headband({ accent }) {
  const mat = <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} roughness={0.5} />;
  return (
    <group position={[FACE_X, 0.64, 0.05]}>
      <mesh>
        <boxGeometry args={[2.5, 0.16, 0.42]} />
        {mat}
      </mesh>
      <mesh position={[-1.28, -0.1, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.5, 0.08, 0.2]} />
        {mat}
      </mesh>
      <mesh position={[-1.3, -0.3, 0]} rotation={[0, 0, 0.95]}>
        <boxGeometry args={[0.42, 0.07, 0.2]} />
        {mat}
      </mesh>
    </group>
  );
}

// Terry cloth and two speed marks, because the warm-up is a sprint.
function Sweatband({ accent, ink }) {
  return (
    <group position={[FACE_X, 0.66, 0.05]}>
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
    <group position={[NOSE_X, -1.02, 0.1]}>
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
    <group position={[FACE_X, 0.58, 0]}>
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

const OUTFITS = {
  cap: Cap,
  headband: Headband,
  sweatband: Sweatband,
  bowtie: BowTie,
  glasses: Glasses,
  monocle: Monocle,
  topknot: Topknot,
};

// The costume drops in from above and settles with an overshoot, so changing
// rooms is a small event rather than a swap you never see.
function Costume({ kind, accent, ink }) {
  const group = useRef(null);
  const age = useRef(0);
  const Outfit = OUTFITS[kind];

  useEffect(() => {
    age.current = 0;
  }, [kind]);

  useFrame((_, dt) => {
    if (!group.current) return;
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
function Mark({ accent, ink, hovered, burst, costume }) {
  const group = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const typing = useRef(0);
  const blink = useRef(0);
  const nextBlink = useRef(2 + Math.random() * 3);
  const lastKey = useRef(0);
  const bob = useRef(0);
  const { viewport, gl } = useThree();

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

    if (group.current) {
      // Idle: a slow figure-of-eight so it is never quite still.
      const floatY = Math.sin(t * 0.9) * 0.045 - bob.current * 0.05;
      const idleRotY = Math.sin(t * 0.55) * 0.14;
      const idleRotX = Math.cos(t * 0.75) * 0.06;
      // Lean toward the cursor, harder while hovered — and dip toward the
      // keyboard while typing, which is where its attention actually is.
      const reach = hovered ? 0.42 : 0.2;
      const targetY = idleRotY + pointer.current.x * reach;
      const targetX =
        idleRotX - pointer.current.y * reach * 0.6 + typing.current * 0.2 + bob.current * 0.05;
      const k = Math.min(1, dt * (hovered ? 7 : 3.5));
      group.current.rotation.y += (targetY - group.current.rotation.y) * k;
      group.current.rotation.x += (targetX - group.current.rotation.x) * k;
      group.current.position.y += (floatY - group.current.position.y) * Math.min(1, dt * 8);
      const s = hovered ? 1.07 : 1;
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
  // Leave headroom for the lean: at full rotation the `d` swings toward the
  // left edge, and a clipped letter reads as a bug, not as depth.
  const scale = Math.min(1.05, viewport.width / 4.9);

  return (
    <group ref={group} scale={scale}>
      <LetterD ink={ink} />
      <Eye x={EYE_L} accent={accent} pointer={pointer} hovered={hovered} blink={blink} typing={typing} />
      <LetterJ ink={ink} accent={accent} />
      <Eye x={EYE_R} accent={accent} pointer={pointer} hovered={hovered} blink={blink} typing={typing} />
      <Smile accent={accent} hovered={hovered} typing={typing} />
      <Costume kind={costume} accent={accent} ink={ink} />
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
  costume = 'none',
}) {
  const localBurst = useRef(0);
  return (
    <Canvas
      className="dojo-face-canvas"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.9], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.4} />
      <pointLight position={[-2, -1, 2]} intensity={18} color={accent} distance={7} decay={2} />
      <Mark accent={accent} ink={ink} hovered={hovered} burst={burst ?? localBurst} costume={costume} />
    </Canvas>
  );
}
