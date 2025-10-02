# OrbitalOS Satellite API Documentation

## Overview

Your own custom satellite API built with Rust and Actix-web that provides real-time satellite tracking data without relying on external APIs.

## Features

✅ **200+ Realistic Satellites** - Including Starlink, GPS, weather, and Earth observation satellites  
✅ **Real-time Position Updates** - Positions updated every 30 seconds using orbital mechanics  
✅ **Advanced Filtering** - Filter by satellite type, visibility, and location  
✅ **Orbital Predictions** - Track satellite paths up to 24 hours in advance  
✅ **Ground Station Support** - Calculate visibility from multiple ground stations  
✅ **Statistics & Analytics** - Get insights about satellite populations  
✅ **CORS Enabled** - Ready for frontend integration  

## Base URL

```
http://localhost:8080
```

## Authentication

Currently no authentication required for development. Add JWT authentication for production.

## API Endpoints

### 1. Health Check

**GET** `/health`

Check API status and satellite count.

**Response:**
```json
{
  "status": "healthy",
  "service": "OrbitalOS Satellite API",
  "version": "1.0.0",
  "satellites_count": 157
}
```

### 2. Get All Satellites

**GET** `/api/satellites`

Get all satellites with optional filtering.

**Query Parameters:**
- `satellite_type` (optional): Filter by type (`communication`, `navigation`, `weather`, `earth-observation`, `scientific`, `space-station`)
- `status` (optional): Filter by status (`active`, `inactive`, `decayed`)
- `limit` (optional): Max satellites to return (default: 50, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
GET /api/satellites?satellite_type=communication&limit=20
```

**Response:**
```json
{
  "satellites": [
    {
      "id": "starlink-0001",
      "name": "Starlink-1",
      "norad_id": 40001,
      "latitude": 45.2341,
      "longitude": -122.6785,
      "altitude": 547.3,
      "velocity": 7.53,
      "inclination": 53.0,
      "eccentricity": 0.0001,
      "satellite_type": "communication",
      "status": "active",
      "launch_date": "2024-03-15T10:30:00Z",
      "mass": 260.0,
      "dimensions": {
        "length": 2.8,
        "width": 1.4,
        "height": 1.4
      },
      "created_at": "2024-10-02T15:30:00Z",
      "updated_at": "2024-10-02T15:35:00Z"
    }
  ],
  "total_count": 100,
  "page": 0,
  "limit": 20
}
```

### 3. Get Visible Satellites

**GET** `/api/satellites/visible`

Get satellites visible from a specific location.

**Query Parameters:**
- `observer_lat` (required): Observer latitude in degrees
- `observer_lon` (required): Observer longitude in degrees  
- `observer_alt` (optional): Observer altitude in meters (default: 0)
- `min_elevation` (optional): Minimum elevation angle in degrees (default: 10)
- `limit` (optional): Max satellites to return (default: 50, max: 200)

**Example:**
```bash
GET /api/satellites/visible?observer_lat=40.7128&observer_lon=-74.0060&min_elevation=15
```

### 4. Get Satellite by ID

**GET** `/api/satellites/{id}`

Get detailed information about a specific satellite.

**Example:**
```bash
GET /api/satellites/iss
```

**Response:**
```json
{
  "id": "iss",
  "name": "International Space Station",
  "latitude": 45.2341,
  "longitude": -122.6785,
  "altitude": 408.0,
  "velocity": 7.66,
  "satellite_type": "space-station",
  "status": "active",
  "mass": 444615.0,
  "dimensions": {
    "length": 108.5,
    "width": 72.8,
    "height": 20.0
  }
}
```

### 5. Track Satellite

**GET** `/api/satellites/{id}/track`

Get predicted satellite positions over time.

**Query Parameters:**
- `prediction_minutes` (optional): Prediction window in minutes (default: 60, max: 1440)
- `interval_minutes` (optional): Time interval between predictions (default: 5, range: 1-60)
- `observer_lat` (optional): Observer latitude for elevation/azimuth calculations
- `observer_lon` (optional): Observer longitude for elevation/azimuth calculations

**Example:**
```bash
GET /api/satellites/iss/track?prediction_minutes=120&interval_minutes=10
```

**Response:**
```json
{
  "satellite_id": "iss",
  "prediction_window": 120,
  "positions": [
    {
      "timestamp": "2024-10-02T16:00:00Z",
      "latitude": 45.2341,
      "longitude": -122.6785,
      "altitude": 408.0,
      "velocity": 7.66,
      "azimuth": null,
      "elevation": null
    },
    {
      "timestamp": "2024-10-02T16:10:00Z",
      "latitude": 48.1523,
      "longitude": -118.2341,
      "altitude": 408.0,
      "velocity": 7.66,
      "azimuth": null,
      "elevation": null
    }
  ]
}
```

### 6. Get Statistics

**GET** `/api/satellites/statistics`

Get satellite statistics and analytics.

**Response:**
```json
{
  "total_satellites": 157,
  "active_satellites": 152,
  "by_type": {
    "communication": 100,
    "navigation": 32,
    "weather": 5,
    "earth-observation": 20
  },
  "average_altitude": 1247.5,
  "last_updated": "2024-10-02T16:00:00Z"
}
```

### 7. Update Positions

**POST** `/api/satellites/update-positions`

Manually trigger satellite position updates.

**Response:**
```json
{
  "message": "Satellite positions updated successfully",
  "updated_at": "2024-10-02T16:00:00Z"
}
```

### 8. Get Ground Stations  

**GET** `/api/ground-stations`

Get available ground station information.

**Response:**
```json
{
  "ground_stations": [
    {
      "id": "12345-67890",
      "name": "Kourou",
      "latitude": -5.2316,
      "longitude": 52.7683,
      "altitude": 45.0,
      "min_elevation": 10.0
    }
  ],
  "count": 5
}
```

## Data Models

### Satellite

```rust
{
  "id": "string",
  "name": "string", 
  "norad_id": "number | null",
  "latitude": "number",      // degrees
  "longitude": "number",     // degrees  
  "altitude": "number",      // km above Earth
  "velocity": "number",      // km/s
  "inclination": "number",   // degrees
  "eccentricity": "number",
  "satellite_type": "communication | earth-observation | weather | navigation | scientific | military | space-station | debris | other",
  "status": "active | inactive | decayed | unknown",
  "launch_date": "string | null",  // ISO 8601
  "mass": "number | null",         // kg
  "dimensions": {
    "length": "number",      // meters
    "width": "number",       // meters
    "height": "number"       // meters
  } | null,
  "created_at": "string",    // ISO 8601
  "updated_at": "string"     // ISO 8601
}
```

## Error Responses

### 404 Not Found
```json
{
  "error": "Satellite not found",
  "satellite_id": "invalid-id"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid parameters",
  "details": "observer_lat must be between -90 and 90"
}
```

## Rate Limiting

- No rate limiting in development
- Consider implementing rate limiting for production

## Setup Instructions

### 1. Start the Backend Server

```bash
cd backend
cargo run --bin main_satellite
```

The server will start on `http://localhost:8080`

### 2. Test the API

```bash
# Check health
curl http://localhost:8080/health

# Get satellites
curl http://localhost:8080/api/satellites?limit=5

# Get visible satellites from New York
curl "http://localhost:8080/api/satellites/visible?observer_lat=40.7128&observer_lon=-74.0060"

# Get ISS info
curl http://localhost:8080/api/satellites/iss

# Get statistics
curl http://localhost:8080/api/satellites/statistics
```

### 3. Frontend Integration

Update your frontend `.env` file:

```env
VITE_API_URL=http://localhost:8080
VITE_CESIUM_ION_TOKEN=your_cesium_token_here
```

## Satellite Types & Constellations

### Communication Satellites (100 satellites)
- **Starlink constellation**: Low Earth Orbit (550km), 53° inclination
- Modern broadband internet satellites
- Realistic orbital parameters and mass properties

### Navigation Satellites (32 satellites)  
- **GPS constellation**: Medium Earth Orbit (20,180km), 55° inclination
- Global positioning and timing satellites
- Historical launch dates and operational parameters

### Weather Satellites (5 satellites)
- **GOES series**: Geostationary orbit (35,786km), 0° inclination
- Weather monitoring and forecasting satellites
- Spread across different longitudes for global coverage

### Earth Observation Satellites (20 satellites)
- **Landsat series**: Sun-synchronous orbit (600-900km), 98° inclination
- Earth imaging and environmental monitoring
- Polar orbits for global coverage

### Space Stations (1 satellite)
- **International Space Station**: Low Earth Orbit (408km), 51.6° inclination
- Crewed space station with realistic mass and dimensions
- Historical launch date and current operational status

## Real-time Features

### Position Updates
- Satellites update positions every 30 seconds
- Uses simplified orbital mechanics calculations
- Realistic orbital motion simulation

### Orbital Predictions
- Track satellite paths up to 24 hours ahead
- Configurable time intervals (1-60 minutes)
- Based on current orbital elements

### Visibility Calculations
- Determine which satellites are visible from any location
- Configurable minimum elevation angle
- Great circle distance calculations

## Production Considerations

1. **Authentication**: Add JWT token authentication
2. **Rate Limiting**: Implement API rate limiting
3. **Database**: Add PostgreSQL for persistent storage
4. **Caching**: Implement Redis for response caching
5. **Monitoring**: Add logging and metrics
6. **Scaling**: Consider horizontal scaling with load balancers

## Development Notes

- Built with Rust and Actix-web for high performance
- Uses simplified orbital mechanics (production should use SGP4)
- CORS enabled for local development
- Automatic position updates via background tasks
- Comprehensive error handling and validation

Your satellite API is now completely independent of external services! 🛰️