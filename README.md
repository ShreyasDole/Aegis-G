# 🛡️ Aegis-G: AI-Powered Cybersecurity Command Center

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-orange.svg)](https://aistudio.google.com/)
[![Neo4j](https://img.shields.io/badge/Neo4j-GDS-lightblue.svg)](https://neo4j.com/)

A **production-ready, enterprise-grade** cybersecurity platform that defends against AI-driven Malign Information Operations (MIO). Combines a **Multi-Agent Defense Pipeline**, graph-based threat intelligence, blockchain audit trails, and Gemini AI for national security operations.

---

## 📋 SIH Problem Statement (Selected)

**Mitigating National Security Risks Posed by Large Language Models (LLMs) in AI-Driven Malign Information Operations**

### Background

Large Language Models (LLMs) — such as OpenAI's GPT series, Anthropic's Claude, Google's Gemini, and Perplexity AI — have transformed digital ecosystems by enabling rapid generation of human-like, contextually coherent, and scalable textual content. These advancements power breakthroughs in research, automation, education, and communication. However, this technological democratization introduces critical national security vulnerabilities. Malicious actors — including state-sponsored cyber units, extremist organizations, and sophisticated criminal networks — are now exploiting LLMs to:

- Generate highly personalized phishing emails with improved linguistic fluency and contextual relevance.
- Automate large-scale disinformation campaigns to manipulate public sentiment and undermine democratic institutions.
- Fabricate synthetic extremist propaganda to radicalize individuals and recruit operatives.
- Engage in influence operations at a scale and speed that traditional human-led misinformation campaigns could not achieve.

The ability to create plausible, non-repetitive, and linguistically diverse narratives significantly complicates detection, attribution, and takedown efforts by national security and cyber defense teams.

### Detailed Description

This problem requires the design and implementation of a multi-layered technical and policy framework to detect, analyze, and mitigate the misuse of LLMs in hostile information operations. The framework must incorporate cutting-edge AI, machine learning, and cyber defense methodologies.

**Key technical requirements include:**

1. **Real-Time AI-Generated Content Detection**
   - Deploy advanced transformer-based classifiers (e.g., RoBERTa, T5, or GPT detectors) trained on large-scale, labeled datasets of AI-generated vs. human-generated content.
   - Utilize stylometric and semantic feature extraction to identify LLM-specific language patterns, entropy levels, and token probability distributions.
   - Implement multi-modal detection by analyzing text, metadata, and social graph propagation patterns simultaneously.

2. **Attribution and Forensics**
   - Build forensic watermarking and fingerprinting techniques to tag, trace, and verify LLM outputs, leveraging solutions like OpenAI watermarking APIs or cryptographic hashes.
   - Use reverse engineering and stylometric analysis to attribute content to specific model families or platforms.

3. **Graph-Based Threat Intelligence and Monitoring**
   - Integrate graph neural networks (GNNs) to map disinformation clusters, actor coordination patterns, and propagation chains across platforms.
   - Develop APIs for integration with threat intelligence platforms and security information and event management (SIEM) tools for real-time correlation.

4. **Cross-Border Intelligence Sharing**
   - Create a federated detection and intelligence-sharing protocol that enables secure data exchange between allied nations without violating data localization and privacy laws.
   - Utilize standardized APIs and blockchain-based audit trails for tamper-proof information sharing.

5. **Automated Risk and Threat Assessment**
   - Build dashboard-driven analytics with real-time risk scoring and visualization layers for national security agencies.
   - Include heatmaps, temporal trend analysis, and predictive modelling for proactive threat anticipation.

6. **Vendor Collaboration and Red-Teaming**
   - Partner with LLM providers to enforce Responsible AI guidelines, such as abuse-limiting guardrails and adversarial testing protocols.
   - Conduct continuous red-team simulations to expose vulnerabilities and strengthen platform defences.

7. **Privacy and Compliance Integration**
   - Embed privacy-preserving techniques, including federated learning and differential privacy, to ensure data security and adherence to legal frameworks.
   - Incorporate transparency reporting and explainable AI (XAI) layers to maintain accountability and public trust.

### Expected Solution (from problem brief)

The envisioned solution is a hybrid platform combining AI-driven analytics, forensic capabilities, and policy integration to support real-time detection, attribution, and response to LLM-driven malign information operations.

**Key deliverables include:**

- A deployable software platform with APIs for integration into national security operations centres (SOCs) and cyber defence networks.
- High-accuracy detection engines with precision and recall exceeding 90% in detecting AI-generated malicious narratives across text and multimedia formats.
- Federated intelligence-sharing systems enabling rapid, coordinated response at a national and international level.
- Comprehensive policy framework outlining governance models, vendor obligations, and oversight mechanisms to balance security with civil liberties.

---

## ✅ Proposed Solution: Aegis-G

Aegis-G is our **proposed solution** to the SIH problem above: a **Cognitive Shield Command Center** — a deployable software platform that implements a multi-layered technical and policy framework to detect, analyze, attribute, and mitigate LLM-driven malign information operations. It is built for integration into national security operations centres (SOCs) and cyber defence networks, with REST APIs, real-time detection, graph-based threat intelligence, and federated intelligence sharing.

---

### What We Have Built

#### 1. Multi-Agent Defense Pipeline (Core Engine)

A **5-stage automated pipeline** runs on every content scan (single or batch). Each stage is implemented and wired in the backend:

| Stage | Name | What It Does |
|-------|------|--------------|
| **Phase 1** | Agent 1 — Forensic Scan | Detects AI-generated content: **cloud mode** uses **Gemini 2.5 Flash** (stylometric/semantic analysis); **local/air-gapped mode** uses an **ONNX-based classifier**. Outputs: `risk_score`, `is_ai_generated`, `detected_model`, `confidence`. |
| **Phase 2** | Agent 2 — Graph Oracle | Creates/updates **User** and **Post** nodes in **Neo4j**; runs **Louvain** community detection (GDS) for botnet/cluster detection; **PageRank** for influence scoring; **Patient Zero** detection for propagation chains. |
| **Phase 3** | Agent 4 — Policy Guardian | Executes **DSL rules** (IF/THEN/AND/OR/NOT) from the database. Actions: `BLOCK_AND_LOG`, `FLAG_THREAT`, `ALERT`, `LOG_ONLY`. Blocked content returns a BLOCKED response and is pushed over **WebSocket** for real-time alerts. |
| **Phase 4** | Trust Layer | High-risk items (e.g. score > 0.7) are written to a **SHA-256 linked blockchain ledger** stored in PostgreSQL. Chain integrity is verifiable via API and Ledger Explorer UI. |
| **Phase 5** | Agent 3 — Intelligence Analyst | Available via **`/api/analyst/fusion`**: fuses forensics + graph data into structured reports with AI reasoning logs; can log to the ledger. |

Trigger: **`POST /api/scan/`** (and **`POST /api/scan/batch`**). Header **`X-Inference-Mode: local`** or **`cloud`** selects detection mode.

#### 2. Backend — APIs and Services

| Component | What We Built |
|-----------|----------------|
| **API layer** | **FastAPI** app with REST endpoints and **WebSocket** (`/ws/blocked-content`). **Swagger** at `/docs`, **ReDoc** at `/redoc`. |
| **Authentication** | **JWT** (access tokens), **bcrypt** password hashing, optional **Microsoft Outlook OAuth** for sign-in. |
| **Authorization** | **RBAC/ABAC** via **`authz.map.json`** (path + method → roles). **Authorization middleware** on every request. **User approval workflow** (pending → approved/rejected) with admin endpoints. |
| **Detection & scan** | **`/api/scan/`**, **`/api/scan/batch`** — trigger the full pipeline. **`/api/threats`** — list/get threats. |
| **Forensics** | **`/api/forensics/{threat_id}`** — deep analysis with **Gemini** (entities, attribution, recommendations). **`/api/forensics/{threat_id}/summary`**. |
| **Graph / network** | **`/api/network/`** — full graph; **`/api/network/campaign/{root_id}`** — campaign lineage; **`/api/network/clusters`** — bot clusters; **`/api/network/pagerank`** — top influencers. **Neo4j** + **GDS** (Louvain, PageRank). |
| **AI policies & insights** | **`/api/ai/policies`** — CRUD; **natural language → DSL** translation. **`/api/ai/insights`** — generate/list insights. **`/api/ai/chat`** — AI Manager chatbot (context-aware). **Policy Guardian** executes DSL in the pipeline. |
| **Sharing & ledger** | **`/api/sharing/ledger`** — paginated ledger; **`/api/sharing/ledger/integrity`** — chain verification; **`/api/sharing/export/stix/{threat_id}`** — **STIX 2.1** bundle; **`/api/sharing/share/{report_id}`** — share with **PII redaction** (Gemini). |
| **Admin & audit** | **`/api/admin/users`**, **`/api/admin/users/pending`**, **`/api/admin/users/{id}/approve`**. **`/api/admin/audit`** — query logs; **`/api/admin/audit/export`** — CSV; **`/api/admin/audit/security`** — security events. **Audit middleware** logs requests, responses, and security events. |
| **System** | **`/health`** — health check; **`/`** — API status and feature list. |
| **Databases** | **PostgreSQL** — users, threats, reports, ledger, audit logs, AI policies/insights, blocked content. **Neo4j** — graph (users, posts, relationships). **Redis** — caching (graceful fallback if unavailable). |

#### 3. Frontend — What We Built

| Page / feature | Route | Description |
|----------------|-------|-------------|
| **Home** | `/` | Landing with system status. |
| **Dashboard** | `/dashboard` | Command center: top threats, 3D threat globe, intelligence brief, Agent 3 fusion trigger. |
| **Threats** | `/threats` | Threat list with filters; link to forensics. |
| **Network** | `/network` | Force-directed graph (nodes/edges), campaign view, cluster and influencer data. |
| **Forensics** | `/forensics/[id]` | Deep-dive per threat: timeline, artifacts, AI analysis. |
| **Sharing** | `/sharing` | Intelligence sharing, STIX export, blockchain audit. |
| **Ledger** | `/ledger` | Blockchain explorer: blocks, hashes, integrity status. |
| **Policy** | `/policy` | AI policy management (create, list, NL → DSL). |
| **Scans** | `/scans` | Live content scan UI (single/batch, mode selection). |
| **Login / Register** | `/login`, `/register` | Auth; register creates pending user (admin approval). |
| **Auth callback** | `/auth/callback` | OAuth callback (e.g. Outlook). |
| **Components** | — | **ThreatMapGlobe** (3D globe), **NetworkGraph** (force-directed), **AIManager** (floating chat, Ctrl+M), **IntelligenceBrief**, **ReasoningTerminal**. |

**Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Axios, Lucide React.

#### 4. Security, Compliance & Deployment

- **Auth:** JWT, optional Outlook OAuth, role-based access (**admin**, **analyst**, **viewer**).
- **Audit:** Every request logged (method, path, user, status, time, IP, user agent); sensitive fields masked; security events (failed auth, denials); CSV export for compliance.
- **Sharing:** PII redaction before share; STIX 2.1 for inter-agency standards; blockchain for tamper-proof audit trail.
- **Deployment:** **Docker** and **docker-compose** (dev and prod); **Alembic** migrations; **Makefile** targets (`make up`, `make migrate`, `make up-prod`, etc.). Production: **Gunicorn**, **Nginx**, multi-stage Dockerfiles.

---

### How This Maps to the SIH Requirements

| SIH Requirement / Deliverable | How Aegis-G Addresses It |
|-------------------------------|---------------------------|
| **1. Real-Time AI-Generated Content Detection** | **Agent 1**: Gemini 2.5 Flash (cloud) or ONNX classifier (local/air-gapped). Risk score, AI-generated flag, confidence. Pipeline runs on every scan; graph phase adds propagation context. |
| **2. Attribution and Forensics** | **Forensics API** with Gemini (entities, attribution, recommendations). **SHA-256 content hashing** and **blockchain ledger** for fingerprinting and traceability. **Agent 3** fusion reports with reasoning logs. |
| **3. Graph-Based Threat Intelligence** | **Neo4j + GDS**: Louvain clusters, PageRank, Patient Zero, campaign lineage. **REST APIs** under `/api/network/*` for SIEM and threat-intel integration. |
| **4. Cross-Border Intelligence Sharing** | **STIX 2.1** export, **blockchain audit trail**, **PII redaction** (Gemini) before share. **`/api/sharing/*`** for secure, auditable exchange. |
| **5. Automated Risk and Threat Assessment** | **Dashboard**, risk scoring, **3D globe**, **network graph**, **AI Insights**. **Policy Guardian** automates block/flag/alert via DSL rules. |
| **6. Vendor Collaboration and Red-Teaming** | **Policy Guardian** guardrails (NL → DSL). **Local vs cloud** inference for red-team and air-gapped testing. Audit and blocked-content tracking for accountability. |
| **7. Privacy and Compliance** | **PII redaction**, full **audit logging** with CSV export, **RBAC**, user-approval workflow. **Explainable** reasoning in Agent 3 and policy decisions. |
| **Deliverable: Deployable platform + APIs** | **FastAPI** REST + **WebSocket**, **/docs** and **/redoc**, **Docker**/compose for SOC deployment. |
| **Deliverable: High-accuracy detection** | **Gemini** + optional **ONNX** detection; pipeline combines forensics, graph, and policy for holistic risk scoring. |
| **Deliverable: Federated intelligence sharing** | **STIX 2.1**, **blockchain ledger**, **sharing APIs** with PII redaction for national/international response. |
| **Deliverable: Policy framework** | **AI policies** (NL → DSL), **Policy Guardian**, **audit trail** for governance and oversight. |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Backend** | Python 3.11+, FastAPI 0.115+, Uvicorn, Gunicorn, Pydantic, SQLAlchemy 2, Alembic |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Axios, Lucide React |
| **AI** | Google Gemini 2.5 Flash (google-genai), ONNX local classifier, MCP (Model Context Protocol) |
| **Databases** | PostgreSQL (primary + pgvector), Neo4j (graph + GDS), Redis (caching) |
| **Standards & Integrations** | STIX 2.1, JWT (python-jose), bcrypt, Microsoft Outlook OAuth (optional) |
| **Infrastructure** | Docker & Docker Compose, Nginx (production), GitHub Actions (CI/CD) |

---

## 🚨 Quick Start — Get Running in 5 Minutes

```bash
# 1. Clone and setup
git clone <your-repo>
cd Aegis-G
cp env.example .env

# 2. Add your Gemini API key to .env (required for cloud AI features)
# GEMINI_API_KEY=your-key-here

# 3. Start everything with Docker
make up

# 4. Run database migrations
make migrate

# 5. Access the platform
# Frontend:  http://localhost:3000
# API Docs:  http://localhost:8000/docs
```

**Default login credentials (auto-seeded on startup):**

| Email | Password | Role |
|-------|----------|------|
| `admin@aegis.com` | `AdminPassword123!` | Admin |
| `test@aegis.com` | `TestPassword123!` | Analyst |

---

## ✨ What's Built

### 🤖 Multi-Agent Defense Pipeline (Core Architecture)

The heart of Aegis-G is a **5-stage automated threat processing pipeline** triggered on every content scan:

```
Incoming Content
      │
      ▼
┌─────────────────────────────────────────────────┐
│  PHASE 1 — Agent 1: Forensic Scan               │
│  • Local Mode:  Offline ONNX classifier         │
│  • Cloud Mode:  Gemini 2.5 Flash detection      │
│  → Outputs: risk_score, is_ai_generated,        │
│             detected_model, confidence           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  PHASE 2 — Agent 2: Graph Oracle                │
│  • Creates/updates User & Post nodes in Neo4j   │
│  • Runs Louvain Community Detection (GDS)       │
│  • Runs PageRank for influence scoring          │
│  • Finds Patient Zero (earliest propagator)     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  PHASE 3 — Agent 4: Policy Guardian             │
│  • Executes active DSL rule from database       │
│  • DSL supports IF/THEN/AND/OR/NOT logic        │
│  • Actions: BLOCK_AND_LOG, FLAG_THREAT, ALERT   │
│  → Blocked content: BLOCKED response + WS push  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  PHASE 4 — Trust Layer: Blockchain Ledger       │
│  • High-risk items (score > 0.7) mined to chain │
│  • SHA-256 linked blocks (immutable trail)      │
│  • Cryptographic chain integrity verification   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
                   Response
```

**Agent 3 (Intelligence Analyst)** is available separately via `/api/analyst/fusion` — synthesizes forensics + graph data into a structured report and logs it to the ledger.

---

### 🔐 Enterprise Authentication & Authorization

- **JWT Authentication** — Secure token issuance and validation
- **JSON-based RBAC/ABAC Engine** (`authz.map.json`) — Fine-grained permission rules with wildcard path and method matching
- **Authorization Middleware** — Automatic permission checking on every request
- **User Approval Workflow** — `pending → approved / rejected` lifecycle with admin review
- **Auto-Approval** — Configure trusted email domains in `.env`
- **Three Roles**: `admin`, `analyst`, `viewer`

### 📊 Comprehensive Audit Logging

- **Automatic request logging** — method, endpoint, user, response time, IP, user agent
- **Sensitive data masking** — passwords, tokens redacted automatically
- **Business event tracking** — user actions, security events
- **Security event filtering** — failed auth, permission denials
- **CSV export** for compliance reporting
- **Query filters** — by user, endpoint, date range

### 🕸️ Graph Oracle (Neo4j GDS)

- **Neo4j Graph Data Science** integration — Louvain community detection, PageRank influence scoring
- **Patient Zero detection** — traces the earliest propagator of specific content
- **Campaign Lineage** — propagation tree from source through botnet to targets
- **Narrative Clustering** — groups posts by content similarity
- **Fallback** — gracefully degrades to standard Cypher if GDS plugin is unavailable

### 🔗 Blockchain Ledger & Intelligence Sharing

- **Immutable SHA-256 linked blockchain** stored in PostgreSQL
- **Chain integrity verification** endpoint
- **STIX 2.1 export** for inter-agency standards-compliant sharing
- **PII redaction** via Gemini before sharing (privacy-preserving)
- **Ledger Explorer UI** — paginated blockchain history viewer at `/ledger`

### 🤖 AI Features (Gemini 2.5 Flash)

| Feature | Description |
|---------|-------------|
| **Content Detection** | Detects AI-generated content via perplexity, burstiness, n-gram analysis |
| **Forensic Analysis** | Deep entity extraction, attribution, image-text consistency |
| **AI Policies** | Natural language → executable DSL rule translation |
| **AI Insights** | Proactive threat pattern detection and risk prioritization |
| **AI Manager Chat** | Context-aware chatbot with tool execution (`Ctrl+M` / `⌘M`) |
| **Intelligence Synthesis** | Agent 3 fuses forensics + graph data into structured reports |

**Air-Gap Support** — Use `X-Inference-Mode: local` header to run entirely offline with the ONNX classifier.

### ⚡ Performance & Infrastructure

- **Redis caching** with automatic fallback if Redis unavailable
- **File upload** — local filesystem or Google Cloud Storage (switchable)
- **WebSocket** — real-time push notifications for blocked content (`/ws/blocked-content`)
- **Database migrations** with Alembic (5 migrations, auto-applied on startup)
- **Production Docker** — multi-stage builds, Nginx reverse proxy, Gunicorn workers

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                           │
│         (React 18, TypeScript, Tailwind CSS, Canvas API)        │
│  Pages: Dashboard · Threats · Network · Forensics · Sharing     │
│          Ledger · Policy · Scans · Login · Register             │
└────────────────────────┬─────────────────────────────────────────┘
                         │ REST + WebSocket
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend  (v2.0.0)                  │
│  ┌─────────────┬──────────────┬──────────────────────────────┐  │
│  │ Auth Engine  │ Authz Engine │  Audit Middleware            │  │
│  └─────────────┴──────────────┴──────────────────────────────┘  │
│  ┌─────────────┬──────────────┬──────────────────────────────┐  │
│  │ Orchestrator │ Graph Oracle │  Policy Guardian (Agent 4)  │  │
│  │ (Pipeline)  │ (Neo4j GDS)  │  DSL Rule Engine             │  │
│  └─────────────┴──────────────┴──────────────────────────────┘  │
│  ┌─────────────┬──────────────┬──────────────────────────────┐  │
│  │ Gemini AI   │ STIX Export  │  Blockchain Ledger           │  │
│  │ (Detection/ │ (STIX 2.1)  │  (SHA-256 linked blocks)     │  │
│  │  Forensics) │              │                              │  │
│  └─────────────┴──────────────┴──────────────────────────────┘  │
└────────┬───────────────┬──────────────────┬─────────────────────┘
         │               │                  │
┌────────▼──────┐ ┌──────▼──────┐  ┌───────▼──────┐
│  PostgreSQL   │ │    Neo4j    │  │    Redis     │
│  (Primary DB) │ │ (Graph GDS) │  │  (Caching)   │
└───────────────┘ └─────────────┘  └──────────────┘
```

---

## 📂 Project Structure

```
Aegis-G/
├── app/                              # FastAPI Backend
│   ├── main.py                       # App entry point (v2.0.0)
│   ├── authz.py                      # Authorization engine ⭐
│   ├── authz.map.json                # Permission rules ⭐
│   ├── public.map.json               # Public endpoints list ⭐
│   ├── config.py                     # Settings & env vars
│   ├── seed.py                       # Default user seeding
│   │
│   ├── auth/                         # JWT authentication
│   │   ├── jwt.py                    # Token issuance & validation
│   │   └── password.py               # Bcrypt password hashing
│   │
│   ├── middleware/                   # Request middleware
│   │   ├── authz.py                  # Auto permission checking ⭐
│   │   └── audit.py                  # Auto request logging ⭐
│   │
│   ├── models/                       # SQLAlchemy ORM models
│   │   ├── user.py                   # User (with approval workflow) ⭐
│   │   ├── audit.py                  # AuditLog model ⭐
│   │   ├── ai.py                     # AIPolicy, AIInsight ⭐
│   │   ├── threat.py                 # Threat, Report
│   │   ├── ledger.py                 # LedgerEntry (blockchain)
│   │   └── database.py               # Session factory
│   │
│   ├── routers/                      # API endpoints
│   │   ├── auth.py                   # Login, register, refresh, /me
│   │   ├── admin.py                  # Users, audit logs, authz rules ⭐
│   │   ├── ai.py                     # Policies, insights, chat ⭐
│   │   ├── analyst.py                # Agent 3 fusion endpoint
│   │   ├── detection.py              # Scan & batch scan (pipeline trigger)
│   │   ├── forensics.py              # Forensic analysis (Gemini)
│   │   ├── graph.py                  # Network, campaign, clusters, pagerank ⭐
│   │   ├── sharing.py                # Ledger, STIX export, share ⭐
│   │   ├── threats.py                # Threat CRUD
│   │   ├── system.py                 # Health checks
│   │   └── websocket.py              # Real-time blocked content stream ⭐
│   │
│   ├── schemas/                      # Pydantic models
│   │   ├── ai.py                     # AI feature schemas ⭐
│   │   ├── detection.py              # Scan request/response
│   │   ├── graph.py                  # Graph response schemas
│   │   └── intelligence.py           # Fusion request schema
│   │
│   ├── services/                     # Business logic
│   │   ├── audit.py                  # Audit service ⭐
│   │   ├── cache.py                  # Redis caching ⭐
│   │   ├── storage.py                # File upload (local/GCS) ⭐
│   │   ├── mcp_client.py             # MCP tool client
│   │   ├── ai/                       # AI services
│   │   │   ├── orchestrator.py       # Multi-agent pipeline ⭐
│   │   │   ├── policy_guardian.py    # Agent 4 — DSL engine ⭐
│   │   │   ├── fusion_service.py     # Agent 3 — intelligence synthesis
│   │   │   ├── local_detection.py    # Agent 1 — offline ONNX classifier
│   │   │   ├── policy.py             # AI policy translation service
│   │   │   ├── insights.py           # AI insight generation
│   │   │   └── chat.py               # AI Manager chatbot
│   │   ├── gemini/                   # Google Gemini integration
│   │   │   ├── client.py             # Detection & forensic analysis
│   │   │   ├── privacy.py            # PII redaction before sharing
│   │   │   ├── prompts.py            # Prompt management
│   │   │   └── prompts/              # Prompt text files
│   │   │       ├── sentinel_prompt.txt
│   │   │       ├── forensic_prompt.txt
│   │   │       └── redactor_prompt.txt
│   │   ├── graph/
│   │   │   └── neo4j.py              # Neo4j GDS client ⭐
│   │   ├── export/
│   │   │   └── stix_service.py       # STIX 2.1 bundle generator
│   │   └── vector/
│   │       └── embeddings.py         # Vector embeddings
│   │
│   ├── core/
│   │   └── blockchain.py             # SHA-256 linked ledger
│   │
│   └── migrations/                   # Alembic migrations
│       └── versions/
│           ├── 001_initial_schema.py
│           ├── 002_user_approval_and_audit.py ⭐
│           ├── 003_ai_features.py ⭐
│           ├── 004_add_thought_process.py ⭐
│           └── 005_blocked_content.py ⭐
│
├── frontend/                         # Next.js 14 Frontend
│   └── src/
│       ├── app/                      # App Router pages
│       │   ├── page.tsx              # Home / landing
│       │   ├── dashboard/page.tsx    # Command center dashboard
│       │   ├── threats/page.tsx      # Threat intelligence list
│       │   ├── network/page.tsx      # Network graph visualization
│       │   ├── forensics/[id]/page.tsx  # Forensic deep-dive
│       │   ├── sharing/page.tsx      # Intel sharing (blockchain UI)
│       │   ├── ledger/page.tsx       # Ledger Explorer ⭐
│       │   ├── policy/page.tsx       # AI Policy management ⭐
│       │   ├── scans/page.tsx        # Live scan interface ⭐
│       │   ├── login/page.tsx        # Authentication
│       │   └── register/page.tsx     # User registration
│       │
│       ├── components/
│       │   ├── ui/                   # Button, Card, Input, Badge, StatCard
│       │   ├── layout/               # Navbar, Sidebar
│       │   ├── visual/               # ThreatMapGlobe, NetworkGraph ⭐
│       │   ├── ai/                   # AIManager (floating chat) ⭐
│       │   ├── auth/                 # AuthGuard
│       │   ├── intel/                # IntelligenceBrief, ReasoningTerminal
│       │   ├── policy/               # Policy UI components
│       │   ├── reports/              # AnalysisCard
│       │   └── threats/              # ThreatCard
│       │
│       ├── context/
│       │   └── ThreatContext.tsx     # Global threat state
│       │
│       └── lib/
│           ├── fusion.ts             # Analyst fusion API helpers
│           ├── gemini-stream.ts      # Gemini streaming client
│           └── export.ts             # Export utilities
│
├── deployment/                       # Production configs
│   ├── docker-compose.prod.yml       # Production stack
│   ├── Dockerfile.backend.prod       # Multi-stage backend build
│   ├── Dockerfile.frontend.prod      # Multi-stage frontend build
│   └── nginx/nginx.conf              # Reverse proxy config
│
├── tests/                            # Test suite
│   ├── conftest.py                   # Fixtures
│   ├── test_api_health.py
│   └── test_auth.py
│
├── scripts/                          # Utility scripts
│   ├── entrypoint.sh                 # Docker entrypoint
│   ├── mock_stream.py                # Simulates incoming threat stream
│   └── test_gemini.py                # Gemini API validation
│
├── data/                             # Sample data
│   ├── known_actors.json             # Known threat actors
│   └── social_feed.json              # Sample social feed for testing
│
├── docker-compose.yml                # Development stack
├── Makefile                          # Dev commands
├── env.example                       # Environment template
├── pytest.ini                        # Test configuration
├── start-dev.ps1                     # Windows quick-start script
└── README.md                         # This file

⭐ = Added / enhanced beyond base scaffold
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Required | Purpose |
|------|----------|---------|
| [Docker Desktop](https://www.docker.com/get-started) | ✅ Recommended | Runs all services |
| Python 3.11+ | ✅ For local dev | Backend runtime |
| Node.js 18+ | ✅ For local dev | Frontend runtime |
| `make` | ✅ | Dev commands |
| [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) | ❌ Optional | GCS file storage |

---

### Option 1: Docker (Full Stack — Recommended)

```bash
# Start all services (PostgreSQL + Neo4j + Redis + Backend + Frontend)
make up

# Run migrations (first time or after pulling updates)
make migrate

# Services
# Frontend:  http://localhost:3000
# API Docs:  http://localhost:8000/docs
# Neo4j UI:  http://localhost:7474
# Redis:     localhost:6379
```

---

### Option 2: Local Development (Without Docker)

#### Step 1 — Backend

```powershell
# Windows PowerShell
cd "C:\...\Aegis-G"
pip install -r requirements.txt
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
# macOS / Linux
cd Aegis-G
pip install -r requirements.txt
export PYTHONPATH=$(pwd)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Step 2 — Frontend

```bash
cd frontend
npm install      # First time only
npm run dev
# Open http://localhost:3000
```

#### Step 3 — Databases (if not using Docker)

Use Docker just for the databases:

```bash
docker-compose up db neo4j redis
```

#### Quick Start Script (Windows)

```powershell
.\start-dev.ps1
```

#### Verify Everything is Running

```
✅ Backend:   http://127.0.0.1:8000/health  → {"status": "healthy", ...}
✅ API Docs:  http://127.0.0.1:8000/docs
✅ Frontend:  http://localhost:3000          → Login page
```

---

## 🔐 Authentication & Authorization

### Auth Flow

```
1. User registers → status: pending
2. Admin approves → status: approved
3. User logs in   → JWT token issued
4. Token in headers → Authz middleware checks authz.map.json
5. Request logged → Audit middleware stores to DB
6. Response returned
```

### Authorization Rules (`app/authz.map.json`)

```json
{
  "/api/threats": {
    "GET":    ["admin", "analyst", "viewer"],
    "POST":   ["admin", "analyst"],
    "DELETE": ["admin"]
  },
  "/api/admin/*": {
    "ANY": ["admin"]
  },
  "/api/scan/*": {
    "ANY": ["admin", "analyst"]
  }
}
```

**Wildcards supported:**
- `*` in path: `/api/admin/*` matches all admin sub-paths
- `ANY` method: applies to all HTTP methods
- `["*"]` roles: public access

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **admin** | Full system access | User management, system config, all operations |
| **analyst** | Threat investigation | Scan, create threats, policies, reports |
| **viewer** | Read-only | View threats, reports, dashboards |

### User Approval Workflow

1. User self-registers → status: **`pending`**
2. Admin reviews at `GET /api/admin/users/pending`
3. Admin approves/rejects → `POST /api/admin/users/{id}/approve`
4. Status → **`approved`** or **`rejected`**
5. Configure `APPROVED_EMAIL_DOMAINS` in `.env` for auto-approval

---

## 🤖 AI Features

### 1. Content Detection (Agent 1)

Two operating modes:

| Mode | Header | Backend | Use Case |
|------|--------|---------|----------|
| **Local** (default) | `X-Inference-Mode: local` | Offline ONNX classifier | Air-gapped / high security |
| **Cloud** | `X-Inference-Mode: cloud` | Gemini 2.5 Flash | Maximum accuracy |

```bash
curl -X POST http://localhost:8000/api/scan/ \
  -H "X-Inference-Mode: cloud" \
  -H "Content-Type: application/json" \
  -d '{"content": "...", "source_platform": "twitter", "username": "user123"}'
```

### 2. AI Policies (Agent 4 — Policy Guardian)

**Translate natural language into executable DSL rules:**

```
Input:  "Block all posts with AI score above 85% and more than 5 in a cluster"

Output: IF ai_score > 0.85 AND graph_cluster_size > 5 THEN BLOCK_AND_LOG
```

**DSL Syntax:**

| Construct | Example |
|-----------|---------|
| Condition | `ai_score > 0.85` |
| Condition | `narrative_match("disinformation")` |
| Condition | `contains(content, "urgent")` |
| Condition | `graph_cluster_size > 10` |
| Logic | `AND`, `OR`, `NOT` |
| Action | `BLOCK_AND_LOG`, `FLAG_THREAT(high)`, `ALERT(analyst)`, `LOG_ONLY` |

**Endpoints:**
- `POST /api/ai/policies` — Create policy
- `GET /api/ai/policies` — List policies
- `POST /api/ai/policies/translate` — Preview DSL translation

### 3. AI Insights

Proactive threat intelligence:
- Pattern detection, anomaly identification
- Risk prioritization (Critical / Warning / Recommendation)
- Suggested actions

**Endpoints:**
- `GET /api/ai/insights` — View insights
- `POST /api/ai/insights/generate` — Generate new
- `POST /api/ai/insights/{id}/dismiss` — Dismiss

### 4. AI Manager Chat (`Ctrl+M` / `⌘M`)

Context-aware floating chatbot:
- Understands current page context
- Tool execution (search threats, generate reports)
- Conversation memory, quick actions

```bash
POST /api/ai/chat
{
  "message": "Show me high-risk threats from the last 24 hours",
  "context": { "page": "dashboard" }
}
```

### 5. Intelligence Synthesis (Agent 3)

```bash
POST /api/analyst/fusion
{
  "threat_id": 42,
  "content": "...",
  "forensic_data": { ... },
  "graph_data": { ... }
}
# → Structured report + AI reasoning log + Blockchain hash
```

---

## 🕸️ Graph Oracle (Agent 2)

### Algorithms

| Algorithm | Endpoint | Description |
|-----------|----------|-------------|
| Louvain Clustering | `GET /api/network/clusters` | Community / botnet detection |
| PageRank | `GET /api/network/pagerank` | Influence scoring |
| Patient Zero | (pipeline internal) | Earliest content propagator |
| Campaign Lineage | `GET /api/network/campaign/{root_id}` | Propagation tree |

### Neo4j GDS Notes

- Requires the **Neo4j Graph Data Science plugin** for full Louvain / PageRank functionality
- Gracefully **falls back to standard Cypher** if the GDS plugin is not installed
- Check logs for `GDS fallback` messages if running without GDS

---

## 🔗 Blockchain Ledger

Every high-risk threat (score > 0.7) and every shared intelligence report is committed to an **immutable SHA-256 linked ledger** stored in PostgreSQL.

### Ledger Explorer (`/ledger`)

The frontend Ledger Explorer page provides:
- Paginated blockchain history
- Chain integrity status (INTACT / TAMPERED)
- Per-block: hash, previous hash, timestamp, agency, verification status

### Endpoints

```bash
GET  /api/sharing/ledger                    # Paginated history
GET  /api/sharing/ledger/integrity          # Verify chain
GET  /api/sharing/ledger/{hash}             # Verify specific block
POST /api/sharing/share/{report_id}         # Share with agency (PII redacted)
GET  /api/sharing/export/stix/{threat_id}   # Download STIX 2.1 bundle
```

---

## 📊 Audit Logging

### Automatically Logged on Every Request

- HTTP method, endpoint, query params
- User ID, email, role
- Request / response bodies (sensitive data masked)
- Response status code, time taken (ms)
- IP address, user agent

### Security Events

- Failed authentication attempts
- Authorization (permission) denials
- User approvals / rejections

### Usage

```bash
# Query logs (Admin only)
GET /api/admin/audit?user_email=test@aegis.com&limit=100

# Export to CSV
GET /api/admin/audit/export

# Security events only
GET /api/admin/audit/security
```

### Custom Event Logging (in code)

```python
from app.services.audit import audit

await audit.log_user_action(
    action="threat.escalate",
    actor=current_user,
    target_type="threat",
    target_id=threat_id,
    details={"severity": "critical"},
    db=db
)
```

---

## 🌐 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with system status |
| Dashboard | `/dashboard` | Command center — stats, globe, recent threats |
| Threats | `/threats` | Threat list with search, filter, export |
| Network | `/network` | Interactive force-directed graph + 3D globe |
| Forensics | `/forensics/[id]` | Timeline, artifacts, IOCs, AI insights |
| Sharing | `/sharing` | Inter-agency sharing, blockchain audit |
| Ledger | `/ledger` | Blockchain history + integrity check ⭐ |
| Policy | `/policy` | AI Policy management (NL → DSL) ⭐ |
| Scans | `/scans` | Live content scan interface ⭐ |
| Login | `/login` | Authentication |
| Register | `/register` | Account request (pending approval) |

### Key Visual Components

| Component | Description |
|-----------|-------------|
| `ThreatMapGlobe.tsx` | 3D rotating globe with geographic threat arcs (Canvas API) ⭐ |
| `NetworkGraph.tsx` | Physics-based force-directed node-link graph with campaign mode ⭐ |
| `AIManager.tsx` | Floating chat (bottom-right), `Ctrl+M` shortcut |
| `ReasoningTerminal.tsx` | Displays Agent 3's AI reasoning log |
| `IntelligenceBrief.tsx` | Structured intelligence brief display |

---

## 📖 API Reference

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register new user |
| `/api/auth/login` | POST | Public | Login (get JWT) |
| `/api/auth/me` | GET | Required | Get current user |

### Admin

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/users/pending` | GET | Admin | Pending registrations |
| `/api/admin/users/{id}/approve` | POST | Admin | Approve / reject user |
| `/api/admin/users/{id}` | DELETE | Admin | Delete user |
| `/api/admin/audit` | GET | Admin | Query audit logs |
| `/api/admin/audit/export` | GET | Admin | Export logs (CSV) |
| `/api/admin/audit/security` | GET | Admin | Security events only |
| `/api/admin/authz/rules` | GET | Admin | Get authz rules |
| `/api/admin/authz/rules` | POST | Admin | Add authz rule |
| `/api/admin/authz/reload` | POST | Admin | Reload rules from file |

### Detection (Pipeline Trigger)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/scan/` | POST | Analyst+ | Trigger full pipeline (single item) |
| `/api/scan/batch` | POST | Analyst+ | Batch scan |

### AI

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/policies` | GET/POST | Analyst+ | Manage policies |
| `/api/ai/policies/translate` | POST | Analyst+ | Preview DSL translation |
| `/api/ai/insights` | GET | Analyst+ | View insights |
| `/api/ai/insights/generate` | POST | Analyst+ | Generate insights |
| `/api/ai/chat` | POST | All | AI Manager chat |

### Graph

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/network/` | GET | All | Full network graph |
| `/api/network/campaign/{root_id}` | GET | All | Campaign propagation tree |
| `/api/network/clusters` | GET | All | Botnet cluster detection |
| `/api/network/pagerank` | GET | All | Top influencer ranking |

### Sharing & Ledger

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/sharing/ledger` | GET | Required | Paginated ledger history |
| `/api/sharing/ledger/integrity` | GET | Required | Chain integrity check |
| `/api/sharing/ledger/{hash}` | GET | Public | Verify specific block |
| `/api/sharing/share/{report_id}` | POST | Analyst+ | Share with agency |
| `/api/sharing/export/stix/{threat_id}` | GET | Analyst+ | STIX 2.1 export |

### Analyst & Forensics

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analyst/fusion` | POST | Analyst+ | Agent 3 intelligence synthesis |
| `/api/forensics/{threat_id}` | POST | Analyst+ | Deep forensic analysis |
| `/api/forensics/{threat_id}/summary` | GET | Analyst+ | Forensic summary |

### System

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | Public | Health check (cache status) |
| `/docs` | GET | Public | Swagger UI |
| `/redoc` | GET | Public | ReDoc API docs |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/blocked-content` | Real-time blocked content stream (Agent 4) |

---

## 🗄️ Database Migrations

Migrations run **automatically on startup**. Migration chain:

```
001_initial_schema          — users, threats, reports, ledger_entries
  ↓
002_user_approval_and_audit — status field on users, audit_logs table
  ↓
003_ai_features             — ai_policies, ai_insights tables
  ↓
004_add_thought_process     — thought_process column on ledger_entries
  ↓
005_blocked_content         — blocked_content table (Agent 4 audit)
```

**Manual commands:**

```bash
make migrate                          # Apply pending migrations
make migration MSG='your_description' # Create new migration
make migrate-history                  # View migration status
make migrate-down                     # Rollback one migration
make clean-db                         # ⚠️ Clear all data
```

---

## 🔧 Configuration

Copy `env.example` to `.env` and edit:

```bash
# ============================================
# Core
# ============================================
APP_ENV=development             # development | production
LOG_LEVEL=INFO
SECRET_KEY=<generate-32-byte>   # REQUIRED: python -c "import secrets; print(secrets.token_hex(32))"

# ============================================
# Database (PostgreSQL)
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
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# AI / Gemini
# ============================================
GEMINI_API_KEY=                 # Get from https://aistudio.google.com/apikey
GEMINI_FLASH_MODEL=gemini-2.5-flash

# ============================================
# Storage
# ============================================
STORAGE_BACKEND=local           # local | gcs
LOCAL_STORAGE_PATH=storage
GCS_BUCKET_NAME=                # If using Google Cloud Storage

# ============================================
# User Approval
# ============================================
APPROVED_EMAIL_DOMAINS=yourcompany.com,partner.com  # Auto-approve these domains

# ============================================
# CORS
# ============================================
CORS_ORIGINS=http://localhost:3000
```

---

## 🛠️ Make Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services (Docker) |
| `make up-base` | Start base scaffold only (no Neo4j) |
| `make down` | Stop all services |
| `make restart` | Restart services |
| `make logs` | View all logs |
| `make logs-be` | Backend logs only |
| `make logs-fe` | Frontend logs only |
| **Database** | |
| `make migrate` | Apply pending migrations |
| `make migration MSG='desc'` | Create new migration |
| `make migrate-history` | View migration chain |
| `make migrate-down` | Rollback one migration |
| `make clean-db` | ⚠️ Clear all data |
| **Testing** | |
| `make test` | Run all tests |
| `make test-cov` | Run with coverage |
| `make test-unit` | Unit tests only |
| `make test-auth` | Auth tests only |
| **Code Quality** | |
| `make lint` | Run linter |
| `make lint-fix` | Auto-fix issues |
| `make fmt` | Format (black + isort) |
| `make security` | Security scan (bandit + safety) |
| **Production** | |
| `make up-prod` | Start production stack |
| `make build-prod` | Build production images |

---

## 🧪 Testing

```bash
# All tests
make test

# With coverage report
make test-cov

# Specific file
pytest tests/test_auth.py -v

# By marker
pytest -m unit
pytest -m auth
```

**Test structure:**
```
tests/
├── conftest.py          # Shared fixtures
├── test_api_health.py   # Health check tests
└── test_auth.py         # Authentication tests
```

**Mock threat stream** (simulates live input):
```bash
python scripts/mock_stream.py
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Generate strong `SECRET_KEY`
- [ ] Set `APP_ENV=production`
- [ ] Configure production PostgreSQL
- [ ] Configure production Neo4j with GDS plugin
- [ ] Add `GEMINI_API_KEY`
- [ ] Set `CORS_ORIGINS` to your frontend URL
- [ ] Configure SSL/TLS in `nginx/nginx.conf`
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Review and tighten `authz.map.json` rules
- [ ] Set up log aggregation

### Docker Production

```bash
# Build production images
make build-prod

# Start production stack
# Includes: Gunicorn+Uvicorn backend, Next.js standalone frontend,
#           PostgreSQL, Neo4j, Redis, Nginx reverse proxy
make up-prod
```

### CI/CD (GitHub Actions)

- **CI Pipeline** — Tests, lint, security scan, Docker build on every push/PR
- **Deploy Pipeline** — Build & push images, deploy on release tags

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Port already in use" | Stop conflicting services or change ports in `.env` |
| "AI features not working" | Check `GEMINI_API_KEY` is set and valid |
| "Neo4j GDS not working" | Install the GDS plugin; system falls back to basic Cypher automatically |
| "Permission denied on endpoint" | Check your user role against `authz.map.json` |
| "Redis connection failed" | Ensure Redis is running: `docker ps` |
| "Migration failed" | Check `DATABASE_URL` is correct and DB is reachable |
| Backend logs | `make logs-be` or `docker logs aegis_backend -f` |
| Frontend logs | `make logs-fe` or `docker logs aegis_frontend -f` |

---

## 📚 Additional Documentation

| File | Contents |
|------|----------|
| `IMPLEMENTATION_SUMMARY.md` | Enterprise features — what was built and scoring |
| `YASH_PRD_COMPLETION.md` | Graph Oracle, 3D Globe, Campaign View, Ledger Explorer |
| `frontend/IMPLEMENTATION_COMPLETE.md` | Frontend component & page details |
| `BASE_SCAFFOLD_README.md` | Instructions for running the base scaffold (no AI/graph) |
| `frontend/README_FRONTEND.md` | Frontend design system and component guide |

---

## 🤝 Contributing

```bash
# Install dev dependencies
make install-dev

# Format before committing
make fmt

# Lint check
make lint

# Run tests
make test
```

---

## 📄 License

MIT License — See [LICENSE](LICENSE) file.

---

**Built with ❤️ for National Security Operations — Aegis-G v2.0.0**
