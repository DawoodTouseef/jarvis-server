import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.main import app
from backend.test.util.mock_user import mock_user

client = TestClient(app)

class TestPipelines:
    """Test suite for pipeline endpoints"""
    
    def test_get_pipelines_success(self):
        """Test successful retrieval of pipelines"""
        with mock_user(app):
            # Mock the requests.get call to the external service
            with patch('backend.routers.pipelines.requests.get') as mock_get:
                # Mock response data
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "data": [
                        {
                            "id": "pipeline-1",
                            "name": "Test Pipeline",
                            "description": "A test pipeline",
                            "type": "pipeline",
                            "pipelines": ["step1", "step2"],
                            "priority": 1,
                            "valves": {},
                            "created_at": "2023-01-01T00:00:00",
                            "updated_at": "2023-01-01T00:00:00"
                        }
                    ]
                }
                mock_response.raise_for_status.return_value = None
                mock_get.return_value = mock_response
                
                # Make the request
                response = client.get("/api/v1/pipelines/", params={"urlIdx": 0})
                
                # Assertions
                assert response.status_code == 200
                data = response.json()
                assert "data" in data
                assert len(data["data"]) == 1
                assert data["data"][0]["id"] == "pipeline-1"
                assert data["data"][0]["name"] == "Test Pipeline"
    
    def test_get_pipelines_failure(self):
        """Test failure when retrieving pipelines"""
        with mock_user(app):
            # Mock the requests.get call to raise an exception
            with patch('backend.routers.pipelines.requests.get') as mock_get:
                mock_get.side_effect = Exception("Connection error")
                
                # Make the request
                response = client.get("/api/v1/pipelines/", params={"urlIdx": 0})
                
                # Assertions
                assert response.status_code == 404
                data = response.json()
                assert "detail" in data
    
    def test_create_pipeline_success(self):
        """Test successful creation of a pipeline"""
        with mock_user(app):
            # Mock the requests.post call to the external service
            with patch('backend.routers.pipelines.requests.post') as mock_post:
                # Mock response data
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "id": "new-pipeline-1",
                    "name": "New Test Pipeline",
                    "description": "A new test pipeline",
                    "type": "pipeline",
                    "pipelines": ["step1"],
                    "priority": 1,
                    "valves": {},
                    "created_at": "2023-01-01T00:00:00",
                    "updated_at": "2023-01-01T00:00:00"
                }
                mock_response.raise_for_status.return_value = None
                mock_post.return_value = mock_response
                
                # Pipeline data to create
                pipeline_data = {
                    "url": "http://example.com",
                    "urlIdx": 0
                }
                
                # Make the request
                response = client.post("/api/v1/pipelines/add", json=pipeline_data)
                
                # Assertions
                assert response.status_code == 200
                data = response.json()
                assert "id" in data
                assert data["id"] == "new-pipeline-1"
                assert data["name"] == "New Test Pipeline"

if __name__ == "__main__":
    pytest.main([__file__])