use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SatelliteData {
    pub norad_id: u64,
    pub name: String,
    pub tle_line1: String,
    pub tle_line2: String,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Green,
    Amber,
    Red,
}

#[derive(Debug, Clone, Serialize)]
pub struct SatellitePosition {
    pub norad_id: u64,
    pub name: String,
    pub lat_deg: f64,
    pub lon_deg: f64,
    pub alt_km: f64,
    pub velocity_km_s: f64,
    pub timestamp: DateTime<Utc>,
    pub risk_score: f64,
    pub risk_level: RiskLevel,
    pub risk_reason: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SatelliteGroup {
    pub name: String,
    pub satellites: Vec<SatellitePosition>,
    pub count: usize,
}

#[derive(Error, Debug)]
pub enum SatApiError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("TLE parsing failed: {0}")]
    TleParseError(String),
    #[error("SGP4 propagation failed: {0}")]
    PropagationError(String),
    #[error("No satellite data available from upstream sources")]
    NoSatelliteData,
    #[error("Satellite not found: {0}")]
    SatelliteNotFound(u64),
}

pub type Result<T> = std::result::Result<T, SatApiError>;

pub struct TleFetcher {
    client: reqwest::Client,
}

impl TleFetcher {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    pub async fn fetch_active_satellites(&self) -> Result<Vec<SatelliteData>> {
        // Modern Celestrak GP API URLs
        let urls = [
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle", // All active satellites
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle", // Bright satellites
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle", // Weather satellites
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle", // Science satellites
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=resource&FORMAT=tle", // Earth resource
        ];

        let mut all_satellites = Vec::new();

        for url in &urls {
            match self.fetch_tle_data(url).await {
                Ok(mut sats) => {
                    tracing::info!("✅ Found {} satellites from {}", sats.len(), url);
                    all_satellites.append(&mut sats);
                }
                Err(e) => tracing::warn!("❌ Failed to fetch from {}: {}", url, e),
            }
        }

        // Remove duplicates based on NORAD ID
        all_satellites.sort_by_key(|s| s.norad_id);
        all_satellites.dedup_by_key(|s| s.norad_id);

        tracing::info!(
            "🛰️ Total unique active satellites collected: {}",
            all_satellites.len()
        );
        Ok(all_satellites)
    }

    pub async fn fetch_starlink(&self) -> Result<Vec<SatelliteData>> {
        // Modern Celestrak GP API for Starlink
        let url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle";

        match self.fetch_tle_data(url).await {
            Ok(sats) => {
                tracing::info!("✅ Found {} Starlink satellites", sats.len());
                Ok(sats)
            }
            Err(e) => {
                tracing::warn!("❌ Failed to fetch Starlink satellites: {}", e);
                Ok(Vec::new())
            }
        }
    }

    pub async fn fetch_gps(&self) -> Result<Vec<SatelliteData>> {
        let url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle";
        self.fetch_tle_data(url).await
    }

    pub async fn fetch_galileo(&self) -> Result<Vec<SatelliteData>> {
        let url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle";
        self.fetch_tle_data(url).await
    }

    pub async fn fetch_iss(&self) -> Result<Vec<SatelliteData>> {
        let url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle";
        self.fetch_tle_data(url).await
    }

    pub async fn fetch_communication_satellites(&self) -> Result<Vec<SatelliteData>> {
        let urls = [
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle", // Geostationary
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=tle", // Intelsat
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=tle", // Iridium
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=tle", // Globalstar
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=tle", // SES
        ];

        let mut all_satellites = Vec::new();

        for url in &urls {
            match self.fetch_tle_data(url).await {
                Ok(mut sats) => {
                    tracing::info!(
                        "✅ Found {} communication satellites from {}",
                        sats.len(),
                        url
                    );
                    all_satellites.append(&mut sats);
                }
                Err(e) => {
                    tracing::warn!("❌ Failed to fetch communication sats from {}: {}", url, e)
                }
            }
        }

        // Remove duplicates
        all_satellites.sort_by_key(|s| s.norad_id);
        all_satellites.dedup_by_key(|s| s.norad_id);

        Ok(all_satellites)
    }

    pub async fn fetch_navigation_satellites(&self) -> Result<Vec<SatelliteData>> {
        let urls = [
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle", // GPS operational
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=glonass-ops&FORMAT=tle", // GLONASS operational
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle",     // Galileo
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle",      // BeiDou
        ];

        let mut all_satellites = Vec::new();

        for url in &urls {
            match self.fetch_tle_data(url).await {
                Ok(mut sats) => {
                    tracing::info!("✅ Found {} navigation satellites from {}", sats.len(), url);
                    all_satellites.append(&mut sats);
                }
                Err(e) => tracing::warn!("❌ Failed to fetch navigation sats from {}: {}", url, e),
            }
        }

        // Remove duplicates
        all_satellites.sort_by_key(|s| s.norad_id);
        all_satellites.dedup_by_key(|s| s.norad_id);

        tracing::info!(
            "🧭 Total unique navigation satellites: {}",
            all_satellites.len()
        );
        Ok(all_satellites)
    }

    async fn fetch_tle_data(&self, url: &str) -> Result<Vec<SatelliteData>> {
        tracing::info!("Fetching TLE data from: {}", url);

        let response = self.client.get(url).send().await?;
        let status = response.status();

        if !status.is_success() {
            tracing::error!("HTTP request failed with status: {}", status);
            return Err(SatApiError::TleParseError(format!(
                "HTTP {} from {}",
                status, url
            )));
        }

        let text = response.text().await?;
        tracing::debug!("Received {} bytes of TLE data from {}", text.len(), url);

        if text.is_empty() {
            tracing::warn!("Empty response from {}", url);
            return Ok(Vec::new());
        }

        self.parse_tle_text(&text)
    }

    fn parse_tle_text(&self, text: &str) -> Result<Vec<SatelliteData>> {
        let lines: Vec<&str> = text
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect();

        let mut satellites = Vec::new();
        let now = Utc::now();

        tracing::debug!("Processing {} lines of TLE data", lines.len());

        // More flexible TLE parsing - look for TLE line pairs
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i];

            // Look for TLE line 1 (starts with '1 ')
            if line.starts_with("1 ") && line.len() >= 69 {
                // Found line 1, look for corresponding line 2
                if i + 1 < lines.len() {
                    let line2 = lines[i + 1];
                    if line2.starts_with("2 ") && line2.len() >= 69 {
                        // Extract NORAD ID from line 1 (positions 2-7)
                        let norad_str = &line[2..7].trim();
                        if let Ok(norad_id) = norad_str.parse::<u64>() {
                            // Look for satellite name (could be line before, or generate from NORAD ID)
                            let name = if i > 0
                                && !lines[i - 1].starts_with("1 ")
                                && !lines[i - 1].starts_with("2 ")
                            {
                                lines[i - 1].to_string()
                            } else {
                                format!("NORAD {}", norad_id)
                            };

                            satellites.push(SatelliteData {
                                norad_id,
                                name,
                                tle_line1: line.to_string(),
                                tle_line2: line2.to_string(),
                                last_updated: now,
                            });
                        }
                        i += 2; // Skip both TLE lines
                        continue;
                    }
                }
            }
            i += 1;
        }

        tracing::info!("Parsed {} satellites from TLE data", satellites.len());
        if satellites.is_empty() {
            tracing::warn!("No satellites parsed. First few lines of data:");
            for (idx, line) in lines.iter().take(10).enumerate() {
                tracing::warn!("Line {}: '{}'", idx, line);
            }
        }

        Ok(satellites)
    }
}
