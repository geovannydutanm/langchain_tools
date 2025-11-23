'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const menuItems = [
  { id: 'home', label: 'Inicio', href: '/home', icon: '🏠' },
  { id: 'tools', label: 'Herramientas IA', href: '/tools', icon: '🤖' },
  { id: 'config', label: 'Configuración', href: '/config', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 50px)' }}>
      <aside
        style={{
          width: '260px',
          backgroundColor: '#202123',
          color: '#ececf1',
          borderRight: '1px solid #2f3037',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            border: '1px solid #2f3037',
            borderRadius: '8px',
            marginBottom: '8px',
            backgroundColor: '#171717',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Langchain Tools</span>
          <span style={{ opacity: 0.8, fontSize: '12px' }}>IA</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {menuItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #2f3037',
                  backgroundColor: active ? '#2a2b32' : 'transparent',
                  color: '#ececf1',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>
      <main style={{ flex: 1, backgroundColor: '#ffffff' }}>{children}</main>
    </div>
  )
}
