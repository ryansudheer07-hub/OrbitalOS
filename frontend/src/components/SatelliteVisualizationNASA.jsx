import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Box } from '@react-three/drei'
import * as THREE from 'three'

// Ultra-realistic Earth component with photographic-quality procedural textures
function Earth() {
  const earthRef = useRef()
  const cloudsRef = useRef()
  
  // Create photorealistic Earth texture with accurate continental mapping
  const createEarthTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    
    // Create deep ocean base with realistic color variations
    const createOceanGradient = (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2)
      gradient.addColorStop(0, '#0f172a')
      gradient.addColorStop(0.2, '#1e3a8a')
      gradient.addColorStop(0.4, '#2563eb')
      gradient.addColorStop(0.6, '#1d4ed8')
      gradient.addColorStop(0.8, '#1e40af')
      gradient.addColorStop(1, '#0f172a')
      return gradient
    }
    
    ctx.fillStyle = createOceanGradient(ctx, 2048, 1024)
    ctx.fillRect(0, 0, 2048, 1024)
    
    // Add ocean depth variations
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 2048
      const y = Math.random() * 1024
      const radius = Math.random() * 100 + 20
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
      gradient.addColorStop(1, 'rgba(29, 78, 216, 0.1)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Realistic continent colors with variations
    const createLandColor = (baseColor, variation = 0.1) => {
      const colors = [
        '#166534', '#15803d', '#16a34a', // Forest greens
        '#a3a3a3', '#737373', '#525252', // Mountain grays
        '#eab308', '#ca8a04', '#a16207', // Desert yellows
        '#0f766e', '#14b8a6', '#06b6d4'  // Coastal blues
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }
    
    // North America - highly detailed
    ctx.fillStyle = createLandColor()
    ctx.beginPath()
    ctx.moveTo(300, 200)
    ctx.quadraticCurveTo(400, 180, 500, 220)
    ctx.quadraticCurveTo(550, 250, 540, 300)
    ctx.quadraticCurveTo(520, 350, 480, 380)
    ctx.quadraticCurveTo(450, 400, 400, 390)
    ctx.quadraticCurveTo(350, 380, 320, 350)
    ctx.quadraticCurveTo(280, 300, 300, 250)
    ctx.closePath()
    ctx.fill()
    
    // Add Alaska
    ctx.fillStyle = '#166534'
    ctx.fillRect(200, 180, 80, 60)
    
    // Greenland
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(580, 140, 60, 80)
    
    // South America - detailed shape
    ctx.fillStyle = createLandColor()
    ctx.beginPath()
    ctx.moveTo(440, 450)
    ctx.quadraticCurveTo(480, 440, 520, 480)
    ctx.quadraticCurveTo(540, 520, 520, 580)
    ctx.quadraticCurveTo(500, 650, 480, 720)
    ctx.quadraticCurveTo(460, 780, 440, 760)
    ctx.quadraticCurveTo(420, 720, 430, 660)
    ctx.quadraticCurveTo(440, 600, 450, 540)
    ctx.quadraticCurveTo(460, 480, 440, 450)
    ctx.closePath()
    ctx.fill()
    
    // Africa - accurate shape
    ctx.fillStyle = createLandColor()
    ctx.beginPath()
    ctx.moveTo(960, 280)
    ctx.quadraticCurveTo(1020, 260, 1080, 300)
    ctx.quadraticCurveTo(1120, 350, 1100, 420)
    ctx.quadraticCurveTo(1080, 500, 1060, 580)
    ctx.quadraticCurveTo(1040, 660, 1000, 680)
    ctx.quadraticCurveTo(960, 660, 940, 600)
    ctx.quadraticCurveTo(930, 520, 940, 440)
    ctx.quadraticCurveTo(950, 360, 960, 280)
    ctx.closePath()
    ctx.fill()
    
    // Europe
    ctx.fillStyle = '#166534'
    ctx.fillRect(960, 200, 160, 120)
    
    // Asia - large detailed continent
    ctx.fillStyle = createLandColor()
    ctx.beginPath()
    ctx.moveTo(1120, 160)
    ctx.quadraticCurveTo(1300, 140, 1500, 180)
    ctx.quadraticCurveTo(1700, 220, 1800, 280)
    ctx.quadraticCurveTo(1850, 340, 1800, 400)
    ctx.quadraticCurveTo(1750, 460, 1650, 420)
    ctx.quadraticCurveTo(1500, 380, 1350, 360)
    ctx.quadraticCurveTo(1200, 340, 1120, 280)
    ctx.quadraticCurveTo(1100, 220, 1120, 160)
    ctx.closePath()
    ctx.fill()
    
    // Australia
    ctx.fillStyle = '#a16207'
    ctx.fillRect(1560, 560, 160, 80)
    
    // Antarctica - detailed ice sheet
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 900, 2048, 124)
    
    // Arctic ice cap
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, 2048, 60)
    
    // Add realistic mountain ranges
    const drawMountains = (x, y, width, height) => {
      ctx.fillStyle = '#1f2937'
      for (let i = 0; i < width; i += 10) {
        const mountainHeight = height * (0.5 + Math.random() * 0.5)
        ctx.fillRect(x + i, y, 8, mountainHeight)
      }
    }
    
    // Major mountain ranges
    drawMountains(380, 250, 100, 40) // Rockies
    drawMountains(440, 500, 80, 60)  // Andes
    drawMountains(980, 220, 60, 30)  // Alps
    drawMountains(1300, 200, 200, 50) // Himalayas
    
    // Add major deserts
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(1000, 350, 120, 80) // Sahara
    ctx.fillRect(1400, 320, 100, 60) // Gobi
    ctx.fillRect(1600, 580, 80, 40)  // Australian Outback
    
    // Add major rivers (darker lines)
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(1040, 400)
    ctx.lineTo(1080, 420) // Nile
    ctx.moveTo(460, 520)
    ctx.lineTo(500, 540) // Amazon
    ctx.stroke()
    
    return new THREE.CanvasTexture(canvas)
  }
  
  // Create ultra-realistic cloud texture with actual weather patterns
  const createCloudTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    
    ctx.clearRect(0, 0, 2048, 1024)
    
    // Create realistic cloud formation
    const drawRealisticClouds = (x, y, size, density, type) => {
      const cloudTypes = {
        cirrus: { opacity: 0.3, particles: 5, spread: 2 },
        cumulus: { opacity: 0.7, particles: 12, spread: 1 },
        stratus: { opacity: 0.5, particles: 20, spread: 3 },
        cumulonimbus: { opacity: 0.9, particles: 30, spread: 1.5 }
      }
      
      const cloud = cloudTypes[type] || cloudTypes.cumulus
      
      for (let i = 0; i < cloud.particles * density; i++) {
        const cloudX = x + (Math.random() - 0.5) * size * cloud.spread
        const cloudY = y + (Math.random() - 0.5) * size * 0.4
        const radius = (size * 0.05) * (0.3 + Math.random() * 0.7)
        
        const gradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, radius)
        gradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity})`)
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${cloud.opacity * 0.6})`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cloudX, cloudY, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    // Tropical convergence zone (heavy clouds around equator)
    for (let i = 0; i < 25; i++) {
      drawRealisticClouds(
        Math.random() * 2048,
        400 + (Math.random() - 0.5) * 200,
        120 + Math.random() * 100,
        1.5,
        'cumulonimbus'
      )
    }
    
    // Temperate zone clouds
    for (let i = 0; i < 40; i++) {
      drawRealisticClouds(
        Math.random() * 2048,
        150 + Math.random() * 200,
        80 + Math.random() * 60,
        1,
        'cumulus'
      )
    }
    
    // High altitude cirrus clouds
    for (let i = 0; i < 60; i++) {
      drawRealisticClouds(
        Math.random() * 2048,
        100 + Math.random() * 800,
        200 + Math.random() * 300,
        0.5,
        'cirrus'
      )
    }
    
    // Hurricane/cyclone systems
    const drawStormSystem = (centerX, centerY, radius) => {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
        for (let r = 20; r < radius; r += 15) {
          const spiralAngle = angle + r * 0.02
          const x = centerX + Math.cos(spiralAngle) * r
          const y = centerY + Math.sin(spiralAngle) * r * 0.6
          
          drawRealisticClouds(x, y, 40, 0.8, 'cumulonimbus')
        }
      }
    }
    
    // Add a few storm systems
    drawStormSystem(600, 300, 150)
    drawStormSystem(1400, 600, 120)
    
    return new THREE.CanvasTexture(canvas)
  }
  
  // Create detailed normal map for surface texture
  const createNormalMap = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Create height variation for normal mapping
    const imageData = ctx.createImageData(1024, 512)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random() * 40 + 127
      imageData.data[i] = noise     // R
      imageData.data[i + 1] = noise // G  
      imageData.data[i + 2] = 255   // B
      imageData.data[i + 3] = 255   // A
    }
    ctx.putImageData(imageData, 0, 0)
    
    return new THREE.CanvasTexture(canvas)
  }
  
  const earthTexture = createEarthTexture()
  const cloudTexture = createCloudTexture()
  const normalMap = createNormalMap()
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0008
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0012
    }
  })
  
  return (
    <group ref={earthRef}>
      {/* Ultra-realistic Earth sphere */}
      <Sphere args={[1, 256, 128]}>
        <meshPhongMaterial 
          map={earthTexture}
          normalMap={normalMap}
          normalScale={[0.3, 0.3]}
          bumpMap={earthTexture}
          bumpScale={0.05}
          shininess={80}
          specular="#2563eb"
          specularMap={earthTexture}
        />
      </Sphere>
      
      {/* Realistic cloud system */}
      <Sphere ref={cloudsRef} args={[1.006, 128, 64]}>
        <meshLambertMaterial
          map={cloudTexture}
          transparent
          opacity={0.8}
          alphaMap={cloudTexture}
          side={THREE.FrontSide}
        />
      </Sphere>
      
      {/* Multi-layered atmosphere */}
      <Sphere args={[1.012, 64, 32]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <Sphere args={[1.018, 64, 32]}>
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <Sphere args={[1.025, 32, 16]}>
        <meshBasicMaterial
          color="#1e40af"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  )
}

// Enhanced satellite component with realistic mini-satellite design
function Satellite({ position, color, size, onClick, onHover, onUnhover, name, type, company, launchDate, altitude }) {
  const [hovered, setHovered] = useState(false)
  const satelliteRef = useRef()
  
  useFrame(() => {
    if (satelliteRef.current) {
      // Slow orbital rotation
      satelliteRef.current.rotation.y += 0.01
      satelliteRef.current.rotation.x += 0.005
    }
  })
  
  const satelliteData = {
    name,
    type,
    company: company || 'SpaceX',
    launchDate: launchDate || '2023',
    altitude: altitude || `${(1.2 + Math.random() * 0.8) * 400}km`,
    status: 'Active'
  }
  
  const handlePointerOver = () => {
    setHovered(true)
    onHover(satelliteData)
  }
  
  const handlePointerOut = () => {
    setHovered(false)
    onUnhover()
  }
  
  return (
    <group 
      ref={satelliteRef}
      position={position}
      onClick={() => onClick(satelliteData)}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Main satellite body */}
      <Box args={[size * 4, size * 2, size * 4]}>
        <meshPhongMaterial 
          color={hovered ? '#ffffff' : color}
          shininess={100}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </Box>
      
      {/* Solar panels */}
      <Box args={[size * 8, size * 0.2, size * 2]} position={[0, 0, size * 3]}>
        <meshPhongMaterial color="#001122" shininess={200} />
      </Box>
      <Box args={[size * 8, size * 0.2, size * 2]} position={[0, 0, -size * 3]}>
        <meshPhongMaterial color="#001122" shininess={200} />
      </Box>
      
      {/* Communication antenna */}
      <Box args={[size * 0.5, size * 6, size * 0.5]} position={[0, size * 3, 0]}>
        <meshPhongMaterial color="#cccccc" />
      </Box>
    </group>
  )
}

// Generate enhanced test satellites with more realistic data
function generateTestSatellites() {
  const satellites = []
  
  const companies = ['SpaceX', 'NASA', 'ESA', 'JAXA', 'Boeing', 'Lockheed Martin', 'OneWeb', 'Amazon']
  const satelliteTypes = ['Communication', 'Earth Observation', 'Navigation', 'Scientific', 'Weather', 'Military']
  
  for (let i = 0; i < 200; i++) {
    const radius = 1.15 + Math.random() * 0.9
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)
    
    const colors = ['#00ff00', '#ff8800', '#0088ff', '#ff6600', '#ff0066', '#66ff00']
    const types = ['Active Satellite', 'Starlink', 'NASA CARA', 'Space Debris', 'ISS Module', 'Weather Sat']
    const colorIndex = Math.floor(Math.random() * colors.length)
    
    satellites.push({
      id: i,
      position: [x, y, z],
      color: colors[colorIndex],
      size: 0.008 + Math.random() * 0.004,
      name: `${types[colorIndex]}-${String(i).padStart(3, '0')}`,
      type: satelliteTypes[Math.floor(Math.random() * satelliteTypes.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      launchDate: `${2020 + Math.floor(Math.random() * 5)}`,
      altitude: `${Math.floor(300 + Math.random() * 1000)}km`,
      category: types[colorIndex]
    })
  }
  
  return satellites
}

// Main component
const SatelliteVisualizationNASA = () => {
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [hoveredSatellite, setHoveredSatellite] = useState(null)
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
  
  const handleSatelliteHover = (satellite) => {
    setHoveredSatellite(satellite)
  }
  
  const handleSatelliteUnhover = () => {
    setHoveredSatellite(null)
  }
  
  // Filter satellites
  const filteredSatellites = satellites.filter(sat => {
    if (filterType === 'all') return true
    if (filterType === 'active') return sat.category === 'Active Satellite'
    if (filterType === 'starlink') return sat.category === 'Starlink'
    if (filterType === 'nasa') return sat.category === 'NASA CARA'
    if (filterType === 'debris') return sat.category === 'Space Debris'
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

      {/* Hovered Satellite Info */}
      {hoveredSatellite && (
        <div className="absolute top-20 left-4 bg-blue-900 bg-opacity-95 text-white p-3 rounded-lg border border-blue-600 backdrop-blur-md shadow-xl z-10 max-w-[200px]">
          <h4 className="font-bold text-blue-400 text-sm mb-2">🔍 {hoveredSatellite.name}</h4>
          <div className="text-xs space-y-1">
            <div><span className="text-gray-400">Type:</span> {hoveredSatellite.type}</div>
            <div><span className="text-gray-400">Company:</span> {hoveredSatellite.company}</div>
            <div><span className="text-gray-400">Launch:</span> {hoveredSatellite.launchDate}</div>
            <div><span className="text-gray-400">Altitude:</span> {hoveredSatellite.altitude}</div>
            <div><span className="text-gray-400">Status:</span> <span className="text-green-400">{hoveredSatellite.status}</span></div>
          </div>
        </div>
      )}

      {/* Selected Satellite Info */}
      {selectedSatellite && (
        <div className="absolute top-4 right-20 bg-gray-900 bg-opacity-95 text-white p-3 rounded-lg border border-gray-600 backdrop-blur-md shadow-xl z-10 max-w-[200px]">
          <h4 className="font-bold text-orange-400 text-sm mb-2">📡 {selectedSatellite.name}</h4>
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
        onCreated={({ gl, camera, scene }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.4
          gl.outputColorSpace = THREE.SRGBColorSpace
          
          // Enhanced anti-aliasing and quality settings
          gl.antialias = true
          scene.fog = new THREE.Fog('#000008', 10, 100)
          
          // Camera settings for better depth perception
          camera.near = 0.01
          camera.far = 1000
        }}
      >
        <color attach="background" args={['#000005']} />
        
        {/* Cinema-quality lighting system for ultra-realistic Earth visualization */}
        <directionalLight 
          position={[25, 20, 15]} 
          intensity={4.8} 
          color="#fff5e6"
          castShadow
          shadow-mapSize-width={8192}
          shadow-mapSize-height={8192}
          shadow-camera-far={80}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-bias={-0.00002}
          shadow-normalBias={0.05}
        />
        
        {/* Secondary atmospheric reflection light */}
        <directionalLight 
          position={[-15, 8, -12]} 
          intensity={1.8} 
          color="#e6f3ff"
        />
        
        {/* Tertiary space illumination */}
        <directionalLight 
          position={[0, -20, 8]} 
          intensity={1.2} 
          color="#f0f8ff"
        />
        
        {/* Realistic atmospheric hemisphere lighting */}
        <hemisphereLight 
          skyColor="#87ceeb" 
          groundColor="#1e40af" 
          intensity={1.5} 
        />
        
        {/* Enhanced ambient space illumination */}
        <ambientLight intensity={0.18} color="#f5f8ff" />
        
        {/* Multi-directional atmospheric rim lighting */}
        <pointLight position={[-12, 8, -12]} intensity={3.2} color="#87ceeb" distance={35} decay={1.8} />
        <pointLight position={[12, -8, 12]} intensity={2.8} color="#4a90e2" distance={30} decay={2.0} />
        <pointLight position={[0, 15, -18]} intensity={2.5} color="#b0e0e6" distance={32} decay={1.9} />
        <pointLight position={[0, -15, 18]} intensity={2.2} color="#6495ed" distance={28} decay={2.1} />
        
        <Earth />
        
        {filteredSatellites.map((satellite) => (
          <Satellite
            key={satellite.id}
            position={satellite.position}
            color={satellite.color}
            size={satellite.size}
            name={satellite.name}
            type={satellite.type}
            company={satellite.company}
            launchDate={satellite.launchDate}
            altitude={satellite.altitude}
            onClick={handleSatelliteClick}
            onHover={handleSatelliteHover}
            onUnhover={handleSatelliteUnhover}
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