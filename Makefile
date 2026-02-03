.PHONY: help install-backend install-frontend run-backend run-frontend dev setup clean

help:
	@echo "Available commands:"
	@echo "  make install-backend    - Install Python dependencies"
	@echo "  make install-frontend   - Install Node.js dependencies"
	@echo "  make setup              - Install all dependencies"
	@echo "  make run-backend        - Run FastAPI backend server"
	@echo "  make run-frontend       - Run Next.js frontend server"
	@echo "  make dev                - Run both backend and frontend"
	@echo "  make ingest             - Ingest PDF documents into vector store"
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

clean:
	@echo "Cleaning Python cache files..."
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	@echo "Clean complete!"
