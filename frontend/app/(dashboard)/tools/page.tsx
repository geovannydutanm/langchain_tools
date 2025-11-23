"use client"

import { useEffect, useState } from 'react'

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

interface Chat {
  id: string
  title: string
  model: string
  messages: Message[]
}

type ModelInfo = { id: string; owned_by?: string }
type ProviderInfo = { id: string; name: string; configured: boolean; message?: string }

export default function ToolsPage() {
  const [chunksCount, setChunksCount] = useState<number | null>(null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [initChecked, setInitChecked] = useState(false)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [currentModel, setCurrentModel] = useState<string>('')
  const [modelsLoading, setModelsLoading] = useState<boolean>(false)
  const [modelSaving, setModelSaving] = useState<boolean>(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [selectedMessageIndexByChat, setSelectedMessageIndexByChat] = useState<Record<string, number | null>>({})
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [currentProvider, setCurrentProvider] = useState<string>('openai')
  const [providerSaving, setProviderSaving] = useState<boolean>(false)
  const [newApiKeys, setNewApiKeys] = useState<Record<string, string>>({})

  const examplePrompts = [
    '¿Qué es una computadora y cuáles son sus partes esenciales?',
    '¿Cuál es la diferencia entre hardware y software?',
    '¿Qué es la arquitectura de von Neumann?',
    '¿Qué componentes tiene la unidad central de procesamiento (CPU)?',
  ]

  useEffect(() => {
    if (initChecked && chunksCount === null) {
      handleInitEmbeddings()
    }
  }, [initChecked])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs_chats_v1')
      if (raw) {
        const parsed = JSON.parse(raw) as Chat[]
        setChats(parsed)
        if (parsed.length > 0) setCurrentChatId(parsed[0].id)
      }
    } catch {
      console.warn('No chats to restore')
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('cs_chats_v1', JSON.stringify(chats))
    } catch {}
  }, [chats])

  useEffect(() => {
    const load = async () => {
      setModelsLoading(true)
      try {
        let providerId = currentProvider
        try {
          const pres = await fetch('/api/providers')
          const pdata = await pres.json()
          setProviders(pdata.providers || [])
          providerId = pdata.current_provider || providerId || 'openai'
          setCurrentProvider(providerId)
        } catch {}

        const stored = localStorage.getItem('cs_current_model')
        if (stored) {
          try {
            await fetch('/api/settings/model', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: stored }),
            })
          } catch {}
        }

        const res = await fetch(`/api/models?provider=${encodeURIComponent(providerId)}`)
        const data = await res.json()
        setModels(data.models || [])
        const chat = chats.find((c) => c.id === currentChatId)
        setCurrentModel(chat?.model || data.current_model || stored || '')
      } catch (e) {
        console.error('Error loading models', e)
      }
      setModelsLoading(false)
    }
    load()
  }, [currentChatId])

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

  const createNewChat = () => {
    const newChat: Chat = {
      id: Math.random().toString(36).slice(2),
      title: 'Nuevo chat',
      model: currentModel || localStorage.getItem('cs_current_model') || '',
      messages: [],
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setSelectedMessageIndexByChat((prev) => ({ ...prev, [newChat.id]: null }))
    return newChat
  }

  const handleAsk = async () => {
    if (!question.trim()) return
    let chat = chats.find((c) => c.id === currentChatId) || null
    if (!chat) {
      chat = createNewChat()
    }
    if (!chat) return

    const userMessage: Message = { role: 'user', content: question }
    setChats((prev) => prev.map((c) => (c.id === chat!.id ? { ...c, messages: [...c.messages, userMessage] } : c)))
    if (!chat.messages.length) {
      const newTitle = question.slice(0, 40)
      setChats((prev) => prev.map((c) => (c.id === chat!.id ? { ...c, title: newTitle || 'Nuevo chat' } : c)))
    }

    setQuestion('')
    setLoading(true)
    try {
      if (chat.model) {
        try {
          await fetch('/api/settings/model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: chat.model }),
          })
        } catch {}
      }

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data: AskResponse = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.answer, usedChunks: data.used_chunks }
      setChats((prev) =>
        prev.map((c) => (c.id === chat!.id ? { ...c, messages: [...c.messages, assistantMessage] } : c)),
      )
      setSelectedMessageIndexByChat((prev) => ({
        ...prev,
        [chat!.id]: (chats.find((c) => c.id === chat!.id)?.messages.length || 0),
      }))
    } catch (error) {
      console.error('Error asking question:', error)
      const err = error as Error
      const errorMessage: Message = { role: 'assistant', content: 'Error: ' + err.message }
      setChats((prev) => prev.map((c) => (c.id === chat!.id ? { ...c, messages: [...c.messages, errorMessage] } : c)))
    }
    setLoading(false)
  }

  const getContextSourceMessage = (): Message | null => {
    const chat = chats.find((c) => c.id === currentChatId)
    if (!chat) return null
    const idx = selectedMessageIndexByChat[chat.id]
    if (idx !== undefined && idx !== null && chat.messages[idx]) return chat.messages[idx]
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === 'assistant') return chat.messages[i]
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>Herramientas IA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            <input type="checkbox" checked={initChecked} onChange={(e) => setInitChecked(e.target.checked)} disabled={loading} />
            Inicializar DB vectorial
          </label>
          {chunksCount !== null && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>DB: {chunksCount} fragmentos</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Proveedor</span>
            <select
              value={currentProvider}
              onChange={async (e) => {
                const prov = e.target.value
                setCurrentProvider(prov)
                setModelsLoading(true)
                try {
                  const res = await fetch(`/api/models?provider=${encodeURIComponent(prov)}`)
                  const data = await res.json()
                  setModels(data.models || [])
                  setCurrentModel(data.current_model || '')
                } catch (err) {
                  console.error('Error loading models for provider', err)
                }
                setModelsLoading(false)
              }}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 8px', background: '#fff', fontSize: 13 }}
            >
              {(providers.length ? providers : [{ id: 'openai', name: 'OpenAI', configured: true }]).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!p.configured ? ' (configurar)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Modelo</span>
            <select
              value={currentModel}
              onChange={async (e) => {
                const val = e.target.value
                setCurrentModel(val)
                setChats((prev) => prev.map((c) => (c.id === currentChatId ? { ...c, model: val } : c)))
                setModelSaving(true)
                try {
                  await fetch('/api/settings/model', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: val }),
                  })
                  localStorage.setItem('cs_current_model', val)
                } catch (err) {
                  console.error('Error setting model', err)
                }
                setModelSaving(false)
              }}
              disabled={modelsLoading || modelSaving || (models?.length ?? 0) === 0}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '6px 8px',
                background: '#fff',
                fontSize: 13,
                color: '#111827',
              }}
            >
              {modelsLoading && <option>Cargando...</option>}
              {!modelsLoading && models.length === 0 && <option>No disponible</option>}
              {!modelsLoading &&
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: '240px', borderRight: '1px solid #e5e7eb', background: '#f9fafb', padding: 12 }}>
          <button
            onClick={createNewChat}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #2f3037',
              background: '#343541',
              color: '#ececf1',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '8px',
            }}
          >
            + Nuevo chat
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100% - 60px)', overflowY: 'auto' }}>
            {chats.length === 0 && <div style={{ fontSize: 13, color: '#6b7280' }}>No hay chats aún.</div>}
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id)
                  setCurrentModel(chat.model)
                }}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: currentChatId === chat.id ? '#e5e7eb' : '#fff',
                  color: '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 120px 16px' }}>
              {(() => {
                const ch = chats.find((c) => c.id === currentChatId)
                return (ch?.messages.length || 0) === 0 && !loading
              })() && (
                <div style={{ textAlign: 'center', marginTop: '80px' }}>
                  <h2 style={{ margin: 0, color: '#111827' }}>¿En qué puedo ayudarte hoy?</h2>
                  <p style={{ color: '#6b7280', marginTop: '6px' }}>Prueba con una de estas sugerencias</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                    {examplePrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => setQuestion(p)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #eef0f1',
                          background: '#fafafa',
                          cursor: 'pointer',
                          color: '#374151',
                          fontSize: '14px',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(chats.find((c) => c.id === currentChatId)?.messages || []).map((message, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (currentChatId) setSelectedMessageIndexByChat((prev) => ({ ...prev, [currentChatId]: index }))
                  }}
                  style={{ display: 'flex', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '9999px',
                      backgroundColor: message.role === 'user' ? '#10a37f' : '#ececf1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                  >
                    {message.role === 'user' ? 'U' : 'A'}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: message.role === 'user' ? '#f7f7f8' : '#ffffff',
                      border: '1px solid #eef0f1',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: '#111827',
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    {message.role === 'assistant' && (
                      <div
                        style={{
                          marginTop: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: message.usedChunks && message.usedChunks.length > 0 ? '#065f46' : '#6b7280',
                          backgroundColor: message.usedChunks && message.usedChunks.length > 0 ? '#d1fae5' : '#f3f4f6',
                          borderRadius: '999px',
                          padding: '4px 10px',
                        }}
                      >
                        Fuente:{' '}
                        {message.usedChunks && message.usedChunks.length > 0
                          ? 'Conocimiento local'
                          : 'Solo modelo'}
                      </div>
                    )}
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
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '9999px',
                      backgroundColor: '#ececf1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                  >
                    A
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#ffffff',
                      border: '1px solid #eef0f1',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: '#111827',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                      <span>Pensando</span>
                      <div style={{ marginLeft: '10px', display: 'flex' }}>
                        <div
                          style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#6b7280',
                            borderRadius: '50%',
                            margin: '0 2px',
                            animation: 'bounce 1.4s ease-in-out infinite both',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#6b7280',
                            borderRadius: '50%',
                            margin: '0 2px',
                            animation: 'bounce 1.4s ease-in-out 0.16s infinite both',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#6b7280',
                            borderRadius: '50%',
                            margin: '0 2px',
                            animation: 'bounce 1.4s ease-in-out 0.32s infinite both',
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'linear-gradient(to top, #ffffff 60%, rgba(255,255,255,0))',
              borderTop: '1px solid #e5e7eb',
              padding: '16px 12px',
            }}
          >
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '8px 10px',
                  backgroundColor: '#ffffff',
                }}
              >
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAsk()
                    }
                  }}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  style={{
                    flex: 1,
                    minHeight: '24px',
                    maxHeight: '160px',
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: '#111827',
                  }}
                  disabled={loading}
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#11a37f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: loading || !question.trim() ? 0.6 : 1,
                  }}
                >
                  Enviar
                </button>
              </div>
              <div style={{ marginTop: '8px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                La IA puede cometer errores. Verifica la información importante.
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: '360px', borderLeft: '1px solid #eef0f1', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px', borderBottom: '1px solid #eef0f1' }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>Contexto usado</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Selecciona un mensaje para ver detalles</div>
          </div>
          <div style={{ padding: '12px 12px 140px 12px', overflowY: 'auto' }}>
            {(() => {
              const msg = getContextSourceMessage()
              if (!msg || !msg.usedChunks || msg.usedChunks.length === 0) {
                return <div style={{ color: '#6b7280', fontSize: '14px' }}>No hay contexto disponible aún.</div>
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {msg.usedChunks.map((chunk) => (
                    <div key={chunk.id} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Fragmento {chunk.id}</div>
                      <div style={{ color: '#374151', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{chunk.content_preview}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
