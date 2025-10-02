use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;

use actix_web::{web, HttpResponse, Responder};
use anyhow::{anyhow, Context, Result};
use chrono::{DateTime, Duration, Utc};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use sgp4::prelude::*;
use tokio::sync::RwLock;

use crate::AppState;

const CELESTRAK_URL: &str = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json";
const EARTH_RADIUS_KM: f64 = 6378.137;
const LEO_ALTITUDE_LIMIT_KM: f64 = 2000.0;
const SAFE_RADIUS_KM: f64 = 50.0;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrbitEntry {
    pub norad_id: i64,
    pub name: String,
    pub epoch: DateTime<Utc>,
    pub inclination_deg: f64,
    pub mean_motion_rev_per_day: f64,
    pub eccentricity: f64,
    pub semimajor_axis_km: f64,
    pub perigee_km: f64,
    pub apogee_km: f64,
    pub arg_perigee_deg: f64,
    pub raan_deg: f64,
    pub mean_anomaly_deg: f64,
    pub tle_line1: String,
    pub tle_line2: String,
}

#[derive(Debug, Deserialize)]
struct CelestrakRecord {
    #[serde(rename = "OBJECT_NAME")]
    object_name: String,
    #[serde(rename = "NORAD_CAT_ID")]
    norad_cat_id: i64,
    #[serde(rename = "EPOCH")]
    epoch: DateTime<Utc>,
    #[serde(rename = "INCLINATION")]
    inclination: f64,
    #[serde(rename = "ECCENTRICITY")]
    eccentricity: f64,
    #[serde(rename = "MEAN_MOTION")]
    mean_motion: f64,
    #[serde(rename = "SEMIMAJOR_AXIS")]
    semimajor_axis: f64,
    #[serde(rename = "PERIGEE")]
    perigee: f64,
    #[serde(rename = "APOGEE")]
    apogee: f64,
    #[serde(rename = "ARG_OF_PERICENTER")]
    arg_perigee: f64,
    #[serde(rename = "RA_OF_ASC_NODE")]
    raan: f64,
    #[serde(rename = "MEAN_ANOMALY")]
    mean_anomaly: f64,
    #[serde(rename = "TLE_LINE1")]
    tle_line1: String,
    #[serde(rename = "TLE_LINE2")]
    tle_line2: String,
}

#[derive(Debug, Serialize)]
struct OrbitRefreshResponse {
    count: usize,
    last_updated: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct OrbitListResponse {
    pub entries: Vec<OrbitEntry>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct LaunchAnalysisRequest {
    pub launch_vehicle: String,
    pub launch_time: DateTime<Utc>,
    pub desired_altitude_km: f64,
    pub desired_inclination_deg: f64,
    pub launch_site_lat_deg: f64,
    pub launch_site_lon_deg: f64,
    pub payload_mass_kg: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct LaunchAnalysisResponse {
    pub requested_window_start: DateTime<Utc>,
    pub requested_window_end: DateTime<Utc>,
    pub recommended_window_start: DateTime<Utc>,
    pub recommended_window_end: DateTime<Utc>,
    pub conflicts: Vec<OrbitConflict>,
}

#[derive(Debug, Serialize)]
pub struct OrbitConflict {
    pub norad_id: i64,
    pub name: String,
    pub time_utc: DateTime<Utc>,
    pub miss_distance_km: f64,
    pub relative_speed_km_s: f64,
}

pub async fn refresh_cache(state: web::Data<AppState>) -> impl Responder {
    match fetch_and_store(&state).await {
        Ok(entries) => HttpResponse::Ok().json(OrbitRefreshResponse {
            count: entries.len(),
            last_updated: Utc::now(),
        }),
        Err(err) => {
            HttpResponse::build(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR)
                .body(format!("failed to refresh orbit cache: {err}"))
        }
    }
}

pub async fn list_cached(state: web::Data<AppState>) -> impl Responder {
    ensure_cache(&state).await;

    let cache = state.orbit_cache.read().await;
    let entries = cache.clone();

    HttpResponse::Ok().json(OrbitListResponse {
        last_updated: state
            .orbit_cache_last_updated
            .read()
            .await
            .unwrap_or_else(Utc::now),
        entries,
    })
}

pub async fn analyze_launch(
    state: web::Data<AppState>,
    payload: web::Json<LaunchAnalysisRequest>,
) -> impl Responder {
    if ensure_cache(&state).await.is_err() {
        return HttpResponse::build(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR)
            .body("orbit cache unavailable");
    }

    match compute_launch_analysis(&state, &payload).await {
        Ok(response) => HttpResponse::Ok().json(response),
        Err(err) => HttpResponse::build(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR)
            .body(format!("failed to analyze launch: {err}")),
    }
}

async fn ensure_cache(state: &web::Data<AppState>) -> Result<()> {
    {
        let cache = state.orbit_cache.read().await;
        if !cache.is_empty() {
            return Ok(());
        }
    }

    fetch_and_store(state).await.map(|_| ())
}

async fn fetch_and_store(state: &web::Data<AppState>) -> Result<Vec<OrbitEntry>> {
    let response = reqwest::get(CELESTRAK_URL)
        .await
        .context("failed to request celestrak feed")?;

    if response.status() != StatusCode::OK {
        return Err(anyhow!("celestrak responded with status {}", response.status()));
    }

    let body: Vec<CelestrakRecord> = response
        .json()
        .await
        .context("unable to parse celestrak response")?;

    let entries: Vec<OrbitEntry> = body
        .into_iter()
        .filter(|record| {
            (record.semimajor_axis - EARTH_RADIUS_KM) > 0.0
                && (record.semimajor_axis - EARTH_RADIUS_KM) < LEO_ALTITUDE_LIMIT_KM
        })
        .map(|record| OrbitEntry {
            norad_id: record.norad_cat_id,
            name: record.object_name,
            epoch: record.epoch,
            inclination_deg: record.inclination,
            mean_motion_rev_per_day: record.mean_motion,
            eccentricity: record.eccentricity,
            semimajor_axis_km: record.semimajor_axis,
            perigee_km: record.perigee,
            apogee_km: record.apogee,
            arg_perigee_deg: record.arg_perigee,
            raan_deg: record.raan,
            mean_anomaly_deg: record.mean_anomaly,
            tle_line1: record.tle_line1,
            tle_line2: record.tle_line2,
        })
        .collect();

    {
        let mut cache = state.orbit_cache.write().await;
        *cache = entries.clone();
    }

    {
        let mut updated = state.orbit_cache_last_updated.write().await;
        *updated = Some(Utc::now());
    }

    write_csv(&state.orbit_cache_path, &entries)?;

    Ok(entries)
}

fn write_csv(path: &PathBuf, entries: &[OrbitEntry]) -> Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).context("failed to create cache directory")?;
    }

    let mut writer = csv::Writer::from_path(path).context("unable to open csv")?;
    for entry in entries {
        writer.serialize(entry).context("failed to serialize orbit entry")?;
    }
    writer.flush().context("failed to flush csv writer")?;

    Ok(())
}

async fn compute_launch_analysis(
    state: &web::Data<AppState>,
    payload: &LaunchAnalysisRequest,
) -> Result<LaunchAnalysisResponse> {
    let launch_start = payload.launch_time;
    let launch_end = launch_start + Duration::minutes(30);

    let cache = state.orbit_cache.read().await;

    let mut conflicts = Vec::new();

    for entry in cache.iter() {
        if let Ok(propagation) = propagate_to_time(entry, launch_start) {
            let altitude = propagation.position.norm() - EARTH_RADIUS_KM;
            if (altitude - payload.desired_altitude_km).abs() < SAFE_RADIUS_KM
                && (entry.inclination_deg - payload.desired_inclination_deg).abs() < 2.0
            {
                conflicts.push(OrbitConflict {
                    norad_id: entry.norad_id,
                    name: entry.name.clone(),
                    time_utc: launch_start,
                    miss_distance_km: (altitude - payload.desired_altitude_km).abs(),
                    relative_speed_km_s: propagation.velocity.norm(),
                });
            }
        }
    }

    let (recommended_start, recommended_end) = if conflicts.is_empty() {
        (launch_start, launch_end)
    } else {
        (launch_end, launch_end + Duration::minutes(30))
    };

    Ok(LaunchAnalysisResponse {
        requested_window_start: launch_start,
        requested_window_end: launch_end,
        recommended_window_start: recommended_start,
        recommended_window_end: recommended_end,
        conflicts,
    })
}

struct PropagationResult {
    position: Vector3<f64>,
    velocity: Vector3<f64>,
}

fn propagate_to_time(entry: &OrbitEntry, timestamp: DateTime<Utc>) -> Result<PropagationResult> {
    let elements = Elements::from_tle(&entry.tle_line1, &entry.tle_line2)?;
    let propagator = sgp4::SGP4::from_elements(elements)?;
    let state = propagator.propagate_datetime(timestamp)?;

    Ok(PropagationResult {
        position: state.position,
        velocity: state.velocity,
    })
}

trait VectorNorm {
    fn norm(&self) -> f64;
}

impl VectorNorm for Vector3<f64> {
    fn norm(&self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
}
