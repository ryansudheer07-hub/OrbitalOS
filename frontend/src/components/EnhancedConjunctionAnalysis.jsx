import React, { useState, useEffect } from 'react'
import { useEnhancedSatellitesStore } from '../stores/enhancedStores'
import EnhancedSatelliteService from '../services/satelliteService_enhanced'
import { Search, Settings, Play, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const EnhancedConjunctionAnalysis = () => {
  const { satellites, loadSatellites } = useEnhancedSatellitesStore()
  const [satelliteService] = useState(() => new EnhancedSatelliteService())
  
  // Analysis configuration
  const [selectedSatellites, setSelectedSatellites] = useState([])
  const [analysisConfig, setAnalysisConfig] = useState({
    windowHours: 24,
    distanceThreshold: 5.0,
    probabilityThreshold: 0.001
  })
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Search results
  const filteredSatellites = satellites.filter(sat =>
    sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sat.norad_id.toString().includes(searchTerm)
  ).slice(0, 100) // Limit for performance

  // Load satellites on mount
  useEffect(() => {
    if (satellites.length === 0) {
      loadSatellites()
    }
  }, [satellites.length, loadSatellites])

  // Add satellite to analysis
  const addSatellite = (satellite) => {
    if (selectedSatellites.find(s => s.norad_id === satellite.norad_id)) {
      toast.error('Satellite already selected')
      return
    }
    
    if (selectedSatellites.length >= 10) {
      toast.error('Maximum 10 satellites allowed for analysis')
      return
    }
    
    setSelectedSatellites([...selectedSatellites, satellite])
    toast.success(`Added ${satellite.name}`)
  }

  // Remove satellite from analysis
  const removeSatellite = (noradId) => {
    setSelectedSatellites(selectedSatellites.filter(s => s.norad_id !== noradId))
  }

  // Run conjunction analysis
  const runAnalysis = async () => {
    if (selectedSatellites.length < 2) {
      toast.error('Select at least 2 satellites for analysis')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResults(null)

    try {
      console.log('🔍 Starting enhanced conjunction analysis...')
      
      const request = satelliteService.createConjunctionRequest({
        satelliteIds: selectedSatellites.map(s => s.norad_id),
        windowHours: analysisConfig.windowHours,
        distanceThreshold: analysisConfig.distanceThreshold,
        probabilityThreshold: analysisConfig.probabilityThreshold
      })

      const results = await satelliteService.analyzeConjunctions(request)
      setAnalysisResults(results)
      
      toast.success(`Analysis completed - found ${results.conjunctions_found} conjunctions`)
      
    } catch (error) {
      console.error('❌ Conjunction analysis failed:', error)
      toast.error(`Analysis failed: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Get risk level color
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-500 bg-green-100/10 border-green-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-100/10 border-yellow-500/20'
      case 'high': return 'text-orange-500 bg-orange-100/10 border-orange-500/20'
      case 'critical': return 'text-red-500 bg-red-100/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-100/10 border-gray-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Enhanced Conjunction Analysis</h1>
          <p className="text-xl text-gray-300">
            Mathematical orbital collision analysis using real satellite data ({satellites.length.toLocaleString()} satellites)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Satellite Selection */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Select Satellites
              </h2>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search satellites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredSatellites.map((satellite) => (
                  <div
                    key={satellite.norad_id}
                    onClick={() => addSatellite(satellite)}
                    className="p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-sm">{satellite.name}</div>
                    <div className="text-xs text-gray-400">
                      NORAD: {satellite.norad_id} | Type: {satellite.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Analysis Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Time Window (hours)</label>
                  <input
                    type="number"
                    value={analysisConfig.windowHours}
                    onChange={(e) => setAnalysisConfig({...analysisConfig, windowHours: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="1"
                    max="168"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Distance Threshold (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={analysisConfig.distanceThreshold}
                    onChange={(e) => setAnalysisConfig({...analysisConfig, distanceThreshold: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0.1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Probability Threshold</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={analysisConfig.probabilityThreshold}
                    onChange={(e) => setAnalysisConfig({...analysisConfig, probabilityThreshold: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0.0001"
                    max="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Selected Satellites & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Satellites */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Selected Satellites ({selectedSatellites.length})</h2>
                <button
                  onClick={runAnalysis}
                  disabled={selectedSatellites.length < 2 || isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Analysis
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedSatellites.map((satellite) => (
                  <div
                    key={satellite.norad_id}
                    className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm">{satellite.name}</div>
                      <div className="text-xs text-gray-400">NORAD: {satellite.norad_id}</div>
                    </div>
                    <button
                      onClick={() => removeSatellite(satellite.norad_id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {selectedSatellites.length === 0 && (
                  <div className="col-span-2 text-center text-gray-400 py-8">
                    Select satellites from the search results to analyze conjunctions
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResults && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {analysisResults.total_satellites_screened}
                    </div>
                    <div className="text-sm text-gray-400">Satellites Screened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {analysisResults.candidate_pairs}
                    </div>
                    <div className="text-sm text-gray-400">Candidate Pairs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {analysisResults.conjunctions_found}
                    </div>
                    <div className="text-sm text-gray-400">Conjunctions Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {new Date(analysisResults.analysis_timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-gray-400">Analysis Time</div>
                  </div>
                </div>

                {analysisResults.conjunctions_found > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Found {analysisResults.conjunctions_found} Potential Conjunctions
                    </h3>
                    {/* Conjunction details would be displayed here */}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-400 mb-2">No Conjunctions Detected</h3>
                    <p className="text-gray-400">
                      The selected satellites show no collision risks within the specified parameters.
                    </p>
                  </div>
                )}

                {analysisResults.screening_parameters && (
                  <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Screening Parameters</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                      <div>Horizon: {analysisResults.screening_parameters.horizon_hours}h</div>
                      <div>Distance: {analysisResults.screening_parameters.screening_distance_km}km</div>
                      <div>Probability: {analysisResults.screening_parameters.probability_threshold}</div>
                      <div>Time Step: {analysisResults.screening_parameters.time_step_seconds}s</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedConjunctionAnalysis