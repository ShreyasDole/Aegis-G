import asyncio
import json
import os
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.models.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Create memory DB for test
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def run_smoke_tests():
    passed = 0
    failed = 0
    
    print("\n==================================")
    print("0. SYSTEM BOOTSTRAP (AUTH)")
    print("==================================")
    # Register test user
    client.post("/api/auth/register", json={
        "username": "admin_test",
        "email": "admin@test.com",
        "password": "Password123!",
        "role": "admin"
    })
    # Login
    auth_res = client.post("/api/auth/login", data={
        "username": "admin_test",
        "password": "Password123!"
    })
    token = ""
    if auth_res.status_code == 200:
        token = auth_res.json().get("access_token")
        print("  [✔] Auth System ONLINE")
    else:
        print("  [✖] Auth System FAILED")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n==================================")
    print("1. TESTING /api/scan/core (ORCHESTRATOR DETECT+GRAPH+POLICY)")
    print("==================================")
    payload = {
        "content": "This is a synthetic test phrase to verify the neural pathways. You need to send the funds immediately or the account will be seized.",
        "username": "admin_test",
        "source_platform": "twitter"
    }
    try:
        response = client.post("/api/scan/core", json=payload, headers={"X-Inference-Mode": "local", **headers})
        if response.status_code == 200:
            print("  [✔] /api/scan/core returned 200 OK")
            data = response.json()
            print(f"      Risk Score: {data.get('risk_score')}")
            print(f"      Status: {data.get('status')}")
            print(f"      Graph Context: {data.get('graph_context', {}).get('patient_zero')}")
            passed += 1
        else:
            print(f"  [✖] /api/scan/core FAILED: {response.status_code} - {response.text}")
            failed += 1
    except Exception as e:
        print(f"  [✖] /api/scan/core CRASHED: {e}")
        failed += 1

    print("\n==================================")
    print("2. TESTING /api/scan/red-team/simulate (RED TEAM MODULE)")
    print("==================================")
    try:
        response = client.post("/api/scan/red-team/simulate", json={"count": 5}, headers=headers)
        if response.status_code == 200:
            print("  [✔] /api/scan/red-team/simulate returned 200 OK")
            passed += 1
        else:
            print(f"  [✖] /api/scan/red-team/simulate FAILED: {response.status_code} - {response.text}")
            failed += 1
    except Exception as e:
         print(f"  [✖] /api/scan/red-team/simulate CRASHED: {e}")
         failed += 1

    print("\n==================================")
    print("3. TESTING /api/forensics/attribution (AGENT 1)")
    print("==================================")
    try:
        # standard payload for attribution
        response = client.post("/api/forensics/attribution", json={"content": "Test text for attribution analysis."}, headers=headers)
        if response.status_code == 200: 
             print(f"  [✔] Attribution endpoint responded OK")
             passed += 1
        else:
             print(f"  [✖] Attribution endpoint FAILED: {response.status_code}")
             failed += 1
    except Exception as e:
        print(f"  [✖] Attribution check failed or does not exist: {e}")
        failed += 1 

    print("\n==================================")
    print("4. TESTING /api/policies (AGENT 4)")
    print("==================================")
    try:
        response = client.get("/api/policies", headers=headers)
        if response.status_code == 200:
            print("  [✔] /api/policies returned 200 OK")
            passed += 1
        else:
            print(f"  [✖] /api/policies FAILED: {response.status_code}")
            failed += 1
    except Exception as e:
        print(f"  [✖] /api/policies CRASHED: {e}")
        failed += 1

    print("\n==================================")
    print("TEST SUMMARY")
    print("==================================")
    print(f"✅ PASSED: {passed} / 4")
    print(f"❌ FAILED: {failed}")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_smoke_tests()
