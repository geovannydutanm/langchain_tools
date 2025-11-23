from fastapi import FastAPI, HTTPException, UploadFile, File
from app.services.embeddings_service import create_embeddings
from app.services.qa_service import ask_question
from app.models.schemas import (
    InitEmbeddingsResponse,
    AskRequest,
    AskResponse,
    ModelsResponse,
    ModelInfo,
    UpdateModelRequest,
    UpdateModelResponse,
    ProviderInfo,
    ProvidersResponse,
    UpdateProviderKeyRequest,
    UpdateProviderKeyResponse,
    ReindexRequest,
    IngestResponse,
)
from app.config import settings
from app.services.ingestion_service import ingest_documents
from typing import List
import re
import os
import tempfile

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

app = FastAPI()

# Keep current provider/model in-memory; seeded from env/config
current_model = settings.model_name
current_provider = getattr(settings, "provider", "openai")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Langchain Tools API en ejecución. Usa /docs para explorar los endpoints."
    }

@app.post("/api/init_embeddings", response_model=InitEmbeddingsResponse)
async def init_embeddings():
    chunks_count = create_embeddings()
    return InitEmbeddingsResponse(status="ok", chunks_count=chunks_count)

@app.post("/api/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    answer, used_chunks = ask_question(request.question)
    return AskResponse(answer=answer, used_chunks=used_chunks)


def _filter_chat_models(model_ids: List[str]) -> List[str]:
    """Heurística sin prefijos fijos para modelos de chat.

    Incluye IDs que parecen de conversación (familias gpt-*, o*) y excluye
    embeddings/audio/moderation/clásicos instruct. No depende de una lista cerrada
    de prefijos como "gpt-4o", "gpt-4.1", etc.
    """
    include_re = re.compile(r"^(gpt-|o\d)", re.IGNORECASE)
    exclude_substrings = (
        "embedding",
        "whisper",
        "audio",
        "tts",
        "image",
        "dall",
        "clip",
        "moderation",
        "edits",
        "instruct",
        "davinci",
        "babbage",
        "curie",
        "ada",
    )
    out: List[str] = []
    for mid in model_ids:
        if include_re.match(mid) and not any(x in mid for x in exclude_substrings):
            out.append(mid)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for m in out:
        if m not in seen:
            seen.add(m)
            unique.append(m)
    return unique


@app.get("/api/models", response_model=ModelsResponse)
async def list_models(provider: str | None = None):
    global current_model, current_provider
    provider = provider or current_provider or "openai"
    default_list = [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4.1",
        "gpt-4.1-mini",
    ]
    models: List[ModelInfo] = []
    try:
        if provider == "openai":
            if OpenAI is None or not settings.openai_api_key:
                raise RuntimeError("OpenAI no configurado")
            client = OpenAI(api_key=settings.openai_api_key)
            result = client.models.list()
            ids = [m.id for m in getattr(result, "data", [])]
            filtered = _filter_chat_models(ids) or default_list
            models = [ModelInfo(id=m) for m in filtered]
        else:
            # Curated fallbacks for other providers (until SDK listing is added)
            curated: dict[str, List[str]] = {
                "anthropic": ["claude-3-5-sonnet", "claude-3-5-haiku"],
                "google": ["gemini-2.0-pro", "gemini-1.5-pro"],
                "xai": ["grok-2", "grok-beta"],
                "minimax": ["minimax-abliter-m2"],
            }
            models = [ModelInfo(id=m) for m in curated.get(provider, [])]
    except Exception:
        # Fallback to a safe default list if listing fails
        if provider == "openai":
            models = [ModelInfo(id=m) for m in default_list]
        else:
            models = []
    return ModelsResponse(current_model=current_model, models=models)


@app.post("/api/settings/model", response_model=UpdateModelResponse)
async def update_model(request: UpdateModelRequest):
    global current_model
    new_model = request.model.strip()
    if not new_model:
        raise HTTPException(status_code=400, detail="Model cannot be empty")
    # Update in-memory and settings used by services
    current_model = new_model
    settings.model_name = new_model  # type: ignore[attr-defined]
    return UpdateModelResponse(status="ok", current_model=current_model)


@app.get("/api/providers", response_model=ProvidersResponse)
async def providers_status():
    global current_provider
    provs: List[ProviderInfo] = []
    provs.append(ProviderInfo(id="openai", name="OpenAI", configured=bool(settings.openai_api_key), message=None if settings.openai_api_key else "Falta API key"))
    provs.append(ProviderInfo(id="anthropic", name="Anthropic", configured=bool(getattr(settings, 'anthropic_api_key', None)), message=None if getattr(settings, 'anthropic_api_key', None) else "Falta API key"))
    provs.append(ProviderInfo(id="google", name="Google (Gemini)", configured=bool(getattr(settings, 'google_api_key', None)), message=None if getattr(settings, 'google_api_key', None) else "Falta API key"))
    provs.append(ProviderInfo(id="xai", name="xAI (Grok)", configured=bool(getattr(settings, 'xai_api_key', None)), message=None if getattr(settings, 'xai_api_key', None) else "Falta API key"))
    provs.append(ProviderInfo(id="minimax", name="MiniMax", configured=bool(getattr(settings, 'minimax_api_key', None)), message=None if getattr(settings, 'minimax_api_key', None) else "Falta API key"))
    return ProvidersResponse(providers=provs, current_provider=current_provider)


@app.post("/api/settings/provider-key", response_model=UpdateProviderKeyResponse)
async def update_provider_key(req: UpdateProviderKeyRequest):
    provider = req.provider.lower()
    env_map = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "google": "GOOGLE_API_KEY",
        "xai": "XAI_API_KEY",
        "minimax": "MINIMAX_API_KEY",
    }
    if provider not in env_map:
        raise HTTPException(status_code=400, detail="Proveedor no soportado")
    var = env_map[provider]
    api_key = req.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key vacía")

    # Update backend/.env in-place
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    # Read current
    content = ""
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
    lines = content.splitlines() if content else []
    found = False
    new_lines: List[str] = []
    for line in lines:
        if line.startswith(var + "="):
            new_lines.append(f"{var}={api_key}")
            found = True
        else:
            new_lines.append(line)
    if not found:
        new_lines.append(f"{var}={api_key}")
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("\n".join(new_lines) + "\n")

    # Reflect into settings/current process
    os.environ[var] = api_key
    setattr(settings, f"{provider}_api_key", api_key)
    return UpdateProviderKeyResponse(status="ok", provider=provider)


@app.post("/api/reindex", response_model=IngestResponse)
async def reindex_documents(request: ReindexRequest | None = None):
    directory = request.directory if request and request.directory else settings.data_file_path
    if not os.path.exists(directory):
        raise HTTPException(status_code=404, detail=f"Ruta no encontrada: {directory}")

    try:
        chunks, docs, sources = ingest_documents(
            sources=[directory],
            persist_directory=settings.vector_db_path,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            openai_api_key=settings.openai_api_key,
            reset=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return IngestResponse(status="ok", chunks_count=chunks, documents_ingested=docs, sources=sources)


@app.post("/api/upload", response_model=IngestResponse)
async def upload_documents(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    with tempfile.TemporaryDirectory() as tmpdir:
        paths: List[str] = []
        for upload in files:
            filename = upload.filename or "documento"
            safe_name = re.sub(r"[^A-Za-z0-9_.-]", "_", filename)
            dest = os.path.join(tmpdir, safe_name)
            contents = await upload.read()
            with open(dest, "wb") as f:
                f.write(contents)
            paths.append(dest)

        try:
            chunks, docs, sources = ingest_documents(
                sources=paths,
                persist_directory=settings.vector_db_path,
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap,
                openai_api_key=settings.openai_api_key,
                reset=not os.path.exists(settings.vector_db_path),
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    return IngestResponse(status="ok", chunks_count=chunks, documents_ingested=docs, sources=sources)
