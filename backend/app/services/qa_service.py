from langchain_openai import ChatOpenAI
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from app.config import settings
from app.services.vectorstore_service import load_vectorstore, get_retriever
from app.models.schemas import UsedChunk

def ask_question(question: str):
    # Load vectorstore and retriever
    vectordb = load_vectorstore()
    base_retriever = get_retriever(vectordb)
    
    # Create LLM for compression (currently OpenAI). If other providers get enabled later,
    # this branch can be extended accordingly.
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY no configurada")
    llm = ChatOpenAI(model=settings.model_name, openai_api_key=settings.openai_api_key)
    compressor = LLMChainExtractor.from_llm(llm)
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever,
    )
    
    # Get compressed documents
    compressed_docs = compression_retriever.invoke(question)
    
    # Build context
    context = "\n\n".join(doc.page_content for doc in compressed_docs)
    
    # Build prompt
    prompt = f"""
You are an assistant that answers in Spanish.

Context:
{context}

Question: {question}

Answer in a concise and clear way in Spanish.
"""
    
    # Get answer
    answer = llm.invoke(prompt).content
    
    # Prepare used chunks
    used_chunks = [
        UsedChunk(
            id=f"doc_{i}",
            content_preview=doc.page_content[:100] + "..." if len(doc.page_content) > 100 else doc.page_content
        )
        for i, doc in enumerate(compressed_docs)
    ]
    
    return answer, used_chunks
