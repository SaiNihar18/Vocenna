# Vocenna - Intelligent Voice Collaboration Platform

Vocenna is an intelligent voice collaboration platform enabling multilingual teams to join virtual voice rooms with real-time live transcription, translation, AI meeting summaries, RAG conversation memory, voice commands, and emotion analysis.

---

## 🏗️ Architecture & Technology Stack

- **Backend Framework:** Python 3.11+ / FastAPI (Uvicorn)
- **Database:** PostgreSQL 16 with `pgvector` extension for vector embeddings & RAG
- **ORM & Migrations:** SQLAlchemy 2.0 (Async) + Alembic
- **Cache & Real-time State:** Redis 7
- **Task Queue:** Celery with Redis broker for asynchronous AI processing
- **Speech AI:** `faster-whisper` (Abstracted behind STTService interface)
- **NLP / LLM AI:** Ollama / Hugging Face / Cloud API (Abstracted behind LLMService interface)
- **Authentication:** JWT (PyJWT) + OAuth2 Password Flow
- **Containerization:** Docker & Docker Compose (Multi-stage production build)

---

## 🚀 Quickstart - Phase 0 Setup

### 1. Repository Initialization
Initialize Git and commit the initial setup:

```bash
git init
git add .
git commit -m "feat: phase 0 - project structure, docker setup, fastAPI app & health checks"
git branch -M main
git remote add origin https://github.com/SaiNihar18/Vocenna.git
```

### 2. Environment Configuration
Verify `.env` settings (auto-created from `.env.example`):
```bash
cp .env.example .env
```

### 3. Spin Up Docker Containers
Run all backend infrastructure (PostgreSQL with pgvector, Redis, FastAPI App, Celery Worker):

```bash
docker compose up --build
```

### 4. Health Check Verification
Verify that all services are operational by checking the health endpoint:

- **Root Health:** [http://localhost:8000/health](http://localhost:8000/health)
- **Component Health & Diagnostics:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure

```
vocenna/
├── backend/
│   ├── app/
│   │   ├── api/          # REST endpoints (v1 routes)
│   │   ├── core/         # config, db (pgvector), redis, celery, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic v2 schemas
│   │   ├── services/     # Abstracted AI/Speech interfaces & implementations
│   │   ├── websocket/    # WS handlers for audio streaming & chat
│   │   └── utils/        # Shared helper utilities
│   ├── alembic/          # DB migration scripts
│   ├── tests/            # Pytest test suite
│   ├── Dockerfile        # Production multi-stage build
│   └── requirements.txt  # Core dependencies
├── docker-compose.yml    # Postgres (w/ pgvector), Redis, App, Celery worker
├── README.md
└── .env.example
```

---

## 🔄 Phase Roadmap

- [x] **Phase 0:** Project & Git Setup, Docker Compose, FastAPI foundation, `/health` endpoint.
- [x] **Phase 1:** Core Foundation & Auth (DB models, JWT Auth, Room CRUD, Swagger UI).
- [x] **Phase 2:** WebSocket Real-time Infrastructure (WS endpoints, room controls, text chat).
- [x] **Phase 3:** Speech Processing Service (faster-whisper STT, transcript persistence).
- [ ] **Phase 4:** AI Intelligence Layer (LLMService, translation, action items, mood analysis).
- [ ] **Phase 5:** Conversation Memory & Voice Commands (pgvector RAG & voice command parser).
- [ ] **Phase 6:** Docker & Local Deployment Readiness (Makefile, production optimizations).
- [ ] **Phase 7:** Frontend Integration Preparation (API specs & CORS configuration).
