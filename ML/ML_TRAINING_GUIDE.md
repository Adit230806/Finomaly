# Finomaly ML Model Training Guide

## Overview
Train an Isolation Forest model for financial transaction anomaly detection using 3 features.

---

## 1. REQUIREMENTS

### Python Packages
```
scikit-learn==1.3.2
numpy==1.24.3
pandas==2.0.3
```

### Installation
```bash
pip install scikit-learn==1.3.2 numpy==1.24.3 pandas==2.0.3
```

---

## 2. MODEL SPECIFICATIONS

### Algorithm
- **Type**: Isolation Forest (Unsupervised)
- **Purpose**: Detect anomalous transactions
- **Contamination Rate**: 0.1 (10% expected anomalies)
- **Random State**: 42 (reproducibility)
- **Estimators**: 100 trees

### Output Files
- `isolation_forest.pkl` - Trained model
- `scaler.pkl` - StandardScaler for feature normalization

### Output Location
Save both files to: `ml_api/models/`

---

## 3. FEATURE ENGINEERING

### Feature 1: Amount Z-Score
**Purpose**: Detect unusual transaction amounts
**Calculation**: `(amount - user_avg) / user_std`
**Range**: Capped at ±5
**Example**: 
- User average: $100
- Transaction: $500
- Z-score: (500-100)/50 = 8 → capped to 5

### Feature 2: Time Since Last Transaction (hours)
**Purpose**: Detect rapid transaction sequences
**Calculation**: Hours between current and previous transaction
**Default**: 24 hours (for first transaction)
**Example**:
- Previous transaction: 10:00 AM
- Current transaction: 11:30 AM
- Time since last: 1.5 hours

### Feature 3: Transactions Per Day
**Purpose**: Detect unusual transaction frequency
**Calculation**: Total transactions / days active
**Default**: 1 (for first transaction)
**Example**:
- User has 10 transactions over 5 days
- Transactions per day: 10/5 = 2

---

## 4. TRAINING DATA REQUIREMENTS

### Data Format
CSV file with columns:
```
user_id, amount, timestamp
```

### Data Characteristics
- **Minimum rows**: 1000 transactions
- **Recommended**: 5000+ transactions
- **Users**: 100+ unique users
- **Anomaly ratio**: 10-20% anomalies

### Sample Data Structure
```
user_001, 150.50, 2024-01-15 10:30:00
user_001, 5000.00, 2024-01-15 11:00:00
user_002, 75.25, 2024-01-15 12:15:00
user_002, 12500.00, 2024-01-15 13:45:00
```

### Data Preparation Steps
1. Remove null values
2. Convert timestamp to datetime
3. Convert amount to float
4. Sort by user_id and timestamp
5. Ensure at least 2 transactions per user (recommended)

---

## 5. TRAINING SCRIPT TEMPLATE

```python
import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Load data
df = pd.read_csv('your_transactions.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values(['user_id', 'timestamp']).reset_index(drop=True)

# Feature engineering
features = []

for user_id in df['user_id'].unique():
    user_data = df[df['user_id'] == user_id].copy()
    user_avg = user_data['amount'].mean()
    user_std = user_data['amount'].std() or user_avg * 0.3
    
    for i, row in user_data.iterrows():
        # Feature 1: Amount Z-Score
        z_score = (row['amount'] - user_avg) / user_std
        z_score = min(z_score, 5)  # Cap at 5
        
        # Feature 2: Time since last transaction
        if i == user_data.index[0]:
            time_since_last = 24
        else:
            prev_idx = user_data.index.get_loc(i) - 1
            prev_time = user_data.iloc[prev_idx]['timestamp']
            time_since_last = (row['timestamp'] - prev_time).total_seconds() / 3600
        
        # Feature 3: Transactions per day
        days = (user_data['timestamp'].max() - user_data['timestamp'].min()).days + 1
        tx_per_day = len(user_data) / max(days, 1)
        
        features.append([z_score, time_since_last, tx_per_day])

X = np.array(features)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train model
model = IsolationForest(
    contamination=0.1,
    random_state=42,
    n_estimators=100
)
model.fit(X_scaled)

# Save model and scaler
with open('ml_api/models/isolation_forest.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('ml_api/models/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("Model training completed!")
print(f"Trained on {len(X)} transactions")
```

---

## 6. VALIDATION CHECKLIST

After training, verify:
- [ ] Both .pkl files created in `ml_api/models/`
- [ ] Model file size > 1MB
- [ ] Scaler file size > 10KB
- [ ] Model can predict on test data
- [ ] Predictions return values between -1 (anomaly) and 1 (normal)

### Quick Test
```python
import pickle
import numpy as np

# Load model
with open('ml_api/models/isolation_forest.pkl', 'rb') as f:
    model = pickle.load(f)
with open('ml_api/models/scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Test prediction
test_features = np.array([[0.5, 24, 1]])  # Normal transaction
scaled = scaler.transform(test_features)
prediction = model.predict(scaled)
print(f"Prediction: {prediction}")  # Should be 1 (normal)

test_features = np.array([[5.0, 0.1, 10]])  # Anomalous
scaled = scaler.transform(test_features)
prediction = model.predict(scaled)
print(f"Prediction: {prediction}")  # Should be -1 (anomaly)
```

---

## 7. HYPERPARAMETERS

### Isolation Forest Parameters
```python
IsolationForest(
    contamination=0.1,      # Expected anomaly rate (10%)
    random_state=42,        # For reproducibility
    n_estimators=100,       # Number of trees
    max_samples='auto',     # Samples per tree
    max_features=1.0,       # Use all features
    bootstrap=False         # No bootstrap sampling
)
```

### StandardScaler
- Transforms features to mean=0, std=1
- Improves model performance
- Must be applied to both training and prediction data

---

## 8. EXPECTED MODEL BEHAVIOR

### Normal Transaction
```
Features: [0.5, 24, 1]
Prediction: 1 (normal)
Decision Score: > 0.1
Risk Score: 0-30
```

### Anomalous Transaction
```
Features: [5.0, 0.1, 10]
Prediction: -1 (anomaly)
Decision Score: < -0.3
Risk Score: 70-100
```

---

## 9. TROUBLESHOOTING

### Issue: Model file not found
**Solution**: Ensure files are saved to `ml_api/models/` directory

### Issue: Prediction errors
**Solution**: Verify scaler is applied before prediction

### Issue: All transactions marked as normal
**Solution**: Check contamination rate (should be 0.1 for 10% anomalies)

### Issue: Poor anomaly detection
**Solution**: 
- Increase training data size
- Adjust contamination rate
- Verify feature engineering logic

---

## 10. INTEGRATION WITH FLASK API

The Flask app expects:
1. Model file: `ml_api/models/isolation_forest.pkl`
2. Scaler file: `ml_api/models/scaler.pkl`

The app will:
1. Load both files on startup
2. Use scaler to normalize features
3. Use model to predict anomalies
4. Convert predictions to risk scores (0-100)

---

## 11. FEATURE EXTRACTION IN PRODUCTION

When analyzing transactions, extract features as:

```python
# For each transaction:
user_avg = mean(user_transaction_amounts)
user_std = std(user_transaction_amounts)

feature_1 = (amount - user_avg) / user_std  # Cap at 5
feature_2 = hours_since_last_transaction
feature_3 = total_transactions / days_active

features = [feature_1, feature_2, feature_3]
scaled = scaler.transform([features])
prediction = model.predict(scaled)
```

---

## 12. QUICK START

1. Prepare CSV with columns: `user_id, amount, timestamp`
2. Run training script
3. Verify files in `ml_api/models/`
4. Restart Flask API
5. Test with `/api/analyze-batch` endpoint

---

## 13. CONTACT POINTS

- Model loading: `ml_api/app.py` lines 14-22
- Feature extraction: `ml_api/app.py` lines 60-75
- Prediction: `ml_api/app.py` lines 77-79
- Risk calculation: `ml_api/app.py` lines 81-87