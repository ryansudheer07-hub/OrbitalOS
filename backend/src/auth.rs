use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use tracing::{info, warn};
// In-memory brute-force protection (per email)
static LOGIN_ATTEMPTS: Lazy<Arc<Mutex<HashMap<String, (u32, chrono::DateTime<chrono::Utc>)>>>> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
const MAX_ATTEMPTS: u32 = 5;
const LOCKOUT_MINUTES: i64 = 15;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    response::IntoResponse,
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
) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::models::ErrorResponse {
                error: "ValidationError".to_string(),
                message: Some(e.to_string()),
            }),
        );
    }
    use sqlx::Row;
    let pool = match crate::db::get_pg_pool().await {
        Ok(p) => p,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "DatabaseError".to_string(),
                message: Some("Could not connect to database".to_string()),
            }),
                    // Brute-force protection
                    let mut attempts = LOGIN_ATTEMPTS.lock().unwrap();
                    let now = chrono::Utc::now();
                    if let Some((count, last_fail)) = attempts.get(&payload.email) {
                        if *count >= MAX_ATTEMPTS && *last_fail + chrono::Duration::minutes(LOCKOUT_MINUTES) > now {
                            warn!("Account locked out: {}", payload.email);
                            return (
                                StatusCode::TOO_MANY_REQUESTS,
                                Json(crate::models::ErrorResponse {
                                    error: "AccountLocked".to_string(),
                                    message: Some(format!("Too many failed attempts. Try again after {} minutes.", LOCKOUT_MINUTES)),
                                }),
                            );
                        }
                    }
        ),
    };
    let user_row = match sqlx::query("SELECT id, email, password_hash, role FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await {
        Ok(Some(row)) => row,
        Ok(None) => return (
            StatusCode::UNAUTHORIZED,
            Json(crate::models::ErrorResponse {
                error: "AuthError".to_string(),
                message: Some("Invalid email or password".to_string()),
            }),
        ),
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                            // Audit log failed login
                            warn!("Failed login: {} (user not found)", payload.email);
                            // Update attempts
                            let entry = attempts.entry(payload.email.clone()).or_insert((0, now));
                            entry.0 += 1;
                            entry.1 = now;
                error: "DatabaseError".to_string(),
                message: Some("Could not query user".to_string()),
            }),
        ),
    };

    let password_hash: String = user_row.get("password_hash");
    let argon2 = Argon2::default();
    let parsed_hash = match PasswordHash::new(&password_hash) {
        Ok(h) => h,
        Err(_) => return (
            StatusCode::UNAUTHORIZED,
            Json(crate::models::ErrorResponse {
                error: "AuthError".to_string(),
                message: Some("Invalid email or password".to_string()),
            }),
        ),
    };
    if argon2.verify_password(payload.password.as_bytes(), &parsed_hash).is_err() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(crate::models::ErrorResponse {
                            warn!("Failed login: {} (invalid hash)", payload.email);
                            let entry = attempts.entry(payload.email.clone()).or_insert((0, now));
                            entry.0 += 1;
                            entry.1 = now;
                error: "AuthError".to_string(),
                message: Some("Invalid email or password".to_string()),
            }),
        );
    }

    let user_id: Uuid = user_row.get("id");
    let email: String = user_row.get("email");
    let role_str: String = user_row.get("role");
    let role = match role_str.as_str() {
                        warn!("Failed login: {} (bad password)", payload.email);
                        let entry = attempts.entry(payload.email.clone()).or_insert((0, now));
                        entry.0 += 1;
                        entry.1 = now;
        "Operator" => UserRole::Operator,
        "Insurer" => UserRole::Insurer,
        "Analyst" => UserRole::Analyst,
        _ => return (
            StatusCode::UNAUTHORIZED,
            Json(crate::models::ErrorResponse {
                error: "AuthError".to_string(),
                message: Some("Invalid user role".to_string()),
            }),
                    // Successful login: reset attempts
                    attempts.remove(&payload.email);
                    info!("Successful login: {}", payload.email);
        ),
    };

    let claims = Claims {
        sub: user_id.to_string(),
        role: role_str,
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let token = match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_ref()),
    ) {
        Ok(t) => t,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "TokenError".to_string(),
                message: Some("Failed to generate token".to_string()),
            }),
        ),
    };

    let response = AuthResponse {
        token,
        user: UserInfo {
            id: user_id,
            email,
            role,
        },
    };

    (StatusCode::OK, Json(response))
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::models::ErrorResponse {
                error: "ValidationError".to_string(),
                message: Some(e.to_string()),
            }),
        );
    }
    use sqlx::Row;
    let pool = match crate::db::get_pg_pool().await {
        Ok(p) => p,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "DatabaseError".to_string(),
                message: Some("Could not connect to database".to_string()),
            }),
        ),
    };
    // Check if user already exists
    let existing = match sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await {
        Ok(Some(_)) => true,
        Ok(None) => false,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "DatabaseError".to_string(),
                message: Some("Could not query user".to_string()),
            }),
        ),
    };
    if existing {
        return (
            StatusCode::CONFLICT,
            Json(crate::models::ErrorResponse {
                error: "Conflict".to_string(),
                message: Some("User already exists".to_string()),
            }),
        );
    }

    // Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = match argon2.hash_password(payload.password.as_bytes(), &salt) {
        Ok(h) => h.to_string(),
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "HashError".to_string(),
                message: Some("Failed to hash password".to_string()),
            }),
        ),
    };

    let user_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let role_str = match payload.role {
        UserRole::Operator => "Operator",
        UserRole::Insurer => "Insurer",
        UserRole::Analyst => "Analyst",
    };

    if let Err(_) = sqlx::query("INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)")
        .bind(user_id)
        .bind(&payload.email)
        .bind(&password_hash)
        .bind(role_str)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "DatabaseError".to_string(),
                message: Some("Failed to create user".to_string()),
            }),
        );
    }

    let claims = Claims {
        sub: user_id.to_string(),
        role: role_str.to_string(),
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let token = match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_ref()),
    ) {
        Ok(t) => t,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::ErrorResponse {
                error: "TokenError".to_string(),
                message: Some("Failed to generate token".to_string()),
            }),
        ),
    };

    let response = AuthResponse {
        token,
        user: UserInfo {
            id: user_id,
            email: payload.email,
            role: payload.role,
        },
    };

    (StatusCode::CREATED, Json(response))
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

use axum::{
    async_trait,
    extract::{FromRequestParts, TypedHeader},
    headers::{authorization::Bearer, Authorization},
    http::{request::Parts, StatusCode},
    middleware::Next,
    response::IntoResponse,
    Extension, RequestPartsExt,
};
use anyhow::Result;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: String,
}

#[async_trait]
impl<B> FromRequestParts<B> for AuthUser
where
    B: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &B) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Missing or invalid Authorization header".into()))?;

        let token_data = auth::decode_jwt(bearer.token())
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".into()))?;

        Ok(AuthUser { user_id: token_data.sub })
    }
}

pub async fn jwt_auth<B>(req: axum::http::Request<B>, next: Next<B>) -> impl IntoResponse {
    let mut parts = req.into_parts().0;

    let auth_result = AuthUser::from_request_parts(&mut parts, &()).await;
    if let Err(err) = auth_result {
        return err.into_response();
    }

    let req = axum::http::Request::from_parts(parts, req.into_parts().1);
    next.run(req).await
}
