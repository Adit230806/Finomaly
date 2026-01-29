import requests
import json

def test_apis():
    base_url = "http://localhost:5000"
    
    print("API CONNECTIVITY TEST")
    print("=" * 40)
    
    # Test Health Check
    print("\\n1. Health Check API...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data['status']}")
            print(f"   Model Loaded: {data['model_loaded']}")
            print("   [PASS] Health Check")
        else:
            print(f"   [FAIL] Status Code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   [FAIL] Server not running")
        print("   Start with: cd ml_api && python app.py")
        return
    except Exception as e:
        print(f"   [ERROR] {e}")
        return
    
    # Test Single Transaction
    print("\\n2. Single Transaction API...")
    test_data = {
        "amount": 5000,
        "location": "Unknown City", 
        "account": "test_user",
        "timestamp": "2024-01-01 02:30:00",
        "transactionId": "test_001"
    }
    
    try:
        response = requests.post(f"{base_url}/api/analyze-transaction", json=test_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   Risk Score: {data['riskScore']}")
            print(f"   Risk Level: {data['riskLevel']}")
            print("   [PASS] Single Transaction")
        else:
            print(f"   [FAIL] Status Code: {response.status_code}")
    except Exception as e:
        print(f"   [ERROR] {e}")
    
    # Test Batch Analysis
    print("\\n3. Batch Analysis API...")
    batch_data = {
        "transactions": [
            {"amount": 150, "location": "New York", "account": "user123", "timestamp": "2024-01-15 14:30:00", "transactionId": "b1"},
            {"amount": 8000, "location": "Unknown", "account": "user123", "timestamp": "2024-01-16 02:15:00", "transactionId": "b2"}
        ]
    }
    
    try:
        response = requests.post(f"{base_url}/api/analyze-batch", json=batch_data, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"   Processed: {len(data['results'])} transactions")
            print("   [PASS] Batch Analysis")
        else:
            print(f"   [FAIL] Status Code: {response.status_code}")
    except Exception as e:
        print(f"   [ERROR] {e}")
    
    print("\\nAPI TEST COMPLETE")

if __name__ == "__main__":
    test_apis()