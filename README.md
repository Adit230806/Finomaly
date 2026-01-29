# Finomaly - Financial Anomaly Detection System

A real-time financial transaction anomaly detection system using machine learning and React frontend.

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Setup Instructions

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd Finomaly
```

### 2. Environment Setup
Create `.env` file in root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Frontend Setup
```bash
npm install
npm start
```

### 4. Backend Setup
```bash
cd ml_api
pip install -r requirements.txt
```

## Model Training Steps

### Step 1: Prepare Training Environment
```bash
cd ml_training
```

### Step 2: Train the Anomaly Detection Model
```bash
python train_model.py
```

This will:
- Generate synthetic training data (900 normal + 100 anomalous transactions)
- Train Isolation Forest model with 10% contamination rate
- Save `isolation_forest.pkl` and `scaler.pkl` files

### Step 3: Verify Model Training
Check for generated files:
```bash
ls -la *.pkl
# Should show: isolation_forest.pkl, scaler.pkl
```

### Step 4: Start ML API Server
```bash
cd ..
cd ml_api
python app.py
```

### Step 5: Test Model Endpoint
```bash
curl -X POST http://localhost:5000/api/analyze-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "location": "Unknown City",
    "account": "test_user",
    "timestamp": "2024-01-01 02:30:00",
    "transactionId": "test_001"
  }'
```

## Model Features

The model analyzes 6 key features:
1. **Amount Z-Score** - Deviation from user's average
2. **Amount Ratio** - Ratio to user's average
3. **Location New** - Binary flag for new locations
4. **Location Frequency** - How often location is used
5. **Time Unusual** - Late night transactions (2-3 AM)
6. **Transaction Count** - User's transaction history

## Risk Scoring

- **0-50**: Safe (Green)
- **51-70**: Medium Risk (Yellow)
- **71-100**: High Risk (Red)

## Model Configuration

Key parameters in `AnomalyDetector`:
```python
SAFE_THRESHOLD = 0.1
MEDIUM_THRESHOLD = -0.1
HIGH_THRESHOLD = -0.3
SAFE_RISK_SCORE = 50
MEDIUM_RISK_SCORE = 70
```

## Improving Model Accuracy

### 1. Increase Training Data
```bash
cd ml_training
# Edit train_model.py - increase sample sizes:
normal_data = np.random.normal([150, 0.5, 0, 12, 50, 3], [75, 0.3, 0.1, 8, 20, 1], (5000, 6))  # Increase from 900
anomaly_data = np.random.normal([5000, 3, 1, 0.5, 10, 8], [2000, 1, 0.2, 0.3, 5, 2], (500, 6))  # Increase from 100
```

### 2. Add More Features
Edit `extract_features()` in `ml_api/app.py`:
```python
# Add new features:
day_of_week = datetime.strptime(transaction['timestamp'], '%Y-%m-%d %H:%M:%S').weekday()
hour_of_day = datetime.strptime(transaction['timestamp'], '%Y-%m-%d %H:%M:%S').hour
weekend_flag = 1 if day_of_week >= 5 else 0
business_hours = 1 if 9 <= hour_of_day <= 17 else 0

return np.array([
    amount_zscore, amount_ratio, location_new, location_frequency,
    time_unusual, transaction_count, day_of_week, weekend_flag, business_hours
]).reshape(1, -1)
```

### 3. Tune Model Parameters
Edit `train_model.py`:
```python
model = IsolationForest(
    contamination=0.05,      # Reduce from 0.1 for stricter detection
    n_estimators=200,        # Increase from 100
    max_samples='auto',      # Let algorithm decide
    max_features=1.0,        # Use all features
    bootstrap=True,          # Enable bootstrap sampling
    random_state=42
)
```

### 4. Use Real Transaction Data
```bash
# Replace synthetic data with real CSV data:
cd ml_training
# Create load_real_data.py:
import pandas as pd
df = pd.read_csv('real_transactions.csv')
# Label normal (0) and anomalous (1) transactions
# Use this data instead of synthetic data
```

### 5. Cross-Validation
Add to `train_model.py`:
```python
from sklearn.model_selection import cross_val_score
scores = cross_val_score(model, X_scaled, y, cv=5, scoring='f1')
print(f"Cross-validation F1 scores: {scores}")
print(f"Mean F1 score: {scores.mean():.3f}")
```

### 6. Feature Engineering
```python
# Add rolling statistics:
profile['rolling_avg_7d'] = np.mean(profile['amounts'][-7:]) if len(profile['amounts']) >= 7 else profile['avg_amount']
profile['rolling_std_7d'] = np.std(profile['amounts'][-7:]) if len(profile['amounts']) >= 7 else 75.0

# Add velocity features:
time_since_last = calculate_time_diff(transaction['timestamp'], profile['last_transaction'])
velocity_flag = 1 if time_since_last < 300 else 0  # 5 minutes
```

### 7. Ensemble Methods
```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.ensemble import VotingClassifier

rf = RandomForestClassifier(n_estimators=100, random_state=42)
gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
if_model = IsolationForest(contamination=0.1, random_state=42)

ensemble = VotingClassifier(
    estimators=[('rf', rf), ('gb', gb), ('if', if_model)],
    voting='soft'
)
```

### 8. Hyperparameter Tuning
```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'contamination': [0.05, 0.1, 0.15],
    'n_estimators': [100, 200, 300],
    'max_samples': ['auto', 0.5, 0.8]
}

grid_search = GridSearchCV(IsolationForest(), param_grid, cv=3, scoring='f1')
grid_search.fit(X_scaled, y)
best_model = grid_search.best_estimator_
```

## Retraining Model

To retrain with improved parameters:
1. Update training data in `train_model.py`
2. Run: `python train_model.py`
3. Restart API server: `cd ../ml_api && python app.py`

## Production Deployment

1. Set `FLASK_DEBUG=False`
2. Use production WSGI server (gunicorn)
3. Secure Firebase credentials
4. Update CORS settings for production domain

## API Endpoints

- `POST /api/analyze-transaction` - Analyze transaction
- `POST /api/analyze-batch` - Analyze multiple transactions
- `GET /api/health` - Health check

## Troubleshooting

**Model not loading**: Ensure `.pkl` files exist in `ml_api/models/`
**High memory usage**: Reduce user profile history (currently 100 transactions)
**Inaccurate predictions**: Follow accuracy improvement steps above
**Inconsistent results**: Model learns from each transaction - this is expected behavior