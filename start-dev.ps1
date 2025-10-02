# OrbitalOS Development Server Startup Script
# This script starts both the Rust backend and React frontend simultaneously

Write-Host "🚀 Starting OrbitalOS Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (!(Test-Path "backend\Cargo.toml") -or !(Test-Path "frontend\package.json")) {
    Write-Host "❌ Error: Please run this script from the OrbitalOS root directory" -ForegroundColor Red
    Write-Host "Expected structure:" -ForegroundColor Yellow
    Write-Host "  - backend\Cargo.toml" -ForegroundColor Yellow
    Write-Host "  - frontend\package.json" -ForegroundColor Yellow
    exit 1
}

# Function to start backend
$backendJob = Start-Job -ScriptBlock {
    param($BackendPath)
    Set-Location $BackendPath
    Write-Host "🦀 Starting Rust Satellite API on http://localhost:8082..." -ForegroundColor Yellow
    cargo run
} -ArgumentList (Get-Location).Path + "\backend"

# Function to start frontend
$frontendJob = Start-Job -ScriptBlock {
    param($FrontendPath)
    Set-Location $FrontendPath
    Write-Host "⚛️  Starting React Frontend on http://localhost:5173..." -ForegroundColor Blue
    npm run dev
} -ArgumentList (Get-Location).Path + "\frontend"

Write-Host "🔧 Backend starting..." -ForegroundColor Yellow
Write-Host "🔧 Frontend starting..." -ForegroundColor Blue
Write-Host ""
Write-Host "📡 Backend API will be available at: http://localhost:8082" -ForegroundColor Green
Write-Host "🌐 Frontend will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both services..." -ForegroundColor Cyan
Write-Host ""

# Wait for jobs and display output
try {
    while ($backendJob.State -eq "Running" -or $frontendJob.State -eq "Running") {
        # Get backend output
        $backendOutput = Receive-Job -Job $backendJob -Keep
        if ($backendOutput) {
            Write-Host "[BACKEND] $backendOutput" -ForegroundColor Yellow
        }
        
        # Get frontend output  
        $frontendOutput = Receive-Job -Job $frontendJob -Keep
        if ($frontendOutput) {
            Write-Host "[FRONTEND] $frontendOutput" -ForegroundColor Blue
        }
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host ""
    Write-Host "🛑 Stopping services..." -ForegroundColor Red
    Stop-Job -Job $backendJob, $frontendJob -Force
    Remove-Job -Job $backendJob, $frontendJob -Force
    Write-Host "✅ Services stopped successfully!" -ForegroundColor Green
}