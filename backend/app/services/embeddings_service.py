from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from app.config import settings

def create_embeddings():
    # Read the file
    with open(settings.data_file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap
    )
    chunks = text_splitter.split_text(text)
    
    # Create embeddings
    embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
    
    # Create and persist vector store
    vectordb = Chroma.from_texts(
        texts=chunks,
        embedding=embeddings,
        persist_directory=settings.vector_db_path,
    )
    
    return len(chunks)