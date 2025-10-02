use crate::tle::{Result, SatelliteData};
use chrono::{DateTime, Duration, Utc};
use nalgebra::{Matrix3, Vector3};
use serde::{Deserialize, Serialize, Serializer};

// Custom serialization functions for nalgebra types
fn serialize_vector3<S>(
    vector: &Vector3<f64>,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let array = [vector.x, vector.y, vector.z];
    array.serialize(serializer)
}

fn serialize_matrix3<S>(
    matrix: &Matrix3<f64>,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let array = [
        [matrix[(0, 0)], matrix[(0, 1)], matrix[(0, 2)]],
        [matrix[(1, 0)], matrix[(1, 1)], matrix[(1, 2)]],
        [matrix[(2, 0)], matrix[(2, 1)], matrix[(2, 2)]],
    ];
    array.serialize(serializer)
}

#[derive(Debug, Clone, Serialize)]
pub struct ConjunctionEvent {
    pub id: String,
    pub satellite_a: ConjunctionSatellite,
    pub satellite_b: ConjunctionSatellite,
    pub tca: DateTime<Utc>, // Time of Closest Approach
    pub dmin_km: f64,       // Minimum distance in kilometers
    pub pc: f64,            // Probability of collision
    pub relative_velocity_km_s: f64,
    pub risk_level: RiskLevel,
    pub screening_volume_km: f64,
    pub covariance_analysis: CovarianceAnalysis,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConjunctionSatellite {
    pub norad_id: u64,
    pub name: String,
    #[serde(serialize_with = "serialize_vector3")]
    pub position_at_tca: Vector3<f64>, // ECI coordinates at TCA
    #[serde(serialize_with = "serialize_vector3")]
    pub velocity_at_tca: Vector3<f64>, // ECI velocity at TCA
    pub tle_epoch_age_hours: f64,
    #[serde(serialize_with = "serialize_matrix3")]
    pub covariance_matrix: Matrix3<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CovarianceAnalysis {
    #[serde(serialize_with = "serialize_matrix3")]
    pub combined_covariance: Matrix3<f64>,
    #[serde(serialize_with = "serialize_matrix3")]
    pub collision_plane_projection: Matrix3<f64>,
    pub uncertainty_ellipse_semi_major_km: f64,
    pub uncertainty_ellipse_semi_minor_km: f64,
    pub uncertainty_volume_km3: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum RiskLevel {
    Low,      // Pc < 1e-6
    Medium,   // 1e-6 <= Pc < 1e-4
    High,     // 1e-4 <= Pc < 1e-2
    Critical, // Pc >= 1e-2
}

#[derive(Debug, Deserialize)]
pub struct ConjunctionRequest {
    pub satellite_ids: Vec<u64>,
    pub horizon_hours: Option<u64>,
    pub screening_distance_km: Option<f64>,
    pub probability_threshold: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ConjunctionAnalysisResponse {
    pub analysis_timestamp: DateTime<Utc>,
    pub total_satellites_screened: usize,
    pub candidate_pairs: usize,
    pub conjunctions_found: usize,
    pub conjunctions: Vec<ConjunctionEvent>,
    pub screening_parameters: ScreeningParameters,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScreeningParameters {
    pub horizon_hours: u64,
    pub screening_distance_km: f64,
    pub probability_threshold: f64,
    pub time_step_seconds: u64,
    pub covariance_growth_rate: f64,
}

pub struct ConjunctionAnalyzer {
    screening_params: ScreeningParameters,
}

impl ConjunctionAnalyzer {
    pub fn new() -> Self {
        Self {
            screening_params: ScreeningParameters {
                horizon_hours: 48,
                screening_distance_km: 100.0,
                probability_threshold: 1e-4,
                time_step_seconds: 300,      // 5 minutes
                covariance_growth_rate: 0.1, // km²/day
            },
        }
    }

    pub fn with_parameters(mut self, params: ScreeningParameters) -> Self {
        self.screening_params = params;
        self
    }

    pub fn analyze_conjunctions(
        &self,
        satellites: &[SatelliteData],
        request: &ConjunctionRequest,
    ) -> Result<ConjunctionAnalysisResponse> {
        let start_time = Utc::now();
        let horizon_hours = request
            .horizon_hours
            .unwrap_or(self.screening_params.horizon_hours);
        let end_time = start_time + Duration::hours(horizon_hours as i64);

        tracing::info!(
            "Starting conjunction analysis for {} satellites over {} hours",
            satellites.len(),
            horizon_hours
        );

        // Phase 1: Coarse screening
        let candidate_pairs = self.coarse_screening(satellites, start_time, end_time)?;
        let candidate_count = candidate_pairs.len();
        tracing::info!("Coarse screening found {} candidate pairs", candidate_count);

        // Phase 2: Detailed analysis
        let mut conjunctions = Vec::new();
        for (sat_a, sat_b) in candidate_pairs {
            if let Ok(conjunction) = self.analyze_pair(&sat_a, &sat_b, start_time, end_time) {
                if conjunction.pc
                    >= request
                        .probability_threshold
                        .unwrap_or(self.screening_params.probability_threshold)
                {
                    conjunctions.push(conjunction);
                }
            }
        }

        conjunctions.sort_by(|a, b| b.pc.partial_cmp(&a.pc).unwrap_or(std::cmp::Ordering::Equal));

        Ok(ConjunctionAnalysisResponse {
            analysis_timestamp: Utc::now(),
            total_satellites_screened: satellites.len(),
            candidate_pairs: candidate_count,
            conjunctions_found: conjunctions.len(),
            conjunctions,
            screening_parameters: self.screening_params.clone(),
        })
    }

    fn coarse_screening(
        &self,
        satellites: &[SatelliteData],
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<Vec<(SatelliteData, SatelliteData)>> {
        let mut candidate_pairs = Vec::new();
        let time_step = Duration::seconds(self.screening_params.time_step_seconds as i64);

        for i in 0..satellites.len() {
            for j in (i + 1)..satellites.len() {
                let sat_a = &satellites[i];
                let sat_b = &satellites[j];

                // Quick orbital parameter check
                if self.quick_orbital_filter(sat_a, sat_b) {
                    continue;
                }

                // Sample positions over time window
                let mut min_distance = f64::INFINITY;
                let mut current_time = start_time;

                while current_time <= end_time {
                    let pos_a = self.propagate_to_eci(sat_a, &current_time)?;
                    let pos_b = self.propagate_to_eci(sat_b, &current_time)?;

                    let distance = (pos_a - pos_b).norm();
                    min_distance = min_distance.min(distance);

                    if min_distance < self.screening_params.screening_distance_km {
                        candidate_pairs.push((sat_a.clone(), sat_b.clone()));
                        break;
                    }

                    current_time = current_time + time_step;
                }
            }
        }

        Ok(candidate_pairs)
    }

    fn quick_orbital_filter(&self, sat_a: &SatelliteData, sat_b: &SatelliteData) -> bool {
        // Parse basic orbital parameters from TLE
        let alt_a = self.estimate_altitude_from_tle(&sat_a.tle_line2);
        let alt_b = self.estimate_altitude_from_tle(&sat_b.tle_line2);

        // If altitude difference > 200km, likely no close approach
        (alt_a - alt_b).abs() > 200.0
    }

    fn estimate_altitude_from_tle(&self, tle_line2: &str) -> f64 {
        // Extract mean motion from TLE line 2 (characters 52-62)
        if let Ok(mean_motion) = tle_line2[52..63].trim().parse::<f64>() {
            // Convert mean motion to altitude using Kepler's third law
            let period_seconds = 86400.0 / mean_motion;
            let semi_major_axis = ((period_seconds / (2.0 * std::f64::consts::PI)).powi(2)
                * 398600.4418)
                .powf(1.0 / 3.0);
            semi_major_axis - 6378.137 // Earth radius
        } else {
            400.0 // Default LEO altitude
        }
    }

    fn analyze_pair(
        &self,
        sat_a: &SatelliteData,
        sat_b: &SatelliteData,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<ConjunctionEvent> {
        // Find Time of Closest Approach (TCA)
        let (tca, dmin_km, pos_a_tca, vel_a_tca, pos_b_tca, vel_b_tca) =
            self.find_tca(sat_a, sat_b, start_time, end_time)?;

        // Calculate relative motion
        let _relative_position = pos_a_tca - pos_b_tca;
        let relative_velocity = vel_a_tca - vel_b_tca;
        let relative_speed = relative_velocity.norm();

        // Covariance analysis
        let covariance_a = self.estimate_covariance(sat_a, &tca);
        let covariance_b = self.estimate_covariance(sat_b, &tca);
        let covariance_analysis =
            self.analyze_covariance(&covariance_a, &covariance_b, &relative_velocity);

        // Calculate probability of collision
        let pc =
            self.calculate_collision_probability(dmin_km, &covariance_analysis, relative_speed);

        let risk_level = match pc {
            p if p >= 1e-2 => RiskLevel::Critical,
            p if p >= 1e-4 => RiskLevel::High,
            p if p >= 1e-6 => RiskLevel::Medium,
            _ => RiskLevel::Low,
        };

        Ok(ConjunctionEvent {
            id: format!("conj_{}_{}", sat_a.norad_id, sat_b.norad_id),
            satellite_a: ConjunctionSatellite {
                norad_id: sat_a.norad_id,
                name: sat_a.name.clone(),
                position_at_tca: pos_a_tca,
                velocity_at_tca: vel_a_tca,
                tle_epoch_age_hours: self.calculate_tle_age_hours(sat_a, &tca),
                covariance_matrix: covariance_a,
            },
            satellite_b: ConjunctionSatellite {
                norad_id: sat_b.norad_id,
                name: sat_b.name.clone(),
                position_at_tca: pos_b_tca,
                velocity_at_tca: vel_b_tca,
                tle_epoch_age_hours: self.calculate_tle_age_hours(sat_b, &tca),
                covariance_matrix: covariance_b,
            },
            tca,
            dmin_km,
            pc,
            relative_velocity_km_s: relative_speed,
            risk_level,
            screening_volume_km: self.screening_params.screening_distance_km,
            covariance_analysis,
        })
    }

    fn find_tca(
        &self,
        sat_a: &SatelliteData,
        sat_b: &SatelliteData,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<(
        DateTime<Utc>,
        f64,
        Vector3<f64>,
        Vector3<f64>,
        Vector3<f64>,
        Vector3<f64>,
    )> {
        let mut min_distance = f64::INFINITY;
        let mut tca = start_time;
        let mut best_positions = (
            Vector3::zeros(),
            Vector3::zeros(),
            Vector3::zeros(),
            Vector3::zeros(),
        );

        // Coarse search with larger time steps
        let coarse_step = Duration::seconds(300); // 5 minutes
        let mut current_time = start_time;

        while current_time <= end_time {
            let pos_a = self.propagate_to_eci(sat_a, &current_time)?;
            let vel_a = self.propagate_velocity_to_eci(sat_a, &current_time)?;
            let pos_b = self.propagate_to_eci(sat_b, &current_time)?;
            let vel_b = self.propagate_velocity_to_eci(sat_b, &current_time)?;

            let distance = (pos_a - pos_b).norm();

            if distance < min_distance {
                min_distance = distance;
                tca = current_time;
                best_positions = (pos_a, vel_a, pos_b, vel_b);
            }

            current_time = current_time + coarse_step;
        }

        // Fine search around the minimum
        let fine_step = Duration::seconds(30); // 30 seconds
        let search_window = Duration::minutes(30);
        let fine_start = tca - search_window;
        let fine_end = tca + search_window;

        current_time = fine_start;
        while current_time <= fine_end {
            let pos_a = self.propagate_to_eci(sat_a, &current_time)?;
            let vel_a = self.propagate_velocity_to_eci(sat_a, &current_time)?;
            let pos_b = self.propagate_to_eci(sat_b, &current_time)?;
            let vel_b = self.propagate_velocity_to_eci(sat_b, &current_time)?;

            let distance = (pos_a - pos_b).norm();

            if distance < min_distance {
                min_distance = distance;
                tca = current_time;
                best_positions = (pos_a, vel_a, pos_b, vel_b);
            }

            current_time = current_time + fine_step;
        }

        Ok((
            tca,
            min_distance,
            best_positions.0,
            best_positions.1,
            best_positions.2,
            best_positions.3,
        ))
    }

    fn propagate_to_eci(
        &self,
        sat_data: &SatelliteData,
        time: &DateTime<Utc>,
    ) -> Result<Vector3<f64>> {
        // Simplified orbital propagation - in production, use proper SGP4
        let current_time_seconds = time.timestamp() as f64;
        let line2 = &sat_data.tle_line2;

        // Parse orbital parameters from TLE
        let inclination =
            line2[8..16].trim().parse::<f64>().unwrap_or(51.6) * std::f64::consts::PI / 180.0;
        let mean_motion = line2[52..63].trim().parse::<f64>().unwrap_or(15.5);

        // Simple circular orbit simulation
        let orbital_period_seconds = 86400.0 / mean_motion;
        let angular_velocity = 2.0 * std::f64::consts::PI / orbital_period_seconds;
        let orbital_angle =
            (current_time_seconds * angular_velocity) % (2.0 * std::f64::consts::PI);

        let altitude_km = 400.0 + (mean_motion - 15.0) * 20.0;
        let orbital_radius_km = 6371.0 + altitude_km;

        // ECI coordinates
        let x = orbital_radius_km * orbital_angle.cos();
        let y = orbital_radius_km * orbital_angle.sin() * inclination.cos();
        let z = orbital_radius_km * orbital_angle.sin() * inclination.sin();

        Ok(Vector3::new(x, y, z))
    }

    fn propagate_velocity_to_eci(
        &self,
        sat_data: &SatelliteData,
        time: &DateTime<Utc>,
    ) -> Result<Vector3<f64>> {
        // Simplified velocity calculation
        let line2 = &sat_data.tle_line2;
        let mean_motion = line2[52..63].trim().parse::<f64>().unwrap_or(15.5);
        let altitude_km = 400.0 + (mean_motion - 15.0) * 20.0;
        let orbital_radius_km = 6371.0 + altitude_km;

        // Circular orbital velocity
        let velocity_magnitude = (398600.4418 / orbital_radius_km).sqrt();

        // Simplified velocity direction (perpendicular to position)
        let pos = self.propagate_to_eci(sat_data, time)?;
        let velocity_direction = Vector3::new(-pos.y, pos.x, 0.0).normalize();

        Ok(velocity_direction * velocity_magnitude)
    }

    fn estimate_covariance(&self, sat_data: &SatelliteData, tca: &DateTime<Utc>) -> Matrix3<f64> {
        let age_hours = self.calculate_tle_age_hours(sat_data, tca);
        let age_days = age_hours / 24.0;

        // Simple isotropic covariance growth model
        let base_uncertainty_km = 0.1; // 100m base uncertainty
        let growth_factor = 1.0 + (age_days * self.screening_params.covariance_growth_rate);
        let variance = (base_uncertainty_km * growth_factor).powi(2);

        // Create isotropic covariance matrix
        Matrix3::from_diagonal(&Vector3::new(variance, variance, variance))
    }

    fn analyze_covariance(
        &self,
        cov_a: &Matrix3<f64>,
        cov_b: &Matrix3<f64>,
        relative_velocity: &Vector3<f64>,
    ) -> CovarianceAnalysis {
        // Combined covariance
        let combined_covariance = cov_a + cov_b;

        // Project into collision plane (perpendicular to relative velocity)
        let rel_vel_unit = relative_velocity.normalize();

        // Create projection matrix (I - v̂v̂ᵀ)
        let projection_matrix = Matrix3::identity() - rel_vel_unit * rel_vel_unit.transpose();
        let collision_plane_projection =
            projection_matrix * combined_covariance * projection_matrix.transpose();

        // Calculate uncertainty ellipse parameters
        let eigenvalues = collision_plane_projection.symmetric_eigenvalues();
        let semi_major_km = eigenvalues[2].sqrt();
        let semi_minor_km = eigenvalues[0].sqrt();
        let volume_km3 =
            (4.0 / 3.0) * std::f64::consts::PI * eigenvalues.iter().product::<f64>().sqrt();

        CovarianceAnalysis {
            combined_covariance,
            collision_plane_projection,
            uncertainty_ellipse_semi_major_km: semi_major_km,
            uncertainty_ellipse_semi_minor_km: semi_minor_km,
            uncertainty_volume_km3: volume_km3,
        }
    }

    fn calculate_collision_probability(
        &self,
        dmin_km: f64,
        covariance_analysis: &CovarianceAnalysis,
        relative_speed_km_s: f64,
    ) -> f64 {
        // Combined hard body radius (typical satellite sizes)
        let hard_body_radius_km: f64 = 0.005; // 5 meters

        // 2D collision probability in the collision plane
        let collision_area_km2 = std::f64::consts::PI * hard_body_radius_km.powi(2);

        // Use 2D normal distribution
        let det = covariance_analysis.collision_plane_projection[(0, 0)]
            * covariance_analysis.collision_plane_projection[(1, 1)]
            - covariance_analysis.collision_plane_projection[(0, 1)].powi(2);

        if det <= 0.0 {
            return 0.0;
        }

        // Mahalanobis distance squared
        let _mahalanobis_sq = dmin_km.powi(2) / det.sqrt();

        // 2D collision probability with circular approximation
        let pc = 1.0 - (-collision_area_km2 / (2.0 * std::f64::consts::PI * det.sqrt())).exp();

        // Apply dilution factor for high relative velocities
        let dilution_factor = (relative_speed_km_s / 10.0).min(1.0);

        pc * dilution_factor
    }

    fn calculate_tle_age_hours(
        &self,
        sat_data: &SatelliteData,
        current_time: &DateTime<Utc>,
    ) -> f64 {
        let age_duration = *current_time - sat_data.last_updated;
        age_duration.num_seconds() as f64 / 3600.0
    }
}
