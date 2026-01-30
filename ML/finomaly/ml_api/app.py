from flask import Flask, request, jsonify
import pickle
import numpy as np
from datetime import datetime

app = Flask(__name__)

# Load model & scaler
with open("models/isolation_forest.pkl", "rb") as f:
    model = pickle.load(f)

with open("models/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

@app.route("/health", methods=["GET"])
def health():
    return {"status": "Finomaly ML API running"}

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    features = np.array([[
        data["z_score"],
        data["time_since_last"],
        data["tx_per_day"]
    ]])

    scaled = scaler.transform(features)
    prediction = model.predict(scaled)[0]
    raw_score = -model.decision_function(scaled)[0]
    risk_score = (raw_score + 0.5) * 100
    risk_score = min(max(risk_score, 0), 100)

    if risk_score >= 80:
        action = "block"
    elif risk_score >= 60:
        action = "review"
    else:
        action = "allow"

    return jsonify({
        "prediction": "anomaly" if prediction == -1 else "normal",
        "risk_score": round(risk_score, 2),
        "action": action
    })

@app.route("/analyze_transaction", methods=["POST"])
def analyze_transaction():
    data = request.json
    
    # Extract features from raw transaction data
    amount = data["amount"]
    user_avg = data["user_avg"]
    user_std = data["user_std"]
    hours_since_last = data["hours_since_last"]
    total_tx_so_far = data["total_tx_so_far"]
    days_active = data["days_active"]
    
    # Calculate features
    feature_1 = (amount - user_avg) / user_std
    feature_2 = hours_since_last
    feature_3 = total_tx_so_far / days_active
    
    features = np.array([[feature_1, feature_2, feature_3]])
    
    scaled = scaler.transform(features)
    prediction = model.predict(scaled)[0]
    raw_score = -model.decision_function(scaled)[0]
    risk_score = (raw_score + 0.5) * 100
    risk_score = min(max(risk_score, 0), 100)

    if risk_score >= 80:
        action = "block"
    elif risk_score >= 60:
        action = "review"
    else:
        action = "allow"

    return jsonify({
        "prediction": "anomaly" if prediction == -1 else "normal",
        "risk_score": round(risk_score, 2),
        "action": action,
        "features": {
            "z_score": round(feature_1, 3),
            "hours_since_last": feature_2,
            "tx_per_day_rate": round(feature_3, 3)
        }
    })

if __name__ == "__main__":
    app.run(debug=True)