import os
import glob
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document
from config import get_settings

settings = get_settings()

def load_pdfs(directory: str) -> List[Document]:
    documents = []
    pdf_files = glob.glob(os.path.join(directory, "*.pdf"))
    
    for pdf_file in pdf_files:
        print(f"Loading {pdf_file}...")
        try:
            loader = PyPDFLoader(pdf_file)
            docs = loader.load()
            
            # Ensure text encoding is correct and clean up any encoding issues
            for doc in docs:
                # PyPDFLoader already handles encoding, but we ensure UTF-8
                if doc.page_content:
                    # Remove any problematic characters and ensure valid UTF-8
                    try:
                        # Try to encode/decode to ensure valid UTF-8
                        doc.page_content = doc.page_content.encode('utf-8', errors='ignore').decode('utf-8')
                    except:
                        pass  # If already valid, continue
                
                # Add metadata for thesis
                if os.path.basename(pdf_file) == "thesis.pdf":
                    doc.metadata["source"] = "thesis"
                    doc.metadata["is_thesis"] = True
                else:
                    # Store original filename in metadata
                    doc.metadata["source"] = os.path.basename(pdf_file)
            
            documents.extend(docs)
            print(f"  ✓ Loaded {len(docs)} pages from {os.path.basename(pdf_file)}")
        except Exception as e:
            print(f"  ✗ Error loading {pdf_file}: {e}")
            continue
    
    return documents

def ingest_documents():
    pdf_dir = "data/pdfs"
    if not os.path.exists(pdf_dir):
        print(f"Directory {pdf_dir} does not exist.")
        return

    print("Loading documents...")
    docs = load_pdfs(pdf_dir)
    
    if not docs:
        print("No documents found.")
        return

    print(f"Loaded {len(docs)} pages.")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    splits = text_splitter.split_documents(docs)
    print(f"Split into {len(splits)} chunks.")

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )
    
    # Connection string
    connection = settings.DATABASE_URL
    
    print("Indexing to Postgres...")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name="thesis_docs",
        connection=connection,
        use_jsonb=True,
    )
    
    vector_store.add_documents(splits)
    print("Ingestion complete!")

if __name__ == "__main__":
    ingest_documents()
