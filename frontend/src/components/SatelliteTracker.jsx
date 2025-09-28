import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Satellite, Globe2, Radar, AlertTriangle, Zap } from 'lucide-react'

const SatelliteTracker = ({ satellites = [], onSatelliteSelect }) => {
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  // Sample satellite data if none provided
  const defaultSatellites = [
    {
      id: 1,
      name: 'ISS (ZARYA)',
      noradId: '25544',
      status: 'operational',
      altitude: 408,
      velocity: 27600,
      latitude: 45.2,
      longitude: -75.6,
      riskLevel: 'low',
      lastUpdate: new Date(),
    },
    {
      id: 2,
      name: 'STARLINK-1007',
      noradId: '44713',
      status: 'operational',
      altitude: 550,
      velocity: 27400,
      latitude: 32.1,
      longitude: 105.3,
      riskLevel: 'medium',
      lastUpdate: new Date(),
    },
    {
      id: 3,
      name: 'COSMOS 2251 DEB',
      noradId: '34454',
      status: 'debris',
      altitude: 790,
      velocity: 26800,
      latitude: -12.4,
      longitude: 45.7,
      riskLevel: 'high',
      lastUpdate: new Date(),
    },
  ]

  const activeSatellites = satellites.length > 0 ? satellites : defaultSatellites

  // Filter and sort satellites
  const filteredSatellites = activeSatellites
    .filter(sat => {
      if (filter !== 'all' && sat.status !== filter) return false
      if (searchTerm && !sat.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'altitude': return b.altitude - a.altitude
        case 'risk': 
          const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 }
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
        default: return 0
      }
    })

  const handleSatelliteClick = (satellite) => {
    setSelectedSatellite(satellite)
    onSatelliteSelect?.(satellite)
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-400 bg-red-900'
      case 'medium': return 'text-yellow-400 bg-yellow-900'
      case 'low': return 'text-green-400 bg-green-900'
      default: return 'text-gray-400 bg-gray-900'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <Satellite className="h-4 w-4 text-green-400" />
      case 'debris': return <AlertTriangle className="h-4 w-4 text-red-400" />
      default: return <Globe2 className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radar className="h-5 w-5 text-blue-400" />
            Satellite Tracker
          </h2>
          <div className="text-sm text-gray-400">
            {filteredSatellites.length} objects
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search satellites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-full sm:w-auto"
          >
            <option value="all">All Objects</option>
            <option value="operational">Operational</option>
            <option value="debris">Debris</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-full sm:w-auto"
          >
            <option value="name">Name</option>
            <option value="altitude">Altitude</option>
            <option value="risk">Risk Level</option>
          </select>
        </div>
      </div>

      {/* Satellite List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredSatellites.map((satellite) => (
            <motion.div
              key={satellite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700 ${
                selectedSatellite?.id === satellite.id ? 'bg-blue-900 border-blue-600' : ''
              }`}
              onClick={() => handleSatelliteClick(satellite)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(satellite.status)}
                    <span className="text-white font-semibold">{satellite.name}</span>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>NORAD ID: {satellite.noradId}</div>
                    <div>Alt: {satellite.altitude} km | Vel: {satellite.velocity} km/h</div>
                    <div>Lat: {satellite.latitude.toFixed(2)}° | Lon: {satellite.longitude.toFixed(2)}°</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(satellite.riskLevel)}`}>
                    {satellite.riskLevel.toUpperCase()}
                  </span>
                  
                  {satellite.status === 'operational' && (
                    <div className="flex items-center gap-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs">LIVE</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedSatellite?.id === satellite.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-600"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className="ml-2 text-white capitalize">{satellite.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Update:</span>
                      <span className="ml-2 text-white">{satellite.lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <button className="btn btn-primary btn-sm">
                      Track Orbit
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      View Details
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-850">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">
              {activeSatellites.filter(s => s.status === 'operational').length}
            </div>
            <div className="text-xs text-gray-400">Operational</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">
              {activeSatellites.filter(s => s.riskLevel === 'medium' || s.riskLevel === 'high').length}
            </div>
            <div className="text-xs text-gray-400">At Risk</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">
              {activeSatellites.filter(s => s.status === 'debris').length}
            </div>
            <div className="text-xs text-gray-400">Debris</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SatelliteTracker