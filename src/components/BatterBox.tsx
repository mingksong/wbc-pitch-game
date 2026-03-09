import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface BatterBoxProps {
  szTop: number;
  szBot: number;
  batSide: 'L' | 'R';
}

/** Home plate pentagon shape (official dimensions in feet) */
function HomePlate() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // 17 inches = 1.417 ft wide, pentagon shape
    const hw = 0.708; // half-width
    s.moveTo(-hw, 0);
    s.lineTo(hw, 0);
    s.lineTo(hw, -0.5);
    s.lineTo(0, -0.85);
    s.lineTo(-hw, -0.5);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} />
    </mesh>
  );
}

/** Pitcher's mound - simple raised circle */
function PitcherMound() {
  return (
    <group position={[0, 0, -60.5]}>
      {/* Mound dirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      {/* Rubber */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.35, 0]}>
        <planeGeometry args={[0.5, 0.17]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Strike zone wireframe box */
function StrikeZone({ szTop, szBot }: { szTop: number; szBot: number }) {
  const height = szTop - szBot;
  const centerY = (szTop + szBot) / 2;
  const width = 17 / 12; // 17 inches in feet

  return (
    <lineSegments position={[0, centerY, 0]}>
      <edgesGeometry args={[new THREE.BoxGeometry(width, height, 0.01)]} />
      <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </lineSegments>
  );
}

/** Single batter's box using primitive + THREE.Line to avoid JSX type conflicts */
function BatterBoxLines({ xOffset, opacity }: { xOffset: number; opacity: number }) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const hw = 1.0; // half-width = 2ft total
    const hh = 3.0; // half-height = 3ft
    const pts = [
      new THREE.Vector3(xOffset - hw, 0.02, -hh),
      new THREE.Vector3(xOffset + hw, 0.02, -hh),
      new THREE.Vector3(xOffset + hw, 0.02, hh),
      new THREE.Vector3(xOffset - hw, 0.02, hh),
      new THREE.Vector3(xOffset - hw, 0.02, -hh),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, [xOffset]);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity }),
    [opacity]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />;
}

/** Both batter's boxes - active side bright, opposite dim */
function BothBatterBoxes({ batSide }: { batSide: 'L' | 'R' }) {
  const rhbX = -2.0;
  const lhbX = 2.0;
  return (
    <>
      <BatterBoxLines xOffset={rhbX} opacity={batSide === 'R' ? 0.5 : 0.15} />
      <BatterBoxLines xOffset={lhbX} opacity={batSide === 'L' ? 0.5 : 0.15} />
    </>
  );
}

/** Foul lines from home plate tip to 1B/3B direction */
function FoulLines() {
  const lines = useMemo(() => {
    const length = 95; // slightly past bases
    // Home plate back tip at (0, 0, -0.85)
    const originZ = -0.85;
    // 45-degree foul lines
    const cos45 = Math.cos(Math.PI / 4);
    const sin45 = Math.sin(Math.PI / 4);

    // 1st base line: +X, -Z direction
    const firstBase = [
      new THREE.Vector3(0, 0.015, originZ),
      new THREE.Vector3(length * cos45, 0.015, originZ - length * sin45),
    ];
    // 3rd base line: -X, -Z direction
    const thirdBase = [
      new THREE.Vector3(0, 0.015, originZ),
      new THREE.Vector3(-length * cos45, 0.015, originZ - length * sin45),
    ];

    const geo1 = new THREE.BufferGeometry().setFromPoints(firstBase);
    const geo3 = new THREE.BufferGeometry().setFromPoints(thirdBase);
    const mat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 });

    return { geo1, geo3, mat };
  }, []);

  useEffect(() => {
    return () => {
      lines.geo1.dispose();
      lines.geo3.dispose();
      lines.mat.dispose();
    };
  }, [lines]);

  return (
    <>
      <primitive object={new THREE.Line(lines.geo1, lines.mat)} />
      <primitive object={new THREE.Line(lines.geo3, lines.mat)} />
    </>
  );
}

/** Base markers at 90ft distance */
function BaseMarkers() {
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
  const dist = 90;
  const originZ = -0.85;

  // 1B position
  const firstBasePos: [number, number, number] = [
    dist * cos45,
    0.02,
    originZ - dist * sin45,
  ];
  // 3B position
  const thirdBasePos: [number, number, number] = [
    -dist * cos45,
    0.02,
    originZ - dist * sin45,
  ];
  // 2B position (center)
  const secondBasePos: [number, number, number] = [
    0,
    0.02,
    originZ - dist * Math.SQRT2,
  ];

  return (
    <>
      {[firstBasePos, secondBasePos, thirdBasePos].map((pos, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, Math.PI / 4, 0]} position={pos}>
          <planeGeometry args={[1.25, 1.25]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  );
}

/** Catcher area - semicircle dirt behind home plate */
function CatcherArea() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const radius = 6;
    s.absarc(0, 0, radius, 0, Math.PI, false);
    s.lineTo(-radius, 0);
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 1]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#9B7B3C" roughness={0.95} />
    </mesh>
  );
}

/** Infield dirt diamond shape */
function InfieldDirt() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const size = 95; // slightly larger than 90ft diamond
    // Diamond oriented: home at bottom, 2B at top
    s.moveTo(0, 0);             // home plate area
    s.lineTo(size * 0.7, -size * 0.7);  // 1B side
    s.lineTo(0, -size * 1.4);   // 2B area
    s.lineTo(-size * 0.7, -size * 0.7); // 3B side
    s.closePath();
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#8B6914" roughness={1} />
    </mesh>
  );
}

/** Outfield grass extending behind the infield */
function OutfieldGrass() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -90]}>
      <planeGeometry args={[300, 200]} />
      <meshStandardMaterial color="#1a5c1a" roughness={1} />
    </mesh>
  );
}

/** Infield grass - arc inside the diamond (between bases, excluding mound path) */
function InfieldGrass() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Roughly the grass area inside the basepaths (arc shape)
    const r = 60; // radius of infield grass arc
    s.absarc(0, 0, r, -0.15, -Math.PI + 0.15, true);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, -15]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#2d7a2d" roughness={0.9} />
    </mesh>
  );
}

export default function BatterBox({ szTop, szBot, batSide }: BatterBoxProps) {
  return (
    <group>
      {/* Outfield grass (lowest layer) */}
      <OutfieldGrass />

      {/* Infield dirt diamond */}
      <InfieldDirt />

      {/* Infield grass inside the diamond */}
      <InfieldGrass />

      {/* Catcher area behind plate */}
      <CatcherArea />

      {/* Home plate */}
      <HomePlate />

      {/* Pitcher's mound */}
      <PitcherMound />

      {/* Foul lines */}
      <FoulLines />

      {/* Base markers */}
      <BaseMarkers />

      {/* Strike zone */}
      <StrikeZone szTop={szTop} szBot={szBot} />

      {/* Both batter's boxes */}
      <BothBatterBoxes batSide={batSide} />

      {/* Ambient light - night game feel */}
      <ambientLight intensity={0.3} color="#b0c4de" />

      {/* Main stadium lights */}
      <spotLight
        position={[0, 80, -30]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#fffaf0"
        castShadow={false}
      />
      <spotLight
        position={[-40, 60, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={0.8}
        color="#fffaf0"
      />
      <spotLight
        position={[40, 60, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={0.8}
        color="#fffaf0"
      />

      {/* Sky dome - dark gradient */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#0a0e1a" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
