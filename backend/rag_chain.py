from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_postgres import PostgresChatMessageHistory
from langchain_core.documents import Document
import psycopg
from config import get_settings

settings = get_settings()

def get_vector_store():
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )
    return PGVector(
        embeddings=embeddings,
        collection_name="thesis_docs",
        connection=settings.DATABASE_URL,
        use_jsonb=True,
    )

def format_docs(docs: List[Document]) -> str:
    return "\n\n".join(doc.page_content for doc in docs)

def get_rag_chain(session_id: str):
    from langchain_core.messages import BaseMessage
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.3,  # Lower temperature for more accurate, focused responses
        convert_system_message_to_human=True 
    )
    
    vector_store = get_vector_store()
    
    def retrieve_docs(query: str):
        """Synchronous document retrieval with thesis.pdf priority"""
        # Retrieve more documents to have better context
        try:
            # Try with scores first (if available)
            all_docs_with_scores = vector_store.similarity_search_with_score(query, k=15)
            all_docs = [doc for doc, score in all_docs_with_scores]
        except:
            # Fallback to regular search
            all_docs = vector_store.similarity_search(query, k=15)
        
        # Separate thesis and non-thesis documents
        thesis_docs = []
        other_docs = []
        
        for doc in all_docs:
            if doc.metadata.get("is_thesis") or doc.metadata.get("source") == "thesis":
                thesis_docs.append(doc)
            else:
                other_docs.append(doc)
        
        # Prioritize thesis documents: take up to 6 from thesis, fill rest with others
        selected_docs = []
        
        # Add thesis documents first (up to 6)
        selected_docs.extend(thesis_docs[:6])
        
        # Fill remaining slots with other documents
        remaining = 8 - len(selected_docs)
        selected_docs.extend(other_docs[:remaining])
        
        return selected_docs[:8]  # Return up to 8 documents
    
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
        
        if chat_history:
            contextualize_chain = contextualize_q_prompt | llm | StrOutputParser()
            return contextualize_chain.invoke({
                "input": question,
                "chat_history": chat_history
            })
        return question
    
    # Answer question with retrieved context
    system_prompt = (
        "You are an assistant for a computer science thesis about quantum computing. "
        "Your primary source is the thesis.pdf document, which should be prioritized when answering questions. "
        "Use the following pieces of retrieved context to provide detailed, accurate answers. "
        "When the context contains relevant information from thesis.pdf, make sure to emphasize and use that information. "
        "Provide comprehensive answers that explain concepts clearly.\n\n"
        "IMPORTANT: Answer priority:\n"
        "1. If the retrieved context contains relevant information, use it as the primary source and cite it.\n"
        "2. If the context is not relevant or insufficient, you can use your own knowledge to provide a helpful answer, "
        "but make it clear that the information is general knowledge and not specifically from the thesis documents.\n"
        "3. If the question is completely unrelated to quantum computing or computer science, politely redirect or explain the limitation.\n\n"
        "Answer in the same language as the user's question. "
        "Be thorough but concise, typically 3-5 sentences, but expand if needed for clarity.\n\n"
        "IMPORTANT FORMATTING INSTRUCTIONS:\n"
        "- Use Markdown formatting for your responses (headers, lists, bold, italic, etc.)\n"
        "- For mathematical formulas and equations, use LaTeX notation with inline math ($...$) or block math ($$...$$)\n"
        "- For tables, use Markdown table syntax\n"
        "- Use code blocks for code snippets\n"
        "- Format equations from the thesis exactly as they appear, using LaTeX notation\n"
        "- When referencing equations by number (e.g., 'Equação 13'), include the equation in LaTeX format"
    )
    
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "Context: {context}\n\nQuestion: {input}"),
        ]
    )
    
    def format_context(input_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Format retrieved documents and prepare for QA prompt"""
        docs = input_dict.get("context", [])
        formatted = format_docs(docs)
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

async def get_session_history(session_id: str):
    # Convert SQLAlchemy-style URL to psycopg connection string
    db_url = settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://")
    async_connection = await psycopg.AsyncConnection.connect(db_url)
    
    return PostgresChatMessageHistory(
        "chat_history",  # table_name (positional)
        session_id,      # session_id (positional)
        async_connection=async_connection  # keyword argument
    )
