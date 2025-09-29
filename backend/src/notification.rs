use reqwest::Client;
use serde_json::json;
use std::env;

pub async fn send_email(to_email: &str, to_name: &str, subject: &str, content: &str) -> Result<(), Box<dyn std::error::Error>> {
    let api_key = env::var("SENDGRID_API_KEY")?;
    let sender_email = env::var("SENDER_EMAIL")?;
    let sender_name = env::var("SENDER_NAME")?;

    let client = Client::new();

    let body = json!({
        "personalizations": [{
            "to": [{
                "email": to_email,
                "name": to_name
            }]
        }],
        "from": {
            "email": sender_email,
            "name": sender_name
        },
        "subject": subject,
        "content": [{
            "type": "text/plain",
            "value": content
        }]
    });

    let res = client
        .post("https://api.sendgrid.com/v3/mail/send")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err(format!("Failed to send email: {}", res.text().await?).into())
    }
}
