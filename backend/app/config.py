from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Provider API keys (optional)
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
    xai_api_key: str | None = None
    minimax_api_key: str | None = None

    # Active provider/model
    provider: str = "openai"
    model_name: str = "gpt-4o-mini"
    data_file_path: str = "data/Información_computadoras.txt"
    vector_db_path: str = "vector_db/computadoras_embedding_db"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    k_retriever: int = 5

    class Config:
        env_file = ".env"

settings = Settings()
