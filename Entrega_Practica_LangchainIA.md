# Entrega - Proyecto Final LangChain IA

Autor: Nelson Geovany Dutan Mainato
Curso: Desarrolla Aplicaciones de IA Avanzadas con Langchain y LLM en Python
Repositorio: https://github.com/geovannydutanm/langchain_tools
Sitio Web: https://langchain-tools.vercel.app/tools

---

## 1. Contexto del proyecto

La práctica consiste en cargar el documento `Información_computadoras.txt`, trocearlo mediante LangChain, generar embeddings con OpenAI y construir una base vectorial persistente en Chroma para responder preguntas. La aplicación completa (backend FastAPI + frontend Next.js) está disponible en el repositorio enlazado.

---

## 2. Importación de librerías y carga del documento

Fragmento de código utilizado (`backend/app/services/ingestion_service.py`):

```python
from pathlib import Path
from langchain_community.document_loaders import TextLoader

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
```

Se ejecuta pasando `settings.data_file_path` (configurado como `data/Informacion_computadoras.txt`), lo que garantiza la lectura del archivo original.

---

## 3. División en fragmentos y creación de embeddings

Código (`backend/app/services/ingestion_service.py`):

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

def _split_documents(docs, chunk_size, chunk_overlap):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    texts, metadatas = [], []
    for doc in docs:
        meta = dict(doc.metadata)
        meta.setdefault("source", meta.get("source", "unknown"))
        for chunk in splitter.split_text(doc.page_content):
            texts.append(chunk)
            metadatas.append(meta.copy())
    return texts, metadatas

embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
```

Estos fragmentos generan los “chunks” utilizados para la base vectorial y llaman a la API de OpenAI para convertirlos en vectores.

---

## 4. Creación del almacén `computadoras_embedding_db`

Código clave (`backend/app/services/ingestion_service.py`):

```python
if reset or not persist_path.exists():
    shutil.rmtree(persist_directory, ignore_errors=True)
    Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        persist_directory=persist_directory,
    )
```

El directorio `persist_directory` está definido en `backend/app/config.py` como `vector_db/computadoras_embedding_db`, cumpliendo el requerimiento del enunciado.

---

## 5. Consulta optimizada con compresores

Código (`backend/app/services/qa_service.py`):

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_openai import ChatOpenAI

def ask_question(question: str):
    vectordb = load_vectorstore()
    base_retriever = get_retriever(vectordb)
    llm = ChatOpenAI(model=settings.model_name, openai_api_key=settings.openai_api_key)
    compressor = LLMChainExtractor.from_llm(llm)
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever,
    )
    compressed_docs = compression_retriever.invoke(question)
    answer = llm.invoke(prompt).content
    return answer, used_chunks
```

Para responder “¿qué es el sistema operativo?” se llama:

```python
respuesta, contexto = ask_question("¿qué es el sistema operativo?")
```

La función devuelve la respuesta en español y los fragmentos usados para justificarla.

---

## 6. Evidencias adicionales

- Inicialización de embeddings desde FastAPI (`POST /api/init_embeddings`), implementada en `backend/app/main.py`.
- Frontend en Next.js con rutas `/home`, `/tools` y `/config` que permiten ejecutar todo el flujo desde navegador.

---

## 7. Conclusión

El proyecto cumple con los requisitos del enunciado: carga y procesamiento de `Información_computadoras.txt`, creación del vector store persistente `computadoras_embedding_db` y consulta optimizada mediante compresión contextual. El repositorio GitHub (ver enlace arriba) contiene el código completo y puede utilizarse para revisar, ejecutar o evaluar la práctica.
