# Quantum Computing Thesis Chatbot

A full-stack RAG (Retrieval-Augmented Generation) chatbot built with Next.js, Material UI, FastAPI, LangChain, and Google Gemini. This chatbot answers questions about computer science thesis documents and research papers.

## Features

- 🤖 **Gemini-Powered**: Uses Google's Gemini Pro for chat and embeddings
- 📚 **RAG Architecture**: Vector search with pgvector in PostgreSQL
- 💬 **Streaming Responses**: Real-time token-by-token streaming
- 🌍 **Multi-language**: Responds in the same language as the user's question
- 📄 **Special Thesis Handling**: Recognizes `thesis.pdf` with special metadata
- 🎨 **Modern UI**: ChatGPT-like interface with Material UI

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Material UI (MUI)
- React Hooks for state management

### Backend
- FastAPI
- LangChain
- Google Gemini Pro (chat model)
- Google Embedding Model (embedding-001)
- PostgreSQL with pgvector
- Pydantic Settings

## Prerequisites

- Node.js 18+
- Python 3.10+
- Docker and Docker Compose
- Google API Key (for Gemini)

## Setup Instructions

### 1. Environment Configuration

#### Backend
Create a `.env` file in the `backend/` directory (use `backend/ENV_EXAMPLE` as reference):

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=thesis_bot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
GOOGLE_API_KEY=AIza...your-google-api-key-here
```

#### Frontend
Create a `.env.local` file in the `frontend/` directory (use `frontend/ENV_EXAMPLE` as reference):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Start PostgreSQL with pgvector

```bash
docker-compose up -d
```

This will start a PostgreSQL database with the pgvector extension on port 5432.

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or if using a virtual environment (recommended):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Ingest Documents

Place your PDF documents in the `data/pdfs/` directory. Make sure your thesis is named `thesis.pdf` for special handling.

```bash
cd backend
python ingest.py
```

This will:
- Load all PDFs from `data/pdfs/`
- Split them into chunks
- Generate embeddings using Gemini
- Store them in PostgreSQL

### 5. Start the Backend

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### 6. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 7. Start the Frontend

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Type your question in the chat input
3. Press Enter or click the send button
4. Watch the AI stream its response in real-time

The chatbot will:
- Answer questions based on your ingested documents
- Remember conversation history (stored per session in LocalStorage)
- Respond in the same language as your question

## Project Structure

```
.
├── backend/
│   ├── config.py          # Pydantic settings configuration
│   ├── ingest.py          # PDF ingestion script
│   ├── rag_chain.py       # RAG chain logic
│   ├── main.py            # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── ENV_EXAMPLE        # Environment variable template
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # Main chat UI
│   │   │   └── ThinkingIndicator.tsx # Loading animation
│   │   ├── hooks/
│   │   │   └── useChat.ts           # Chat logic hook
│   │   └── page.tsx                 # Main page
│   ├── ENV_EXAMPLE        # Environment variable template
│   └── package.json
├── data/
│   └── pdfs/              # Place your PDF documents here
└── docker-compose.yml     # PostgreSQL + pgvector setup
```

## API Endpoints

### POST `/chat`
Stream chat responses based on user input.

**Request:**
```json
{
  "message": "What is quantum computing?",
  "session_id": "uuid-here"
}
```

**Response:** Stream of text chunks

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Configuration

### Gemini Models
- **Chat Model**: `gemini-pro`
- **Embedding Model**: `models/embedding-001`

You can change these in `backend/rag_chain.py` and `backend/ingest.py`.

### Vector Store
The vector store uses PostgreSQL with pgvector extension. Collection name is `thesis_docs`.

### Chat History
Chat history is stored in PostgreSQL in the `chat_history` table, tied to the session ID.

## Troubleshooting

### Database Connection Issues
Make sure Docker is running and PostgreSQL is accessible:
```bash
docker ps
```

### Import Errors
Ensure all dependencies are installed:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend API Connection
Check that `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend URL.

## License

MIT
