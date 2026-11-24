import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
INTERNAL_KEY = "test-internal-key-for-brandcheck-suite"


@pytest.fixture(autouse=True)
def set_internal_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("INTERNAL_API_KEY", INTERNAL_KEY)


def test_check_draft_requires_internal_key():
    response = client.post(
        "/ai/check-draft",
        json={"text": "Our product is amazing.", "rules": []},
    )
    assert response.status_code == 422


def test_check_draft_invalid_internal_key():
    response = client.post(
        "/ai/check-draft",
        headers={"X-Internal-Key": "wrong-key"},
        json={"text": "Our product is amazing.", "rules": []},
    )
    assert response.status_code == 401


def test_check_draft_banned_term_detected():
    rules = [
        {
            "id": "rule_1",
            "type": "TERM_BANNED",
            "title": "Banned Term: LegacyApp",
            "body": "Never use the term 'LegacyApp'. Use BrandCheck instead.",
        }
    ]
    response = client.post(
        "/ai/check-draft",
        headers={"X-Internal-Key": INTERNAL_KEY},
        json={
            "text": "Upgrade today from LegacyApp to get faster workflows.",
            "rules": rules,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    review = data["data"]
    assert "complianceScore" in review
    assert review["complianceScore"] < 100
    assert len(review["suggestions"]) >= 1

    banned_suggestion = next(
        (s for s in review["suggestions"] if s["category"] == "TERM_BANNED"),
        None,
    )
    assert banned_suggestion is not None
    assert banned_suggestion["severity"] == "ERROR"
    assert "LegacyApp" in banned_suggestion["originalText"]


def test_check_draft_unsubstantiated_claim():
    response = client.post(
        "/ai/check-draft",
        headers={"X-Internal-Key": INTERNAL_KEY},
        json={
            "text": "We are the best in the world and 100% guaranteed.",
            "rules": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    review = data["data"]
    assert len(review["suggestions"]) >= 1
    assert review["complianceScore"] < 100


def test_check_draft_clean_text():
    response = client.post(
        "/ai/check-draft",
        headers={"X-Internal-Key": INTERNAL_KEY},
        json={
            "text": "BrandCheck empowers creative teams with consistent guidelines.",
            "rules": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    review = data["data"]
    assert review["complianceScore"] == 100
    assert len(review["suggestions"]) == 0
