import React from 'react'
import { useLocation } from 'react-router-dom'
import SatelliteVisualizationNASA from '../components/SatelliteVisualizationNASA'
import EnhancedConjunctionAnalysis from '../components/EnhancedConjunctionAnalysis'

function Dashboard() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const view = searchParams.get('view')

  // Route to conjunction analysis if view=conflict
  if (view === 'conflict') {
    return <EnhancedConjunctionAnalysis />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">OrbitalOS Dashboard</h1>
        <p className="text-xl text-gray-300 mb-8">Mission Control Center</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold mb-2">Active Satellites</h3>
            <p className="text-3xl font-bold text-blue-400">22,174</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold mb-2">Risk Events</h3>
            <p className="text-3xl font-bold text-red-400">3</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
            <p className="text-3xl font-bold text-green-400">97%</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-purple-400">$33k</p>
          </div>
        </div>

        {/* 3D Satellite Visualization Section */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-2xl font-bold mb-2">Live Satellite Tracking</h2>
            <p className="text-gray-300">Real-time 3D visualization of orbital objects</p>
          </div>
          <div className="h-[600px]">
            <SatelliteVisualizationNASA />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard