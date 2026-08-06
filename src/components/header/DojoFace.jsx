import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

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
function Eye({ x, accent, pointer, hovered, blink }) {
  const pupil = useRef(null);
  const lid = useRef(null);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 9);
    if (pupil.current) {
      // The pupil leans toward the cursor but never leaves the iris.
      const tx = x + pointer.current.x * 0.11;
      const ty = pointer.current.y * 0.11;
      pupil.current.position.x += (tx - pupil.current.position.x) * k;
      pupil.current.position.y += (ty - pupil.current.position.y) * k;
      pupil.current.position.z = 0.16;
    }
    if (lid.current) {
      // blink.current is 1 while a blink is playing, 0 the rest of the time.
      const target = blink.current;
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
function Smile({ accent, hovered }) {
  const ref = useRef(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = hovered ? 1.16 : 1;
    ref.current.scale.x += (target - ref.current.scale.x) * Math.min(1, dt * 8);
    ref.current.scale.y += (target - ref.current.scale.y) * Math.min(1, dt * 8);
  });
  return (
    <mesh ref={ref} position={[NOSE_X, -0.66, 0]} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[0.62, 0.05, 8, 26, Math.PI]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
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
function Mark({ accent, ink, hovered, burst }) {
  const group = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const blink = useRef(0);
  const nextBlink = useRef(2 + Math.random() * 3);
  const { viewport } = useThree();

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    // Pointer in -1..1, held in a ref so tracking never re-renders React.
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;

    if (group.current) {
      // Idle: a slow figure-of-eight so it is never quite still.
      const floatY = Math.sin(t * 0.9) * 0.045;
      const idleRotY = Math.sin(t * 0.55) * 0.14;
      const idleRotX = Math.cos(t * 0.75) * 0.06;
      // Lean toward the cursor, harder while hovered.
      const reach = hovered ? 0.42 : 0.16;
      const targetY = idleRotY + state.pointer.x * reach;
      const targetX = idleRotX - state.pointer.y * reach * 0.6;
      const k = Math.min(1, dt * (hovered ? 7 : 3.5));
      group.current.rotation.y += (targetY - group.current.rotation.y) * k;
      group.current.rotation.x += (targetX - group.current.rotation.x) * k;
      group.current.position.y += (floatY - group.current.position.y) * Math.min(1, dt * 4);
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
      <Eye x={EYE_L} accent={accent} pointer={pointer} hovered={hovered} blink={blink} />
      <LetterJ ink={ink} accent={accent} />
      <Eye x={EYE_R} accent={accent} pointer={pointer} hovered={hovered} blink={blink} />
      <Smile accent={accent} hovered={hovered} />
      <Sparks accent={accent} burst={burst} />
    </group>
  );
}

// `hovered` and `burst` come from the wrapper, because the real control is the
// <button> around this canvas — that's what owns the label, the focus ring and
// the click. The canvas sits inside it, so pointer events still bubble up and
// nothing has to be re-implemented here.
export default function DojoFace({ accent = '#e5484d', ink = '#e9e7de', hovered = false, burst }) {
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
      <Mark accent={accent} ink={ink} hovered={hovered} burst={burst ?? localBurst} />
    </Canvas>
  );
}
