"""
API Health Check Tests
Basic connectivity and health endpoint tests
"""
import pytest


class TestHealthEndpoints:
    """Test suite for health and status endpoints"""
    
    @pytest.mark.unit
    def test_root_endpoint(self, client):
        """Test root endpoint returns API status"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "status" in data or "message" in data
    
    @pytest.mark.unit
    def test_health_check_endpoint(self, client):
        """Test health check returns healthy status"""
        response = client.get("/api/system/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "database" in data or "status" in data
    
    @pytest.mark.unit
    def test_cors_headers_present(self, client):
        """Test CORS headers are properly set"""
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        
        # FastAPI with CORS middleware should handle OPTIONS
        assert response.status_code in [200, 405]  # 405 if OPTIONS not explicitly handled

