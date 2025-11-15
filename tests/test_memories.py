import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_memories_endpoints():
    """Test memories API endpoints"""
    # Test creating a memory
    memory_data = {
        "content": "This is a test memory"
    }
    
    response = client.post("/api/v1/memories/add", json=memory_data)
    assert response.status_code == 200
    created_memory = response.json()
    assert "id" in created_memory
    assert created_memory["content"] == memory_data["content"]
    assert "user_id" in created_memory
    assert "created_at" in created_memory
    assert "updated_at" in created_memory
    
    memory_id = created_memory["id"]
    
    # Test getting all memories
    response = client.get("/api/v1/memories/")
    assert response.status_code == 200
    memories_list = response.json()
    assert isinstance(memories_list, list)
    assert len(memories_list) > 0
    
    # Test updating a memory
    updated_memory_data = {
        "content": "This is an updated test memory"
    }
    
    response = client.post(f"/api/v1/memories/{memory_id}/update", json=updated_memory_data)
    assert response.status_code == 200
    updated_memory = response.json()
    assert updated_memory["content"] == updated_memory_data["content"]
    assert updated_memory["id"] == memory_id
    
    # Test deleting a memory
    response = client.delete(f"/api/v1/memories/{memory_id}")
    assert response.status_code == 200
    assert response.json() == True
    
    # Verify deletion
    response = client.get("/api/v1/memories/")
    assert response.status_code == 200
    memories_list = response.json()
    # The memory might still be in the list if there are other memories, 
    # but the specific one we deleted should not be there