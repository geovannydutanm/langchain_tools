from pydantic import BaseModel
from typing import List

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