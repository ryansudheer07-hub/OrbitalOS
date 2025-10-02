use sat_api::tle::TleFetcher;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    let fetcher = TleFetcher::new();

    println!("🛰️ Testing TLE parsing for different satellite sources...\n");

    // Test GPS satellites (known to work)
    println!("📡 Testing GPS satellites:");
    match fetcher.fetch_gps().await {
        Ok(sats) => println!("✅ GPS: Found {} satellites", sats.len()),
        Err(e) => println!("❌ GPS failed: {}", e),
    }

    // Test active satellites
    println!("\n🌍 Testing active satellites:");
    match fetcher.fetch_active_satellites().await {
        Ok(sats) => {
            println!("✅ Active: Found {} satellites", sats.len());
            if sats.len() > 0 {
                println!(
                    "   First satellite: {} (NORAD {})",
                    sats[0].name, sats[0].norad_id
                );
            }
        }
        Err(e) => println!("❌ Active failed: {}", e),
    }

    // Test Starlink
    println!("\n🚀 Testing Starlink satellites:");
    match fetcher.fetch_starlink().await {
        Ok(sats) => {
            println!("✅ Starlink: Found {} satellites", sats.len());
            if sats.len() > 0 {
                println!(
                    "   First satellite: {} (NORAD {})",
                    sats[0].name, sats[0].norad_id
                );
            }
        }
        Err(e) => println!("❌ Starlink failed: {}", e),
    }

    // Test navigation satellites
    println!("\n🧭 Testing navigation satellites:");
    match fetcher.fetch_navigation_satellites().await {
        Ok(sats) => {
            println!("✅ Navigation: Found {} satellites", sats.len());
            if sats.len() > 0 {
                println!(
                    "   First satellite: {} (NORAD {})",
                    sats[0].name, sats[0].norad_id
                );
            }
        }
        Err(e) => println!("❌ Navigation failed: {}", e),
    }

    // Test communication satellites
    println!("\n� Testing communication satellites:");
    match fetcher.fetch_communication_satellites().await {
        Ok(sats) => {
            println!("✅ Communication: Found {} satellites", sats.len());
            if sats.len() > 0 {
                println!(
                    "   First satellite: {} (NORAD {})",
                    sats[0].name, sats[0].norad_id
                );
            }
        }
        Err(e) => println!("❌ Communication failed: {}", e),
    }

    // Test direct URL fetch to see raw data from new API
    println!("\n🔍 Testing new Celestrak GP API...");
    let client = reqwest::Client::new();
    match client
        .get("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle")
        .send()
        .await
    {
        Ok(response) => {
            println!("✅ HTTP Status: {}", response.status());
            match response.text().await {
                Ok(text) => {
                    let lines: Vec<&str> = text.lines().take(15).collect();
                    println!("📄 First 15 lines from new GP API:");
                    for (i, line) in lines.iter().enumerate() {
                        println!("   {}: '{}'", i + 1, line);
                    }
                }
                Err(e) => println!("❌ Failed to read response: {}", e),
            }
        }
        Err(e) => println!("❌ HTTP request failed: {}", e),
    }
}
