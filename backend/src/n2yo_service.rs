use serde::{Deserialize, Serialize};
use reqwest::Client;
use anyhow::Result;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2YOSatelliteInfo {
    pub satid: i32,
    pub satname: String,
    pub transactionscount: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2YOPosition {
    pub satlatitude: f64,
    pub satlongitude: f64,
    pub sataltitude: f64,
    pub azimuth: f64,
    pub elevation: f64,
    pub ra: f64,
    pub dec: f64,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2YOPositionsResponse {
    pub info: N2YOSatelliteInfo,
    pub positions: Vec<N2YOPosition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2YOTLEResponse {
    pub info: N2YOSatelliteInfo,
    pub tle: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2YOPass {
    pub start_az: f64,
    pub start_az_compass: String,
    pub start_el: f64,
    pub start_utc: i64,
    pub max_az: f64,
    pub max_az_compass: String,
    pub max_el: f64,
    pub max_utc: i64,
    pub end_az: f64,
    pub end_az_compass: String,
    pub end_el: f64,
    pub end_utc: i64,
    pub mag: f64,
    pub duration: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2YOPassesResponse {
    pub info: N2YOSatelliteInfo,
    pub passescount: i32,
    pub passes: Vec<N2YOPass>,
}

#[derive(Clone)]
pub struct N2YOService {
    client: Client,
    api_key: String,
    base_url: String,
}

impl N2YOService {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            base_url: "https://api.n2yo.com/rest/v1/satellite".to_string(),
        }
    }

    pub async fn get_tle(&self, norad_id: i32) -> Result<N2YOTLEResponse> {
        let url = format!("{}/tle/{}&apiKey={}", self.base_url, norad_id, self.api_key);
        let response = self.client.get(&url).send().await?;
        let tle_data: N2YOTLEResponse = response.json().await?;
        Ok(tle_data)
    }

    pub async fn get_positions(
        &self,
        norad_id: i32,
        observer_lat: f64,
        observer_lng: f64,
        observer_alt: f64,
        seconds: i32,
    ) -> Result<N2YOPositionsResponse> {
        let url = format!(
            "{}/positions/{}/{}/{}/{}/{}&apiKey={}",
            self.base_url, norad_id, observer_lat, observer_lng, observer_alt, seconds, self.api_key
        );
        let response = self.client.get(&url).send().await?;
        let positions: N2YOPositionsResponse = response.json().await?;
        Ok(positions)
    }

    pub async fn get_visual_passes(
        &self,
        norad_id: i32,
        observer_lat: f64,
        observer_lng: f64,
        observer_alt: f64,
        days: i32,
        min_visibility: i32,
    ) -> Result<N2YOPassesResponse> {
        let url = format!(
            "{}/visualpasses/{}/{}/{}/{}/{}/{}&apiKey={}",
            self.base_url, norad_id, observer_lat, observer_lng, observer_alt, days, min_visibility, self.api_key
        );
        let response = self.client.get(&url).send().await?;
        let passes: N2YOPassesResponse = response.json().await?;
        Ok(passes)
    }

    pub async fn get_radio_passes(
        &self,
        norad_id: i32,
        observer_lat: f64,
        observer_lng: f64,
        observer_alt: f64,
        days: i32,
        min_elevation: i32,
    ) -> Result<N2YOPassesResponse> {
        let url = format!(
            "{}/radiopasses/{}/{}/{}/{}/{}/{}&apiKey={}",
            self.base_url, norad_id, observer_lat, observer_lng, observer_alt, days, min_elevation, self.api_key
        );
        let response = self.client.get(&url).send().await?;
        let passes: N2YOPassesResponse = response.json().await?;
        Ok(passes)
    }

    // Get what's currently above the observer
    pub async fn get_above(
        &self,
        observer_lat: f64,
        observer_lng: f64,
        observer_alt: f64,
        search_radius: i32,
        category_id: i32,
    ) -> Result<Vec<N2YOSatelliteInfo>> {
        let url = format!(
            "{}/above/{}/{}/{}/{}/{}&apiKey={}",
            self.base_url, observer_lat, observer_lng, observer_alt, search_radius, category_id, self.api_key
        );
        let response = self.client.get(&url).send().await?;
        let data: serde_json::Value = response.json().await?;
        
        // Parse the response to extract satellite info
        let satellites = data["above"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .map(|sat| N2YOSatelliteInfo {
                satid: sat["satid"].as_i64().unwrap_or(0) as i32,
                satname: sat["satname"].as_str().unwrap_or("Unknown").to_string(),
                transactionscount: 0, // This is not in the above response
            })
            .collect();

        Ok(satellites)
    }
}
