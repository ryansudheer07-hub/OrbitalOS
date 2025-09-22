import React, { useEffect, useRef, useState } from 'react'
import { Viewer, Entity, PolylineGraphics, PointGraphics, LabelGraphics } from 'resium'
import * as Cesium from 'cesium'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Satellite, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Layers,
  Info,
  RefreshCw,
  MapPin
} from 'lucide-react'
import { useSatellitesStore, useRiskStore } from '../stores/dataStores'
import toast from 'react-hot-toast'

// Set Cesium base URL
window.CESIUM_BASE_URL = '/cesium/'

const Visualizer = () => {
  const viewerRef = useRef()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [showLayers, setShowLayers] = useState(true)
  const [showRiskOverlay, setShowRiskOverlay] = useState(true)
  const [timeSpeed, setTimeSpeed] = useState(1)
  
  const [realTimeSatellites, setRealTimeSatellites] = useState([])
  const [observerLocation, setObserverLocation] = useState({ lat: 40.7128, lng: -74.0060 }) // NYC default
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(false)
  
  const { satellites, loadSatellites, loadRealTimeSatellites, getSatellitePositions } = useSatellitesStore()
  const { riskData, loadRiskData } = useRiskStore()

  useEffect(() => {
    loadSatellites()
    loadRiskData()
    loadRealTimeData()
  }, [loadSatellites, loadRiskData])

  const loadRealTimeData = async () => {
    setIsLoadingRealTime(true)
    try {
      const realTimeData = await loadRealTimeSatellites(
        observerLocation.lat, 
        observerLocation.lng, 
        0, 
        90
      )
      setRealTimeSatellites(realTimeData)
      toast.success(`Loaded ${realTimeData.length} satellites currently overhead`)
    } catch (error) {
      toast.error('Failed to load real-time satellite data')
    } finally {
      setIsLoadingRealTime(false)
    }
  }

  useEffect(() => {
    if (viewerRef.current) {
      const viewer = viewerRef.current.cesiumElement
      
      // Configure viewer
      viewer.scene.globe.enableLighting = true
      viewer.scene.globe.dynamicAtmosphereLighting = true
      viewer.scene.globe.atmosphereLightIntensity = 2.0
      
      // Set initial camera position
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        }
      })

      // Add click handler for satellite selection
      viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
        const pickedObject = viewer.scene.pick(event.position)
        if (pickedObject && pickedObject.id) {
          const entity = pickedObject.id
          if (entity.name && entity.name.includes('SAT')) {
            const satelliteId = entity.name.replace('SAT-', '')
            const satellite = satellites.find(s => s.id === satelliteId)
            if (satellite) {
              setSelectedSatellite(satellite)
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
  }, [satellites])

  const togglePlayPause = () => {
    if (viewerRef.current) {
      const viewer = viewerRef.current.cesiumElement
      if (isPlaying) {
        viewer.clock.shouldAnimate = false
      } else {
        viewer.clock.shouldAnimate = true
        viewer.clock.multiplier = timeSpeed
      }
      setIsPlaying(!isPlaying)
    }
  }

  const resetTime = () => {
    if (viewerRef.current) {
      const viewer = viewerRef.current.cesiumElement
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date())
      setIsPlaying(false)
      viewer.clock.shouldAnimate = false
    }
  }

  const getRiskColor = (satellite) => {
    const risk = riskData.find(r => r.satellite_id === satellite.id)
    if (!risk) return '#00ff00' // Green for safe
    
    switch (risk.risk_level) {
      case 'critical': return '#ff0000' // Red
      case 'warning': return '#ffaa00' // Amber
      default: return '#00ff00' // Green
    }
  }

  const getRiskIcon = (satellite) => {
    const risk = riskData.find(r => r.satellite_id === satellite.id)
    if (!risk) return CheckCircle
    
    switch (risk.risk_level) {
      case 'critical': return AlertTriangle
      case 'warning': return AlertTriangle
      default: return CheckCircle
    }
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Main 3D Viewer */}
      <div className="flex-1 relative">
        <Viewer
          ref={viewerRef}
          full
          timeline={false}
          animation={false}
          baseLayerPicker={false}
          fullscreenButton={false}
          vrButton={false}
          geocoder={false}
          homeButton={false}
          infoBox={false}
          sceneModePicker={false}
          selectionIndicator={false}
          navigationHelpButton={false}
          navigationInstructionsInitiallyVisible={false}
        >
          {/* Render real-time satellites */}
          {realTimeSatellites.map((satellite) => {
            const riskColor = '#00ff00' // Default green for real-time satellites
            
            return (
              <Entity
                key={satellite.satid}
                name={`SAT-${satellite.satid}`}
                position={Cesium.Cartesian3.fromDegrees(
                  observerLocation.lng, // Use observer location as base
                  observerLocation.lat,
                  500000 // Default altitude for visualization
                )}
                point={{
                  pixelSize: 10,
                  color: Cesium.Color.fromCssColorString(riskColor),
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
                  heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                }}
                label={{
                  text: satellite.satname,
                  font: '12pt sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  pixelOffset: new Cesium.Cartesian2(0, -30),
                  scale: 0.8,
                }}
              >
                {/* Simple orbit trace for real-time satellites */}
                <PolylineGraphics
                  positions={generateSimpleOrbitTrace(satellite.satid)}
                  width={2}
                  material={Cesium.Color.fromCssColorString(riskColor).withAlpha(0.6)}
                />
              </Entity>
            )
          })}

          {/* Render mock satellites as fallback */}
          {realTimeSatellites.length === 0 && satellites.map((satellite) => {
            const RiskIcon = getRiskIcon(satellite)
            const riskColor = getRiskColor(satellite)
            
            return (
              <Entity
                key={satellite.id}
                name={`SAT-${satellite.id}`}
                position={Cesium.Cartesian3.fromDegrees(
                  satellite.longitude || 0,
                  satellite.latitude || 0,
                  satellite.altitude * 1000
                )}
                point={{
                  pixelSize: 8,
                  color: Cesium.Color.fromCssColorString(riskColor),
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
                  heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                }}
                label={{
                  text: satellite.name,
                  font: '12pt sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  pixelOffset: new Cesium.Cartesian2(0, -30),
                  scale: 0.8,
                }}
              >
                {/* Orbit trace */}
                <PolylineGraphics
                  positions={generateOrbitTrace(satellite)}
                  width={2}
                  material={Cesium.Color.fromCssColorString(riskColor).withAlpha(0.6)}
                />
              </Entity>
            )
          })}
        </Viewer>

        {/* Time Controls */}
        <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlayPause}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={resetTime}
              className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={loadRealTimeData}
              disabled={isLoadingRealTime}
              className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${isLoadingRealTime ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="mt-3">
            <label className="text-xs text-gray-400">Speed</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={timeSpeed}
              onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-xs text-gray-400 text-center">{timeSpeed}x</div>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Layers</span>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showRiskOverlay}
                onChange={(e) => setShowRiskOverlay(e.target.checked)}
                className="rounded"
              />
              <span>Risk Overlay</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                defaultChecked
                className="rounded"
              />
              <span>Satellites</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                defaultChecked
                className="rounded"
              />
              <span>Debris</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                defaultChecked
                className="rounded"
              />
              <span>Ground Stations</span>
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Risk Levels</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Safe</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Warning</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Satellite Info Panel */}
      <AnimatePresence>
        {selectedSatellite && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Satellite Details</h2>
              <button
                onClick={() => setSelectedSatellite(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Name</h3>
                <p className="text-white">{selectedSatellite.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">NORAD ID</h3>
                <p className="text-white">{selectedSatellite.norad_id}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Operator</h3>
                <p className="text-white">{selectedSatellite.operator}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Altitude</h3>
                <p className="text-white">{selectedSatellite.altitude.toFixed(2)} km</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Inclination</h3>
                <p className="text-white">{selectedSatellite.inclination.toFixed(2)}°</p>
              </div>

              {/* Risk Assessment */}
              {(() => {
                const risk = riskData.find(r => r.satellite_id === selectedSatellite.id)
                if (!risk) return null

                return (
                  <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Risk Assessment</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Risk Level</span>
                        <span className={`text-sm font-medium ${
                          risk.risk_level === 'critical' ? 'text-red-400' :
                          risk.risk_level === 'warning' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {risk.risk_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Risk Score</span>
                        <span className="text-sm text-white">{(risk.risk_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Collision Probability</span>
                        <span className="text-sm text-white">{(risk.collision_probability * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                    
                    {risk.suggested_maneuver && (
                      <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-700">
                        <p className="text-xs text-blue-300">{risk.suggested_maneuver}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper function to generate simple orbit trace for real-time satellites
function generateSimpleOrbitTrace(satid) {
  const positions = []
  const steps = 50
  
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const radius = 7000000 // Earth radius + typical satellite altitude
    
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle) * Math.cos(0.5) // Slight inclination
    const z = radius * Math.sin(angle) * Math.sin(0.5)
    
    positions.push(new Cesium.Cartesian3(x, y, z))
  }
  
  return positions
}

// Helper function to generate orbit trace
function generateOrbitTrace(satellite) {
  const positions = []
  const steps = 100
  
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const radius = (6371 + satellite.altitude) * 1000 // Earth radius + altitude
    
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle) * Math.cos(satellite.inclination * Math.PI / 180)
    const z = radius * Math.sin(angle) * Math.sin(satellite.inclination * Math.PI / 180)
    
    positions.push(new Cesium.Cartesian3(x, y, z))
  }
  
  return positions
}

export default Visualizer
