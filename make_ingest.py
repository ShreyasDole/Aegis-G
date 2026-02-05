#!/usr/bin/env python3
"""
Digest generation script using gitingest.
Development utility for creating code digests for the CyberSec/Aegis-G project.
"""

import logging
import os
import shutil
import site
import subprocess
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def find_gitingest():
    """Find the gitingest executable."""
    # Try finding in PATH first
    gitingest_path = shutil.which("gitingest")
    if gitingest_path:
        return gitingest_path
    
    # Try user Scripts folder (Windows pip user installs)
    user_scripts = site.getusersitepackages().replace("site-packages", "Scripts")
    gitingest_exe = os.path.join(user_scripts, "gitingest.exe")
    if os.path.exists(gitingest_exe):
        return gitingest_exe
    
    # Try without .exe extension (Unix)
    gitingest_unix = os.path.join(user_scripts, "gitingest")
    if os.path.exists(gitingest_unix):
        return gitingest_unix
    
    raise FileNotFoundError("gitingest executable not found. Install with: pip install gitingest")


def generate_digest_cli(
    source, output_file="digest.txt", exclude_exts=None, is_frontend=False
):
    gitingest_cmd = find_gitingest()
    cmd = [gitingest_cmd, source, "-o", output_file]

    # Frontend-specific exclusions when processing frontend folder
    if is_frontend:
        exclusions = [
            # Build and cache directories
            "node_modules",
            "node_modules/*",
            ".next",
            ".next/*",
            "out",
            "build",
            "dist",
            ".cache",
            # Generated files
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "*.lock",
            ".tsbuildinfo",
            "*.tsbuildinfo",
            # Test and coverage
            "coverage",
            "__tests__/coverage",
            ".nyc_output",
            # Static assets (images, fonts, etc.)
            "public/images",
            "public/fonts",
            "public/*.ico",
            "public/*.png",
            "public/*.svg",
            # IDE and system files
            ".vscode",
            ".idea",
            ".DS_Store",
            # Environment files
            ".env",
            ".env.*",
            # Temporary files
            "*.log",
            "npm-debug.log*",
            "yarn-debug.log*",
            "yarn-error.log*",
            # Next.js specific
            "next-env.d.ts",
            ".vercel",
            ".netlify",
        ]
    else:
        # Default exclusions for backend/full project
        exclusions = [
            # Python cache and bytecode
            "__pycache__",
            "__pycache__/*",
            "*/__pycache__",
            "*/__pycache__/*",
            "**/__pycache__/**",
            "*.pyc",
            "*.pyo",
            "*.pyd",
            ".Python",
            "*.so",
            # Virtual environments
            "venv",
            "venv/*",
            ".venv",
            ".venv/*",
            "env",
            "env/*",
            ".env",
            "ENV",
            "env.bak",
            "venv.bak",
            # Testing and coverage
            ".pytest_cache",
            ".pytest_cache/*",
            ".coverage",
            "htmlcov",
            "htmlcov/*",
            ".tox",
            ".nox",
            # Distribution / packaging
            "build",
            "build/*",
            "dist",
            "dist/*",
            "*.egg-info",
            ".eggs",
            # Database files
            "*.db",
            "*.sqlite",
            "*.sqlite3",
            "cybersec.db",
            "cybersec.db-shm",
            "cybersec.db-wal",
            # Version control
            ".git",
            ".gitignore",
            ".gitattributes",
            # IDE and editor files
            ".vscode",
            ".vscode/*",
            ".idea",
            ".idea/*",
            "*.swp",
            "*.swo",
            "*.swn",
            ".DS_Store",
            "Thumbs.db",
            "desktop.ini",
            # Logs
            "*.log",
            "logs",
            "logs/*",
            # Environment files (keep .example)
            ".env",
            ".env.local",
            ".env.*.local",
            ".env.production",
            ".env.development",
            # Docker volumes and cache
            ".dockerignore",
            # Node.js (for frontend within project)
            "node_modules",
            "node_modules/*",
            "*/node_modules",
            "*/node_modules/*",
            "**/node_modules/**",
            "frontend/node_modules",
            "frontend/node_modules/*",
            "frontend/.next",
            "frontend/.next/*",
            "frontend/.next/**",
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "*.lock",
            ".next",
            ".next/*",
            "out",
            # Build artifacts
            "build-manifest.json",
            "app-build-manifest.json",
            "fallback-build-manifest.json",
            "next-server.js.nft.json",
            "export-marker.json",
            "images-manifest.json",
            "prerender-manifest.json",
            "routes-manifest.json",
            "required-server-files.json",
            "react-loadable-manifest.json",
            "BUILD_ID",
            "trace",
            # Deployment files (can be included if needed, but often verbose)
            "deployment/Dockerfile.*",
            "deployment/docker-compose.*",
            # Temporary and scratch files
            "*.tmp",
            "*.temp",
            "tmp",
            "temp",
            # macOS
            ".DS_Store",
            ".AppleDouble",
            ".LSOverride",
            # Windows
            "Thumbs.db",
            "ehthumbs.db",
            "Desktop.ini",
            "$RECYCLE.BIN",
            # Alembic cache
            "*.pyc",
            "alembic/__pycache__",
            "migrations/__pycache__",
            # MyPy
            ".mypy_cache",
            ".dmypy.json",
            "dmypy.json",
            # Type checking
            ".pyre",
            ".pytype",
            # Jupyter
            ".ipynb_checkpoints",
            # Data files (if you have test data directories)
            "data/*.csv",
            "data/*.json",
            "data/test_*",
            # Documentation that might be too large
            # "docs/_build",
            # Archives
            "*.zip",
            "*.tar",
            "*.tar.gz",
            "*.rar",
            "*.7z",
            # Large media files
            "*.mp4",
            "*.mov",
            "*.avi",
            "*.wmv",
            "*.png",
            "*.jpg",
            "*.jpeg",
            "*.gif",
            "*.bmp",
            "*.ico",
            "*.svg",
            # PDF and documents
            "*.pdf",
            "*.doc",
            "*.docx",
            "*.xls",
            "*.xlsx",
            "*.ppt",
            "*.pptx",
        ]

    if exclude_exts:
        # Format extensions as "*.ext" and add to exclusions
        exclusions.extend(f"*{ext}" for ext in exclude_exts)

    if is_frontend:
        # Include only relevant frontend code files
        include_patterns = [
            "*.tsx",
            "*.ts",
            "*.jsx",
            "*.js",
            "*.css",
            "*.scss",
            "*.sass",
            "*.less",
            "*.module.css",
            "*.module.scss",
            "*.json",  # For configuration files
            "*.html",
            "*.md",  # For documentation
        ]
        cmd += ["-i", ",".join(include_patterns)]

    if exclusions:
        patterns = ",".join(exclusions)
        cmd += ["-e", patterns]

    log.info(f"Running: {' '.join(cmd)}")

    try:
        subprocess.run(cmd, check=True)
        log.info(f"[OK] Digest written to {output_file}")
    except subprocess.CalledProcessError as e:
        log.error(f"[ERROR] Error during gitingest execution: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        log.error(
            "Usage: python make_ingest.py <path_or_url> [output_file] [--frontend] [excluded_exts...]"
        )
        log.info("\nExamples:")
        log.info("  python make_ingest.py . digest.txt")
        log.info("  python make_ingest.py ./app backend_digest.txt")
        log.info("  python make_ingest.py ./frontend frontend_digest.txt --frontend")
        log.info("  python make_ingest.py . full_digest.txt .env .md")
        sys.exit(1)

    source = sys.argv[1]
    output_file = "digest.txt"
    exclude_exts = []
    is_frontend = False

    # Process arguments
    args = sys.argv[2:]
    while args:
        arg = args.pop(0)
        if arg == "--frontend":
            is_frontend = True
        elif arg.startswith("."):
            exclude_exts.append(arg)
        else:
            output_file = arg

    # Check if the source path contains 'frontend' and automatically set is_frontend
    if not is_frontend and (
        "frontend" in source.lower() or "front-end" in source.lower()
    ):
        is_frontend = True
        log.info("Detected frontend directory, using frontend-specific processing...")

    generate_digest_cli(source, output_file, exclude_exts, is_frontend)

