# Project Sentinel - National Security Threat Intelligence Platform

A production-ready framework for building a multi-layered defense system to detect, analyze, and mitigate LLM-driven malign information operations. It combines a Python/FastAPI backend, a Next.js/React analyst dashboard, specialized AI/ML models for content detection, and a graph database for threat intelligence.

## 🚨 For Project Team - Read This First!

This document outlines the full vision. When building, we must distinguish between core, deliverable functionality and advanced features that will be implemented conceptually or in a simplified form.

### What's Real (Core Deliverable for this Project)

| Component | Description |
| :--- | :--- |
| AI Content Detection | A fine-tuned transformer model (e.g., RoBERTa) served via an API that classifies text as Human vs. AI-Generated with >90% accuracy. |
| Model Fingerprinting | A simplified attribution model that attempts to classify content origin (e.g., Gemini, GPT-3.5, Human). |
| Analyst Dashboard | A functional Next.js UI for submitting text for analysis, viewing risk scores, and seeing historical trends. |
| Graph Intelligence Hub | A Neo4j database populated with sample data to demonstrate coordinated campaign analysis. Includes a graph visualization component. |
| Backend API | A robust FastAPI backend orchestrating the ML models, databases, and serving data to the frontend. |
| Database Setup | PostgreSQL for structured data (analysis results, metadata) and Neo4j for graph data. Both with Alembic/schema management. |
| Containerization | The entire stack is fully containerized with Docker for easy local setup and deployment. |

### What's Conceptual (Simplified for this Project)

| Page/Feature | Location/Concept | Action Required |
| :--- | :--- | :--- |
| Federated Intel Sharing| backend/routers/intel.py | Design and implement a secure API endpoint. The full blockchain/federated learning protocol will be described in the policy document, not implemented. |
| Real-Time SIEM Feed | API Endpoint (/api/feed) | We will create a webhook/API endpoint that could be consumed by a SIEM. We won't integrate with a real SIEM. |
| Forensic Watermarking | Documentation | The complex cryptographic watermarking is out of scope. We will focus on stylometric fingerprinting as our primary attribution method. |
| Multi-Modal Detection| Future Work | The core deliverable focuses on text. The architecture will be designed to be extensible for image/video analysis later. |

## ✨ Core Features

- **Real-Time AI Detection Engine**: High-accuracy classification of AI-generated text using a hybrid of deep learning and stylometric analysis.

- **Model Attribution (Fingerprinting)**: Attempts to identify the specific LLM family used to generate malicious content.

- **Graph-Based Threat Intelligence**: Maps disinformation campaigns, actor coordination, and content propagation using a graph database (Neo4j).

- **Interactive Analyst Dashboard**: A web-based command center for real-time risk scoring, temporal trend analysis, and graph exploration.

- **Secure Intelligence Sharing Protocol**: A designed API for sharing threat intelligence securely between allied agencies (conceptual).

- **Comprehensive Data Management**: Uses PostgreSQL for structured results and Neo4j for network relationships.

- **Fully Containerized**: Easy to set up, run, and deploy using Docker and Docker Compose.

- **AI-Powered Data Generation**: Leverages the Gemini API to create a diverse, high-quality training dataset of synthetic malicious content.

## 💻 Technology Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| Backend | Python 3.11 + FastAPI | High-performance API for detection and data services. |
| Frontend | Next.js 14 + React 18 + TypeScript | Modern, interactive UI for the analyst dashboard. |
| AI / Machine Learning | Gemini API | Generating training data; semantic feature extraction. |
| | PyTorch + Hugging Face | Training and serving the core text detection/attribution models. |
| Primary Database | PostgreSQL 15 | Storing analysis results, metadata, and user info. |
| Graph Database | Neo4j | Modeling and querying threat actor networks. |
| DevOps | Docker + Docker Compose, make | Containerization and simplified development workflow. |

## 🚀 Quick Start

Get Project Sentinel running locally in under 5 minutes.

**Prerequisites**: Docker Desktop, make (built-in on macOS/Linux).

### Step 1: Clone & Setup

```bash
git clone https://github.com/your-team/project-sentinel.git
cd project-sentinel
cp .env.example .env
```

### Step 2: Configure Secrets

Edit `.env` and set this required value for generating your training dataset:

```ini
# REQUIRED for generating training data and advanced analysis
# Get your API key from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-google-ai-studio-api-key-here
```

### Step 3: Start Everything

```bash
make up
```

This starts PostgreSQL, Neo4j, the Backend (FastAPI), and Frontend (Next.js). The first startup may take longer as it builds the containers and downloads ML models.

### Step 4: Access the App

| Service | URL | Description |
| :--- | :--- | :--- |
| 🌐 Analyst Dashboard | http://localhost:3000 | Main application UI. |
| 📡 Backend API Docs | http://localhost:8000/docs | FastAPI/Swagger interactive API documentation. |
| 📊 Neo4j Browser | http://localhost:7474 | Direct access to the graph database. |

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Backend
│   ├── main.py              # API router setup and app lifecycle
│   ├── routers/
│   │   ├── detection.py     # Endpoints for content analysis (/api/detect)
│   │   └── graph.py         # Endpoints for graph intelligence (/api/graph)
│   ├── services/
│   │   ├── detector_service.py # Loads and runs the ML model
│   │   └── graph_service.py   # Handles queries to Neo4j
│   ├── ml/
│   │   ├── models/          # Saved model files (e.g., roberta.pth)
│   │   ├── train.py         # Script to train the detection model
│   │   └── dataset/         # Training data (human vs. ai)
│   └── data_generation/
│       └── generate_with_gemini.py # Script to create the AI training dataset
│
├── frontend/                 # Next.js Frontend
│   └── src/
│       ├── app/             # App Router pages
│       │   ├── dashboard/   # Main dashboard with stats and trends
│       │   ├── investigate/ # Graph visualization and exploration page
│       │   └── submit/      # Real-time text submission and analysis page
│       ├── components/
│       │   ├── layout/      # Header, Sidebar, etc.
│       │   ├── ui/          # Reusable UI components (buttons, charts)
│       │   ├── dashboard/   # Components for the dashboard page
│       │   └── graph/       # Graph visualization component (e.g., using vis.js)
│       └── lib/
│           └── api-client.ts  # Typed client for our backend API
│
├── alembic/                 # PostgreSQL database migrations
├── docker-compose.yml       # Local development services orchestration
├── Makefile                 # Development helper commands
└── .env.example             # Environment variable template
```

## 🤖 Core AI & Analytics Modules

### 1. AI Detection Engine (/api/detect)

This is the heart of the system. It uses a multi-faceted approach:

- **Transformer Classifier**: A fine-tuned RoBERTa model trained to distinguish between the statistical patterns of human writing and LLM-generated text.

- **Stylometric Analysis**: Extracts features like text entropy, repetitiveness, and perplexity to provide a secondary signal, making the detection more robust against future, more advanced LLMs.

### 2. Graph Intelligence Hub (/api/graph)

Leverages Neo4j to uncover hidden connections in information operations.

- **Schema**: `(Actor)-[:POSTED]->(Content)-[:CONTAINS_TOPIC]->(Topic)`

- **Functionality**: Allows analysts to visually explore how different pieces of AI-generated content (nodes) are linked by common actors or themes, revealing coordinated campaigns that would be invisible in raw data.

### 3. Analyst Dashboard

The primary user interface for national security analysts.

- **Real-Time Submission**: Paste text or a URL for immediate analysis and a risk score.

- **Threat Heatmap**: Visualizes which topics or entities are being most frequently targeted by AI-driven disinformation.

- **Temporal Trends**: Charts showing the volume of detected AI content over time, helping to identify emerging campaigns.

- **Graph Explorer**: An interactive view of the Neo4j database to investigate connections between malicious actors and narratives.

## 🏁 Development Roadmap & Checklist

### Phase 1: Foundation & Data Curation

- Set up project structure, Docker, and databases.

- Write `data_generation/generate_with_gemini.py` script to create a large, labeled dataset of malicious text examples (phishing, propaganda, disinformation).

- Collect a corresponding dataset of human-written text.

### Phase 2: Core AI Model & API

- Implement and train the detection model in `backend/ml/train.py`.

- Build the `detector_service.py` to load and serve the model.

- Create the `/api/detect` endpoint in FastAPI.

### Phase 3: Dashboard & Visualization

- Build the core frontend layout (sidebar, header).

- Create the "Submit" page to interact with the detection API.

- Develop the main "Dashboard" page with placeholder charts.

- Implement the "Investigate" page with a graph visualization component connected to the `/api/graph` endpoint.

### Phase 4: Integration & Policy

- Connect the frontend charts to real backend data.

- Populate Neo4j with sample data to demonstrate its capabilities.

- Design and document the conceptual "Federated Intel Sharing" API.

- Write the final policy framework document.

- Prepare the final presentation and live demo.

