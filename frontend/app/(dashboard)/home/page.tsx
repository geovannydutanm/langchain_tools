"use client"

export default function HomePage() {
  return (
    <div style={{ padding: '48px', maxWidth: '960px' }}>
      <h1 style={{ color: '#111827', marginTop: 0 }}>Bienvenido a Langchain Tools</h1>
      <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#4b5563' }}>
        Esta aplicación utiliza inteligencia artificial para responder preguntas sobre computadoras basándose
        en un documento de conocimientos. Selecciona &quot;Herramientas IA&quot; en el menú para comenzar a chatear
        o &quot;Configuración&quot; para actualizar tus API keys.
      </p>
    </div>
  )
}
