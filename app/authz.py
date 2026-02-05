"""
Authorization Engine
JSON-based RBAC/ABAC system for fine-grained access control
"""
import json
import os
from typing import Dict, List, Optional, Any
from pathlib import Path
from fastapi import HTTPException, status


class AuthorizationEngine:
    """
    Pluggable authorization engine that checks permissions
    against JSON-defined rules.
    """
    
    def __init__(self, authz_map_path: str = "app/authz.map.json", public_map_path: str = "app/public.map.json"):
        self.authz_map_path = Path(authz_map_path)
        self.public_map_path = Path(public_map_path)
        self.authz_rules: Dict[str, Any] = {}
        self.public_endpoints: List[str] = []
        self.load_rules()
    
    def load_rules(self):
        """Load authorization rules from JSON files"""
        try:
            if self.authz_map_path.exists():
                with open(self.authz_map_path, 'r') as f:
                    self.authz_rules = json.load(f)
            else:
                print(f"⚠️  Warning: {self.authz_map_path} not found. Creating default rules.")
                self.create_default_rules()
            
            if self.public_map_path.exists():
                with open(self.public_map_path, 'r') as f:
                    self.public_endpoints = json.load(f)
            else:
                self.create_default_public_endpoints()
                
        except Exception as e:
            print(f"❌ Error loading authorization rules: {e}")
            self.authz_rules = {}
            self.public_endpoints = []
    
    def create_default_rules(self):
        """Create default authorization rules"""
        default_rules = {
            "/api/system/health": {
                "ANY": ["*"]  # Public
            },
            "/api/threats": {
                "GET": ["admin", "analyst", "viewer"],
                "POST": ["admin", "analyst"],
                "PUT": ["admin", "analyst"],
                "DELETE": ["admin"]
            },
            "/api/reports": {
                "GET": ["admin", "analyst", "viewer"],
                "POST": ["admin", "analyst"],
                "DELETE": ["admin"]
            },
            "/api/admin/*": {
                "ANY": ["admin"]
            },
            "/api/scan/*": {
                "GET": ["admin", "analyst", "viewer"],
                "POST": ["admin", "analyst"]
            },
            "/api/analyze/*": {
                "GET": ["admin", "analyst"],
                "POST": ["admin", "analyst"]
            },
            "/api/network/*": {
                "GET": ["admin", "analyst", "viewer"]
            },
            "/api/federated/*": {
                "GET": ["admin", "analyst"],
                "POST": ["admin"]
            }
        }
        
        with open(self.authz_map_path, 'w') as f:
            json.dump(default_rules, f, indent=2)
        
        self.authz_rules = default_rules
    
    def create_default_public_endpoints(self):
        """Create default public endpoints list"""
        default_public = [
            "/",
            "/health",
            "/api/system/health",
            "/api/auth/login",
            "/api/auth/register",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]
        
        with open(self.public_map_path, 'w') as f:
            json.dump(default_public, f, indent=2)
        
        self.public_endpoints = default_public
    
    def is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (no auth required)"""
        # Exact match
        if path in self.public_endpoints:
            return True
        
        # Wildcard match
        for public_path in self.public_endpoints:
            if public_path.endswith("*"):
                prefix = public_path.rstrip("*")
                if path.startswith(prefix):
                    return True
        
        return False
    
    def check_permission(
        self, 
        user: Optional[Dict[str, Any]], 
        method: str, 
        path: str,
        raise_exception: bool = True
    ) -> bool:
        """
        Check if user has permission to access endpoint
        
        Args:
            user: User dict from JWT token (None if not authenticated)
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            path: API endpoint path
            raise_exception: If True, raises HTTPException on denial
        
        Returns:
            bool: True if allowed, False if denied
        """
        # Check if endpoint is public
        if self.is_public_endpoint(path):
            return True
        
        # If not public and no user, deny
        if not user:
            if raise_exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            return False
        
        # Get user role
        user_role = user.get("role", "viewer")
        
        # Find matching rule
        rule = self._find_matching_rule(path)
        
        if not rule:
            # No rule defined - default deny for security
            if raise_exception:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No authorization rule defined for {path}"
                )
            return False
        
        # Check method-specific permissions
        allowed_roles = rule.get(method, [])
        
        # Check "ANY" method wildcard
        if not allowed_roles:
            allowed_roles = rule.get("ANY", [])
        
        # Check if user role is allowed
        if "*" in allowed_roles or user_role in allowed_roles:
            return True
        
        # Check if user is admin (admins can access everything by default)
        if user_role == "admin":
            return True
        
        # Permission denied
        if raise_exception:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' not authorized for {method} {path}. Required: {allowed_roles}"
            )
        return False
    
    def _find_matching_rule(self, path: str) -> Optional[Dict[str, List[str]]]:
        """Find authorization rule for path (supports wildcards)"""
        # Exact match
        if path in self.authz_rules:
            return self.authz_rules[path]
        
        # Wildcard match
        for rule_path, rule in self.authz_rules.items():
            if rule_path.endswith("*"):
                prefix = rule_path.rstrip("*")
                if path.startswith(prefix):
                    return rule
        
        return None
    
    def add_rule(self, path: str, method: str, roles: List[str]):
        """Dynamically add authorization rule"""
        if path not in self.authz_rules:
            self.authz_rules[path] = {}
        
        self.authz_rules[path][method] = roles
        self._save_rules()
    
    def remove_rule(self, path: str):
        """Remove authorization rule"""
        if path in self.authz_rules:
            del self.authz_rules[path]
            self._save_rules()
    
    def _save_rules(self):
        """Save rules back to JSON file"""
        try:
            with open(self.authz_map_path, 'w') as f:
                json.dump(self.authz_rules, f, indent=2)
        except Exception as e:
            print(f"❌ Error saving authorization rules: {e}")
    
    def get_all_rules(self) -> Dict[str, Any]:
        """Get all authorization rules"""
        return self.authz_rules
    
    def reload_rules(self):
        """Reload rules from file (useful for hot-reload)"""
        self.load_rules()


# Global authorization engine instance
authz = AuthorizationEngine()


def require_permission(user: Optional[Dict[str, Any]], method: str, path: str):
    """
    Dependency function to check permissions
    
    Usage:
        from app.authz import require_permission
        
        @router.get("/api/threats")
        def get_threats(user: dict = Depends(get_current_user)):
            require_permission(user, "GET", "/api/threats")
            return threats
    """
    return authz.check_permission(user, method, path, raise_exception=True)

