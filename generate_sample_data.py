import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_sample_data(output_file='sample_transactions.csv', n_transactions=5000, n_users=100):
    """
    Generate synthetic transaction data for model training
    
    Args:
        output_file: CSV file to save data
        n_transactions: Number of transactions to generate
        n_users: Number of unique users
    """
    
    np.random.seed(42)
    
    users = [f'user_{i:04d}' for i in range(1, n_users + 1)]
    transactions = []
    base_time = datetime(2024, 1, 1)
    
    # Generate normal transactions (80%)
    n_normal = int(n_transactions * 0.8)
    for _ in range(n_normal):
        user = np.random.choice(users)
        amount = np.random.lognormal(5, 1)  # Log-normal: typical $50-$500
        timestamp = base_time + timedelta(hours=np.random.randint(0, 24*90))
        transactions.append({
            'user_id': user,
            'amount': round(amount, 2),
            'timestamp': timestamp
        })
    
    # Generate anomalous transactions (20%)
    n_anomaly = n_transactions - n_normal
    for _ in range(n_anomaly):
        user = np.random.choice(users)
        
        # Large amounts
        if np.random.random() < 0.5:
            amount = np.random.lognormal(8, 0.5)  # $1000+
        else:
            amount = np.random.lognormal(6, 1)  # $500-$5000
        
        timestamp = base_time + timedelta(hours=np.random.randint(0, 24*90))
        transactions.append({
            'user_id': user,
            'amount': round(amount, 2),
            'timestamp': timestamp
        })
    
    # Create DataFrame and save
    df = pd.DataFrame(transactions)
    df = df.sort_values(['user_id', 'timestamp']).reset_index(drop=True)
    df.to_csv(output_file, index=False)
    
    print(f"Generated {len(df)} transactions")
    print(f"Users: {df['user_id'].nunique()}")
    print(f"Amount range: ${df['amount'].min():.2f} - ${df['amount'].max():.2f}")
    print(f"Saved to: {output_file}")

if __name__ == '__main__':
    generate_sample_data()