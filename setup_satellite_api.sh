#!/bin/bash

echo "🛰️  Setting up OrbitalOS Satellite API..."
echo ""

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Add required dependencies to Cargo.toml
echo "📦 Installing Rust dependencies..."
cargo build

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

# Setup frontend  
echo "🔧 Setting up frontend..."
cd frontend

echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cat > .env << EOL
# Cesium Ion Token (get free token from https://cesium.com/ion/)
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here

# Your own satellite API
VITE_API_URL=http://localhost:8080

# Optional: External APIs (not needed for your own API)
# VITE_N2YO_API_KEY=your_n2yo_api_key_here
EOL
    echo "✅ Created .env file - please add your Cesium Ion token"
else
    echo "✅ .env file already exists"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Get a FREE Cesium Ion token:"
echo "   - Go to https://cesium.com/ion/"
echo "   - Sign up for free account"
echo "   - Copy your access token"
echo "   - Add it to frontend/.env file"
echo ""
echo "2. Start the satellite API server:"
echo "   cd backend"
echo "   cargo run --bin main_satellite"
echo ""
echo "3. In another terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo "📖 API Documentation:"
echo "   - API Docs: SATELLITE_API_DOCS.md"
echo "   - Setup Guide: SETUP_GUIDE.md"
echo ""
echo "🛰️  Your satellite API will have 150+ realistic satellites!"
echo "   - 100x Starlink communication satellites"
echo "   - 32x GPS navigation satellites"  
echo "   - 5x Weather monitoring satellites"
echo "   - 20x Earth observation satellites"
echo "   - 1x International Space Station"
echo ""
echo "Happy satellite tracking! 🚀"