use std::{path::PathBuf, time::Duration as StdDuration};

use actix_web::{delete, get, post, web, HttpResponse, Responder, Scope};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use tokio::{fs, time};
use sgp4::{Constants, Elements, MinutesSinceEpoch, Prediction};

const DEFAULT_CACHE_PATH: &str = "./data/tle_cache.csv";
const DEFAULT_FETCH_GROUP: &str = "active";
const DEFAULT_FETCH_INTERVAL_SECS: u64 = 60;
const EARTH_RADIUS_KM: f64 = 6378.137;
const LEO_ALTITUDE_LIMIT_KM: f64 = 2000.0;
const MAX_RECORDS: usize = 300;
const SAFE_ALTITUDE_BUFFER_KM: f64 = 75.0;
const SAFE_INCLINATION_DELTA_DEG: f64 = 1.5;
const WINDOW_SCAN_MINUTES: i64 = 180;
const WINDOW_STEP_MINUTES: i64 = 10;
const RECOMMENDED_WINDOW_MINUTES: i64 = 20;

#[derive(Debug, Deserialize)]
struct GroupQuery {
    group: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PathQuery {
    path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedTleRecord {
    pub norad_id: i32,
    pub name: String,
    pub tle_line1: String,
    pub tle_line2: String,
    pub epoch: String,
    pub semimajor_axis: f64,
    pub inclination: f64,
    pub eccentricity: f64,
    pub mean_motion: f64,
    pub mean_anomaly: f64,
    pub raan: f64,
    pub arg_perigee: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CacheStatus {
    pub last_updated: Option<DateTime<Utc>>,
    pub entries: usize,
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct LaunchAnalysisRequest {
    pub launch_vehicle: String,
    pub launch_time: String,
    pub desired_altitude_km: f64,
    pub desired_inclination_deg: f64,
    pub launch_site_lat_deg: Option<f64>,
    pub launch_site_lon_deg: Option<f64>,
    pub payload_mass_kg: Option<f64>,
    pub window_minutes: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct LaunchAnalysisResponse {
    pub requested_window_start: DateTime<Utc>,
    pub requested_window_end: DateTime<Utc>,
    pub recommended_window_start: DateTime<Utc>,
    pub recommended_window_end: DateTime<Utc>,
    pub conflicts: Vec<OrbitConflict>,
    pub suggested_orbit: SuggestedOrbit,
}

#[derive(Debug, Serialize)]
pub struct SuggestedOrbit {
    pub altitude_km: f64,
    pub inclination_deg: f64,
    pub notes: String,
}

#[derive(Debug, Serialize)]
pub struct OrbitConflict {
    pub norad_id: i32,
    pub name: String,
    pub time_utc: DateTime<Utc>,
    pub miss_distance_km: f64,
    pub relative_speed_km_s: f64,
}

#[get("/api/tle/status")]
pub async fn cache_status() -> impl Responder {
    let path = cache_path(None);
    match load_csv(&path).await {
        Ok(records) => HttpResponse::Ok().json(CacheStatus {
            last_updated: cache_last_modified(&path).await,
            entries: records.len(),
            path: path.to_string_lossy().to_string(),
        }),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

#[get("/api/tle/cache")]
pub async fn read_cache(query: web::Query<PathQuery>) -> impl Responder {
    let path = cache_path(query.path.clone());
    match load_csv(&path).await {
        Ok(records) => HttpResponse::Ok().json(records),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

#[post("/api/tle/refresh")]
pub async fn refresh_cache(query: web::Query<GroupQuery>) -> impl Responder {
    match fetch_and_store_tle(query.group.clone()).await {
        Ok(records) => HttpResponse::Ok().json(records),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

#[delete("/api/tle/cache")]
pub async fn clear_cache(query: web::Query<PathQuery>) -> impl Responder {
    let path = cache_path(query.path.clone());
    match fs::remove_file(&path).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => HttpResponse::NoContent().finish(),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

#[post("/api/tle/analyze")]
pub async fn analyze_launch(payload: web::Json<LaunchAnalysisRequest>) -> impl Responder {
    let launch_start = match DateTime::parse_from_rfc3339(&payload.launch_time) {
        Ok(dt) => dt.with_timezone(&Utc),
        Err(_) => {
            return HttpResponse::BadRequest().body("invalid launch_time, use RFC3339");
        }
    };

    let window_minutes = payload
        .window_minutes
        .filter(|v| *v > 0)
        .unwrap_or(RECOMMENDED_WINDOW_MINUTES);

    let requested_window_end = launch_start + Duration::minutes(window_minutes);

    let path = cache_path(None);
    let mut records = match load_csv(&path).await {
        Ok(records) => records,
        Err(err) => return HttpResponse::InternalServerError().body(err.to_string()),
    };

    if records.is_empty() {
        match fetch_and_store_tle(None).await {
            Ok(fresh) => records = fresh,
            Err(err) => {
                return HttpResponse::InternalServerError()
                    .body(format!("unable to refresh TLE cache: {err}"));
            }
        }
    }

    if records.is_empty() {
        return HttpResponse::ServiceUnavailable().body("no TLE records available");
    }

    let conflicts = evaluate_conflicts(
        &records,
        launch_start,
        requested_window_end,
        payload.desired_altitude_km,
        payload.desired_inclination_deg,
    );

    let recommended_start = find_recommended_window(
        &records,
        launch_start,
        payload.desired_altitude_km,
        payload.desired_inclination_deg,
    )
    .unwrap_or(requested_window_end);

    let recommended_end = recommended_start + Duration::minutes(RECOMMENDED_WINDOW_MINUTES);

    let suggested_altitude = if conflicts.is_empty() {
        payload.desired_altitude_km
    } else {
        payload.desired_altitude_km + SAFE_ALTITUDE_BUFFER_KM
    };

    let notes = if conflicts.is_empty() {
        "Requested window clear of nearby traffic".to_string()
    } else {
        format!(
            "Detected {} potential conflicts. Recommend adjusting altitude by +{SAFE_ALTITUDE_BUFFER_KM} km or using suggested window.",
            conflicts.len()
        )
    };

    let response = LaunchAnalysisResponse {
        requested_window_start: launch_start,
        requested_window_end,
        recommended_window_start: recommended_start,
        recommended_window_end: recommended_end,
        conflicts,
        suggested_orbit: SuggestedOrbit {
            altitude_km: suggested_altitude,
            inclination_deg: payload.desired_inclination_deg,
            notes,
        },
    };

    HttpResponse::Ok().json(response)
}

pub fn routes() -> Scope {
    web::scope("")
        .service(cache_status)
        .service(read_cache)
        .service(refresh_cache)
    .service(clear_cache)
    .service(analyze_launch)
}

pub async fn start_background_task() {
    if let Err(err) = fetch_and_store_tle(None).await {
        tracing::error!("initial TLE fetch failed: {err}");
    }

    let mut interval = time::interval(StdDuration::from_secs(DEFAULT_FETCH_INTERVAL_SECS));

    loop {
        interval.tick().await;
        if let Err(err) = fetch_and_store_tle(None).await {
            tracing::error!("failed to refresh TLE cache: {err}");
        }
    }
}

async fn fetch_and_store_tle(group: Option<String>) -> anyhow::Result<Vec<CachedTleRecord>> {
    let group_ref = group.as_deref().unwrap_or(DEFAULT_FETCH_GROUP);
    let url = format!(
        "https://celestrak.org/NORAD/elements/gp.php?GROUP={group_ref}&FORMAT=json"
    );

    let response = reqwest::get(&url).await?;
    let payload: Vec<serde_json::Value> = response.json().await?;

    let mut records: Vec<CachedTleRecord> = payload
        .into_iter()
        .filter_map(|entry| match parse_and_filter(entry) {
            Ok(record) => record,
            Err(err) => {
                tracing::warn!("skipping invalid TLE record: {err}");
                None
            }
        })
        .take(MAX_RECORDS)
        .collect();

    // ensure stable ordering for deterministic output
    records.sort_by(|a, b| a.norad_id.cmp(&b.norad_id));

    let path = cache_path(None);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await?;
    }

    write_csv(&path, &records).await?;

    Ok(records)
}

fn parse_and_filter(entry: serde_json::Value) -> anyhow::Result<Option<CachedTleRecord>> {
    let obj = entry.as_object().ok_or_else(|| anyhow::anyhow!("expected JSON object"))?;

    let semimajor = obj
        .get("SEMIMAJOR_AXIS")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| anyhow::anyhow!("missing semimajor axis"))?;
    let altitude = semimajor - EARTH_RADIUS_KM;

    if !(0.0..LEO_ALTITUDE_LIMIT_KM).contains(&altitude) {
        return Ok(None);
    }

    let norad_id = obj
        .get("NORAD_CAT_ID")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| anyhow::anyhow!("missing NORAD id"))? as i32;

    let tle_line1 = obj
        .get("TLE_LINE1")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("missing TLE line 1"))?
        .trim()
        .to_string();

    let tle_line2 = obj
        .get("TLE_LINE2")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("missing TLE line 2"))?
        .trim()
        .to_string();

    let name = obj
        .get("OBJECT_NAME")
        .and_then(|v| v.as_str())
        .unwrap_or("UNKNOWN")
        .trim()
        .to_string();

    let epoch = obj
        .get("EPOCH")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let inclination = obj
        .get("INCLINATION")
        .and_then(|v| v.as_f64())
        .unwrap_or_default();

    let eccentricity = obj
        .get("ECCENTRICITY")
        .and_then(|v| v.as_f64())
        .unwrap_or_default();

    let mean_motion = obj
        .get("MEAN_MOTION")
        .and_then(|v| v.as_f64())
        .unwrap_or_default();

    let mean_anomaly = obj
        .get("MEAN_ANOMALY")
        .and_then(|v| v.as_f64())
        .unwrap_or_default();

    let raan = obj
        .get("RA_OF_ASC_NODE")
        .and_then(|v| v.as_f64())
        .unwrap_or_default();

    let arg_perigee = obj
        .get("ARG_OF_PERICENTER")
        .and_then(|v| v.as_f64())
        .unwrap_or_default();

    Ok(Some(CachedTleRecord {
        norad_id,
        name,
        tle_line1,
        tle_line2,
        epoch,
        semimajor_axis: semimajor,
        inclination,
        eccentricity,
        mean_motion,
        mean_anomaly,
        raan,
        arg_perigee,
    }))
}

fn cache_path(overridden: Option<String>) -> PathBuf {
    overridden
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(DEFAULT_CACHE_PATH))
}

async fn write_csv(path: &PathBuf, records: &[CachedTleRecord]) -> anyhow::Result<()> {
    let mut writer = csv::Writer::from_writer(vec![]);
    for record in records {
        writer.serialize(record)?;
    }
    writer.flush()?;

    fs::write(path, writer.into_inner()?).await?;
    Ok(())
}

async fn load_csv(path: &PathBuf) -> anyhow::Result<Vec<CachedTleRecord>> {
    let data = match fs::read(path).await {
        Ok(bytes) => bytes,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(err) => return Err(err.into()),
    };

    let mut reader = csv::Reader::from_reader(data.as_slice());
    let mut records = Vec::new();
    for result in reader.deserialize() {
        let record: CachedTleRecord = result?;
        records.push(record);
    }
    Ok(records)
}

async fn cache_last_modified(path: &PathBuf) -> Option<DateTime<Utc>> {
    match fs::metadata(path).await {
        Ok(metadata) => match metadata.modified() {
            Ok(modified) => Some(DateTime::<Utc>::from(modified)),
            Err(_) => None,
        },
        Err(_) => None,
    }
}

fn evaluate_conflicts(
    records: &[CachedTleRecord],
    start: DateTime<Utc>,
    end: DateTime<Utc>,
    target_altitude_km: f64,
    target_inclination_deg: f64,
) -> Vec<OrbitConflict> {
    let mut conflicts = Vec::new();
    let mut current = start;

    while current <= end {
        conflicts.extend(detect_conflicts(
            records,
            current,
            target_altitude_km,
            target_inclination_deg,
        ));
        current += Duration::minutes(WINDOW_STEP_MINUTES);
    }

    conflicts
}

fn find_recommended_window(
    records: &[CachedTleRecord],
    start: DateTime<Utc>,
    target_altitude_km: f64,
    target_inclination_deg: f64,
) -> Option<DateTime<Utc>> {
    let mut current = start;
    let scan_limit = start + Duration::minutes(WINDOW_SCAN_MINUTES);

    while current <= scan_limit {
        if detect_conflicts(records, current, target_altitude_km, target_inclination_deg).is_empty()
        {
            return Some(current);
        }
        current += Duration::minutes(WINDOW_STEP_MINUTES);
    }

    None
}

fn detect_conflicts(
    records: &[CachedTleRecord],
    timestamp: DateTime<Utc>,
    target_altitude_km: f64,
    target_inclination_deg: f64,
) -> Vec<OrbitConflict> {
    records
        .iter()
        .filter_map(|record| {
            let state = propagate_record(record, timestamp)?;
            let altitude_km = vector_norm(&state.position) - EARTH_RADIUS_KM;
            let miss_distance = (altitude_km - target_altitude_km).abs();
            let inclination_delta = (record.inclination - target_inclination_deg).abs();

            if miss_distance <= SAFE_ALTITUDE_BUFFER_KM
                && inclination_delta <= SAFE_INCLINATION_DELTA_DEG
            {
                Some(OrbitConflict {
                    norad_id: record.norad_id,
                    name: record.name.clone(),
                    time_utc: timestamp,
                    miss_distance_km: miss_distance,
                    relative_speed_km_s: vector_norm(&state.velocity),
                })
            } else {
                None
            }
        })
        .collect()
}

fn propagate_record(record: &CachedTleRecord, timestamp: DateTime<Utc>) -> Option<Prediction> {
    let elements = Elements::from_tle(
        Some(record.name.clone()),
        record.tle_line1.as_bytes(),
        record.tle_line2.as_bytes(),
    )
    .ok()?;
    let constants = Constants::from_elements(&elements).ok()?;
    let minutes: MinutesSinceEpoch = elements
        .datetime_to_minutes_since_epoch(&timestamp.naive_utc())
        .ok()?;
    constants.propagate(minutes).ok()
}

fn vector_norm(vec: &[f64; 3]) -> f64 {
    (vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_parse_and_filter_leo_only() {
        let mut value = serde_json::json!({
            "SEMIMAJOR_AXIS": EARTH_RADIUS_KM + 500.0,
            "NORAD_CAT_ID": 12345,
            "TLE_LINE1": "1 12345U 98067A   20029.54791435  .00000123  00000-0  10270-3 0  9006",
            "TLE_LINE2": "2 12345  97.6420  75.0414 0007434 347.3218  12.7348 14.81450576113842",
            "OBJECT_NAME": "TESTSAT",
        });

        assert!(parse_and_filter(value.clone()).unwrap().is_some());

        value["SEMIMAJOR_AXIS"] = serde_json::json!(EARTH_RADIUS_KM + 3000.0);
        assert!(parse_and_filter(value).unwrap().is_none());
    }

    #[tokio::test]
    async fn test_write_and_load_csv() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("cache.csv");
        let records = vec![CachedTleRecord {
            norad_id: 1,
            name: "TEST".into(),
            tle_line1: "L1".into(),
            tle_line2: "L2".into(),
            epoch: "2024-01-01".into(),
            semimajor_axis: EARTH_RADIUS_KM + 400.0,
            inclination: 45.0,
            eccentricity: 0.001,
            mean_motion: 15.0,
            mean_anomaly: 0.0,
            raan: 120.0,
            arg_perigee: 80.0,
        }];

        write_csv(&path, &records).await.unwrap();
        let loaded = load_csv(&path).await.unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].norad_id, 1);
    }
}
