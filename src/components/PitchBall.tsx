import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StrikeoutPitch } from '../data/types';
import { buildTrajectoryCurve } from '../utils/trajectory';
import { getPitchColor } from '../utils/pitchColors';

interface PitchBallProps {
  pitch: StrikeoutPitch;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  animationSpeed?: number;
}

/**
 * Neuroscience-informed pitch animation:
 *
 * 1. Smooth Pursuit Breakdown — Human eyes track at max ~30-40°/s.
 *    A 95mph pitch exceeds this in the last ~15ft, creating a "jump" effect.
 *    → Apply perceptual acceleration in the final 20% of trajectory.
 *
 * 2. Looming Response — The superior colliculus responds exponentially
 *    to approaching objects. Linear size growth feels slow.
 *    → Exponential scale curve (power 2.5) instead of linear.
 *
 * 3. Visual Persistence — The visual system integrates over ~50-100ms.
 *    Fast objects appear stretched in the direction of motion.
 *    → Elongate ball along travel direction based on speed.
 *
 * 4. Trail Removal — Real baseballs don't leave visible trails.
 *    Long trails anchor attention to the past, reducing speed perception.
 *    → No trail. The ball alone carries speed information.
 *
 * 5. Arrival Flash — Startle/looming reflex at moment of arrival.
 *    → Brief emissive pulse when ball reaches the plate.
 */
export default function PitchBall({
  pitch,
  isAnimating,
  onAnimationComplete,
  animationSpeed = 1,
}: PitchBallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const prevPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const flashRef = useRef(0); // flash countdown

  const curve = useMemo(() => buildTrajectoryCurve(pitch), [pitch]);
  const color = useMemo(() => getPitchColor(pitch.pitchCode), [pitch.pitchCode]);

  // Reset when pitch changes
  useMemo(() => {
    progressRef.current = 0;
    completedRef.current = false;
    flashRef.current = 0;
    if (meshRef.current) {
      meshRef.current.scale.set(0.6, 0.6, 0.6);
      meshRef.current.rotation.set(0, 0, 0);
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.03;
    }
  }, [pitch]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Handle arrival flash decay (runs even after animation completes)
    if (flashRef.current > 0) {
      flashRef.current -= delta * 8; // fade over ~0.12s
      if (flashRef.current < 0) flashRef.current = 0;
      if (matRef.current) {
        matRef.current.emissiveIntensity = 0.03 + flashRef.current * 0.8;
      }
    }

    if (!isAnimating || completedRef.current) return;

    // === Perceptual acceleration (Smooth Pursuit Breakdown) ===
    // In the last 20% of flight, the eye can't track smoothly.
    // Accelerate perceived progress to simulate the "jump" batters report.
    const duration = pitch.plateTime * (1 / animationSpeed);
    progressRef.current += delta / duration;

    let perceivedProgress = progressRef.current;
    if (perceivedProgress > 0.8) {
      // Remap 0.8-1.0 → accelerated curve
      const tail = (perceivedProgress - 0.8) / 0.2; // 0→1 in last 20%
      // Ease-in: makes the last portion feel faster
      const accelerated = tail * tail;
      perceivedProgress = 0.8 + accelerated * 0.2;
    }

    if (progressRef.current >= 1) {
      progressRef.current = 1;
      completedRef.current = true;
      const endPos = curve.getPoint(1);
      meshRef.current.position.copy(endPos);
      meshRef.current.scale.set(1.8, 1.8, 1.8);
      meshRef.current.rotation.set(0, 0, 0);
      // Trigger arrival flash (Startle Response)
      flashRef.current = 1.0;
      onAnimationComplete();
      return;
    }

    const pos = curve.getPoint(perceivedProgress);
    meshRef.current.position.copy(pos);

    // === Looming Response (Exponential Scale) ===
    // Superior colliculus responds to angular expansion rate.
    // Exponential growth (power 2.5) triggers stronger looming reflex than linear.
    const zNorm = THREE.MathUtils.clamp((pos.z + 55) / 55, 0, 1);
    const looming = Math.pow(zNorm, 2.5); // exponential looming curve
    const baseScale = 0.5 + looming * 1.5; // 0.5x → 2.0x

    // === Visual Persistence (Motion Stretch) ===
    // The visual system integrates light over ~80ms.
    // Fast-moving objects appear elongated in travel direction.
    const currentPos = pos;
    const velocity = currentPos.clone().sub(prevPosRef.current);
    const speed = velocity.length() / Math.max(delta, 0.001);
    prevPosRef.current.copy(currentPos);

    // Stretch along Z (travel direction) proportional to speed
    // Subtle: max 1.6x stretch at highest speeds
    const stretchFactor = THREE.MathUtils.clamp(speed / 200, 0, 0.6);
    meshRef.current.scale.set(
      baseScale * (1 - stretchFactor * 0.3), // slightly narrower
      baseScale * (1 - stretchFactor * 0.3),
      baseScale * (1 + stretchFactor),        // elongated along Z
    );
  });

  // Start position
  const startPos = useMemo(() => curve.getPoint(0), [curve]);

  return (
    <group>
      {/* Ball */}
      <mesh ref={meshRef} position={isAnimating ? undefined : startPos} scale={0.6}>
        <sphereGeometry args={[0.121, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color="#ffffff"
          roughness={0.4}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={0.03}
        />
      </mesh>
    </group>
  );
}
