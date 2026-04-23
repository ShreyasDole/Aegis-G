"""Red-team and scan wiring: real code path must invoke ThreatOrchestrator (no random fake outcomes)."""
import pytest
from unittest.mock import AsyncMock


@pytest.mark.unit
def test_red_team_invokes_orchestrator_each_iteration(client, auth_headers, monkeypatch):
    calls = []

    async def fake_process(payload, db, mode="local"):
        calls.append({"content": payload.get("content", "")[:40], "mode": mode})
        return {
            "status": "PROCESSED",
            "risk_score": 0.55,
            "forensics": {"detected_model": "stub"},
            "detected_model": "stub",
            "is_conversational": False,
        }

    monkeypatch.setattr(
        "app.routers.detection.orchestrator.process_incoming_threat",
        fake_process,
    )

    r = client.post(
        "/api/scan/red-team/simulate",
        headers={**auth_headers, "X-Inference-Mode": "local"},
        json={"count": 2},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["engine"] == "ThreatOrchestrator"
    assert len(calls) == 2
    for c in calls:
        assert "Analyze and detect threats" in c["content"]
