from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Sequence, Tuple
import shutil

from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
    BSHTMLLoader,
)

SUPPORTED_SUFFIXES = {
    ".txt": "text",
    ".md": "text",
    ".markdown": "text",
    ".pdf": "pdf",
    ".docx": "docx",
    ".doc": "doc",
    ".html": "html",
    ".htm": "html",
}


def _iter_candidate_files(path: Path) -> Iterable[Path]:
    if path.is_file():
        yield path
        return
    for file in path.rglob("*"):
        if file.is_file():
            yield file


def _load_single_file(file_path: Path) -> List[Document]:
    suffix = file_path.suffix.lower()
    loader = None
    if suffix in {".txt", ".md", ".markdown"}:
        loader = TextLoader(str(file_path), encoding="utf-8")
    elif suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
    elif suffix in {".doc", ".docx"}:
        loader = Docx2txtLoader(str(file_path))
    elif suffix in {".html", ".htm"}:
        loader = BSHTMLLoader(str(file_path))

    if loader is None:
        return []

    docs = loader.load()
    for doc in docs:
        doc.metadata.setdefault("source", str(file_path))
    return docs


def load_documents_from_sources(sources: Sequence[str]) -> List[Document]:
    documents: List[Document] = []
    for src in sources:
        path = Path(src).expanduser().resolve()
        if not path.exists():
            continue
        for file_path in _iter_candidate_files(path):
            if file_path.suffix.lower() not in SUPPORTED_SUFFIXES:
                continue
            documents.extend(_load_single_file(file_path))
    return documents


def _split_documents(docs: Sequence[Document], chunk_size: int, chunk_overlap: int) -> Tuple[List[str], List[dict]]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    texts: List[str] = []
    metadatas: List[dict] = []
    for doc in docs:
        meta = dict(doc.metadata)
        meta.setdefault("source", meta.get("source", "unknown"))
        for chunk in splitter.split_text(doc.page_content):
            texts.append(chunk)
            metadatas.append(meta.copy())
    return texts, metadatas


def ingest_documents(
    sources: Sequence[str],
    persist_directory: str,
    chunk_size: int,
    chunk_overlap: int,
    openai_api_key: str,
    reset: bool = False,
) -> Tuple[int, int, List[str]]:
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY no configurada")

    documents = load_documents_from_sources(sources)
    if not documents:
        raise ValueError("No se encontraron documentos soportados para procesar")

    texts, metadatas = _split_documents(documents, chunk_size, chunk_overlap)
    if not texts:
        raise ValueError("No se pudieron generar fragmentos para los documentos proporcionados")

    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

    persist_path = Path(persist_directory)

    if reset or not persist_path.exists():
        shutil.rmtree(persist_directory, ignore_errors=True)
        Chroma.from_texts(
            texts=texts,
            embedding=embeddings,
            metadatas=metadatas,
            persist_directory=persist_directory,
        )
    else:
        vectordb = Chroma(
            embedding_function=embeddings,
            persist_directory=persist_directory,
        )
        vectordb.add_texts(texts=texts, metadatas=metadatas)

    unique_sources = sorted({meta.get("source", "unknown") for meta in metadatas})
    return len(texts), len(documents), unique_sources
