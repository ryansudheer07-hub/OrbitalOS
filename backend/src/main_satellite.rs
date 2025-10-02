mod satellite_service;
mod routes;
mod auth;
mod models;

use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer, Result};
use actix_cors::Cors;
use serde::Serialize;
use std::env;
use std::sync::{Arc, Mutex};
use tokio::time::{interval, Duration};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

use satellite_service::SatelliteService;

#[derive(Clone)]
pub struct AppState {
    pub satellite_service: Arc<Mutex<SatelliteService>>,
    pub jwt_secret: String,
}

#[derive(Serialize)]
struct HealthResponse<'a> {
    status: &'a str,
    service: &'a str,
    version: &'a str,
    satellites_count: usize,
}

#[derive(Serialize)]
struct ApiInfo {
    name: String,
    version: String,
    description: String,
    endpoints: Vec<ApiEndpoint>,
}

#[derive(Serialize)]
struct ApiEndpoint {
    method: String,
    path: String,
    description: String,
}

async fn health_check(data: web::Data<AppState>) -> Result<HttpResponse> {
    let satellite_service = data.satellite_service.lock().unwrap();
    let satellites = satellite_service.get_all_satellites();
    
    let response = HealthResponse {
        status: "healthy",
        service: "OrbitalOS Satellite API",
        version: "1.0.0",
        satellites_count: satellites.len(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

async fn api_info() -> Result<HttpResponse> {
    let info = ApiInfo {
        name: "OrbitalOS Satellite API".to_string(),
        version: "1.0.0".to_string(),
        description: "Real-time satellite tracking and orbital mechanics API".to_string(),
        endpoints: vec![
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/health".to_string(),
                description: "Health check endpoint".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/satellites".to_string(),
                description: "Get all satellites with optional filtering".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/satellites/visible".to_string(),
                description: "Get satellites visible from observer location".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/satellites/{id}".to_string(),
                description: "Get specific satellite by ID".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/satellites/{id}/track".to_string(),
                description: "Get satellite tracking predictions".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/satellites/statistics".to_string(),
                description: "Get satellite statistics".to_string(),
            },
            ApiEndpoint {
                method: "POST".to_string(),
                path: "/api/satellites/update-positions".to_string(),
                description: "Manually trigger position updates".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/ground-stations".to_string(),
                description: "Get ground station information".to_string(),
            },
        ],
    };
    
    Ok(HttpResponse::Ok().json(info))
}

async fn start_position_updater(satellite_service: Arc<Mutex<SatelliteService>>) {
    let mut interval = interval(Duration::from_secs(30)); // Update every 30 seconds
    
    loop {
        interval.tick().await;
        
        {
            let mut service = satellite_service.lock().unwrap();
            service.update_satellite_positions();
        }
        
        info!("Updated satellite positions");
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    let _ = tracing::subscriber::set_global_default(subscriber);

    // Load environment variables
    dotenvy::dotenv().ok();

    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8080);

    let jwt_secret = env::var("JWT_SECRET")
        .unwrap_or_else(|_| "orbital-os-secret-key-change-in-production".to_string());

    // Initialize satellite service
    let satellite_service = Arc::new(Mutex::new(SatelliteService::new()));
    
    info!("Initializing satellite service...");
    {
        let service = satellite_service.lock().unwrap();
        let satellites = service.get_all_satellites();
        info!("Loaded {} satellites", satellites.len());
    }

    // Start background position updater
    let updater_service = Arc::clone(&satellite_service);
    tokio::spawn(async move {
        start_position_updater(updater_service).await;
    });

    let app_state = AppState {
        satellite_service: Arc::clone(&satellite_service),
        jwt_secret,
    };

    info!("Starting OrbitalOS Satellite API server on {}:{}", host, port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["Content-Type", "Authorization", "Accept"])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .route("/", web::get().to(api_info))
            .route("/health", web::get().to(health_check))
            .service(
                web::scope("/api")
                    .route("/satellites", web::get().to(routes::satellites::get_satellites))
                    .route("/satellites/visible", web::get().to(routes::satellites::get_visible_satellites))
                    .route("/satellites/statistics", web::get().to(routes::satellites::get_satellite_statistics))
                    .route("/satellites/update-positions", web::post().to(routes::satellites::update_satellite_positions))
                    .route("/satellites/{id}", web::get().to(routes::satellites::get_satellite_by_id))
                    .route("/satellites/{id}/track", web::get().to(routes::satellites::track_satellite))
                    .route("/ground-stations", web::get().to(routes::satellites::get_ground_stations))
            )
    })
    .bind(&format!("{}:{}", host, port))?
    .run()
    .await
}