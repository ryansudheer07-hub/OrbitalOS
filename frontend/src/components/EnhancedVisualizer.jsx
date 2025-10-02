import React, { useState, useEffect, useRef } from 'react'
import { useEnhancedSatellitesStore } from '../stores/enhancedStores'
import { Viewer, Entity, PolylineGraphics } from 'resium'
import * as Cesium from 'cesium'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Layers,
  RefreshCw,
  Satellite,
  Globe as GlobeIcon,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

// Set Cesium base URL
window.CESIUM_BASE_URL = '/cesium/'

const EnhancedVisualizer = () => {
  const { satellites, loadSatellites, isLoading } = useEnhancedSatellitesStore()
  
  const viewerRef = useRef()
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [visualizationSettings, setVisualizationSettings] = useState({
    maxSatellites: 150,
    showOrbits: true,
    showLabels: false,
    filterType: 'all',
    earthTexture: 'nasa'
  })

  // Initialize satellites on mount
  useEffect(() => {
    if (satellites.length === 0) {
      console.log('🚀 Loading enhanced satellites for visualization...')
      loadSatellites()
    }
  }, [satellites.length, loadSatellites])

  // Get visualization data (limited for performance)
  const visualizationData = satellites
    .filter(sat => {
      if (visualizationSettings.filterType === 'all') return true
      if (visualizationSettings.filterType === 'starlink') return sat.name?.toLowerCase().includes('starlink')
      if (visualizationSettings.filterType === 'gps') return sat.type === 'navigation'
      if (visualizationSettings.filterType === 'geo') return sat.type === 'communication'
      return true
    })
    .slice(0, visualizationSettings.maxSatellites)

  // Cesium viewer configuration
  const viewerOptions = {
    terrainProvider: Cesium.createWorldTerrain({
      requestWaterMask: true,
      requestVertexNormals: true
    }),
    imageryProvider: new Cesium.TileMapServiceImageryProvider({
      url: visualizationSettings.earthTexture === 'nasa' 
        ? 'https://solarsystem.nasa.gov/gltf_embed/2393/' 
        : Cesium.buildModuleUrl('Assets/Textures/Earth/')
    }),
    skyBox: new Cesium.SkyBox({
      sources: {
        positiveX: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_px.jpg'),
        negativeX: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_mx.jpg'),
        positiveY: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_py.jpg'),
        negativeY: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_my.jpg'),
        positiveZ: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_pz.jpg'),
        negativeZ: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_mz.jpg')
      }
    }),
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    geocoder: false,
    baseLayerPicker: false,
    vrButton: false,
    infoBox: false,
    selectionIndicator: false
  }

  // Get satellite color based on type
  const getSatelliteColor = (satellite) => {
    const type = satellite.type?.toLowerCase() || 'unknown'
    const name = satellite.name?.toLowerCase() || ''
    
    if (name.includes('starlink')) return Cesium.Color.CYAN
    if (name.includes('oneweb')) return Cesium.Color.BLUE
    if (name.includes('gps') || type === 'navigation') return Cesium.Color.GREEN
    if (type === 'communication') return Cesium.Color.ORANGE
    if (type === 'weather') return Cesium.Color.YELLOW
    if (type === 'science') return Cesium.Color.PURPLE
    if (name.includes('iss') || type === 'station') return Cesium.Color.RED
    return Cesium.Color.WHITE
  }

  // Create satellite entities
  const createSatelliteEntities = () => {
    return visualizationData.map((satellite) => {
      const color = getSatelliteColor(satellite)
      const position = Cesium.Cartesian3.fromDegrees(
        satellite.lon_deg || 0,
        satellite.lat_deg || 0,
        (satellite.alt_km || 400) * 1000 // Convert to meters
      )

      return (
        <Entity
          key={satellite.norad_id}
          position={position}
          point={{
            pixelSize: 8,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }}
          label={visualizationSettings.showLabels ? {
            text: satellite.name,
            font: '10pt Arial',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -40),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          } : undefined}
          onClick={() => setSelectedSatellite(satellite)}
        />
      )
    })
  }

  // Handle viewer ready
  const handleViewerReady = () => {
    setViewerReady(true)
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement
      
      // Set initial camera position
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 30, 20000000)
      })

      // Enable lighting
      viewer.scene.globe.enableLighting = true
      viewer.scene.globe.dynamicAtmosphereLighting = true
      
      console.log('🌍 Enhanced 3D viewer ready with', visualizationData.length, 'satellites')
    }
  }

  // Toggle animation
  const toggleAnimation = () => {
    setIsPlaying(!isPlaying)
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement
      if (isPlaying) {
        viewer.clock.shouldAnimate = false
      } else {
        viewer.clock.shouldAnimate = true
      }
    }
  }

  // Reset view
  const resetView = () => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 30, 20000000)
      })
      setSelectedSatellite(null)
      toast.success('View reset')
    }
  }

  // Refresh satellites
  const refreshSatellites = () => {
    console.log('🔄 Refreshing satellite data...')
    loadSatellites()
    toast.success('Refreshing satellite data...')
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Enhanced Controls */}
      <div className="absolute top-4 left-4 z-50 space-y-4">
        {/* Stats Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <Satellite className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">Enhanced Satellite Tracking</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Total Available</div>
              <div className="text-blue-400 font-bold">{satellites.length.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Visualizing</div>
              <div className="text-green-400 font-bold">{visualizationData.length}</div>
            </div>
          </div>
        </motion.div>

        {/* Control Buttons */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/90 backdrop-blur-xl rounded-xl p-3 border border-slate-700/50 flex gap-2"
        >
          <button
            onClick={toggleAnimation}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={resetView}
            className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={refreshSatellites}
            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            title="Refresh Satellites"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 w-64"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Visualization Settings
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Max Satellites</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={visualizationSettings.maxSatellites}
                  onChange={(e) => setVisualizationSettings({
                    ...visualizationSettings,
                    maxSatellites: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{visualizationSettings.maxSatellites}</div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Filter Type</label>
                <select
                  value={visualizationSettings.filterType}
                  onChange={(e) => setVisualizationSettings({
                    ...visualizationSettings,
                    filterType: e.target.value
                  })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="all">All Satellites</option>
                  <option value="starlink">Starlink</option>
                  <option value="gps">GPS/Navigation</option>
                  <option value="geo">Communication</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLabels"
                  checked={visualizationSettings.showLabels}
                  onChange={(e) => setVisualizationSettings({
                    ...visualizationSettings,
                    showLabels: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="showLabels" className="text-sm text-gray-300">Show Labels</label>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Satellite Info */}
      {selectedSatellite && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 z-50 bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 max-w-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Satellite Details</h3>
            <button
              onClick={() => setSelectedSatellite(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="text-white ml-2">{selectedSatellite.name}</span>
            </div>
            <div>
              <span className="text-gray-400">NORAD ID:</span>
              <span className="text-white ml-2">{selectedSatellite.norad_id}</span>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="text-white ml-2">{selectedSatellite.type || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-400">Altitude:</span>
              <span className="text-white ml-2">{selectedSatellite.alt_km?.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-gray-400">Velocity:</span>
              <span className="text-white ml-2">{selectedSatellite.velocity_km_s?.toFixed(2)} km/s</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white">Loading enhanced satellite data...</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Cesium Viewer */}
      <Viewer 
        ref={viewerRef}
        {...viewerOptions}
        onReady={handleViewerReady}
        className="w-full h-full"
      >
        {viewerReady && createSatelliteEntities()}
      </Viewer>
    </div>
  )
}

export default EnhancedVisualizer