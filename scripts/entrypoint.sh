#!/bin/sh
# ============================================
# 🛡️ Aegis-G — Production Entrypoint
# Works for: Azure Container Apps, Cloud Run, Railway
# ============================================
set -e

# Use PORT env var injected by the platform, fall back to 8000
PORT="${PORT:-8000}"

echo "🚀 Aegis-G starting on port $PORT (ENV=$ENVIRONMENT)"

# ── Wait for PostgreSQL to be ready ──────────────────────────────────────────
if echo "$DATABASE_URL" | grep -q "postgresql"; then
    echo "⏳ Waiting for PostgreSQL..."
    for i in $(seq 1 30); do
        if python -c "
import os, urllib.parse, psycopg2
p = urllib.parse.urlparse(os.environ['DATABASE_URL'])
try:
    psycopg2.connect(host=p.hostname, port=p.port or 5432,
                     user=p.username, password=p.password,
                     dbname=p.path[1:], connect_timeout=2)
except Exception as e:
    raise SystemExit(1)
" 2>/dev/null; then
            echo "✅ Database ready."
            break
        fi
        echo "  Attempt $i/30 — retrying in 2s..."
        sleep 2
    done
fi

# ── Start server ──────────────────────────────────────────────────────────────
# Use gunicorn with uvicorn workers in production, plain uvicorn in dev
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🏭 Starting gunicorn (production mode)..."
    exec gunicorn app.main:app \
        --workers "${GUNICORN_WORKERS:-2}" \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind "0.0.0.0:${PORT}" \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        --capture-output
else
    echo "🔧 Starting uvicorn (development mode)..."
    exec uvicorn app.main:app \
        --host 0.0.0.0 \
        --port "${PORT}" \
        --reload
fi
