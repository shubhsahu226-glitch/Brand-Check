import os
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_structure():
    response = client.get("/ai/health")
    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert data["status"] in ("ok", "degraded")
    assert data["service"] == "brandcheck-ai-service"
    assert "openai_configured" in data
    assert isinstance(data["openai_configured"], bool)
    assert data["model_fast"] == os.getenv("LLM_MODEL_FAST", "gpt-4o-mini")
    assert data["model_review"] == os.getenv("LLM_MODEL_REVIEW", "gpt-4o")
    assert data["embedding_model"] == os.getenv(
        "EMBEDDING_MODEL", "text-embedding-3-small"
    )


def test_protected_probe_missing_header():
    response = client.get("/ai/protected-probe")
    assert response.status_code == 422


def test_protected_probe_missing_server_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("INTERNAL_API_KEY", raising=False)
    response = client.get(
        "/ai/protected-probe",
        headers={"X-Internal-Key": "some-key"},
    )
    assert response.status_code == 500
    assert response.json()["detail"] == "INTERNAL_API_KEY is not configured on server"


def test_protected_probe_invalid_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("INTERNAL_API_KEY", "correct-internal-secret-key-1234")
    response = client.get(
        "/ai/protected-probe",
        headers={"X-Internal-Key": "wrong-secret-key"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid internal API key"


def test_protected_probe_valid_key(monkeypatch: pytest.MonkeyPatch):
    secret = "correct-internal-secret-key-1234"
    monkeypatch.setenv("INTERNAL_API_KEY", secret)
    response = client.get(
        "/ai/protected-probe",
        headers={"X-Internal-Key": secret},
    )
    assert response.status_code == 200
    assert response.json() == {"status": "authenticated"}


def test_cors_middleware_removed():
    # Verify app does not have CORSMiddleware
    from fastapi.middleware.cors import CORSMiddleware

    middleware_classes = [m.cls for m in app.user_middleware]
    assert CORSMiddleware not in middleware_classes
