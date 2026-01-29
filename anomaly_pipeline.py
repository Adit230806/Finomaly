import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from datetime import datetime

class FinancialAnomalyDetector:
    def __init__(self, contamination=0.1, random_state=42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = None
        self.scaler = None
    
    def preprocess_data(self, df):
        """Preprocess transaction data - stateless operation"""
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['amount'] = pd.to_numeric(df['amount'])
        df['user_id'] = df['user_id'].astype(str)
        df = df.sort_values(['user_id', 'timestamp']).reset_index(drop=True)
        return df
    
    def engineer_features(self, df):
        """Extract 3 required features - stateless operation"""
        features = []
        
        for user_id in df['user_id'].unique():
            user_data = df[df['user_id'] == user_id].copy()
            user_avg = user_data['amount'].mean()
            
            for i, row in user_data.iterrows():
                # Feature 1: Amount deviation from user average
                amount_deviation = (row['amount'] - user_avg) / max(user_avg, 1)
                
                # Feature 2: Time since last transaction (hours)
                if i == user_data.index[0]:
                    time_since_last = 24
                else:
                    prev_time = user_data.loc[user_data.index[user_data.index.get_loc(i)-1], 'timestamp']
                    time_since_last = (row['timestamp'] - prev_time).total_seconds() / 3600
                
                # Feature 3: Transactions per day for this user
                user_days = (user_data['timestamp'].max() - user_data['timestamp'].min()).days + 1
                tx_per_day = len(user_data) / max(user_days, 1)
                
                features.append([amount_deviation, time_since_last, tx_per_day])
        
        return np.array(features)
    
    def train(self, df):
        """Train the model - stateless operation"""
        df_clean = self.preprocess_data(df)
        X = self.engineer_features(df_clean)
        
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_estimators=100
        )
        self.model.fit(X_scaled)
        return self
    
    def predict(self, df):
        """Predict anomalies - stateless operation"""
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained")
        
        df_clean = self.preprocess_data(df)
        X = self.engineer_features(df_clean)
        X_scaled = self.scaler.transform(X)
        
        anomaly_scores = self.model.decision_function(X_scaled)
        predictions = self.model.predict(X_scaled)
        
        results = df_clean.copy()
        results['anomaly_score'] = anomaly_scores
        results['is_anomaly'] = (predictions == -1).astype(int)
        results['risk_score'] = self._convert_to_risk_score(anomaly_scores)
        
        return results
    
    def _convert_to_risk_score(self, anomaly_scores):
        """Convert anomaly scores to 0-100 risk scores"""
        min_score = anomaly_scores.min()
        max_score = anomaly_scores.max()
        
        if max_score == min_score:
            return np.full_like(anomaly_scores, 50)
        
        normalized = (anomaly_scores - min_score) / (max_score - min_score)
        risk_scores = (1 - normalized) * 100
        return risk_scores.astype(int)
    
    def save_model(self, model_path='isolation_forest.pkl', scaler_path='scaler.pkl'):
        """Save trained model and scaler"""
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
    
    def load_model(self, model_path='isolation_forest.pkl', scaler_path='scaler.pkl'):
        """Load trained model and scaler"""
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        with open(scaler_path, 'rb') as f:
            self.scaler = pickle.load(f)

def generate_sample_data(n_samples=1000):
    """Generate sample transaction data"""
    np.random.seed(42)
    users = [f'user_{i:03d}' for i in range(1, 21)]
    data = []
    base_time = datetime(2024, 1, 1)
    
    for i in range(n_samples):
        user = np.random.choice(users)
        amount = np.random.lognormal(5, 1)
        timestamp = base_time + pd.Timedelta(hours=np.random.randint(0, 24*30))
        
        data.append({
            'user_id': user,
            'amount': amount,
            'timestamp': timestamp
        })
    
    return pd.DataFrame(data)

def main():
    """Complete pipeline execution"""
    print("Financial Anomaly Detection Pipeline")
    
    # Generate and process data
    df = generate_sample_data(1000)
    detector = FinancialAnomalyDetector(contamination=0.1, random_state=42)
    
    # Train and predict
    detector.train(df)
    results = detector.predict(df)
    
    # Save outputs
    detector.save_model()
    results.to_csv('anomaly_results.csv', index=False)
    
    anomalies = results[results['is_anomaly'] == 1]
    print(f"Detected {len(anomalies)} anomalies ({len(anomalies)/len(results)*100:.1f}%)")
    print("Files saved: isolation_forest.pkl, scaler.pkl, anomaly_results.csv")

if __name__ == "__main__":
    main()