from app.config import settings
from app.services.ingestion_service import ingest_documents

def create_embeddings():
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY no configurada")

    sources = [settings.data_file_path]
    chunks, _, _ = ingest_documents(
        sources=sources,
        persist_directory=settings.vector_db_path,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        openai_api_key=settings.openai_api_key,
        reset=True,
    )
    return chunks
