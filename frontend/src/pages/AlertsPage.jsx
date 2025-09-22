import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, Clock, X } from 'lucide-react'
import { useAlertsStore } from '../stores/dataStores'
import toast from 'react-hot-toast'

const AlertsPage = () => {
  const { alerts, loadAlerts, acknowledgeAlert, isLoading } = useAlertsStore()

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-900/20'
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20'
      default:
        return 'border-blue-500 bg-blue-900/20'
    }
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId)
    } catch (error) {
      toast.error('Failed to acknowledge alert')
    }
  }

  const unreadAlerts = alerts.filter(alert => !alert.is_acknowledged)
  const readAlerts = alerts.filter(alert => alert.is_acknowledged)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1>
              <p className="text-gray-400">Monitor system alerts and operational notifications</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Unread Alerts</p>
                <p className="text-xl font-bold text-red-400">{unreadAlerts.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unread Alerts */}
        {unreadAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Unread Alerts</h2>
            <div className="space-y-4">
              {unreadAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`card border-l-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{alert.title}</h3>
                        <p className="text-gray-300 mb-3">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                          </div>
                          <span className="capitalize">{alert.alert_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn btn-secondary text-sm px-4 py-2"
                    >
                      Acknowledge
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Read Alerts */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>
          {readAlerts.length > 0 ? (
            <div className="space-y-3">
              {readAlerts.slice(0, 10).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">{alert.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Acknowledged</span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                        {alert.acknowledged_at && (
                          <span>Acknowledged: {new Date(alert.acknowledged_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-gray-400">No alerts to display at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertsPage
