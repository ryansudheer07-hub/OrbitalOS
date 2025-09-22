use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{info, Level};
use tracing_subscriber;

mod auth;
mod models;
mod routes;
mod n2yo_service;

use models::*;
use n2yo_service::N2YOService;

#[derive(Clone)]
pub struct AppState {
    pub jwt_secret: String,
    pub n2yo_service: N2YOService,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    // Load environment variables
    dotenv::dotenv().ok();

    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string());

    let n2yo_api_key = std::env::var("N2YO_API_KEY")
        .unwrap_or_else(|_| "589P8Q-SDRYX8-L842ZD-5Z9".to_string()); // Demo key from N2YO docs

    // Create application state
    let state = AppState {
        jwt_secret,
        n2yo_service: N2YOService::new(n2yo_api_key),
    };

    // Build our application with routes
    let app = Router::new()
        .route("/", get(health_check))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/register", post(auth::register))
        .route("/api/satellites", get(routes::satellites::get_satellites))
        .route("/api/satellites/:id", get(routes::satellites::get_satellite))
        .route("/api/risk/predict", post(routes::risk::predict_risk))
        .route("/api/bookings", get(routes::bookings::get_bookings))
        .route("/api/bookings", post(routes::bookings::create_booking))
        .route("/api/bookings/:id", get(routes::bookings::get_booking))
        .route("/api/dashboard/stats", get(routes::dashboard::get_stats))
        .route("/api/alerts", get(routes::alerts::get_alerts))
        .route("/api/alerts/:id", post(routes::alerts::acknowledge_alert))
        .route("/api/satellites/:id/tle", get(routes::satellites::get_tle))
        .route("/api/satellites/:id/positions", get(routes::satellites::get_positions))
        .route("/api/satellites/:id/passes", get(routes::satellites::get_passes))
        .route("/api/satellites/above", get(routes::satellites::get_above))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    info!("🚀 OrbitalOS Backend running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "orbitalos-backend",
        "version": "0.1.0"
    }))
}