.PHONY: help setup install run dev test clean docker-build docker-up docker-down docker-dev docker-logs bruno-test

# Default target
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Environment setup
setup: ## Complete project setup (venv, install deps, copy env)
	python3 -m venv venv
	@echo "✅ Virtual environment created"
	@echo "Run 'source venv/bin/activate' to activate it"
	$(MAKE) install
	@if [ ! -f .env ]; then cp .env.example .env && echo "✅ Created .env file from template"; fi

install: ## Install Python dependencies
	pip install --upgrade pip
	pip install -r requirements.txt
	@echo "✅ Dependencies installed"

install-dev: ## Install development dependencies
	pip install --upgrade pip
	pip install -r requirements.txt
	pip install pytest pytest-asyncio pytest-cov black flake8 mypy
	@echo "✅ Development dependencies installed"

# Local development
run: ## Run the API server locally
	python run.py

dev: ## Run the API with auto-reload
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Testing
test: ## Run tests
	pytest tests/ -v

test-cov: ## Run tests with coverage
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term

bruno-test: ## Run Bruno API tests
	@echo "Running Bruno tests..."
	@echo "Make sure the API is running first (make run or make docker-up)"
	@cd bruno-tests && npx @usebruno/cli run --env local

bruno-test-docker: ## Run Bruno tests against Docker
	@echo "Running Bruno tests against Docker..."
	@cd bruno-tests && npx @usebruno/cli run --env docker

lint: ## Run linting
	flake8 app/ --max-line-length=100 --ignore=E203,W503
	black app/ --check

format: ## Format code with black
	black app/

# Docker commands
docker-build: ## Build Docker image
	docker build -t where2meet-api:latest .
	@echo "✅ Docker image built"

docker-build-dev: ## Build development Docker image
	docker build -f Dockerfile.dev -t where2meet-api:dev .
	@echo "✅ Development Docker image built"

docker-up: ## Start services with Docker Compose
	docker-compose up -d
	@echo "✅ Services started"
	@echo "API available at http://localhost:8000"
	@echo "API docs at http://localhost:8000/api/docs"

docker-down: ## Stop Docker Compose services
	docker-compose down
	@echo "✅ Services stopped"

docker-dev: ## Start development services with hot reload
	docker-compose -f docker-compose.dev.yml up

docker-dev-build: ## Build and start development services
	docker-compose -f docker-compose.dev.yml up --build

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-logs-api: ## Show only API logs
	docker-compose logs -f api

docker-clean: ## Clean Docker resources
	docker-compose down -v
	docker rmi where2meet-api:latest where2meet-api:dev 2>/dev/null || true
	@echo "✅ Docker resources cleaned"

# Database (for future Supabase integration)
db-migrate: ## Run database migrations
	@echo "Database migrations not yet implemented"

db-seed: ## Seed database with sample data
	@echo "Database seeding not yet implemented"

# Utility commands
clean: ## Clean cache and temporary files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".DS_Store" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	@echo "✅ Cleaned cache and temporary files"

check-env: ## Check if required environment variables are set
	@echo "Checking environment configuration..."
	@if [ -f .env ]; then \
		echo "✅ .env file exists"; \
	else \
		echo "❌ .env file not found. Run 'make setup' to create it"; \
	fi

deps-update: ## Update dependencies to latest versions
	pip list --outdated
	@echo ""
	@echo "To update a specific package: pip install --upgrade package_name"

api-docs: ## Open API documentation in browser
	@echo "Opening API documentation..."
	@python -m webbrowser "http://localhost:8000/api/docs"

# Quick start commands
quick-start: setup run ## Quick start: setup and run

quick-docker: docker-build docker-up docker-logs ## Quick start with Docker

# Status checks
status: ## Check service status
	@echo "Checking service status..."
	@curl -s http://localhost:8000/api/health/ | python -m json.tool || echo "❌ API is not running"

status-ready: ## Check service readiness
	@echo "Checking service readiness..."
	@curl -s http://localhost:8000/api/health/ready | python -m json.tool || echo "❌ API is not ready"