from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_postgres import PostgresChatMessageHistory
from langchain_core.documents import Document
import psycopg
from psycopg_pool import AsyncConnectionPool
from functools import lru_cache
from config import get_settings

settings = get_settings()

# Cache vector store and embeddings (singleton pattern)
_vector_store = None
_embeddings = None

@lru_cache(maxsize=1)
def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Get Gemini embeddings model. Uses gemini-embedding-001 (models/embedding-001 is deprecated)."""
    return GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=settings.GOOGLE_API_KEY,
    )

def get_vector_store():
    """Cached vector store instance"""
    global _vector_store
    if _vector_store is None:
        _vector_store = PGVector(
            embeddings=get_embeddings(),
            collection_name="thesis_docs",
            connection=settings.DATABASE_URL,
            use_jsonb=True,
        )
    return _vector_store

def format_docs_with_sources(docs: List[Document]) -> str:
    """Format documents with clear source attribution"""
    formatted_parts = []
    
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "unknown")
        is_thesis = doc.metadata.get("is_thesis", False)
        
        # Mark thesis documents clearly
        if is_thesis or source == "thesis":
            source_label = "[Source: THESIS]"
        else:
            source_label = f"[Source: {source}]"
        
        formatted_parts.append(f"{source_label}\n{doc.page_content}")
    
    return "\n\n---\n\n".join(formatted_parts)

def get_rag_chain(session_id: str):
    from langchain_core.messages import BaseMessage
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.3,
        streaming=True,  # Explicit streaming
        convert_system_message_to_human=True 
    )
    
    vector_store = get_vector_store()
    
    def retrieve_docs(query: str):
        """Retrieve documents with strong thesis.pdf priority"""
        # Retrieve more documents to have good context from multiple sources
        all_docs = vector_store.similarity_search(query, k=settings.VECTOR_SEARCH_K)
        
        # Separate thesis and other documents
        thesis_docs = []
        other_docs = []
        
        for doc in all_docs:
            if doc.metadata.get("is_thesis") or doc.metadata.get("source") == "thesis":
                thesis_docs.append(doc)
            else:
                other_docs.append(doc)
        
        # Strategy: Prioritize thesis heavily (70% thesis, 30% other sources)
        selected_docs = []
        
        # Calculate ideal split
        thesis_target = max(int(settings.RETRIEVAL_TOP_K * 0.7), 1)  # At least 70% from thesis
        other_target = settings.RETRIEVAL_TOP_K - thesis_target
        
        # Add thesis documents first
        selected_docs.extend(thesis_docs[:thesis_target])
        
        # If not enough thesis docs, fill with more from other sources
        if len(selected_docs) < thesis_target:
            other_target = settings.RETRIEVAL_TOP_K - len(selected_docs)
        
        # Add other documents
        selected_docs.extend(other_docs[:other_target])
        
        return selected_docs[:settings.RETRIEVAL_TOP_K]
    
    retriever = RunnableLambda(retrieve_docs)
    
    # Contextualize question based on chat history
    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
    )
    
    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    
    def get_question(input_dict: Dict[str, Any]) -> str:
        """Extract question from input (could be string or message)"""
        if isinstance(input_dict.get("input"), str):
            return input_dict["input"]
        elif hasattr(input_dict.get("input"), "content"):
            return input_dict["input"].content
        return str(input_dict.get("input", ""))
    
    def contextualized_question(input_dict: Dict[str, Any]) -> str:
        """Contextualize question if there's history, otherwise return as-is"""
        chat_history = input_dict.get("chat_history", [])
        question = get_question(input_dict)
        
        # Only contextualize if history has more than 2 messages (optimization)
        if chat_history and len(chat_history) > 2:
            contextualize_chain = contextualize_q_prompt | llm | StrOutputParser()
            return contextualize_chain.invoke({
                "input": question,
                "chat_history": chat_history[-4:]  # Only last 2 exchanges for speed
            })
        return question
    
    # Simplified and clearer system prompt
    system_prompt = (
        "You are an assistant specialized in a computer science thesis about quantum computing.\n\n"
        "**CONTEXT SOURCES:**\n"
        "- [Source: THESIS] = The main thesis document (HIGHEST PRIORITY)\n"
        "- [Source: filename.pdf] = Supporting research papers\n\n"
        "**IMPORTANT FORMATTING RULES:**\n"
        "1. When writing LaTeX equations (both inline $...$ and block $$...$$), NEVER include source citations or any text inside the math delimiters\n"
        "2. Write the complete equation first, then cite the source AFTER the equation closes\n"
        "3. Source citations should be on separate lines or at the end of paragraphs, NEVER inside formulas\n\n"
        "**Example of CORRECT formatting:**\n"
        "The cost function is:\n\n"
        "$$C(x) = -\\sum_{{i}} \\left( \\alpha DY'_{{i}} + \\beta \\frac{{1}}{{PVP'_{{i}}}} \\right) x_i$$\n\n"
        "This equation is from the thesis (Equation 13).\n\n"
        "**Example of WRONG formatting (DO NOT DO THIS):**\n"
        "$$C(x) = [THESIS] -\\sum_{{i}}...$$ ← NEVER put source tags inside equations!\n\n"
        "**How to cite sources:**\n"
        "- After presenting information from THESIS, you can mention it's from the thesis\n"
        "- After presenting information from other PDFs, mention the source file\n"
        "- Use clean, natural language for citations\n\n"
        "**Other formatting:**\n"
        "- Use Markdown for structure (lists, bold, italic)\n"
        "- Use LaTeX for equations: inline `$...$` or block `$$...$$`\n"
        "- Use Markdown tables when appropriate\n"
        "- Cite equation numbers from the thesis when relevant\n\n"
        "Answer in the same language as the question. Be detailed and accurate."
    )
    
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "Context: {context}\n\nQuestion: {input}"),
        ]
    )
    
    def format_context(input_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Format retrieved documents with sources and prepare for QA prompt"""
        docs = input_dict.get("context", [])
        formatted = format_docs_with_sources(docs)
        question = get_question(input_dict)
        return {
            "input": question,
            "chat_history": input_dict.get("chat_history", []),
            "context": formatted
        }
    
    # Chain: contextualize -> retrieve -> format -> answer
    rag_chain = (
        RunnablePassthrough.assign(
            context=RunnableLambda(contextualized_question) | retriever
        )
        | RunnableLambda(format_context)
        | qa_prompt
        | llm
    )
    
    return rag_chain

# Connection pool for database (reuse connections)
_connection_pool = None

async def get_connection_pool():
    """Get or create connection pool"""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = AsyncConnectionPool(
            conninfo=settings.ASYNC_DATABASE_URL,
            min_size=2,
            max_size=settings.DB_POOL_SIZE,
            open=True
        )
        # Wait for pool to be ready
        await _connection_pool.wait()
    return _connection_pool

async def get_session_history(session_id: str):
    """Get chat history using connection pool"""
    pool = await get_connection_pool()
    async_connection = await pool.getconn()
    
    return PostgresChatMessageHistory(
        "chat_history",  # table_name (positional)
        session_id,      # session_id (positional)
        async_connection=async_connection  # keyword argument
    )
