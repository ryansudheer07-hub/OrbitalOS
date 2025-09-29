#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provider {
    pub id: Uuid,
    pub user_id: Uuid,
    pub metadata_encrypted: Vec<u8>,
    pub created_at: DateTime<Utc>,
}
use serde::{Deserialize, Serialize};
use validator::Validate;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    Operator,
    Insurer,
    Analyst,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Satellite {
    pub id: Uuid,
    pub norad_id: i32,
    pub name: String,
    pub operator: String,
    pub altitude: f64,
    pub inclination: f64,
    pub eccentricity: f64,
    pub right_ascension: f64,
    pub argument_of_perigee: f64,
    pub mean_anomaly: f64,
    pub mean_motion: f64,
    pub epoch: DateTime<Utc>,
    pub tle_line1: String,
    pub tle_line2: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub id: Uuid,
    pub satellite_id: Uuid,
    pub risk_score: f64,
    pub risk_level: RiskLevel,
    pub collision_probability: f64,
    pub closest_approach_time: DateTime<Utc>,
    pub closest_approach_distance: f64,
    pub suggested_maneuver: Option<String>,
    pub assessed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskLevel {
    Safe,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Booking {
    pub id: Uuid,
    pub user_id: Uuid,
    pub satellite_id: Uuid,
    pub operation_type: OperationType,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub status: BookingStatus,
    pub reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OperationType {
    OrbitShift,
    PayloadActivation,
    LaunchWindow,
    Maneuver,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BookingStatus {
    Pending,
    Approved,
    Rejected,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub alert_type: AlertType,
    pub title: String,
    pub message: String,
    pub severity: AlertSeverity,
    pub is_acknowledged: bool,
    pub created_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    CollisionRisk,
    BookingApproved,
    BookingRejected,
    ManeuverRecommendation,
    SystemAlert,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
    pub role: UserRole,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub role: UserRole,
}

#[derive(Debug, Deserialize)]
pub struct RiskPredictionRequest {
    pub satellite_id: Uuid,
    pub time_horizon_hours: i32,
}

#[derive(Debug, Serialize)]
pub struct RiskPredictionResponse {
    pub risk_score: f64,
    pub risk_level: RiskLevel,
    pub collision_probability: f64,
    pub closest_approach_time: DateTime<Utc>,
    pub closest_approach_distance: f64,
    pub suggested_maneuver: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBookingRequest {
    pub satellite_id: Uuid,
    pub operation_type: OperationType,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub active_satellites: i64,
    pub critical_risks_24h: i64,
    pub bookings_blocked_24h: i64,
    pub total_conjunctions: i64,
    pub risk_trends: Vec<RiskTrend>,
}

#[derive(Debug, Serialize)]
pub struct RiskTrend {
    pub date: String,
    pub risk_count: i64,
    pub operator: String,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Launch {
    pub id: uuid::Uuid,
    pub provider_id: uuid::Uuid,
    pub launch_name: String,
    pub launch_date: chrono::DateTime<chrono::Utc>,
    pub orbit_type: String,
    pub payload_capacity_kg: i32,
    // other fields from Launch Library 2 API as needed
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Booking {
    pub id: uuid::Uuid,
    pub launch_id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub payload_description: String,
    pub booking_date: chrono::DateTime<chrono::Utc>,
    pub status: String, // e.g. "booked", "cancelled"
}
#[derive(Serialize, Deserialize, FromRow)]
pub struct ComplianceReport {
    pub id: uuid::Uuid,
    pub provider_id: uuid::Uuid,
    pub report_date: chrono::DateTime<chrono::Utc>,
    pub encrypted_pdf: Vec<u8>,   // AES-256 encrypted PDF file bytes
}
