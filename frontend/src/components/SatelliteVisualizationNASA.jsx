import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// Realistic Earth component
function Earth() {
  const earthRef = useRef()
  const cloudsRef = useRef()
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0012
    }
  })
  
  return (
    <group ref={earthRef}>
      {/* Main Earth body */}
      <Sphere args={[1, 64, 32]}>
        <meshPhongMaterial 
          color="#1e40af"
          shininess={30}
          transparent
          opacity={0.95}
        />
      </Sphere>
      
      {/* Landmasses (continents) */}
      <Sphere args={[1.001, 32, 16]}>
        <meshLambertMaterial 
          color="#166534"
          transparent
          opacity={0.8}
        />
      </Sphere>
      
      {/* Cloud layer */}
      <Sphere ref={cloudsRef} args={[1.01, 32, 16]}>
        <meshLambertMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
        />
      </Sphere>
      
      {/* Atmosphere glow */}
      <Sphere args={[1.05, 16, 16]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Night side glow */}
      <Sphere args={[1.02, 32, 16]}>
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  )
}

// Simple satellite component
function Satellite({ position, color, size, onClick, name }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <mesh 
      position={position}
      onClick={() => onClick({ name, position, color })}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[hovered ? size * 2 : size, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent
        opacity={hovered ? 1 : 0.8}
      />
    </mesh>
  )
}

// Generate test satellites
function generateTestSatellites() {
  const satellites = []
  
  for (let i = 0; i < 200; i++) {
    const radius = 1.2 + Math.random() * 0.8
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)
    
    const colors = ['#00ff00', '#ff8800', '#0088ff', '#ff6600']
    const types = ['Active Satellite', 'Starlink', 'NASA CARA', 'Space Debris']
    const colorIndex = Math.floor(Math.random() * colors.length)
    
    satellites.push({
      id: i,
      position: [x, y, z],
      color: colors[colorIndex],
      size: 0.02 + Math.random() * 0.01,
      name: `${types[colorIndex]}-${i}`,
      type: types[colorIndex]
    })
  }
  
  return satellites
}

// Main component
const SatelliteVisualizationNASA = () => {
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const satellites = generateTestSatellites()
  
  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  const handleSatelliteClick = (satellite) => {
    setSelectedSatellite(satellite)
    console.log('Clicked satellite:', satellite)
  }
  
  // Filter satellites
  const filteredSatellites = satellites.filter(sat => {
    if (filterType === 'all') return true
    if (filterType === 'active') return sat.type === 'Active Satellite'
    if (filterType === 'starlink') return sat.type === 'Starlink'
    if (filterType === 'nasa') return sat.type === 'NASA CARA'
    if (filterType === 'debris') return sat.type === 'Space Debris'
    return true
  })
  
  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black">
      {/* Fullscreen Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleFullscreen}
          className="bg-gray-900 bg-opacity-95 text-white p-3 rounded-xl border border-gray-600 backdrop-blur-md shadow-2xl hover:bg-gray-800 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Filter Controls */}
      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 text-white p-2 rounded-lg border border-gray-600 backdrop-blur-md shadow-xl z-10 text-xs max-w-[140px]">
        <h3 className="text-sm font-bold mb-2 text-orange-400">Filter</h3>
        <div className="space-y-1">
          <button
            onClick={() => setFilterType('all')}
            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'all' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🟠 All (200)
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'active' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🟢 Active
          </button>
          <button
            onClick={() => setFilterType('nasa')}
            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'nasa' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔵 NASA
          </button>
          <button
            onClick={() => setFilterType('starlink')}
            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'starlink' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🟠 Starlink
          </button>
          <button
            onClick={() => setFilterType('debris')}
            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
              filterType === 'debris' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            � Debris
          </button>
        </div>
      </div>

      {/* Selected Satellite Info */}
      {selectedSatellite && (
        <div className="absolute top-4 right-20 bg-gray-900 bg-opacity-95 text-white p-3 rounded-lg border border-gray-600 backdrop-blur-md shadow-xl z-10 max-w-[200px]">
          <h4 className="font-bold text-orange-400 text-sm mb-2">{selectedSatellite.name}</h4>
          <div className="text-xs space-y-1">
            <div><span className="text-gray-400">Type:</span> {selectedSatellite.type}</div>
            <div><span className="text-gray-400">X:</span> {selectedSatellite.position[0].toFixed(2)}</div>
            <div><span className="text-gray-400">Y:</span> {selectedSatellite.position[1].toFixed(2)}</div>
            <div><span className="text-gray-400">Z:</span> {selectedSatellite.position[2].toFixed(2)}</div>
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 1, 4], fov: 75 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <color attach="background" args={['#000008']} />
        
        {/* Sun light - main directional light */}
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={2} 
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Ambient space light */}
        <ambientLight intensity={0.15} color="#1a1a2e" />
        
        {/* Rim lighting for atmosphere effect */}
        <pointLight position={[-8, 2, -8]} intensity={0.8} color="#4a90e2" />
        <pointLight position={[8, -2, 8]} intensity={0.6} color="#ff6b35" />
        
        {/* Starlight ambience */}
        <hemisphereLight 
          skyColor="#0f0f23" 
          groundColor="#000000" 
          intensity={0.1} 
        />
        
        <Earth />
        
        {filteredSatellites.map((satellite) => (
          <Satellite
            key={satellite.id}
            position={satellite.position}
            color={satellite.color}
            size={satellite.size}
            name={satellite.name}
            onClick={handleSatelliteClick}
          />
        ))}
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={1.5}
          maxDistance={8}
          autoRotate={false}
        />
      </Canvas>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 right-2 bg-gray-900 bg-opacity-90 text-white p-2 rounded-lg border border-gray-600 backdrop-blur-md shadow-xl max-w-[180px]">
        <div className="text-xs space-y-1">
          <div className="font-bold text-orange-400 mb-1 text-center text-xs">Controls</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-sm">🖱️</span>
              <span>Rotate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">🔍</span>
              <span>Zoom</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">📡</span>
              <span>Click</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">🌌</span>
              <span>200</span>
            </div>
          </div>
          <div className="text-center text-green-400 text-xs font-semibold mt-1 pt-1 border-t border-gray-600">
            ✅ ACTIVE
          </div>
        </div>
      </div>
    </div>
  )
}

export default SatelliteVisualizationNASA