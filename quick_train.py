import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pickle
import os

# Generate synthetic training data
np.random.seed(42)

# Normal transactions: amount_zscore, time_since_last, tx_per_day
normal_data = np.random.normal([0, 24, 2], [1, 12, 1], (900, 3))

# Anomalous transactions
anomaly_data = np.random.normal([3, 2, 5], [1.5, 1, 2], (100, 3))

# Combine and label
X = np.vstack([normal_data, anomaly_data])
y = np.hstack([np.zeros(900), np.ones(100)])

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train Isolation Forest
model = IsolationForest(contamination=0.1, random_state=42)
model.fit(X_scaled)

# Create models directory if it doesn't exist
os.makedirs("ml_api/models", exist_ok=True)

# Save model and scaler
with open("ml_api/models/isolation_forest.pkl", "wb") as f:
    pickle.dump(model, f)

with open("ml_api/models/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("Model trained and saved successfully!")
print(f"Training data shape: {X.shape}")
print(f"Normal samples: 900, Anomalous samples: 100")
