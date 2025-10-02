use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

const DEFAULT_MODEL_PATH: &str = "data/risk_model_state.json";
const SAVE_INTERVAL: u64 = 25;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RiskModelParameters {
    pub bias: f64,
    pub coefficients: [f64; 4],
    pub observation_count: u64,
    pub last_updated: Option<DateTime<Utc>>,
}

impl RiskModelParameters {
    pub fn new(bias: f64, coefficients: [f64; 4]) -> Self {
        Self {
            bias,
            coefficients,
            observation_count: 0,
            last_updated: None,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct RiskModelExplanation {
    pub bias: f64,
    pub coefficients: [f64; 4],
    pub feature_order: [&'static str; 4],
    pub observation_count: u64,
    pub learning_rate: f64,
    pub l2_penalty: f64,
    pub last_updated: Option<DateTime<Utc>>,
    pub persistence_path: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct PersistedRiskModel {
    params: RiskModelParameters,
    learning_rate: f64,
    l2_penalty: f64,
}

#[derive(Debug)]
pub struct RiskModel {
    params: RiskModelParameters,
    learning_rate: f64,
    l2_penalty: f64,
    persistence_path: Option<PathBuf>,
}

impl Clone for RiskModel {
    fn clone(&self) -> Self {
        Self {
            params: self.params.clone(),
            learning_rate: self.learning_rate,
            l2_penalty: self.l2_penalty,
            persistence_path: self.persistence_path.clone(),
        }
    }
}

impl RiskModel {
    pub fn new(params: RiskModelParameters, learning_rate: f64, l2_penalty: f64) -> Self {
        Self {
            params,
            learning_rate,
            l2_penalty,
            persistence_path: None,
        }
    }

    pub fn with_persistence_path<P: AsRef<Path>>(mut self, path: P) -> Self {
        self.persistence_path = Some(path.as_ref().to_path_buf());
        self
    }

    pub fn load_or_default<P: AsRef<Path>>(path: Option<P>) -> Self {
        let persistence_path = path
            .map(|p| p.as_ref().to_path_buf())
            .unwrap_or_else(|| PathBuf::from(DEFAULT_MODEL_PATH));

        if let Some(model) = Self::load_from_file(&persistence_path) {
            return model;
        }

        let params = RiskModelParameters::new(
            -3.125,
            [
                -2.75, // distance (closer => higher risk)
                0.42,  // relative speed (faster => higher risk)
                0.18,  // stale TLE => higher risk
                2.10,  // baseline tracker risk score
            ],
        );

        Self {
            params,
            learning_rate: 5e-3,
            l2_penalty: 5e-4,
            persistence_path: Some(persistence_path),
        }
    }

    fn load_from_file(path: &Path) -> Option<Self> {
        let mut file = File::open(path).ok()?;
        let mut contents = String::new();
        if file.read_to_string(&mut contents).is_err() {
            return None;
        }

        if let Ok(persisted) = serde_json::from_str::<PersistedRiskModel>(&contents) {
            Some(Self {
                params: persisted.params,
                learning_rate: persisted.learning_rate,
                l2_penalty: persisted.l2_penalty,
                persistence_path: Some(path.to_path_buf()),
            })
        } else {
            None
        }
    }

    pub fn predict(&self, features: [f64; 4]) -> f64 {
        let mut z = self.params.bias;
        for (weight, feature) in self.params.coefficients.iter().zip(features.iter()) {
            z += weight * feature;
        }
        1.0 / (1.0 + (-z).exp())
    }

    pub fn update(&mut self, features: [f64; 4], label: f64) {
        let prediction = self.predict(features);
        let error = (prediction - label).clamp(-50.0, 50.0);

        self.params.bias -= self.learning_rate * (error + self.l2_penalty * self.params.bias);

        for idx in 0..self.params.coefficients.len() {
            let grad = error * features[idx] + self.l2_penalty * self.params.coefficients[idx];
            self.params.coefficients[idx] -= self.learning_rate * grad;
        }

        self.params.observation_count = self.params.observation_count.saturating_add(1);
        self.params.last_updated = Some(Utc::now());

        if self.params.observation_count % SAVE_INTERVAL == 0 {
            if let Err(err) = self.persist() {
                tracing::warn!("risk_model.persist.failure" = %err, "Failed to persist risk model state");
            }
        }
    }

    pub fn explain(&self) -> RiskModelExplanation {
        RiskModelExplanation {
            bias: self.params.bias,
            coefficients: self.params.coefficients,
            feature_order: [
                "minimum_distance_km",
                "relative_velocity_km_s",
                "tle_age_hours",
                "baseline_risk_score",
            ],
            observation_count: self.params.observation_count,
            learning_rate: self.learning_rate,
            l2_penalty: self.l2_penalty,
            last_updated: self.params.last_updated,
            persistence_path: self
                .persistence_path
                .as_ref()
                .map(|p| p.to_string_lossy().into_owned()),
        }
    }

    pub fn persist(&self) -> std::io::Result<()> {
        if let Some(path) = &self.persistence_path {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }

            let persisted = PersistedRiskModel {
                params: self.params.clone(),
                learning_rate: self.learning_rate,
                l2_penalty: self.l2_penalty,
            };

            let mut file = File::create(path)?;
            let payload = serde_json::to_string_pretty(&persisted)?;
            file.write_all(payload.as_bytes())?;
        }

        Ok(())
    }

    pub fn set_learning_rate(&mut self, rate: f64) {
        self.learning_rate = rate.max(1e-5).min(1e-1);
    }

    pub fn set_l2_penalty(&mut self, penalty: f64) {
        self.l2_penalty = penalty.max(0.0).min(1e-1);
    }

    pub fn persistence_path(&self) -> Option<&Path> {
        self.persistence_path.as_deref()
    }
}

impl Drop for RiskModel {
    fn drop(&mut self) {
        if let Err(err) = self.persist() {
            tracing::warn!("risk_model.persist.shutdown_failure" = %err, "Failed to persist risk model on drop");
        }
    }
}
