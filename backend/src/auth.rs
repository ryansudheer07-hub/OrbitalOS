use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

use crate::models::*;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    exp: usize,
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Mock user validation for demo
    let valid_users = vec![
        ("operator@orbitalos.com", "password123", UserRole::Operator),
        ("insurer@orbitalos.com", "password123", UserRole::Insurer),
        ("analyst@orbitalos.com", "password123", UserRole::Analyst),
    ];

    let user = valid_users.iter()
        .find(|(email, password, _)| email == &payload.email && password == &payload.password);

    let (email, _, role) = match user {
        Some(user) => user,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Generate JWT token
    let user_id = Uuid::new_v4();
    
    let claims = Claims {
        sub: user_id.to_string(),
        role: match role {
            UserRole::Operator => "operator".to_string(),
            UserRole::Insurer => "insurer".to_string(),
            UserRole::Analyst => "analyst".to_string(),
        },
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_ref()),
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = AuthResponse {
        token,
        user: UserInfo {
            id: user_id,
            email: email.to_string(),
            role: role.clone(),
        },
    };

    Ok(Json(response))
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Mock registration for demo
    let user_id = Uuid::new_v4();
    
    let claims = Claims {
        sub: user_id.to_string(),
        role: match payload.role {
            UserRole::Operator => "operator".to_string(),
            UserRole::Insurer => "insurer".to_string(),
            UserRole::Analyst => "analyst".to_string(),
        },
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_ref()),
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = AuthResponse {
        token,
        user: UserInfo {
            id: user_id,
            email: payload.email,
            role: payload.role,
        },
    };

    Ok(Json(response))
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, StatusCode> {
    let validation = Validation::new(Algorithm::HS256);
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    ).map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok(token_data.claims)
}