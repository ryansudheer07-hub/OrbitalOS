use actix_web::{web, HttpResponse, Responder};
use argon2::{password_hash::{rand_core::OsRng, SaltString}, Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;
use validator::Validate;

use crate::{AppState, models::{AuthResponse, ErrorResponse, LoginRequest, RegisterRequest, UserInfo, UserRole}};

const TOKEN_TTL_HOURS: i64 = 24;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
}

pub async fn login(state: web::Data<AppState>, payload: web::Json<LoginRequest>) -> impl Responder {
    if let Err(err) = payload.validate() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "ValidationError".into(),
            message: Some(err.to_string()),
        });
    }

    let row = match sqlx::query(
        "SELECT id, role, password_hash FROM users WHERE app_security.sym_decrypt(email_encrypted) = $1"
    )
    .bind(&payload.email)
    .fetch_optional(&state.db_pool)
    .await
    {
        Ok(Some(row)) => row,
        Ok(None) => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "AuthError".into(),
                message: Some("Invalid email or password".into()),
            });
        }
        Err(err) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: "DatabaseError".into(),
                message: Some(err.to_string()),
            });
        }
    };

    let stored_hash: String = row.get("password_hash");
    let parsed_hash = match PasswordHash::new(&stored_hash) {
        Ok(hash) => hash,
        Err(_) => {
            return HttpResponse::Unauthorized().json(ErrorResponse {
                error: "AuthError".into(),
                message: Some("Invalid email or password".into()),
            });
        }
    };

    if Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return HttpResponse::Unauthorized().json(ErrorResponse {
            error: "AuthError".into(),
            message: Some("Invalid email or password".into()),
        });
    }

    let user_id: Uuid = row.get("id");
    let role: String = row.get("role");

    let claims = Claims {
        sub: user_id.to_string(),
        role: role.clone(),
        exp: (Utc::now() + Duration::hours(TOKEN_TTL_HOURS)).timestamp() as usize,
    };

    let token = match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    ) {
        Ok(token) => token,
        Err(err) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: "TokenError".into(),
                message: Some(err.to_string()),
            });
        }
    };

    let response = AuthResponse {
        token,
        user: UserInfo {
            id: user_id,
            email: payload.email.clone(),
            role: match role.as_str() {
                "Insurer" => UserRole::Insurer,
                "Analyst" => UserRole::Analyst,
                _ => UserRole::Operator,
            },
        },
    };

    HttpResponse::Ok().json(response)
}

pub async fn register(state: web::Data<AppState>, payload: web::Json<RegisterRequest>) -> impl Responder {
    if let Err(err) = payload.validate() {
        return HttpResponse::BadRequest().json(ErrorResponse {
            error: "ValidationError".into(),
            message: Some(err.to_string()),
        });
    }

    let salt = SaltString::generate(&mut OsRng);
    let password_hash = match Argon2::default().hash_password(payload.password.as_bytes(), &salt) {
        Ok(hash) => hash.to_string(),
        Err(err) => {
            return HttpResponse::InternalServerError().json(ErrorResponse {
                error: "HashError".into(),
                message: Some(err.to_string()),
            });
        }
    };

    let now = Utc::now();
    let role_label = match payload.role {
        UserRole::Insurer => "Insurer",
        UserRole::Analyst => "Analyst",
        UserRole::Operator => "Operator",
    };

    let result = sqlx::query(
        "INSERT INTO users (email_encrypted, email_iv, password_hash, role, created_at, updated_at)
         VALUES (app_security.sym_encrypt($1), gen_random_bytes(16), $2, $3, $4, $5)"
    )
    .bind(&payload.email)
    .bind(password_hash)
    .bind(role_label)
    .bind(now)
    .bind(now)
    .execute(&state.db_pool)
    .await;

    if let Err(err) = result {
        return HttpResponse::InternalServerError().json(ErrorResponse {
            error: "DatabaseError".into(),
            message: Some(err.to_string()),
        });
    }

    HttpResponse::Created().json(serde_json::json!({
        "status": "registered"
    }))
}

#[allow(dead_code)]
pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
}

#[allow(dead_code)]
pub fn verify_password(hash: &str, password: &str) -> Result<bool, argon2::password_hash::Error> {
    let parsed = PasswordHash::new(hash)?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

#[allow(dead_code)]
pub fn create_jwt(subject: &str, role: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let claims = Claims {
        sub: subject.to_string(),
        role: role.to_string(),
        exp: (Utc::now() + Duration::hours(TOKEN_TTL_HOURS)).timestamp() as usize,
    };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
}

#[allow(dead_code)]
pub fn decode_jwt(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let data = decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &Validation::new(Algorithm::HS256))?;
    Ok(data.claims)
}
