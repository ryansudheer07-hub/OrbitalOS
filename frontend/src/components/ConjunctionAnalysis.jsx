import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield, Clock, Zap, Settings, Play, Pause } from 'lucide-react'
import SatelliteService from '../services/satelliteService'

const ConjunctionAnalysis = ({ satellites = [], onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [analysisConfig, setAnalysisConfig] = useState({
    satelliteIds: [],
    windowHours: 24,
    distanceThreshold: 5.0,
    probabilityThreshold: 0.001,
    coarseDistance: 10.0,
    closeApproachDistance: 2.0,
    timeWindow: 72
  })
  const [selectedSatellites, setSelectedSatellites] = useState([])
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const satelliteService = new SatelliteService()

  // Risk level colors
  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-500 bg-green-100'
      case 'Medium': return 'text-yellow-500 bg-yellow-100'
      case 'High': return 'text-orange-500 bg-orange-100'
      case 'Critical': return 'text-red-500 bg-red-100'
      default: return 'text-gray-500 bg-gray-100'
    }
  }

  // Start conjunction analysis
  const startAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const request = satelliteService.createConjunctionRequest({
        satelliteIds: selectedSatellites.map(s => s.norad_id),
        windowHours: analysisConfig.windowHours,
        distanceThreshold: analysisConfig.distanceThreshold,
        probabilityThreshold: analysisConfig.probabilityThreshold,
        coarseDistance: analysisConfig.coarseDistance,
        closeApproachDistance: analysisConfig.closeApproachDistance,
        timeWindow: analysisConfig.timeWindow
      })

      const results = await satelliteService.analyzeConjunctions(request)
      setAnalysisResults(results)
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results)
      }
    } catch (error) {
      console.error('Conjunction analysis failed:', error)
      // Show error to user
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Toggle satellite selection
  const toggleSatelliteSelection = (satellite) => {
    setSelectedSatellites(prev => {
      const isSelected = prev.some(s => s.norad_id === satellite.norad_id)
      if (isSelected) {
        return prev.filter(s => s.norad_id !== satellite.norad_id)
      } else {
        return [...prev, satellite]
      }
    })
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">AI Conjunction Analysis</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Satellite Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Select Satellites</h3>
        <div className="bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
          <div className="mb-3">
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={selectedSatellites.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSatellites([])
                  }
                }}
                className="rounded border-gray-600 bg-gray-700"
              />
              <span>Analyze All Satellites ({satellites.length || 0})</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {satellites.slice(0, 100).map((satellite) => (
              <label
                key={satellite.norad_id || satellite.id}
                className="flex items-center space-x-2 text-sm text-gray-300 hover:bg-gray-700 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedSatellites.some(s => s.norad_id === satellite.norad_id)}
                  onChange={() => toggleSatelliteSelection(satellite)}
                  className="rounded border-gray-600 bg-gray-700"
                />
                <span>{satellite.name}</span>
                <span className="text-xs text-gray-500">({satellite.norad_id})</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Analysis Window (hours)
          </label>
          <input
            type="number"
            value={analysisConfig.windowHours}
            onChange={(e) => setAnalysisConfig(prev => ({ ...prev, windowHours: parseInt(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            min="1"
            max="168"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Distance Threshold (km)
          </label>
          <input
            type="number"
            step="0.1"
            value={analysisConfig.distanceThreshold}
            onChange={(e) => setAnalysisConfig(prev => ({ ...prev, distanceThreshold: parseFloat(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            min="0.1"
            max="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Probability Threshold
          </label>
          <input
            type="number"
            step="0.0001"
            value={analysisConfig.probabilityThreshold}
            onChange={(e) => setAnalysisConfig(prev => ({ ...prev, probabilityThreshold: parseFloat(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            min="0.0001"
            max="1"
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvancedSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 border-t border-gray-700 pt-4"
          >
            <h4 className="text-md font-semibold text-white mb-3">Advanced Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coarse Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={analysisConfig.coarseDistance}
                  onChange={(e) => setAnalysisConfig(prev => ({ ...prev, coarseDistance: parseFloat(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Close Approach Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={analysisConfig.closeApproachDistance}
                  onChange={(e) => setAnalysisConfig(prev => ({ ...prev, closeApproachDistance: parseFloat(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Window (hours)
                </label>
                <input
                  type="number"
                  value={analysisConfig.timeWindow}
                  onChange={(e) => setAnalysisConfig(prev => ({ ...prev, timeWindow: parseInt(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={startAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Analyzing Conjunctions...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Start AI Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {analysisResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Analysis Results</h3>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{analysisResults.total_satellites_screened}</div>
              <div className="text-sm text-gray-400">Satellites Screened</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">{analysisResults.candidate_pairs}</div>
              <div className="text-sm text-gray-400">Candidate Pairs</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{analysisResults.conjunctions_found}</div>
              <div className="text-sm text-gray-400">Conjunctions Found</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {new Date(analysisResults.analysis_timestamp).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-400">Analysis Time</div>
            </div>
          </div>

          {/* Conjunction Events */}
          {analysisResults.conjunctions && analysisResults.conjunctions.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-3">High-Risk Conjunctions</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {analysisResults.conjunctions.map((conjunction, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(conjunction.risk_level)}`}>
                          {conjunction.risk_level}
                        </span>
                        <span className="text-white font-medium">
                          {conjunction.satellite_a.name} ↔ {conjunction.satellite_b.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        P = {(conjunction.pc * 100).toFixed(4)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="text-gray-300">
                        TCA: {new Date(conjunction.tca).toLocaleString()}
                      </div>
                      <div className="text-gray-300">
                        Distance: {conjunction.dmin_km.toFixed(2)} km
                      </div>
                      <div className="text-gray-300">
                        Relative Speed: {conjunction.relative_velocity_km_s.toFixed(2)} km/s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisResults.conjunctions_found === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">No High-Risk Conjunctions</h4>
              <p className="text-gray-400">All satellites are operating within safe parameters.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default ConjunctionAnalysis