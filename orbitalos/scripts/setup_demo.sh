#!/bin/bash

# OrbitalOS Demo Setup Script
# This script sets up the complete OrbitalOS MVP environment

set -e

echo "🚀 OrbitalOS MVP Setup Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if required ports are available
check_ports() {
    local ports=(80 3000 5432)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use. You may need to stop the service using this port."
        fi
    done
}

# Create necessary directories
setup_directories() {
    print_status "Creating necessary directories..."
    mkdir -p orbitalos/infra/logs
    mkdir -p orbitalos/backend/logs
    mkdir -p orbitalos/frontend/dist
}

# Build and start services
start_services() {
    print_header "Building and starting services..."
    
    cd orbitalos/infra
    
    print_status "Building Docker images..."
    docker-compose build
    
    print_status "Starting services..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    until docker-compose exec -T db pg_isready -U orbitalos >/dev/null 2>&1; do
        sleep 2
    done
    
    print_status "Database is ready!"
}

# Seed the database
seed_database() {
    print_header "Seeding database with demo data..."
    
    cd orbitalos/infra
    
    print_status "Running database migrations and seeding..."
    docker-compose exec backend cargo run --bin seed_data
    
    print_status "Database seeded successfully!"
}

# Check service health
check_health() {
    print_header "Checking service health..."
    
    cd orbitalos/infra
    
    # Check backend health
    if curl -f http://localhost:3000/ >/dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost/ >/dev/null 2>&1; then
        print_status "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
    
    # Check database health
    if docker-compose exec -T db pg_isready -U orbitalos >/dev/null 2>&1; then
        print_status "Database is healthy"
    else
        print_warning "Database health check failed"
    fi
}

# Display access information
show_access_info() {
    print_header "🎉 OrbitalOS MVP is ready!"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:3000"
    echo "  Database: localhost:5432"
    echo ""
    echo "Demo Credentials:"
    echo "  Operator: operator@orbitalos.com / password123"
    echo "  Insurer: insurer@orbitalos.com / password123"
    echo "  Analyst: analyst@orbitalos.com / password123"
    echo ""
    echo "Useful Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo ""
}

# Main execution
main() {
    print_header "Starting OrbitalOS MVP Setup..."
    
    check_docker
    check_ports
    setup_directories
    start_services
    seed_database
    check_health
    show_access_info
    
    print_status "Setup completed successfully! 🚀"
}

# Run main function
main "$@"
