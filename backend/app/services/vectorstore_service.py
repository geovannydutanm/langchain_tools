from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from app.config import settings

def load_vectorstore():
    embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
    vectordb = Chroma(
        embedding_function=embeddings,
        persist_directory=settings.vector_db_path,
    )
    return vectordb

def get_retriever(vectordb):
    return vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.k_retriever}
    )