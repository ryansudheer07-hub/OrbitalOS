import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../components/ThemeProvider'
import ThemeToggle from '../components/ThemeToggle'

function SatelliteTracker() {
  const { darkMode } = useTheme()
  const [selectedSatellite, setSelectedSatellite] = useState(null)
  const [trackingMode, setTrackingMode] = useState('real-time')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSatellites, setFilteredSatellites] = useState([])

  // Mock satellite data - replace with real API data
  const satellites = [
    {
      id: 1,
      name: "International Space Station",
      type: "Space Station",
      country: "International",
      altitude: "408 km",
      speed: "27,600 km/h",
      status: "Active",
      lastUpdate: "2 minutes ago"
    },
    {
      id: 2,
      name: "Hubble Space Telescope",
      type: "Observatory",
      country: "USA",
      altitude: "547 km",
      speed: "27,300 km/h",
      status: "Active",
      lastUpdate: "1 minute ago"
    },
    {
      id: 3,
      name: "Starlink-4029",
      type: "Communication",
      country: "USA",
      altitude: "550 km",
      speed: "27,200 km/h",
      status: "Active",
      lastUpdate: "30 seconds ago"
    }
  ]

  useEffect(() => {
    const filtered = satellites.filter(sat =>
      sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sat.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredSatellites(filtered)
  }, [searchQuery])

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-500 bg-green-100 dark:bg-green-900'
      case 'inactive': return 'text-red-500 bg-red-100 dark:bg-red-900'
      case 'maintenance': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-500 min-h-screen">
      {/* Professional Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11h14V7l-7-5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Satellite Tracker
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-600 dark:border-blue-400 pb-1">
                Live Tracking
              </button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                Analytics
              </button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                Alerts
              </button>
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              <ThemeToggle />
              <button className="text-gray-700 dark:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Real-Time Satellite Tracking
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Monitor orbital objects with precision tracking and comprehensive analytics.
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Satellites
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or type..."
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Tracking Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tracking Mode
              </label>
              <select
                value={trackingMode}
                onChange={(e) => setTrackingMode(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="real-time">Real-Time</option>
                <option value="predicted">Predicted Path</option>
                <option value="historical">Historical Data</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Actions
              </label>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">
                  Track All
                </button>
                <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Satellite List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tracked Satellites ({filteredSatellites.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredSatellites.map((satellite) => (
                  <div
                    key={satellite.id}
                    onClick={() => setSelectedSatellite(satellite)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      selectedSatellite?.id === satellite.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {satellite.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(satellite.status)}`}>
                        {satellite.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Type: {satellite.type}</div>
                      <div>Altitude: {satellite.altitude}</div>
                      <div>Updated: {satellite.lastUpdate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tracking Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  3D Orbital View
                </h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
                    3D View
                  </button>
                  <button className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                    2D Map
                  </button>
                </div>
              </div>

              {/* Placeholder for 3D visualization */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl h-96 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    3D Earth Visualization
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Interactive 3D globe with real-time satellite tracking
                  </p>
                </div>
              </div>
            </div>

            {/* Satellite Details */}
            {selectedSatellite && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {selectedSatellite.name} - Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedSatellite.type}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Country</div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedSatellite.country}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Altitude</div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedSatellite.altitude}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Speed</div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedSatellite.speed}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Live Tracking Active</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last Update: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Satellites: {filteredSatellites.length} / {satellites.length}
              </span>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SatelliteTracker