# LangchainIA - Aplicacion de Conocimientos sobre Computadoras

## Descripcion del Proyecto

Aplicacion RAG (Retrieval-Augmented Generation) en espanol que responde preguntas sobre computadoras usando datos locales procesados con LangChain, FastAPI y Next.js. Incluye ingesta multi-formato, chat con contexto y panel para configurar proveedores.

### Funcionalidades principales

- **Inicializacion / reindexacion:** `/api/init_embeddings` y `/api/reindex` regeneran el vector store desde archivos configurados.
- **Ingesta incremental:** `/api/upload` acepta TXT, Markdown, PDF, DOC(X) y HTML para sumarlos sin borrar la base.
- **Chat asistido:** Recupera contextos relevantes con Chroma + LLMChainExtractor y responde en espanol.
- **Dashboard web:** tres vistas (Inicio, Herramientas IA, Configuracion) con sidebar fijo.

### Tecnologias

LangChain, ChromaDB, FastAPI, Next.js 16, OpenAI API, Python-dotenv, uvicorn.

## Estructura del Proyecto

```
LangchainIA/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── services/
│   │   │   ├── embeddings_service.py
│   │   │   ├── ingestion_service.py
│   │   │   └── qa_service.py
│   │   └── models/schemas.py
│   ├── data/Informacion_computadoras.txt
│   ├── vector_db/
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx (redirige a /home)
    │   └── (dashboard)/
    │       ├── layout.tsx
    │       ├── home/page.tsx
    │       ├── tools/page.tsx
    │       └── config/page.tsx
    ├── next.config.mjs
    └── package.json
```

## Instalacion y Configuracion

### Backend

```bash
cd LangchainIA/backend
python -m venv .venv
.venv\Scripts\activate  # En Windows
# source .venv/bin/activate  # En Linux/Mac/WSL
pip install -r requirements.txt
```

Crea `backend/.env` (ajusta las rutas según tu entorno; `VECTOR_DB_PATH` debe apuntar a un directorio con permisos de escritura, por ejemplo `/tmp/langchain_vector_db` en Render u otra ruta fuera del repositorio):
```
OPENAI_API_KEY=tu_api_key
MODEL_NAME=gpt-4o-mini
DATA_FILE_PATH=data/Informacion_computadoras.txt
VECTOR_DB_PATH=vector_db/computadoras_embedding_db
```

### Frontend

```bash
cd LangchainIA/frontend
npm install
```

## Ejecucion

- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `npm run dev` (usa `BACKEND_URL` configurado en `frontend/.env.local`)

> **Nota:** en Render u otros hosts con sistema de archivos solo lectura, define `VECTOR_DB_PATH` como `/tmp/computadoras_embedding_db` (u otra carpeta escribible) desde el panel de variables de entorno antes de desplegar. El backend detecta automáticamente si la ruta relativa no es escribible y cae en un directorio temporal, pero es preferible declararlo explícitamente para que los embeddings sean persistentes.

## Uso del Dashboard

1. Visita `http://localhost:3000`. Sidebar muestra:
   - **Inicio (/home):** mensaje de bienvenida.
   - **Herramientas IA (/tools):** chat completo, lista de chats y panel de contexto.
   - **Configuracion (/config):** formulario para API keys por proveedor.
2. En Herramientas IA:
   - Activa “Inicializar DB vectorial” para correr `/api/init_embeddings`.
   - Selecciona proveedor/modelo y crea chats con “+ Nuevo chat”.
   - Pregunta desde el cuadro inferior; se muestra el contexto usado a la derecha.
3. En Configuracion:
   - Ingresa las API keys y presiona **Guardar**. Los valores se almacenan en `backend/.env`.

## APIs principales

- `POST /api/init_embeddings`: reconstruye embeddings base.
- `POST /api/reindex`: ingesta completa de un directorio (parametro `directory` opcional).
- `POST /api/upload`: ingesta incremental via multipart (`files`).
- `POST /api/ask`: pregunta usando el modelo configurado.

## Comandos utiles

```bash
# Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## Tecnologias utilizadas

- **Backend:** Python, FastAPI, LangChain, ChromaDB, OpenAI SDK
- **Frontend:** Next.js 16, TypeScript, React
