#!/usr/bin/env python3
"""
Mock Satellite API Backend Server
Provides the same endpoints as the Rust backend for frontend testing
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import random
import time
from datetime import datetime, timedelta
import math

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Mock satellite data
MOCK_SATELLITES = [
    {
        "norad_id": 25544,
        "name": "ISS (ZARYA)",
        "tle_line1": "1 25544U 98067A   23001.00000000  .00001234  00000-0  12345-4 0  9999",
        "tle_line2": "2 25544  51.6400 195.0000 0003572  73.1000 287.0000 15.50000000123456",
        "position": {
            "latitude": random.uniform(-90, 90),
            "longitude": random.uniform(-180, 180),
            "altitude": random.uniform(400, 450)
        },
        "velocity": {
            "x": random.uniform(-7.5, 7.5),
            "y": random.uniform(-7.5, 7.5),
            "z": random.uniform(-7.5, 7.5)
        },
        "risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "last_updated": datetime.now().isoformat()
    },
    {
        "norad_id": 43013,
        "name": "STARLINK-1007",
        "tle_line1": "1 43013U 17073A   23001.00000000  .00002345  00000-0  23456-4 0  9999",
        "tle_line2": "2 43013  53.0000 180.0000 0001234  90.0000 270.0000 15.25000000234567",
        "position": {
            "latitude": random.uniform(-90, 90),
            "longitude": random.uniform(-180, 180),
            "altitude": random.uniform(540, 570)
        },
        "velocity": {
            "x": random.uniform(-7.6, 7.6),
            "y": random.uniform(-7.6, 7.6),
            "z": random.uniform(-7.6, 7.6)
        },
        "risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "last_updated": datetime.now().isoformat()
    },
    {
        "norad_id": 48274,
        "name": "COSMOS 2551",
        "tle_line1": "1 48274U 21036A   23001.00000000  .00001111  00000-0  11111-4 0  9999",
        "tle_line2": "2 48274  64.8000 120.0000 0012345 120.0000 240.0000 14.19000000345678",
        "position": {
            "latitude": random.uniform(-90, 90),
            "longitude": random.uniform(-180, 180),
            "altitude": random.uniform(19000, 21000)
        },
        "velocity": {
            "x": random.uniform(-3.8, 3.8),
            "y": random.uniform(-3.8, 3.8),
            "z": random.uniform(-3.8, 3.8)
        },
        "risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "last_updated": datetime.now().isoformat()
    }
]

def update_satellite_positions():
    """Simulate satellite movement by updating positions"""
    for satellite in MOCK_SATELLITES:
        # Simulate orbital movement
        satellite["position"]["latitude"] += random.uniform(-0.1, 0.1)
        satellite["position"]["longitude"] += random.uniform(-0.5, 0.5)
        satellite["position"]["altitude"] += random.uniform(-1, 1)
        
        # Keep coordinates in valid ranges
        satellite["position"]["latitude"] = max(-90, min(90, satellite["position"]["latitude"]))
        satellite["position"]["longitude"] = ((satellite["position"]["longitude"] + 180) % 360) - 180
        satellite["position"]["altitude"] = max(100, satellite["position"]["altitude"])
        
        satellite["last_updated"] = datetime.now().isoformat()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Mock Satellite API",
        "version": "1.0.0"
    })

@app.route('/api/v1/satellites', methods=['GET'])
def get_all_satellites():
    """Get all satellites"""
    update_satellite_positions()
    return jsonify({
        "satellites": MOCK_SATELLITES,
        "total_count": len(MOCK_SATELLITES),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/v1/satellite/<int:norad_id>', methods=['GET'])
def get_satellite(norad_id):
    """Get specific satellite by NORAD ID"""
    update_satellite_positions()
    satellite = next((s for s in MOCK_SATELLITES if s["norad_id"] == norad_id), None)
    
    if not satellite:
        return jsonify({"error": "Satellite not found"}), 404
    
    return jsonify(satellite)

@app.route('/api/v1/statistics', methods=['GET'])
def get_statistics():
    """Get satellite statistics"""
    total_satellites = len(MOCK_SATELLITES)
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    
    for satellite in MOCK_SATELLITES:
        risk_counts[satellite["risk_level"]] += 1
    
    return jsonify({
        "total_satellites": total_satellites,
        "risk_distribution": risk_counts,
        "active_alerts": random.randint(0, 5),
        "last_updated": datetime.now().isoformat(),
        "tracking_accuracy": round(random.uniform(95.5, 99.9), 1)
    })

@app.route('/api/v1/satellites/propagate', methods=['GET'])
def propagate_satellites():
    """Propagate satellite positions to a future time"""
    target_time = request.args.get('time', datetime.now().isoformat())
    
    update_satellite_positions()
    
    # Simulate propagation by slightly modifying positions
    propagated_satellites = []
    for satellite in MOCK_SATELLITES:
        propagated = satellite.copy()
        propagated["position"] = satellite["position"].copy()
        
        # Simulate future position
        time_diff = random.uniform(0, 3600)  # Up to 1 hour in the future
        propagated["position"]["latitude"] += time_diff * 0.001 * random.uniform(-1, 1)
        propagated["position"]["longitude"] += time_diff * 0.005 * random.uniform(-1, 1)
        propagated["position"]["altitude"] += time_diff * 0.0001 * random.uniform(-1, 1)
        
        # Keep in valid ranges
        propagated["position"]["latitude"] = max(-90, min(90, propagated["position"]["latitude"]))
        propagated["position"]["longitude"] = ((propagated["position"]["longitude"] + 180) % 360) - 180
        propagated["position"]["altitude"] = max(100, propagated["position"]["altitude"])
        
        propagated["predicted_time"] = target_time
        propagated_satellites.append(propagated)
    
    return jsonify({
        "satellites": propagated_satellites,
        "target_time": target_time,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/v1/conjunctions/analyze', methods=['POST'])
def analyze_conjunctions():
    """Analyze potential satellite conjunctions"""
    request_data = request.get_json() or {}
    
    # Mock conjunction analysis
    conjunctions = []
    
    # Generate random conjunction events
    for i in range(random.randint(0, 3)):
        primary_sat = random.choice(MOCK_SATELLITES)
        secondary_sat = random.choice([s for s in MOCK_SATELLITES if s != primary_sat])
        
        conjunction = {
            "id": f"conj_{int(time.time())}_{i}",
            "primary_satellite": {
                "norad_id": primary_sat["norad_id"],
                "name": primary_sat["name"]
            },
            "secondary_satellite": {
                "norad_id": secondary_sat["norad_id"],
                "name": secondary_sat["name"]
            },
            "time_of_closest_approach": (datetime.now() + timedelta(hours=random.uniform(1, 48))).isoformat(),
            "miss_distance": round(random.uniform(0.1, 10.0), 2),  # km
            "probability_of_collision": round(random.uniform(0.0001, 0.1), 6),
            "risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
            "confidence": round(random.uniform(0.8, 0.99), 3)
        }
        conjunctions.append(conjunction)
    
    return jsonify({
        "conjunctions": conjunctions,
        "analysis_time": datetime.now().isoformat(),
        "total_analyzed": len(MOCK_SATELLITES),
        "ai_model_version": "mock-v1.0"
    })

@app.route('/api/v1/risk/predict', methods=['POST'])
def predict_risk():
    """Predict collision risk"""
    request_data = request.get_json() or {}
    
    # Mock risk prediction
    risk_prediction = {
        "satellite_id": request_data.get("satellite_id", MOCK_SATELLITES[0]["norad_id"]),
        "predicted_risk": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "risk_score": round(random.uniform(0, 1), 3),
        "contributing_factors": [
            {
                "factor": "Orbital Density",
                "weight": round(random.uniform(0.1, 0.9), 2),
                "impact": random.choice(["positive", "negative"])
            },
            {
                "factor": "Solar Activity",
                "weight": round(random.uniform(0.1, 0.9), 2),
                "impact": random.choice(["positive", "negative"])
            },
            {
                "factor": "Debris Environment",
                "weight": round(random.uniform(0.1, 0.9), 2),
                "impact": random.choice(["positive", "negative"])
            }
        ],
        "prediction_time": datetime.now().isoformat(),
        "valid_until": (datetime.now() + timedelta(hours=24)).isoformat()
    }
    
    return jsonify(risk_prediction)

@app.route('/api/v1/alerts/stream', methods=['GET'])
def stream_alerts():
    """Stream alerts (simplified for mock)"""
    alerts = []
    
    # Generate random alerts
    for i in range(random.randint(0, 2)):
        alert = {
            "id": f"alert_{int(time.time())}_{i}",
            "type": random.choice(["conjunction", "debris", "solar_storm", "anomaly"]),
            "severity": random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            "satellite_id": random.choice(MOCK_SATELLITES)["norad_id"],
            "message": f"Mock alert {i + 1} - {random.choice(['Potential conjunction detected', 'Anomalous behavior observed', 'Space weather alert'])}",
            "timestamp": datetime.now().isoformat(),
            "acknowledged": False
        }
        alerts.append(alert)
    
    return jsonify({
        "alerts": alerts,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🛰️ Starting Mock Satellite API Server...")
    print("📡 Server will be available at http://localhost:8080")
    print("🔄 Providing mock data for frontend testing")
    print("⚡ Press Ctrl+C to stop")
    
    app.run(host='127.0.0.1', port=8080, debug=True)