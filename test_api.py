from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load trained model
try:
    with open('isolation_forest.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    print("✅ Model loaded successfully")
except:
    model = None
    scaler = None
    print("❌ Model not found")

# Store user transaction history for feature calculation
user_history = {}

@app.route('/api/test-anomaly', methods=['POST'])
def test_anomaly():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields
        required = ['user_id', 'amount', 'timestamp']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Get user history
        user_id = data['user_id']
        if user_id not in user_history:
            user_history[user_id] = []
        
        # Add current transaction
        current_tx = {
            'amount': float(data['amount']),
            'timestamp': pd.to_datetime(data['timestamp'])
        }
        user_history[user_id].append(current_tx)
        
        # Calculate features
        user_txs = user_history[user_id]
        user_amounts = [tx['amount'] for tx in user_txs]
        user_avg = np.mean(user_amounts)
        
        # Feature 1: Amount deviation
        amount_deviation = (current_tx['amount'] - user_avg) / max(user_avg, 1)
        
        # Feature 2: Time since last transaction
        if len(user_txs) == 1:
            time_since_last = 24  # Default for first transaction
        else:
            prev_time = user_txs[-2]['timestamp']
            time_since_last = (current_tx['timestamp'] - prev_time).total_seconds() / 3600
        
        # Feature 3: Transactions per day
        if len(user_txs) == 1:
            tx_per_day = 1
        else:
            time_span = (user_txs[-1]['timestamp'] - user_txs[0]['timestamp']).days + 1
            tx_per_day = len(user_txs) / max(time_span, 1)
        
        # Prepare features for model
        features = np.array([[amount_deviation, time_since_last, tx_per_day]])
        features_scaled = scaler.transform(features)
        
        # Get prediction
        anomaly_score = model.decision_function(features_scaled)[0]
        is_anomaly = model.predict(features_scaled)[0] == -1
        
        # Convert to risk score (0-100)
        risk_score = max(0, min(100, int((1 - (anomaly_score + 0.5)) * 100)))
        
        return jsonify({
            'user_id': user_id,
            'amount': current_tx['amount'],
            'anomaly_score': float(anomaly_score),
            'is_anomaly': bool(is_anomaly),
            'risk_score': risk_score,
            'features': {
                'amount_deviation': float(amount_deviation),
                'time_since_last': float(time_since_last),
                'tx_per_day': float(tx_per_day)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'users_tracked': len(user_history)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)