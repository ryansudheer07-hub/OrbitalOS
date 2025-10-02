# 🚀 OrbitalOS Development Server

## Quick Start Options

### Option 1: NPM Scripts (Recommended) ⭐
```bash
# From the frontend directory
cd frontend
npm run start:full
```
This runs both backend and frontend with colored output and prefixes.

### Option 2: PowerShell Script
```powershell
# From the root directory
.\start-dev.ps1
```
Runs both services in the same terminal with job management.

### Option 3: Batch Script (Windows)
```cmd
# From the root directory
start-dev.bat
```
Opens both services in separate terminal windows.

### Option 4: Manual (Separate Terminals)
**Terminal 1 - Backend:**
```bash
cd backend
cargo run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Service URLs
- 🦀 **Backend API**: http://localhost:8082
  - Health Check: http://localhost:8082/health
  - API Info: http://localhost:8082/api/info
  - Satellites: http://localhost:8082/api/satellites

- ⚛️ **Frontend**: http://localhost:5173
  - Main App: http://localhost:5173
  - Visualizer: http://localhost:5173/visualizer

## Features Available
✅ 22,174+ Satellites from Celestrak  
✅ Real-time orbital mechanics  
✅ AI Conjunction Analysis  
✅ 3D Cesium Visualization  
✅ Risk Assessment & Alerts  
✅ Orbit Reservations  
✅ Secure localhost-only communication  

## Stopping Services
- **NPM Scripts**: Press `Ctrl+C` in the terminal
- **PowerShell Script**: Press `Ctrl+C` in the terminal
- **Batch Script**: Close the individual terminal windows
- **Manual**: Press `Ctrl+C` in each terminal