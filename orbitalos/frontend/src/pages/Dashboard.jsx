import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Satellite, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Activity,
  Users,
  Clock,
  BarChart3
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useAuthStore } from '../stores/authStore'
import { useAlertsStore } from '../stores/dataStores'
import { api } from '../stores/authStore'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuthStore()
  const { alerts, loadAlerts } = useAlertsStore()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    loadAlerts()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'operator':
        return {
          title: 'Operator Dashboard',
          description: 'Monitor your satellite fleet and manage operations',
          primaryActions: [
            { label: 'View Satellites', icon: Satellite, href: '/visualizer' },
            { label: 'Request Operations', icon: Clock, href: '/booking' },
            { label: 'View Alerts', icon: AlertTriangle, href: '/alerts' }
          ]
        }
      case 'insurer':
        return {
          title: 'Risk Assessment Dashboard',
          description: 'Monitor risk exposure and collision probabilities',
          primaryActions: [
            { label: 'Risk Analysis', icon: BarChart3, href: '/visualizer' },
            { label: 'View Alerts', icon: AlertTriangle, href: '/alerts' }
          ]
        }
      case 'analyst':
        return {
          title: 'Analytics Dashboard',
          description: 'Analyze trends and generate reports',
          primaryActions: [
            { label: 'View Analytics', icon: TrendingUp, href: '/visualizer' },
            { label: 'Generate Reports', icon: BarChart3, href: '/booking' }
          ]
        }
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to OrbitalOS',
          primaryActions: []
        }
    }
  }

  const roleContent = getRoleBasedContent()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">{roleContent.title}</h1>
              <p className="text-gray-400">{roleContent.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back</p>
                <p className="text-white font-medium">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleContent.primaryActions.map((action, index) => (
              <motion.a
                key={index}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:bg-gray-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-medium">{action.label}</span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Satellites</p>
                  <p className="text-2xl font-bold text-white">{stats.active_satellites}</p>
                </div>
                <div className="p-3 bg-green-600 rounded-lg">
                  <Satellite className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Critical Risks (24h)</p>
                  <p className="text-2xl font-bold text-white">{stats.critical_risks_24h}</p>
                </div>
                <div className="p-3 bg-red-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Bookings Blocked (24h)</p>
                  <p className="text-2xl font-bold text-white">{stats.bookings_blocked_24h}</p>
                </div>
                <div className="p-3 bg-yellow-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Conjunctions</p>
                  <p className="text-2xl font-bold text-white">{stats.total_conjunctions}</p>
                </div>
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Risk Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.risk_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="risk_count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Operator Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Risk by Operator</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.risk_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="operator" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="risk_count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
            <a href="/alerts" className="text-blue-500 hover:text-blue-400 text-sm">
              View All
            </a>
          </div>
          
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={alert.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-600' :
                  alert.severity === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
                }`}>
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{alert.title}</p>
                  <p className="text-gray-400 text-sm">{alert.message}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
