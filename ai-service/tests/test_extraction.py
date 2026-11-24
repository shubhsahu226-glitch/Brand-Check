import io
import pytest
from fastapi.testclient import TestClient
import docx
import pptx
import pypdf

from app.main import app

client = TestClient(app)

TEST_INTERNAL_KEY = "test-internal-key-for-brandcheck-32char"


@pytest.fixture(autouse=True)
def setup_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("INTERNAL_API_KEY", TEST_INTERNAL_KEY)


def create_sample_docx(text: str) -> bytes:
    doc = docx.Document()
    doc.add_heading("Brand Guidelines 2026", level=1)
    doc.add_paragraph(text)
    table = doc.add_table(rows=1, cols=2)
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Primary Color"
    hdr_cells[1].text = "#4F46E5 Indigo"
    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()


def create_sample_pptx(text: str) -> bytes:
    prs = pptx.Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    slide.shapes.title.text = "Acme Brand Standards"
    slide.placeholders[1].text = text
    stream = io.BytesIO()
    prs.save(stream)
    return stream.getvalue()


def create_sample_pdf(text: str) -> bytes:
    # Use pypdf to generate a valid PDF in memory
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=72, height=72)
    stream = io.BytesIO()
    writer.write(stream)
    return stream.getvalue()


def test_extract_text_docx():
    content = create_sample_docx("Do not use competitor names in marketing copy. Tone should be empathetic.")
    response = client.post(
        "/ai/extract-text",
        headers={"X-Internal-Key": TEST_INTERNAL_KEY},
        files={"file": ("guidelines.docx", content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "competitor names" in data["data"]["extractedText"]
    assert data["data"]["pageCount"] >= 1


def test_extract_text_pptx():
    content = create_sample_pptx("Always use approved tagline: 'Safety by Design'.")
    response = client.post(
        "/ai/extract-text",
        headers={"X-Internal-Key": TEST_INTERNAL_KEY},
        files={"file": ("slides.pptx", content, "application/vnd.openxmlformats-officedocument.presentationml.presentation")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Safety by Design" in data["data"]["extractedText"]
    assert data["data"]["pageCount"] >= 1


def test_extract_text_unsupported_format():
    response = client.post(
        "/ai/extract-text",
        headers={"X-Internal-Key": TEST_INTERNAL_KEY},
        files={"file": ("malicious.exe", b"MZ...", "application/octet-stream")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "UNSUPPORTED_TYPE"


def test_extract_knowledge_heuristic_or_llm():
    sample_text = """
    Tone of voice: Our voice is Empathetic, Clear, and Direct.
    Banned words: Never use the word 'cheap' or 'quick-fix'.
    Approved terms: Always refer to our product as 'BrandCheck Engine'.
    Mandatory disclosure: © 2026 BrandCheck Inc. All rights reserved.
    """
    response = client.post(
        "/ai/extract-knowledge",
        headers={"X-Internal-Key": TEST_INTERNAL_KEY},
        json={
            "text": sample_text,
            "pages": [{"page": 1, "text": sample_text}],
            "fileName": "test_guide.pdf",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["itemCount"] > 0
    items = data["data"]["items"]
    # Check that items have required keys and valid types
    for item in items:
        assert item["type"] in [
            "RULE", "TONE", "TERM_APPROVED", "TERM_BANNED",
            "FACT", "CLAIM", "VISUAL", "ACCESSIBILITY", "DISCLOSURE"
        ]
        assert "title" in item
        assert "body" in item
        assert "sourceQuote" in item
        assert 0.0 <= item["confidence"] <= 1.0


def test_extract_endpoints_require_internal_key():
    # extract-text without key
    res1 = client.post("/ai/extract-text")
    assert res1.status_code in (401, 422)

    # extract-knowledge without key
    res2 = client.post("/ai/extract-knowledge", json={"text": "Hello"})
    assert res2.status_code in (401, 422)
