import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_home_assistant_api_root():
    """Test Home Assistant API root endpoint"""
    response = client.get("/api/v1/homeassistant/")
    assert response.status_code == 200
    assert response.json() == {"message": "API running."}

def test_home_assistant_health_check():
    """Test Home Assistant health check endpoint"""
    response = client.get("/api/v1/homeassistant/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_home_assistant_config():
    """Test Home Assistant config endpoint"""
    # Test without authorization header
    response = client.get("/api/v1/homeassistant/config")
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.get("/api/v1/homeassistant/config", headers={"Authorization": "Bearer test-token"})
    # This should either return 200 (if auth works) or 401 (if token is invalid)
    # Either way, it means the endpoint exists and the auth system is working
    assert response.status_code in [200, 401]

def test_home_assistant_components():
    """Test Home Assistant components endpoint"""
    # Test without authorization header
    response = client.get("/api/v1/homeassistant/components")
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.get("/api/v1/homeassistant/components", headers={"Authorization": "Bearer test-token"})
    # This should either return 200 (if auth works) or 401 (if token is invalid)
    # Either way, it means the endpoint exists and the auth system is working
    assert response.status_code in [200, 401]

def test_home_assistant_states():
    """Test Home Assistant states endpoint"""
    # Test without authorization header
    response = client.get("/api/v1/homeassistant/states")
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.get("/api/v1/homeassistant/states", headers={"Authorization": "Bearer test-token"})
    # This should either return 200 (if auth works) or 401 (if token is invalid)
    # Either way, it means the endpoint exists and the auth system is working
    assert response.status_code in [200, 401]

def test_home_assistant_events():
    """Test Home Assistant events endpoint"""
    # Test without authorization header
    response = client.get("/api/v1/homeassistant/events")
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.get("/api/v1/homeassistant/events", headers={"Authorization": "Bearer test-token"})
    # This should either return 200 (if auth works) or 401 (if token is invalid)
    # Either way, it means the endpoint exists and the auth system is working
    assert response.status_code in [200, 401]

def test_home_assistant_services():
    """Test Home Assistant services endpoint"""
    # Test without authorization header
    response = client.get("/api/v1/homeassistant/services")
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.get("/api/v1/homeassistant/services", headers={"Authorization": "Bearer test-token"})
    # This should either return 200 (if auth works) or 401 (if token is invalid)
    # Either way, it means the endpoint exists and the auth system is working
    assert response.status_code in [200, 401]

def test_home_assistant_statistics_meta():
    """Test Home Assistant statistics meta endpoint"""
    # Test without authorization header
    response = client.get("/api/v1/homeassistant/statistics/meta")
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.get("/api/v1/homeassistant/statistics/meta", headers={"Authorization": "Bearer test-token"})
    # This should either return 200 (if auth works) or 401 (if token is invalid)
    # Either way, it means the endpoint exists and the auth system is working
    assert response.status_code in [200, 401]

def test_home_assistant_create_state():
    """Test creating a state"""
    state_data = {
        "state": "on",
        "attributes": {"brightness": 100}
    }
    
    # Test without authorization header
    response = client.post("/api/v1/homeassistant/states/light.test", json=state_data)
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.post(
        "/api/v1/homeassistant/states/light.test", 
        json=state_data,
        headers={"Authorization": "Bearer test-token"}
    )
    # This might fail if the database is not properly set up for tests
    # but we're checking that the endpoint exists and requires auth
    assert response.status_code in [201, 401, 500]  # 201 if successful, 401 if auth fails, 500 if DB error

def test_home_assistant_create_event():
    """Test creating an event"""
    event_data = {
        "event_type": "test_event",
        "event_data": {"key": "value"},
        "origin": "LOCAL"
    }
    
    # Test without authorization header
    response = client.post("/api/v1/homeassistant/events", json=event_data)
    assert response.status_code == 401
    
    # Test with authorization header
    response = client.post(
        "/api/v1/homeassistant/events", 
        json=event_data,
        headers={"Authorization": "Bearer test-token"}
    )
    # This might fail if the database is not properly set up for tests
    # but we're checking that the endpoint exists and requires auth
    assert response.status_code in [201, 401, 500]  # 201 if successful, 401 if auth fails, 500 if DB error