"use client"

import { useState, useEffect } from 'react'

interface UsedChunk {
  id: string
  content_preview: string
}

interface AskResponse {
  answer: string
  used_chunks: UsedChunk[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  usedChunks?: UsedChunk[]
}

export default function Home() {
  const [chunksCount, setChunksCount] = useState<number | null>(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')
  const [initChecked, setInitChecked] = useState(false)
  const examplePrompts = [
    '¿Qué computadora recomiendas para diseño gráfico?',
    '¿Cuál es la diferencia entre SSD y HDD?',
    '¿Cómo elegir la RAM adecuada?',
    '¿Qué es una GPU y para qué sirve?',
  ]

  useEffect(() => {
    if (initChecked && chunksCount === null) {
      handleInitEmbeddings()
    }
  }, [initChecked])

  const handleInitEmbeddings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/init_embeddings', {
        method: 'POST',
      })
      const data = await response.json()
      setChunksCount(data.chunks_count)
    } catch (error) {
      console.error('Error initializing embeddings:', error)
    }
    setLoading(false)
  }

  const handleAsk = async () => {
    if (!question) return
    const userMessage: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setLoading(true)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage.content }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data: AskResponse = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.answer, usedChunks: data.used_chunks }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error asking question:', error)
      const err = error as Error
      const errorMessage: Message = { role: 'assistant', content: 'Error: ' + err.message }
      setMessages(prev => [...prev, errorMessage])
    }
    setLoading(false)
  }

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: '🏠' },
    { id: 'herramientas', label: 'Herramientas IA', icon: '🤖' },
  ]

  return (
    <>
      <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          .sidebar-btn { transition: background-color .15s ease, color .15s ease; }
          .sidebar-btn:hover { background-color: #2a2b32; color: #e3e3e8; }
          .prompt-chip { transition: background-color .15s ease, border-color .15s ease; }
          .prompt-chip:hover { background-color: #f3f4f6; border-color: #e5e7eb; }
          .send-btn { transition: opacity .15s ease, background-color .15s ease; }
          .send-btn:hover { background-color: #10a37f; }
        `}</style>
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f7f7f8' }}>
        {/* Sidebar */}
        <div style={{
          width: '260px',
          backgroundColor: '#202123',
          color: '#ececf1',
          borderRight: '1px solid #2f3037',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 8px', border: '1px solid #2f3037', borderRadius: '8px', marginBottom: '8px',
            backgroundColor: '#171717'
          }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Corporación Soft</span>
            <span style={{ opacity: 0.8, fontSize: '12px' }}>IA</span>
          </div>
          <button
            className="sidebar-btn"
            onClick={() => { setMessages([]); setActiveSection('herramientas') }}
            style={{
              padding: '10px 12px', borderRadius: '8px', border: '1px solid #2f3037', background: '#343541',
              color: '#ececf1', textAlign: 'left', cursor: 'pointer', fontSize: '14px', marginBottom: '8px'
            }}
          >+ Nuevo chat</button>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="sidebar-btn"
                style={{
                  display: 'flex', alignItems: 'center', padding: '8px 10px', border: '1px solid #2f3037',
                  borderRadius: '8px', backgroundColor: activeSection === item.id ? '#2a2b32' : 'transparent',
                  color: '#ececf1', cursor: 'pointer', fontSize: '14px'
                }}
              >
                <span style={{ marginRight: '10px' }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          {activeSection === 'inicio' && (
            <div style={{ padding: '32px' }}>
              <h1 style={{ color: '#111827', marginTop: 0 }}>Bienvenido a Corporación Soft</h1>
              <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#4b5563' }}>
                Esta aplicación utiliza inteligencia artificial para responder preguntas sobre computadoras
                basándose en un documento de conocimientos. Selecciona "Herramientas IA" en el menú para comenzar.
              </p>
            </div>
          )}

          {activeSection === 'herramientas' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Top bar */}
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Herramientas IA</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Chat estilo ChatGPT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                    <input type="checkbox" checked={initChecked} onChange={(e) => setInitChecked(e.target.checked)} disabled={loading} />
                    Inicializar DB vectorial
                  </label>
                  {chunksCount !== null && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>DB: {chunksCount} fragmentos</span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 120px 16px' }}>
                  {messages.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', marginTop: '80px' }}>
                      <h2 style={{ margin: 0, color: '#111827' }}>¿En qué puedo ayudarte hoy?</h2>
                      <p style={{ color: '#6b7280', marginTop: '6px' }}>Prueba con una de estas sugerencias</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                        {examplePrompts.map((p) => (
                          <button
                            key={p}
                            className="prompt-chip"
                            onClick={() => setQuestion(p)}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #eef0f1', background: '#fafafa', cursor: 'pointer', color: '#374151', fontSize: '14px' }}
                          >{p}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '9999px',
                        backgroundColor: message.role === 'user' ? '#10a37f' : '#ececf1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                      }}>{message.role === 'user' ? '🧑' : '🤖'}</div>
                      <div style={{
                        flex: 1, backgroundColor: message.role === 'user' ? '#f7f7f8' : '#ffffff', border: '1px solid #eef0f1',
                        borderRadius: '12px', padding: '12px 14px', color: '#111827', lineHeight: 1.6
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                        {message.usedChunks && message.usedChunks.length > 0 && (
                          <details style={{ marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>Ver contexto utilizado</summary>
                            <ul style={{ margin: '8px 0 0 16px', color: '#374151', fontSize: '14px' }}>
                              {message.usedChunks.slice(0, 3).map((chunk) => (
                                <li key={chunk.id}>{chunk.content_preview.substring(0, 120)}...</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '9999px', backgroundColor: '#ececf1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                      <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #eef0f1', borderRadius: '12px', padding: '12px 14px', color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                          <span>Pensando</span>
                          <div style={{ marginLeft: '10px', display: 'flex' }}>
                            <div style={{ width: '4px', height: '4px', backgroundColor: '#6b7280', borderRadius: '50%', margin: '0 2px', animation: 'bounce 1.4s ease-in-out infinite both' }}></div>
                            <div style={{ width: '4px', height: '4px', backgroundColor: '#6b7280', borderRadius: '50%', margin: '0 2px', animation: 'bounce 1.4s ease-in-out 0.16s infinite both' }}></div>
                            <div style={{ width: '4px', height: '4px', backgroundColor: '#6b7280', borderRadius: '50%', margin: '0 2px', animation: 'bounce 1.4s ease-in-out 0.32s infinite both' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Composer */}
              <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #ffffff 60%, rgba(255,255,255,0))', borderTop: '1px solid #e5e7eb', padding: '16px 12px' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '8px 10px', backgroundColor: '#ffffff' }}>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                      placeholder="Escribe tu mensaje..."
                      rows={1}
                      style={{ flex: 1, minHeight: '24px', maxHeight: '160px', resize: 'none', border: 'none', outline: 'none', fontSize: '15px', lineHeight: 1.5, color: '#111827' }}
                      disabled={loading}
                    />
                    <button
                      onClick={handleAsk}
                      disabled={loading || !question.trim()}
                      className="send-btn"
                      style={{ padding: '10px 14px', backgroundColor: '#11a37f', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', opacity: loading || !question.trim() ? 0.6 : 1 }}
                    >Enviar</button>
                  </div>
                  <div style={{ marginTop: '8px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                    La IA puede cometer errores. Verifica la información importante.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

