use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};

use crate::models::*;
use crate::AppState;

pub async fn get_stats(
    State(_state): State<AppState>,
) -> Result<Json<DashboardStats>, StatusCode> {
    // Generate mock dashboard stats for demo
    let risk_trends = vec![
        RiskTrend {
            date: "2024-01-01".to_string(),
            risk_count: 12,
            operator: "SpaceX".to_string(),
        },
        RiskTrend {
            date: "2024-01-02".to_string(),
            risk_count: 8,
            operator: "SpaceX".to_string(),
        },
        RiskTrend {
            date: "2024-01-03".to_string(),
            risk_count: 15,
            operator: "OneWeb".to_string(),
        },
        RiskTrend {
            date: "2024-01-04".to_string(),
            risk_count: 6,
            operator: "SpaceX".to_string(),
        },
        RiskTrend {
            date: "2024-01-05".to_string(),
            risk_count: 22,
            operator: "OneWeb".to_string(),
        },
    ];

    let stats = DashboardStats {
        active_satellites: 150,
        critical_risks_24h: 3,
        bookings_blocked_24h: 7,
        total_conjunctions: 45,
        risk_trends,
    };

    Ok(Json(stats))
}