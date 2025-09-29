import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Text } from '@react-three/drei'
import * as THREE from 'three'

// Generate realistic satellite data with real names and details
const generateSatellites = (count = 800) => {
  const satellites = []
  
  const satelliteNames = [
    'STARLINK-1007', 'STARLINK-1019', 'STARLINK-1130', 'STARLINK-1145', 
    'ISS (ZARYA)', 'HUBBLE SPACE TELESCOPE', 'TERRA', 'AQUA', 'AURA',
    'LANDSAT 8', 'LANDSAT 9', 'SENTINEL-1A', 'SENTINEL-1B', 'SENTINEL-2A',
    'GPS BIIR-2', 'GPS BIIR-5', 'GPS BIIR-8', 'GLONASS-M', 'GALILEO-21',
    'NOAA-18', 'NOAA-19', 'METOP-B', 'METOP-C', 'GOES-16', 'GOES-17',
    'INTELSAT 901', 'INTELSAT 902', 'EUTELSAT 7C', 'SES-14', 'SES-15',
    'COSMOS-2542', 'COSMOS-2543', 'FENGYUN-3D', 'SPOT-7', 'PLEIADES-1A'
  ]
  
  for (let i = 0; i < count; i++) {
    // Different orbital altitudes with realistic distributions
    let altitude, orbitType, color, size
    const rand = Math.random()
    
    if (rand < 0.4) { // LEO satellites (most visible)
      altitude = 300 + Math.random() * 500
      orbitType = 'LEO'
      color = '#00ff88' // Bright green for LEO
      size = 0.015 // Larger size for visibility
    } else if (rand < 0.7) { // MEO satellites
      altitude = 2000 + Math.random() * 18000
      orbitType = 'MEO'  
      color = '#ffaa00' // Orange for MEO
      size = 0.012
    } else if (rand < 0.85) { // GEO satellites
      altitude = 35786
      orbitType = 'GEO'
      color = '#ff4444' // Red for GEO
      size = 0.018 // Larger for visibility
    } else { // Space debris
      altitude = 200 + Math.random() * 800
      orbitType = 'DEBRIS'
      color = '#ff0080' // Pink for debris
      size = 0.008
    }
    
    const radius = 1.2 + (altitude / 12000) // Better scaling for visibility
    const inclination = (Math.random() - 0.5) * Math.PI * 0.9
    const longitude = Math.random() * Math.PI * 2
    const speed = Math.sqrt(1 / (radius * radius * radius)) * 0.5
    
    const baseName = satelliteNames[Math.floor(Math.random() * satelliteNames.length)]
    const name = orbitType === 'DEBRIS' ? `DEBRIS-${Math.floor(Math.random() * 10000)}` : baseName
    
    satellites.push({
      id: i,
      name,
      noradId: 25544 + i,
      radius,
      inclination,
      longitude,
      speed: speed * (0.8 + Math.random() * 0.4),
      altitude: Math.round(altitude),
      orbitType,
      color,
      size,
      velocity: Math.round(7.8 - (altitude / 10000) * 3 + Math.random() * 0.5),
      period: Math.round(90 + (altitude / 100) * 0.5),
      apogee: Math.round(altitude + Math.random() * 100),
      perigee: Math.round(altitude - Math.random() * 50),
      inclination_deg: Math.round((inclination * 180 / Math.PI) + 90)
    })
  }
  
  return satellites
}

// Ultra-realistic Earth component with detailed procedural textures
function Earth() {
  const earthRef = useRef()
  const cloudsRef = useRef()
  const atmosphereRef = useRef()
  
  // Create an extremely detailed Earth texture with realistic continents
  const createRealisticEarthTexture = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 2048
    canvas.height = 1024
    
    // Create deep ocean base with depth variations
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 1024)
    oceanGradient.addColorStop(0, '#0f4c75') // Arctic waters
    oceanGradient.addColorStop(0.5, '#1a365d') // Deep ocean
    oceanGradient.addColorStop(1, '#0f4c75') // Antarctic waters
    ctx.fillStyle = oceanGradient
    ctx.fillRect(0, 0, 2048, 1024)
    
    // Add realistic continent shapes with proper colors
    
    // NORTH AMERICA - realistic shape and colors
    ctx.fillStyle = '#2d5016' // Dark forest green
    ctx.beginPath()
    ctx.ellipse(300, 250, 150, 120, 0, 0, 2 * Math.PI)
    ctx.fill()
    
    // Add Canadian forests (darker green)
    ctx.fillStyle = '#1a3409'
    ctx.fillRect(250, 180, 200, 80)
    
    // US Great Plains (lighter brown-green)
    ctx.fillStyle = '#4a5d23'
    ctx.fillRect(280, 260, 140, 60)
    
    // Mexican deserts
    ctx.fillStyle = '#8b7355'
    ctx.fillRect(250, 320, 100, 40)
    
    // SOUTH AMERICA
    ctx.fillStyle = '#2d5016' // Amazon green
    ctx.beginPath()
    ctx.ellipse(380, 450, 80, 160, 0, 0, 2 * Math.PI)
    ctx.fill()
    
    // Amazon rainforest (very dark green)
    ctx.fillStyle = '#0d2818'
    ctx.fillRect(340, 380, 80, 80)
    
    // Andes Mountains (brown)
    ctx.fillStyle = '#3c2415'
    ctx.fillRect(330, 380, 20, 140)
    
    // EUROPE
    ctx.fillStyle = '#4a5d23' // Temperate green
    ctx.fillRect(900, 220, 120, 80)
    
    // Scandinavian forests
    ctx.fillStyle = '#1a3409'
    ctx.fillRect(920, 180, 80, 60)
    
    // AFRICA
    ctx.fillStyle = '#2d5016' // Central African forests
    ctx.beginPath()
    ctx.ellipse(980, 400, 90, 140, 0, 0, 2 * Math.PI)
    ctx.fill()
    
    // Sahara Desert
    ctx.fillStyle = '#c19a6b'
    ctx.fillRect(900, 300, 160, 60)
    
    // Kalahari Desert
    ctx.fillStyle = '#d4a574'
    ctx.fillRect(940, 500, 80, 40)
    
    // ASIA
    ctx.fillStyle = '#2d5016' // Siberian forests
    ctx.fillRect(1100, 160, 400, 120)
    
    // Chinese plains
    ctx.fillStyle = '#4a5d23'
    ctx.fillRect(1200, 280, 200, 80)
    
    // Indian subcontinent
    ctx.fillStyle = '#5d4a23'
    ctx.fillRect(1150, 350, 100, 80)
    
    // Gobi Desert
    ctx.fillStyle = '#a67c5a'
    ctx.fillRect(1250, 250, 120, 60)
    
    // Himalayan mountains
    ctx.fillStyle = '#f0f8ff' // Snow-capped
    ctx.fillRect(1180, 320, 100, 20)
    
    // AUSTRALIA
    ctx.fillStyle = '#8b7355' // Outback brown
    ctx.beginPath()
    ctx.ellipse(1400, 550, 100, 60, 0, 0, 2 * Math.PI)
    ctx.fill()
    
    // Australian forests (green coastal areas)
    ctx.fillStyle = '#4a5d23'
    ctx.fillRect(1350, 530, 30, 40)
    ctx.fillRect(1450, 530, 30, 40)
    
    // ANTARCTICA (ice)
    ctx.fillStyle = '#f0f8ff'
    ctx.fillRect(0, 950, 2048, 74)
    
    // ARCTIC (ice)
    ctx.fillStyle = '#f0f8ff'
    ctx.fillRect(0, 0, 2048, 50)
    
    // Add realistic cloud patterns
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 2048
      const y = Math.random() * 1024
      const size = 20 + Math.random() * 60
      ctx.beginPath()
      ctx.ellipse(x, y, size, size * 0.6, 0, 0, 2 * Math.PI)
      ctx.fill()
    }
    
    return new THREE.CanvasTexture(canvas)
  }
  
  // Create cloud texture
  const createCloudTexture = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 1024
    canvas.height = 512
    
    // Transparent base
    ctx.clearRect(0, 0, 1024, 512)
    
    // Add realistic cloud formations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 512
      const size = 10 + Math.random() * 40
      ctx.beginPath()
      ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, 2 * Math.PI)
      ctx.fill()
    }
    
    return new THREE.CanvasTexture(canvas)
  }
  
  const earthTexture = useMemo(() => createRealisticEarthTexture(), [])
  const cloudTexture = useMemo(() => createCloudTexture(), [])
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001 // 24-hour rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0012 // Independent cloud movement
    }
  })
  
  return (
    <group>
      {/* Main Earth sphere with high-detail texture */}
      <Sphere ref={earthRef} args={[1, 128, 64]} castShadow receiveShadow>
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={earthTexture}
          bumpScale={0.05}
          shininess={80}
          specular={new THREE.Color('#87ceeb')}
          emissive={new THREE.Color('#000000')}
        />
      </Sphere>
      
      {/* Realistic cloud layer */}
      <Sphere ref={cloudsRef} args={[1.005, 128, 64]} castShadow receiveShadow>
        <meshLambertMaterial
          map={cloudTexture}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Sphere>
      
      {/* Multi-layered atmosphere */}
      <Sphere args={[1.02, 64, 32]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <Sphere args={[1.04, 32, 16]}>
        <meshBasicMaterial
          color="#4682b4"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <Sphere args={[1.06, 16, 8]}>
        <meshBasicMaterial
          color="#1e40af"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  )
}

// Individual satellite component with enhanced visibility and hover tooltips
function Satellite({ satellite, time, onClick, isSelected, onHover, onHoverEnd }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  useFrame(() => {
    if (meshRef.current) {
      const angle = time * satellite.speed + satellite.longitude
      const x = Math.cos(angle) * satellite.radius * Math.cos(satellite.inclination)
      const y = Math.sin(satellite.inclination) * satellite.radius * 0.7
      const z = Math.sin(angle) * satellite.radius * Math.cos(satellite.inclination)
      
      meshRef.current.position.set(x, y, z)
    }
  })
  
  const currentSize = isSelected ? satellite.size * 2.5 : hovered ? satellite.size * 2 : satellite.size
  const opacity = isSelected ? 1 : hovered ? 0.9 : 0.8
  
  return (
    <group>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick(satellite)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover && onHover(satellite, { x: e.clientX, y: e.clientY })
        }}
        onPointerOut={(e) => {
          setHovered(false)
          onHoverEnd && onHoverEnd()
        }}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[currentSize, 8, 8]} />
        <meshPhongMaterial 
          color={satellite.color} 
          transparent
          opacity={opacity}
          emissive={satellite.color}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.2 : 0.1}
          shininess={60}
        />
      </mesh>
      
      {/* Orbital trail for selected satellite */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[satellite.radius - 0.02, satellite.radius + 0.02, 64]} />
          <meshBasicMaterial 
            color={satellite.color} 
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Enhanced glow effect for selected satellite */}
      {isSelected && (
        <pointLight 
          color={satellite.color} 
          intensity={0.6} 
          distance={0.4}
          position={meshRef.current?.position || [0, 0, 0]}
          decay={2}
        />
      )}
    </group>
  )
}

// Main satellite field component
function SatelliteField({ onSatelliteClick, selectedSatellite }) {
  const satellites = useMemo(() => generateSatellites(600), [])
  const [time, setTime] = useState(0)
  
  useFrame((state) => {
    setTime(state.clock.elapsedTime * 0.3)
  })
  
  return (
    <>
      {satellites.map((satellite) => (
        <Satellite 
          key={satellite.id} 
          satellite={satellite} 
          time={time}
          onClick={onSatelliteClick}
          isSelected={selectedSatellite?.id === satellite.id}
        />
      ))}
    </>
  )
}

// Enhanced info panel
function InfoPanel({ selectedSatellite }) {
  return (
    <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-95 text-white p-6 rounded-xl border border-gray-600 max-w-sm backdrop-blur-md shadow-2xl">
      <h3 className="text-xl font-bold mb-4 text-blue-400 border-b border-gray-600 pb-2">
        Satellite Tracker 3D
      </h3>
      
      {selectedSatellite ? (
        <div className="space-y-3">
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="font-bold text-white text-lg mb-1">{selectedSatellite.name}</h4>
            <p className="text-gray-300 text-sm">NORAD ID: #{selectedSatellite.noradId}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400 block">Speed:</span>
              <p className="text-green-400 font-mono font-bold">{selectedSatellite.velocity} km/s</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400 block">Height:</span>
              <p className="text-blue-400 font-mono font-bold">{selectedSatellite.altitude} km</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400 block">Period:</span>
              <p className="text-yellow-400 font-mono font-bold">{selectedSatellite.period} min</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400 block">Inclination:</span>
              <p className="text-purple-400 font-mono font-bold">{selectedSatellite.inclination_deg}°</p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-gray-400 block mb-1">Orbit Type:</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedSatellite.color }}
              ></div>
              <p className="text-white font-bold text-lg">{selectedSatellite.orbitType}</p>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-600">
            <p>Apogee: {selectedSatellite.apogee} km • Perigee: {selectedSatellite.perigee} km</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-gray-800 rounded">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">LEO Satellites</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-800 rounded">
              <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-400 font-semibold">MEO Satellites</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-800 rounded">
              <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-red-400 font-semibold">GEO Satellites</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-800 rounded">
              <div className="w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
              <span className="text-pink-400 font-semibold">Space Debris</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-600 text-center">
            <p className="text-yellow-400 text-sm font-semibold animate-pulse">
              🛰️ Click any satellite for details
            </p>
            <p className="text-gray-400 text-xs mt-2">
              600+ objects tracked in real-time
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced stars background
function Stars() {
  const starsRef = useRef()
  
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(2000 * 3)
    
    for (let i = 0; i < 2000; i++) {
      const radius = 50 + Math.random() * 150
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      starPositions[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    return geometry
  }, [])
  
  return (
    <points ref={starsRef} geometry={starsGeometry}>
      <pointsMaterial color="white" size={1.5} sizeAttenuation={false} />
    </points>
  )
}

// Search bar component
function SearchBar({ onSearch, satelliteCount }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  return (
    <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-95 p-4 rounded-xl border border-gray-600 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search satellite name or NORAD ID"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            onSearch(e.target.value)
          }}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 text-sm w-64 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
            🔍 Search
          </button>
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
            🌍 Center
          </button>
          <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
            ⟲ Reset
          </button>
        </div>
      </div>
    </div>
  )
}

// Main component
const SatelliteVisualization = () => {
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredSatellite, setHoveredSatellite] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  const handleSatelliteClick = (satellite) => {
    setSelectedSatellite(satellite)
  }
  
  const handleCanvasClick = () => {
    setSelectedSatellite(null)
  }
  
  const handleSatelliteHover = (satellite, position) => {
    setHoveredSatellite(satellite)
    setTooltipPosition(position)
  }
  
  const handleSatelliteHoverEnd = () => {
    setHoveredSatellite(null)
  }
  
  const handleSearch = (term) => {
    setSearchTerm(term)
  }
  
  return (
    <div className="relative w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 1, 4], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        onClick={handleCanvasClick}
        shadows // Enable shadow mapping
      >
        {/* Ultra-bright lighting system to show Earth textures clearly */}
        <ambientLight intensity={0.3} color="#ffffff" /> {/* Increased ambient light */}
        
        {/* Primary sun - very bright to illuminate textures */}
        <directionalLight
          position={[15, 8, 10]}
          intensity={3.5}
          color="#ffffff" // Pure white for clear texture visibility
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.00005}
          shadow-normalBias={0.02}
        />
        
        {/* Secondary light for texture detail */}
        <directionalLight
          position={[10, 0, 10]}
          intensity={2.0}
          color="#fff8e1"
        />
        
        {/* Fill light to prevent dark areas */}
        <directionalLight
          position={[-8, -4, -6]}
          intensity={1.0}
          color="#e6f3ff"
        />
        
        {/* Additional lighting for better texture visibility */}
        <pointLight 
          position={[5, 5, 5]} 
          intensity={2.0} 
          color="#ffffff"
          distance={30}
          decay={0.5}
        />
        
        <pointLight 
          position={[-5, -5, -5]} 
          intensity={1.5} 
          color="#ffffff"
          distance={30}
          decay={0.5}
        />
        
        <Stars />
        <Earth />
        <SatelliteField 
          onSatelliteClick={handleSatelliteClick}
          onSatelliteHover={handleSatelliteHover}
          onSatelliteHoverEnd={handleSatelliteHoverEnd}
          selectedSatellite={selectedSatellite}
        />
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={25}
          autoRotate={false}
          rotateSpeed={0.7}
          zoomSpeed={1}
        />
      </Canvas>
      
      <InfoPanel selectedSatellite={selectedSatellite} />
      <SearchBar onSearch={handleSearch} satelliteCount={600} />
      
      {/* Hover Tooltip */}
      {hoveredSatellite && (
        <div 
          className="absolute pointer-events-none bg-black bg-opacity-90 text-white px-3 py-2 rounded-lg border border-gray-500 backdrop-blur-md shadow-xl z-50"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          <div className="text-sm font-bold text-blue-400">{hoveredSatellite.name}</div>
          <div className="text-xs text-gray-300">
            {hoveredSatellite.orbitType} • {hoveredSatellite.altitude} km
          </div>
        </div>
      )}
      
      {/* Enhanced controls overlay */}
      <div className="absolute bottom-4 right-4 bg-gray-900 bg-opacity-95 text-white p-4 rounded-xl border border-gray-600 backdrop-blur-md shadow-2xl">
        <div className="text-sm space-y-2">
          <div className="font-bold text-blue-400 mb-3 text-center">Mission Control</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🖱️</span>
              <span>Drag to rotate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span>Scroll to zoom</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📡</span>
              <span>Click satellites</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌌</span>
              <span>600+ objects</span>
            </div>
          </div>
          <div className="text-center text-green-400 text-xs font-semibold mt-3 pt-2 border-t border-gray-600">
            ✅ TRACKING ACTIVE
          </div>
        </div>
      </div>
    </div>
  )
}

export default SatelliteVisualization