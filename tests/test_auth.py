"""
Authentication Tests
Tests for registration, login, and JWT token handling
"""
import pytest


class TestUserRegistration:
    """Test suite for user registration"""
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_register_new_user(self, client, test_user_data):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json=test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]
        assert data["role"] == "analyst"
        assert data["is_active"] is True
        assert "hashed_password" not in data  # Should not expose password
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_register_duplicate_email(self, client, test_user_data, registered_user):
        """Test registration with existing email fails"""
        response = client.post("/api/auth/register", json=test_user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "TestPassword123!"
        })
        
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test suite for user login"""
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_login_success(self, client, test_user_data, registered_user):
        """Test successful login returns JWT token"""
        response = client.post("/api/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_login_wrong_password(self, client, test_user_data, registered_user):
        """Test login with incorrect password fails"""
        response = client.post("/api/auth/login", json={
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email fails"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@aegis.com",
            "password": "SomePassword123!"
        })
        
        assert response.status_code == 401


class TestProtectedEndpoints:
    """Test suite for protected endpoint access"""
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_access_protected_without_token(self, client):
        """Test accessing protected endpoint without token fails"""
        response = client.get("/api/auth/me")
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_access_protected_with_valid_token(self, client, auth_headers, test_user_data):
        """Test accessing protected endpoint with valid token succeeds"""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_access_protected_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token fails"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token-here"}
        )
        
        assert response.status_code == 401


class TestTokenRefresh:
    """Test suite for token refresh functionality"""
    
    @pytest.mark.auth
    @pytest.mark.unit
    def test_refresh_token(self, client, auth_headers):
        """Test token refresh returns new token"""
        response = client.post("/api/auth/refresh", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

