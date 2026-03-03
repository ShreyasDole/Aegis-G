#!/usr/bin/env python3
"""Startup: wait for DB, run migrations, start backend + frontend."""
import os
import subprocess
import sys
import time
import urllib.parse


def wait_for_db():
    url = os.environ.get("DATABASE_URL", "")
    if "postgresql" not in url:
        return
    print("Waiting for database...")
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    user = parsed.username
    password = parsed.password
    dbname = (parsed.path or "/")[1:] or "postgres"
    for _ in range(30):
        try:
            import psycopg2
            psycopg2.connect(
                host=host, port=port, user=user,
                password=password, dbname=dbname, connect_timeout=2
            )
            print("Database ready.")
            return
        except Exception:
            time.sleep(2)
    print("Warning: database not ready after 60s")


def run_migrations():
    print("Running migrations...")
    env = os.environ.copy()
    env["PYTHONPATH"] = "/workspace"
    r = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "app/alembic.ini", "upgrade", "head"],
        cwd="/workspace", env=env
    )
    if r.returncode != 0:
        sys.exit(r.returncode)
    print("Migrations complete.")


def main():
    wait_for_db()
    run_migrations()

    # Start backend in background
    backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd="/workspace", env={**os.environ, "PYTHONPATH": "/workspace"}
    )

    # Start frontend in foreground (keeps container alive), bind to 0.0.0.0 for Docker
    frontend_env = os.environ.copy()
    frontend_env.setdefault("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    sys.exit(subprocess.run(
        ["npx", "next", "dev", "-H", "0.0.0.0"],
        cwd="/workspace/frontend",
        env=frontend_env
    ).returncode or backend.wait())


if __name__ == "__main__":
    main()
