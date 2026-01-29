#!/bin/bash

echo "🧪 Testing Finomaly Anomaly Detection"

# Test 1: Normal transaction
echo -e "\n1️⃣ Testing normal transaction..."
curl -X POST http://localhost:5001/api/test-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_001",
    "amount": 150,
    "timestamp": "2024-01-01 14:30:00"
  }'

# Test 2: Large amount (anomaly)
echo -e "\n\n2️⃣ Testing large amount anomaly..."
curl -X POST http://localhost:5001/api/test-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_001",
    "amount": 5000,
    "timestamp": "2024-01-01 15:00:00"
  }'

# Test 3: Quick succession (anomaly)
echo -e "\n\n3️⃣ Testing quick succession anomaly..."
curl -X POST http://localhost:5001/api/test-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_001",
    "amount": 200,
    "timestamp": "2024-01-01 15:01:00"
  }'

# Test 4: Health check
echo -e "\n\n4️⃣ Testing health endpoint..."
curl -X GET http://localhost:5001/api/health

echo -e "\n\n✅ Tests completed!"