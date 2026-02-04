# Quantum Computing Thesis Chatbot

A high-performance, full-stack RAG (Retrieval-Augmented Generation) chatbot built with Next.js, Material UI, FastAPI, LangChain, and Google Gemini. This chatbot intelligently answers questions about your computer science thesis and supporting research papers with source attribution and LaTeX rendering.

## ✨ Features

### 🤖 AI & Intelligence
- **Gemini 2.5 Flash Powered**: Uses Google's latest Gemini model for fast, accurate responses
- **Smart Document Prioritization**: Automatically prioritizes `thesis.pdf` (70% of context) over supporting documents (30%)
- **Source Attribution**: Clearly shows which document each piece of information came from (📘 [THESIS] or 📄 [filename])
- **Multi-language**: Responds in the same language as the user's question (English/Portuguese)

### 📚 Document Management
- **Multi-Document Support**: Add unlimited PDFs - all automatically indexed
- **Intelligent Retrieval**: Searches 20 chunks, uses top 10 with thesis prioritization
- **Special Thesis Handling**: `thesis.pdf` is automatically recognized and prioritized

### ⚡ Performance
- **2-3x Faster**: Connection pooling and model caching for sub-second responses
- **Real Streaming**: True token-by-token streaming for fluid UX
- **Optimized Vector Search**

### 🎨 Modern UI/UX
- **Quantum Theme**: Deep purple & cyan gradients with animated background
- **Glassmorphism**: Frosted glass effects and smooth animations
- **Dark Mode**: Beautiful dark theme across entire site
- **Fully Responsive**: Perfect mobile experience with internal scrolling
- **LaTeX & Markdown**: Rich formatting with equations, tables, and code blocks
- **Persistent History**: Chat history survives page reloads

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router) with TypeScript
- **Material UI (MUI)** with custom "Quantum" theme
- **React Hooks** for state management
- **KaTeX** for LaTeX math rendering
- **react-markdown** with remark-math & rehype-katex
- **Custom animations** and glassmorphism effects

### Backend
- **FastAPI** with async/await
- **LangChain** for RAG orchestration
- **Google Gemini 2.5 Flash** (chat model)
- **Google Embedding-001** (embeddings)
- **PostgreSQL** with pgvector extension
- **psycopg + psycopg-pool** for connection pooling
- **Pydantic Settings** for configuration

### Infrastructure
- **Docker Compose** for PostgreSQL
- **Makefile** for common tasks
- **Connection pooling** for 95% faster DB queries
- **Model caching** for 50% faster responses

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (3.12 recommended)
- **Docker** and Docker Compose
- **Google API Key** (for Gemini) - [Get one here](https://makersuite.google.com/app/apikey)

## 🚀 Quick Start

### Option 1: Using Makefile (Recommended)

```bash
# 1. Clone and navigate to project
cd quantum-computing-thesis-chatbot

# 2. Start PostgreSQL
docker-compose up -d

# 3. Setup environment files (see below)
# Create backend/.env and frontend/.env.local

# 4. Install all dependencies
make setup

# 5. Ingest documents
make ingest

# 6. Run both backend and frontend
make dev
```

### Option 2: Manual Setup

#### 1. Environment Configuration

**Backend** - Create `backend/.env`:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=thesis_bot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Google AI
GOOGLE_API_KEY=your-google-api-key-here

# Performance (optional - defaults shown)
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
VECTOR_SEARCH_K=20
RETRIEVAL_TOP_K=10

# CORS (optional - default: *)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Frontend** - Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 2. Start PostgreSQL with pgvector

```bash
docker-compose up -d
```

This starts PostgreSQL with pgvector extension on port 5432.

#### 3. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

> **Note**: Using a virtual environment is recommended:
> ```bash
> python -m venv venv
> source venv/bin/activate  # Windows: venv\Scripts\activate
> ```

#### 4. Add Your Documents

Place PDF files in `backend/documents/` (or `backend/data/pdfs/`):

```bash
cd backend/documents/
# Copy your thesis (MUST be named thesis.pdf)
cp ~/path/to/your/thesis.pdf thesis.pdf

# Add supporting papers (any name)
cp ~/path/to/paper1.pdf .
cp ~/path/to/paper2.pdf .
```

> **Important**: Your main thesis MUST be named `thesis.pdf` for automatic prioritization!

#### 5. Ingest Documents

```bash
cd backend
python ingest.py
```

This will:
- ✅ Load all PDFs from `data/pdfs`
- ✅ Mark `thesis.pdf` as primary source
- ✅ Split into optimized chunks
- ✅ Generate embeddings via Gemini
- ✅ Store in PostgreSQL with metadata

#### 6. Start the Application

**Backend** (Terminal 1):
```bash
cd backend
uvicorn main:app --reload
# API at http://localhost:8000
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# App at http://localhost:3000
```

## 💬 Usage

1. **Open** `http://localhost:3000` in your browser
2. **Type** your question in the chat input
3. **Send** via Enter or click button
4. **Watch** the AI stream its response in real-time with source attribution

### What the Chatbot Does

✅ **Prioritizes your thesis**
✅ **Cites sources**: Shows 📘 [THESIS] or 📄 [filename.pdf] for each piece of info  
✅ **Remembers context**: Chat history persists across page reloads  
✅ **Matches language**: Responds in English or Portuguese based on your question  
✅ **Renders LaTeX**: Displays equations like $E = mc^2$ beautifully  
✅ **Falls back gracefully**: Uses general knowledge when docs don't have the answer  

### Example Questions

**About your thesis:**
```
What is the main contribution of this thesis?
Explain equation 13 from the thesis
What algorithm does the thesis propose?
```

**Comparative:**
```
How does my thesis approach differ from other papers?
Compare QAOA implementations across all documents
```

**General (with context):**
```
What is quantum computing? (uses all docs + general knowledge)
Explain the QAOA algorithm (prioritizes thesis)
```

## 📁 Project Structure

```
.
├── backend/
│   ├── config.py                   # Settings with connection pooling
│   ├── main.py                     # FastAPI app with streaming
│   ├── rag_chain.py                # RAG logic with caching
│   ├── ingest.py                   # Document ingestion script
│   ├── benchmark.py                # Performance testing script
│   ├── requirements.txt            # Python dependencies
│   ├── data/pdfs/                  # 📚 Put your PDFs here!
│   │   └── thesis.pdf              # Your main thesis (REQUIRED)
│   ├── ADDING_DOCUMENTS.md         # How to add more PDFs
│   └── OPTIMIZATIONS_APPLIED.md    # Performance guide
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx   # Main UI with animations
│   │   │   ├── MarkdownRenderer.tsx # LaTeX + Markdown
│   │   │   └── ThinkingIndicator.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts          # Chat logic with history
│   │   ├── theme-registry.tsx      # Quantum theme
│   │   ├── globals.css             # Dark mode & animations
│   │   └── page.tsx                # Main page
│   └── package.json
├── Makefile                         # Common commands
├── docker-compose.yml               # PostgreSQL + pgvector
├── CHANGELOG.md                     # Version history
├── PERFORMANCE_OPTIMIZATIONS.md     # Technical details
└── README.md                        # This file
```

## 🔧 Makefile Commands

```bash
make help              # Show all available commands
make setup             # Install all dependencies
make run-backend       # Start FastAPI server
make run-frontend      # Start Next.js dev server
make ingest            # Ingest documents into vector store
make test-backend      # Run health checks and tests
make health-check      # Quick API health check
make clean             # Clean Python cache files
```

## 📡 API Endpoints

### `POST /chat`
Stream chat responses with source attribution.

**Request:**
```json
{
  "message": "What is the main algorithm in the thesis?",
  "session_id": "user-session-uuid"
}
```

**Response:** Server-Sent Events stream
```
📘 [THESIS] thesis.pdf
The main algorithm is QAOA (Quantum Approximate Optimization Algorithm)...

---

📄 [paper_quantum.pdf]
QAOA was introduced by Farhi et al. in 2014...
```

### `GET /chat/history/{session_id}`
Retrieve chat history for a session.

**Response:**
```json
{
  "messages": [
    {"role": "user", "content": "What is QAOA?"},
    {"role": "assistant", "content": "QAOA is..."}
  ]
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{"status": "ok"}
```

### `GET /debug/check-docs`
Verify documents are ingested.

**Response:**
```json
{
  "status": "ok",
  "documents_found": true,
  "sample_doc_length": 1523
}
```

## ⚙️ Configuration

### Environment Variables

**Performance Tuning** (`backend/.env`):

```env
# Connection Pool (default: 10)
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Document Retrieval
VECTOR_SEARCH_K=20      # Total chunks to search
RETRIEVAL_TOP_K=10      # Final chunks to use (70% thesis, 30% others)

# CORS (default: *)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Models

- **Chat**: `gemini-2.5-flash-lite` (fast, high-quality)
- **Embeddings**: `models/embedding-001` (Google)
- **Temperature**: `0.3` (balanced between accuracy and creativity)

Change in `backend/rag_chain.py` lines 45-48.

### Storage

- **Vector Store**: PostgreSQL + pgvector, collection `thesis_docs`
- **Chat History**: PostgreSQL table `chat_history`
- **Session Management**: Client-side with localStorage

### Document Prioritization

Edit `backend/rag_chain.py` line 75 to adjust thesis/other document ratio:

```python
# Current: 70% thesis, 30% others
thesis_target = max(int(settings.RETRIEVAL_TOP_K * 0.7), 1)

# More thesis focus (80/20):
thesis_target = max(int(settings.RETRIEVAL_TOP_K * 0.8), 1)

# Balanced (50/50):
thesis_target = max(int(settings.RETRIEVAL_TOP_K * 0.5), 1)
```

## 📊 Performance Benchmarking

Test your setup's performance:

```bash
cd backend
python benchmark.py
```

**Expected Results:**
- First token: 500-1000ms
- Total response: 2-4s
- Concurrent (5 users): ~5 req/s

## 📚 Documentation

- [`CHANGELOG.md`](CHANGELOG.md) - Version history and features

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via Issues
- Suggest features via Issues
- Submit Pull Requests

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---
