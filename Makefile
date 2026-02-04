.PHONY: help install-backend install-frontend run-backend run-frontend dev setup clean test-backend health-check

help:
	@echo "Available commands:"
	@echo "  make install-backend    - Install Python dependencies"
	@echo "  make install-frontend   - Install Node.js dependencies"
	@echo "  make setup              - Install all dependencies"
	@echo "  make run-backend        - Run FastAPI backend server"
	@echo "  make run-frontend       - Run Next.js frontend server"
	@echo "  make dev                - Run both backend and frontend"
	@echo "  make ingest             - Ingest PDF documents into vector store"
	@echo "  make test-backend       - Test backend health and performance"
	@echo "  make health-check       - Quick health check of backend API"
	@echo "  make clean              - Clean Python cache files"

install-backend:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

setup: install-backend install-frontend
	@echo "Setup complete!"

run-backend:
	@echo "Starting FastAPI backend server..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

run-frontend:
	@echo "Starting Next.js frontend server..."
	cd frontend && npm run dev

ingest:
	@echo "Ingesting documents..."
	cd backend && python ingest.py

test-backend:
	@echo "Testing backend performance..."
	@echo "\n📊 Health Check:"
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "❌ Backend not running"
	@echo "\n📄 Document Check:"
	@curl -s http://localhost:8000/debug/check-docs | python3 -m json.tool || echo "❌ Vector store not accessible"
	@echo "\n✅ Tests complete!"

health-check:
	@echo "🔍 Checking backend health..."
	@curl -s http://localhost:8000/health | python3 -m json.tool && echo "✅ Backend is healthy" || echo "❌ Backend is down"

clean:
	@echo "Cleaning Python cache files..."
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	@echo "Clean complete!"
