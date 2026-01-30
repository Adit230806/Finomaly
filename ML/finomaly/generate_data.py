import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Generate training data
np.random.seed(42)
random.seed(42)

data = []
start_date = datetime(2024, 1, 15)

for user_id in range(1, 101):  # 100 users
    user_name = f"user_{user_id:03d}"
    
    # Normal transactions (8-12 per user)
    num_normal = random.randint(8, 12)
    for _ in range(num_normal):
        amount = round(np.random.normal(150, 50), 2)
        if amount < 10:
            amount = round(random.uniform(10, 50), 2)
        
        days_offset = random.randint(0, 30)
        hours_offset = random.randint(0, 23)
        minutes_offset = random.randint(0, 59)
        
        timestamp = start_date + timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
        
        data.append({
            'user_id': user_name,
            'amount': amount,
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    # Anomalous transactions (1-2 per user)
    num_anomalous = random.randint(1, 2)
    for _ in range(num_anomalous):
        amount = round(random.uniform(5000, 15000), 2)
        
        days_offset = random.randint(0, 30)
        hours_offset = random.randint(0, 23)
        minutes_offset = random.randint(0, 59)
        
        timestamp = start_date + timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
        
        data.append({
            'user_id': user_name,
            'amount': amount,
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })

# Create DataFrame and sort
df = pd.DataFrame(data)
df = df.sort_values(['user_id', 'timestamp']).reset_index(drop=True)

# Save to CSV
df.to_csv('data/transactions.csv', index=False)
print(f"Generated {len(df)} transactions for {df['user_id'].nunique()} users")