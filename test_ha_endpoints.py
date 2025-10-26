import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_home_assistant_endpoints():
    print("Testing Home Assistant API endpoints...")
    
    # Use the valid token we created
    valid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJmZDM5NDExLTU0ZjMtNDhiYy05YjI4LWI4NzZlMDU5OTE2ZCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoidXNlciJ9.SqTgiuAtb10qeNo5dlQJiLU7gFS4yOCgSCafVZNhf44"
    auth_header = f"Bearer {valid_token}"
    
    # Test API root
    print("Testing API root...")
    response = client.get("/api/v1/homeassistant/")
    print(f"Root endpoint status: {response.status_code}")
    print(f"Root endpoint response: {response.json()}")
    
    # Test health check
    print("\nTesting health check...")
    response = client.get("/api/v1/homeassistant/health")
    print(f"Health check status: {response.status_code}")
    print(f"Health check response: {response.json()}")
    
    # Test config endpoint without auth (should fail)
    print("\nTesting config endpoint without auth...")
    response = client.get("/api/v1/homeassistant/config")
    print(f"Config endpoint status (no auth): {response.status_code}")
    
    # Test config endpoint with auth (should work)
    print("\nTesting config endpoint with auth...")
    response = client.get("/api/v1/homeassistant/config", headers={"Authorization": auth_header})
    print(f"Config endpoint status (with auth): {response.status_code}")
    if response.status_code == 200:
        print(f"Config endpoint response: {response.json()}")
    
    # Test components endpoint without auth (should fail)
    print("\nTesting components endpoint without auth...")
    response = client.get("/api/v1/homeassistant/components")
    print(f"Components endpoint status (no auth): {response.status_code}")
    
    # Test components endpoint with auth (should work)
    print("\nTesting components endpoint with auth...")
    response = client.get("/api/v1/homeassistant/components", headers={"Authorization": auth_header})
    print(f"Components endpoint status (with auth): {response.status_code}")
    if response.status_code == 200:
        print(f"Components endpoint response: {response.json()}")

if __name__ == "__main__":
    test_home_assistant_endpoints()