from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import AsyncIterable
from fastapi.responses import StreamingResponse
import asyncio
import json
from rag_chain import get_rag_chain, get_session_history
from langchain_core.runnables.history import RunnableWithMessageHistory
import psycopg
from config import get_settings

settings = get_settings()

app = FastAPI(title="Thesis Chatbot API")

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        # Convert SQLAlchemy-style URL to psycopg connection string
        db_url = settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://")
        async_connection = await psycopg.AsyncConnection.connect(db_url)
        
        # Create the chat_history table if it doesn't exist
        # Schema matches PostgresChatMessageHistory expectations
        async with async_connection.cursor() as cursor:
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    message JSONB NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
            """)
            await async_connection.commit()
        
        await async_connection.close()
        print("Database tables initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize database tables: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ORIGINS != "*",  # Only allow credentials if not using wildcard
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str

async def generate_chat_response(message: str, session_id: str) -> AsyncIterable[str]:
    from langchain_core.messages import HumanMessage
    from langchain_core.runnables.history import RunnableWithMessageHistory
    
    rag_chain = get_rag_chain(session_id)
    
    # Get the history object synchronously (await it first)
    history = await get_session_history(session_id)
    
    # Factory function that returns the history object
    def get_history(session_id: str):
        return history
    
    chain_with_history = RunnableWithMessageHistory(
        rag_chain,
        get_history,
        input_messages_key="input",
        history_messages_key="chat_history",
    )
    
    async for chunk in chain_with_history.astream(
        {"input": HumanMessage(content=message)},
        config={"configurable": {"session_id": session_id}}
    ):
        # Extract content from message chunks
        content = None
        
        if hasattr(chunk, 'content'):
            content = chunk.content
        elif isinstance(chunk, dict):
            # Handle different dict structures
            if 'content' in chunk:
                content = chunk['content']
            elif 'output' in chunk:
                content = chunk['output']
        elif isinstance(chunk, str):
            content = chunk
        
        # Convert content to string if needed
        if content is not None:
            if isinstance(content, list):
                # Join list items (e.g., for multi-part content)
                content = "".join(str(item) for item in content)
            elif not isinstance(content, str):
                content = str(content)
            
            if content:
                yield content

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    return StreamingResponse(
        generate_chat_response(request.message, request.session_id),
        media_type="text/plain"
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/debug/check-docs")
async def check_documents():
    """Debug endpoint to check if documents are in the vector store"""
    from rag_chain import get_vector_store
    
    vector_store = get_vector_store()
    # Try to retrieve some documents
    try:
        test_docs = vector_store.similarity_search("quantum computing", k=1)
        return {
            "status": "ok",
            "documents_found": len(test_docs) > 0,
            "sample_doc_length": len(test_docs[0].page_content) if test_docs else 0
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    try:
        history = await get_session_history(session_id)
        messages = await history.aget_messages()
        
        # Convert messages to simple format
        history_list = []
        for msg in messages:
            if hasattr(msg, 'content'):
                role = 'user' if msg.__class__.__name__ == 'HumanMessage' else 'assistant'
                history_list.append({
                    "role": role,
                    "content": msg.content
                })
        
        return {"messages": history_list}
    except Exception as e:
        return {"messages": [], "error": str(e)}
