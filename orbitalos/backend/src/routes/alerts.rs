use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use uuid::Uuid;
use chrono::Utc;

use crate::models::*;
use crate::AppState;

pub async fn get_alerts(
    State(_state): State<AppState>,
) -> Result<Json<Vec<Alert>>, StatusCode> {
    // Mock alert data for demo
    let alerts = vec![
        Alert {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::new_v4()),
            alert_type: AlertType::CollisionRisk,
            title: "Critical Collision Risk Detected".to_string(),
            message: "Satellite Starlink-1001 has a high probability of collision with debris object DEBRIS-001".to_string(),
            severity: AlertSeverity::Critical,
            is_acknowledged: false,
            created_at: Utc::now() - chrono::Duration::hours(2),
            acknowledged_at: None,
        },
        Alert {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::new_v4()),
            alert_type: AlertType::ManeuverRecommendation,
            title: "Maneuver Recommendation".to_string(),
            message: "Recommended orbital adjustment for OneWeb-001 to avoid future conjunctions".to_string(),
            severity: AlertSeverity::Warning,
            is_acknowledged: true,
            created_at: Utc::now() - chrono::Duration::hours(6),
            acknowledged_at: Some(Utc::now() - chrono::Duration::hours(1)),
        },
        Alert {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::new_v4()),
            alert_type: AlertType::SystemAlert,
            title: "System Maintenance".to_string(),
            message: "Scheduled maintenance window: 2024-01-15 02:00-04:00 UTC".to_string(),
            severity: AlertSeverity::Info,
            is_acknowledged: false,
            created_at: Utc::now() - chrono::Duration::hours(12),
            acknowledged_at: None,
        },
    ];

    Ok(Json(alerts))
}

pub async fn acknowledge_alert(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Alert>, StatusCode> {
    // Mock alert acknowledgment
    let alert = Alert {
        id,
        user_id: Some(Uuid::new_v4()),
        alert_type: AlertType::CollisionRisk,
        title: "Critical Collision Risk Detected".to_string(),
        message: "Satellite Starlink-1001 has a high probability of collision with debris object DEBRIS-001".to_string(),
        severity: AlertSeverity::Critical,
        is_acknowledged: true,
        created_at: Utc::now() - chrono::Duration::hours(2),
        acknowledged_at: Some(Utc::now()),
    };

    Ok(Json(alert))
}