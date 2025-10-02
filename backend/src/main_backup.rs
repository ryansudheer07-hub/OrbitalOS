mod auth;
mod db;
mod models;
mod tle_cache;
mod satellite_service;
mod satellite_routes;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer};
use dotenvy::dotenv;
use serde::Serialize;
use sqlx::PgPool;
use std::env;
use tracing::{error, info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PgPool,
    pub jwt_secret: String,
    pub satellite_service: std::sync::Arc<std::sync::Mutex<satellite_service::SatelliteService>>,
}

#[derive(Serialize)]
struct HealthResponse<'a> {
    status: &'a str,
    service: &'a str,
    version: &'a str,
    db: &'a str,
    satellites: usize,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    let _ = tracing::subscriber::set_global_default(subscriber);

    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in the environment");

    let jwt_secret = env::var("JWT_SECRET")
        .unwrap_or_else(|_| "change-me-in-production".to_string());

    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    if let Ok(passphrase) = env::var("PG_ENCRYPTION_PASSPHRASE") {
        match sqlx::query("SELECT set_config('app.encryption_key', $1, false)")
            .bind(passphrase)
            .execute(&pool)
            .await
        {
            Ok(_) => info!("🔐 pgcrypto session encryption key configured"),
            Err(err) => error!("failed to configure pgcrypto encryption key: {err}"),
        }
    }

    if let Err(err) = sqlx::migrate!("./migrations").run(&pool).await {
        panic!("Failed to run database migrations: {err}");
    }

    info!("✅ Database migrations executed successfully");

    // Initialize satellite service
    let satellite_service = std::sync::Arc::new(std::sync::Mutex::new(
        satellite_service::SatelliteService::new()
    ));
    
    info!("🛰️ Initialized satellite service with {} satellites", 
          satellite_service.lock().unwrap().get_all_satellites().len());

    let app_state = web::Data::new(AppState {
        db_pool: pool,
        jwt_secret,
        satellite_service,
    });

    tokio::spawn(async {
        tle_cache::start_background_task().await;
    });

    info!("🚀 OrbitalOS backend (Actix) listening on http://{}:{}", host, port);

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .wrap(Logger::default())
            .wrap(Cors::permissive())
            .route("/", web::get().to(health_check))
            .route("/health", web::get().to(health_check))
            .route("/api/auth/login", web::post().to(auth::login))
            .route("/api/auth/register", web::post().to(auth::register))
            .service(tle_cache::routes())
            // Satellite API routes
            .route("/api/satellites", web::get().to(satellite_routes::get_satellites))
            .route("/api/satellites/visible", web::get().to(satellite_routes::get_visible_satellites))
            .route("/api/satellites/statistics", web::get().to(satellite_routes::get_satellite_statistics))
            .route("/api/satellites/update-positions", web::post().to(satellite_routes::update_satellite_positions))
            .route("/api/satellites/{id}", web::get().to(satellite_routes::get_satellite_by_id))
            .route("/api/satellites/{id}/track", web::get().to(satellite_routes::track_satellite))
            .route("/api/ground-stations", web::get().to(satellite_routes::get_ground_stations))
    })
    .bind((host.as_str(), port))?
    .run()
    .await
}

async fn health_check(state: web::Data<AppState>) -> HttpResponse {
    let db_status = match sqlx::query_scalar::<_, i64>("SELECT 1")
        .fetch_one(&state.db_pool)
        .await
    {
        Ok(_) => "healthy",
        Err(err) => {
            error!("database health check failed: {err}");
            "degraded"
        }
    };

    let satellite_count = state.satellite_service.lock().unwrap().get_all_satellites().len();

    HttpResponse::Ok().json(HealthResponse {
        status: if db_status == "healthy" { "healthy" } else { "degraded" },
        service: "orbitalos-backend",
        version: env!("CARGO_PKG_VERSION"),
        db: db_status,
        satellites: satellite_count,
    })
}
