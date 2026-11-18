import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
openai_client = OpenAI(api_key=openai_api_key) if openai_api_key else None

app = FastAPI(title="BrandCheck AI Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_URL", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ai/health")
def health() -> dict[str, str | bool]:
    configured = openai_client is not None
    return {
        "status": "ok" if configured else "degraded",
        "service": "brandcheck-ai-service",
        "openai_configured": configured,
    }
