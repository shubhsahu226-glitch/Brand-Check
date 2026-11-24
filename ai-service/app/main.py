import os
import secrets
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel

from app.services.extractor import ExtractionError, extract_document_text
from app.services.knowledge import extract_brand_knowledge

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
openai_client = OpenAI(api_key=openai_api_key) if openai_api_key else None

app = FastAPI(title="BrandCheck AI Service", version="0.2.0")


def verify_internal_key(
    x_internal_key: str = Header(..., alias="X-Internal-Key"),
) -> bool:
    expected_key = os.getenv("INTERNAL_API_KEY", "").strip()
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="INTERNAL_API_KEY is not configured on server",
        )
    if not secrets.compare_digest(x_internal_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key",
        )
    return True


@app.get("/ai/health")
def health() -> dict[str, Any]:
    configured = openai_client is not None
    return {
        "status": "ok" if configured else "degraded",
        "service": "brandcheck-ai-service",
        "openai_configured": configured,
        "model_fast": os.getenv("LLM_MODEL_FAST", "gpt-4o-mini"),
        "model_review": os.getenv("LLM_MODEL_REVIEW", "gpt-4o"),
        "embedding_model": os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
    }


@app.get("/ai/protected-probe", dependencies=[Depends(verify_internal_key)])
def protected_probe() -> dict[str, str]:
    return {"status": "authenticated"}


@app.post("/ai/extract-text", dependencies=[Depends(verify_internal_key)])
async def extract_text(file: UploadFile = File(...)) -> JSONResponse:
    """Extracts raw text and metadata from uploaded PDF, DOCX, or PPTX file."""
    try:
        content = await file.read()
        filename = file.filename or "unknown.pdf"
        result = extract_document_text(filename, content)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "data": result,
            },
        )
    except ExtractionError as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "error",
                "error": {
                    "code": e.code,
                    "message": e.message,
                },
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error": {
                    "code": "EXTRACTION_FAILURE",
                    "message": f"Unexpected extraction error: {str(e)}",
                },
            },
        )


class ExtractKnowledgeRequest(BaseModel):
    text: str
    pages: list[dict[str, Any]] | None = None
    fileName: str | None = None


@app.post("/ai/extract-knowledge", dependencies=[Depends(verify_internal_key)])
def extract_knowledge(req: ExtractKnowledgeRequest) -> JSONResponse:
    """Extracts structured brand guidelines and facts from text using LLM with heuristic fallbacks."""
    try:
        items = extract_brand_knowledge(
            text=req.text,
            pages=req.pages,
            client=openai_client,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "data": {
                    "itemCount": len(items),
                    "items": items,
                },
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error": {
                    "code": "KNOWLEDGE_EXTRACTION_FAILURE",
                    "message": f"Failed to extract knowledge: {str(e)}",
                },
            },
        )
