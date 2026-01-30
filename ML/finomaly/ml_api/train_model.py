import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Load data
df = pd.read_csv("../data/transactions.csv")
df["timestamp"] = pd.to_datetime(df["timestamp"])
df = df.sort_values(["user_id", "timestamp"]).reset_index(drop=True)

features = []

for user_id, user_data in df.groupby("user_id"):
    user_data = user_data.reset_index(drop=True)

    user_avg = user_data["amount"].mean()
    user_std = user_data["amount"].std()

    if pd.isna(user_std) or user_std == 0:
        user_std = max(user_avg * 0.3, 1)

    start_time = user_data.loc[0, "timestamp"]

    for i in range(len(user_data)):
        amount = user_data.loc[i, "amount"]
        timestamp = user_data.loc[i, "timestamp"]

        # Feature 1
        z = (amount - user_avg) / user_std
        z = max(min(z, 5), -5)

        # Feature 2
        if i == 0:
            time_since_last = 24
        else:
            prev_time = user_data.loc[i - 1, "timestamp"]
            time_since_last = (timestamp - prev_time).total_seconds() / 3600

        # Feature 3
        days_active = (timestamp - start_time).days + 1
        tx_per_day = (i + 1) / max(days_active, 1)

        features.append([z, time_since_last, tx_per_day])

X = np.array(features)

# Scale
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train model
model = IsolationForest(
    contamination=0.1,
    n_estimators=100,
    random_state=42
)
model.fit(X_scaled)

# Save artifacts
with open("models/isolation_forest.pkl", "wb") as f:
    pickle.dump(model, f)

with open("models/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("Model training completed")
print("Transactions used:", len(X))