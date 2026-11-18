# BrandCheck Project Context

This document is the source of truth for project scope and implementation decisions.

## Product rule

BrandCheck must never automatically publish content or silently rewrite a creator's draft. AI may extract brand knowledge, review drafts, explain findings, and suggest corrections. People accept, edit, or dismiss suggestions, review and approve content, and make the final publication decision.

## JavaScript-based tech stack

- Frontend: React, Vite, JavaScript, Tailwind CSS
- Backend: Node.js, Express, JavaScript, Prisma
- Database: Supabase PostgreSQL
- AI service: Python, FastAPI, OpenAI SDK
- Storage: Supabase Storage
- Vector search: Supabase PostgreSQL with pgvector
- Email: Resend
- Hosting: Vercel (frontend), Render or Railway (backend)

Frontend and backend application code must use JavaScript. TypeScript is not permitted there. Python type hints are expected in ai-service.

## Phase-wise libraries

### Phase 0 — Project setup

- Frontend: react, react-dom, react-router-dom, axios, tailwindcss, lucide-react, clsx, tailwind-merge
- Backend: express, cors, dotenv, morgan, prisma, @prisma/client, zod
- AI service: fastapi, uvicorn, openai, python-dotenv, pydantic
- External: Supabase PostgreSQL

### Phase 1 — Authentication and workspaces

- Frontend: react-hook-form, zod, react-hot-toast
- Backend: bcryptjs, jsonwebtoken, cookie-parser, zod, resend

### Phase 2 — Brand Knowledge Base

- Frontend: @tanstack/react-query, file upload UI components
- Backend: multer, pdf-parse, mammoth, zod
- AI service: pypdf, python-docx, python-pptx, openai, pgvector
- External: Supabase Storage, OpenAI

### Phase 3 — Draft intake

- Frontend: @tanstack/react-query, react-hook-form, drag-and-drop upload library
- Backend: multer, zod, Supabase Storage SDK
- AI service: file extraction libraries

### Phase 4 — Brand Check review engine

- Frontend: highlighting and diff UI libraries
- Backend: zod; optionally bullmq and ioredis
- AI service: openai, pgvector; optionally langchain and redis

### Phase 5 — Review and approval

- Frontend: timeline and comments UI components
- Backend: zod, resend

### Phase 6 — Insights and polish

- Frontend: recharts, skeleton loaders
- Backend: Prisma aggregation queries

### Phase 7 — Deployment

- Frontend: Vite production build
- Backend: production Node.js process configuration
- AI service: Uvicorn production configuration

## Architecture

React frontend → Node.js + Express API → Supabase PostgreSQL and Storage. The backend calls the Python FastAPI service for AI-heavy work; the AI service calls OpenAI. Findings are saved in Supabase and shown in the React review workspace.

Architecture rules:

1. The frontend calls only the Node.js backend and never calls OpenAI directly.
2. The backend calls the Python AI service for AI-heavy work.
3. Workspace data is isolated by `workspace_id`.
4. Each AI finding has an explanation and source reference and links to a brand rule, approved fact, or asset.
5. AI outputs use structured JSON. Do not train a custom model in the MVP.

## Development phases

0. Project setup: monorepo, frontend, backend, AI service, Supabase connection, health checks, docs, CI.
1. Authentication and workspaces: signup, login, roles, invitations, role-based dashboards.
2. Brand Knowledge Base: document upload, extraction, editable rules and approved facts.
3. Draft intake: creator dashboard, text and file intake, versioning.
4. Review engine: rule checks, retrieval, AI review, explainable findings and suggestions.
5. Review and approval: queue, comments, decisions, history and audit trail.
6. Insights and polish: insights, empty/loading/error states, testing.
7. Deployment: hosting, Supabase, environment setup, end-to-end validation.

## Phase 1 scope — Authentication and workspaces

- Database schema updated with `User`, `Workspace`, `WorkspaceMember`, and `Invitation` models using roles `ADMIN`, `CREATOR`, and `REVIEWER`.
- Backend authentication APIs:
  - `POST /api/auth/signup`: Validates input, hashes password, creates user + workspace + admin member in a transaction, sets httpOnly refresh cookie, returns JWT accessToken and user/workspace details.
  - `POST /api/auth/login`: Authenticates email/password, issues access token & refresh cookie.
  - `POST /api/auth/logout`: Clears httpOnly refresh cookie.
  - `POST /api/auth/refresh`: Verifies refresh cookie and issues a new access token.
  - `GET /api/auth/me`: Authenticated endpoint returning user profile and workspace memberships.
- Backend workspace and invitation APIs:
  - `POST /api/workspaces`: Creates a new workspace and sets the creator as `ADMIN`.
  - `GET /api/workspaces/current`: Retrieves the active workspace, membership role, and member count.
  - `GET /api/workspaces/members`: Retrieves members of the workspace and pending invitations (for admins).
  - `POST /api/workspaces/invite`: Admin-only endpoint to invite an email with role `CREATOR` or `REVIEWER`, generates a 7-day secure token, prevents duplicates, and sends email via Resend.
  - `GET /api/workspaces/invitations/:token`: Public endpoint to inspect invitation details (workspace, role, expiration).
  - `POST /api/workspaces/invitations/accept`: Authenticated endpoint verifying that the logged-in user matches the invited email, adding the user to the workspace with the invited role and marking invitation `ACCEPTED`.
  - `PATCH /api/workspaces/members/:id/role`: Admin-only endpoint to update a workspace member's role (`ADMIN`, `CREATOR`, `REVIEWER`).
- Frontend React authentication:
  - React Hook Form + Zod schema validation for Signup (`name`, `email`, `password`, `confirmPassword`) and Login (`email`, `password`).
  - `AuthContext` managing authenticated state, in-memory access token, current workspace, automatic background token refresh, and toast notifications via `react-hot-toast`.
  - `ProtectedRoute` wrapper guarding routes and supporting role-based access.
  - Automatic redirect to `/dashboard/admin` upon signup and `/dashboard` upon login.
  - Dynamic Header with user profile badge, workspace name, role pill, and logout action.

- Role-based dashboards:
  - `AdminDashboard`: Displays workspace member list with live role switching, pending invitation queue, and placeholders for Phase 2 (Knowledge Base) and Phase 4/5 (Review & Audit).
  - `CreatorDashboard`: Displays welcome summary with creator role badge and "My Drafts" placeholder for Phase 3.
  - `ReviewerDashboard`: Displays review queue metrics and "Review Queue" placeholder for Phase 5.

- Invitation UI:
  - `InviteMemberPage` (`/invite`): Admin-only invitation form with email input, role selector (`CREATOR` / `REVIEWER`), immediate duplicate prevention, and invitation sent confirmation with quick-copy link.
  - `AcceptInvitePage` (`/invite/accept`): Token-aware acceptance page that verifies invitation status, prompts unauthenticated guests to sign up or log in with the invited email, validates email matching, accepts membership into the workspace with the invited role, and redirects to the appropriate dashboard.

## Coding standards

- Use JavaScript in frontend and backend; do not add TypeScript there.
- Use Python type hints in ai-service.
- Keep components and modules focused.
- Keep configuration in environment variables; never commit secrets.
- Use Zod for backend request validation and Pydantic for Python validation.
- Use conventional commits.
- Add tests for important business logic.
- Update this file when APIs, schema, or AI behavior change.

## Current phase instructions

Current phase: Phase 1 — Authentication and workspaces. Implemented Steps 1-6 (database schema, auth APIs, workspace APIs, frontend auth, role-based dashboards, and invitation UI). Do not implement brand document upload, Brand Knowledge Base, drafts, file upload, review engine, findings, approval workflow, or OpenAI feature calls.
