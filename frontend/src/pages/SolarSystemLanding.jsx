import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Globe from '../components/Globe'
import SatelliteTracker from '../components/SatelliteTracker'

const SolarSystemLanding = () => {
  const navigate = useNavigate()
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [satellites, setSatellites] = useState([])
  const [showTracker, setShowTracker] = useState(false)

  // Generate sample satellites
  useEffect(() => {
    const sampleSatellites = [
      {
        id: 1,
        name: 'International Space Station',
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
        name: 'Hubble Space Telescope',
        noradId: '20580',
        status: 'operational',
        altitude: 547,
        velocity: 27300,
        latitude: 28.5,
        longitude: -80.5,
        riskLevel: 'low',
        lastUpdate: new Date(),
      },
      {
        id: 3,
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
        id: 4,
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
    setSatellites(sampleSatellites)
  }, [])

  const handleSatelliteSelect = (satellite) => {
    setSelectedSatellite(satellite)
  }

  const handleToggleTracker = () => {
    setShowTracker(!showTracker)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 p-6 flex justify-between items-center"
      >
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            OrbitalOS
          </div>
          <div className="text-sm text-gray-400">Mission Control</div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleToggleTracker}
            className={`btn ${showTracker ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showTracker ? 'Hide Tracker' : 'Show Tracker'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Full Access
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-6 h-[calc(100vh-100px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Globe Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${showTracker ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-500`}
          >
            <div className="card h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Earth Orbit Visualization</h2>
                {selectedSatellite && (
                  <div className="text-sm text-blue-400">
                    Selected: {selectedSatellite.name}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Globe
                  satellites={satellites}
                  selectedSatellite={selectedSatellite?.id}
                  onSatelliteClick={handleSatelliteSelect}
                />
              </div>
            </div>
          </motion.div>

          {/* Satellite Tracker */}
          {showTracker && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1"
            >
              <SatelliteTracker
                satellites={satellites}
                onSatelliteSelect={handleSatelliteSelect}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom Stats Panel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-400">
                {satellites.filter(s => s.status === 'operational').length}
              </div>
              <div className="text-sm text-gray-400">Active Satellites</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {satellites.filter(s => s.riskLevel === 'medium' || s.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-gray-400">Risk Alerts</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-400">
                {satellites.filter(s => s.status === 'debris').length}
              </div>
              <div className="text-sm text-gray-400">Debris Objects</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-400">
                {satellites.reduce((sum, s) => sum + s.altitude, 0) / satellites.length | 0}
              </div>
              <div className="text-sm text-gray-400">Avg Altitude (km)</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating action for mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button
          onClick={handleToggleTracker}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-2xl">🛰️</span>
        </button>
      </div>
    </div>
  )
}

export default SolarSystemLanding