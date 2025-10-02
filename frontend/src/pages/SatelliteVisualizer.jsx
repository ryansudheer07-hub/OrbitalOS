import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Viewer, Entity, Billboard, Label } from 'resium'
import * as Cesium from 'cesium'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Globe,
  Satellite,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Layers,
  MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'
import SatelliteService from '../services/satelliteService'

// Set Cesium base URL
window.CESIUM_BASE_URL = '/cesium/'

const EARTH_RADIUS_KM = 6378.137
const SATELLITE_UPDATE_INTERVAL = 30000 // 30 seconds
const MAX_SATELLITES_DISPLAY = 100

const SatelliteVisualizer = () => {
  const viewerRef = useRef()
  const [isPlaying, setIsPlaying] = useState(true)
  const [viewerReady, setViewerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [satellites, setSatellites] = useState([])
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSatellites, setShowSatellites] = useState(true)
  const [showOrbits, setShowOrbits] = useState(false)
  const [showGroundTrack, setShowGroundTrack] = useState(false)
  const [timeSpeed, setTimeSpeed] = useState(1)

  // Enhanced Earth imagery using Cesium Ion assets
  const imageryProvider = useMemo(() => {
    return new Cesium.IonImageryProvider({ 
      assetId: 3845, // Blue Marble Next Generation
      accessToken: import.meta.env.VITE_CESIUM_ION_TOKEN 
    })
  }, [])

  // Fetch satellite data from our own API
  const fetchSatelliteData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Use our own backend API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      
      // Get visible satellites from our location
      const response = await fetch(
        `${apiUrl}/api/satellites/visible?observer_lat=40.7128&observer_lon=-74.0060&limit=50`
      )
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      const satelliteData = data.satellites.map(sat => ({
        id: sat.id,
        name: sat.name,
        latitude: sat.latitude,
        longitude: sat.longitude,
        altitude: sat.altitude,
        velocity: sat.velocity,
        type: sat.satellite_type.replace('-', '_').toLowerCase(),
        status: sat.status
      }))
      
      setSatellites(satelliteData)
      toast.success(`Loaded ${satelliteData.length} satellites from OrbitalOS API`)
      
    } catch (error) {
      console.error('Failed to fetch satellite data from API:', error)
      
      // Fallback to demo data if API fails
      const demoSatellites = [
        {
          id: 'iss',
          name: 'International Space Station',
          latitude: Math.random() * 60 - 30,
          longitude: Math.random() * 360 - 180,
          altitude: 408,
          velocity: 7.66,
          type: 'space_station',
          status: 'active'
        },
        {
          id: 'starlink-001',
          name: 'Starlink-1001',
          latitude: Math.random() * 60 - 30,
          longitude: Math.random() * 360 - 180,
          altitude: 550,
          velocity: 7.53,
          type: 'communication',
          status: 'active'
        },
        {
          id: 'gps-001',
          name: 'GPS-III-01',
          latitude: Math.random() * 60 - 30,
          longitude: Math.random() * 360 - 180,
          altitude: 20180,
          velocity: 3.87,
          type: 'navigation',
          status: 'active'
        }
      ]
      
      setSatellites(demoSatellites)
      toast.error('API unavailable - using demo data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get satellite color based on type
  const getSatelliteColor = (type) => {
    const colors = {
      'earth_observation': Cesium.Color.CYAN,
      'earthobservation': Cesium.Color.CYAN,
      'communication': Cesium.Color.YELLOW,
      'weather': Cesium.Color.GREEN,
      'navigation': Cesium.Color.ORANGE,
      'military': Cesium.Color.RED,
      'scientific': Cesium.Color.PURPLE,
      'space_station': Cesium.Color.WHITE,
      'spacestation': Cesium.Color.WHITE,
      'debris': Cesium.Color.GRAY,
      'other': Cesium.Color.LIGHTGRAY,
      'default': Cesium.Color.WHITE
    }
    return colors[type] || colors.default
  }

  // Get satellite icon based on type
  const getSatelliteIcon = (type) => {
    return '/satellite-icon.svg' // You'll need to create this icon
  }

  // Configure viewer settings
  const configureViewer = useCallback(() => {
    if (!viewerRef.current?.cesiumElement || viewerConfiguredRef.current) return

    const viewer = viewerRef.current.cesiumElement
    
    // Configure scene
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000
    
    // Enable lighting
    viewer.scene.globe.enableLighting = true
    viewer.scene.globe.atmosphereHueShift = 0.1
    viewer.scene.globe.atmosphereSaturationShift = 0.1
    viewer.scene.globe.atmosphereBrightnessShift = 0.1
    
    // Enhanced Earth appearance
    viewer.scene.skyAtmosphere.hueShift = 0.0
    viewer.scene.skyAtmosphere.saturationShift = 0.0
    viewer.scene.skyAtmosphere.brightnessShift = 0.0
    
    // Configure imagery
    if (imageryProvider) {
      viewer.imageryLayers.removeAll()
      viewer.imageryLayers.addImageryProvider(imageryProvider)
    }
    
    viewerConfiguredRef.current = true
    setViewerReady(true)
  }, [imageryProvider])

  const viewerConfiguredRef = useRef(false)

  // Handle viewer ready
  const handleViewerReady = useCallback(() => {
    configureViewer()
  }, [configureViewer])

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!viewerRef.current?.cesiumElement) return
    
    const viewer = viewerRef.current.cesiumElement
    if (isPlaying) {
      viewer.clock.shouldAnimate = false
    } else {
      viewer.clock.shouldAnimate = true
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // Reset time
  const resetTime = useCallback(() => {
    if (!viewerRef.current?.cesiumElement) return
    
    const viewer = viewerRef.current.cesiumElement
    viewer.clock.currentTime = Cesium.JulianDate.now()
    setCurrentTime(new Date())
  }, [])

  // Handle satellite selection
  const handleSatelliteSelect = useCallback((satellite) => {
    setSelectedSatellite(satellite)
    
    if (viewerRef.current?.cesiumElement && satellite) {
      const viewer = viewerRef.current.cesiumElement
      const position = Cesium.Cartesian3.fromDegrees(
        satellite.longitude,
        satellite.latitude,
        satellite.altitude * 1000 // Convert km to meters
      )
      
      viewer.camera.flyTo({
        destination: position,
        duration: 2.0,
        offset: new Cesium.HeadingPitchRange(0, -90, satellite.altitude * 2000)
      })
    }
  }, [])

  // Update satellite positions (simulate movement)
  const updateSatellitePositions = useCallback(() => {
    setSatellites(prev => prev.map(sat => ({
      ...sat,
      latitude: sat.latitude + (Math.random() - 0.5) * 0.1,
      longitude: sat.longitude + (Math.random() - 0.5) * 0.1
    })))
  }, [])

  // Initialize data
  useEffect(() => {
    fetchSatelliteData()
  }, [fetchSatelliteData])

  // Update satellite positions periodically
  useEffect(() => {
    const interval = setInterval(updateSatellitePositions, SATELLITE_UPDATE_INTERVAL)
    return () => clearInterval(interval)
  }, [updateSatellitePositions])

  // Time update effect
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="h-screen w-full relative bg-black overflow-hidden">
      {/* Cesium Viewer */}
      <Viewer
        ref={viewerRef}
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        fullscreenButton={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        selectionIndicator={false}
        onReady={handleViewerReady}
        terrainProvider={Cesium.createWorldTerrain()}
        imageryProvider={imageryProvider}
      >
        {/* Render satellites */}
        {showSatellites && satellites.map((satellite) => (
          <Entity
            key={satellite.id}
            position={Cesium.Cartesian3.fromDegrees(
              satellite.longitude,
              satellite.latitude,
              satellite.altitude * 1000
            )}
            onClick={() => handleSatelliteSelect(satellite)}
          >
            <Billboard
              image={getSatelliteIcon(satellite.type)}
              scale={0.8}
              color={getSatelliteColor(satellite.type)}
              heightReference={Cesium.HeightReference.NONE}
              scaleByDistance={new Cesium.NearFarScalar(1000, 1.0, 10000000, 0.1)}
            />
            <Label
              text={satellite.name}
              font="12pt sans-serif"
              pixelOffset={new Cesium.Cartesian2(0, -40)}
              fillColor={Cesium.Color.WHITE}
              outlineColor={Cesium.Color.BLACK}
              outlineWidth={2}
              style={Cesium.LabelStyle.FILL_AND_OUTLINE}
              showBackground={true}
              backgroundColor={Cesium.Color.BLACK.withAlpha(0.7)}
              scaleByDistance={new Cesium.NearFarScalar(1000, 1.0, 10000000, 0.0)}
            />
          </Entity>
        ))}
      </Viewer>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Satellite className="w-5 h-5 text-blue-400" />
          Satellite Control
        </h2>
        
        <div className="space-y-3">
          {/* Play/Pause Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePlayPause}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={resetTime}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            
            <button
              onClick={fetchSatelliteData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Layer Controls */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showSatellites}
                onChange={(e) => setShowSatellites(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Satellites</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOrbits}
                onChange={(e) => setShowOrbits(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Orbits</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGroundTrack}
                onChange={(e) => setShowGroundTrack(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Ground Track</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Status Panel */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            <span className="text-sm">
              Time: {currentTime.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-blue-400" />
            <span className="text-sm">
              Satellites: {satellites.length}
            </span>
          </div>
          
          <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        </div>
      </motion.div>

      {/* Satellite Info Panel */}
      <AnimatePresence>
        {selectedSatellite && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md rounded-xl p-6 border border-white/20 text-white w-80"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">{selectedSatellite.name}</h3>
              <button
                onClick={() => setSelectedSatellite(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Latitude</p>
                  <p className="font-mono">{selectedSatellite.latitude.toFixed(4)}°</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Longitude</p>
                  <p className="font-mono">{selectedSatellite.longitude.toFixed(4)}°</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Altitude</p>
                  <p className="font-mono">{selectedSatellite.altitude.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Velocity</p>
                  <p className="font-mono">{selectedSatellite.velocity.toFixed(2)} km/s</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400">Type</p>
                <p className="capitalize">{selectedSatellite.type.replace('-', ' ')}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedSatellite.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm capitalize">{selectedSatellite.status}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 rounded-xl p-6 flex items-center gap-3 text-white">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span>Loading satellite data...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SatelliteVisualizer