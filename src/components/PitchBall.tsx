import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StrikeoutPitch } from '../data/korStrikeoutPitches';
import { buildTrajectoryCurve } from '../utils/trajectory';
import { getPitchColor } from '../utils/pitchColors';

interface PitchBallProps {
  pitch: StrikeoutPitch;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  animationSpeed?: number;
}

export default function PitchBall({
  pitch,
  isAnimating,
  onAnimationComplete,
  animationSpeed = 1,
}: PitchBallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  const curve = useMemo(() => buildTrajectoryCurve(pitch), [pitch]);
  const color = useMemo(() => getPitchColor(pitch.pitchCode), [pitch.pitchCode]);

  // Trail points
  const trailRef = useRef<THREE.Vector3[]>([]);
  const trailMeshRef = useRef<THREE.Line | null>(null);

  // Reset when pitch changes
  useMemo(() => {
    progressRef.current = 0;
    completedRef.current = false;
    trailRef.current = [];
  }, [pitch]);

  useFrame((_, delta) => {
    if (!isAnimating || completedRef.current || !meshRef.current) return;

    // Progress based on real plateTime
    const duration = pitch.plateTime * (1 / animationSpeed);
    progressRef.current += delta / duration;

    if (progressRef.current >= 1) {
      progressRef.current = 1;
      completedRef.current = true;
      const endPos = curve.getPoint(1);
      meshRef.current.position.copy(endPos);
      onAnimationComplete();
      return;
    }

    const pos = curve.getPoint(progressRef.current);
    meshRef.current.position.copy(pos);

    // Update trail
    trailRef.current.push(pos.clone());
    if (trailRef.current.length > 30) {
      trailRef.current.shift();
    }

    if (trailMeshRef.current && trailRef.current.length > 1) {
      const geom = trailMeshRef.current.geometry as THREE.BufferGeometry;
      const positions = new Float32Array(trailRef.current.length * 3);
      trailRef.current.forEach((p, i) => {
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      });
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setDrawRange(0, trailRef.current.length);
    }
  });

  // Start position
  const startPos = useMemo(() => curve.getPoint(0), [curve]);

  // Create trail line object imperatively to avoid JSX <line> vs SVG conflict
  const trailLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(90), 3));
    geom.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
    return new THREE.Line(geom, mat);
  }, [color]);

  // Store trail ref for useFrame updates
  useMemo(() => {
    trailMeshRef.current = trailLine;
  }, [trailLine]);

  return (
    <group>
      {/* Ball */}
      <mesh ref={meshRef} position={isAnimating ? undefined : startPos}>
        <sphereGeometry args={[0.121, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Trail - primitive to avoid SVG type conflict */}
      <primitive object={trailLine} />
    </group>
  );
}
