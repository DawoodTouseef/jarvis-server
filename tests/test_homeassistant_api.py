import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_homeassistant_event_data_endpoints():
    """Test Home Assistant event data API endpoints"""
    # Test creating event data
    event_data = {
        "data_id": 1,
        "hash": 123456789,
        "shared_data": "test data"
    }
    
    response = client.post("/api/v1/homeassistant/event_data", json=event_data)
    assert response.status_code == 200
    created_event_data = response.json()
    assert created_event_data["data_id"] == event_data["data_id"]
    assert created_event_data["hash"] == event_data["hash"]
    assert created_event_data["shared_data"] == event_data["shared_data"]
    
    # Test getting event data
    response = client.get(f"/api/v1/homeassistant/event_data/{event_data['data_id']}")
    assert response.status_code == 200
    retrieved_event_data = response.json()
    assert retrieved_event_data["data_id"] == event_data["data_id"]
    assert retrieved_event_data["hash"] == event_data["hash"]
    assert retrieved_event_data["shared_data"] == event_data["shared_data"]
    
    # Test updating event data
    updated_event_data = {
        "data_id": 1,
        "hash": 987654321,
        "shared_data": "updated data"
    }
    
    response = client.put(f"/api/v1/homeassistant/event_data/{event_data['data_id']}", json=updated_event_data)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["hash"] == updated_event_data["hash"]
    assert updated_data["shared_data"] == updated_event_data["shared_data"]
    
    # Test getting all event data
    response = client.get("/api/v1/homeassistant/event_data")
    assert response.status_code == 200
    event_data_list = response.json()
    assert len(event_data_list) > 0
    
    # Test deleting event data
    response = client.delete(f"/api/v1/homeassistant/event_data/{event_data['data_id']}")
    assert response.status_code == 200
    assert response.json() == True
    
    # Verify deletion
    response = client.get(f"/api/v1/homeassistant/event_data/{event_data['data_id']}")
    assert response.status_code == 404

def test_homeassistant_event_types_endpoints():
    """Test Home Assistant event types API endpoints"""
    # Test creating event type
    event_type = {
        "event_type_id": 1,
        "event_type": "test_event"
    }
    
    response = client.post("/api/v1/homeassistant/event_types", json=event_type)
    assert response.status_code == 200
    created_event_type = response.json()
    assert created_event_type["event_type_id"] == event_type["event_type_id"]
    assert created_event_type["event_type"] == event_type["event_type"]
    
    # Test getting event type
    response = client.get(f"/api/v1/homeassistant/event_types/{event_type['event_type_id']}")
    assert response.status_code == 200
    retrieved_event_type = response.json()
    assert retrieved_event_type["event_type_id"] == event_type["event_type_id"]
    assert retrieved_event_type["event_type"] == event_type["event_type"]
    
    # Test updating event type
    updated_event_type = {
        "event_type_id": 1,
        "event_type": "updated_event"
    }
    
    response = client.put(f"/api/v1/homeassistant/event_types/{event_type['event_type_id']}", json=updated_event_type)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["event_type"] == updated_event_type["event_type"]
    
    # Test getting all event types
    response = client.get("/api/v1/homeassistant/event_types")
    assert response.status_code == 200
    event_types_list = response.json()
    assert len(event_types_list) > 0
    
    # Test deleting event type
    response = client.delete(f"/api/v1/homeassistant/event_types/{event_type['event_type_id']}")
    assert response.status_code == 200
    assert response.json() == True
    
    # Verify deletion
    response = client.get(f"/api/v1/homeassistant/event_types/{event_type['event_type_id']}")
    assert response.status_code == 404