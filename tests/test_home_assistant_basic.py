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

def test_home_assistant_config_requires_auth():
    """Test Home Assistant config endpoint requires authentication"""
    response = client.get("/api/v1/homeassistant/config")
    assert response.status_code == 401

def test_home_assistant_components_requires_auth():
    """Test Home Assistant components endpoint requires authentication"""
    response = client.get("/api/v1/homeassistant/components")
    assert response.status_code == 401

def test_home_assistant_states_requires_auth():
    """Test Home Assistant states endpoint requires authentication"""
    response = client.get("/api/v1/homeassistant/states")
    assert response.status_code == 401

def test_home_assistant_events_requires_auth():
    """Test Home Assistant events endpoint requires authentication"""
    response = client.get("/api/v1/homeassistant/events")
    assert response.status_code == 401

def test_home_assistant_services_requires_auth():
    """Test Home Assistant services endpoint requires authentication"""
    response = client.get("/api/v1/homeassistant/services")
    assert response.status_code == 401

def test_home_assistant_statistics_meta_requires_auth():
    """Test Home Assistant statistics meta endpoint requires authentication"""
    response = client.get("/api/v1/homeassistant/statistics/meta")
    assert response.status_code == 401