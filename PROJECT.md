# BrandCheck Project Context

This document is the source of truth for project scope, architecture, data contracts, and implementation decisions.

## Product Rule (Non-Negotiable)

BrandCheck must never automatically publish content or silently rewrite a creator's draft. AI may extract brand knowledge, review drafts, explain findings, and suggest corrections. People accept, edit, or dismiss suggestions, review and approve content, and make the final publication decision.

## JavaScript-Based Tech Stack

- **Frontend:** React 19, Vite, JavaScript (`.jsx`, `.js`), Tailwind CSS, Lucide React, React Hook Form, Zod, React Hot Toast
- **Backend:** Node.js, Express, JavaScript (CommonJS), Prisma ORM, bcryptjs, jsonwebtoken, cookie-parser, Zod, Resend
- **Database:** Supabase PostgreSQL (with pgvector enabled)
- **AI Service:** Python 3.12+, FastAPI, Uvicorn, OpenAI SDK, Pydantic, Pytest, Ruff
- **Storage:** Supabase Storage (for Phase 2+ document and asset storage)
- **Email:** Resend (transactional invitation delivery)
- **Testing:** Vitest + Supertest (Backend), Pytest + HTTPX (AI Service), Vite build + ESLint (Frontend)

*Constraint:* Frontend and backend application code must use JavaScript. TypeScript is strictly prohibited in frontend and backend. Python with type hints is expected in `ai-service`.

---

## Phase Roadmap & Library Policy

### Phase 0 — Project Setup (Complete)
- Monorepo structure, initial services, health checks, repo hygiene, CI workflows.

### Phase 1 — Authentication & Workspaces (Complete)
- **Backend:** `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `zod`, `resend`, `@prisma/client`.
- **Frontend:** `react-hook-form`, `zod`, `@hookform/resolvers`, `react-hot-toast`, `lucide-react`.
- **AI Service:** `fastapi`, `uvicorn`, `openai`, `pydantic`, `pytest`, `httpx`, `ruff`.

### Phase 2 — Brand Knowledge Base (Next Up)
- **Frontend:** `@tanstack/react-query`, file upload UI components, guideline rule editor.
- **Backend:** `multer`, `pdf-parse`, `mammoth`, `zod`.
- **AI Service:** `pypdf`, `python-docx`, `python-pptx`, `openai`, `pgvector`.
- **External:** Supabase Storage, OpenAI Embeddings.

### Phase 3 — Draft Intake
- **Frontend:** Drag-and-drop upload UI, rich text editor integration.
- **Backend:** Draft storage, version tracking, Supabase Storage integration.

### Phase 4 — Brand Check Review Engine
- **Frontend:** Highlighting, suggestion accept/dismiss UI, side-by-side diffing.
- **Backend:** Rule checking pipeline, AI service integration, vector retrieval.

### Phase 5 — Review and Approval
- **Frontend:** Review queue, threaded comments, formal approval/rejection actions.
- **Backend:** Audit trail, decision logging, status transitions.

### Phase 6 — Insights and Polish
- **Frontend:** Recharts, compliance trends, skeleton loaders.
- **Backend:** Prisma aggregation queries, workspace analytics.

### Phase 7 — Production Deployment
- Vercel multi-service deployment for the Vite frontend, Express API, and FastAPI AI service; production environment configuration, database migration, and monitoring.

---

## Architecture & Security Principles

```text
┌─────────────────┐       HTTPS / Cookies       ┌────────────────────────┐
│  React Frontend │ ──────────────────────────> │ Node.js Express Backend│
└─────────────────┘                             └──────────┬─────────────┘
                                                           │
                      ┌────────────────────────────────────┼───────────────────────────┐
                      │ Internal HTTP + X-Internal-Key     │ Prisma ORM (Pooler/Direct)│
                      ▼                                    ▼                           ▼
            ┌──────────────────┐               ┌───────────────────────┐   ┌───────────────────┐
            │Python AI Service │               │ Supabase PostgreSQL   │   │  Resend Email API │
            └─────────┬────────┘               └───────────────────────┘   └───────────────────┘
                      │ OpenAI API
                      ▼
            ┌──────────────────┐
            │   OpenAI Cloud   │
            └──────────────────┘
```

1. **Frontend Isolation:** The frontend calls only the Node.js backend. The frontend NEVER communicates directly with the Python AI service or OpenAI.
2. **AI Service Hardening:** `CORSMiddleware` is completely removed from the AI service. All incoming requests require an `X-Internal-Key` header verified with constant-time `secrets.compare_digest`.
3. **Vercel Service Boundaries:** The frontend is publicly routed at `/`; the backend is publicly routed at `/api/*`; the AI service has no public rewrite. The backend declares a service binding to the AI service through `AI_SERVICE_URL`. Service bindings provide connectivity but do not replace the AI service's `X-Internal-Key` authorization. The Phase 1 code has not implemented backend-to-AI request calls yet.
4. **Multi-Tenant Data Isolation:** Every workspace resource is partitioned by `workspaceId`. Backend queries enforce tenant scoping via the `scoped(req)` Prisma helper. Cross-tenant access is rejected with `HTTP 403 Forbidden`.
5. **Token Security Model:**
   - **Access Tokens:** Short-lived JWTs (15 minutes) kept exclusively in frontend memory. Payload contains `userId`, `email`, `role`, and `workspaceId`.
   - **Refresh Tokens:** Long-lived (7 days) cryptographically secure random tokens stored hashed (`SHA-256`) in the database and delivered in `httpOnly`, `sameSite: 'lax'`, `secure` cookies with path `/api/auth`.
   - **Token Rotation & Family Revocation:** Refreshing rotates the token. If an already-consumed token is reused, the entire token family is revoked immediately to prevent replay attacks.
6. **Constant-Time Timing Protection:** Password verification uses `bcrypt.compare`. If an email is not found, a constant-time `fakeHash` is compared against to prevent user enumeration via timing attacks.

---

## Finalized Data Models (Prisma)

### `User`
- `id` (cuid, primary key)
- `email` (string, unique, lowercase, trimmed)
- `passwordHash` (string, bcrypt cost 12)
- `name` (string)
- `role` (`ADMIN`, `CREATOR`, `REVIEWER` — workspace-level authority governed through membership)
- `createdAt`, `updatedAt`
- Relations: `memberships` (`WorkspaceMember[]`), `refreshTokens` (`RefreshToken[]`), `sentInvitations` (`Invitation[]`)

### `Workspace`
- `id` (cuid, primary key)
- `name` (string)
- `slug` (string, unique)
- `createdAt`, `updatedAt`
- Relations: `members` (`WorkspaceMember[]`), `invitations` (`Invitation[]`)

### `WorkspaceMember`
- `id` (cuid, primary key)
- `workspaceId` (foreign key -> `Workspace.id`)
- `userId` (foreign key -> `User.id`)
- `role` (`ADMIN`, `CREATOR`, `REVIEWER`)
- `createdAt`, `updatedAt`
- Unique constraint: `[workspaceId, userId]`

### `Invitation`
- `id` (cuid, primary key)
- `workspaceId` (foreign key -> `Workspace.id`)
- `inviterId` (foreign key -> `User.id`)
- `email` (string, lowercase)
- `role` (`CREATOR`, `REVIEWER`)
- `tokenHash` (string, unique, SHA-256 hash of raw invite token)
- `status` (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`)
- `expiresAt` (timestamp, 7 days from creation)
- `createdAt`, `updatedAt`
- Index: `[tokenHash]`, `[workspaceId, email]`

### `RefreshToken`
- `id` (cuid, primary key)
- `userId` (foreign key -> `User.id`)
- `tokenHash` (string, unique, SHA-256 hash)
- `family` (string, UUID identifying token generation chain)
- `isRevoked` (boolean, default `false`)
- `expiresAt` (timestamp, 7 days from creation)
- `createdAt`

---

## Finalized API Contracts

### Authentication APIs (`/api/auth`)
- `POST /api/auth/signup`: Creates user + workspace + admin member in an atomic transaction. Sets refresh cookie, returns access token + user + workspace payload.
- `POST /api/auth/login`: Authenticates credentials, rotates refresh token cookie, returns access token + user profile.
- `POST /api/auth/refresh`: Verifies httpOnly refresh cookie, issues rotated refresh cookie and new 15-minute access token.
- `POST /api/auth/logout`: Revokes refresh token in database, clears httpOnly cookie.
- `GET /api/me`: Returns authenticated user profile, workspace memberships, and active workspace details.

### Workspace & Member APIs (`/api/workspaces` & `/api/invitations`)
- `GET /api/workspaces/current`: Returns current workspace details and member count.
- `GET /api/workspaces/members`: Returns workspace member list (and pending invitations for admins).
- `PATCH /api/workspaces/members/:id/role`: Admin-only. Updates member role (`ADMIN`, `CREATOR`, `REVIEWER`). Protects against self-demotion if the user is the sole admin.
- `POST /api/invitations`: Admin-only. Invites an email with role `CREATOR` or `REVIEWER`, creates 7-day secure token, sends email via Resend, and returns `{ invitation, inviteUrl }`.
- `GET /api/invitations/:token`: Public. Inspects invitation validity, workspace name, invited email, role, and expiration.
- `POST /api/invitations/accept`: Authenticated or Public. Accepts invitation by token, creates user if registering, joins workspace with invited role, marks invitation `ACCEPTED`.

### AI Service APIs (`/ai`)
- `GET /ai/health`: Unauthenticated probe returning service health, OpenAI configuration status, and model parameters (`LLM_MODEL_FAST`, `LLM_MODEL_REVIEW`, `EMBEDDING_MODEL`).
- `GET /ai/protected-probe`: Internal endpoint requiring `X-Internal-Key` header matching `INTERNAL_API_KEY`.

---

## Unified Response Envelopes

### Success Envelope
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Envelope
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Human-readable explanation",
    "details": null
  }
}
```

Standard Error Codes:
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `UNPROCESSABLE_ENTITY` (422)
- `INTERNAL_SERVER_ERROR` (500)

---

## Testing & Quality Assurance Verification

1. **Backend Test Suite (Vitest + Supertest):**
   - 5 test suites, 56/56 passing tests.
   - Deterministic test setup: runs against dedicated `TEST_DATABASE_URL` targeting `schema=test`. Fails safe if `TEST_DATABASE_URL` is missing or matches production.
2. **AI Service Test Suite (Pytest + HTTPX):**
   - 6/6 passing tests in `ai-service/tests/test_health.py`.
   - Linted and formatted with `ruff` (0 errors, 0 warnings).
3. **Frontend Test & Build (Vite + ESLint):**
   - ESLint: 0 errors, 0 warnings.
   - Vite Production Build: Clean compilation in ~3.3 seconds.

---

## Current Status & Next Steps

* **Current Status:** Phase 1 (Authentication and Workspaces) is **100% complete, hardened, tested, and verified**.
* **Next Phase:** **Phase 2 — Brand Knowledge Base**:
  - Document upload and ingestion (PDF, DOCX, TXT via Supabase Storage).
  - Document parsing and chunking.
  - OpenAI embeddings generation (`text-embedding-3-small`) and storage in Supabase PostgreSQL via `pgvector`.
  - Brand guideline rules extraction and editable rules / approved facts UI.
