# Use the official Rust image as base
FROM rust:1.75-slim as rust-builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Cargo files
COPY orbitalos/backend/Cargo.toml orbitalos/backend/Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release

# Remove dummy main.rs and copy actual source
RUN rm src/main.rs
COPY orbitalos/backend/src ./src

# Build the application
RUN cargo build --release

# Frontend build stage
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copy package files
COPY orbitalos/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY orbitalos/frontend ./

# Build the frontend
RUN npm run build

# Final stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 orbitalos

# Set working directory
WORKDIR /app

# Copy the Rust binary
COPY --from=rust-builder /app/target/release/orbitalos-backend /app/backend

# Copy the frontend build
COPY --from=frontend-builder /app/dist /app/frontend

# Copy Cesium assets
COPY --from=frontend-builder /app/node_modules/cesium/Build/Cesium /app/frontend/cesium

# Change ownership
RUN chown -R orbitalos:orbitalos /app

# Switch to non-root user
USER orbitalos

# Expose port
EXPOSE 3000

# Set environment variables
ENV RUST_LOG=info
ENV DATABASE_URL=postgresql://orbitalos:password@db:5432/orbitalos

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["./backend"]
