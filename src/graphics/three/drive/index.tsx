import * as THREE from "three";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import { useState, useRef, useEffect } from "react";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    if (!canvasRef) return;
  });
  return (
    <Canvas
      camera={{
        position: [5, 15, 10],
      }}
    >
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <Car position={[0, 0, 0]} />
    </Canvas>
  );
}

type CarProps = ThreeElements["mesh"];

export function Car(props: CarProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const length = 6,
    width = 4;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, width);
  shape.lineTo(length, width);
  shape.lineTo(length, 0);
  shape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 2,
    depth: 16,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 1,
  };

  useFrame((state, delta) => {
    // meshRef.current.rotation.x += delta;
    // meshRef.current.rotation.y += delta;
  });
  return (
    <mesh
      ref={meshRef}
      onClick={(event) => setActive(!active)}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}
      {...props}
    >
      <boxGeometry args={[5, 5, 5]} />
      <circleGeometry args={[5]} />
      <extrudeGeometry args={[shape]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}
