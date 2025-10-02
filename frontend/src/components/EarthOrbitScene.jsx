import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

const Earth = () => {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.25
    meshRef.current.rotation.x = 0.18
  })

  return (
    <mesh ref={meshRef} scale={1.2} castShadow receiveShadow>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#2563eb"
        emissive="#1d4ed8"
        emissiveIntensity={0.18}
        roughness={0.35}
        metalness={0.1}
      />
    </mesh>
  )
}

const Atmosphere = () => (
  <mesh scale={1.28}>
    <sphereGeometry args={[1, 48, 48]} />
    <meshPhongMaterial color="#93c5fd" opacity={0.18} transparent />
  </mesh>
)

const OrbitRing = () => (
  <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}>
    <torusGeometry args={[1.92, 0.018, 32, 220]} />
    <meshBasicMaterial color="#5eead4" transparent opacity={0.7} />
  </mesh>
)

const OrbitingSatellite = () => {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={groupRef} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
      <mesh position={[1.92, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[1.92, 0, 0]} scale={[0.32, 0.12, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
    </group>
  )
}

const EarthOrbitScene = () => {
  return (
    <div className="relative w-full max-w-sm aspect-square rounded-[2.5rem] bg-gradient-to-br from-blue-950 via-slate-900 to-black border border-white/10 shadow-[0_30px_80px_-40px_rgba(56,189,248,0.7)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#38bdf8_0%,transparent_55%)] opacity-40 pointer-events-none" />
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 3, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <Earth />
        <Atmosphere />
        <OrbitRing />
        <OrbitingSatellite />
      </Canvas>
      <div className="absolute bottom-6 left-6 text-xs uppercase tracking-[0.4em] text-cyan-200/70">
        Orbital Lock
      </div>
    </div>
  )
}

export default EarthOrbitScene
