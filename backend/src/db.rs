use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;
use anyhow::Result;

pub async fn get_pg_pool() -> Result<PgPool> {
    let mut database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    if !database_url.contains("sslmode") {
        if database_url.contains('?') {
            database_url.push_str("&sslmode=require");
        } else {
            database_url.push_str("?sslmode=require");
        }
    }
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;
    Ok(pool)
}
use sendgrid::v3::*;

async fn send_email(to: &str, subject: &str, content: &str, sendgrid_api_key: &str) -> Result<(), Box<dyn std::error::Error>> {
    let sender = Sender::new(sendgrid_api_key);
    let email = Message::new()
        .add_to(to)
        .add_content(Content::new().set_content_type("text/plain").set_value(content))
        .set_from("noreply@orbitalos.com")
        .set_subject(subject);
    sender.send(&email).await?;
    Ok(())
}
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    service_name TEXT NOT NULL,
    encrypted_key BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
