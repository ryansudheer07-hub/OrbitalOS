use axum::http::header::{HeaderName, HeaderValue};
use tower_http::set_header::SetResponseHeaderLayer;
use axum::middleware::from_fn_with_state;
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
use tower_http::limit::{RequestBodyLimitLayer, RateLimitLayer};
use std::num::NonZeroU32;
use std::time::Duration;
use tracing::{info, Level};
use tracing_subscriber;

mod auth;
mod models;
mod routes;
mod n2yo_service;

use models::*;
use n2yo_service::N2YOService;

mod handlers;

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
    // --- Admin CRUD and override endpoints with admin middleware ---
    .route("/api/admin/users", get(handlers::admin_list_users).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/users/:id", get(handlers::admin_get_user).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/users/:id", post(handlers::admin_update_user).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/users/:id", axum::routing::delete(handlers::admin_delete_user).layer(from_fn_with_state(state.clone(), handlers::require_admin)))

    .route("/api/admin/providers", get(handlers::admin_list_providers).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/providers/:id", get(handlers::admin_get_provider).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/providers/:id/approve", post(handlers::admin_approve_provider).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/providers/:id/reject", post(handlers::admin_reject_provider).layer(from_fn_with_state(state.clone(), handlers::require_admin)))

    .route("/api/admin/slots", get(handlers::admin_list_slots).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/slots/:id", get(handlers::admin_get_slot).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/slots/:id/override", post(handlers::admin_override_slot).layer(from_fn_with_state(state.clone(), handlers::require_admin)))

    .route("/api/admin/bookings", get(handlers::admin_list_bookings).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/bookings/:id", get(handlers::admin_get_booking).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/bookings/:id", post(handlers::admin_update_booking).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/bookings/:id", axum::routing::delete(handlers::admin_delete_booking).layer(from_fn_with_state(state.clone(), handlers::require_admin)))

    .route("/api/admin/compliance", get(handlers::admin_list_compliance_reports).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
    .route("/api/admin/compliance/:id/review", post(handlers::admin_review_compliance_report).layer(from_fn_with_state(state.clone(), handlers::require_admin)))
        .route("/", get(health_check))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/register", post(auth::register))
        .route("/api/providers/onboard", post(handlers::onboard_provider))
        .route("/api/reservations/reserve", post(handlers::reserve_slot))
        .route("/api/reservations/confirm", post(handlers::confirm_reservation))
        .route("/api/reservations/cancel", post(handlers::cancel_reservation))
        .route("/api/launches/search", get(handlers::search_launches))
        .route("/api/bookings/book", post(handlers::book_payload))
        .route("/api/bookings/cancel", post(handlers::cancel_booking))
        .route("/api/compliance/create", post(handlers::create_compliance_report))
        .route("/api/compliance/download", post(handlers::download_compliance_report))
        .route("/ws/slots", axum::routing::get(handlers::ws_handler))
        // --- Admin CRUD and override endpoints ---
        .route("/api/admin/users", get(handlers::admin_list_users))
        .route("/api/admin/users/:id", get(handlers::admin_get_user))
        .route("/api/admin/users/:id", post(handlers::admin_update_user))
        .route("/api/admin/users/:id", axum::routing::delete(handlers::admin_delete_user))

        .route("/api/admin/providers", get(handlers::admin_list_providers))
        .route("/api/admin/providers/:id", get(handlers::admin_get_provider))
        .route("/api/admin/providers/:id/approve", post(handlers::admin_approve_provider))
        .route("/api/admin/providers/:id/reject", post(handlers::admin_reject_provider))

        .route("/api/admin/slots", get(handlers::admin_list_slots))
        .route("/api/admin/slots/:id", get(handlers::admin_get_slot))
        .route("/api/admin/slots/:id/override", post(handlers::admin_override_slot))

        .route("/api/admin/bookings", get(handlers::admin_list_bookings))
        .route("/api/admin/bookings/:id", get(handlers::admin_get_booking))
        .route("/api/admin/bookings/:id", post(handlers::admin_update_booking))
        .route("/api/admin/bookings/:id", axum::routing::delete(handlers::admin_delete_booking))

        .route("/api/admin/compliance", get(handlers::admin_list_compliance_reports))
        .route("/api/admin/compliance/:id/review", post(handlers::admin_review_compliance_report))
        // TODO: Add admin middleware to protect these endpoints
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
        .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB max body size
        .layer(RateLimitLayer::new(NonZeroU32::new(100).unwrap(), Duration::from_secs(60))) // 100 requests per minute per IP
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-frame-options"),
            HeaderValue::from_static("SAMEORIGIN"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-content-type-options"),
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-xss-protection"),
            HeaderValue::from_static("1; mode=block"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("referrer-policy"),
            HeaderValue::from_static("strict-origin-when-cross-origin"),
        ))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    info!("🚀 OrbitalOS Backend running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await?;

    Ok(())
}

use crate::db;

async fn health_check() -> impl axum::response::IntoResponse {
    let db_status = match db::get_pg_pool().await {
        Ok(pool) => {
            // Try a simple query
            let res = sqlx::query("SELECT 1").fetch_one(&pool).await;
            if res.is_ok() {
                "up"
            } else {
                "down"
            }
        },
        Err(_) => "down",
    };
    let status = if db_status == "up" { "healthy" } else { "degraded" };
    axum::Json(serde_json::json!({
        "status": status,
        "service": "orbitalos-backend",
        "version": "0.1.0",
        "db": db_status
    }))
}
use backend::handlers::onboard_provider;

let app = Router::new()
    // previous routes ...
    .route("/api/providers/onboard", post(onboard_provider))
    // other code ...
use backend::auth::jwt_auth;

let app = Router::new()
    .route("/api/auth/register", post(register_user))
    .route("/api/auth/login", post(login_user))
    .route("/api/protected_route", get(protected_handler).layer(axum::middleware::from_fn(jwt_auth)))
    .layer(axum::extract::Extension(pool));
.route("/api/auth/logout", axum::routing::get(logout_handler))
use backend::handlers::{reserve_slot, confirm_reservation, cancel_reservation};

let app = Router::new()
    // other routes...
    .route("/api/reservations/reserve", post(reserve_slot))
    .route("/api/reservations/confirm", post(confirm_reservation))
    .route("/api/reservations/cancel", post(cancel_reservation))
    .layer(axum::extract::Extension(pool));
.use backend::handlers::{search_launches, book_payload, cancel_booking}

let app = Router::new()
    // ... previous routes
    .route("/api/launches/search", get(search_launches))
    .route("/api/bookings/book", post(book_payload))
    .route("/api/bookings/cancel", post(cancel_booking))
    .layer(axum::extract::Extension(pool));
use backend::handlers::{create_compliance_report, download_compliance_report};

let app = Router::new()
    // ... other routes ...
    .route("/api/compliance/create", post(create_compliance_report))
    .route("/api/compliance/download", post(download_compliance_report))
    .layer(axum::extract::Extension(pool));
use axum::{
    extract::ws::{WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                axum::extract::ws::Message::Text(text) => {
                    // Echo or handle message from client
                    let _ = socket.send(axum::extract::ws::Message::Text(format!("Echo: {}", text))).await;
                }
                axum::extract::ws::Message::Close(_) => break,
                _ => {}
            }
        } else {
            break;
        }
    }
}

// Register the route
let app = Router::new()
    .route("/ws/slots", get(ws_handler));
use tokio::sync::broadcast;

let (tx, _rx) = broadcast::channel::<String>(16);
let shared_tx = std::sync::Arc::new(tx);

// Pass shared_tx as Extension to route handlers and ws_handler
use axum::{Router, routing::get, extract::ws::{WebSocketUpgrade, WebSocket}};
use std::sync::Arc;
use tokio::sync::broadcast;
use axum::extract::Extension;

#[tokio::main]
async fn main() {
    // Create a broadcast channel for slot update messages
    let (tx, _) = broadcast::channel::<String>(16);
    let broadcast_tx = Arc::new(tx);

    let app = Router::new()
        .route("/ws/slots", get(ws_handler))
        .layer(Extension(broadcast_tx.clone()));

    println!("Listening on http://localhost:8080");
    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(tx): Extension<Arc<broadcast::Sender<String>>>,
) -> impl axum::response::IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, tx))
}
use axum::extract::ws::{Message, WebSocket};
use tokio::sync::broadcast::error::RecvError;
use futures::{SinkExt, StreamExt};
use std::sync::Arc;

async fn handle_socket(mut socket: WebSocket, tx: Arc<broadcast::Sender<String>>) {
    // Create a new receiver from broadcast for this client
    let mut rx = tx.subscribe();

    // Split the socket into sender and receiver parts
    let (mut sender, mut receiver) = socket.split();

    // Spawn a task that forwards broadcast messages to the WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                // Client disconnected, end task
                break;
            }
        }
    });

    // Process incoming messages (optional, e.g. from clients)
    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Text(text) = msg {
            println!("Received message from client: {}", text);
            // You can handle client messages here if needed
        } else if let Message::Close(_) = msg {
            break;
        }
    }

    // If client disconnects, cancel sending task
    send_task.abort();
}
// After slot change commit
let slot_change_msg = format!("Slot updated: slot_id = {}", slot_id);
if let Err(e) = broadcast_tx.send(slot_change_msg) {
    eprintln!("Broadcast error: {}", e);
}
