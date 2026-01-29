import requests
import json
import time

def test_api_connectivity():
    base_url = "http://localhost:5000"
    
    print("="*50)
    print("API CONNECTIVITY TEST")
    print("="*50)
    
    # Test 1: Health Check
    print("\\n1. Testing Health Check API...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health Check: {data['status']}")
            print(f"   ✅ Model Loaded: {data['model_loaded']}")
        else:
            print(f"   ❌ Health Check Failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection Error: ML API server not running")
        print("   💡 Start server: cd ml_api && python app.py")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Test 2: Single Transaction Analysis
    print("\\n2. Testing Single Transaction Analysis...")
    test_transaction = {
        "amount": 5000,
        "location": "Unknown City",
        "account": "test_user",
        "timestamp": "2024-01-01 02:30:00",
        "transactionId": "test_001"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/analyze-transaction",
            json=test_transaction,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Transaction Analysis Success")
            print(f"   📊 Risk Score: {data['riskScore']}")
            print(f"   🎯 Risk Level: {data['riskLevel']}")
            print(f"   📝 Reasons: {data['reasons']}")
        else:
            print(f"   ❌ Transaction Analysis Failed: {response.status_code}")
            print(f"   📄 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Batch Transaction Analysis
    print("\\n3. Testing Batch Transaction Analysis...")
    batch_transactions = {
        "transactions": [
            {
                "amount": 150,
                "location": "New York",
                "account": "user123",
                "timestamp": "2024-01-15 14:30:00",
                "transactionId": "batch_001"
            },
            {
                "amount": 8000,
                "location": "Unknown City",
                "account": "user123",
                "timestamp": "2024-01-16 02:15:00",
                "transactionId": "batch_002"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/analyze-batch",
            json=batch_transactions,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Batch Analysis Success")
            print(f"   📊 Processed {len(data['results'])} transactions")
            for i, result in enumerate(data['results']):
                print(f"   Transaction {i+1}: Risk {result['riskScore']} ({result['riskLevel']})")
        else:
            print(f"   ❌ Batch Analysis Failed: {response.status_code}")
            print(f"   📄 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Error Handling
    print("\\n4. Testing Error Handling...")
    try:
        response = requests.post(
            f"{base_url}/api/analyze-transaction",
            json={"invalid": "data"},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 400:
            print("   ✅ Error Handling Works (400 for invalid data)")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\\n" + "="*50)
    print("API CONNECTIVITY TEST COMPLETE")
    print("="*50)
    
    return True

if __name__ == "__main__":
    test_api_connectivity()