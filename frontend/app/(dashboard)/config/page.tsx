"use client"

import { useEffect, useState } from 'react'

type ProviderInfo = { id: string; name: string; configured: boolean; message?: string }

export default function ConfigPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [newApiKeys, setNewApiKeys] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProviders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/providers')
      const data = await res.json()
      setProviders(data.providers || [])
    } catch (err) {
      console.error('No se pudieron cargar los proveedores', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProviders()
  }, [])

  const handleSave = async (providerId: string) => {
    const key = (newApiKeys[providerId] || '').trim()
    if (!key) return
    setSaving(true)
    try {
      await fetch('/api/settings/provider-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, api_key: key }),
      })
      await loadProviders()
      setNewApiKeys((prev) => ({ ...prev, [providerId]: '' }))
    } catch (err) {
      console.error('No se pudo guardar la clave', err)
    }
    setSaving(false)
  }

  const providersList =
    providers.length > 0
      ? providers
      : [
          { id: 'openai', name: 'OpenAI', configured: false, message: 'Falta API key' },
          { id: 'anthropic', name: 'Anthropic', configured: false, message: 'Falta API key' },
          { id: 'google', name: 'Google (Gemini)', configured: false, message: 'Falta API key' },
          { id: 'xai', name: 'xAI (Grok)', configured: false, message: 'Falta API key' },
          { id: 'minimax', name: 'MiniMax', configured: false, message: 'Falta API key' },
        ]

  return (
    <div style={{ padding: '32px 24px', width: '100%', maxWidth: '960px' }}>
      <h2 style={{ marginTop: 0 }}>Configuración de Proveedores</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Agrega o actualiza tus API keys. Los proveedores sin clave mostrarán &quot;por configurar&quot;.
      </p>
      {loading && <div style={{ marginBottom: '16px', color: '#6b7280' }}>Cargando proveedores...</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {providersList.map((provider) => (
          <div
            key={provider.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{provider.name}</div>
                <div style={{ fontSize: 12, color: provider.configured ? '#10b981' : '#ef4444' }}>
                  {provider.configured ? 'Configurado' : provider.message || 'Por configurar'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                placeholder={`Pega tu ${provider.name} API key`}
                value={newApiKeys[provider.id] || ''}
                onChange={(e) => setNewApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}
              />
              <button
                onClick={() => handleSave(provider.id)}
                disabled={saving}
                style={{
                  border: '1px solid #10a37f',
                  background: '#10a37f',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
