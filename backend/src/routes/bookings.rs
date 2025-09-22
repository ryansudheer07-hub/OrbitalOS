use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use uuid::Uuid;
use chrono::Utc;

use crate::models::*;
use crate::AppState;

pub async fn get_bookings(
    State(_state): State<AppState>,
) -> Result<Json<Vec<Booking>>, StatusCode> {
    // Mock booking data for demo
    let bookings = vec![
        Booking {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            satellite_id: Uuid::new_v4(),
            operation_type: OperationType::Maneuver,
            start_time: Utc::now() + chrono::Duration::hours(2),
            end_time: Utc::now() + chrono::Duration::hours(4),
            status: BookingStatus::Approved,
            reason: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        Booking {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            satellite_id: Uuid::new_v4(),
            operation_type: OperationType::OrbitShift,
            start_time: Utc::now() + chrono::Duration::hours(6),
            end_time: Utc::now() + chrono::Duration::hours(8),
            status: BookingStatus::Rejected,
            reason: Some("Time slot conflicts with existing operations".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
    ];

    Ok(Json(bookings))
}

pub async fn get_booking(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Booking>, StatusCode> {
    // Mock booking data
    let booking = Booking {
        id,
        user_id: Uuid::new_v4(),
        satellite_id: Uuid::new_v4(),
        operation_type: OperationType::Maneuver,
        start_time: Utc::now() + chrono::Duration::hours(2),
        end_time: Utc::now() + chrono::Duration::hours(4),
        status: BookingStatus::Approved,
        reason: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    Ok(Json(booking))
}

pub async fn create_booking(
    State(_state): State<AppState>,
    Json(payload): Json<CreateBookingRequest>,
) -> Result<Json<Booking>, StatusCode> {
    // Simulate conflict checking
    let has_conflict = chrono::Utc::now().timestamp() % 3 == 0; // Random conflict for demo
    
    let booking_id = Uuid::new_v4();
    let user_id = Uuid::new_v4(); // In real app, get from JWT token
    
    let status = if has_conflict {
        BookingStatus::Rejected
    } else {
        BookingStatus::Approved
    };

    let reason = if has_conflict {
        Some("Booking conflicts with existing scheduled operations".to_string())
    } else {
        None
    };

    let booking = Booking {
        id: booking_id,
        user_id,
        satellite_id: payload.satellite_id,
        operation_type: payload.operation_type,
        start_time: payload.start_time,
        end_time: payload.end_time,
        status,
        reason,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    Ok(Json(booking))
}