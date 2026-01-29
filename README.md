# 🛡️ Aegis-G: Cognitive Shield Command Center - Full-Stack Template

A production-ready template for National Security Defense against AI-driven Malign Information Operations.

## 🚨 For The Hackathon Team - Read This First!

This architecture is designed to handle High-Volume Data (Social Feeds) and Deep Forensics. Here is what is built-in vs. what you need to simulate:

### ✅ What's Real (Production-Ready)

| Component | Description |
| :--- | :--- |
| Detection Engine | Real-time Gemini 1.5 Flash pipeline scanning text streams. |
| Graph Intelligence | Neo4j integration to store and query actor relationships. |
| Forensic Analysis | Gemini 1.5 Pro + Vector Embeddings for attribution. |
| Auth System | RBAC (Analyst vs. Commander) via Keycloak. |
| API Architecture | Async FastAPI implementation to handle data streams. |

### 🚧 What's Simulated (For Demo/MVP)

| Component | Action Required |
| :--- | :--- |
| Social Feeds | `scripts/mock_stream.py` generates fake tweets/posts. |
| Blockchain | We use a local SHA-256 hash ledger in DB instead of a full Ethereum node. |
| Fed. Sharing | Mocked API endpoints simulating connection to "Allied Nations". |

## ✨ Core Features

- **Sentinel Engine**: Real-time stream processing using Gemini 1.5 Flash to score "Artificiality".

- **Graph Viz**: Interactive force-directed graphs in Next.js showing bot clusters.

- **Cognitive Forensics**: Automated "Deep Dive" reports on suspicious content using Gemini 1.5 Pro.

- **Secure Sharing**: PII-redacted intelligence reports ready for cross-border transfer.

## 💻 Technology Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| Backend | Python 3.11 + FastAPI | High-performance Async API |
| Frontend | Next.js 15 + React 19 | Dashboard & Graph Visualization |
| AI Brain | Gemini 1.5 Flash & Pro | Detection & Reasoning |
| Graph DB | Neo4j Community | Relationship mapping (Bot swarms) |
| Vector DB | pgvector (PostgreSQL) | Storing threat embeddings |
| Identity | Keycloak 24 | Military-grade access control |

## 📂 Project Structure

```
.
├── app/                          # FastAPI Backend
│   ├── main.py                   # API Entry point
│   ├── config.py                 # Env variables
│   ├── security.py               # Token validation
│   ├── models/                   # SQLAlchemy Models (Postgres)
│   │   ├── threat.py             # Threat Reports
│   │   └── ledger.py             # Blockchain Audit Trail
│   ├── schemas/                  # Pydantic Schemas
│   │   ├── detection.py          # Input/Output schemas for scanning
│   │   └── graph.py              # Node/Edge schemas
│   ├── routers/
│   │   ├── detection.py          # /api/scan (Real-time filter)
│   │   ├── forensics.py          # /api/analyze (Deep dive)
│   │   ├── graph.py              # /api/network (Neo4j queries)
│   │   └── sharing.py            # /api/federated (Secure exchange)
│   ├── services/
│   │   ├── gemini/               # AI Service Layer
│   │   │   ├── client.py         # Google GenAI SDK wrapper
│   │   │   ├── prompts.py        # System Instructions (Flash/Pro)
│   │   │   └── privacy.py        # Redaction logic
│   │   ├── graph/
│   │   │   └── neo4j.py          # Cypher query builder
│   │   └── vector/
│   │       └── embeddings.py     # Text-to-Vector logic
│   └── core/
│       └── blockchain.py         # Hashing & verification logic
│
├── frontend/                     # Next.js Frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/        # Main Threat Heatmap
│       │   ├── forensics/[id]/   # Deep Analysis View
│       │   ├── network/          # Graph Visualization Page
│       │   └── sharing/          # Intel Exchange Portal
│       ├── components/
│       │   ├── visual/
│       │   │   ├── ThreatMap.tsx # Geospatial heatmap
│       │   │   └── GraphViz.tsx  # React-Force-Graph component
│       │   ├── reports/
│       │   │   └── AnalysisCard.tsx
│       ├── lib/
│       │   └── gemini-stream.ts  # Frontend stream handler
│       └── context/
│           └── ThreatContext.tsx # Global threat state
│
├── data/                         # Mock Data Generators
│   ├── social_feed.json          # Fake Twitter/Telegram dump
│   └── known_actors.json         # Threat actor signatures
├── deployment/
│   └── docker-compose.yml        # Runs App + Postgres + Neo4j
├── Makefile                      # Quick start commands
└── .env.example                  # Config template
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (Required for Neo4j & Postgres)
- Google AI Studio Key (For Gemini Models)

### Step 1: Clone & Setup

```bash
git clone https://github.com/your-org/aegis-g.git
cd aegis-g
cp .env.example .env
```

### Step 2: Configure Environment (.env)

```ini
# Gemini API Configuration
GEMINI_API_KEY=your_google_key_here
GEMINI_FLASH_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro

# Database Configuration
DATABASE_URL=postgresql://user:pass@db:5432/aegis
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```

### Step 3: Start the Defense Grid

```bash
make up
```

Starts Backend (8000), Frontend (3000), Postgres (5432), Neo4j (7474), Keycloak (8080)

### Step 4: Access the Command Center

| Service | URL | Role |
| :--- | :--- | :--- |
| 🛡️ Command Dashboard | http://localhost:3000 | Analyst View |
| 🕵️ Forensic API | http://localhost:8000/docs | Backend Swagger |
| 🕸️ Graph Explorer | http://localhost:7474 | Neo4j Browser |

## 🤖 AI Modules (Under the Hood)

### 1. Sentinel Detection (`/routers/detection.py`)

- Uses **Gemini 1.5 Flash**.
- **Input**: Raw text string.
- **Process**: Evaluates perplexity, burstiness, and repetitive n-grams.
- **Latency**: < 400ms.

### 2. Forensic Deep Dive (`/routers/forensics.py`)

- Uses **Gemini 1.5 Pro**.
- **Input**: Flagged content + Image (if any).
- **Process**:
  - Checks image-text consistency.
  - Extracts entities (Who/Where).
  - Suggests attribution based on style.

### 3. Federated Redaction (`/services/gemini/privacy.py`)

- Uses **Context Caching**.
- **Process**: Loads privacy laws into context. Rewrites threat reports to remove names/PII before hashing to the ledger.

## 🛠️ Make Commands

```bash
make up           # Start all services (Defense Mode)
make down         # Stop services
make mock-stream  # 🚨 IMPORTANT: Starts injecting fake threats into the system
make clean-db     # Wipes the graph and SQL db
make test-ai      # Runs a quick check on Gemini API connectivity
```

## 📊 Database Schemas

### PostgreSQL (Metadata)

- **Threats**: `id`, `content_hash`, `risk_score`, `source_platform`, `timestamp`
- **Reports**: `id`, `threat_id`, `analyst_notes`, `gemini_summary`, `shared_ledger_hash`

### Neo4j (Graph)

- **Nodes**: `User`, `Post`, `Narrative`, `IP_Address`
- **Relationships**: `(User)-[:POSTED]->(Post)`, `(Post)-[:SIMILAR_TO]->(Post)`, `(User)-[:INTERACTED_WITH]->(User)`

## ⚠️ Troubleshooting

### Gemini Rate Limits
If `make mock-stream` fails with 429 errors, reduce the speed in `scripts/mock_stream.py` or switch to a paid Vertex AI endpoint.

### Graph Visualization Empty
Ensure you ran `make mock-stream`. The graph needs data points to draw connections.

### Docker Memory
Neo4j and LLMs are heavy. Ensure Docker has at least 4GB RAM allocated.
