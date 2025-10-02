import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Viewer, Entity, PolylineGraphics } from 'resium'
import * as Cesium from 'cesium'
import * as satellite from 'satellite.js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Layers,
  RefreshCw,
} from 'lucide-react'
import { useEnhancedSatellitesStore } from '../stores/enhancedStores'  
import { api } from '../stores/authStore'
import EnhancedConjunctionAnalysis from '../components/EnhancedConjunctionAnalysis'
import EnhancedSatelliteService from '../services/satelliteService_enhanced'
import toast from 'react-hot-toast'

// Set Cesium base URL
window.CESIUM_BASE_URL = '/cesium/'

const EARTH_RADIUS_KM = 6378.137
const LEO_ALTITUDE_LIMIT_KM = 2000
const MAX_LEO_SATELLITES = 180
const TLE_REFRESH_INTERVAL_MS = 60_000
const POSITION_UPDATE_INTERVAL_MS = 5_000

const Visualizer = () => {
  const viewerRef = useRef()
  const viewerConfiguredRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [showRiskOverlay, setShowRiskOverlay] = useState(true)
  const [showRealTimeLayer, setShowRealTimeLayer] = useState(true)
  const [showCatalogLayer, setShowCatalogLayer] = useState(true)
  const [showGroundStations, setShowGroundStations] = useState(false)
  const [timeSpeed, setTimeSpeed] = useState(1)
  const [showConjunctionAnalysis, setShowConjunctionAnalysis] = useState(false)
  const [conjunctionResults, setConjunctionResults] = useState(null)

  const [realTimeSatellites, setRealTimeSatellites] = useState([])
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(false)
  const [tleRecords, setTleRecords] = useState([])

  const observerLocation = useMemo(() => ({ lat: 40.7128, lng: -74.0060 }), [])
  const satelliteService = useMemo(() => new EnhancedSatelliteService(), [])
  
  const { satellites, loadSatellites, isLoading } = useEnhancedSatellitesStore()

  const formatNumber = (value, fractionDigits = 2, suffix = '') => {
    if (value === null || value === undefined) {
      return '—'
    }
    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      return '—'
    }
    return `${numeric.toFixed(fractionDigits)}${suffix}`
  }

  const propagateTleRecords = useCallback((recordsOverride) => {
    const recordsToPropagate = recordsOverride ?? tleRecords

    if (!recordsToPropagate.length) {
      return
    }

    const timestamp = new Date()
    const gmst = satellite.gstime(timestamp)

    const propagated = recordsToPropagate.map((record) => {
      try {
        const { position } = satellite.propagate(record.satrec, timestamp)
        if (!position) {
          return null
        }

        const geodetic = satellite.eciToGeodetic(position, gmst)
        const latitude = satellite.degreesLat(geodetic.latitude)
        const longitude = satellite.degreesLong(geodetic.longitude)
        const altitudeKm = geodetic.height

        if (
          Number.isNaN(latitude) ||
          Number.isNaN(longitude) ||
          Number.isNaN(altitudeKm)
        ) {
          return null
        }

        return {
          satid: record.id,
          satname: record.name,
          satlat: latitude,
          satlng: longitude,
          satalt: altitudeKm,
          inclination: record.inclination,
        }
      } catch (error) {
        console.warn(`Propagation failed for ${record.name}`, error)
        return null
      }
    }).filter(Boolean)

    setRealTimeSatellites(propagated)
  }, [tleRecords])

  // Fetch live satellites from secure local backend
  const fetchLiveSatellites = useCallback(async () => {
    setIsLoadingRealTime(true)
    try {
      console.log('🚀 Fetching live satellites from enhanced API...')
      
      // Use the real satellite data from our enhanced API
      const realSatellites = await satelliteService.fetchSatellites({
        observerLat: observerLocation.lat,
        observerLng: observerLocation.lng,
        maxSatellites: 50
      })
      
      console.log(`📡 Received ${realSatellites.length} satellites from enhanced API`)
      
      if (realSatellites && realSatellites.length > 0) {
        // Transform backend data to match frontend expectations
        const transformedSatellites = realSatellites.slice(0, 50).map(sat => ({
          satid: sat.norad_id,
          satname: sat.name,
          satlat: sat.latitude,
          satlng: sat.longitude,
          satalt: sat.altitude,
          inclination: sat.inclination || 0,
          source: 'enhanced-api'
        }))
        
        console.log(`✅ Displaying ${transformedSatellites.length} real satellites:`, transformedSatellites.slice(0, 3).map(s => s.satname))
        
        setRealTimeSatellites(transformedSatellites)
        toast.success(`Updated ${transformedSatellites.length} live satellite positions from enhanced API`, { id: 'live-satellites' })
      } else {
        console.log('⚠️ No satellites received, using fallback')
        // Use propagated TLE data as fallback
        if (tleRecords.length > 0) {
          const currentTime = new Date()
          const propagated = tleRecords.slice(0, 20).map((tle, index) => {
            try {
              const satrec = satellite.twoline2satrec(tle.tle_line1, tle.tle_line2)
              const positionAndVelocity = satellite.propagate(satrec, currentTime)
              const positionEci = positionAndVelocity.position
              
              if (positionEci) {
                const gmst = satellite.gstime(currentTime)
                const positionGd = satellite.eciToGeodetic(positionEci, gmst)
                
                return {
                  satid: tle.norad_cat_id,
                  satname: tle.object_name,
                  satlat: satellite.degreesLat(positionGd.latitude),
                  satlng: satellite.degreesLong(positionGd.longitude),
                  satalt: positionGd.height,
                  inclination: tle.inclination || 0,
                  source: 'tle-propagation'
                }
              }
            } catch (error) {
              console.warn(`Failed to propagate satellite ${tle.object_name}:`, error)
            }
            return null
          }).filter(Boolean)
          
          setRealTimeSatellites(propagated)
          toast('Using TLE propagation for satellite positions', { icon: '🛰️', id: 'live-satellites' })
        } else {
          setRealTimeSatellites([])
          toast.warn('No satellite data available', { id: 'live-satellites' })
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch live satellites:', error)
      toast.error('Live satellite feed unavailable - check backend connection', { id: 'live-satellites' })
      setRealTimeSatellites([])
    } finally {
      setIsLoadingRealTime(false)
    }
  }, [observerLocation, satelliteService, tleRecords])

  const refreshLeoSatellites = useCallback(async () => {
    await fetchLiveSatellites()
  }, [fetchLiveSatellites])

  useEffect(() => {
    loadSatellites()
    loadRiskData()
  }, [loadSatellites, loadRiskData])

  useEffect(() => {
    refreshLeoSatellites()
    const satelliteTimer = setInterval(refreshLeoSatellites, TLE_REFRESH_INTERVAL_MS)
    return () => clearInterval(satelliteTimer)
  }, [refreshLeoSatellites])



  useEffect(() => {
    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN
    if (ionToken) {
      Cesium.Ion.defaultAccessToken = ionToken
    }
  }, [])

  const loadEarthModel = async (viewer) => {
    // Load NASA Earth GLTF model
    try {
      const earthModel = await Cesium.Model.fromGltfAsync({
        url: 'https://solarsystem.nasa.gov/gltf_embed/2393/',
        scale: 1.0,
        allowPicking: false
      })
      
      viewer.scene.primitives.add(earthModel)
      console.log('✅ NASA Earth GLTF model loaded successfully')
    } catch (error) {
      console.warn('⚠️ Could not load NASA Earth model, using fallback imagery:', error)
      
      // Fallback to high-resolution Blue Marble imagery
      viewer.scene.imageryLayers.removeAll()
      viewer.scene.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 3845 }) // Blue Marble Next Generation
      )
      
      // Add night lights
      const nightLights = viewer.scene.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 3812 }) // Earth at Night
      )
      nightLights.dayAlpha = 0.0
      nightLights.nightAlpha = 1.0
    }
  }

  useEffect(() => {
    if (!viewerReady || !viewerRef.current) {
      return
    }

    const viewer = viewerRef.current.cesiumElement

    if (!viewerConfiguredRef.current) {
      // Enhanced Earth appearance with NASA GLTF model
      viewer.scene.globe.enableLighting = true
      viewer.scene.globe.dynamicAtmosphereLighting = true
      viewer.scene.globe.atmosphereLightIntensity = 2.0
      viewer.scene.globe.showWaterEffect = true
      viewer.scene.globe.maximumScreenSpaceError = 1
      
      // Load Earth model asynchronously
      loadEarthModel(viewer)
      
      // Enhanced atmosphere
      viewer.scene.skyAtmosphere.brightnessShift = 0.4
      viewer.scene.skyAtmosphere.saturationShift = 0.25
      
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0,
        },
      })
      viewerConfiguredRef.current = true
    }

    const clickHandler = (event) => {
      const pickedObject = viewer.scene.pick(event.position)
      if (pickedObject && pickedObject.id) {
        const entity = pickedObject.id
        if (entity.name && entity.name.includes('SAT')) {
          const satelliteKey = entity.name.replace('SAT-', '')
          const catalogSatellite = satellites.find(
            (s) => s.id === satelliteKey || String(s.norad_id) === satelliteKey
          )

          if (catalogSatellite) {
            setSelectedSatellite({ ...catalogSatellite, source: 'catalog' })
            return
          }

          const realTimeSatellite = realTimeSatellites.find(
            (sat) => String(sat.satid) === satelliteKey
          )

          if (realTimeSatellite) {
            setSelectedSatellite({
              id: `rt-${realTimeSatellite.satid}`,
              name: realTimeSatellite.satname,
              norad_id: realTimeSatellite.satid,
              operator: 'Real-time feed',
              altitude: realTimeSatellite.satalt ?? 0,
              inclination: realTimeSatellite.inclination ?? 0,
              longitude: realTimeSatellite.satlng ?? observerLocation.lng,
              latitude: realTimeSatellite.satlat ?? observerLocation.lat,
              source: 'real-time',
            })
          }
        }
      }
    }

    const eventHandler = viewer.cesiumWidget.screenSpaceEventHandler
    eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    eventHandler.setInputAction(clickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }
  }, [viewerReady, satellites, realTimeSatellites, observerLocation])

  useEffect(() => {
    if (!viewerReady || !viewerRef.current) {
      return
    }

    const viewer = viewerRef.current.cesiumElement

    const updateTime = () => {
      setCurrentTime(Cesium.JulianDate.toDate(viewer.clock.currentTime))
    }

    viewer.clock.onTick.addEventListener(updateTime)
    updateTime()

    return () => {
      viewer.clock.onTick.removeEventListener(updateTime)
    }
  }, [viewerReady])

  useEffect(() => {
    if (viewerReady && viewerRef.current) {
      viewerRef.current.cesiumElement.clock.multiplier = timeSpeed
    }
  }, [timeSpeed, viewerReady])

  const togglePlayPause = () => {
    if (!viewerReady || !viewerRef.current) {
      return
    }

    const viewer = viewerRef.current.cesiumElement
    if (isPlaying) {
      viewer.clock.shouldAnimate = false
    } else {
      viewer.clock.shouldAnimate = true
      viewer.clock.multiplier = timeSpeed
    }
    setIsPlaying(!isPlaying)
  }

  const resetTime = () => {
    if (!viewerReady || !viewerRef.current) {
      return
    }

      const viewer = viewerRef.current.cesiumElement
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date())
    viewer.clock.shouldAnimate = false
    setIsPlaying(false)
      setCurrentTime(new Date())
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

  // Generate enhanced orbit trace for satellites
  const generateEnhancedOrbitTrace = (satellite) => {
    const positions = []
    const steps = 64
    const radius = 6371000 + (satellite.satalt * 1000) // Earth radius + altitude
    const inclination = (satellite.inclination || 0) * Math.PI / 180
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle) * Math.cos(inclination)
      const z = radius * Math.sin(angle) * Math.sin(inclination)
      
      // Convert to Cartesian3
      positions.push(new Cesium.Cartesian3(x, y, z))
    }
    
    return positions
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-gray-900 flex">
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
          onReady={() => setViewerReady(true)}
        >
          {/* Render real-time satellites */}
          {showRealTimeLayer && realTimeSatellites.map((satellite) => {
            const altitudeMeters = (satellite.satalt ?? 550) * 1000
            const latitude = satellite.satlat ?? observerLocation.lat
            const longitude = satellite.satlng ?? observerLocation.lng
            const isSelected =
              selectedSatellite?.norad_id === satellite.satid ||
              selectedSatellite?.id === `rt-${satellite.satid}`
            
            // Enhanced satellite visualization
            const getSatelliteColor = () => {
              if (satellite.satname.includes('ISS')) return '#ff6b6b'
              if (satellite.satname.includes('Starlink')) return '#4ecdc4'
              if (satellite.satname.includes('OneWeb')) return '#45b7d1'
              return '#60a5fa'
            }
            
            const colorHex = getSatelliteColor()

            return (
              <Entity
                key={satellite.satid}
                name={`SAT-${satellite.satid}`}
                position={Cesium.Cartesian3.fromDegrees(longitude, latitude, altitudeMeters)}
                point={{
                  pixelSize: isSelected ? 14 : 10,
                  color: Cesium.Color.fromCssColorString(colorHex),
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
                  scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
                }}
                label={{
                  text: satellite.satname,
                  font: '12pt Roboto, sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  pixelOffset: new Cesium.Cartesian2(0, -35),
                  scale: 0.8,
                  scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3),
                }}
                billboard={{
                  image: '/satellite-icon.svg',
                  scale: isSelected ? 0.8 : 0.6,
                  scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.2),
                }}
              >
                {/* Enhanced orbit trace */}
                <PolylineGraphics
                  positions={generateEnhancedOrbitTrace(satellite)}
                  width={3}
                  material={new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: Cesium.Color.fromCssColorString(colorHex).withAlpha(0.7),
                  })}
                  clampToGround={false}
                />
              </Entity>
            )
          })}

          {/* Render catalog or fallback satellites */}
          {showCatalogLayer && satellites.map((satellite) => {
            const riskColor = getRiskColor(satellite)
            const displayColor = showRiskOverlay ? riskColor : '#60a5fa'
            const isSelected =
              selectedSatellite?.id === satellite.id ||
              selectedSatellite?.norad_id === satellite.norad_id
            
            return (
              <Entity
                key={satellite.id}
                name={`SAT-${satellite.id}`}
                position={Cesium.Cartesian3.fromDegrees(
                  satellite.longitude || 0,
                  satellite.latitude || 0,
                  (satellite.altitude || 0) * 1000
                )}
                point={{
                  pixelSize: isSelected ? 11 : 8,
                  color: Cesium.Color.fromCssColorString(displayColor),
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
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
                {showRiskOverlay && (
                  <PolylineGraphics
                    positions={generateOrbitTrace(satellite)}
                    width={2}
                    material={Cesium.Color.fromCssColorString(displayColor).withAlpha(0.6)}
                  />
                )}
              </Entity>
            )
          })}

          {/* Conjunction Analysis Visualization */}
          {conjunctionResults && conjunctionResults.conjunctions && conjunctionResults.conjunctions.map((conjunction, index) => {
            // Find satellite positions for conjunction visualization
            const sat1 = catalogSatellites.find(s => s.norad_id === conjunction.primary_satellite.norad_id) ||
                        realTimeSatellites.find(s => s.satid === conjunction.primary_satellite.norad_id)
            const sat2 = catalogSatellites.find(s => s.norad_id === conjunction.secondary_satellite.norad_id) ||
                        realTimeSatellites.find(s => s.satid === conjunction.secondary_satellite.norad_id)

            if (!sat1 || !sat2) return null

            // Get positions
            const pos1 = sat1.position || Cesium.Cartesian3.fromDegrees(
              sat1.satlng || sat1.longitude || 0,
              sat1.satlat || sat1.latitude || 0,
              (sat1.satalt || sat1.altitude || 550) * 1000
            )
            const pos2 = sat2.position || Cesium.Cartesian3.fromDegrees(
              sat2.satlng || sat2.longitude || 0,
              sat2.satlat || sat2.latitude || 0,
              (sat2.satalt || sat2.altitude || 550) * 1000
            )

            // Color based on risk level
            const getRiskColor = (riskLevel) => {
              switch(riskLevel?.toLowerCase()) {
                case 'high': return '#ef4444' // red
                case 'medium': return '#f59e0b' // amber  
                case 'low': return '#22c55e' // green
                default: return '#6b7280' // gray
              }
            }

            const riskColor = getRiskColor(conjunction.risk_level)

            return (
              <Entity key={`conjunction-${index}`} name={`Conjunction-${index}`}>
                <PolylineGraphics
                  positions={[pos1, pos2]}
                  width={4}
                  material={Cesium.Color.fromCssColorString(riskColor).withAlpha(0.8)}
                  clampToGround={false}
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
              onClick={refreshLeoSatellites}
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

          {demoMode && (
            <div className="mt-3 text-xs text-amber-300 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
              <span>Demo data active</span>
            </div>
          )}
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
                checked={showRealTimeLayer}
                onChange={(e) => setShowRealTimeLayer(e.target.checked)}
                className="rounded"
              />
              <span>Live Overhead</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showConjunctionAnalysis}
                onChange={(e) => setShowConjunctionAnalysis(e.target.checked)}
                className="rounded"
              />
              <span>Conjunction Analysis</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showCatalogLayer}
                onChange={(e) => setShowCatalogLayer(e.target.checked)}
                className="rounded"
              />
              <span>Catalog Orbits</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showGroundStations}
                onChange={(e) => setShowGroundStations(e.target.checked)}
                className="rounded"
              />
              <span>Ground Stations</span>
            </label>
          </div>

          {showGroundStations && (
            <div className="mt-3 text-xs text-blue-300">
              Ground station layer coming soon.
            </div>
          )}
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

      {/* Conjunction Analysis Panel */}
      <AnimatePresence>
        {showConjunctionAnalysis && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto"
          >
            <ConjunctionAnalysis
              satelliteService={satelliteService}
              onAnalysisComplete={(results) => setConjunctionResults(results)}
              onClose={() => setShowConjunctionAnalysis(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="text-white">{selectedSatellite.operator || 'Not available'}</p>
              </div>

              {selectedSatellite.source && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Source</h3>
                  <p className="text-xs inline-flex items-center gap-2 rounded-full border border-gray-600 px-3 py-1 text-amber-200 uppercase tracking-wide">
                    {selectedSatellite.source === 'real-time' ? 'Real-time stream' : 'Mission catalog'}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Altitude</h3>
                <p className="text-white">{formatNumber(selectedSatellite.altitude, 2, ' km')}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Inclination</h3>
                <p className="text-white">{formatNumber(selectedSatellite.inclination, 2, '°')}</p>
              </div>

              {/* Risk Assessment */}
              {(() => {
                const risk = riskData.find(r => r.satellite_id === selectedSatellite.id)
                if (!risk) return null
                const RiskIcon = getRiskIcon(selectedSatellite)
                const riskLevelClass =
                  risk.risk_level === 'critical'
                    ? 'text-red-400'
                    : risk.risk_level === 'warning'
                    ? 'text-yellow-400'
                    : 'text-green-400'

                return (
                  <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Risk Assessment</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Risk Level</span>
                        <span className={`flex items-center gap-2 text-sm font-medium ${riskLevelClass}`}>
                          <RiskIcon className="h-4 w-4" />
                          {risk.risk_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Risk Score</span>
                        <span className="text-sm text-white">{formatNumber(risk.risk_score * 100, 1, '%')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Collision Probability</span>
                        <span className="text-sm text-white">{formatNumber(risk.collision_probability * 100, 2, '%')}</span>
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
function generateSimpleOrbitTrace(satellite = {}) {
  const positions = []
  const steps = 60
  const altitudeMeters = (6371 + (satellite.satalt ?? 550)) * 1000
  const inclination = Cesium.Math.toRadians(satellite.inclination ?? 45)

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Cesium.Math.TWO_PI
    const x = altitudeMeters * Math.cos(angle)
    const y = altitudeMeters * Math.sin(angle) * Math.cos(inclination)
    const z = altitudeMeters * Math.sin(angle) * Math.sin(inclination)

    positions.push(new Cesium.Cartesian3(x, y, z))
  }
  
  return positions
}

// Helper function to generate orbit trace
function generateOrbitTrace(satellite) {
  const positions = []
  const steps = 100
  const altitudeKm = satellite.altitude ?? 0
  const inclination = Cesium.Math.toRadians(satellite.inclination ?? 0)
  
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const radius = (6371 + altitudeKm) * 1000 // Earth radius + altitude
    
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle) * Math.cos(inclination)
    const z = radius * Math.sin(angle) * Math.sin(inclination)
    
    positions.push(new Cesium.Cartesian3(x, y, z))
  }
  
  return positions
}

export default Visualizer
