# Satellite Visualizer API Integration Guide

## Overview
This guide provides information on various APIs you can use to get real satellite data for your 3D visualizer, along with implementation examples.

## Recommended APIs

### 1. N2YO.com API (Recommended - Easy to use)
**Best for**: Real-time satellite positions and tracking

**Features**:
- Real-time satellite positions
- TLE (Two-Line Element) data
- Satellite passes prediction
- Visual passes for specific locations
- Radio passes information

**Pricing**: 
- Free tier: 1000 API calls per hour
- Paid plans available for higher usage

**Example Usage**:
```javascript
const API_KEY = 'YOUR_N2YO_API_KEY'
const BASE_URL = 'https://api.n2yo.com/rest/v1/satellite'

// Get satellite positions
async function getSatellitePositions(satelliteId, observerLat, observerLng, observerAlt, seconds) {
  const url = `${BASE_URL}/positions/${satelliteId}/${observerLat}/${observerLng}/${observerAlt}/${seconds}/&apiKey=${API_KEY}`
  const response = await fetch(url)
  return response.json()
}

// Get satellites above a location
async function getSatellitesAbove(observerLat, observerLng, observerAlt, searchRadius, categoryId) {
  const url = `${BASE_URL}/above/${observerLat}/${observerLng}/${observerAlt}/${searchRadius}/${categoryId}/&apiKey=${API_KEY}`
  const response = await fetch(url)
  return response.json()
}
```

### 2. Open Notify API (Free)
**Best for**: ISS tracking and basic satellite data

**Features**:
- ISS current location
- ISS pass times
- Number of people in space
- Completely free

**Example Usage**:
```javascript
// Get ISS current position
async function getISSPosition() {
  const response = await fetch('http://api.open-notify.org/iss-now.json')
  const data = await response.json()
  return {
    latitude: parseFloat(data.iss_position.latitude),
    longitude: parseFloat(data.iss_position.longitude),
    timestamp: data.timestamp
  }
}

// Get ISS pass times
async function getISSPasses(lat, lon, alt, passes) {
  const url = `http://api.open-notify.org/iss-pass.json?lat=${lat}&lon=${lon}&alt=${alt}&n=${passes}`
  const response = await fetch(url)
  return response.json()
}
```

### 3. CelesTrak API (Free TLE Data)
**Best for**: Two-Line Element (TLE) data for orbital calculations

**Features**:
- Fresh TLE data for thousands of satellites
- Different satellite categories
- GP (General Perturbations) data
- Completely free

**Example Usage**:
```javascript
// Get TLE data for active satellites
async function getTLEData(category = 'active') {
  const response = await fetch(`https://celestrak.com/NORAD/elements/${category}.txt`)
  const tleText = await response.text()
  return parseTLEData(tleText)
}

// Parse TLE data
function parseTLEData(tleText) {
  const lines = tleText.trim().split('\n')
  const satellites = []
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      satellites.push({
        name: lines[i].trim(),
        line1: lines[i + 1],
        line2: lines[i + 2]
      })
    }
  }
  
  return satellites
}
```

### 4. Space-Track.org API (Free with Registration)
**Best for**: Official NORAD satellite catalog data

**Features**:
- Most comprehensive satellite database
- Official US military tracking data
- Historical data available
- Requires free registration

**Example Usage**:
```javascript
class SpaceTrackAPI {
  constructor(username, password) {
    this.username = username
    this.password = password
    this.baseURL = 'https://www.space-track.org'
    this.cookie = null
  }

  async login() {
    const response = await fetch(`${this.baseURL}/ajaxauth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `identity=${this.username}&password=${this.password}`
    })
    
    this.cookie = response.headers.get('set-cookie')
    return response.ok
  }

  async getLatestTLE(noradId) {
    if (!this.cookie) await this.login()
    
    const response = await fetch(
      `${this.baseURL}/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/${noradId}/orderby/TLE_LINE1 ASC/format/json`,
      {
        headers: {
          'Cookie': this.cookie
        }
      }
    )
    
    return response.json()
  }
}
```

### 5. Satellite.js Library (For Orbital Calculations)
**Best for**: Converting TLE data to satellite positions

**Installation**:
```bash
npm install satellite.js
```

**Example Usage**:
```javascript
import * as satellite from 'satellite.js'

function calculateSatellitePosition(tleLine1, tleLine2, date = new Date()) {
  // Create satellite record from TLE
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2)
  
  // Propagate satellite position
  const positionAndVelocity = satellite.propagate(satrec, date)
  
  if (!positionAndVelocity.position) {
    return null
  }
  
  // Convert to geodetic coordinates
  const gmst = satellite.gstime(date)
  const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst)
  
  return {
    latitude: satellite.degreesLat(positionGd.latitude),
    longitude: satellite.degreesLong(positionGd.longitude),
    altitude: positionGd.height, // km
    position: positionAndVelocity.position,
    velocity: positionAndVelocity.velocity
  }
}
```

## Implementation Strategy

### Step 1: Choose Your Primary API
- **For beginners**: Start with Open Notify API (ISS only) or N2YO API
- **For comprehensive data**: Use CelesTrak + Satellite.js for calculations
- **For official data**: Register with Space-Track.org

### Step 2: Set Up Environment Variables
```bash
# .env file
VITE_N2YO_API_KEY=your_n2yo_api_key
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token
VITE_SPACETRACK_USERNAME=your_username
VITE_SPACETRACK_PASSWORD=your_password
```

### Step 3: Implement Data Fetching Service
```javascript
// satelliteService.js
class SatelliteService {
  constructor() {
    this.n2yoApiKey = import.meta.env.VITE_N2YO_API_KEY
  }

  async fetchActiveSatellites(observerLat = 0, observerLng = 0, observerAlt = 0, searchRadius = 90) {
    try {
      // Try N2YO API first
      if (this.n2yoApiKey) {
        return await this.fetchFromN2YO(observerLat, observerLng, observerAlt, searchRadius)
      }
      
      // Fallback to CelesTrak + calculations
      return await this.fetchFromCelesTrak()
      
    } catch (error) {
      console.error('Failed to fetch satellite data:', error)
      // Return demo data as final fallback
      return this.getDemoData()
    }
  }

  async fetchFromN2YO(lat, lng, alt, radius) {
    const url = `https://api.n2yo.com/rest/v1/satellite/above/${lat}/${lng}/${alt}/${radius}/0/&apiKey=${this.n2yoApiKey}`
    const response = await fetch(url)
    const data = await response.json()
    
    return data.above.map(sat => ({
      id: sat.satid,
      name: sat.satname,
      latitude: sat.satlat,
      longitude: sat.satlng,
      altitude: sat.satalt,
      type: this.categorizeByName(sat.satname)
    }))
  }

  async fetchFromCelesTrak() {
    const response = await fetch('https://celestrak.com/NORAD/elements/active.txt')
    const tleText = await response.text()
    const tleData = this.parseTLE(tleText)
    
    // Calculate positions for current time
    const now = new Date()
    return tleData.slice(0, 50).map(tle => {
      const position = calculateSatellitePosition(tle.line1, tle.line2, now)
      return {
        id: tle.noradId,
        name: tle.name,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        type: this.categorizeByName(tle.name)
      }
    }).filter(sat => sat.latitude !== null)
  }

  categorizeByName(name) {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('starlink')) return 'communication'
    if (lowerName.includes('weather')) return 'weather'
    if (lowerName.includes('gps') || lowerName.includes('glonass')) return 'navigation'
    if (lowerName.includes('landsat') || lowerName.includes('sentinel')) return 'earth-observation'
    return 'other'
  }

  getDemoData() {
    // Your demo data here
    return []
  }
}
```

## Security Best Practices

1. **Never expose API keys in client code**
2. **Use environment variables**
3. **Implement server-side proxy for sensitive APIs**
4. **Add rate limiting to prevent abuse**
5. **Cache responses to reduce API calls**

## Rate Limiting Considerations

- N2YO: 1000 calls/hour (free tier)
- CelesTrak: No official limits, but be respectful
- Space-Track: Rate limited, check documentation
- Open Notify: No official limits

## Next Steps

1. Choose your preferred API based on your needs
2. Sign up for API keys where required
3. Replace the demo data in the visualizer with real API calls
4. Add error handling and fallback mechanisms
5. Implement caching to improve performance
6. Add more satellite categories and filtering options

## Additional Resources

- [N2YO API Documentation](https://www.n2yo.com/api/)
- [CelesTrak Data Formats](https://celestrak.com/NORAD/documentation/)
- [Space-Track.org](https://www.space-track.org/)
- [Satellite.js Documentation](https://github.com/shashwatak/satellite-js)
- [Cesium Ion Assets](https://cesium.com/platform/cesium-ion/)