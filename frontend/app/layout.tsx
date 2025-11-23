export const metadata = {
  title: 'Tools IA',
  description: 'Aplicación de conocimientos sobre computadoras con IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning={true}
        style={{
          margin: 0,
          padding: 0,
          fontFamily: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, \n          Ubuntu, Cantarell, Helvetica Neue, sans-serif`,
          backgroundColor: '#f7f7f8',
          color: '#111827',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
        <footer style={{
          marginTop: 'auto',
          padding: '10px',
          textAlign: 'center',
          backgroundColor: '#87ceeb',
          color: '#fff'
        }}>
          {/*
          <a
            href="https://corporacionsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            By Corporación Soft
          </a>*/}
        </footer>
      </body>
    </html>
  )
}
