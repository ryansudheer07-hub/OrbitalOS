mod auth;
mod db;
mod models;

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
}

#[derive(Serialize)]
struct HealthResponse<'a> {
    status: &'a str,
    service: &'a str,
    version: &'a str,
    db: &'a str,
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

    let app_state = web::Data::new(AppState {
        db_pool: pool,
        jwt_secret,
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

    HttpResponse::Ok().json(HealthResponse {
        status: if db_status == "healthy" { "healthy" } else { "degraded" },
        service: "orbitalos-backend",
        version: env!("CARGO_PKG_VERSION"),
        db: db_status,
    })
}
