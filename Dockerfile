# Unified Aegis-G: Backend (FastAPI) + Frontend (Next.js)
FROM node:18-bookworm-slim

WORKDIR /workspace

# Install Python 3 for backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Backend: create venv and install deps (avoids externally-managed-environment)
COPY requirements.txt /workspace/requirements.txt
RUN python3 -m venv /workspace/venv \
    && /workspace/venv/bin/pip install --no-cache-dir -r /workspace/requirements.txt

# Frontend: install deps first, then copy source (so node_modules survives)
COPY frontend/package.json frontend/package-lock.json* /workspace/frontend/
RUN cd /workspace/frontend && npm install

# App code
COPY app/ /workspace/app/
COPY scripts/ /workspace/scripts/
COPY frontend/ /workspace/frontend/

EXPOSE 3000 8000

# Run both: migrations, then backend + frontend (use venv Python)
ENV PATH="/workspace/venv/bin:$PATH"
ENTRYPOINT ["/workspace/venv/bin/python3", "/workspace/scripts/entrypoint.py"]
