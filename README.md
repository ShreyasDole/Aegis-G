# 🛡️ Aegis-G: AI-Powered Cybersecurity Command Center

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

A production-ready, enterprise-grade cybersecurity platform combining threat intelligence, graph analysis, blockchain audit trails, and AI-powered insights for national security operations.

---

## 🚨 Quick Start - Get Running in 5 Minutes

```bash
# 1. Clone and setup
git clone <your-repo>
cd CyberSec
cp env.example .env

# 2. Add your Gemini API key to .env (optional but recommended)
# GEMINI_API_KEY=your-key-here

# 3. Start everything
make up

# 4. Access the platform
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

That's it! 🎉

---

## ✨ Core Features

### 🔐 **Enterprise Authentication & Authorization**
- **JWT Authentication** with secure token management
- **JSON-based Authorization Engine** (`authz.map.json`) for fine-grained RBAC/ABAC
- **User Approval Workflow** with admin review process
- **Role-based Access Control** (Admin, Analyst, Viewer)
- **Automatic permission checking** on all API endpoints

### 📊 **Comprehensive Audit Logging**
- **Automatic request logging** (method, endpoint, user, response time)
- **Business event tracking** (user actions, security events)
- **Sensitive data masking** in logs
- **CSV export** for compliance reporting
- **Security event filtering** (failed auth, permission denials)

### 🤖 **AI-Powered Features (via Gemini)**
- **AI Policies**: Translate natural language rules to executable DSL
  - Example: "Flag any login from China" → `IF contains(geo, "China") THEN flag("high")`
- **AI Insights**: Proactive threat analysis and recommendations
  - Pattern detection, anomaly identification, risk prioritization
- **AI Manager**: Global chatbot with context awareness and tool execution
  - Keyboard shortcut: `⌘M` / `Ctrl+M`

### 🕸️ **Graph-Based Threat Intelligence**
- **Neo4j integration** for network relationship mapping
- **Threat actor correlation** and campaign tracking
- **Attack pattern visualization**

### 🔗 **Blockchain Audit Trail**
- **Immutable ledger** for threat intelligence sharing
- **Cryptographic verification** of shared reports
- **Inter-agency collaboration** with privacy preservation

### ⚡ **Performance & Scale**
- **Redis caching layer** for high-performance queries
- **File upload system** (local or Google Cloud Storage)
- **Database migrations** with Alembic
- **Production-ready Docker** with multi-stage builds

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│              (React, TypeScript, Tailwind CSS)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                         │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Auth Engine  │ Authz Engine │  Audit Middleware        │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ AI Services  │ Graph Query  │  Blockchain Ledger       │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└────────────────┬────────────────┬───────────────┬───────────┘
                 │                │               │
        ┌────────▼──────┐  ┌─────▼──────┐  ┌────▼─────┐
        │  PostgreSQL   │  │   Neo4j    │  │  Redis   │
        │  (Relational) │  │  (Graph)   │  │ (Cache)  │
        └───────────────┘  └────────────┘  └──────────┘
```

---

## 📂 Project Structure

```
CyberSec/
├── app/                          # FastAPI Backend
│   ├── main.py                   # Application entry point
│   ├── authz.py                  # Authorization engine ⭐
│   ├── authz.map.json            # Permission rules ⭐
│   ├── public.map.json           # Public endpoints
│   ├── auth/                     # JWT authentication
│   ├── middleware/               # Request middleware
│   │   ├── authz.py              # Auto permission checking ⭐
│   │   └── audit.py              # Auto request logging ⭐
│   ├── models/                   # SQLAlchemy models
│   │   ├── user.py               # User with approval workflow ⭐
│   │   ├── audit.py              # Audit log model ⭐
│   │   ├── ai.py                 # AI policies & insights ⭐
│   │   ├── threat.py             # Threat intelligence
│   │   └── ledger.py             # Blockchain ledger
│   ├── routers/                  # API endpoints
│   │   ├── auth.py               # Login, register, refresh
│   │   ├── admin.py              # User management, audit logs ⭐
│   │   ├── ai.py                 # AI policies, insights, chat ⭐
│   │   └── system.py             # Health checks
│   ├── services/                 # Business logic
│   │   ├── audit.py              # Audit service ⭐
│   │   ├── cache.py              # Redis caching ⭐
│   │   ├── storage.py            # File uploads ⭐
│   │   └── ai/                   # AI services ⭐
│   │       ├── policy.py         # Policy translation
│   │       ├── insights.py       # Insight generation
│   │       └── chat.py           # AI Manager chatbot
│   ├── schemas/                  # Pydantic schemas
│   │   └── ai.py                 # AI feature schemas ⭐
│   └── migrations/               # Alembic migrations
│
├── frontend/                     # Next.js Frontend
│   └── src/
│       ├── app/                  # App Router pages
│       ├── components/           # React components
│       └── lib/                  # Utilities
│
├── deployment/                   # Production configs
│   ├── docker-compose.prod.yml   # Production stack
│   ├── Dockerfile.backend.prod   # Multi-stage backend
│   ├── Dockerfile.frontend.prod  # Multi-stage frontend
│   └── nginx/                    # Reverse proxy config
│
├── .github/workflows/            # CI/CD pipelines
│   ├── ci.yml                    # Tests & linting
│   └── deploy.yml                # Deployment
│
├── docker-compose.yml            # Development stack
├── Makefile                      # Dev commands
├── env.example                   # Environment template ⭐
└── README.md                     # This file

⭐ = New enterprise features added
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Required | Purpose |
|------|----------|---------|
| [Docker Desktop](https://www.docker.com/get-started) | ✅ Yes (for Docker) | Runs all services |
| Python 3.11+ | ✅ Yes (for local dev) | Backend runtime |
| Node.js 18+ | ✅ Yes (for local dev) | Frontend runtime |
| `make` | ✅ Yes | Dev commands (built-in on macOS/Linux) |
| [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) | ❌ Optional | For cloud deployment |

### Installation

1. **Clone repository**
```bash
git clone <your-repo-url>
cd CyberSec
```

2. **Create environment file**
```bash
cp env.example .env
```

3. **Configure secrets** (edit `.env`)
```bash
# Required: Generate secret key
python -c "import secrets; print(secrets.token_hex(32))"
# Paste output as: SECRET_KEY=<your-key>

# Recommended: Add Gemini API key for AI features
# Get from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-api-key-here
```

---

## 🏃 Running the Command Center (Local Development)

### Option 1: Using Docker (Recommended for Full Stack)

4. **Start services**
```bash
make up
```

5. **Run migrations**
```bash
make migrate
```

6. **Access the platform**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Redis: localhost:6379

### Option 2: Running Locally with Uvicorn and npm

This method runs the backend and frontend directly on your machine without Docker.

#### Step 1: Install Backend Dependencies

```powershell
# Windows PowerShell
cd "C:\CyberSec Project"
pip install -r requirements.txt
```

```bash
# macOS/Linux
cd CyberSec
pip install -r requirements.txt
```

#### Step 2: Start the Backend Server (FastAPI with Uvicorn)

**Windows PowerShell:**
```powershell
cd "C:\CyberSec Project"
$env:PYTHONPATH="C:\CyberSec Project"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**macOS/Linux:**
```bash
cd CyberSec
export PYTHONPATH=$(pwd)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**What this does:**
- Starts the FastAPI backend server
- Runs on `http://127.0.0.1:8000`
- `--reload` enables auto-reload on code changes
- API documentation available at `http://127.0.0.1:8000/docs`

#### Step 3: Start the Frontend Server (Next.js)

Open a **new terminal window** and run:

**Windows PowerShell:**
```powershell
cd "C:\CyberSec Project\frontend"
npm install  # First time only
npm run dev
```

**macOS/Linux:**
```bash
cd CyberSec/frontend
npm install  # First time only
npm run dev
```

**What this does:**
- Starts the Next.js development server
- Runs on `http://localhost:3000`
- Auto-reloads on code changes
- Frontend will automatically connect to backend at `http://127.0.0.1:8000`

#### Step 4: Access the Command Center

1. **Open your browser** and navigate to: **http://localhost:3000**
2. You will be **redirected to the login page** (`/login`)
3. **Enter your credentials** (or register a new account)
4. After successful login, you'll be redirected to the **Dashboard**

#### Quick Start Script (PowerShell)

For convenience, you can use the provided script:

```powershell
.\start-dev.ps1
```

This script starts both servers and shows their logs in one terminal.

#### Verification

✅ **Backend is running** if you see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

✅ **Frontend is running** if you see:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
✓ Ready in X seconds
```

✅ **Test the connection:**
- Visit: http://127.0.0.1:8000/health (should return `{"status": "healthy"}`)
- Visit: http://127.0.0.1:8000/docs (should show API documentation)
- Visit: http://localhost:3000 (should show login page)

#### Stopping the Servers

- **Backend**: Press `Ctrl+C` in the backend terminal
- **Frontend**: Press `Ctrl+C` in the frontend terminal

---

### Database Setup (For Local Development)

If running locally without Docker, you'll need to set up databases manually:

1. **PostgreSQL**: Install and create database
2. **Neo4j**: Install and start Neo4j service
3. **Redis**: Install and start Redis server

Or use Docker just for databases:
```bash
docker-compose up db neo4j redis
```

Then run backend/frontend locally as described above.

---

## 🔐 Authentication & Authorization

### How It Works

```
1. User logs in → JWT token issued
2. Token included in API requests → Validated by auth middleware
3. Authorization engine checks permissions → authz.map.json rules
4. Request logged → Audit database
5. Response returned
```

### Authorization Rules (`authz.map.json`)

```json
{
  "/api/threats": {
    "GET": ["admin", "analyst", "viewer"],
    "POST": ["admin", "analyst"],
    "DELETE": ["admin"]
  },
  "/api/admin/*": {
    "ANY": ["admin"]
  }
}
```

**Wildcards supported:**
- `*` in path: `/api/admin/*` matches all admin endpoints
- `ANY` method: applies to all HTTP methods
- `["*"]` roles: public access

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **admin** | Full system access | User management, system config, all operations |
| **analyst** | Threat investigation | Create/edit threats, policies, reports |
| **viewer** | Read-only access | View threats, reports, dashboards |

### User Approval Workflow

1. User self-registers → Status: **pending**
2. Admin reviews → `/admin/users`
3. Admin approves/rejects → Status: **approved** or **rejected**
4. Auto-approval for trusted domains (configure `APPROVED_EMAIL_DOMAINS` in `.env`)

---

## 📊 Audit Logging

### What's Logged Automatically

✅ Every API request with:
- HTTP method, endpoint, query params
- User ID, email, role
- Request/response bodies (sensitive data masked)
- Response status, time taken
- IP address, user agent

✅ Security events:
- Failed authentication attempts
- Permission denials
- User approval/rejection

### Viewing Audit Logs

```bash
# Via API
GET /api/admin/audit?user_email=john@example.com&limit=100

# Via Admin UI (coming soon)
http://localhost:3000/admin/audit

# Export to CSV
GET /api/admin/audit/export
```

### Custom Event Logging

```python
from app.services.audit import audit

await audit.log_user_action(
    action="threat.escalate",
    actor=current_user,
    target_type="threat",
    target_id=123,
    details={"severity": "critical", "reason": "APT detected"},
    db=db
)
```

---

## 🤖 AI Features

### 1. AI Policies

**Translate business rules to executable logic:**

```python
# Natural language input
"Flag any login attempts from China as high risk"

# AI-generated DSL
IF contains(geo_location, "China") AND equals(event_type, "login") 
THEN flag_threat("high")
```

**API Endpoints:**
- `POST /api/ai/policies` - Create policy
- `GET /api/ai/policies` - List policies
- `POST /api/ai/policies/translate` - Preview translation

### 2. AI Insights

**Proactive threat intelligence:**

- Pattern detection in threat data
- Anomaly identification
- Risk prioritization (Critical, Warning, Recommendation)
- Suggested actions with impact estimates

**API Endpoints:**
- `GET /api/ai/insights` - View insights
- `POST /api/ai/insights/generate` - Generate new insights
- `POST /api/ai/insights/{id}/dismiss` - Dismiss insight

### 3. AI Manager (Chatbot)

**Context-aware assistant:**

```javascript
// Frontend usage
POST /api/ai/chat
{
  "message": "Show me high-risk threats from last 24 hours",
  "context": {
    "page": "dashboard",
    "selected_items": [1, 2, 3]
  }
}
```

**Features:**
- Understands current page context
- Tool execution (search threats, generate reports)
- Quick action buttons
- Conversation memory

---

## 🛠️ Make Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make up-base` | Start base scaffold only (no Neo4j) |
| `make down` | Stop all services |
| `make restart` | Restart services |
| `make logs` | View all logs |
| `make logs-be` | View backend logs only |
| `make logs-fe` | View frontend logs only |
| **Database** ||
| `make migrate` | Run pending migrations |
| `make migration MSG='description'` | Create new migration |
| `make clean-db` | ⚠️  Clear all data |
| **Testing** ||
| `make test` | Run all tests |
| `make test-cov` | Run tests with coverage |
| `make test-unit` | Run unit tests only |
| `make test-auth` | Run auth tests only |
| **Code Quality** ||
| `make lint` | Run linter |
| `make lint-fix` | Auto-fix linting issues |
| `make fmt` | Format code (black + isort) |
| `make security` | Security scan (bandit + safety) |
| **Production** ||
| `make up-prod` | Start production stack |
| `make build-prod` | Build production images |

---

## 📖 API Documentation

### Interactive Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| **Authentication** ||||
| `/api/auth/register` | POST | Register new user | Public |
| `/api/auth/login` | POST | Login (get JWT token) | Public |
| `/api/auth/me` | GET | Get current user | Required |
| **Admin** ||||
| `/api/admin/users` | GET | List all users | Admin |
| `/api/admin/users/pending` | GET | Get pending users | Admin |
| `/api/admin/users/{id}/approve` | POST | Approve/reject user | Admin |
| `/api/admin/audit` | GET | Query audit logs | Admin |
| `/api/admin/audit/export` | GET | Export logs to CSV | Admin |
| `/api/admin/authz/rules` | GET | Get authorization rules | Admin |
| **AI** ||||
| `/api/ai/policies` | GET/POST | Manage policies | Analyst+ |
| `/api/ai/policies/translate` | POST | Translate to DSL | Analyst+ |
| `/api/ai/insights` | GET | View insights | Analyst+ |
| `/api/ai/insights/generate` | POST | Generate insights | Analyst+ |
| `/api/ai/chat` | POST | Chat with AI Manager | All |

---

## 🗄️ Database Migrations

Migrations run automatically on startup. Manual commands:

```bash
# View migration status
make migrate-history

# Create new migration
make migration MSG='add_threat_categories'

# Apply migrations
make migrate

# Rollback one migration
make migrate-down
```

### Migration Chain

```
001_initial_schema (users, threats, reports, ledger)
  ↓
002_user_approval_and_audit (status field, audit_logs table)
  ↓
[Your migrations here]
```

---

## 🔧 Configuration

### Environment Variables

Edit `.env` file:

```bash
# ============================================
# Core Settings
# ============================================
APP_ENV=development              # development or production
LOG_LEVEL=INFO                   # DEBUG, INFO, WARNING, ERROR
SECRET_KEY=<generate-32-byte>    # REQUIRED: JWT signing key

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://user:password@db:5432/aegis_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=aegis_db

# ============================================
# Neo4j (Graph Database)
# ============================================
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# ============================================
# Redis (Cache)
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=                  # Optional
REDIS_DB=0

# ============================================
# AI / Gemini
# ============================================
GEMINI_API_KEY=                  # Get from https://aistudio.google.com/apikey
GEMINI_FLASH_MODEL=gemini-2.5-flash

# ============================================
# Storage
# ============================================
STORAGE_BACKEND=local            # local or gcs
LOCAL_STORAGE_PATH=storage
GCS_BUCKET_NAME=                 # If using Google Cloud Storage

# ============================================
# User Approval
# ============================================
APPROVED_EMAIL_DOMAINS=yourcompany.com,partner.com  # Comma-separated
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
make test

# With coverage
make test-cov

# Specific test file
pytest tests/test_auth.py -v

# With markers
pytest -m unit      # Unit tests only
pytest -m auth      # Auth tests only
```

### Test Structure

```
tests/
├── conftest.py              # Fixtures
├── test_api_health.py       # Health check tests
├── test_auth.py             # Authentication tests
└── test_admin.py            # Admin endpoint tests
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Generate strong `SECRET_KEY`
- [ ] Set `APP_ENV=production`
- [ ] Configure production database
- [ ] Add `GEMINI_API_KEY` for AI features
- [ ] Set `CORS_ORIGINS` to your frontend URL
- [ ] Configure SSL/TLS certificates (nginx)
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure backup strategy
- [ ] Review authorization rules (`authz.map.json`)

### Docker Production

```bash
# Build production images
make build-prod

# Start production stack
make up-prod

# Services include:
# - Backend (Gunicorn + Uvicorn workers)
# - Frontend (Next.js standalone)
# - PostgreSQL
# - Neo4j
# - Redis
# - Nginx (reverse proxy)
```

### CI/CD

GitHub Actions workflows included:

- **CI Pipeline** (`.github/workflows/ci.yml`)
  - Run tests on push/PR
  - Lint & format checks
  - Security scanning
  - Docker build verification

- **Deploy Pipeline** (`.github/workflows/deploy.yml`)
  - Build & push Docker images
  - Deploy on release tags
  - Supports K8s, Docker Swarm, AWS ECS

---

## 📚 Additional Documentation

- **[Audit System Guide](docs/Audit-System-Guide.md)** - Comprehensive audit logging
- **[Authorization Guide](docs/Authorization-Guide.md)** - RBAC/ABAC configuration
- **[AI Features Guide](docs/AI-Features-Guide.md)** - Policies, insights, chat

---

## 🤝 Contributing

```bash
# Install development dependencies
make install-dev

# Format code before committing
make fmt

# Run linter
make lint

# Run tests
make test
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🆘 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| "Port already in use" | Stop conflicting services or change ports in `.env` |
| "OAuth error on login" | Clear cookies or use incognito mode |
| "AI features not working" | Check `GEMINI_API_KEY` is set in `.env` |
| "Permission denied" | Check your user role and `authz.map.json` rules |
| "Redis connection failed" | Ensure Redis container is running: `docker ps` |

### Logs

```bash
# View all logs
make logs

# Backend only
make logs-be

# Frontend only
make logs-fe

# Specific service
docker logs aegis_backend -f
```

---

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Security**: security@your-domain.com

---

**Built with ❤️ for National Security Operations**
