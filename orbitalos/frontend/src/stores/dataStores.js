import { create } from 'zustand'
import { api } from './authStore'
import toast from 'react-hot-toast'

export const useSatellitesStore = create((set, get) => ({
  satellites: [],
  isLoading: false,
  error: null,

  loadSatellites: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/satellites')
      set({ satellites: response.data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error('Failed to load satellites')
    }
  },

  loadRealTimeSatellites: async (lat, lng, alt = 0, radius = 90) => {
    try {
      const response = await api.get('/satellites/above', {
        params: { lat, lng, alt, radius }
      })
      return response.data
    } catch (error) {
      toast.error('Failed to load real-time satellites')
      throw error
    }
  },

  getSatellitePositions: async (noradId, lat, lng, alt = 0, seconds = 60) => {
    try {
      const response = await api.get(`/satellites/${noradId}/positions`, {
        params: { lat, lng, alt, seconds }
      })
      return response.data
    } catch (error) {
      toast.error('Failed to get satellite positions')
      throw error
    }
  },

  getSatelliteTLE: async (noradId) => {
    try {
      const response = await api.get(`/satellites/${noradId}/tle`)
      return response.data
    } catch (error) {
      toast.error('Failed to get satellite TLE data')
      throw error
    }
  },

  getSatellitePasses: async (noradId, lat, lng, alt = 0, days = 7) => {
    try {
      const response = await api.get(`/satellites/${noradId}/passes`, {
        params: { lat, lng, alt, days, min_visibility: 300 }
      })
      return response.data
    } catch (error) {
      toast.error('Failed to get satellite passes')
      throw error
    }
  },

  getSatellite: async (id) => {
    try {
      const response = await api.get(`/satellites/${id}`)
      return response.data
    } catch (error) {
      toast.error('Failed to load satellite details')
      throw error
    }
  },

  updateSatellite: (id, updates) => {
    set((state) => ({
      satellites: state.satellites.map(sat => 
        sat.id === id ? { ...sat, ...updates } : sat
      )
    }))
  },
}))

export const useRiskStore = create((set, get) => ({
  riskData: [],
  isLoading: false,
  error: null,

  loadRiskData: async () => {
    set({ isLoading: true, error: null })
    try {
      // Mock risk data for demo
      const mockRiskData = [
        {
          id: '1',
          satellite_id: 'sat-1',
          risk_score: 0.8,
          risk_level: 'critical',
          collision_probability: 0.05,
          closest_approach_time: new Date(Date.now() + 3600000),
          closest_approach_distance: 50,
          suggested_maneuver: 'Recommended: Perform orbital maneuver to increase altitude by 2km'
        },
        {
          id: '2',
          satellite_id: 'sat-2',
          risk_score: 0.3,
          risk_level: 'safe',
          collision_probability: 0.001,
          closest_approach_time: new Date(Date.now() + 7200000),
          closest_approach_distance: 500,
          suggested_maneuver: null
        },
        {
          id: '3',
          satellite_id: 'sat-3',
          risk_score: 0.6,
          risk_level: 'warning',
          collision_probability: 0.02,
          closest_approach_time: new Date(Date.now() + 1800000),
          closest_approach_distance: 200,
          suggested_maneuver: 'Monitor closely: Consider minor trajectory adjustment'
        }
      ]
      set({ riskData: mockRiskData, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error('Failed to load risk data')
    }
  },

  predictRisk: async (satelliteId, timeHorizonHours = 24) => {
    try {
      const response = await api.post('/risk/predict', {
        satellite_id: satelliteId,
        time_horizon_hours: timeHorizonHours
      })
      
      // Update risk data
      set((state) => ({
        riskData: state.riskData.filter(r => r.satellite_id !== satelliteId).concat([response.data])
      }))
      
      return response.data
    } catch (error) {
      toast.error('Failed to predict risk')
      throw error
    }
  },
}))

export const useBookingsStore = create((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  loadBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/bookings')
      set({ bookings: response.data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error('Failed to load bookings')
    }
  },

  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData)
      set((state) => ({
        bookings: [response.data, ...state.bookings]
      }))
      toast.success('Booking request submitted successfully')
      return response.data
    } catch (error) {
      toast.error('Failed to create booking')
      throw error
    }
  },

  getBooking: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`)
      return response.data
    } catch (error) {
      toast.error('Failed to load booking details')
      throw error
    }
  },
}))

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,
  unreadCount: 0,

  loadAlerts: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/alerts')
      const alerts = response.data
      const unreadCount = alerts.filter(alert => !alert.is_acknowledged).length
      set({ alerts, unreadCount, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error('Failed to load alerts')
    }
  },

  acknowledgeAlert: async (id) => {
    try {
      const response = await api.post(`/alerts/${id}`)
      set((state) => ({
        alerts: state.alerts.map(alert => 
          alert.id === id ? response.data : alert
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
      toast.success('Alert acknowledged')
    } catch (error) {
      toast.error('Failed to acknowledge alert')
      throw error
    }
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1
    }))
  },
}))
