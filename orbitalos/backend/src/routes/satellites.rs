use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use uuid::Uuid;
use chrono::Utc;
use serde::Deserialize;

use crate::models::*;
use crate::AppState;
use crate::n2yo_service::*;

pub async fn get_satellites(
    State(_state): State<AppState>,
) -> Result<Json<Vec<Satellite>>, StatusCode> {
    // Mock satellite data for demo
    let satellites = vec![
        Satellite {
            id: Uuid::new_v4(),
            norad_id: 40001,
            name: "Starlink-1001".to_string(),
            operator: "SpaceX".to_string(),
            altitude: 550.0,
            inclination: 53.0,
            eccentricity: 0.0001,
            right_ascension: 0.0,
            argument_of_perigee: 0.0,
            mean_anomaly: 0.0,
            mean_motion: 15.04,
            epoch: Utc::now(),
            tle_line1: "1 40001U 24001A   24001.00000000  .00000000  00000-0  00000+0 0  9999".to_string(),
            tle_line2: "2 40001  53.0000 180.0000 0001000   0.0000 359.0000 15.04000000 10001".to_string(),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        Satellite {
            id: Uuid::new_v4(),
            norad_id: 40002,
            name: "OneWeb-001".to_string(),
            operator: "OneWeb".to_string(),
            altitude: 1200.0,
            inclination: 87.4,
            eccentricity: 0.0001,
            right_ascension: 0.0,
            argument_of_perigee: 0.0,
            mean_anomaly: 0.0,
            mean_motion: 14.2,
            epoch: Utc::now(),
            tle_line1: "1 40002U 24002A   24002.00000000  .00000000  00000-0  00000+0 0  9999".to_string(),
            tle_line2: "2 40002  87.4000 180.0000 0001000   0.0000 359.0000 14.20000000 10002".to_string(),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
        Satellite {
            id: Uuid::new_v4(),
            norad_id: 40003,
            name: "ISS".to_string(),
            operator: "NASA".to_string(),
            altitude: 408.0,
            inclination: 51.6,
            eccentricity: 0.0001,
            right_ascension: 0.0,
            argument_of_perigee: 0.0,
            mean_anomaly: 0.0,
            mean_motion: 15.5,
            epoch: Utc::now(),
            tle_line1: "1 40003U 24003A   24003.00000000  .00000000  00000-0  00000+0 0  9999".to_string(),
            tle_line2: "2 40003  51.6000 180.0000 0001000   0.0000 359.0000 15.50000000 10003".to_string(),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        },
    ];

    Ok(Json(satellites))
}

pub async fn get_satellite(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Satellite>, StatusCode> {
    // Mock satellite data - in real app, this would query the database
    let satellite = Satellite {
        id,
        norad_id: 40001,
        name: "Starlink-1001".to_string(),
        operator: "SpaceX".to_string(),
        altitude: 550.0,
        inclination: 53.0,
        eccentricity: 0.0001,
        right_ascension: 0.0,
        argument_of_perigee: 0.0,
        mean_anomaly: 0.0,
        mean_motion: 15.04,
        epoch: Utc::now(),
        tle_line1: "1 40001U 24001A   24001.00000000  .00000000  00000-0  00000+0 0  9999".to_string(),
        tle_line2: "2 40001  53.0000 180.0000 0001000   0.0000 359.0000 15.04000000 10001".to_string(),
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    Ok(Json(satellite))
}

#[derive(Deserialize)]
pub struct PositionQuery {
    pub lat: f64,
    pub lng: f64,
    pub alt: Option<f64>,
    pub seconds: Option<i32>,
}

#[derive(Deserialize)]
pub struct PassesQuery {
    pub lat: f64,
    pub lng: f64,
    pub alt: Option<f64>,
    pub days: Option<i32>,
    pub min_visibility: Option<i32>,
}

#[derive(Deserialize)]
pub struct AboveQuery {
    pub lat: f64,
    pub lng: f64,
    pub alt: Option<f64>,
    pub radius: Option<i32>,
    pub category: Option<i32>,
}

// Get TLE data for a satellite
pub async fn get_tle(
    State(state): State<AppState>,
    Path(norad_id): Path<i32>,
) -> Result<Json<N2YOTLEResponse>, StatusCode> {
    match state.n2yo_service.get_tle(norad_id).await {
        Ok(tle_data) => Ok(Json(tle_data)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Get real-time positions for a satellite
pub async fn get_positions(
    State(state): State<AppState>,
    Path(norad_id): Path<i32>,
    Query(params): Query<PositionQuery>,
) -> Result<Json<N2YOPositionsResponse>, StatusCode> {
    let alt = params.alt.unwrap_or(0.0);
    let seconds = params.seconds.unwrap_or(60);
    
    match state.n2yo_service.get_positions(norad_id, params.lat, params.lng, alt, seconds).await {
        Ok(positions) => Ok(Json(positions)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Get visual passes for a satellite
pub async fn get_passes(
    State(state): State<AppState>,
    Path(norad_id): Path<i32>,
    Query(params): Query<PassesQuery>,
) -> Result<Json<N2YOPassesResponse>, StatusCode> {
    let alt = params.alt.unwrap_or(0.0);
    let days = params.days.unwrap_or(7);
    let min_visibility = params.min_visibility.unwrap_or(300);
    
    match state.n2yo_service.get_visual_passes(norad_id, params.lat, params.lng, alt, days, min_visibility).await {
        Ok(passes) => Ok(Json(passes)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Get satellites currently above observer
pub async fn get_above(
    State(state): State<AppState>,
    Query(params): Query<AboveQuery>,
) -> Result<Json<Vec<N2YOSatelliteInfo>>, StatusCode> {
    let alt = params.alt.unwrap_or(0.0);
    let radius = params.radius.unwrap_or(90);
    let category = params.category.unwrap_or(0);
    
    match state.n2yo_service.get_above(params.lat, params.lng, alt, radius, category).await {
        Ok(satellites) => Ok(Json(satellites)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}