import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Satellite, RefreshCw, Compass, Map, Globe, BarChart3, Activity, GaugeCircle, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useEnhancedSatellitesStore } from '../stores/enhancedStores'

const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

const Visualizer = () => {
  const { satellites, loadSatellites, isLoading, error } = useEnhancedSatellitesStore()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSatellite, setSelectedSatellite] = useState(null)

  const formatNumber = (value, digits = 2) =>
    Number.isFinite(value) ? value.toFixed(digits) : '—'

  const handleSelectSatellite = (satellite) => {
    setSelectedSatellite(satellite)
  }

  const handleCardKeyDown = (event, satellite) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelectSatellite(satellite)
    }
    if (event.key === 'Escape') {
      setSelectedSatellite(null)
    }
  }

  // Load satellites on mount
  useEffect(() => {
    console.log('🔍 Debug: satellites.length =', satellites.length, 'isLoading =', isLoading)
    if (satellites.length === 0 && !isLoading) {
      console.log('🚀 Loading enhanced satellites...')
      loadSatellites()
    }
  }, [satellites.length, loadSatellites, isLoading])

  // Debug effect
  useEffect(() => {
    console.log('📊 Enhanced satellites loaded:', satellites.length)
    if (satellites.length > 0) {
      console.log('📊 First 3 satellites:', satellites.slice(0, 3))
    }
  }, [satellites])

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedSatellite(null)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Filter satellites based on selected criteria
  const filteredSatellites = satellites
    .filter(sat => {
      // Apply filter
      if (selectedFilter === 'starlink') return sat.name?.toLowerCase().includes('starlink')
      if (selectedFilter === 'gps') return sat.type === 'navigation'
      if (selectedFilter === 'communication') return sat.type === 'communication'
      return true
    })
    .filter(sat => {
      // Apply search
      if (!searchTerm) return true
      return sat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             sat.norad_id?.toString().includes(searchTerm)
    })
    .slice(0, 100) // Limit for performance

  // Get satellite type counts
  const getTypeCount = (type) => {
    return satellites.filter(sat => {
      if (type === 'starlink') return sat.name?.toLowerCase().includes('starlink')
      if (type === 'gps') return sat.type === 'navigation'
      if (type === 'communication') return sat.type === 'communication'
      return true
    }).length
  }

  // Get satellite color based on type
  const getSatelliteColor = (satellite) => {
    const name = satellite.name?.toLowerCase() || ''
    const type = satellite.type?.toLowerCase() || ''
    
    if (name.includes('starlink')) return 'bg-cyan-500'
    if (name.includes('gps') || type === 'navigation') return 'bg-green-500'
    if (type === 'communication') return 'bg-orange-500'
    if (type === 'weather') return 'bg-yellow-500'
    if (type === 'science') return 'bg-purple-500'
    return 'bg-gray-500'
  }

  // Refresh satellites
  const refreshSatellites = () => {
    console.log('🔄 Refreshing satellite data...')
    loadSatellites()
    toast.success('Refreshing satellite data...')
  }

  // Test API directly
  const testAPI = async () => {
    try {
      console.log('🧪 Testing enhanced API directly...')
      const response = await fetch(`${API_BASE_URL}/api/v1/satellites?limit=5`)
      const data = await response.json()
      console.log('🧪 API Test Result:', data)
      toast.success(`API test successful - got ${data.length} satellites`)
    } catch (error) {
      console.error('🧪 API Test Failed:', error)
      toast.error(`API test failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Enhanced Satellite Visualizer</h1>
              <p className="text-xl text-gray-300">
                Real satellite data from Celestrak ({satellites.length.toLocaleString()} satellites)
                {satellites.length === 0 && !isLoading && (
                  <span className="text-red-400 ml-2">- No data loaded yet</span>
                )}
                {error && (
                  <span className="text-red-400 ml-2">- Error: {error}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshSatellites}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={testAPI}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                🧪 Test API
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <Satellite className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold">Total Satellites</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">{satellites.length.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-cyan-500 rounded"></div>
              <h3 className="text-lg font-semibold">Starlink</h3>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{getTypeCount('starlink').toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <h3 className="text-lg font-semibold">Navigation</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">{getTypeCount('gps').toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-orange-500 rounded"></div>
              <h3 className="text-lg font-semibold">Communication</h3>
            </div>
            <p className="text-3xl font-bold text-orange-400">{getTypeCount('communication').toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Type</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="all">All Satellites</option>
                <option value="starlink">Starlink</option>
                <option value="gps">GPS/Navigation</option>
                <option value="communication">Communication</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Search Satellites</label>
              <input
                type="text"
                placeholder="Search by name or NORAD ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Satellite List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5" />
            <h2 className="text-xl font-bold">
              Satellite Data ({filteredSatellites.length} shown)
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading enhanced satellite data...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
              {filteredSatellites.map((satellite) => {
                const normalizedId = satellite.norad_id ?? satellite.id ?? satellite.name
                const selectedId = selectedSatellite?.norad_id ?? selectedSatellite?.id ?? selectedSatellite?.name
                const isSelected = selectedId != null && selectedId === normalizedId

                return (
                  <motion.div
                    key={normalizedId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectSatellite(satellite)}
                    onKeyDown={(event) => handleCardKeyDown(event, satellite)}
                    role="button"
                    tabIndex={0}
                    className={`group rounded-xl p-4 select-none cursor-pointer bg-gradient-to-br from-slate-800/70 via-slate-800/40 to-slate-900/70 border border-slate-600/40 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-lg hover:border-slate-400/60 ${
                      isSelected ? 'ring-2 ring-blue-400/70 shadow-blue-500/20' : 'ring-0'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getSatelliteColor(satellite)} shadow-inner shadow-black/40`}></div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-white transition-colors">
                        {satellite.name}
                      </h3>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <Compass className="w-3 h-3 opacity-60" />
                        <span>NORAD: {satellite.norad_id ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Map className="w-3 h-3 opacity-60" />
                        <span>Type: {satellite.type || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GaugeCircle className="w-3 h-3 opacity-60" />
                        <span>Altitude: {formatNumber(satellite.alt_km ?? satellite.altitude, 1)} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 opacity-60" />
                        <span>Velocity: {formatNumber(satellite.velocity_km_s ?? satellite.velocity, 2)} km/s</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {!isLoading && filteredSatellites.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Satellite className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No satellites found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Visualizer