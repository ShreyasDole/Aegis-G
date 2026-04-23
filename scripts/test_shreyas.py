"""
Test script for Shreyas's components (Orchestrator, Policy Guardian, Admin, STIX, Ingest).
Run with: python scripts/test_shreyas.py
Requires: API running (e.g. uvicorn app.main:app --reload), requests installed.
"""
import os
import sys
import json

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

BASE_URL = os.getenv("AEGIS_API_URL", "http://localhost:8000")
ADMIN_EMAIL = os.getenv("AEGIS_ADMIN_EMAIL", "admin@aegis.com")
ADMIN_PASSWORD = os.getenv("AEGIS_ADMIN_PASSWORD", "AdminPassword123!")

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
SKIP = "\033[93mSKIP\033[0m"


def log(name: str, ok: bool, detail: str = ""):
    status = PASS if ok else FAIL
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))


def get_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10,
    )
    if r.status_code != 200:
        return None, r.text
    return r.json().get("access_token"), None


def test_health():
    """System health (no auth)."""
    r = requests.get(f"{BASE_URL}/api/system/health", timeout=5)
    ok = r.status_code == 200
    log("System health", ok, r.text[:80] if not ok else "")
    return ok


def test_detection_scan(token: str):
    """Detection API: local and cloud mode (header)."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # Local mode
    r = requests.post(
        f"{BASE_URL}/api/scan/",
        headers={**headers, "X-Inference-Mode": "local"},
        json={"content": "Sample post for testing detection."},
        timeout=15,
    )
    ok_local = r.status_code == 200 and "risk_score" in (r.json() or {})
    log("Detection scan (X-Inference-Mode: local)", ok_local, r.text[:80] if not ok_local else "")

    r2 = requests.post(
        f"{BASE_URL}/api/scan/",
        headers={**headers, "X-Inference-Mode": "cloud"},
        json={"content": "Another sample for cloud detection."},
        timeout=30,
    )
    ok_cloud = r2.status_code == 200 and "risk_score" in (r2.json() or {})
    log("Detection scan (X-Inference-Mode: cloud)", ok_cloud, r2.text[:80] if not ok_cloud else "Gemini may be unconfigured")
    return ok_local or ok_cloud


def test_policies(token: str):
    """List and create policy (Policy Service + Policy Guardian)."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = requests.get(f"{BASE_URL}/api/ai/policies", headers=headers, timeout=10)
    ok_list = r.status_code == 200
    log("List AI policies", ok_list, r.text[:80] if not ok_list else "")

    r2 = requests.post(
        f"{BASE_URL}/api/ai/policies",
        headers=headers,
        json={
            "name": "Test Policy Shreyas",
            "description": "Created by test script",
            "content": "IF ai_score > 0.8 THEN BLOCK_AND_LOG",
            "policy_type": "dsl",
            "category": "test",
            "priority": 1,
        },
        timeout=15,
    )
    ok_create = r2.status_code == 201
    log("Create AI policy (DSL)", ok_create, r2.text[:80] if not ok_create else "")
    return ok_list and ok_create


def test_policy_translate(token: str):
    """Policy Guardian: translate natural language to DSL."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = requests.post(
        f"{BASE_URL}/api/ai/policy-translate",
        headers=headers,
        json={"intent": "Block all content with high AI score and large botnet cluster."},
        timeout=30,
    )
    ok = r.status_code == 200 and ("dsl_logic" in (r.json() or {}) or "dsl" in str(r.json()))
    log("Policy Guardian translate (NL -> DSL)", ok, r.text[:80] if not ok else "Gemini may be unconfigured")
    return ok


def test_orchestrator(token: str):
    """Full pipeline: POST /api/analyst/orchestrate."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = requests.post(
        f"{BASE_URL}/api/analyst/orchestrate",
        headers=headers,
        json={
            "content": "Suspicious coordinated message promoting election disinformation.",
            "id": 999,
            "mode": "local",
        },
        timeout=60,
    )
    data = r.json() if r.status_code == 200 else {}
    ok = r.status_code == 200 and data.get("status") in ("PROCESSED", "BLOCKED")
    log("Orchestrator pipeline (local mode)", ok, r.text[:100] if not ok else "")
    return ok


def test_analyst_fusion(token: str):
    """Agent 3 fusion + Trust Layer (ledger hash)."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = requests.post(
        f"{BASE_URL}/api/analyst/fusion",
        headers=headers,
        json={
            "threat_id": 1,
            "content": "Sample threat content for fusion.",
            "forensic_data": {"is_ai": True, "risk_score": 0.85, "perplexity": 12.0, "burstiness": 0.1},
            "graph_data": {"cluster_size": 20, "is_botnet": True, "patient_zero": "192.168.1.1"},
        },
        timeout=45,
    )
    data = r.json() if r.status_code == 200 else {}
    ok = r.status_code == 200 and ("ledger_hash" in data or "report" in data)
    log("Analyst fusion + ledger hash", ok, r.text[:80] if not ok else "Gemini may be unconfigured")
    return ok


def test_threats_and_stix(token: str):
    """List threats and export STIX for first threat (if any)."""
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/api/threats/", headers=headers, timeout=10)
    if r.status_code != 200:
        log("List threats", False, r.text[:80])
        return False
    log("List threats", True, "")
    threats = r.json()
    if not threats:
        print(f"    {SKIP} No threats in DB — STIX export skipped (need threat_id)")
        return True
    threat_id = threats[0].get("id", 1)
    r2 = requests.get(f"{BASE_URL}/api/sharing/export/stix/{threat_id}", headers=headers, timeout=10)
    ok = r2.status_code == 200 and (isinstance(r2.json(), dict) or "indicator" in (r2.text or "").lower())
    log("STIX export (SIEM gateway)", ok, r2.text[:80] if not ok else "")
    return ok


def test_admin(token: str):
    """Admin: list users, list pending users."""
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/api/admin/users", headers=headers, timeout=10)
    ok_list = r.status_code == 200
    log("Admin list users", ok_list, r.text[:80] if not ok_list else "")

    r2 = requests.get(f"{BASE_URL}/api/admin/users/pending", headers=headers, timeout=10)
    ok_pending = r2.status_code == 200
    log("Admin list pending users", ok_pending, r2.text[:80] if not ok_pending else "")
    return ok_list and ok_pending


def test_worker_ingest(token: str):
    """Worker: process file (batch ingest)."""
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.post(
        f"{BASE_URL}/api/worker/ingest/process-file",
        headers=headers,
        params={"file_path": "data/social_feed.json"},
        timeout=120,
    )
    data = r.json() if r.status_code == 200 else {}
    ok = r.status_code == 200 and ("total_processed" in data or "results" in data or "status" in data)
    log("Worker ingest (process-file)", ok, r.text[:80] if not ok else "")
    return ok


def test_blocked_content_stats(token: str):
    """Blocked content stats (Agent 4 output)."""
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/api/ai/blocked-content/stats", headers=headers, timeout=10)
    ok = r.status_code == 200
    log("Blocked content stats (Agent 4)", ok, r.text[:80] if not ok else "")
    return ok


def main():
    print(f"\nShreyas component tests — BASE_URL={BASE_URL}\n")
    results = []

    results.append(("Health", test_health()))

    token, err = get_token()
    if not token:
        print(f"  {FAIL} Login — {err}")
        print("  Use admin@aegis.com / AdminPassword123! (or seed users). Set AEGIS_ADMIN_EMAIL / AEGIS_ADMIN_PASSWORD if needed.")
        sys.exit(1)
    print(f"  {PASS} Login (admin)")

    results.append(("Detection (scan)", test_detection_scan(token)))
    results.append(("Policies (list + create)", test_policies(token)))
    results.append(("Policy Guardian (translate)", test_policy_translate(token)))
    results.append(("Orchestrator pipeline", test_orchestrator(token)))
    results.append(("Analyst fusion + ledger", test_analyst_fusion(token)))
    results.append(("Threats + STIX export", test_threats_and_stix(token)))
    results.append(("Admin (users + pending)", test_admin(token)))
    results.append(("Worker ingest", test_worker_ingest(token)))
    results.append(("Blocked content stats", test_blocked_content_stats(token)))

    passed = sum(1 for _, ok in results if ok)
    total = len(results)
    print(f"\nResult: {passed}/{total} checks passed.\n")
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
