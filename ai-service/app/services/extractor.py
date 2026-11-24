import io
import re
from typing import Any

import docx
import pptx
import pypdf

# Maximum allowed file size: 10 MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

# Maximum decompressed text ratio to prevent zip bombs (50x)
MAX_EXPANSION_RATIO = 50


class ExtractionError(Exception):
    def __init__(self, message: str, code: str = "EXTRACTION_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


def sanitize_text(text: str) -> str:
    """Strips null bytes and non-printable control characters, preserving newlines and tabs."""
    if not text:
        return ""
    # Strip null bytes and control chars except \t, \n, \r
    sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Normalize excessive newlines
    sanitized = re.sub(r"\n{4,}", "\n\n\n", sanitized)
    return sanitized.strip()


def extract_from_pdf(content: bytes) -> dict[str, Any]:
    """Extracts text and page-by-page content from PDF bytes using pypdf."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(content))
    except Exception as e:
        raise ExtractionError(f"Failed to parse PDF document: {str(e)}", code="CORRUPT_FILE")

    if reader.is_encrypted:
        raise ExtractionError(
            "Encrypted or password-protected PDF files are not supported.",
            code="ENCRYPTED_FILE",
        )

    pages = []
    full_text_parts = []

    for i, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
            clean_text = sanitize_text(page_text)
            pages.append({"page": i + 1, "text": clean_text})
            if clean_text:
                full_text_parts.append(f"[Page {i + 1}]\n{clean_text}")
        except Exception:
            pages.append({"page": i + 1, "text": ""})

    full_text = "\n\n".join(full_text_parts)
    return {
        "pageCount": len(reader.pages),
        "totalCharacters": len(full_text),
        "extractedText": full_text,
        "pages": pages,
    }


def extract_from_docx(content: bytes) -> dict[str, Any]:
    """Extracts text from DOCX bytes using python-docx."""
    try:
        doc = docx.Document(io.BytesIO(content))
    except Exception as e:
        raise ExtractionError(f"Failed to parse DOCX document: {str(e)}", code="CORRUPT_FILE")

    text_parts = []
    # Extract paragraphs
    for p in doc.paragraphs:
        if p.text:
            cleaned = sanitize_text(p.text)
            if cleaned:
                text_parts.append(cleaned)

    # Extract tables
    for table in doc.tables:
        for row in table.rows:
            row_cells = [sanitize_text(cell.text) for cell in row.cells if cell.text.strip()]
            if row_cells:
                text_parts.append(" | ".join(row_cells))

    full_text = "\n\n".join(text_parts)

    # Check zip bomb expansion ratio
    if len(content) > 0 and (len(full_text.encode("utf-8")) / len(content)) > MAX_EXPANSION_RATIO:
        raise ExtractionError(
            "Document failed decompression safety checks (unusually high expansion ratio).",
            code="ZIP_BOMB_DETECTED",
        )

    return {
        "pageCount": 1,
        "totalCharacters": len(full_text),
        "extractedText": full_text,
        "pages": [{"page": 1, "text": full_text}],
    }


def extract_from_pptx(content: bytes) -> dict[str, Any]:
    """Extracts text slide-by-slide from PPTX bytes using python-pptx."""
    try:
        prs = pptx.Presentation(io.BytesIO(content))
    except Exception as e:
        raise ExtractionError(f"Failed to parse PPTX presentation: {str(e)}", code="CORRUPT_FILE")

    pages = []
    full_text_parts = []

    for i, slide in enumerate(prs.slides):
        slide_texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    cleaned = sanitize_text(paragraph.text)
                    if cleaned:
                        slide_texts.append(cleaned)
            elif shape.has_table:
                for row in shape.table.rows:
                    row_texts = [sanitize_text(c.text) for c in row.cells if c.text.strip()]
                    if row_texts:
                        slide_texts.append(" | ".join(row_texts))

        slide_full = "\n".join(slide_texts)
        pages.append({"page": i + 1, "text": slide_full})
        if slide_full:
            full_text_parts.append(f"[Slide {i + 1}]\n{slide_full}")

    full_text = "\n\n".join(full_text_parts)

    return {
        "pageCount": len(prs.slides),
        "totalCharacters": len(full_text),
        "extractedText": full_text,
        "pages": pages,
    }


def extract_document_text(filename: str, content: bytes) -> dict[str, Any]:
    """Routes document to appropriate parser based on file extension and executes security checks."""
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ExtractionError(
            f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
            code="FILE_TOO_LARGE",
        )

    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_from_pdf(content)
    elif lower_name.endswith(".docx"):
        return extract_from_docx(content)
    elif lower_name.endswith(".pptx"):
        return extract_from_pptx(content)
    elif lower_name.endswith(".txt") or lower_name.endswith(".md"):
        try:
            raw_text = content.decode("utf-8", errors="replace")
            cleaned = sanitize_text(raw_text)
            return {
                "pageCount": 1,
                "totalCharacters": len(cleaned),
                "extractedText": cleaned,
                "pages": [{"page": 1, "text": cleaned}],
            }
        except Exception as e:
            raise ExtractionError(f"Failed to read text file: {str(e)}", code="CORRUPT_FILE")
    else:
        raise ExtractionError(
            "Unsupported file type. Only PDF, DOCX, and PPTX documents are supported.",
            code="UNSUPPORTED_TYPE",
        )
