use crate::tle::{Result, SatelliteGroup, SatellitePosition, TleFetcher};
use crate::tracker::SatelliteTracker;
use chrono::{DateTime, Duration, Utc};
use std::sync::{Arc, Mutex};
use tokio::time::{interval, Duration as TokioDuration};

pub struct SatelliteApi {
    tracker: Arc<Mutex<SatelliteTracker>>,
    fetcher: TleFetcher,
    last_update: Arc<Mutex<DateTime<Utc>>>,
    update_interval_hours: i64,
}

impl SatelliteApi {
    pub fn new() -> Self {
        Self {
            tracker: Arc::new(Mutex::new(SatelliteTracker::new())),
            fetcher: TleFetcher::new(),
            last_update: Arc::new(Mutex::new(Utc::now() - Duration::days(1))), // Force initial update
            update_interval_hours: 6, // Update every 6 hours
        }
    }

    pub async fn initialize(&self) -> Result<()> {
        tracing::info!("Initializing Satellite API...");

        // Initial data load
        self.update_satellite_data().await?;

        // Start background update task
        self.start_background_updates().await;

        tracing::info!("Satellite API initialized successfully");
        Ok(())
    }

    pub async fn get_all_satellites(
        &self,
        page: Option<usize>,
        limit: Option<usize>,
    ) -> Result<Vec<SatellitePosition>> {
        self.ensure_data_fresh().await?;

        let tracker = self.tracker.lock().unwrap();
        let mut positions = tracker.get_all_positions()?;

        // Apply pagination if requested
        if let (Some(page), Some(limit)) = (page, limit) {
            let start = page * limit;
            let end = std::cmp::min(start + limit, positions.len());

            if start < positions.len() {
                positions = positions[start..end].to_vec();
            } else {
                positions = Vec::new();
            }
        }

        Ok(positions)
    }

    pub async fn get_all_satellites_with_offset(
        &self,
        minutes_offset: i64,
        limit: Option<usize>,
    ) -> Result<Vec<SatellitePosition>> {
        self.ensure_data_fresh().await?;

        let target_time = Utc::now() + Duration::minutes(minutes_offset);

        let tracker = self.tracker.lock().unwrap();
        let mut positions = tracker.get_all_positions_at(target_time)?;

        positions.sort_by(|a, b| a.norad_id.cmp(&b.norad_id));

        if let Some(limit) = limit {
            positions.truncate(limit);
        }

        Ok(positions)
    }

    pub async fn get_satellite(&self, norad_id: u64) -> Result<SatellitePosition> {
        self.ensure_data_fresh().await?;

        let tracker = self.tracker.lock().unwrap();
        tracker.get_satellite_position(norad_id)
    }

    pub async fn get_satellite_group(&self, group_name: &str) -> Result<SatelliteGroup> {
        self.ensure_data_fresh().await?;

        let tracker = self.tracker.lock().unwrap();
        let satellites = tracker.get_satellites_by_group(group_name)?;
        let count = satellites.len();

        Ok(SatelliteGroup {
            name: group_name.to_string(),
            satellites,
            count,
        })
    }

    pub async fn get_statistics(&self) -> Result<serde_json::Value> {
        self.ensure_data_fresh().await?;

        let tracker = self.tracker.lock().unwrap();
        let total_satellites = tracker.get_satellite_count();
        let last_update = *self.last_update.lock().unwrap();

        // Get group counts
        let starlink_count = tracker.get_satellites_by_group("starlink")?.len();
        let gps_count = tracker.get_satellites_by_group("gps")?.len();
        let galileo_count = tracker.get_satellites_by_group("galileo")?.len();

        Ok(serde_json::json!({
            "total_satellites": total_satellites,
            "last_update": last_update,
            "groups": {
                "starlink": starlink_count,
                "gps": gps_count,
                "galileo": galileo_count
            },
            "update_interval_hours": self.update_interval_hours
        }))
    }

    async fn update_satellite_data(&self) -> Result<()> {
        tracing::info!("Initializing satellite data...");

        let mut all_satellites = Vec::new();

        // Fetch from multiple satellite sources
        tracing::info!("Fetching satellites from multiple sources...");

        // 1. Navigation satellites (GPS, GLONASS, Galileo, BeiDou)
        match self.fetcher.fetch_navigation_satellites().await {
            Ok(mut sats) => {
                tracing::info!("✅ Fetched {} navigation satellites", sats.len());
                all_satellites.append(&mut sats);
            }
            Err(e) => tracing::warn!("❌ Failed to fetch navigation satellites: {}", e),
        }

        // 2. Communication satellites (Geostationary, Iridium, etc.)
        match self.fetcher.fetch_communication_satellites().await {
            Ok(mut sats) => {
                tracing::info!("✅ Fetched {} communication satellites", sats.len());
                all_satellites.append(&mut sats);
            }
            Err(e) => tracing::warn!("❌ Failed to fetch communication satellites: {}", e),
        }

        // 3. Active/visible satellites (weather, science, etc.)
        match self.fetcher.fetch_active_satellites().await {
            Ok(mut sats) => {
                tracing::info!("✅ Fetched {} active satellites", sats.len());
                all_satellites.append(&mut sats);
            }
            Err(e) => tracing::warn!("❌ Failed to fetch active satellites: {}", e),
        }

        // 4. Space stations (ISS, etc.)
        match self.fetcher.fetch_iss().await {
            Ok(mut sats) => {
                tracing::info!("✅ Fetched {} space stations", sats.len());
                all_satellites.append(&mut sats);
            }
            Err(e) => tracing::warn!("❌ Failed to fetch space stations: {}", e),
        }

        // 5. Starlink constellation
        match self.fetcher.fetch_starlink().await {
            Ok(mut sats) => {
                tracing::info!("✅ Fetched {} Starlink satellites", sats.len());
                all_satellites.append(&mut sats);
            }
            Err(e) => tracing::warn!("❌ Failed to fetch Starlink satellites: {}", e),
        }

        // If we got no satellites at all, fall back to sample data
        if all_satellites.is_empty() {
            tracing::error!("No satellites fetched from any source");
            return Err(crate::tle::SatApiError::NoSatelliteData);
        }

        tracing::info!("🛰️ Total satellites collected: {}", all_satellites.len());

        // Remove duplicates based on NORAD ID
        all_satellites.sort_by_key(|s| s.norad_id);
        all_satellites.dedup_by_key(|s| s.norad_id);

        // Load into tracker
        let mut tracker = self.tracker.lock().unwrap();
        tracker.load_satellites(all_satellites)?;

        // Update timestamp
        *self.last_update.lock().unwrap() = Utc::now();

        tracing::info!("Satellite data initialization completed");
        Ok(())
    }

    async fn ensure_data_fresh(&self) -> Result<()> {
        let last_update = *self.last_update.lock().unwrap();
        let now = Utc::now();

        if now.signed_duration_since(last_update) > Duration::hours(self.update_interval_hours) {
            tracing::info!("Data is stale, updating...");
            self.update_satellite_data().await?;
        }

        Ok(())
    }

    async fn start_background_updates(&self) {
        let tracker = Arc::clone(&self.tracker);
        let last_update = Arc::clone(&self.last_update);
        let fetcher = TleFetcher::new();
        let update_interval_hours = self.update_interval_hours;

        tokio::spawn(async move {
            let mut interval = interval(TokioDuration::from_secs(
                (update_interval_hours * 3600) as u64,
            ));

            loop {
                interval.tick().await;

                tracing::info!("Background satellite data update starting...");

                // Fetch new data from all sources
                let mut all_satellites = Vec::new();

                // Navigation satellites
                if let Ok(mut sats) = fetcher.fetch_navigation_satellites().await {
                    all_satellites.append(&mut sats);
                }

                // Communication satellites
                if let Ok(mut sats) = fetcher.fetch_communication_satellites().await {
                    all_satellites.append(&mut sats);
                }

                // Active satellites
                if let Ok(mut sats) = fetcher.fetch_active_satellites().await {
                    all_satellites.append(&mut sats);
                }

                // Space stations
                if let Ok(mut sats) = fetcher.fetch_iss().await {
                    all_satellites.append(&mut sats);
                }

                // Starlink constellation
                if let Ok(mut sats) = fetcher.fetch_starlink().await {
                    all_satellites.append(&mut sats);
                }

                // Remove duplicates
                all_satellites.sort_by_key(|s| s.norad_id);
                all_satellites.dedup_by_key(|s| s.norad_id);

                if all_satellites.is_empty() {
                    tracing::warn!(
                        "Background update received no satellites; retaining existing catalog"
                    );
                    continue;
                }

                // Update tracker
                if let Ok(mut tracker_guard) = tracker.lock() {
                    if let Err(e) = tracker_guard.load_satellites(all_satellites) {
                        tracing::error!("Failed to update satellite data in background: {}", e);
                        continue;
                    }
                }

                // Update timestamp
                if let Ok(mut last_update_guard) = last_update.lock() {
                    *last_update_guard = Utc::now();
                }

                tracing::info!("Background satellite data update completed");
            }
        });
    }
}
