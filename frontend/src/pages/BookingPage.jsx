import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Calendar, Clock, Satellite, AlertCircle, CheckCircle } from 'lucide-react'
import { useBookingsStore } from '../stores/dataStores'
import { useSatellitesStore } from '../stores/dataStores'
import toast from 'react-hot-toast'

const BookingPage = () => {
  const { createBooking, isLoading } = useBookingsStore()
  const { satellites } = useSatellitesStore()
  const [conflictCheck, setConflictCheck] = useState(null)
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  
  const watchedSatellite = watch('satellite_id')
  const watchedStartTime = watch('start_time')
  const watchedEndTime = watch('end_time')

  const onSubmit = async (data) => {
    try {
      const result = await createBooking({
        satellite_id: data.satellite_id,
        operation_type: data.operation_type,
        start_time: new Date(data.start_time),
        end_time: new Date(data.end_time)
      })
      
      if (result.status === 'rejected') {
        setConflictCheck({
          hasConflict: true,
          reason: result.reason
        })
      } else {
        setConflictCheck({
          hasConflict: false,
          message: 'Booking approved successfully!'
        })
      }
    } catch (error) {
      toast.error('Failed to create booking')
    }
  }

  const checkConflicts = () => {
    if (watchedSatellite && watchedStartTime && watchedEndTime) {
      // Simulate conflict check
      const hasConflict = Math.random() > 0.7
      setConflictCheck({
        hasConflict,
        reason: hasConflict ? 'Time slot conflicts with existing operations' : null,
        message: hasConflict ? null : 'No conflicts detected'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">Booking Request</h1>
              <p className="text-gray-400">Schedule satellite operations and maneuvers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h2 className="text-lg font-semibold text-white mb-6">Operation Details</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Satellite Selection */}
                <div>
                  <label className="label">Select Satellite</label>
                  <select
                    {...register('satellite_id', { required: 'Please select a satellite' })}
                    className="input"
                  >
                    <option value="">Choose a satellite...</option>
                    {satellites.map((satellite) => (
                      <option key={satellite.id} value={satellite.id}>
                        {satellite.name} ({satellite.operator})
                      </option>
                    ))}
                  </select>
                  {errors.satellite_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.satellite_id.message}</p>
                  )}
                </div>

                {/* Operation Type */}
                <div>
                  <label className="label">Operation Type</label>
                  <select
                    {...register('operation_type', { required: 'Please select operation type' })}
                    className="input"
                  >
                    <option value="">Select operation...</option>
                    <option value="orbit_shift">Orbit Shift</option>
                    <option value="payload_activation">Payload Activation</option>
                    <option value="launch_window">Launch Window</option>
                    <option value="maneuver">Maneuver</option>
                  </select>
                  {errors.operation_type && (
                    <p className="text-red-400 text-sm mt-1">{errors.operation_type.message}</p>
                  )}
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Time</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="datetime-local"
                        {...register('start_time', { required: 'Start time is required' })}
                        className="input pl-10"
                      />
                    </div>
                    {errors.start_time && (
                      <p className="text-red-400 text-sm mt-1">{errors.start_time.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">End Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="datetime-local"
                        {...register('end_time', { required: 'End time is required' })}
                        className="input pl-10"
                      />
                    </div>
                    {errors.end_time && (
                      <p className="text-red-400 text-sm mt-1">{errors.end_time.message}</p>
                    )}
                  </div>
                </div>

                {/* Conflict Check Button */}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={checkConflicts}
                    className="btn btn-secondary"
                    disabled={!watchedSatellite || !watchedStartTime || !watchedEndTime}
                  >
                    Check for Conflicts
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Conflict Status */}
            {conflictCheck && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`card border-l-4 ${
                  conflictCheck.hasConflict 
                    ? 'border-red-500 bg-red-900/20' 
                    : 'border-green-500 bg-green-900/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {conflictCheck.hasConflict ? (
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">
                      {conflictCheck.hasConflict ? 'Conflict Detected' : 'No Conflicts'}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {conflictCheck.reason || conflictCheck.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Operation Guidelines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="font-semibold text-white mb-4">Operation Guidelines</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Minimum 2-hour advance notice required</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Operations are subject to risk assessment</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Emergency operations may override conflicts</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>All operations are logged and monitored</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Satellites</span>
                  <span className="text-white">{satellites.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pending Requests</span>
                  <span className="text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400">94.2%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
