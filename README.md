# BrandCheck

BrandCheck is an enterprise brand compliance and review platform. It gives creative teams instant AI-assisted brand guideline checks, verified fact retrieval, and explainable findings before content goes live.

> **Core Product Rule (Human-Led by Design):**  
> BrandCheck must never automatically publish content or silently rewrite a creator's draft. AI suggests and explains; people make all final publication decisions.

---

## Current Status: Phase 1 Complete (Production-Ready)

- [x] **Phase 0 — Project Setup & Tooling:** Monorepo architecture, linting, formatting, CI pipelines, and hardened baseline configurations.
- [x] **Phase 1 — Authentication & Workspaces:** Multi-tenant workspace isolation, role-based dashboards (`ADMIN`, `CREATOR`, `REVIEWER`), secure JWT + httpOnly refresh token cookies with family revocation, 7-day tokenized invitations, Resend email delivery, and an interactive landing page.
- [ ] **Phase 2 — Brand Knowledge Base (Next):** Document ingestion (PDF, DOCX), vector embeddings (`text-embedding-3-small`), and editable brand rules.

---

## Tech Stack

| Layer | Technologies | Standards |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, React Hook Form, Zod | Pure JavaScript (`.jsx`, `.js`). No TypeScript. |
| **Backend** | Node.js, Express, Prisma ORM, bcryptjs, jsonwebtoken, cookie-parser, Zod | Pure JavaScript (CommonJS). |
| **Database** | Supabase PostgreSQL (pgvector enabled) | Tenant isolation by `workspace_id`. |
| **AI Service** | Python 3.12+, FastAPI, Uvicorn, OpenAI SDK, Pydantic | Python with type hints. Pytest + Ruff. |
| **Email** | Resend | Transactional workspace invitations. |

---

## Repository Structure

```text
brand-check/
├── frontend/                         # React 19 + Vite frontend
│   ├── src/
│   │   ├── pages/                    # Home, Login, Signup, Invite, Dashboards
│   │   ├── components/               # ProtectedRoute, Layouts
│   │   ├── context/                  # AuthContext with auto-refresh
│   │   ├── lib/api.js                # Axios client with refresh interceptor
│   │   └── styles.css                # Tailwind directives & keyframe animations
│   ├── eslint.config.js              # ESLint 9 flat config
│   └── vite.config.js                # Vite build config
├── backend/                          # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma             # PostgreSQL schema (User, Workspace, Member, etc.)
│   │   └── migrations/               # Version-controlled Prisma SQL migrations
│   ├── src/
│   │   ├── controllers/              # Auth, Invitation, Member controllers
│   │   ├── middleware/auth.js        # requireAuth, requireRole, scoped(req)
│   │   ├── lib/                      # tokens, errors, prisma, email
│   │   └── app.js                    # Express app configuration
│   ├── tests/                        # Vitest + Supertest integration test suite (56 tests)
│   └── eslint.config.js              # ESLint 9 backend config
├── ai-service/                       # Python FastAPI microservice
│   ├── app/
│   │   └── main.py                   # FastAPI app, constant-time internal key verification
│   ├── tests/                        # Pytest test suite (6 tests)
│   └── requirements.txt              # Pinned Python dependencies
├── .github/
│   ├── workflows/ci.yml              # Multi-job GitHub Actions CI pipeline
│   └── pull_request_template.md      # Standard PR template
├── PROJECT.md                        # Architecture, data contracts, and decisions
└── README.md                         # This file
```

---

## Local Setup & Quickstart

### Prerequisites
- **Node.js** 20.x or later
- **Python** 3.12 or later
- **Git**
- A **Supabase PostgreSQL** database connection URL (or local PostgreSQL instance)

---

### 1. Backend Setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Populate `backend/.env` with your Supabase database credentials and secrets:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
JWT_ACCESS_SECRET="your-32-character-secret-access-key"
JWT_REFRESH_SECRET="your-32-character-secret-refresh-key"
AI_SERVICE_URL="http://localhost:8000"
INTERNAL_API_KEY="your_shared_internal_api_key_min_32_chars"
FRONTEND_URL="http://localhost:5173"
RESEND_API_KEY="your_resend_api_key_here"
```

Apply database migrations:
```powershell
npx prisma migrate dev
```

Start the backend development server:
```powershell
npm run dev
```
*Health Check:* `http://localhost:5000/api/health`

---

### 2. Python AI Service Setup

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Populate `ai-service/.env`:
```env
PORT=8000
INTERNAL_API_KEY="your_shared_internal_api_key_min_32_chars"
OPENAI_API_KEY="your_openai_api_key"
LLM_MODEL_FAST="gpt-4o-mini"
LLM_MODEL_REVIEW="gpt-4o"
EMBEDDING_MODEL="text-embedding-3-small"
```

Start the AI microservice:
```powershell
uvicorn app.main:app --reload --port 8000
```
*Health Check:* `http://localhost:8000/ai/health`

---

### 3. Frontend Setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the Vite development server:
```powershell
npm run dev
```
*Open application:* `http://localhost:5173`

---

## Running Test Suites & Quality Checks

### Backend Integration Tests (Vitest + Supertest)
Backend tests run against a dedicated isolated schema (`schema=test`) using `TEST_DATABASE_URL`:
```powershell
cd backend
npm test
npm run lint
```
*Expected output:* 5 test files, 56/56 passing tests, 0 lint warnings.

### AI Service Tests (Pytest + Ruff)
```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
python -m pytest tests -v
ruff check .
ruff format --check .
```
*Expected output:* 6 passing tests, all ruff checks passed.

### Frontend Validation (ESLint + Vite Build)
```powershell
cd frontend
npm run lint
npm run build
```
*Expected output:* 0 errors, 0 warnings, clean production bundle in `frontend/dist/`.

---

## Security Model Overview

1. **HttpOnly Refresh Cookies:** Refresh tokens are never exposed to browser JavaScript, preventing token exfiltration via XSS.
2. **Refresh Token Rotation & Family Revocation:** Every token refresh revokes the existing token and issues a new one. If an invalid or revoked token is used, the entire family is revoked.
3. **Tenant Scoping:** All database queries are filtered by `scoped(req)` using `workspaceId` extracted from the verified access token.
4. **Timing Attack Protection:** Invalid login emails trigger constant-time bcrypt verification against a `fakeHash` to eliminate timing differences.
5. **No Direct Browser-to-AI Communication:** `CORSMiddleware` is stripped from the AI service; all AI traffic is routed through the backend authenticated via `X-Internal-Key` with constant-time `secrets.compare_digest`.
