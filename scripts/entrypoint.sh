#!/bin/sh
set -e

# Wait for PostgreSQL to be ready (when using postgres)
if echo "$DATABASE_URL" | grep -q postgresql; then
  echo "Waiting for database..."
  for i in $(seq 1 30); do
    if python -c "
import os, urllib.parse
import psycopg2
p = urllib.parse.urlparse(os.environ['DATABASE_URL'])
try:
    psycopg2.connect(host=p.hostname, port=p.port or 5432, user=p.username, password=p.password, dbname=p.path[1:], connect_timeout=2)
except: raise SystemExit(1)
" 2>/dev/null; then
      break
    fi
    sleep 2
  done
  echo "Database ready."
fi

# Run migrations (from project root so app package is importable)
echo "Running migrations..."
cd /workspace && PYTHONPATH=/workspace alembic -c app/alembic.ini upgrade head
echo "Migrations complete."

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
