@echo off
echo 🛰️  Setting up OrbitalOS Satellite API...
echo.

REM Check if Rust is installed
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Rust is not installed. Please install Rust first:
    echo    https://rustup.rs/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Setup backend
echo 🔧 Setting up backend...
cd backend

echo 📦 Installing Rust dependencies...
cargo build
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully

cd ..

REM Setup frontend
echo 🔧 Setting up frontend...
cd frontend

echo 📦 Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating frontend .env file...
    (
        echo # Cesium Ion Token ^(get free token from https://cesium.com/ion/^)
        echo VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
        echo.
        echo # Your own satellite API
        echo VITE_API_URL=http://localhost:8080
        echo.
        echo # Optional: External APIs ^(not needed for your own API^)
        echo # VITE_N2YO_API_KEY=your_n2yo_api_key_here
    ) > .env
    echo ✅ Created .env file - please add your Cesium Ion token
) else (
    echo ✅ .env file already exists
)

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo 📚 Next steps:
echo.
echo 1. Get a FREE Cesium Ion token:
echo    - Go to https://cesium.com/ion/
echo    - Sign up for free account
echo    - Copy your access token
echo    - Add it to frontend\.env file
echo.
echo 2. Start the satellite API server:
echo    cd backend
echo    cargo run --bin main_satellite
echo.
echo 3. In another terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open your browser to:
echo    http://localhost:5173
echo.
echo 📖 API Documentation:
echo    - API Docs: SATELLITE_API_DOCS.md
echo    - Setup Guide: SETUP_GUIDE.md
echo.
echo 🛰️  Your satellite API will have 150+ realistic satellites!
echo    - 100x Starlink communication satellites
echo    - 32x GPS navigation satellites
echo    - 5x Weather monitoring satellites
echo    - 20x Earth observation satellites
echo    - 1x International Space Station
echo.
echo Happy satellite tracking! 🚀
pause