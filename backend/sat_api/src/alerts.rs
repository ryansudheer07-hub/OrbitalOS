use chrono::{DateTime, Utc};
use serde::Serialize;
use tokio::sync::broadcast::{self, Receiver, Sender};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertCategory {
    CollisionRisk,
    ReservationConflict,
    ServiceHealth,
}

#[derive(Debug, Clone, Serialize)]
pub struct LiveAlert {
    pub id: Uuid,
    pub tenant_id: String,
    pub title: String,
    pub message: String,
    pub severity: AlertSeverity,
    pub category: AlertCategory,
    pub created_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
}

#[derive(Clone)]
pub struct AlertHub {
    sender: Sender<LiveAlert>,
}

impl AlertHub {
    pub fn new(buffer: usize) -> Self {
        let (sender, _) = broadcast::channel(buffer);
        Self { sender }
    }

    pub fn subscribe(&self) -> Receiver<LiveAlert> {
        self.sender.subscribe()
    }

    pub fn publish(&self, alert: LiveAlert) {
        let _ = self.sender.send(alert);
    }
}
