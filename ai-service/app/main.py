import os
import secrets
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from openai import OpenAI

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
openai_client = OpenAI(api_key=openai_api_key) if openai_api_key else None

app = FastAPI(title="BrandCheck AI Service", version="0.1.0")


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
