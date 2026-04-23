"""
END-TO-END FEATURE TEST
Tests all Command Center features
"""
import sys
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json
from datetime import datetime

BASE_URL = os.getenv("AEGIS_API_URL", "http://localhost:8000")
ADMIN_EMAIL = os.getenv("AEGIS_ADMIN_EMAIL", "admin@aegis.com")
ADMIN_PASSWORD = os.getenv("AEGIS_ADMIN_PASSWORD", "AdminPassword123!")

def log(name: str, ok: bool, detail: str = ""):
    status = "✅" if ok else "❌"
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))

print("="*70)
print("AEGIS-G COMMAND CENTER - COMPREHENSIVE TEST")
print("="*70)
print(f"Testing: {BASE_URL}\n")

# ===== AUTH =====
print("[AUTH]")
token = None
try:
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    if r.status_code == 200:
        token = r.json().get("access_token")
        log("Login (admin)", True)
    else:
        log("Login", False, r.text[:80])
except Exception as e:
    log("Login", False, str(e)[:80])

if not token:
    print("\n❌ Cannot continue without token. Check credentials or seed users.")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ===== SYSTEM =====
print("\n[SYSTEM]")
try:
    r = requests.get(f"{BASE_URL}/api/system/health", timeout=5)
    ok = r.status_code == 200 and "version" in r.json()
    log("Health check", ok, f"v{r.json().get('version', 'unknown')}" if ok else r.text[:60])
except Exception as e:
    log("Health check", False, str(e)[:60])

# ===== SCAN (Detection) =====
print("\n[SCAN / DETECTION]")
try:
    # Chat intent
    r = requests.post(f"{BASE_URL}/api/scan/core", headers={**headers, "X-Inference-Mode": "local"}, json={"content": "hi"}, timeout=15)
    ok = r.status_code == 200 and "recommendation" in r.json()
    log("Chat intent (hi)", ok)
    
    # Analysis
    ai_text = "The blockchain technology represents a paradigm shift in distributed systems. Organizations leverage these frameworks."
    r = requests.post(f"{BASE_URL}/api/scan/core", headers={**headers, "X-Inference-Mode": "local"}, json={"content": ai_text}, timeout=30)
    ok = r.status_code == 200 and "risk_score" in r.json()
    if ok:
        risk = r.json().get("risk_score", 0)
        log(f"Analysis (text)", ok, f"risk={risk:.2f}")
    else:
        log("Analysis (text)", False, r.text[:80])
except Exception as e:
    log("Scan/Detection", False, str(e)[:80])

# ===== THREATS =====
print("\n[THREATS]")
try:
    r = requests.get(f"{BASE_URL}/api/threats/", headers=headers, timeout=10)
    ok = r.status_code == 200
    count = len(r.json()) if ok else 0
    log(f"List threats", ok, f"{count} found" if ok else r.text[:60])
except Exception as e:
    log("Threats", False, str(e)[:60])

# ===== FORENSICS =====
print("\n[FORENSICS]")
try:
    # Get first threat ID if exists
    r = requests.get(f"{BASE_URL}/api/threats/", headers=headers, timeout=10)
    if r.status_code == 200 and len(r.json()) > 0:
        threat_id = r.json()[0].get("id", 1)
        r2 = requests.post(f"{BASE_URL}/api/forensics/{threat_id}", headers=headers, timeout=30)
        ok = r2.status_code == 200 and "stylometry" in r2.json()
        log(f"Forensic analysis (threat {threat_id})", ok, r2.text[:80] if not ok else "")
    else:
        print("  ⚠️  No threats in DB — forensic test skipped")
except Exception as e:
    log("Forensics", False, str(e)[:80])

# ===== NETWORK / GRAPH =====
print("\n[NETWORK / GRAPH]")
try:
    r = requests.get(f"{BASE_URL}/api/network/", headers=headers, timeout=10)
    ok = r.status_code == 200
    node_count = len(r.json().get("nodes", [])) if ok else 0
    log("Get graph nodes", ok, f"{node_count} nodes" if ok else r.text[:60])
except Exception as e:
    log("Graph", False, str(e)[:60])

# ===== AI POLICIES =====
print("\n[AI POLICIES]")
try:
    r = requests.get(f"{BASE_URL}/api/ai/policies", headers=headers, timeout=10)
    ok = r.status_code == 200
    count = len(r.json()) if ok else 0
    log(f"List policies", ok, f"{count} found" if ok else r.text[:60])
    
    # Create policy
    r2 = requests.post(f"{BASE_URL}/api/ai/policies", headers=headers, json={
        "name": "E2E Test Policy",
        "description": "Created by test script",
        "content": "IF ai_score > 0.85 THEN BLOCK_AND_LOG",
        "policy_type": "logical",
        "category": "test",
        "priority": 1,
    }, timeout=15)
    ok2 = r2.status_code == 201
    log("Create policy", ok2, r2.text[:60] if not ok2 else "")
    
    # Translate (Policy Guardian)
    r3 = requests.post(f"{BASE_URL}/api/ai/policy-translate", headers=headers, json={
        "intent": "Block high risk AI content from large botnets"
    }, timeout=30)
    ok3 = r3.status_code == 200
    log("Policy translate (NL->DSL)", ok3, r3.text[:80] if not ok3 else "")
except Exception as e:
    log("AI Policies", False, str(e)[:80])

# ===== AI INSIGHTS =====
print("\n[AI INSIGHTS]")
try:
    r = requests.get(f"{BASE_URL}/api/ai/insights", headers=headers, timeout=10)
    ok = r.status_code == 200
    log("List insights", ok, r.text[:60] if not ok else "")
except Exception as e:
    log("Insights", False, str(e)[:60])

# ===== AI CHAT =====
print("\n[AI CHAT]")
try:
    r = requests.post(f"{BASE_URL}/api/ai/chat", headers=headers, json={
        "conversation_id": "test-e2e",
        "message": "Summarize the current threat landscape"
    }, timeout=30)
    ok = r.status_code == 200
    log("AI Chat", ok, r.text[:80] if not ok else "")
except Exception as e:
    log("Chat", False, str(e)[:80])

# ===== ANALYST FUSION =====
print("\n[ANALYST]")
try:
    r = requests.post(f"{BASE_URL}/api/analyst/fusion", headers=headers, json={
        "threat_id": 1,
        "content": "Test content for fusion",
        "forensic_data": {"is_ai": True, "risk_score": 0.8},
        "graph_data": {"cluster_size": 10}
    }, timeout=45)
    ok = r.status_code == 200
    log("Analyst fusion", ok, r.text[:80] if not ok else "")
except Exception as e:
    log("Analyst", False, str(e)[:80])

# ===== SHARING / STIX =====
print("\n[SHARING / STIX]")
try:
    r = requests.get(f"{BASE_URL}/api/threats/", headers=headers, timeout=10)
    if r.status_code == 200 and len(r.json()) > 0:
        threat_id = r.json()[0].get("id", 1)
        r2 = requests.get(f"{BASE_URL}/api/sharing/export/stix/{threat_id}", headers=headers, timeout=10)
        ok = r2.status_code == 200
        log(f"STIX export (threat {threat_id})", ok, r2.text[:80] if not ok else "")
    else:
        print("  ⚠️  No threats — STIX export skipped")
except Exception as e:
    log("STIX", False, str(e)[:60])

# ===== ADMIN =====
print("\n[ADMIN]")
try:
    r = requests.get(f"{BASE_URL}/api/admin/users", headers=headers, timeout=10)
    ok = r.status_code == 200
    count = len(r.json()) if ok else 0
    log(f"List users", ok, f"{count} users" if ok else r.text[:60])
    
    r2 = requests.get(f"{BASE_URL}/api/admin/users/pending", headers=headers, timeout=10)
    ok2 = r2.status_code == 200
    log("Pending users", ok2, r2.text[:60] if not ok2 else "")
except Exception as e:
    log("Admin", False, str(e)[:60])

# ===== WORKER =====
print("\n[WORKER]")
try:
    r = requests.post(f"{BASE_URL}/api/worker/ingest/process-file", headers=headers, params={"file_path": "data/social_feed.json"}, timeout=60)
    ok = r.status_code == 200
    log("Worker ingest", ok, r.text[:80] if not ok else "")
except Exception as e:
    log("Worker", False, str(e)[:60])

# ===== BLOCKED CONTENT =====
print("\n[BLOCKED CONTENT]")
try:
    r = requests.get(f"{BASE_URL}/api/ai/blocked-content/stats", headers=headers, timeout=10)
    ok = r.status_code == 200
    log("Blocked content stats", ok, r.text[:60] if not ok else "")
except Exception as e:
    log("Blocked content", False, str(e)[:60])

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70)
