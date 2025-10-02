@echo off
echo 🚀 Starting OrbitalOS Development Environment...
echo.

REM Check if we're in the correct directory
if not exist "backend\Cargo.toml" (
    echo ❌ Error: Please run this script from the OrbitalOS root directory
    echo Expected: backend\Cargo.toml should exist
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Error: Please run this script from the OrbitalOS root directory  
    echo Expected: frontend\package.json should exist
    pause
    exit /b 1
)

echo 📡 Starting Backend API on http://localhost:8082...
echo 🌐 Starting Frontend on http://localhost:5173...
echo.
echo Press Ctrl+C to stop both services...
echo.

REM Start backend in new window
start "OrbitalOS Backend" cmd /k "cd backend && cargo run"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in new window
start "OrbitalOS Frontend" cmd /k "cd frontend && npm run dev"

echo ✅ Both services are starting in separate windows
echo 📡 Backend: http://localhost:8082
echo 🌐 Frontend: http://localhost:5173
echo.
echo Close the individual windows to stop each service.
pause