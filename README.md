# LangchainIA - Aplicación de Conocimientos sobre Computadoras

## Descripción del Proyecto

Esta aplicación es un sistema de preguntas y respuestas (Q&A) basado en Retrieval-Augmented Generation (RAG) que permite a los usuarios hacer preguntas sobre computadoras y obtener respuestas precisas en español, basadas en un documento de texto informativo.

### Funcionalidades Principales

- **Inicialización de Base de Datos Vectorial:** Carga un archivo de texto sobre computadoras, lo divide en chunks, genera embeddings usando OpenAI y los almacena en un vector store persistente con ChromaDB.
- **Respuestas a Preguntas:** Utiliza un retriever comprimido con LLM para recuperar información relevante del documento y generar respuestas coherentes y contextuales.
- **Interfaz Web Simple:** Una interfaz de usuario en Next.js que permite inicializar la base de datos y hacer preguntas de manera intuitiva.

### Tecnologías y Conceptos

- **LangChain:** Framework para construir aplicaciones con LLMs, utilizado para el procesamiento de texto, embeddings y RAG.
- **ChromaDB:** Base de datos vectorial persistente para almacenar embeddings.
- **OpenAI Embeddings y ChatGPT:** Para generar representaciones vectoriales del texto y responder preguntas.
- **FastAPI:** Framework web asíncrono para el backend en Python.
- **Next.js:** Framework React para el frontend con TypeScript.
- **Compresión de Contexto:** Utiliza LLMChainExtractor para reducir el contexto recuperado antes de generar la respuesta final.

El proyecto demuestra el uso práctico de técnicas de IA modernas para crear sistemas de información inteligentes y accesibles.

## Estructura del Proyecto

```
LangchainIA/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── services/
│   │   │   ├── embeddings_service.py
│   │   │   ├── vectorstore_service.py
│   │   │   └── qa_service.py
│   │   └── models/
│   │       └── schemas.py
│   ├── data/
│   │   └── Información_computadoras.txt
│   ├── vector_db/
│   ├── .env
│   ├── requirements.txt
│   └── venv/  # Entorno virtual
└── frontend/
    ├── package.json
    ├── next.config.mjs
    └── app/
        └── page.tsx
```

## Instalación y Configuración

### Backend

1. Navega al directorio backend:
   ```bash
   cd LangchainIA/backend
   ```

2. Crea el entorno virtual (si no existe):
   ```bash
   python3 -m venv venv
   ```

3. Activa el entorno virtual:
   - En Windows (CMD): `venv\Scripts\activate`
   - En Linux/Mac/WSL: `source venv/bin/activate`

4. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Configura las variables de entorno en `.env`:
   ```
   OPENAI_API_KEY=tu_clave_de_openai_aqui
   MODEL_NAME=gpt-4o-mini
   ```

### Frontend

1. Navega al directorio frontend:
   ```bash
   cd LangchainIA/frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## Ejecución

### Backend

Desde el directorio `LangchainIA/backend` con el entorno virtual activado:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

Desde el directorio `LangchainIA/frontend`:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000` y el backend en `http://localhost:8000`.

## Uso

1. Abre el frontend en tu navegador.
2. Haz clic en "Initialize Vector DB" para cargar y procesar el documento.
3. Una vez inicializado, puedes hacer preguntas en el campo de texto y obtener respuestas basadas en el contenido del documento.

## APIs

### POST /api/init_embeddings
Inicializa el vector store con embeddings del documento.

**Respuesta:**
```json
{
  "status": "ok",
  "chunks_count": 123
}
```

### POST /api/ask
Responde a una pregunta usando RAG comprimido.

**Cuerpo de la solicitud:**
```json
{
  "question": "¿Qué es el sistema operativo?"
}
```

**Respuesta:**
```json
{
  "answer": "El sistema operativo es el programa que gestiona...",
  "used_chunks": [
    {
      "id": "doc_0",
      "content_preview": "El sistema operativo es..."
    }
  ]
}
```

## Comandos para Ejecutar

### Backend
```bash
cd LangchainIA/backend
python3 -m venv venv
source venv/bin/activate  # En WSL/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd LangchainIA/frontend
npm install
npm run dev
```

## Tecnologías Utilizadas

- **Backend:** Python, FastAPI, LangChain, ChromaDB, OpenAI
- **Frontend:** Next.js, TypeScript, React