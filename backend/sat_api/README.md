# Satellite API

A high-performance Rust-based satellite tracking API that fetches real-time satellite data from Celestrak and provides live orbital positions using SGP4 propagation.

## Features

- 🛰️ **Real-time tracking** of ~9,000+ active satellites
- 🌍 **Live position calculation** using SGP4 orbital mechanics
- 📡 **Multiple data sources**: Active satellites, Starlink, GPS, Galileo
- ⚡ **High performance** with efficient caching and background updates
- 🔄 **Automatic data refresh** every 6 hours
- 📊 **RESTful API** with pagination support
- 🏗️ **Built for scale** - handles thousands of satellites per request

## Quick Start

1. **Build and run:**
   ```bash
   cd sat_api
   cargo run
   ```

2. **Test the API:**
   ```bash
   # Health check
   curl http://127.0.0.1:8080/health
   
   # Get all satellites (first 100)
   curl "http://127.0.0.1:8080/api/v1/satellites?limit=100"
   
   # Get specific satellite (ISS)
   curl http://127.0.0.1:8080/api/v1/satellite/25544
   
   # Get Starlink satellites
   curl http://127.0.0.1:8080/api/v1/groups/starlink
   ```

## API Endpoints

### Get All Satellites
```
GET /api/v1/satellites?page=0&limit=500
```
Returns paginated list of all satellites with current positions.

**Query Parameters:**
- `page` (optional): Page number (0-based)
- `limit` (optional): Results per page (default: all)

### Get Single Satellite
```
GET /api/v1/satellite/{norad_id}
```
Returns current position of specific satellite by NORAD ID.

**Example:** `/api/v1/satellite/25544` (ISS)

### Get Satellite Groups
```
GET /api/v1/groups/{name}
```
Returns satellites filtered by constellation/group.

**Supported groups:**
- `starlink` - Starlink constellation
- `gps` - GPS/NAVSTAR satellites
- `galileo` - Galileo GNSS satellites
- `iss` - International Space Station
- `weather` - Weather satellites

### Statistics
```
GET /api/v1/statistics
```
Returns API statistics and satellite counts.

### Health Check
```
GET /health
```
Returns service health status.

## Response Format

All satellite position responses follow this format:

```json
{
  "norad_id": 25544,
  "name": "ISS (ZARYA)",
  "lat_deg": 51.64,
  "lon_deg": -0.12,
  "alt_km": 408.2,
  "velocity_km_s": 7.66,
  "timestamp": "2025-10-02T10:30:00Z"
}
```

## Configuration

Environment variables:
- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Server port (default: 8080)
- `RUST_LOG`: Log level (default: info)

## Data Sources

The API fetches TLE (Two-Line Element) data from:
- **Celestrak Active Satellites**: ~9,000 satellites
- **Starlink**: ~5,000+ satellites
- **GPS Operational**: ~30 satellites
- **Galileo**: ~25 satellites

Data is automatically refreshed every 6 hours to ensure accuracy.

## Integration with OrbitalOS

This API is designed to be integrated directly into the OrbitalOS backend. To use it:

1. **Add as dependency** in your main `Cargo.toml`:
   ```toml
   sat_api = { path = "./sat_api" }
   ```

2. **Initialize in your backend:**
   ```rust
   use sat_api::SatelliteApi;
   
   let satellite_api = SatelliteApi::new();
   satellite_api.initialize().await?;
   ```

3. **Update frontend** to use local API:
   ```javascript
   const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';
   ```

## Performance Notes

- **Memory usage**: ~50-100MB for full satellite catalog
- **Response time**: <100ms for individual satellites, <2s for full catalog
- **Concurrent requests**: Supports hundreds of concurrent connections
- **Update frequency**: TLE data refreshed every 6 hours, positions calculated in real-time

## Development

```bash
# Run with debug logging
RUST_LOG=debug cargo run

# Run tests
cargo test

# Check code
cargo check

# Format code
cargo fmt
```

## Architecture

- **TLE Fetcher**: Downloads satellite data from Celestrak
- **Satellite Tracker**: Manages SGP4 propagation calculations
- **API Service**: Coordinates data updates and caching
- **HTTP Handlers**: Actix-web REST endpoints
- **Background Tasks**: Automatic data refresh