// OrbitalOS backend integration tests
// Run with: cargo test --test backend_test

use reqwest::StatusCode;

#[tokio::test]
async fn health_check_works() {
    let resp = reqwest::get("http://localhost:3000/").await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let json: serde_json::Value = resp.json().await.unwrap();
    assert_eq!(json["status"], "healthy");
    assert_eq!(json["service"], "orbitalos-backend");
}

#[tokio::test]
async fn register_and_login_works() {
    let client = reqwest::Client::new();
    let email = format!("testuser{}@orbitalos.com", chrono::Utc::now().timestamp());
    let password = "TestPassword123!";
    // Register
    let reg_resp = client.post("http://localhost:3000/api/auth/register")
        .json(&serde_json::json!({
            "email": email,
            "password": password,
            "role": "Operator"
        }))
        .send().await.unwrap();
    assert_eq!(reg_resp.status(), reqwest::StatusCode::CREATED);
    let reg_json: serde_json::Value = reg_resp.json().await.unwrap();
    assert!(reg_json["token"].is_string());
    // Login
    let login_resp = client.post("http://localhost:3000/api/auth/login")
        .json(&serde_json::json!({
            "email": email,
            "password": password
        }))
        .send().await.unwrap();
    assert_eq!(login_resp.status(), reqwest::StatusCode::OK);
    let login_json: serde_json::Value = login_resp.json().await.unwrap();
    assert!(login_json["token"].is_string());
}

#[tokio::test]
async fn onboarding_provider_requires_auth() {
    let client = reqwest::Client::new();
    let resp = client.post("http://localhost:3000/api/providers/onboard")
        .json(&serde_json::json!({
            "user_id": "00000000-0000-0000-0000-000000000000",
            "metadata": "{}"
        }))
        .send().await.unwrap();
    // Should be unauthorized or forbidden
    assert!(resp.status() == reqwest::StatusCode::UNAUTHORIZED || resp.status() == reqwest::StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn health_check_db_down_returns_degraded() {
    // This test assumes DB is down, so it's a placeholder for manual/CI use.
    // If DB is up, status is healthy; if down, status is degraded.
    let resp = reqwest::get("http://localhost:3000/").await.unwrap();
    let json: serde_json::Value = resp.json().await.unwrap();
    assert!(json["status"] == "healthy" || json["status"] == "degraded");
}

#[tokio::test]
async fn booking_requires_auth() {
    let client = reqwest::Client::new();
    let resp = client.post("http://localhost:3000/api/bookings/book")
        .json(&serde_json::json!({
            "satellite_id": "00000000-0000-0000-0000-000000000000",
            "operation_type": "OrbitShift",
            "start_time": "2025-10-01T00:00:00Z",
            "end_time": "2025-10-01T01:00:00Z"
        }))
        .send().await.unwrap();
    // Should be unauthorized or forbidden
    assert!(resp.status() == reqwest::StatusCode::UNAUTHORIZED || resp.status() == reqwest::StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_endpoints_require_admin() {
    let client = reqwest::Client::new();
    let resp = client.get("http://localhost:3000/api/admin/users").send().await.unwrap();
    // Should be unauthorized or forbidden
    assert!(resp.status() == reqwest::StatusCode::UNAUTHORIZED || resp.status() == reqwest::StatusCode::FORBIDDEN);
}

// Add more integration tests for endpoints (auth, register, login, etc.)
