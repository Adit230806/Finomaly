import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Load trained model
try:
    with open('isolation_forest.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    print("Model loaded successfully")
except Exception as e:
    print(f"Model loading failed: {e}")
    try:
        with open('../isolation_forest.pkl', 'rb') as f:
            model = pickle.load(f)
        with open('../scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        print("Model loaded from parent directory")
    except Exception as e2:
        model = None
        scaler = None
        print(f"Model not found in both locations: {e2}")

# Store user transaction history
user_history = {}

@app.route('/api/analyze-transaction', methods=['POST'])
def analyze_transaction():
    try:
        data = request.get_json()
        
        if data is None:
            return jsonify({'error': 'Invalid JSON body'}), 400
        
        required_fields = ['amount', 'account', 'timestamp']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Use account as user_id
        user_id = data['account']
        amount = float(data['amount'])
        timestamp = pd.to_datetime(data['timestamp'])
        
        # Initialize user history
        if user_id not in user_history:
            user_history[user_id] = []
        
        # Add current transaction
        user_history[user_id].append({'amount': amount, 'timestamp': timestamp})
        
        # Calculate features
        user_txs = user_history[user_id]
        user_amounts = [tx['amount'] for tx in user_txs]
        user_avg = np.mean(user_amounts)
        
        # Feature 1: Amount deviation
        amount_deviation = (amount - user_avg) / max(user_avg, 1)
        
        # Feature 2: Time since last transaction
        if len(user_txs) == 1:
            time_since_last = 24
        else:
            prev_time = user_txs[-2]['timestamp']
            time_since_last = (timestamp - prev_time).total_seconds() / 3600
        
        # Feature 3: Transactions per day
        if len(user_txs) == 1:
            tx_per_day = 1
        else:
            time_span = (user_txs[-1]['timestamp'] - user_txs[0]['timestamp']).days + 1
            tx_per_day = len(user_txs) / max(time_span, 1)
        
        # Predict
        features = np.array([[amount_deviation, time_since_last, tx_per_day]])
        features_scaled = scaler.transform(features)
        
        anomaly_score = model.decision_function(features_scaled)[0]
        is_anomaly = model.predict(features_scaled)[0] == -1
        
        # Better risk score calculation
        if anomaly_score > 0.1:
            risk_score = max(0, int(30 - (anomaly_score * 200)))
        elif anomaly_score > -0.1:
            risk_score = int(50 + (abs(anomaly_score) * 200))
        else:
            risk_score = min(100, int(70 + (abs(anomaly_score) * 150)))
        
        # Determine risk level and reasons
        if risk_score <= 30:
            risk_level = 'Safe'
            reasons = []
        elif risk_score <= 70:
            risk_level = 'Medium'
            reasons = ['Unusual transaction pattern detected']
        else:
            risk_level = 'High'
            reasons = ['Significant deviation from normal behavior']
            
        if amount_deviation > 2:
            reasons.append('Unusual transaction amount')
        if time_since_last < 1:
            reasons.append('Rapid transaction frequency')
        
        # Debug logging
        print(f"Processing transaction: User={user_id}, Amount={amount}")
        print(f"Features: deviation={amount_deviation:.3f}, time_since={time_since_last:.1f}h, tx_per_day={tx_per_day:.2f}")
        print(f"Anomaly score: {anomaly_score:.3f}, Risk score: {risk_score}")
        
        return jsonify({
            'transactionId': data.get('transactionId'),
            'riskScore': risk_score,
            'riskLevel': risk_level,
            'reasons': reasons,
            'isAnomaly': bool(is_anomaly)
        })
        
    except Exception as e:
        logging.error(f"Error analyzing transaction: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'model_loaded': model is not None,
        'users_tracked': len(user_history)
    })

@app.route('/api/reset-session', methods=['POST', 'OPTIONS'])
def reset_session():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        
        if user_id:
            if user_id in user_history:
                del user_history[user_id]
            return jsonify({'message': f'Session reset for {user_id}'})
        else:
            user_history.clear()
            return jsonify({'message': 'All sessions reset'})
            
    except Exception as e:
        print(f"Reset session error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)