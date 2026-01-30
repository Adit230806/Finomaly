import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def train_model(csv_file_path, output_dir='ml_api/models'):
    """
    Train Isolation Forest model for anomaly detection
    
    Args:
        csv_file_path: Path to CSV with columns: user_id, amount, timestamp
        output_dir: Directory to save model files
    """
    
    print("Loading data...")
    df = pd.read_csv(csv_file_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values(['user_id', 'timestamp']).reset_index(drop=True)
    print(f"Loaded {len(df)} transactions from {df['user_id'].nunique()} users")
    
    print("\nExtracting features...")
    features = []
    
    for user_id in df['user_id'].unique():
        user_data = df[df['user_id'] == user_id].copy()
        user_avg = user_data['amount'].mean()
        user_std = user_data['amount'].std() or user_avg * 0.3
        
        for i, row in user_data.iterrows():
            # Feature 1: Amount Z-Score
            z_score = (row['amount'] - user_avg) / user_std
            z_score = min(z_score, 5)
            
            # Feature 2: Time since last transaction (hours)
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
    print(f"Extracted {len(X)} feature vectors")
    
    print("\nScaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Training Isolation Forest...")
    model = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=100
    )
    model.fit(X_scaled)
    
    print(f"Saving model to {output_dir}...")
    with open(f'{output_dir}/isolation_forest.pkl', 'wb') as f:
        pickle.dump(model, f)
    
    with open(f'{output_dir}/scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    
    print("Training completed!")
    print(f"Model saved to: {output_dir}/isolation_forest.pkl")
    print(f"Scaler saved to: {output_dir}/scaler.pkl")

if __name__ == '__main__':
    # Usage: python train_model.py path/to/your/data.csv
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python train_model.py <csv_file_path>")
        print("Example: python train_model.py transactions.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    train_model(csv_file)