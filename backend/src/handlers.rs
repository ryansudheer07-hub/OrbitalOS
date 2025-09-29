use tracing::info;
    info!("ADMIN: List users endpoint called");
    info!("ADMIN: Get user endpoint called: {}", _id);
    info!("ADMIN: Update user endpoint called: {}", _id);
    info!("ADMIN: Delete user endpoint called: {}", _id);
    info!("ADMIN: List providers endpoint called");
    info!("ADMIN: Get provider endpoint called: {}", _id);
    info!("ADMIN: Approve provider endpoint called: {}", _id);
    info!("ADMIN: Reject provider endpoint called: {}", _id);
    info!("ADMIN: List slots endpoint called");
    info!("ADMIN: Get slot endpoint called: {}", _id);
    info!("ADMIN: Override slot endpoint called: {}", _id);
    info!("ADMIN: List bookings endpoint called");
    info!("ADMIN: Get booking endpoint called: {}", _id);
    info!("ADMIN: Update booking endpoint called: {}", _id);
    info!("ADMIN: Delete booking endpoint called: {}", _id);
    info!("ADMIN: List compliance reports endpoint called");
    info!("ADMIN: Review compliance report endpoint called: {}", _id);
// --- Admin role check middleware ---
use axum::{extract::Extension, http::Request, middleware::Next, response::IntoResponse};
use crate::auth::Claims;
use jsonwebtoken::{decode, DecodingKey, Validation};
use axum::headers::{authorization::Bearer, Authorization};
use axum::extract::TypedHeader;

pub async fn require_admin<B>(
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Extension(jwt_secret): Extension<String>,
    req: Request<B>,
    next: Next<B>,
) -> impl IntoResponse {
    let token = bearer.token();
    let claims = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_ref()),
        &Validation::default(),
    );
    match claims {
        Ok(data) if data.claims.role == "admin" => next.run(req).await,
        _ => (axum::http::StatusCode::FORBIDDEN, "Admin access required").into_response(),
    }
}
// --- Admin CRUD and override handler stubs ---
use axum::{extract::{Path, Json}, http::StatusCode};

pub async fn admin_list_users() -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("List users: Not implemented".to_string()),
    }))
}
pub async fn admin_get_user(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Get user: Not implemented".to_string()),
    }))
}
pub async fn admin_update_user(Path(_id): Path<String>, Json(_): Json<()>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Update user: Not implemented".to_string()),
    }))
}
pub async fn admin_delete_user(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Delete user: Not implemented".to_string()),
    }))
}

pub async fn admin_list_providers() -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("List providers: Not implemented".to_string()),
    }))
}
pub async fn admin_get_provider(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Get provider: Not implemented".to_string()),
    }))
}
pub async fn admin_approve_provider(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Approve provider: Not implemented".to_string()),
    }))
}
pub async fn admin_reject_provider(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Reject provider: Not implemented".to_string()),
    }))
}

pub async fn admin_list_slots() -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("List slots: Not implemented".to_string()),
    }))
}
pub async fn admin_get_slot(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Get slot: Not implemented".to_string()),
    }))
}
pub async fn admin_override_slot(Path(_id): Path<String>, Json(_): Json<()>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Override slot: Not implemented".to_string()),
    }))
}

pub async fn admin_list_bookings() -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("List bookings: Not implemented".to_string()),
    }))
}
pub async fn admin_get_booking(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Get booking: Not implemented".to_string()),
    }))
}
pub async fn admin_update_booking(Path(_id): Path<String>, Json(_): Json<()>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Update booking: Not implemented".to_string()),
    }))
}
pub async fn admin_delete_booking(Path(_id): Path<String>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Delete booking: Not implemented".to_string()),
    }))
}

pub async fn admin_list_compliance_reports() -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("List compliance reports: Not implemented".to_string()),
    }))
}
pub async fn admin_review_compliance_report(Path(_id): Path<String>, Json(_): Json<()>) -> impl axum::response::IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, axum::Json(crate::models::ErrorResponse {
        error: "NotImplemented".to_string(),
        message: Some("Review compliance report: Not implemented".to_string()),
    }))
}
    use axum::{
    extract::{Extension, Json},
    http::StatusCode,
    response::IntoResponse,
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{auth, db, models::*};

#[derive(Deserialize)]
pub struct RegisterUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct RegisterUserResponse {
    pub id: Uuid,
    pub username: String,
    pub email: String,
}

pub async fn register_user(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<RegisterUserRequest>,
) -> impl IntoResponse {
    // Check if user exists
    let existing = sqlx::query!("SELECT id FROM users WHERE email = $1", payload.email)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if existing.is_some() {
        return (StatusCode::CONFLICT, "User with email already exists").into_response();
    }

    // Hash password
    let password_hash = match auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Password hashing failed").into_response(),
    };

    // Insert user
    let user_id = Uuid::new_v4();
    let role_id = 1; // assuming 1 is default user role
    let res = sqlx::query!(
        "INSERT INTO users (id, username, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4, $5)",
        user_id, payload.username, payload.email, password_hash, role_id,
    )
    .execute(&pool)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create user").into_response();
    }

    let response = RegisterUserResponse {
        id: user_id,
        username: payload.username,
        email: payload.email,
    };

    (StatusCode::CREATED, Json(response)).into_response()
}

#[derive(Deserialize)]
pub struct LoginUserRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginUserResponse {
    pub token: String,
}

pub async fn login_user(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<LoginUserRequest>,
) -> impl IntoResponse {
    let user = sqlx::query!(
        "SELECT id, password_hash FROM users WHERE email = $1",
        payload.email
    )
    .fetch_optional(&pool)
    .await;

    let user = match user {
        Ok(Some(user)) => user,
        _ => return (StatusCode::UNAUTHORIZED, "Invalid email or password").into_response(),
    };

    let valid = auth::verify_password(&user.password_hash, &payload.password);
    if valid.is_err() || !valid.unwrap() {
        return (StatusCode::UNAUTHORIZED, "Invalid email or password").into_response();
    }

    let token = match auth::create_jwt(&user.id.to_string()) {
        Ok(t) => t,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate token").into_response(),
    };

    (StatusCode::OK, Json(LoginUserResponse { token })).into_response()
}
use axum::{extract::Extension, Json};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use crate::encryption;

#[derive(Deserialize)]
pub struct ProviderOnboardRequest {
    pub user_id: Uuid,
    pub metadata: String, // JSON or plain text metadata
}

pub async fn onboard_provider(
    Extension(pool): Extension<sqlx::PgPool>,
    Json(payload): Json<ProviderOnboardRequest>,
) -> impl IntoResponse {
    let aes_key = std::env::var("AES_256_KEY").expect("AES_256_KEY must be set");
    let key_bytes = aes_key.as_bytes();
    if key_bytes.len() != 32 {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Invalid AES key length").into_response();
    }
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&key_bytes[0..32]);

    let encrypted_metadata = match encryption::encrypt_metadata(&key_arr, payload.metadata.as_bytes()) {
        Ok(ciphertext) => ciphertext,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to encrypt metadata").into_response(),
    };

    // Check if provider already exists for user
    let exists = sqlx::query!("SELECT id FROM providers WHERE user_id = $1", payload.user_id)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if exists.is_some() {
        return (StatusCode::CONFLICT, "Provider already onboarded").into_response();
    }

    let provider_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    let res = sqlx::query!(
        "INSERT INTO providers (id, user_id, metadata_encrypted, created_at)
         VALUES ($1, $2, $3, $4)",
        provider_id, payload.user_id, encrypted_metadata, now,
    )
    .execute(&pool)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to onboard provider").into_response();
    }

    (StatusCode::CREATED, Json("Provider onboarded successfully")).into_response()
}
    use axum::{
    response::{IntoResponse, Response},
    http::{header, StatusCode},
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use serde_json::json;

pub async fn logout_handler() -> impl IntoResponse {
    let cookie = Cookie::build("token", "")
        .path("/")
        .max_age(time::Duration::hours(-1)) // Expire cookie immediately
        .same_site(SameSite::Lax)
        .http_only(true)
        .finish();

    let mut response = Response::new(json!({"status": "success"}).to_string().into());
    response.headers_mut().insert(
        header::SET_COOKIE,
        cookie.to_string().parse().unwrap(),
    );

    (StatusCode::OK, response)
}
    use axum::{response::IntoResponse, Json, extract::Extension, http::StatusCode};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(serde::Deserialize)]
pub struct ReserveSlotRequest {
    pub slot_id: Uuid,
    pub user_id: Uuid,
}

pub async fn reserve_slot(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<ReserveSlotRequest>,
) -> impl IntoResponse {
    let mut tx = pool.begin().await.unwrap();

    // Lock the slot row FOR UPDATE
    let slot = sqlx::query!("SELECT status FROM orbital_slots WHERE id = $1 FOR UPDATE", payload.slot_id)
        .fetch_one(&mut tx)
        .await;

    let slot = match slot {
        Ok(s) => s,
        Err(_) => return (StatusCode::NOT_FOUND, "Slot not found").into_response(),
    };

    if slot.status != "available" {
        return (StatusCode::CONFLICT, "Slot not available").into_response();
    }

    // Insert reservation
    let reservation_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let expires_at = now + chrono::Duration::minutes(15); // 15 min expiry

    let res = sqlx::query!(
        "INSERT INTO reservations (id, slot_id, user_id, confirmed, reserved_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)",
        reservation_id, payload.slot_id, payload.user_id, false, now, expires_at,
    )
    .execute(&mut tx)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to reserve slot").into_response();
    }

    // Update slot status to "reserved"
    let res = sqlx::query!(
        "UPDATE orbital_slots SET status = 'reserved' WHERE id = $1",
        payload.slot_id
    )
    .execute(&mut tx)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update slot status").into_response();
    }

    tx.commit().await.unwrap();

    (StatusCode::OK, "Slot reserved, please confirm within 15 minutes").into_response()
}
    #[derive(serde::Deserialize)]
pub struct ConfirmReservationRequest {
    pub reservation_id: Uuid,
}

pub async fn confirm_reservation(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<ConfirmReservationRequest>,
) -> impl IntoResponse {
    let mut tx = pool.begin().await.unwrap();

    // Fetch reservation for update
    let resv = sqlx::query!(
        "SELECT confirmed, expires_at, slot_id FROM reservations WHERE id = $1 FOR UPDATE",
        payload.reservation_id
    )
    .fetch_optional(&mut tx)
    .await;

    let resv = match resv {
        Ok(Some(r)) => r,
        _ => return (StatusCode::NOT_FOUND, "Reservation not found").into_response(),
    };

    let now = chrono::Utc::now();
    if resv.expires_at < now {
        return (StatusCode::BAD_REQUEST, "Reservation expired").into_response();
    }

    if resv.confirmed {
        return (StatusCode::CONFLICT, "Reservation already confirmed").into_response();
    }

    // Update reservation as confirmed
    let res = sqlx::query!(
        "UPDATE reservations SET confirmed = TRUE WHERE id = $1",
        payload.reservation_id
    )
    .execute(&mut tx)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to confirm reservation").into_response();
    }

    // Update slot status to "booked"
    let res = sqlx::query!(
        "UPDATE orbital_slots SET status = 'booked' WHERE id = $1",
        resv.slot_id
    )
    .execute(&mut tx)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update slot status").into_response();
    }

    tx.commit().await.unwrap();

    (StatusCode::OK, "Reservation confirmed").into_response()
}
#[derive(serde::Deserialize)]
pub struct CancelReservationRequest {
    pub reservation_id: Uuid,
}

pub async fn cancel_reservation(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CancelReservationRequest>,
) -> impl IntoResponse {
    let mut tx = pool.begin().await.unwrap();

    // Fetch reservation for update
    let resv = sqlx::query!(
        "SELECT slot_id FROM reservations WHERE id = $1 FOR UPDATE",
        payload.reservation_id
    )
    .fetch_optional(&mut tx)
    .await;

    let resv = match resv {
        Ok(Some(r)) => r,
        _ => return (StatusCode::NOT_FOUND, "Reservation not found").into_response(),
    };

    // Delete reservation
    let res = sqlx::query!("DELETE FROM reservations WHERE id = $1", payload.reservation_id)
        .execute(&mut tx)
        .await;
    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to cancel reservation").into_response();
    }

    // Update slot status to "available"
    let res = sqlx::query!(
        "UPDATE orbital_slots SET status = 'available' WHERE id = $1",
        resv.slot_id
    )
    .execute(&mut tx)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update slot status").into_response();
    }

    tx.commit().await.unwrap();

    (StatusCode::OK, "Reservation canceled").into_response()
}
use axum::{extract::Query, response::IntoResponse};

#[derive(Deserialize)]
pub struct SearchLaunchesParams {
    pub orbit_type: Option<String>,
    pub launch_date_from: Option<chrono::NaiveDate>,
    pub launch_date_to: Option<chrono::NaiveDate>,
}

pub async fn search_launches(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<SearchLaunchesParams>,
) -> impl IntoResponse {
    let mut query = String::from("SELECT * FROM launches WHERE 1=1");
    if let Some(ref orbit) = params.orbit_type {
        query.push_str(" AND orbit_type = $1");
    }
    // For simplicity, param binding can be improved with sqlx macros or query builder
    
    let launches = sqlx::query_as::<_, Launch>(&query)
        .fetch_all(&pool)
        .await;

    match launches {
        Ok(results) => (axum::http::StatusCode::OK, axum::Json(results)).into_response(),
        Err(_) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "DB error").into_response(),
    }
}
#[derive(Deserialize)]
pub struct BookPayloadRequest {
    pub launch_id: Uuid,
    pub user_id: Uuid,
    pub payload_description: String,
}

pub async fn book_payload(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<BookPayloadRequest>,
) -> impl IntoResponse {
    let booking_id = Uuid::new_v4();
    let booking_date = chrono::Utc::now();

    let res = sqlx::query!(
        "INSERT INTO bookings (id, launch_id, user_id, payload_description, booking_date, status) 
        VALUES ($1, $2, $3, $4, $5, 'booked')",
        booking_id, payload.launch_id, payload.user_id, payload.payload_description, booking_date,
    )
    .execute(&pool)
    .await;

    if res.is_err() {
        return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to book payload").into_response();
    }

    (axum::http::StatusCode::OK, "Payload booked successfully").into_response()
}
#[derive(Deserialize)]
pub struct CancelBookingRequest {
    pub booking_id: Uuid,
}

pub async fn cancel_booking(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CancelBookingRequest>,
) -> impl IntoResponse {
    let res = sqlx::query!(
        "UPDATE bookings SET status = 'cancelled' WHERE id = $1",
        payload.booking_id
    )
    .execute(&pool)
    .await;

    if res.is_err() {
        return (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to cancel booking").into_response();
    }

    (axum::http::StatusCode::OK, "Booking cancelled successfully").into_response()
}
use axum::{extract::Extension, Json};
use uuid::Uuid;
use crate::encryption;

#[derive(Deserialize)]
pub struct CreateComplianceReportRequest {
    pub provider_id: Uuid,
    pub report_text: String,
}

pub async fn create_compliance_report(
    Extension(pool): Extension<sqlx::PgPool>,
    Json(payload): Json<CreateComplianceReportRequest>,
) -> impl IntoResponse {
    let pdf_bytes = match generate_pdf_report(&payload.report_text) {
        Ok(data) => data,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate PDF").into_response(),
    };

    let aes_key = std::env::var("AES_256_KEY").expect("AES_256_KEY must be set");
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&aes_key.as_bytes()[0..32]);

    let encrypted_pdf = encryption::encrypt_metadata(&key_arr, &pdf_bytes).unwrap();

    let report_id = Uuid::new_v4();
    let report_date = chrono::Utc::now();

    let res = sqlx::query!(
        "INSERT INTO compliance_reports (id, provider_id, report_date, encrypted_pdf)
         VALUES ($1, $2, $3, $4)",
        report_id,
        payload.provider_id,
        report_date,
        encrypted_pdf
    )
    .execute(&pool)
    .await;

    if res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to save report").into_response();
    }

    (StatusCode::CREATED, "Compliance report created").into_response()
}
#[derive(Deserialize)]
pub struct DownloadComplianceRequest {
    pub report_id: Uuid,
}

pub async fn download_compliance_report(
    Extension(pool): Extension<sqlx::PgPool>,
    Json(payload): Json<DownloadComplianceRequest>,
) -> impl IntoResponse {
    let row = sqlx::query!(
        "SELECT encrypted_pdf FROM compliance_reports WHERE id = $1",
        payload.report_id
    )
    .fetch_one(&pool)
    .await;

    if row.is_err() {
        return (StatusCode::NOT_FOUND, "Report not found").into_response();
    }

    let encrypted_pdf = row.unwrap().encrypted_pdf;

    let aes_key = std::env::var("AES_256_KEY").expect("AES_256_KEY must be set");
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&aes_key.as_bytes()[0..32]);

    let pdf_bytes = match encryption::decrypt_metadata(&key_arr, &encrypted_pdf) {
        Ok(data) => data,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to decrypt PDF").into_response(),
    };

    axum::response::Response::builder()
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", "attachment; filename=compliance_report.pdf")
        .body(axum::body::boxed(axum::body::Full::from(pdf_bytes)))
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to build response"))
}
