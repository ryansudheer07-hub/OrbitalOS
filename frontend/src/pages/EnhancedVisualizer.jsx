import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Viewer, Entity, PointGraphics, LabelGraphics, PolylineGraphics } from 'resium'
import * as Cesium from 'cesium'
import { useEnhancedSatellitesStore } from '../stores/enhancedStores'
import { Clock, Satellite, Activity, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const EARTH_RADIUS_KM = 6378.137
const VISUALIZATION_LIMIT = 150 // Limit for performance

const EnhancedVisualizer = () => {
  const viewerRef = useRef()
  const [viewerReady, setViewerReady] = useState(false)
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(false)
  const [realTimeSatellites, setRealTimeSatellites] = useState([])
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const viewerConfiguredRef = useRef(false)

  const { 
    satellites, 
    isLoading, 
    error, 
    lastUpdated,
    loadSatellites, 
    getSatellitesForVisualization 
  } = useEnhancedSatellitesStore()

  // Initialize Cesium viewer
  const initializeViewer = useCallback(() => {
    if (!viewerRef.current || viewerConfiguredRef.current) return

    const viewer = viewerRef.current.cesiumElement
    
    // Enhanced Earth appearance
    viewer.scene.globe.enableLighting = true
    viewer.scene.globe.dynamicAtmosphereLighting = true
    viewer.scene.globe.atmosphereLightIntensity = 2.0
    viewer.scene.globe.showWaterEffect = true
    viewer.scene.globe.maximumScreenSpaceError = 1

    // High-resolution imagery
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

    // Enhanced atmosphere
    viewer.scene.skyAtmosphere.brightnessShift = 0.4
    viewer.scene.skyAtmosphere.saturationShift = 0.25

    // Camera controls
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-74.0, 40.7, 2000000)
    })

    viewerConfiguredRef.current = true
    console.log('✅ Enhanced Cesium viewer initialized')
  }, [])

  // Load satellites for visualization
  const loadVisualizationData = useCallback(async () => {
    setIsLoadingRealTime(true)
    
    try {
      console.log('🚀 Loading satellites for visualization...')
      
      const visualizationSatellites = await getSatellitesForVisualization(VISUALIZATION_LIMIT)
      
      // Transform for Cesium
      const transformedSatellites = visualizationSatellites.map(sat => ({
        id: sat.id,
        satid: sat.norad_id,
        satname: sat.name,
        satlat: sat.latitude,
        satlng: sat.longitude,
        satalt: sat.altitude,
        velocity: sat.velocity,
        type: sat.type,
        source: 'enhanced-api'
      }))
      
      setRealTimeSatellites(transformedSatellites)
      console.log(`✅ Loaded ${transformedSatellites.length} satellites for visualization`)
      
      toast.success(`Displaying ${transformedSatellites.length} real satellites`, { 
        id: 'visualization-loaded' 
      })
      
    } catch (error) {
      console.error('❌ Failed to load visualization data:', error)
      toast.error('Failed to load satellite visualization', { id: 'visualization-error' })
    } finally {
      setIsLoadingRealTime(false)
    }
  }, [getSatellitesForVisualization])

  // Get satellite color based on type
  const getSatelliteColor = useCallback((type) => {
    const colors = {
      'communication': Cesium.Color.CYAN,
      'navigation': Cesium.Color.GREEN,
      'space-station': Cesium.Color.YELLOW,
      'weather': Cesium.Color.ORANGE,
      'military': Cesium.Color.RED,
      'scientific': Cesium.Color.PURPLE,
      'earth-observation': Cesium.Color.BLUE,
      'other': Cesium.Color.WHITE
    }
    return colors[type] || Cesium.Color.WHITE
  }, [])

  // Create satellite entity
  const createSatelliteEntity = useCallback((satellite) => {
    const position = Cesium.Cartesian3.fromDegrees(
      satellite.satlng,
      satellite.satlat,
      satellite.satalt * 1000 // Convert km to meters
    )

    return (
      <Entity
        key={satellite.id}
        id={satellite.id}
        position={position}
        onClick={() => setSelectedSatellite(satellite)}
      >
        <PointGraphics
          pixelSize={6}
          color={getSatelliteColor(satellite.type)}
          outlineColor={Cesium.Color.WHITE}
          outlineWidth={1}
          heightReference={Cesium.HeightReference.NONE}
        />
        <LabelGraphics
          text={satellite.satname}
          font="12px monospace"
          fillColor={Cesium.Color.WHITE}
          outlineColor={Cesium.Color.BLACK}
          outlineWidth={2}
          style={Cesium.LabelStyle.FILL_AND_OUTLINE}
          pixelOffset={new Cesium.Cartesian2(0, -30)}
          show={selectedSatellite?.id === satellite.id}
        />
      </Entity>
    )
  }, [getSatelliteColor, selectedSatellite])

  // Load satellites on mount
  useEffect(() => {
    loadSatellites()
  }, [loadSatellites])

  // Initialize viewer when ready
  useEffect(() => {
    if (viewerReady) {
      initializeViewer()
      loadVisualizationData()
    }
  }, [viewerReady, initializeViewer, loadVisualizationData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoadingRealTime) {
        loadVisualizationData()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [loadVisualizationData, isLoadingRealTime])

  return (
    <div className="h-screen w-full relative bg-black">
      {/* Header Stats */}
      <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4" />
            <span>Total: {satellites.length.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Showing: {realTimeSatellites.length}</span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
          {isLoadingRealTime && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-400 mt-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">{error}</span>
          </div>
        )}
      </div>

      {/* Satellite Info Panel */}
      {selectedSatellite && (
        <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white min-w-64">
          <h3 className="font-bold text-lg mb-2">{selectedSatellite.satname}</h3>
          <div className="space-y-1 text-sm">
            <div>NORAD ID: {selectedSatellite.satid}</div>
            <div>Type: {selectedSatellite.type}</div>
            <div>Altitude: {selectedSatellite.satalt?.toFixed(1)} km</div>
            <div>Latitude: {selectedSatellite.satlat?.toFixed(3)}°</div>
            <div>Longitude: {selectedSatellite.satlng?.toFixed(3)}°</div>
            {selectedSatellite.velocity && (
              <div>Velocity: {selectedSatellite.velocity?.toFixed(2)} km/s</div>
            )}
            <div className="text-xs text-gray-400 mt-2">Source: {selectedSatellite.source}</div>
          </div>
          <button
            onClick={() => setSelectedSatellite(null)}
            className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <h4 className="font-bold mb-2 text-sm">Satellite Types</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <span>Communication</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Space Station</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
            <span>Weather</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>Earth Observation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <span>Scientific</span>
          </div>
        </div>
      </div>

      {/* Cesium Viewer */}
      <Viewer
        ref={viewerRef}
        full
        animation={false}
        timeline={false}
        navigationHelpButton={false}
        homeButton={false}
        sceneModePicker={false}
        baseLayerPicker={false}
        geocoder={false}
        infoBox={false}
        selectionIndicator={false}
        onReady={() => {
          console.log('🎯 Cesium viewer ready')
          setViewerReady(true)
        }}
      >
        {/* Render satellite entities */}
        {realTimeSatellites.map(satellite => createSatelliteEntity(satellite))}
      </Viewer>
    </div>
  )
}

export default EnhancedVisualizer