use crate::tle::{Result, RiskLevel, SatApiError, SatelliteData, SatellitePosition};
use chrono::{DateTime, Utc};
use sgp4::{Constants as Sgp4Constants, Elements as Sgp4Elements};
use std::collections::HashMap;
use std::f64::consts::PI;

struct TrackedSatellite {
    data: SatelliteData,
    elements: Sgp4Elements,
    constants: Sgp4Constants,
}

pub struct SatelliteTracker {
    satellites: HashMap<u64, TrackedSatellite>,
}

impl SatelliteTracker {
    pub fn new() -> Self {
        Self {
            satellites: HashMap::new(),
        }
    }

    pub fn load_satellites(&mut self, satellite_data: Vec<SatelliteData>) -> Result<()> {
        self.satellites.clear();

        let mut inserted = 0usize;

        for sat_data in satellite_data {
            let elements = match Sgp4Elements::from_tle(
                Some(sat_data.name.clone()),
                sat_data.tle_line1.as_bytes(),
                sat_data.tle_line2.as_bytes(),
            ) {
                Ok(elements) => elements,
                Err(err) => {
                    tracing::warn!(
                        "Skipping satellite {} due to TLE parse error: {}",
                        sat_data.norad_id,
                        err
                    );
                    continue;
                }
            };

            let constants = match Sgp4Constants::from_elements(&elements) {
                Ok(constants) => constants,
                Err(err) => {
                    tracing::warn!(
                        "Skipping satellite {} due to SGP4 init error: {}",
                        sat_data.norad_id,
                        err
                    );
                    continue;
                }
            };

            self.satellites.insert(
                sat_data.norad_id,
                TrackedSatellite {
                    data: sat_data,
                    elements,
                    constants,
                },
            );
            inserted += 1;
        }

        tracing::info!("Loaded {} satellites for tracking", self.satellites.len());

        if inserted == 0 {
            return Err(SatApiError::NoSatelliteData);
        }

        Ok(())
    }

    pub fn get_all_positions(&self) -> Result<Vec<SatellitePosition>> {
        let now = Utc::now();
        let mut positions = Vec::new();

        for (norad_id, tracked_sat) in &self.satellites {
            match self.propagate_satellite(tracked_sat, &now) {
                Ok(mut pos) => {
                    pos.norad_id = *norad_id;
                    pos.name = tracked_sat.data.name.clone();
                    positions.push(pos);
                }
                Err(e) => {
                    tracing::debug!(
                        "Failed to propagate satellite {}: {}",
                        tracked_sat.data.name,
                        e
                    );
                    continue;
                }
            }
        }

        Ok(positions)
    }

    pub fn get_all_positions_at(&self, time: DateTime<Utc>) -> Result<Vec<SatellitePosition>> {
        let mut positions = Vec::new();

        for (norad_id, tracked_sat) in &self.satellites {
            match self.propagate_satellite(tracked_sat, &time) {
                Ok(mut pos) => {
                    pos.norad_id = *norad_id;
                    pos.name = tracked_sat.data.name.clone();
                    positions.push(pos);
                }
                Err(e) => {
                    tracing::debug!(
                        "Failed to propagate satellite {} at offset: {}",
                        tracked_sat.data.name,
                        e
                    );
                    continue;
                }
            }
        }

        Ok(positions)
    }

    pub fn get_satellite_position(&self, norad_id: u64) -> Result<SatellitePosition> {
        let tracked_sat = self
            .satellites
            .get(&norad_id)
            .ok_or(SatApiError::SatelliteNotFound(norad_id))?;

        let now = Utc::now();
        let mut pos = self.propagate_satellite(tracked_sat, &now)?;
        pos.norad_id = norad_id;
        pos.name = tracked_sat.data.name.clone();

        Ok(pos)
    }

    pub fn get_satellites_by_group(&self, group_name: &str) -> Result<Vec<SatellitePosition>> {
        let now = Utc::now();
        let mut positions = Vec::new();

        for (norad_id, tracked_sat) in &self.satellites {
            let name_lower = tracked_sat.data.name.to_lowercase();

            let matches_group = match group_name.to_lowercase().as_str() {
                "starlink" => name_lower.contains("starlink"),
                "gps" => name_lower.contains("gps") || name_lower.contains("navstar"),
                "galileo" => name_lower.contains("galileo"),
                "iss" => name_lower.contains("iss") || name_lower.contains("zarya"),
                "weather" => {
                    name_lower.contains("noaa")
                        || name_lower.contains("goes")
                        || name_lower.contains("metop")
                }
                _ => continue,
            };

            if matches_group {
                match self.propagate_satellite(tracked_sat, &now) {
                    Ok(mut pos) => {
                        pos.norad_id = *norad_id;
                        pos.name = tracked_sat.data.name.clone();
                        positions.push(pos);
                    }
                    Err(e) => {
                        tracing::debug!(
                            "Failed to propagate satellite {}: {}",
                            tracked_sat.data.name,
                            e
                        );
                        continue;
                    }
                }
            }
        }

        Ok(positions)
    }

    pub fn get_satellite_count(&self) -> usize {
        self.satellites.len()
    }

    fn propagate_satellite(
        &self,
        tracked_sat: &TrackedSatellite,
        time: &DateTime<Utc>,
    ) -> Result<SatellitePosition> {
        let minutes_since_epoch = tracked_sat
            .elements
            .datetime_to_minutes_since_epoch(&time.naive_utc())
            .map_err(|err| SatApiError::PropagationError(err.to_string()))?;

        let prediction = tracked_sat
            .constants
            .propagate(minutes_since_epoch)
            .map_err(|err| SatApiError::PropagationError(err.to_string()))?;

        let julian_date = self.utc_to_julian(time);
        let (lat_rad, lon_rad, altitude_km) = self.eci_to_geodetic(
            prediction.position[0],
            prediction.position[1],
            prediction.position[2],
            julian_date,
        );

        let mut lon_deg = lon_rad.to_degrees().rem_euclid(360.0);
        if lon_deg > 180.0 {
            lon_deg -= 360.0;
        }

        let velocity_km_s = (prediction.velocity[0].powi(2)
            + prediction.velocity[1].powi(2)
            + prediction.velocity[2].powi(2))
        .sqrt();

        let (risk_score, risk_level, risk_reason) =
            Self::evaluate_risk(&tracked_sat.data, altitude_km, velocity_km_s, time);

        Ok(SatellitePosition {
            norad_id: 0,
            name: String::new(),
            lat_deg: lat_rad.to_degrees(),
            lon_deg,
            alt_km: altitude_km,
            velocity_km_s,
            timestamp: *time,
            risk_score,
            risk_level,
            risk_reason,
        })
    }

    fn utc_to_julian(&self, time: &DateTime<Utc>) -> f64 {
        // Convert UTC to Julian date
        let timestamp = time.timestamp_millis() as f64 / 1000.0;
        (timestamp / 86400.0) + 2440587.5 // Unix epoch to Julian date conversion
    }

    fn eci_to_geodetic(&self, x: f64, y: f64, z: f64, julian_date: f64) -> (f64, f64, f64) {
        // WGS84 constants
        const A: f64 = 6378.137; // Semi-major axis in km
        const F: f64 = 1.0 / 298.257223563; // Flattening
        const E2: f64 = F * (2.0 - F); // First eccentricity squared

        // Calculate Greenwich Mean Sidereal Time
        let gmst = self.julian_to_gmst(julian_date);

        // Rotate ECI coordinates to ECEF (Earth-Centered Earth-Fixed)
        let cos_gmst = gmst.cos();
        let sin_gmst = gmst.sin();

        let x_ecef = x * cos_gmst + y * sin_gmst;
        let y_ecef = -x * sin_gmst + y * cos_gmst;
        let z_ecef = z;

        // Convert ECEF to geodetic coordinates
        let p = (x_ecef * x_ecef + y_ecef * y_ecef).sqrt();
        let longitude = y_ecef.atan2(x_ecef);

        // Iterative solution for latitude and altitude
        let mut latitude = (z_ecef / p).atan();
        let mut altitude = 0.0;

        for _ in 0..5 {
            // 5 iterations should be sufficient
            let sin_lat = latitude.sin();
            let cos_lat = latitude.cos();
            let n = A / (1.0 - E2 * sin_lat * sin_lat).sqrt();

            altitude = p / cos_lat - n;
            latitude = (z_ecef / (p * (1.0 - E2 * n / (n + altitude)))).atan();
        }

        (latitude, longitude, altitude)
    }

    fn julian_to_gmst(&self, julian_date: f64) -> f64 {
        // Calculate Greenwich Mean Sidereal Time
        let t = (julian_date - 2451545.0) / 36525.0;
        let gmst_seconds =
            67310.54841 + (876600.0 * 3600.0 + 8640184.812866) * t + 0.093104 * t * t
                - 6.2e-6 * t * t * t;

        // Convert to radians and normalize
        let gmst_rad = (gmst_seconds % 86400.0) * PI / 43200.0;
        gmst_rad % (2.0 * PI)
    }

    fn evaluate_risk(
        sat_data: &SatelliteData,
        altitude_km: f64,
        velocity_km_s: f64,
        timestamp: &DateTime<Utc>,
    ) -> (f64, RiskLevel, String) {
        let altitude_score = (1.0 - (altitude_km / 36000.0)).clamp(0.05, 0.98);

        let name_upper = sat_data.name.to_uppercase();
        let mega_constellation = [
            "STARLINK",
            "ONEWEB",
            "IRIDIUM",
            "GLOBALSTAR",
            "NAVSTAR",
            "GALILEO",
            "GLONASS",
            "BEIDOU",
        ]
        .iter()
        .any(|marker| name_upper.contains(marker));

        let crowding_score = if altitude_km < 1200.0 {
            if mega_constellation {
                0.85
            } else {
                0.55
            }
        } else if altitude_km < 20000.0 {
            if mega_constellation {
                0.5
            } else {
                0.3
            }
        } else {
            0.2
        };

        let tle_age_hours = (timestamp
            .signed_duration_since(sat_data.last_updated)
            .num_minutes()
            .max(0) as f64)
            / 60.0;
        let tle_age_score = (tle_age_hours / 72.0).clamp(0.0, 1.0);

        let nominal_velocity = if altitude_km > 2000.0 { 3.1 } else { 7.5 };
        let velocity_score = ((velocity_km_s - nominal_velocity).abs() / 1.2).clamp(0.0, 1.0);

        let risk_score = (altitude_score * 0.4)
            + (crowding_score * 0.3)
            + (velocity_score * 0.15)
            + (tle_age_score * 0.15);
        let risk_score = risk_score.clamp(0.0, 1.0);

        let risk_level = if risk_score >= 0.7 {
            RiskLevel::Red
        } else if risk_score >= 0.4 {
            RiskLevel::Amber
        } else {
            RiskLevel::Green
        };

        let mut drivers = Vec::new();

        if altitude_km < 500.0 {
            drivers.push("crowded very-low LEO altitude band");
        } else if altitude_km < 1200.0 {
            drivers.push("dense low Earth orbit population");
        } else if altitude_km < 20000.0 {
            drivers.push("medium Earth orbital traffic");
        } else {
            drivers.push("sparser high-altitude regime");
        }

        if mega_constellation {
            drivers.push("mega-constellation membership");
        }

        if velocity_score > 0.4 {
            drivers.push("velocity deviation from nominal");
        }

        if tle_age_hours > 48.0 {
            drivers.push("aging TLE (>48h)");
        }

        if drivers.is_empty() {
            drivers.push("nominal operating conditions");
        }

        let driver_summary = drivers.join(", ");

        let risk_reason = match risk_level {
            RiskLevel::Red => format!(
                "High collision exposure: {} (score {:.2})",
                driver_summary, risk_score
            ),
            RiskLevel::Amber => format!(
                "Heightened vigilance: {} (score {:.2})",
                driver_summary, risk_score
            ),
            RiskLevel::Green => format!(
                "Nominal conditions: {} (score {:.2})",
                driver_summary, risk_score
            ),
        };

        (risk_score, risk_level, risk_reason)
    }
}
