# BrandCheck

BrandCheck helps teams review content against approved brand guidance before publication. AI may explain issues and suggest edits; people make all final decisions. The product must never silently rewrite or automatically publish content.

## Core flow

Admin adds brand guidance → Creator drafts and checks content → Creator addresses findings → Reviewer approves or requests changes → BrandCheck saves the approved version and audit trail.

## Stack

- Frontend: React, Vite, JavaScript, Tailwind CSS
- Backend: Node.js, Express, JavaScript, Prisma
- Database: Supabase PostgreSQL
- AI service: Python, FastAPI, OpenAI SDK

Frontend and backend use JavaScript, not TypeScript. Current phase is Phase 0: service setup and health checks. Login/signup are visual placeholders; product workflows are not implemented.

## Repository

```text
brand-check/
├── frontend/                         # React + Vite browser application
│   ├── .env.example                  # Frontend API URL example
│   ├── index.html                    # Vite page entry point
│   ├── package.json                  # Frontend dependencies and npm scripts
│   ├── postcss.config.js             # PostCSS and Tailwind processing setup
│   ├── tailwind.config.js            # Tailwind content paths and theme
│   ├── vite.config.js                # Vite configuration and React plugin
│   └── src/
│       ├── App.jsx                   # Header, sidebar, home, login/signup routes
│       ├── main.jsx                  # React entry point and router setup
│       ├── styles.css                # Global styles and Tailwind directives
│       └── lib/
│           └── api.js                # Axios instance using VITE_API_BASE_URL
├── backend/                          # Node.js + Express API
│   ├── .env.example                  # Backend and database setting examples
│   ├── package.json                  # Backend dependencies and npm scripts
│   ├── prisma/
│   │   └── schema.prisma             # PostgreSQL datasource and minimal User model
│   └── src/
│       ├── app.js                    # Express middleware, health endpoint, error handling
│       ├── server.js                 # Loads environment and starts the HTTP server
│       └── lib/
│           └── prisma.js             # Shared Prisma client
├── ai-service/                       # Python + FastAPI service
│   ├── .env.example                  # OpenAI setting examples
│   ├── requirements.txt              # Pinned Python dependencies
│   └── app/
│       ├── __init__.py               # Marks app as a Python package
│       └── main.py                   # FastAPI app, CORS, OpenAI config, health endpoint
├── .github/
│   └── workflows/
│       └── ci.yml                    # Dependency install, frontend build, Python syntax check
├── .gitignore                       # Excludes secrets, dependencies, and generated files
├── README.md                        # Project overview and local startup guide
└── PROJECT.md                       # Product requirements, architecture, phases, and rules
```

## Start locally

Requirements: Git, Node.js 20+, Python 3.10+, and a Supabase PostgreSQL URL for a connected backend health check. Clone the repository, then run each service in a separate terminal from the repository root.

### 1. Backend — `http://localhost:5000`

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `backend/.env`, then run:

```powershell
npx prisma generate
npx prisma db push
npm run dev
```

Health check: `http://localhost:5000/api/health`.

### 2. AI service — `http://localhost:8000`

Create and activate a virtual environment before installing Python dependencies:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Optionally set `OPENAI_API_KEY` in `ai-service/.env`, then start:

```powershell
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/ai/health`. The key is optional in Phase 0; no OpenAI calls are made. For macOS/Linux, activate with `source .venv/bin/activate` and copy the env file with `cp .env.example .env`.

### 3. Frontend — `http://localhost:5173`

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The Axios base URL comes from `VITE_API_BASE_URL` in `frontend/.env` (default: `http://localhost:5000/api`). For macOS/Linux, use `cp .env.example .env`.

## Environment files

Copy each service's `.env.example` to `.env` and add local credentials. `.env` files are ignored by Git; never commit real secrets.

## AI use disclosure

AI is intended to provide explainable findings and suggestions for human review. Development may also use AI assistance; maintainers review and own the code.
