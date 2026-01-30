from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Load model & scaler
with open("models/isolation_forest.pkl", "rb") as f:
    model = pickle.load(f)

with open("models/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

@app.route("/health", methods=["GET"])
def health():
    return {"status": "Finomaly ML API running"}

@app.route("/api/analyze-transaction", methods=["POST"])
def analyze_transaction():
    data = request.json
    
    # Extract features - model expects exactly 3 features
    amount = data.get("amount", 0)
    user_avg = data.get("user_avg", amount)
    user_std = data.get("user_std", max(user_avg * 0.3, 1))
    hours_since_last = data.get("hours_since_last", 24)
    total_tx_so_far = data.get("total_tx_so_far", 1)
    days_active = data.get("days_active", 1)
    
    # Calculate 3 features matching training data
    z_score = (amount - user_avg) / user_std
    z_score = min(max(z_score, -5), 5)  # Clamp to [-5, 5]
    
    time_since_last = hours_since_last
    tx_per_day = total_tx_so_far / max(days_active, 1)
    
    features = np.array([[z_score, time_since_last, tx_per_day]])
    
    # Scale and predict
    scaled = scaler.transform(features)
    prediction = model.predict(scaled)[0]
    decision_score = model.decision_function(scaled)[0]
    
    # Convert to risk score (0-100)
    risk_score = (-decision_score + 0.5) * 100
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
            "z_score": round(z_score, 3),
            "hours_since_last": round(time_since_last, 2),
            "tx_per_day": round(tx_per_day, 3)
        }
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)