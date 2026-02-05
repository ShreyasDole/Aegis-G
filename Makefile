.PHONY: up down restart clean-db mock-stream test-ai logs test lint fmt

# ============================================
# 🛡️ AEGIS-G MAKEFILE
# ============================================

# ============================================
# Development Commands
# ============================================

# Start all services (development)
up:
	@echo "🛡️ Starting Aegis-G Defense Grid..."
	docker-compose -f deployment/docker-compose.yml up -d
	@echo "✅ Services started. Access dashboard at http://localhost:3000"

# Start base scaffold only
up-base:
	@echo "🛡️ Starting Aegis-G Base Scaffold..."
	docker-compose up -d
	@echo "✅ Base services started. Access at http://localhost:3000"

# Stop all services
down:
	@echo "🛑 Stopping Aegis-G services..."
	docker-compose -f deployment/docker-compose.yml down

# Restart services
restart: down up

# View logs
logs:
	docker-compose -f deployment/docker-compose.yml logs -f

# Build images
build:
	docker-compose -f deployment/docker-compose.yml build

# ============================================
# Production Commands
# ============================================

# Start production services
up-prod:
	@echo "🚀 Starting Aegis-G Production..."
	docker-compose -f deployment/docker-compose.prod.yml up -d
	@echo "✅ Production services started"

# Stop production services
down-prod:
	@echo "🛑 Stopping Aegis-G Production..."
	docker-compose -f deployment/docker-compose.prod.yml down

# Build production images
build-prod:
	@echo "🔨 Building production images..."
	docker-compose -f deployment/docker-compose.prod.yml build

# ============================================
# Database Commands
# ============================================

# Run database migrations
migrate:
	@echo "📊 Running database migrations..."
	docker-compose -f deployment/docker-compose.yml exec backend alembic upgrade head

# Create new migration
migration:
	@read -p "Enter migration name: " name; \
	docker-compose -f deployment/docker-compose.yml exec backend alembic revision --autogenerate -m "$$name"

# Clean databases (WARNING: This will delete all data)
clean-db:
	@echo "🗑️ Cleaning databases..."
	docker-compose -f deployment/docker-compose.yml exec db psql -U aegis -d aegis -c "TRUNCATE threats, reports, ledger_entries, users CASCADE;"
	docker-compose -f deployment/docker-compose.yml exec neo4j cypher-shell -u neo4j -p password "MATCH (n) DETACH DELETE n;"
	@echo "✅ Databases cleaned"

# ============================================
# Testing Commands
# ============================================

# Run all tests
test:
	@echo "🧪 Running tests..."
	pytest tests/ -v --tb=short

# Run tests with coverage
test-cov:
	@echo "🧪 Running tests with coverage..."
	pytest tests/ -v --cov=app --cov-report=term-missing --cov-report=html
	@echo "📊 Coverage report: htmlcov/index.html"

# Run only unit tests
test-unit:
	@echo "🧪 Running unit tests..."
	pytest tests/ -v -m unit

# Run only auth tests
test-auth:
	@echo "🔐 Running auth tests..."
	pytest tests/ -v -m auth

# ============================================
# Code Quality Commands
# ============================================

# Run linter
lint:
	@echo "🔍 Running linter..."
	ruff check app/ tests/

# Fix linting issues
lint-fix:
	@echo "🔧 Fixing linting issues..."
	ruff check app/ tests/ --fix

# Format code
fmt:
	@echo "✨ Formatting code..."
	black app/ tests/
	isort app/ tests/

# Type check
typecheck:
	@echo "📝 Running type checker..."
	mypy app/

# Security scan
security:
	@echo "🔒 Running security scan..."
	bandit -r app/ -ll
	safety check -r requirements.txt

# ============================================
# Utility Commands
# ============================================

# Start mock data stream (IMPORTANT: Injects fake threats)
mock-stream:
	@echo "🚨 Starting mock threat stream..."
	@echo "⚠️  This will inject fake threats into the system"
	python scripts/mock_stream.py

# Test Gemini API connectivity
test-ai:
	@echo "🤖 Testing Gemini API connectivity..."
	python scripts/test_gemini.py

# Install development dependencies
install-dev:
	@echo "📦 Installing development dependencies..."
	pip install -r requirements-test.txt

# Generate secret key
secret:
	@echo "🔑 Generating secret key..."
	@python -c "import secrets; print(secrets.token_hex(32))"

# ============================================
# Help
# ============================================

help:
	@echo "🛡️ Aegis-G Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make up          - Start development services"
	@echo "  make up-base     - Start base scaffold only"
	@echo "  make down        - Stop services"
	@echo "  make logs        - View logs"
	@echo "  make build       - Build images"
	@echo ""
	@echo "Production:"
	@echo "  make up-prod     - Start production services"
	@echo "  make down-prod   - Stop production services"
	@echo "  make build-prod  - Build production images"
	@echo ""
	@echo "Database:"
	@echo "  make migrate     - Run migrations"
	@echo "  make migration   - Create new migration"
	@echo "  make clean-db    - Clear all data (DANGEROUS)"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-cov    - Run tests with coverage"
	@echo "  make test-unit   - Run unit tests only"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint        - Run linter"
	@echo "  make fmt         - Format code"
	@echo "  make security    - Security scan"

