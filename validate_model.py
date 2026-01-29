import pickle
import numpy as np

# Load and test model
try:
    with open('isolation_forest.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    
    print("Model loaded successfully")
    print(f"Model contamination: {model.contamination}")
    print(f"Model n_estimators: {model.n_estimators}")
    
    # Test with sample data
    test_features = np.array([
        [0.5, 24, 1],    # Normal: small deviation, 24h gap, 1 tx/day
        [5.0, 0.1, 10],  # Anomaly: large deviation, quick succession, high frequency
        [0.1, 12, 2]     # Normal: small deviation, 12h gap, 2 tx/day
    ])
    
    scaled_features = scaler.transform(test_features)
    scores = model.decision_function(scaled_features)
    predictions = model.predict(scaled_features)
    
    print("\nTest Results:")
    for i, (score, pred) in enumerate(zip(scores, predictions)):
        is_anomaly = pred == -1
        risk_score = max(0, min(100, int((1 - (score + 0.5)) * 100)))
        print(f"Sample {i+1}: Score={score:.3f}, Prediction={pred}, IsAnomaly={is_anomaly}, RiskScore={risk_score}")
        
except Exception as e:
    print(f"Error: {e}")