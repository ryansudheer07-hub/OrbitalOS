import { create } from 'zustand'
import { api } from './authStore'
import SatelliteService from '../services/satelliteService'
import toast from 'react-hot-toast'

const MOCK_SATELLITES = [
  {
    id: 'sat-1',
    norad_id: 25544,
    name: 'ISS (Demo)',
    operator: 'NASA / Roscosmos',
    altitude: 408.0,
    inclination: 51.6,
    eccentricity: 0.0003,
    right_ascension: 130.5,
    argument_of_perigee: 87.6,
    mean_anomaly: 142.1,
    mean_motion: 15.49,
    epoch: new Date().toISOString(),
    tle_line1: '',
    tle_line2: '',
    is_active: true,
    latitude: 0,
    longitude: 0,
  },
  {
    id: 'sat-2',
    norad_id: 43001,
    name: 'Starlink-1001 (Demo)',
    operator: 'SpaceX',
    altitude: 550.0,
    inclination: 53.0,
    eccentricity: 0.0002,
    right_ascension: 80.3,
    argument_of_perigee: 45.0,
    mean_anomaly: 20.0,
    mean_motion: 15.05,
    epoch: new Date().toISOString(),
    tle_line1: '',
    tle_line2: '',
    is_active: true,
    latitude: 10,
    longitude: -40,
  },
  {
    id: 'sat-3',
    norad_id: 54001,
    name: 'OneWeb-1 (Demo)',
    operator: 'OneWeb',
    altitude: 1200.0,
    inclination: 87.4,
    eccentricity: 0.0001,
    right_ascension: 230.1,
    argument_of_perigee: 12.4,
    mean_anomaly: 300.0,
    mean_motion: 14.2,
    epoch: new Date().toISOString(),
    tle_line1: '',
    tle_line2: '',
    is_active: true,
    latitude: -20,
    longitude: 80,
  },
]

const MOCK_REAL_TIME_SATELLITES = [
  {
    satid: 25544,
    satname: 'ISS (Demo)',
    satlat: 18.6,
    satlng: -72.1,
    satalt: 420,
  },
  {
    satid: 40373,
    satname: 'COSMOS 2499 (Demo)',
    satlat: -12.4,
    satlng: 32.2,
    satalt: 1500,
  },
  {
    satid: 43001,
    satname: 'Starlink-1001 (Demo)',
    satlat: 47.2,
    satlng: 12.4,
    satalt: 540,
  },
]

export const useSatellitesStore = create((set, get) => ({
  satellites: [],
  demoMode: false,
  isLoading: false,
  error: null,

  loadSatellites: async () => {
    set({ isLoading: true, error: null })
    try {
      // Use the enhanced satellite service with 22,174 satellites
      const satelliteService = new SatelliteService()
      
      const satellites = await satelliteService.fetchSatellites()
      console.log(`✅ Loaded ${satellites.length} satellites from enhanced API`)
      set({ satellites: satellites, isLoading: false, demoMode: false })
    } catch (error) {
      console.error('Failed to load satellites from enhanced API, falling back to demo data', error)
      toast('Running with demo satellite catalog', {
        icon: '🛰️',
      })
      set({ satellites: MOCK_SATELLITES, isLoading: false, error: null, demoMode: true })
    }
  },

  loadRealTimeSatellites: async (lat, lng, alt = 0, radius = 90) => {
    try {
      const response = await api.get('/satellites/above', {
        params: { lat, lng, alt, radius }
      })
      return response.data
    } catch (error) {
      console.error('Failed to load real-time satellites, falling back to demo data', error)
      toast('Using demo passes for current overhead view', {
        icon: '📡',
      })
      set({ demoMode: true })
      return MOCK_REAL_TIME_SATELLITES
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
