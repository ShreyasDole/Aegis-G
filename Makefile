.PHONY: up down restart clean-db mock-stream test-ai logs

# Start all services
up:
	@echo "🛡️ Starting Aegis-G Defense Grid..."
	docker-compose -f deployment/docker-compose.yml up -d
	@echo "✅ Services started. Access dashboard at http://localhost:3000"

# Stop all services
down:
	@echo "🛑 Stopping Aegis-G services..."
	docker-compose -f deployment/docker-compose.yml down

# Restart services
restart: down up

# Clean databases (WARNING: This will delete all data)
clean-db:
	@echo "🗑️ Cleaning databases..."
	docker-compose -f deployment/docker-compose.yml exec db psql -U aegis -d aegis -c "TRUNCATE threats, reports, ledger_entries CASCADE;"
	docker-compose -f deployment/docker-compose.yml exec neo4j cypher-shell -u neo4j -p password "MATCH (n) DETACH DELETE n;"
	@echo "✅ Databases cleaned"

# Start mock data stream (IMPORTANT: Injects fake threats)
mock-stream:
	@echo "🚨 Starting mock threat stream..."
	@echo "⚠️  This will inject fake threats into the system"
	python scripts/mock_stream.py

# Test Gemini API connectivity
test-ai:
	@echo "🤖 Testing Gemini API connectivity..."
	python scripts/test_gemini.py

# View logs
logs:
	docker-compose -f deployment/docker-compose.yml logs -f

# Build images
build:
	docker-compose -f deployment/docker-compose.yml build

# Run database migrations
migrate:
	@echo "📊 Running database migrations..."
	docker-compose -f deployment/docker-compose.yml exec backend alembic upgrade head

# Create new migration
migration:
	@read -p "Enter migration name: " name; \
	docker-compose -f deployment/docker-compose.yml exec backend alembic revision --autogenerate -m "$$name"

