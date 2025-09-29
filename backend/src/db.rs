use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let mut url = database_url.to_string();
    if !url.contains("sslmode") {
        if url.contains('?') {
            url.push_str("&sslmode=require");
        } else {
            url.push_str("?sslmode=require");
        }
    }

    PgPoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(600))
        .connect(&url)
        .await
}
