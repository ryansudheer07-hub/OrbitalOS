# Live Satellite Tracking Setup

## N2YO API Integration

The visualizer now uses the N2YO API for live satellite tracking. Here's how to set it up:

### 1. Get Your API Key
1. Visit [N2YO.com](https://www.n2yo.com/api/)
2. Sign up for a free account 
3. Get your API key from the dashboard
4. Free tier includes 1000 API calls per hour

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Add your API key:
```
VITE_N2YO_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

### 3. Enhanced Earth Textures
The visualizer now includes:
- **Blue Marble Next Generation** - High-resolution day imagery
- **Earth at Night** - City lights and night imagery  
- **Enhanced atmosphere** - Improved lighting and glow effects
- **Water effects** - Realistic ocean rendering

### 4. Satellite Features
- **Live ISS tracking** - Real position updates every minute
- **Color-coded satellites** - ISS (red), Starlink (teal), OneWeb (blue)
- **Enhanced orbit traces** - Glowing orbital paths
- **Scalable icons** - Distance-based scaling
- **Fallback mode** - Demo data when API is unavailable

### 5. Available Endpoints
The N2YO API provides:
- Satellite positions
- Visual passes
- TLE data
- Above location queries
- Radio passes

### 6. Demo Mode
If no API key is provided, the app falls back to:
- Simulated satellite positions
- Random orbital movements
- Demo ISS, Starlink, and OneWeb satellites

## SGP4 Integration

The backend now includes SGP4 propagation for:
- **Conflict prediction** - Identify potential collisions
- **Launch window analysis** - Optimal timing recommendations  
- **Orbital parameter calculation** - Precise trajectory modeling
- **Real-time position updates** - Accurate satellite tracking

## Getting Started

1. Set up your API key (optional)
2. Run `npm run dev` in the frontend directory
3. Navigate to the Visualizer from the header
4. Watch live satellites orbit Earth in enhanced 3D

The system works without an API key using demo data, but live tracking requires the N2YO API key.