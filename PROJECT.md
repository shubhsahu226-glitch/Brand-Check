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

## Phase 0 scope

Create the frontend shell with home, login and signup routes; an Express server with database-aware health check; a minimal Prisma User model; and a FastAPI service health check that detects OpenAI key configuration. Add example environment files, CI, and setup documentation. No authentication or product workflow is implemented in this phase.

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

Current phase: Phase 0 — Project setup. Do not implement authentication, workspace creation, invitations, brand uploads, Brand Knowledge Base, drafts, file upload, review, findings, approvals, or OpenAI feature calls unless specifically requested.
