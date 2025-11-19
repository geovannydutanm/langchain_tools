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
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, \n          Ubuntu, Cantarell, Helvetica Neue, sans-serif`,
        backgroundColor: '#f7f7f8',
        color: '#111827'
      }}>
        {children}
      </body>
    </html>
  )
}
