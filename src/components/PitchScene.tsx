import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { StrikeoutPitch } from '../data/korStrikeoutPitches';
import BatterBox from './BatterBox';
import PitchBall from './PitchBall';

function CameraController({ batSide }: { batSide: 'L' | 'R' }) {
  const { camera, invalidate } = useThree();

  const targetPos = useMemo(() => {
    const x = batSide === 'R' ? -2.5 : 2.5;
    return new THREE.Vector3(x, 5.1, 2.0);
  }, [batSide]);

  const lookAtTarget = useMemo(() => new THREE.Vector3(0, 5.0, -55), []);

  useEffect(() => {
    camera.position.copy(targetPos);
    camera.lookAt(lookAtTarget);
    invalidate();
  }, [camera, targetPos, lookAtTarget, invalidate]);

  useFrame(() => {
    camera.lookAt(lookAtTarget);
  });

  return null;
}

interface PitchSceneProps {
  pitch: StrikeoutPitch;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

export default function PitchScene({ pitch, isAnimating, onAnimationComplete }: PitchSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        frameloop={isAnimating ? 'always' : 'demand'}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        camera={{ fov: 55, near: 0.1, far: 300 }}
      >
        <CameraController batSide={pitch.batSide} />

        <BatterBox
          szTop={pitch.szTop}
          szBot={pitch.szBot}
          batSide={pitch.batSide}
        />

        <PitchBall
          pitch={pitch}
          isAnimating={isAnimating}
          onAnimationComplete={onAnimationComplete}
        />
      </Canvas>
    </div>
  );
}
