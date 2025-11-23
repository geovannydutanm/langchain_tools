from pydantic import BaseModel
from typing import List, Optional

class InitEmbeddingsResponse(BaseModel):
    status: str
    chunks_count: int

class AskRequest(BaseModel):
    question: str

class UsedChunk(BaseModel):
    id: str
    content_preview: str

class AskResponse(BaseModel):
    answer: str
    used_chunks: List[UsedChunk]

class ModelInfo(BaseModel):
    id: str
    owned_by: Optional[str] = None

class ModelsResponse(BaseModel):
    current_model: str
    models: List[ModelInfo]

class UpdateModelRequest(BaseModel):
    model: str

class UpdateModelResponse(BaseModel):
    status: str
    current_model: str

# Providers
class ProviderInfo(BaseModel):
    id: str
    name: str
    configured: bool
    message: Optional[str] = None

class ProvidersResponse(BaseModel):
    providers: List[ProviderInfo]
    current_provider: str

class UpdateProviderKeyRequest(BaseModel):
    provider: str
    api_key: str

class UpdateProviderKeyResponse(BaseModel):
    status: str
    provider: str


class ReindexRequest(BaseModel):
    directory: Optional[str] = None


class IngestResponse(BaseModel):
    status: str
    chunks_count: int
    documents_ingested: int
    sources: List[str]
