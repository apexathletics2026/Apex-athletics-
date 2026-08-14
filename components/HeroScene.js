"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, Sparkles, Environment } from "@react-three/drei";
import { useRef } from "react";

function Medal() {
  const group = useRef();
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={group}>
        {/* Outer ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[1.35, 0.16, 32, 100]} />
          <meshStandardMaterial color="#FF5A1F" metalness={0.85} roughness={0.25} emissive="#FF5A1F" emissiveIntensity={0.35} />
        </mesh>

        {/* Center disc */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.18, 64]} />
          <meshStandardMaterial color="#15130F" metalness={0.6} roughness={0.35} />
        </mesh>

        {/* Inner glowing ring accent */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.78, 0.035, 16, 100]} />
          <meshStandardMaterial color="#C7FF3D" emissive="#C7FF3D" emissiveIntensity={1.1} toneMapped={false} />
        </mesh>

        {/* Number */}
        <Text
          position={[0, 0, 0.11]}
          fontSize={0.62}
          color="#FF5A1F"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
        >
          01
        </Text>
      </group>
    </Float>
  );
}

function RibbonParticles() {
  return (
    <Sparkles
      count={60}
      scale={[6, 4, 3]}
      size={3}
      speed={0.35}
      color="#C7FF3D"
      opacity={0.8}
      position={[0, -0.5, -1]}
    />
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#FFDCC2" castShadow />
        <pointLight position={[-4, -2, 2]} intensity={1.2} color="#C7FF3D" />
        <pointLight position={[4, 3, -2]} intensity={0.8} color="#FF5A1F" />

        <Medal />
        <RibbonParticles />

        <Environment preset="city" environmentIntensity={0.4} />
      </Canvas>
    </div>
  );
    }
