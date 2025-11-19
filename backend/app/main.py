from fastapi import FastAPI
from app.services.embeddings_service import create_embeddings
from app.services.qa_service import ask_question
from app.models.schemas import InitEmbeddingsResponse, AskRequest, AskResponse

app = FastAPI()

@app.post("/api/init_embeddings", response_model=InitEmbeddingsResponse)
async def init_embeddings():
    chunks_count = create_embeddings()
    return InitEmbeddingsResponse(status="ok", chunks_count=chunks_count)

@app.post("/api/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    answer, used_chunks = ask_question(request.question)
    return AskResponse(answer=answer, used_chunks=used_chunks)