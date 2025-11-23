from pydantic_settings import BaseSettings
from pathlib import Path
import os
import tempfile

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

    def resolve_paths(self) -> None:
        self.vector_db_path = self._ensure_writable_dir(self.vector_db_path)

    @staticmethod
    def _ensure_writable_dir(path_str: str) -> str:
        path = Path(path_str)
        if not path.is_absolute():
            base = Path(__file__).resolve().parents[1]
            path = (base / path).resolve()
        try:
            path.mkdir(parents=True, exist_ok=True)
            probe = path / ".write_test"
            probe.write_text("ok", encoding="utf-8")
            probe.unlink(missing_ok=True)
            return str(path)
        except OSError:
            fallback = Path(
                os.getenv("VECTOR_DB_FALLBACK", Path(tempfile.gettempdir()) / "langchain_vector_db")
            )
            fallback.mkdir(parents=True, exist_ok=True)
            return str(fallback)

settings = Settings()
settings.resolve_paths()
