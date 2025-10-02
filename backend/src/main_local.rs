mod satellite_service;

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
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    version: &'static str,
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
    let service = data.satellite_service.lock().unwrap();
    let satellites = service.get_satellites();
    
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
                path: "/api/info".to_string(),
                description: "API information".to_string(),
            },
            ApiEndpoint {
                method: "GET".to_string(),
                path: "/api/satellites".to_string(),
                description: "Get satellite data".to_string(),
            },
            ApiEndpoint {
                method: "POST".to_string(),
                path: "/api/satellites/conjunction-analysis".to_string(),
                description: "Analyze satellite conjunctions".to_string(),
            },
            ApiEndpoint {
                method: "POST".to_string(),
                path: "/api/satellites/create-reservation".to_string(),
                description: "Create orbit reservation".to_string(),
            },
        ],
    };
    
    Ok(HttpResponse::Ok().json(info))
}

// Satellite API routes
async fn get_satellites(data: web::Data<AppState>) -> Result<HttpResponse> {
    let service = data.satellite_service.lock().unwrap();
    let satellites = service.get_satellites();
    
    let response = serde_json::json!({
        "satellites": satellites,
        "count": satellites.len()
    });
    
    Ok(HttpResponse::Ok().json(response))
}

async fn analyze_conjunctions(
    data: web::Data<AppState>,
    req: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let service = data.satellite_service.lock().unwrap();
    let analysis = service.analyze_conjunctions(&req);
    
    Ok(HttpResponse::Ok().json(analysis))
}

async fn create_reservation(
    data: web::Data<AppState>,
    req: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let service = data.satellite_service.lock().unwrap();
    let result = service.create_reservation(&req);
    
    Ok(HttpResponse::Ok().json(result))
}

async fn start_position_updater(satellite_service: Arc<Mutex<SatelliteService>>) {
    let mut interval = interval(Duration::from_secs(30)); // Update every 30 seconds
    
    loop {
        interval.tick().await;
        
        let mut service = satellite_service.lock().unwrap();
        service.update_positions();
        
        let satellites = service.get_satellites();
        info!("Updated positions for {} satellites", satellites.len());
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    let _ = tracing::subscriber::set_global_default(subscriber);

    let host = env::var("HOST").unwrap_or_else(|_| "localhost".to_string());
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8082);

    // Initialize satellite service
    let satellite_service = Arc::new(Mutex::new(SatelliteService::new()));
    
    info!("Initializing satellite service...");
    
    // Load initial satellite data
    {
        let mut service = satellite_service.lock().unwrap();
        service.initialize().await.expect("Failed to initialize satellite service");
    }
    
    info!("Satellite service initialized with satellite data");

    // Start background position updater
    let updater_service = Arc::clone(&satellite_service);
    tokio::spawn(async move {
        start_position_updater(updater_service).await;
    });

    let app_state = AppState {
        satellite_service: Arc::clone(&satellite_service),
    };

    info!("Starting OrbitalOS Satellite API server on {}:{}", host, port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .wrap(Logger::default())
            .wrap(cors)
            .route("/health", web::get().to(health_check))
            .route("/api/info", web::get().to(api_info))
            .route("/api/satellites", web::get().to(get_satellites))
            .route("/api/satellites/conjunction-analysis", web::post().to(analyze_conjunctions))
            .route("/api/satellites/create-reservation", web::post().to(create_reservation))
    })
    .bind((host, port))?
    .run()
    .await
}