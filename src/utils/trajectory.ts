import * as THREE from 'three';
import type { StrikeoutPitch } from '../data/korStrikeoutPitches';

const NUM_POINTS = 50;

/**
 * Convert Statcast trajectory data to Three.js curve points.
 *
 * Statcast coordinates (y=50ft release point):
 *   X = left/right (catcher's view: positive = right)
 *   Y = pitcher→home direction (50ft → 0ft)
 *   Z = vertical (up)
 *
 * Three.js mapping:
 *   X = Statcast X (left/right)
 *   Y = Statcast Z (vertical → up)
 *   Z = -Statcast Y (pitcher→home = -Z direction)
 */
export function buildTrajectoryPoints(pitch: StrikeoutPitch): THREE.Vector3[] {
  const { vX0, vY0, vZ0, aX, aY, aZ, x0, y0, z0, plateTime } = pitch;
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = (i / NUM_POINTS) * plateTime;

    // Statcast kinematic equations
    const sx = x0 + vX0 * t + 0.5 * aX * t * t;
    const sy = y0 + vY0 * t + 0.5 * aY * t * t;
    const sz = z0 + vZ0 * t + 0.5 * aZ * t * t;

    // Map to Three.js: X→X, Z→Y(up), -Y→Z
    points.push(new THREE.Vector3(sx, sz, -sy));
  }

  return points;
}

export function buildTrajectoryCurve(pitch: StrikeoutPitch): THREE.CatmullRomCurve3 {
  const points = buildTrajectoryPoints(pitch);
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

/** Get the plate-crossing position in Three.js coords */
export function getPlatePosition(pitch: StrikeoutPitch): THREE.Vector3 {
  // pX is horizontal, pZ is vertical, plate is at y≈1.4ft (17in from ground) in Statcast Y≈0
  return new THREE.Vector3(pitch.pX, pitch.pZ, 0);
}

/** Distance from mound to plate in Three.js Z units */
export const MOUND_DISTANCE = 60.5; // feet
export const PLATE_Z = 0;
export const MOUND_Z = -MOUND_DISTANCE;

/** Scale factor: 1 unit = 1 foot */
export const SCALE = 1;
