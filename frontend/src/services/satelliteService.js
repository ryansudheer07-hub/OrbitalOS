// satelliteService.js - Secure Local Backend Integration
import * as satellite from 'satellite.js'

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080'

class SatelliteService {
  constructor() {
  // SECURE: Using configurable backend (defaults to local)
  this.localApiUrl = API_BASE_URL
    this.cache = new Map()
    this.cacheTimeout = 30000 // 30 seconds
    this.isServerAvailable = false
  }

  // SECURE: Check if local backend is available
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.localApiUrl}/health`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      const data = await response.json()
      this.isServerAvailable = response.ok && data.status === 'healthy'
      return this.isServerAvailable
    } catch (error) {
      console.warn('Local satellite API not available:', error.message)
      this.isServerAvailable = false
      return false
    }
  }

  // Main method to fetch satellite data - SECURE LOCAL ONLY
  async fetchSatellites(options = {}) {
    const {
      observerLat = 0,
      observerLng = 0,
      observerAlt = 0,
      searchRadius = 90,
      category = 'all',
      maxSatellites = 1000,
      page = null,
      limit = null
    } = options

    const cacheKey = `sats_${observerLat}_${observerLng}_${searchRadius}_${category}_${page}_${limit}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      let satellites = []

      console.log('🚀 Starting satellite fetch process...')
      
      // SECURE: Only use local backend - no external APIs
      satellites = await this.fetchFromLocalBackend({
        page,
        limit,
        group: category !== 'all' ? category : null
      })

      // Fallback to demo data if local backend is unavailable
      if (satellites.length === 0) {
        console.warn('⚠️ Local backend returned no satellites, falling back to demo data')
        satellites = this.getDemoSatellites()
      } else {
        console.log(`🎉 Successfully loaded ${satellites.length} real satellites!`)
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: satellites,
        timestamp: Date.now()
      })

      return satellites

    } catch (error) {
      console.error('❌ Error fetching satellites:', error)
      console.log('🔄 Falling back to demo satellites')
      return this.getDemoSatellites()
    }
  }

  // SECURE: Local backend implementation - no external APIs
  async fetchFromLocalBackend({ page = null, limit = null, group = null }) {
    try {
      console.log('🔍 Attempting to fetch from enhanced satellite API...')
      
      // Check if backend is available first
      const isHealthy = await this.checkBackendHealth()
      console.log(`🏥 Backend health check: ${isHealthy}`)
      
      if (!isHealthy) {
        throw new Error('Local satellite API server is not available')
      }

      let url = `${this.localApiUrl}/api/v1/satellites`
      const params = new URLSearchParams()
      
      if (page !== null) params.append('page', page.toString())
      if (limit !== null) params.append('limit', limit.toString())
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log(`📡 Fetching satellites from: ${url}`)
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      console.log(`📊 Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`Local API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`🛰️ Received ${data.length} satellites from enhanced API`)
      
      if (Array.isArray(data) && data.length > 0) {
        const mappedData = data.map(sat => ({
          id: `local_${sat.norad_id}`,
          norad_id: sat.norad_id,
          name: sat.name,
          latitude: sat.lat_deg,
          longitude: sat.lon_deg,
          altitude: sat.alt_km,
          velocity: sat.velocity_km_s,
          type: this.categorizeSatellite(sat.name),
          status: 'active',
          source: 'local',
          timestamp: sat.timestamp
        }))
        console.log(`✅ Successfully mapped ${mappedData.length} satellites`)
        return mappedData
      }

      console.log('⚠️ No satellites received from API')
      return []
    } catch (error) {
      console.error('❌ Local API error:', error)
      return []
    }
  }

  // Local backend satellite data implementation (replaces CelesTrak)
  async fetchFromCelesTrak({ maxSatellites = 50 }) {
    try {
      // Fetch satellite data from our secure local backend instead of external CelesTrak
      const response = await this.fetchFromLocalBackend('/api/satellites', {
        limit: maxSatellites,
        source: 'celestrak'
      })

      if (response && response.satellites) {
        return response.satellites.map(sat => ({
          id: `local_${sat.norad_id}`,
          name: sat.name,
          latitude: sat.position ? sat.position.latitude : 0,
          longitude: sat.position ? sat.position.longitude : 0,
          altitude: sat.position ? sat.position.altitude : 0,
          velocity: this.calculateVelocity(sat.position ? sat.position.altitude : 550),
          type: this.categorizeSatellite(sat.name),
          status: 'active',
          source: 'local-backend',
          norad_id: sat.norad_id,
          operator: sat.operator || 'Unknown',
          inclination: sat.inclination || 0
        }))
      }

      return []
    } catch (error) {
      console.error('Local backend satellite fetch error:', error)
      return []
    }
  }

  // Parse TLE data format
  parseTLEData(tleText) {
    const lines = tleText.trim().split('\n')
    const satellites = []

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i].trim()
        const line1 = lines[i + 1]
        const line2 = lines[i + 2]

        // Extract NORAD ID from line 1
        const noradId = line1.substring(2, 7).trim()

        satellites.push({
          name,
          line1,
          line2,
          noradId
        })
      }
    }

    return satellites
  }

  // Calculate satellite position from TLE data
  calculateSatellitePosition(line1, line2, date) {
    try {
      const satrec = satellite.twoline2satrec(line1, line2)
      const positionAndVelocity = satellite.propagate(satrec, date)

      if (!positionAndVelocity.position) {
        return null
      }

      const gmst = satellite.gstime(date)
      const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst)

      return {
        latitude: satellite.degreesLat(positionGd.latitude),
        longitude: satellite.degreesLong(positionGd.longitude),
        altitude: positionGd.height,
        position: positionAndVelocity.position,
        velocity: positionAndVelocity.velocity
      }
    } catch (error) {
      console.warn('Error calculating satellite position:', error)
      return null
    }
  }

  // Categorize satellites based on name patterns
  categorizeSatellite(name) {
    const lowerName = name.toLowerCase()

    if (lowerName.includes('starlink') || lowerName.includes('oneweb')) {
      return 'communication'
    }
    if (lowerName.includes('weather') || lowerName.includes('goes') || lowerName.includes('noaa')) {
      return 'weather'
    }
    if (lowerName.includes('gps') || lowerName.includes('glonass') || lowerName.includes('galileo') || lowerName.includes('beidou')) {
      return 'navigation'
    }
    if (lowerName.includes('landsat') || lowerName.includes('sentinel') || lowerName.includes('spot')) {
      return 'earth-observation'
    }
    if (lowerName.includes('hubble') || lowerName.includes('chandra') || lowerName.includes('kepler')) {
      return 'scientific'
    }
    if (lowerName.includes('iss') || lowerName.includes('station')) {
      return 'space-station'
    }

    return 'other'
  }

  // Calculate approximate orbital velocity
  calculateVelocity(altitudeKm) {
    const earthRadius = 6371 // km
    const mu = 398600.4418 // Earth's standard gravitational parameter
    const r = earthRadius + altitudeKm
    return Math.sqrt(mu / r) // km/s
  }

  // Demo data for when APIs are unavailable
  getDemoSatellites() {
    return [
      {
        id: 'demo_001',
        name: 'Demo Earth Observer',
        latitude: 25.7617 + (Math.random() - 0.5) * 20,
        longitude: -80.1918 + (Math.random() - 0.5) * 40,
        altitude: 550 + Math.random() * 100,
        velocity: 7.66,
        type: 'earth-observation',
        status: 'active',
        source: 'demo'
      },
      {
        id: 'demo_002',
        name: 'Demo Communication Sat',
        latitude: 40.7128 + (Math.random() - 0.5) * 20,
        longitude: -74.0060 + (Math.random() - 0.5) * 40,
        altitude: 35786 + Math.random() * 1000,
        velocity: 3.07,
        type: 'communication',
        status: 'active',
        source: 'demo'
      },
      {
        id: 'demo_003',
        name: 'Demo Weather Monitor',
        latitude: 51.5074 + (Math.random() - 0.5) * 20,
        longitude: -0.1278 + (Math.random() - 0.5) * 40,
        altitude: 833 + Math.random() * 50,
        velocity: 7.45,
        type: 'weather',
        status: 'active',
        source: 'demo'
      },
      {
        id: 'demo_004',
        name: 'Demo Navigation Sat',
        latitude: 35.6762 + (Math.random() - 0.5) * 20,
        longitude: 139.6503 + (Math.random() - 0.5) * 40,
        altitude: 20200 + Math.random() * 500,
        velocity: 3.87,
        type: 'navigation',
        status: 'active',
        source: 'demo'
      },
      {
        id: 'demo_005',
        name: 'Demo Space Station',
        latitude: Math.random() * 60 - 30,
        longitude: Math.random() * 360 - 180,
        altitude: 408 + Math.random() * 20,
        velocity: 7.66,
        type: 'space-station',
        status: 'active',
        source: 'demo'
      }
    ]
  }

  // SECURE: Get ISS position from local backend
  async getISSPosition() {
    try {
      const response = await this.fetchSatelliteGroup('stations')
      const issSatellites = response.satellites?.filter(sat => 
        sat.name.toLowerCase().includes('iss') || 
        sat.name.toLowerCase().includes('international space station')
      )
      
      if (issSatellites && issSatellites.length > 0) {
        const iss = issSatellites[0]
        return {
          id: `local_${iss.norad_id}`,
          name: 'International Space Station',
          latitude: iss.lat_deg,
          longitude: iss.lon_deg,
          altitude: iss.alt_km,
          velocity: iss.velocity_km_s,
          type: 'space-station',
          status: 'active',
          source: 'local',
          timestamp: iss.timestamp
        }
      }
      
      return null
    } catch (error) {
      console.error('Local ISS fetch error:', error)
      return null
    }
  }

  // SECURE: Get satellite groups from local backend
  async fetchSatelliteGroup(groupName) {
    try {
      const response = await fetch(`${this.localApiUrl}/api/v1/groups/${groupName}`, {
        signal: AbortSignal.timeout(10000)
      })
      
      if (!response.ok) {
        throw new Error(`Group fetch error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch group ${groupName}:`, error)
      throw error
    }
  }

  // SECURE: Get satellite statistics from local backend
  async getStatistics() {
    try {
      const response = await fetch(`${this.localApiUrl}/api/v1/statistics`, {
        signal: AbortSignal.timeout(10000)
      })
      
      if (!response.ok) {
        throw new Error('Statistics fetch error')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      throw error
    }
  }

  // NEW: AI Conjunction Analysis
  async analyzeConjunctions(analysisRequest) {
    try {
      const response = await fetch(`${this.localApiUrl}/api/v1/conjunctions/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
        signal: AbortSignal.timeout(30000) // 30s timeout for analysis
      })
      
      if (!response.ok) {
        throw new Error(`Conjunction analysis failed: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Conjunction analysis failed:', error)
      throw error
    }
  }

  // NEW: Orbit Reservation Management
  async createReservation(reservationRequest) {
    try {
      const response = await fetch(`${this.localApiUrl}/api/v1/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationRequest),
        signal: AbortSignal.timeout(15000)
      })
      
      if (!response.ok) {
        throw new Error(`Reservation creation failed: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Reservation creation failed:', error)
      throw error
    }
  }

  // NEW: List orbit reservations
  async listReservations() {
    try {
      const response = await fetch(`${this.localApiUrl}/api/v1/reservations`, {
        signal: AbortSignal.timeout(10000)
      })
      
      if (!response.ok) {
        throw new Error('Reservations fetch failed')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      throw error
    }
  }

  // NEW: Check reservation conflicts
  async checkReservationConflicts(reservationId) {
    try {
      const response = await fetch(`${this.localApiUrl}/api/v1/reservations/${reservationId}/conflicts`, {
        method: 'POST',
        signal: AbortSignal.timeout(20000)
      })
      
      if (!response.ok) {
        throw new Error('Conflict check failed')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to check conflicts:', error)
      throw error
    }
  }

  // Helper: Create conjunction analysis request
  createConjunctionRequest(options = {}) {
    return {
      satellite_ids: options.satelliteIds || [],
      horizon_hours: options.windowHours || 24,
      screening_distance_km: options.distanceThreshold || 5.0,
      probability_threshold: options.probabilityThreshold || 0.001
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

export default SatelliteService